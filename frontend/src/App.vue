<script setup>
import { io } from 'socket.io-client'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const username = ref('')
const roomName = ref('')
const currentRoom = ref('')
const rooms = ref([])
const users = ref([])
const connected = ref(false)
const socket = ref(null)

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
    users.value = data || []
  })

  socket.value.on('room_joined', ({ roomName: joinedRoom }) => {
    currentRoom.value = joinedRoom
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

  socket.value.emit('join_room', {
    username: safeUsername,
    roomName: safeRoomName,
  })
}

const joinExistingRoom = (name) => {
  roomName.value = name
  joinRoom()
}

onMounted(() => {
  connectSocket()
})

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
})
</script>

<template>
  <main>
    <h1>PaintRooms</h1>

    <p>{{ connected ? 'Conectado al servidor' : 'Conectando...' }}</p>

    <div>
      <label for="username">Nombre</label>
      <input id="username" v-model="username" placeholder="Tu nombre" />
    </div>

    <div>
      <label for="roomName">Sala</label>
      <input id="roomName" v-model="roomName" placeholder="Nombre de la sala" />
      <button @click="joinRoom">Entrar / crear sala</button>
    </div>

    <section v-if="currentRoom">
      <h2>Sala actual: {{ currentRoom }}</h2>
      <p>Usuarios en la sala:</p>
      <ul>
        <li v-for="user in users" :key="user.username">
          {{ user.username }}
        </li>
      </ul>
    </section>

    <section>
      <h3>Salas disponibles</h3>
      <ul>
        <li v-if="rooms.length === 0">No hay salas activas.</li>
        <li v-for="room in rooms" :key="room.name">
          <button @click="joinExistingRoom(room.name)">
            Entrar a {{ room.name }} ({{ room.users }})
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
main {
  font-family: Arial, sans-serif;
  max-width: 700px;
  margin: 2rem auto;
  padding: 1rem;
}

input,
button {
  display: block;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
}

button {
  cursor: pointer;
}

ul {
  padding-left: 1.2rem;
}
</style>
