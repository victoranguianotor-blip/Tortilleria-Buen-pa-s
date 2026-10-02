import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'

import type { Perfil } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean
    rol?: Perfil['rol']
  }
}

export function inicioPorRol(rol: Perfil['rol']): RouteLocationRaw {
  return { name: rol === 'admin' ? 'admin' : 'ruta' }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { publica: true },
    },
    {
      path: '/ruta',
      name: 'ruta',
      component: () => import('@/views/RutaView.vue'),
      meta: { rol: 'repartidor' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { rol: 'admin' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/ruta' },
  ],
})

// Solo UX: la seguridad real la aplica RLS en la base de datos.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.iniciar()
  const perfil = auth.perfil

  if (to.meta.publica) return perfil ? inicioPorRol(perfil.rol) : true
  if (!perfil) return { name: 'login' }
  if (to.meta.rol && to.meta.rol !== perfil.rol) return inicioPorRol(perfil.rol)
})

export default router
