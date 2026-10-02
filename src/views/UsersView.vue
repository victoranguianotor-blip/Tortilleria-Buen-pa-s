<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AdminNav from '@/components/AdminNav.vue'
import NewUserPanel from '@/components/NewUserPanel.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import TopBar from '@/components/TopBar.vue'
import UserPanel from '@/components/UserPanel.vue'
import UsersBoard from '@/components/UsersBoard.vue'
import * as admin from '@/services/admin'
import type { UserProfile, UserRole } from '@/services/admin'
import { businessToday } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errors'

const auth = useAuthStore()
const router = useRouter()

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const today = ref<string | null>(null)
const users = ref<UserProfile[]>([])
const selectedId = ref<string | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const newUserPanel = ref<InstanceType<typeof NewUserPanel> | null>(null)
const userPanel = ref<InstanceType<typeof UserPanel> | null>(null)

const selected = computed(() => users.value.find((u) => u.id === selectedId.value) ?? null)
const activeDrivers = computed(
  () => users.value.filter((u) => u.role === 'driver' && u.active).length,
)

async function load() {
  status.value = 'loading'
  try {
    ;[today.value, users.value] = await Promise.all([businessToday(), admin.fetchUsers()])
    status.value = 'ready'
  } catch {
    status.value = 'failed'
  }
}

async function run(action: () => Promise<void>, success: string): Promise<boolean> {
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await action()
    users.value = await admin.fetchUsers().catch(() => users.value)
    notice.value = success
    return true
  } catch (e) {
    error.value = errorMessage(e)
    return false
  } finally {
    busy.value = false
  }
}

async function create(input: {
  username: string
  fullName: string
  password: string
  role: UserRole
}) {
  const ok = await run(
    () => admin.createUser(input).then(() => {}),
    `Listo: ${input.fullName} entra con el usuario «${input.username}» y la contraseña que escribiste.`,
  )
  if (ok) newUserPanel.value?.reset()
}

async function setPassword(password: string) {
  const user = selected.value
  if (!user) return
  const ok = await run(
    () => admin.setPassword(user.id, password),
    `Contraseña cambiada. ${user.full_name} ya puede entrar con la nueva.`,
  )
  if (ok) userPanel.value?.reset()
}

async function setActive(active: boolean) {
  const user = selected.value
  if (!user) return
  await run(
    () => admin.setActive(user.id, active),
    active ? `${user.full_name} puede volver a entrar.` : `${user.full_name} ya no puede entrar.`,
  )
}

function select(user: UserProfile) {
  error.value = null
  notice.value = null
  selectedId.value = selectedId.value === user.id ? null : user.id
}

function showNewUser() {
  error.value = null
  notice.value = null
  selectedId.value = null
}

async function logout() {
  await auth.signOut()
  router.replace({ name: 'login' })
}

onMounted(load)
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden">
    <TopBar :date="today" :name="auth.profile?.full_name ?? ''" @logout="logout">
      <AdminNav />
    </TopBar>

    <div v-if="status !== 'ready'" class="grid flex-1 place-items-center p-6">
      <div class="flex max-w-md flex-col items-center gap-4 text-center">
        <p class="text-2xl font-extrabold" :class="{ 'text-danger': status === 'failed' }">
          {{ status === 'loading' ? 'Cargando usuarios…' : 'Sin conexión' }}
        </p>
        <template v-if="status === 'failed'">
          <p class="text-lg text-ink-2">
            No se pudo traer la lista de usuarios. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="btn-primary" @click="load">Reintentar</button>
        </template>
      </div>
    </div>

    <main
      v-else
      class="min-h-0 flex-1 overflow-y-auto p-3 wide:grid wide:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] wide:gap-3 wide:overflow-hidden tall:flex tall:flex-col tall:overflow-hidden"
    >
      <section class="panel flex min-h-0 flex-col tall:flex-1" aria-label="Lista de usuarios">
        <div class="flex min-h-18 flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div class="flex flex-col">
            <h1 class="text-xl font-extrabold">Usuarios</h1>
            <p class="text-ink-2">
              {{ activeDrivers }}
              {{ activeDrivers === 1 ? 'repartidor activo' : 'repartidores activos' }}
            </p>
          </div>
          <button
            v-if="selected"
            type="button"
            class="btn-secondary"
            :disabled="busy"
            @click="showNewUser"
          >
            <StrokeIcon name="plus" class="text-xl" />
            <span>Nuevo usuario</span>
          </button>
        </div>

        <UsersBoard
          class="min-h-64 flex-1 border-t border-line wide:min-h-0 tall:min-h-0"
          :users="users"
          :selected-id="selectedId"
          @select="select"
        />
      </section>

      <section
        class="panel mt-3 shrink-0 p-4 wide:mt-0 wide:min-h-0 wide:overflow-y-auto tall:max-h-[55%] tall:overflow-y-auto"
        aria-label="Detalle del usuario"
      >
        <UserPanel
          v-if="selected"
          ref="userPanel"
          :user="selected"
          :is-self="selected.id === auth.profile?.id"
          :busy="busy"
          :error="error"
          :notice="notice"
          @set-password="setPassword"
          @set-active="setActive"
          @close="showNewUser"
        />
        <NewUserPanel
          v-else
          ref="newUserPanel"
          :busy="busy"
          :error="error"
          :notice="notice"
          @create="create"
        />
      </section>
    </main>
  </div>
</template>
