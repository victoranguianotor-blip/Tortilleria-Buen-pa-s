import { defineStore } from 'pinia'
import { ref } from 'vue'

import * as auth from '@/services/auth'
import type { Profile } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  let initialization: Promise<void> | null = null

  function init(): Promise<void> {
    initialization ??= (async () => {
      auth.onSignedOut(() => (profile.value = null))
      const id = await auth.currentUserId()
      if (!id) return
      try {
        await loadProfile(id)
      } catch {
        await auth.signOut()
      }
    })()
    return initialization
  }

  async function loadProfile(id: string) {
    const data = await auth.fetchProfile(id)
    if (!data.active) {
      await auth.signOut()
      throw { code: 'user_banned' }
    }
    profile.value = data
  }

  async function signIn(username: string, password: string) {
    await auth.signIn(username, password)
    const id = await auth.currentUserId()
    if (id) await loadProfile(id)
  }

  async function signOut() {
    await auth.signOut()
    profile.value = null
  }

  return { profile, init, signIn, signOut }
})
