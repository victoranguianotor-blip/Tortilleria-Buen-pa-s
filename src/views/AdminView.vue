<script setup lang="ts">
// Provisional hasta la fase 3 (dashboard del admin).
import { useRouter } from 'vue-router'

import BarraSuperior from '@/components/BarraSuperior.vue'
import FlapText from '@/components/FlapText.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function salir() {
  await auth.salir()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <BarraSuperior :nombre="auth.perfil?.nombre ?? ''" @salir="salir" />
    <main class="grid flex-1 place-items-center p-6">
      <div class="marco flex max-w-3xl flex-col gap-5 rounded-lg p-6">
        <h1><FlapText texto="Panel del encargado" tamano="lg" animar /></h1>
        <p class="text-2xl leading-snug font-semibold tracking-wide">
          Aquí vas a ver el resumen de todas las rutas del día y dar de alta repartidores.
        </p>
        <p class="text-xl text-acero">Esta pantalla llega en la siguiente fase.</p>
      </div>
    </main>
  </div>
</template>
