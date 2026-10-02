<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import FlapText from '@/components/FlapText.vue'
import IconoTrazo from '@/components/IconoTrazo.vue'
import { useReloj } from '@/composables/reloj'
import { inicioPorRol } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { mensajeDeError } from '@/utils/errores'

const auth = useAuthStore()
const router = useRouter()
const hora = useReloj()

const usuario = ref('')
const password = ref('')
const verPassword = ref(false)
const ocupado = ref(false)
const error = ref<string | null>(null)

const listo = computed(() => usuario.value.trim() !== '' && password.value !== '')

async function entrar() {
  if (!listo.value || ocupado.value) return
  ocupado.value = true
  error.value = null
  try {
    await auth.entrar(usuario.value, password.value)
    router.replace(inicioPorRol(auth.perfil!.rol))
  } catch (e) {
    error.value = mensajeDeError(e)
    password.value = ''
  } finally {
    ocupado.value = false
  }
}
</script>

<template>
  <main class="grid min-h-dvh place-items-center p-4 horizontal:p-8">
    <div
      class="marco grid w-full max-w-5xl gap-8 rounded-lg p-5 horizontal:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] horizontal:gap-10 horizontal:p-8"
    >
      <div class="flex flex-col justify-between gap-6">
        <h1 class="flex flex-col items-start gap-2">
          <span class="sr-only">Reparto de Tortillas</span>
          <FlapText texto="Reparto" tamano="titulo" animar aria-hidden="true" />
          <span class="flex flex-wrap gap-x-5 gap-y-2">
            <FlapText texto="de" tamano="lg" tono="acero" animar aria-hidden="true" />
            <FlapText texto="tortillas" tamano="lg" tono="acero" animar aria-hidden="true" />
          </span>
        </h1>
        <div class="flex items-center gap-3">
          <span class="rotulo">Hora</span>
          <FlapText :texto="hora" tamano="md" />
        </div>
      </div>

      <form class="flex flex-col gap-5" novalidate @submit.prevent="entrar">
        <label class="flex flex-col gap-2">
          <span class="rotulo">Usuario</span>
          <input
            v-model="usuario"
            class="campo"
            type="text"
            name="usuario"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="next"
            :disabled="ocupado"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="rotulo">Contraseña</span>
          <span class="relative block">
            <input
              v-model="password"
              class="campo pr-16!"
              :type="verPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              enterkeyhint="go"
              :disabled="ocupado"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 grid w-16 place-items-center text-2xl text-acero"
              :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="verPassword"
              @click="verPassword = !verPassword"
            >
              <IconoTrazo :nombre="verPassword ? 'ojo-no' : 'ojo'" />
            </button>
          </span>
        </label>

        <p v-if="error" class="alerta-error" role="alert">{{ error }}</p>

        <button type="submit" class="boton-ambar mt-1 w-full" :disabled="!listo || ocupado">
          <span>{{ ocupado ? 'Entrando…' : 'Entrar' }}</span>
          <IconoTrazo v-if="!ocupado" nombre="flecha" />
        </button>
      </form>
    </div>
  </main>
</template>
