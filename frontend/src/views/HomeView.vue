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

    <section v-if="currentRoom" class="panel room-panel">
      <div class="room-header">
        <div>
          <p class="eyebrow">Sala actual</p>
          <h2>{{ currentRoom }}</h2>
        </div>
        <div class="room-actions">
          <button type="button" class="clear-button" @click="clearCanvas">Limpiar</button>
        </div>
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
            width="900"
            height="500"
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
              left: `${(cursor.x / 900) * 100}%`,
              top: `${(cursor.y / 500) * 100}%`,
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
  </main>
</template>
