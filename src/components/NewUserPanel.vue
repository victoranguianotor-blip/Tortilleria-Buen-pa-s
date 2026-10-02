<script setup lang="ts">
import { computed, ref } from 'vue'

import FlapText from '@/components/FlapText.vue'
import PasswordField from '@/components/PasswordField.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import type { UserRole } from '@/services/admin'
import { isValidUsername, MIN_PASSWORD_LENGTH, normalizeUsername, roleLabel } from '@/utils/users'

defineProps<{ busy: boolean; error: string | null; notice: string | null }>()
const emit = defineEmits<{
  create: [input: { username: string; fullName: string; password: string; role: UserRole }]
}>()

const fullName = ref('')
const username = ref('')
const password = ref('')
const role = ref<UserRole>('driver')

const usernameInvalid = computed(
  () => username.value.trim() !== '' && !isValidUsername(username.value),
)
const passwordShort = computed(
  () => password.value !== '' && password.value.length < MIN_PASSWORD_LENGTH,
)
const ready = computed(
  () =>
    fullName.value.trim() !== '' &&
    isValidUsername(username.value) &&
    password.value.length >= MIN_PASSWORD_LENGTH,
)

function submit() {
  if (!ready.value) return
  emit('create', {
    username: normalizeUsername(username.value),
    fullName: fullName.value.trim(),
    password: password.value,
    role: role.value,
  })
}

function reset() {
  fullName.value = ''
  username.value = ''
  password.value = ''
  role.value = 'driver'
}
defineExpose({ reset })
</script>

<template>
  <form class="flex flex-col gap-5" novalidate aria-label="Nuevo usuario" @submit.prevent="submit">
    <h2 class="flex min-h-12 items-center"><FlapText text="Nuevo usuario" /></h2>

    <label class="flex flex-col gap-2">
      <span class="caption">Nombre</span>
      <input
        v-model="fullName"
        class="field"
        type="text"
        maxlength="80"
        autocomplete="off"
        autocapitalize="words"
        enterkeyhint="next"
        placeholder="Juan Pérez"
        :disabled="busy"
      />
    </label>

    <label class="flex flex-col gap-2">
      <span class="caption">Usuario para entrar</span>
      <input
        v-model="username"
        class="field lowercase"
        type="text"
        maxlength="30"
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="next"
        placeholder="juan"
        :aria-invalid="usernameInvalid"
        :disabled="busy"
      />
      <span class="hint" :class="{ bad: usernameInvalid }">
        3 a 30 letras sin acentos, números, punto, guion o guion bajo. Sin espacios.
      </span>
    </label>

    <label class="flex flex-col gap-2">
      <span class="caption">Contraseña</span>
      <PasswordField
        v-model="password"
        visible
        autocomplete="new-password"
        enterkeyhint="done"
        :aria-invalid="passwordShort"
        :disabled="busy"
      />
      <span class="hint" :class="{ bad: passwordShort }">
        Mínimo {{ MIN_PASSWORD_LENGTH }} caracteres.
      </span>
    </label>

    <fieldset class="flex flex-col gap-2">
      <legend class="caption mb-2">Rol</legend>
      <div class="grid grid-cols-2 gap-2">
        <label v-for="r in ['driver', 'admin'] as const" :key="r" class="choice">
          <input v-model="role" class="sr-only" type="radio" name="role" :value="r" />
          {{ roleLabel(r) }}
        </label>
      </div>
    </fieldset>

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>
    <p v-else-if="notice" class="notice" role="status">{{ notice }}</p>

    <button type="submit" class="btn-primary w-full" :disabled="!ready || busy">
      <span>{{ busy ? 'Creando…' : 'Crear usuario' }}</span>
      <StrokeIcon v-if="!busy" name="arrow" />
    </button>
  </form>
</template>

<style scoped>
.hint {
  color: var(--color-steel-2);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.hint.bad {
  color: var(--color-danger);
}

.choice {
  display: grid;
  place-items: center;
  min-height: 3.4rem;
  border: 2px solid var(--color-steel-3);
  border-radius: 6px;
  color: var(--color-steel);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 160ms ease-out,
    color 160ms ease-out,
    background 160ms ease-out;
}
.choice:has(:checked) {
  border-color: var(--color-amber);
  background: var(--color-amber-dark);
  color: var(--color-amber);
}
.choice:has(:focus-visible) {
  outline: 3px solid var(--color-amber);
  outline-offset: 3px;
}

.notice {
  color: var(--color-ink);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
</style>
