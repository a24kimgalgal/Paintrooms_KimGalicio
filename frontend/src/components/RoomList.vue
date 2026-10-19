<script setup>
const props = defineProps({
  rooms: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['join-room'])
</script>

<template>
  <aside class="panel lobby-panel">
    <h3>Salas disponibles</h3>
    <ul class="room-list">
      <li v-if="props.rooms.length === 0" class="empty-state">No hay salas activas.</li>
      <li v-for="room in props.rooms" :key="room.name" class="room-item">
        <span>{{ room.name }}</span>
        <button class="ghost-btn" @click="emit('join-room', room.name)">
          Entrar ({{ room.users }})
        </button>
      </li>
    </ul>
  </aside>
</template>
