<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import PasswordField from '@/components/PasswordField.vue'
import DevNotice from '@/components/DevNotice.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useClock } from '@/composables/clock'
import { IN_DEVELOPMENT } from '@/legal'
import { homeForRole } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()
const time = useClock()

const username = ref('')
const password = ref('')
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
      class="panel grid w-full max-w-4xl gap-8 p-5 sm:p-7 wide:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] wide:gap-10 wide:p-8"
    >
      <div class="flex flex-col justify-between gap-4">
        <div class="flex flex-col gap-3">
          <h1 class="text-3xl leading-tight font-extrabold sm:text-4xl">Reparto de Tortillas</h1>
          <p class="text-lg text-ink-2">Entra con el usuario que te dio el encargado.</p>
          <DevNotice v-if="IN_DEVELOPMENT">
            Esta aplicación está en pruebas y todavía no se usa de forma oficial. Los datos que se
            capturan son de prueba y pueden borrarse.
          </DevNotice>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-ink-3 tabular-nums">
            Hora en Colima <span class="ml-1 font-bold text-ink">{{ time }}</span>
          </p>
          <nav class="flex flex-wrap gap-2" aria-label="Documentos legales">
            <RouterLink :to="{ name: 'privacy' }" class="btn-secondary quiet"
              >Aviso de privacidad</RouterLink
            >
            <RouterLink :to="{ name: 'terms' }" class="btn-secondary quiet"
              >Términos de uso</RouterLink
            >
          </nav>
        </div>
      </div>

      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1.5">
          <span class="label">Usuario</span>
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

        <label class="flex flex-col gap-1.5">
          <span class="label">Contraseña</span>
          <PasswordField
            v-model="password"
            name="password"
            autocomplete="current-password"
            enterkeyhint="go"
            :disabled="busy"
          />
        </label>

        <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

        <button type="submit" class="btn-primary mt-2 w-full" :disabled="!ready || busy">
          <span>{{ busy ? 'Entrando…' : 'Entrar' }}</span>
          <StrokeIcon v-if="!busy" name="arrow" />
        </button>
      </form>
    </div>
  </main>
</template>
