<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import FlapText from '@/components/FlapText.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useClock } from '@/composables/clock'
import { homeForRole } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()
const time = useClock()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)

const ready = computed(() => username.value.trim() !== '' && password.value !== '')

async function submit() {
  if (!ready.value || busy.value) return
  busy.value = true
  error.value = null
  try {
    await auth.signIn(username.value, password.value)
    router.replace(homeForRole(auth.profile!.role))
  } catch (e) {
    error.value = errorMessage(e)
    password.value = ''
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="grid min-h-dvh place-items-center p-4 wide:p-8">
    <div
      class="board-frame grid w-full max-w-5xl gap-8 rounded-lg p-5 wide:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] wide:gap-10 wide:p-8"
    >
      <div class="flex flex-col justify-between gap-6">
        <h1 class="flex flex-col items-start gap-2">
          <span class="sr-only">Reparto de Tortillas</span>
          <FlapText text="Reparto" size="title" animate aria-hidden="true" />
          <span class="flex flex-wrap gap-x-5 gap-y-2">
            <FlapText text="de" size="lg" tone="steel" animate aria-hidden="true" />
            <FlapText text="tortillas" size="lg" tone="steel" animate aria-hidden="true" />
          </span>
        </h1>
        <div class="flex items-center gap-3">
          <span class="caption">Hora</span>
          <FlapText :text="time" size="md" />
        </div>
      </div>

      <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-2">
          <span class="caption">Usuario</span>
          <input
            v-model="username"
            class="field"
            type="text"
            name="username"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="next"
            :disabled="busy"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="caption">Contraseña</span>
          <span class="relative block">
            <input
              v-model="password"
              class="field pr-16!"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              enterkeyhint="go"
              :disabled="busy"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 grid w-16 place-items-center text-2xl text-steel"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <StrokeIcon :name="showPassword ? 'eye-off' : 'eye'" />
            </button>
          </span>
        </label>

        <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

        <button type="submit" class="btn-primary mt-1 w-full" :disabled="!ready || busy">
          <span>{{ busy ? 'Entrando…' : 'Entrar' }}</span>
          <StrokeIcon v-if="!busy" name="arrow" />
        </button>
      </form>
    </div>
  </main>
</template>
