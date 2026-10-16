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

function getRoomList() {
  return Array.from(rooms.entries())
    .map(([name, members]) => ({
      name,
      users: members.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function emitRoomState(roomName) {
  const roomMembers = rooms.get(roomName) || [];
  const users = roomMembers.map((member) => ({
    username: member.username,
  }));

  io.to(roomName).emit('room_users', users);
  io.emit('room_list', getRoomList());
}

function leaveRoom(socket) {
  const previousRoom = socket.data.roomName;

  if (!previousRoom) {
    return;
  }

  const roomMembers = rooms.get(previousRoom) || [];
  const index = roomMembers.findIndex((member) => member.socketId === socket.id);

  if (index !== -1) {
    roomMembers.splice(index, 1);
  }

  socket.leave(previousRoom);

  if (roomMembers.length === 0) {
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

    if (!rooms.has(safeRoomName)) {
      rooms.set(safeRoomName, []);
    }

    socket.join(safeRoomName);

    const roomMembers = rooms.get(safeRoomName);
    const existingMember = roomMembers.find((member) => member.socketId === socket.id);

    if (existingMember) {
      existingMember.username = safeUsername;
    } else {
      roomMembers.push({
        socketId: socket.id,
        username: safeUsername,
      });
    }

    socket.data.roomName = safeRoomName;
    socket.data.username = safeUsername;

    socket.emit('room_joined', { roomName: safeRoomName });
    emitRoomState(safeRoomName);
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