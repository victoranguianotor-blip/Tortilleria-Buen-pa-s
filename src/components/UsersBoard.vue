<script setup lang="ts">
import type { UserProfile } from '@/services/admin'
import { roleLabel } from '@/utils/users'

defineProps<{ users: UserProfile[]; selectedId: string | null }>()
defineEmits<{ select: [user: UserProfile] }>()
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="row list-head" aria-hidden="true">
      <span>Nombre</span>
      <span class="username">Usuario</span>
      <span>Rol</span>
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto" aria-label="Usuarios">
      <li v-for="u in users" :key="u.id">
        <button
          type="button"
          class="row list-row w-full text-left"
          :class="{ selected: u.id === selectedId, inactive: !u.active }"
          :aria-pressed="u.id === selectedId"
          :aria-label="`${u.full_name}, usuario ${u.username}, ${roleLabel(u.role)}${u.active ? '' : ', desactivado'}`"
          @click="$emit('select', u)"
        >
          <span class="name">{{ u.full_name }}</span>
          <span class="username handle">{{ u.username }}</span>
          <span class="role">{{ u.active ? roleLabel(u.role) : 'Desactivado' }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) 6.5rem;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.3rem 2.1rem 0.3rem 0.9rem;
}
.list-head {
  min-height: 2.25rem;
}

.name,
.handle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name {
  font-size: 1.125rem;
  font-weight: 700;
}
.handle {
  color: var(--color-ink-2);
}
.role {
  color: var(--color-ink-2);
  font-size: 0.9375rem;
  font-weight: 600;
}
.inactive .name,
.inactive .handle,
.inactive .role {
  color: var(--color-ink-3);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: minmax(0, 1fr) 6rem;
    gap: 0.6rem;
    padding-left: 0.75rem;
  }
  .username {
    display: none;
  }
}
</style>
