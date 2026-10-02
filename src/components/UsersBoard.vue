<script setup lang="ts">
import type { UserProfile } from '@/services/admin'
import { roleLabel } from '@/utils/users'

defineProps<{ users: UserProfile[]; selectedId: string | null }>()
defineEmits<{ select: [user: UserProfile] }>()
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="row header caption" aria-hidden="true">
      <span />
      <span>Nombre</span>
      <span class="username">Usuario</span>
      <span>Rol</span>
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto" aria-label="Usuarios">
      <li v-for="u in users" :key="u.id">
        <button
          type="button"
          class="row w-full text-left"
          :class="{ active: u.id === selectedId, inactive: !u.active }"
          :aria-pressed="u.id === selectedId"
          :aria-label="`${u.full_name}, usuario ${u.username}, ${roleLabel(u.role)}${u.active ? '' : ', desactivado'}`"
          @click="$emit('select', u)"
        >
          <span class="bulb" :class="{ on: u.active }" />
          <span class="name">{{ u.full_name }}</span>
          <span class="username handle">{{ u.username }}</span>
          <span class="caption">{{ u.active ? roleLabel(u.role) : 'Desactivado' }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 0.8rem minmax(0, 1fr) minmax(0, 0.8fr) 7rem;
  align-items: center;
  gap: 0.9rem;
  min-height: 3.5rem;
  padding: 0.35rem 0.9rem;
  border-bottom: 1px solid #222327;
}
.header {
  min-height: 2.4rem;
  border-bottom-color: var(--color-steel-3);
}

button.row {
  transition: background 160ms ease-out;
}
button.row:active {
  background: var(--color-flap-2);
}
button.row.active {
  background: var(--color-amber-dark);
  box-shadow: inset 0 0 0 2px var(--color-amber);
}

.name,
.handle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name {
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.handle {
  color: var(--color-steel);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}
.active .name {
  color: var(--color-amber);
}
.inactive .name,
.inactive .handle {
  color: var(--color-steel-2);
}

.bulb {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--color-steel-3);
}
.bulb.on {
  background: var(--color-amber);
  box-shadow: 0 0 10px 1px rgb(255 180 0 / 0.6);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 0.8rem minmax(0, 1fr) 6rem;
    gap: 0.6rem;
    padding-inline: 0.75rem;
  }
  .username {
    display: none;
  }
}
</style>
