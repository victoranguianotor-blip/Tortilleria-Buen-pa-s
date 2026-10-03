<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AdminNav from '@/components/AdminNav.vue'
import PricesSection from '@/components/PricesSection.vue'
import TopBar from '@/components/TopBar.vue'
import UsersSection from '@/components/UsersSection.vue'
import { businessToday } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'

const SECTIONS = [
  { key: 'prices', label: 'Precios' },
  { key: 'users', label: 'Usuarios' },
] as const

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const today = ref<string | null>(null)
const section = computed(() => (route.query.section === 'users' ? 'users' : 'prices'))

function show(key: (typeof SECTIONS)[number]['key']) {
  router.replace({ query: key === 'prices' ? {} : { section: key } })
}

async function logout() {
  await auth.signOut()
  router.replace({ name: 'login' })
}

onMounted(async () => {
  today.value = await businessToday().catch(() => null)
})
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden">
    <TopBar :date="today" :name="auth.profile?.full_name ?? ''" @logout="logout">
      <AdminNav />
    </TopBar>

    <div class="flex gap-2 px-3 pt-3" role="tablist" aria-label="Ajustes">
      <button
        v-for="s in SECTIONS"
        :key="s.key"
        type="button"
        role="tab"
        class="tab"
        :aria-selected="section === s.key"
        @click="show(s.key)"
      >
        {{ s.label }}
      </button>
    </div>

    <PricesSection v-if="section === 'prices'" />
    <UsersSection v-else />
  </div>
</template>

<style scoped>
.tab {
  min-height: 3rem;
  padding: 0 1rem;
  border: 1px solid var(--color-edge);
  border-radius: 6px;
  background: var(--color-raised);
  color: var(--color-ink-2);
  font-weight: 700;
}
.tab[aria-selected='true'] {
  color: var(--color-ink);
  box-shadow: inset 0 -2px 0 var(--color-signal);
}
</style>
