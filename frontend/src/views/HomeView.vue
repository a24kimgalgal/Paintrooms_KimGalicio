<script setup>
import RoomForm from '../components/RoomForm.vue'
import RoomList from '../components/RoomList.vue'
import { usePaintRoom } from '../composables/usePaintRoom'

const {
  username,
  roomName,
  currentRoom,
  rooms,
  users,
  connected,
  cursorUsers,
  brushColor,
  brushSize,
  canvasRef,
  joinRoom,
  joinExistingRoom,
  startDrawing,
  continueDrawing,
  finishDrawing,
  clearCanvas,
} = usePaintRoom()
</script>

<template>
  <main class="app-shell">
    <div class="left-column">
      <RoomForm
        :username="username"
        :room-name="roomName"
        :connected="connected"
        @update:username="username = $event"
        @update:room-name="roomName = $event"
        @join-room="joinRoom"
      />
      <RoomList :rooms="rooms" @join-room="joinExistingRoom" />
    </div>

    <section v-if="currentRoom" class="room-panel">
      <div class="room-header">
        <div>
          <p class="eyebrow">Sala actual</p>
          <h2>{{ currentRoom }}</h2>
        </div>
        <button type="button" class="clear-button" @click="clearCanvas">Limpiar</button>
      </div>

      <div class="toolbar">
        <label for="brushColor">Color</label>
        <input id="brushColor" v-model="brushColor" type="color" />

        <label for="brushSize">Grosor</label>
        <input id="brushSize" v-model.number="brushSize" type="range" min="1" max="20" />
        <span class="size-label">{{ brushSize }}px</span>
      </div>

      <div class="workspace">
        <div class="canvas-wrapper">
          <canvas
            ref="canvasRef"
            width="1800"
            height="1000"
            @pointerdown="startDrawing"
            @pointermove="continueDrawing"
            @pointerup="finishDrawing"
            @pointerleave="finishDrawing"
          ></canvas>

          <div
            v-for="cursor in cursorUsers"
            :key="cursor.username"
            class="cursor-marker"
            :style="{
              left: `${(cursor.x / 1800) * 100}%`,
              top: `${(cursor.y / 1000) * 100}%`,
            }"
          >
            <span>{{ cursor.username }}</span>
          </div>
        </div>

        <aside class="participants-box">
          <p>Usuarios en la sala</p>
          <ul class="user-list">
            <li v-for="user in users" :key="user.username">
              {{ user.username }}
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <section v-else class="room-panel room-empty">
      <div class="empty-room-msg">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
        </svg>
        <p>Introduce tu nombre y el nombre de una sala para empezar a dibujar</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.room-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-room-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #9ca3af;
  text-align: center;
  max-width: 280px;
}

.empty-room-msg p {
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>
