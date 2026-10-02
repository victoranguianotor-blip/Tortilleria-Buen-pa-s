<script setup lang="ts">
import { useRouter } from 'vue-router'

import FlapText from '@/components/FlapText.vue'
import TopBar from '@/components/TopBar.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.signOut()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <TopBar :name="auth.profile?.full_name ?? ''" @logout="logout" />
    <main class="grid flex-1 place-items-center p-6">
      <div class="board-frame flex max-w-3xl flex-col gap-5 rounded-lg p-6">
        <h1><FlapText text="Panel del encargado" size="lg" animate /></h1>
        <p class="text-2xl leading-snug font-semibold tracking-wide">
          Aquí vas a ver el resumen de todas las rutas del día y dar de alta repartidores.
        </p>
        <p class="text-xl text-steel">Esta pantalla llega en la siguiente fase.</p>
      </div>
    </main>
  </div>
</template>
