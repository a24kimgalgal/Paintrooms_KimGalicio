const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

function normalizeRoomName(roomName) {
  return String(roomName || '').trim();
}

function getRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      members: [],
      strokes: [],
      inProgress: {},
    });
  }

  return rooms.get(roomName);
}

function getRoomList() {
  return Array.from(rooms.entries())
    .map(([name, room]) => ({
      name,
      users: room.members.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function emitRoomState(roomName) {
  const room = rooms.get(roomName);

  if (!room) {
    return;
  }

  const users = room.members.map((member) => ({
    username: member.username,
    x: member.x ?? 0,
    y: member.y ?? 0,
  }));

  io.to(roomName).emit('room_users', users);
  io.to(roomName).emit('room_state', room.strokes);
  io.emit('room_list', getRoomList());
}

function leaveRoom(socket) {
  const previousRoom = socket.data.roomName;

  if (!previousRoom) {
    return;
  }

  const room = rooms.get(previousRoom);

  if (!room) {
    socket.data.roomName = null;
    socket.data.username = null;
    return;
  }

  room.members = room.members.filter((member) => member.socketId !== socket.id);
  delete room.inProgress[socket.id];

  socket.leave(previousRoom);

  if (room.members.length === 0) {
    rooms.delete(previousRoom);
  } else {
    emitRoomState(previousRoom);
  }

  socket.data.roomName = null;
  socket.data.username = null;
}

io.on('connection', (socket) => {
  socket.emit('room_list', getRoomList());

  socket.on('join_room', ({ roomName, username }) => {
    const safeRoomName = normalizeRoomName(roomName);
    const safeUsername = String(username || '').trim();

    if (!safeRoomName) {
      socket.emit('error_message', 'El nombre de la sala no puede estar vacío.');
      return;
    }

    if (!safeUsername) {
      socket.emit('error_message', 'El nombre de usuario no puede estar vacío.');
      return;
    }

    if (socket.data.roomName && socket.data.roomName !== safeRoomName) {
      leaveRoom(socket);
    }

    const room = getRoom(safeRoomName);

    socket.join(safeRoomName);

    const existingMember = room.members.find((member) => member.socketId === socket.id);

    if (existingMember) {
      existingMember.username = safeUsername;
    } else {
      room.members.push({
        socketId: socket.id,
        username: safeUsername,
        x: 0,
        y: 0,
      });
    }

    socket.data.roomName = safeRoomName;
    socket.data.username = safeUsername;

    socket.emit('room_joined', { roomName: safeRoomName });
    socket.emit('room_state', room.strokes);
    emitRoomState(safeRoomName);
  });

  socket.on('cursor_move', ({ x, y }) => {
    const roomName = socket.data.roomName;

    if (!roomName) {
      return;
    }

    const room = getRoom(roomName);
    const member = room.members.find((item) => item.socketId === socket.id);

    if (!member) {
      return;
    }

    const safeX = Number(x) || 0;
    const safeY = Number(y) || 0;

    member.x = safeX;
    member.y = safeY;

    const payload = {
      username: member.username,
      x: safeX,
      y: safeY,
    };

    socket.to(roomName).emit('cursor_move', payload);
    emitRoomState(roomName);
  });

  socket.on('draw_begin', ({ strokeId, point, color, width }) => {
    const roomName = socket.data.roomName;

    if (!roomName) {
      return;
    }

    const room = getRoom(roomName);
    const safePoint = point || { x: 0, y: 0 };
    const stroke = {
      id: strokeId,
      username: socket.data.username,
      color: color || '#000000',
      width: Number(width) || 2,
      points: [safePoint],
    };

    room.inProgress[socket.id] = stroke;
    socket.to(roomName).emit('draw_begin', stroke);
  });

  socket.on('draw_move', ({ strokeId, point }) => {
    const roomName = socket.data.roomName;

    if (!roomName || !point) {
      return;
    }

    const room = getRoom(roomName);
    const stroke = room.inProgress[socket.id] || {
      id: strokeId,
      username: socket.data.username,
      color: '#000000',
      points: [],
    };

    stroke.id = strokeId;
    stroke.username = socket.data.username;
    stroke.points.push(point);
    room.inProgress[socket.id] = stroke;

    socket.to(roomName).emit('draw_move', {
      strokeId,
      point,
      username: socket.data.username,
    });
  });

  socket.on('draw_end', ({ strokeId }) => {
    const roomName = socket.data.roomName;

    if (!roomName) {
      return;
    }

    const room = getRoom(roomName);
    const stroke = room.inProgress[socket.id];

    if (!stroke) {
      return;
    }

    stroke.id = strokeId || stroke.id;
    room.strokes.push(stroke);
    delete room.inProgress[socket.id];

    io.to(roomName).emit('draw_end', {
      strokeId: stroke.id,
      stroke,
      username: socket.data.username,
    });
  });

  socket.on('clear_canvas', () => {
    const roomName = socket.data.roomName;

    if (!roomName) {
      return;
    }

    const room = getRoom(roomName);
    room.strokes = [];
    room.inProgress = {};

    io.to(roomName).emit('clear_canvas');
    emitRoomState(roomName);
  });

  socket.on('disconnect', () => {
    leaveRoom(socket);
    io.emit('room_list', getRoomList());
  });
});

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'PaintRooms backend is running',
    rooms: getRoomList(),
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});