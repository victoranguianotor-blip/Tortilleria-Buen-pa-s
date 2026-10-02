import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router'

import type { Profile } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    role?: Profile['role']
  }
}

export function homeForRole(role: Profile['role']): RouteLocationRaw {
  return { name: role === 'admin' ? 'admin' : 'route' }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/route',
      name: 'route',
      component: () => import('@/views/RouteView.vue'),
      meta: { role: 'driver' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { role: 'admin' },
    },
    {
      path: '/admin/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { role: 'admin' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/route' },
  ],
})

// UX only: the real access control is RLS in the database.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  const profile = auth.profile

  if (to.meta.public) return profile ? homeForRole(profile.role) : true
  if (!profile) return { name: 'login' }
  if (to.meta.role && to.meta.role !== profile.role) return homeForRole(profile.role)
})

export default router
