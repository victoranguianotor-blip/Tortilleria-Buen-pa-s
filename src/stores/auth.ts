import { defineStore } from 'pinia'
import { ref } from 'vue'

import * as auth from '@/services/auth'
import type { Perfil } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const perfil = ref<Perfil | null>(null)
  let inicio: Promise<void> | null = null

  // Restaura la sesión guardada una sola vez (lo llama el guard del router).
  function iniciar(): Promise<void> {
    inicio ??= (async () => {
      auth.alCerrarSesion(() => (perfil.value = null))
      const id = await auth.idUsuarioActual()
      if (!id) return
      try {
        await cargarPerfil(id)
      } catch {
        await auth.cerrarSesion()
      }
    })()
    return inicio
  }

  async function cargarPerfil(id: string) {
    const datos = await auth.obtenerPerfil(id)
    if (!datos.activo) {
      await auth.cerrarSesion()
      throw { code: 'user_banned' }
    }
    perfil.value = datos
  }

  async function entrar(usuario: string, password: string) {
    await auth.iniciarSesion(usuario, password)
    const id = await auth.idUsuarioActual()
    if (id) await cargarPerfil(id)
  }

  async function salir() {
    await auth.cerrarSesion()
    perfil.value = null
  }

  return { perfil, iniciar, entrar, salir }
})
