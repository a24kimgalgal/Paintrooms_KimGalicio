import { io } from 'socket.io-client'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export function usePaintRoom() {
  const username = ref('')
  const roomName = ref('')
  const currentRoom = ref('')
  const rooms = ref([])
  const users = ref([])
  const connected = ref(false)
  const socket = ref(null)
  const canvasRef = ref(null)
  const localStroke = ref(null)
  const completedStrokes = ref([])
  const remoteStrokes = ref({})
  const isDrawing = ref(false)
  const brushColor = ref('#111827')
  const brushSize = ref(2)

  const cursorUsers = computed(() =>
    (users.value || []).filter(
      (user) => user.username !== username.value && Number.isFinite(user.x) && Number.isFinite(user.y),
    ),
  )

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.value

    if (!canvas) {
      return { x: 0, y: 0 }
    }

    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height

    return { x, y }
  }

  const drawStroke = (ctx, stroke) => {
    if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) {
      return
    }

    ctx.beginPath()
    ctx.lineWidth = Number(stroke.width) || 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = stroke.color || '#111827'

    const [firstPoint, ...rest] = stroke.points

    if (!firstPoint) {
      return
    }

    ctx.moveTo(firstPoint.x, firstPoint.y)
    rest.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })

    ctx.stroke()
  }

  const renderCanvas = () => {
    const canvas = canvasRef.value

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    completedStrokes.value.forEach((stroke) => {
      drawStroke(context, stroke)
    })

    Object.values(remoteStrokes.value).forEach((stroke) => {
      drawStroke(context, stroke)
    })

    if (localStroke.value) {
      drawStroke(context, localStroke.value)
    }
  }

  const resetCanvasForRoom = () => {
    localStroke.value = null
    remoteStrokes.value = {}
    completedStrokes.value = []
    renderCanvas()
  }

  const connectSocket = () => {
    if (socket.value) {
      return
    }

    socket.value = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.value.on('connect', () => {
      connected.value = true
    })

    socket.value.on('disconnect', () => {
      connected.value = false
    })

    socket.value.on('room_list', (data) => {
      rooms.value = data || []
    })

    socket.value.on('room_users', (data) => {
      users.value = (data || []).map((user) => ({
        ...user,
        x: Number(user.x) || 0,
        y: Number(user.y) || 0,
      }))
    })

    socket.value.on('cursor_move', ({ username: cursorUser, x, y }) => {
      const existingUser = users.value.find((user) => user.username === cursorUser)

      if (existingUser) {
        existingUser.x = Number(x) || 0
        existingUser.y = Number(y) || 0
        return
      }

      users.value.push({
        username: cursorUser,
        x: Number(x) || 0,
        y: Number(y) || 0,
      })
    })

    socket.value.on('room_joined', ({ roomName: joinedRoom }) => {
      currentRoom.value = joinedRoom
    })

    socket.value.on('room_state', (data) => {
      completedStrokes.value = data || []
      remoteStrokes.value = {}
      renderCanvas()
    })

    socket.value.on('draw_begin', (stroke) => {
      if (!stroke || stroke.username === username.value) {
        return
      }

      remoteStrokes.value[stroke.id] = stroke
      renderCanvas()
    })

    socket.value.on('clear_canvas', () => {
      completedStrokes.value = []
      remoteStrokes.value = {}
      localStroke.value = null
      isDrawing.value = false
      renderCanvas()
    })

    socket.value.on('draw_move', ({ strokeId, point, username: sender }) => {
      if (!strokeId || sender === username.value) {
        return
      }

      const current = remoteStrokes.value[strokeId] || {
        id: strokeId,
        username: sender,
        color: '#111827',
        points: [],
      }

      current.points.push(point)
      remoteStrokes.value[strokeId] = current
      renderCanvas()
    })

    socket.value.on('draw_end', ({ strokeId, stroke, username: sender }) => {
      if (!stroke || sender === username.value) {
        return
      }

      completedStrokes.value.push(stroke)
      delete remoteStrokes.value[strokeId]
      renderCanvas()
    })

    socket.value.on('error_message', (message) => {
      window.alert(message)
    })
  }

  const joinRoom = () => {
    const safeUsername = username.value.trim()
    const safeRoomName = roomName.value.trim()

    if (!safeUsername || !safeRoomName) {
      window.alert('Necesitas escribir un nombre y una sala.')
      return
    }

    if (!socket.value) {
      connectSocket()
    }

    socket.value.emit('join_room', {
      username: safeUsername,
      roomName: safeRoomName,
    })
  }

  const joinExistingRoom = (name) => {
    roomName.value = name
    joinRoom()
  }

  const startDrawing = (event) => {
    if (!currentRoom.value || !socket.value) {
      return
    }

    const point = getCanvasPoint(event)
    const strokeId = `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`

    isDrawing.value = true
    localStroke.value = {
      id: strokeId,
      username: username.value,
      color: brushColor.value,
      width: brushSize.value,
      points: [point],
    }

    socket.value.emit('draw_begin', {
      strokeId,
      point,
      color: brushColor.value,
      width: brushSize.value,
    })

    renderCanvas()
  }

  const updateCursorPosition = (event) => {
    if (!currentRoom.value || !socket.value) {
      return
    }

    const point = getCanvasPoint(event)
    socket.value.emit('cursor_move', {
      x: point.x,
      y: point.y,
    })
  }

  const continueDrawing = (event) => {
    updateCursorPosition(event)

    if (!isDrawing.value || !localStroke.value || !socket.value) {
      return
    }

    const point = getCanvasPoint(event)
    localStroke.value.points.push(point)

    socket.value.emit('draw_move', {
      strokeId: localStroke.value.id,
      point,
    })

    renderCanvas()
  }

  const finishDrawing = () => {
    if (!isDrawing.value || !localStroke.value || !socket.value) {
      return
    }

    const finalStroke = { ...localStroke.value }
    completedStrokes.value.push(finalStroke)

    socket.value.emit('draw_end', { strokeId: localStroke.value.id })

    localStroke.value = null
    isDrawing.value = false
    renderCanvas()
  }

  const clearCanvas = () => {
    if (!currentRoom.value || !socket.value) {
      return
    }

    socket.value.emit('clear_canvas')
    completedStrokes.value = []
    remoteStrokes.value = {}
    localStroke.value = null
    isDrawing.value = false
    renderCanvas()
  }

  watch(
    () => currentRoom.value,
    (nextRoom) => {
      if (!nextRoom) {
        resetCanvasForRoom()
        return
      }

      localStroke.value = null
      isDrawing.value = false
      renderCanvas()
    },
  )

  onMounted(() => {
    connectSocket()
    renderCanvas()
  })

  onBeforeUnmount(() => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  })

  return {
    username,
    roomName,
    currentRoom,
    rooms,
    users,
    connected,
    cursorUsers,
    canvasRef,
    brushColor,
    brushSize,
    joinRoom,
    joinExistingRoom,
    startDrawing,
    continueDrawing,
    finishDrawing,
    clearCanvas,
  }
}
