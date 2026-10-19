<script setup>
import BrandIcon from './icons/BrandIcon.vue'

const props = defineProps({
  username: {
    type: String,
    default: '',
  },
  roomName: {
    type: String,
    default: '',
  },
  connected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:username', 'update:room-name', 'join-room'])
</script>

<template>
  <section class="panel auth-panel">
    <div class="brand-row">
      <BrandIcon />
      <div>
        <h1>PaintRooms</h1>
        <p class="status-pill" :class="{ online: connected }">
          {{ connected ? 'Servidor activo' : 'Conectando...' }}
        </p>
      </div>
    </div>

    <div class="field-group">
      <label for="username">Nombre</label>
      <input
        id="username"
        :value="props.username"
        placeholder="Tu nombre"
        @input="emit('update:username', $event.target.value)"
      />
    </div>

    <div class="field-group">
      <label for="roomName">Sala</label>
      <input
        id="roomName"
        :value="props.roomName"
        placeholder="Nombre de la sala"
        @input="emit('update:room-name', $event.target.value)"
      />
    </div>

    <button class="primary-btn" @click="emit('join-room')">Entrar / crear sala</button>
  </section>
</template>
