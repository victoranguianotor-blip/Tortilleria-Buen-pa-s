<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import PasswordField from '@/components/PasswordField.vue'
import StatusLamp from '@/components/StatusLamp.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useTwoTapConfirm } from '@/composables/twoTapConfirm'
import type { UserProfile } from '@/services/admin'
import { MIN_PASSWORD_LENGTH, roleLabel } from '@/utils/users'

const props = defineProps<{
  user: UserProfile
  isSelf: boolean
  busy: boolean
  error: string | null
  notice: string | null
}>()
const emit = defineEmits<{
  setPassword: [password: string]
  setActive: [active: boolean]
  close: []
}>()

const password = ref('')
const deactivateConfirm = useTwoTapConfirm()

watch(
  () => props.user.id,
  () => {
    password.value = ''
    deactivateConfirm.disarm()
  },
)

const passwordReady = computed(() => password.value.length >= MIN_PASSWORD_LENGTH)

function savePassword() {
  if (passwordReady.value && !props.busy) emit('setPassword', password.value)
}

function toggleActive() {
  if (props.user.active) deactivateConfirm.tap(() => emit('setActive', false))
  else emit('setActive', true)
}

function reset() {
  password.value = ''
}
defineExpose({ reset })
</script>

<template>
  <section class="flex flex-col gap-5" :aria-label="`Usuario ${user.full_name}`">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-1">
        <h2 class="name">{{ user.full_name }}</h2>
        <p class="caption">{{ roleLabel(user.role) }} · usuario {{ user.username }}</p>
      </div>
      <button type="button" class="btn-steel min-h-12! shrink-0" @click="emit('close')">
        <StrokeIcon name="close" class="text-xl" />
        <span>Cerrar</span>
      </button>
    </div>

    <StatusLamp
      class="self-start"
      :text="user.active ? 'Activo' : 'Desactivado'"
      :tone="user.active ? 'amber' : 'steel'"
    />

    <form class="flex flex-col gap-3" novalidate @submit.prevent="savePassword">
      <label class="flex flex-col gap-2">
        <span class="caption">Nueva contraseña</span>
        <PasswordField
          v-model="password"
          visible
          autocomplete="new-password"
          enterkeyhint="done"
          :disabled="busy"
        />
        <span class="hint">Mínimo {{ MIN_PASSWORD_LENGTH }} caracteres.</span>
      </label>
      <button type="submit" class="btn-primary w-full" :disabled="!passwordReady || busy">
        <span>Cambiar contraseña</span>
        <StrokeIcon name="arrow" />
      </button>
    </form>

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>
    <p v-else-if="notice" class="notice" role="status">{{ notice }}</p>

    <div class="flex flex-col gap-2 border-t border-steel-3 pt-5">
      <p v-if="isSelf" class="hint">Es tu cuenta: no puedes desactivarla.</p>
      <template v-else>
        <p class="hint">
          {{
            user.active
              ? 'Desactivar le impide entrar y registrar entregas. Sus rutas se conservan.'
              : 'Está desactivado: no puede entrar.'
          }}
        </p>
        <button
          type="button"
          class="btn-steel"
          :class="{ danger: deactivateConfirm.armed.value }"
          :disabled="busy"
          @click="toggleActive"
        >
          {{
            user.active
              ? deactivateConfirm.armed.value
                ? '¿Desactivar? Toca otra vez'
                : 'Desactivar'
              : 'Activar'
          }}
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.name {
  overflow-wrap: anywhere;
  font-size: clamp(1.6rem, 1.4vw + 1.1rem, 2.1rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.1;
  text-transform: uppercase;
}
.hint {
  color: var(--color-steel-2);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.notice {
  color: var(--color-ink);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
</style>
