<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AdminNav from '@/components/AdminNav.vue'
import DriversBoard, { type DriverRow } from '@/components/DriversBoard.vue'
import FlapText from '@/components/FlapText.vue'
import RouteDetail from '@/components/RouteDetail.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import TopBar from '@/components/TopBar.vue'
import * as admin from '@/services/admin'
import type { RouteSummary, UserProfile } from '@/services/admin'
import { businessToday, fetchDeliveries, type Delivery } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'
import { addDays, colimaTime, formatShortDate } from '@/utils/date'
import { errorMessage } from '@/utils/errors'
import { formatKgNumber, roundKg, sumKg } from '@/utils/kg'

const REFRESH_MS = 60_000
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const today = ref<string | null>(null)
const summaries = ref<RouteSummary[]>([])
const users = ref<UserProfile[]>([])
const updatedAt = ref<Date | null>(null)
const refreshing = ref(false)
const selectedId = ref<string | null>(null)
const deliveries = ref<Delivery[] | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const datePicker = ref<HTMLInputElement | null>(null)
let request = 0

const date = computed(() => {
  const q = route.query.date
  if (typeof q === 'string' && ISO_DATE_RE.test(q) && today.value && q <= today.value) return q
  return today.value
})
const isToday = computed(() => date.value === today.value)

const rows = computed<DriverRow[]>(() => {
  const withRoute = summaries.value.map((s) => ({
    driverId: s.driver_id,
    name: s.driver_name,
    summary: s,
  }))
  if (!isToday.value) return withRoute
  const started = new Set(summaries.value.map((s) => s.driver_id))
  const idle = users.value
    .filter((u) => u.role === 'driver' && u.active && !started.has(u.id))
    .map((u) => ({ driverId: u.id, name: u.full_name, summary: null }))
  return [...withRoute, ...idle]
})
const selected = computed(() => rows.value.find((r) => r.driverId === selectedId.value) ?? null)

const totals = computed(() => {
  const initial = sumKg(summaries.value.map((s) => s.initial_kg))
  const delivered = sumKg(summaries.value.map((s) => s.delivered_kg))
  return {
    initial,
    delivered,
    remaining: roundKg(initial - delivered),
    closed: summaries.value.filter((s) => s.closed_at).length,
  }
})

async function load() {
  status.value = 'loading'
  try {
    today.value = await businessToday()
    users.value = await admin.fetchUsers()
    await refresh()
    status.value = 'ready'
  } catch {
    status.value = 'failed'
  }
}

async function refresh() {
  if (!date.value) return
  const current = ++request
  refreshing.value = true
  try {
    const data = await admin.fetchRouteSummaries(date.value)
    if (current !== request) return
    summaries.value = data
    updatedAt.value = new Date()
    await loadDeliveries()
  } finally {
    if (current === request) refreshing.value = false
  }
}

async function loadDeliveries() {
  const routeId = selected.value?.summary?.route_id
  if (!routeId) {
    deliveries.value = null
    return
  }
  const data = await fetchDeliveries(routeId)
  if (selected.value?.summary?.route_id === routeId) deliveries.value = data
}

async function refreshNow() {
  error.value = null
  try {
    await refresh()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

function select(driverId: string) {
  error.value = null
  if (selectedId.value === driverId) return
  selectedId.value = driverId
  deliveries.value = null
  loadDeliveries().catch((e) => (error.value = errorMessage(e)))
}

function goTo(next: string) {
  if (!today.value || next > today.value) return
  selectedId.value = null
  deliveries.value = null
  error.value = null
  router.replace({ query: next === today.value ? {} : { date: next } })
}

function openPicker() {
  const input = datePicker.value
  if (!input) return
  if (typeof input.showPicker === 'function') input.showPicker()
  else input.click()
}

async function reopen() {
  const routeId = selected.value?.summary?.route_id
  if (!routeId) return
  busy.value = true
  error.value = null
  try {
    await admin.reopenRoute(routeId)
    await refresh()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

watch(date, (next, previous) => {
  if (previous && next !== previous) refreshNow()
})

const timer = setInterval(() => {
  if (status.value === 'ready' && isToday.value && document.visibilityState === 'visible') {
    refresh().catch(() => {})
  }
}, REFRESH_MS)
onBeforeUnmount(() => clearInterval(timer))

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
      <div class="flex flex-col items-center gap-6 text-center">
        <FlapText
          :text="status === 'loading' ? 'Cargando' : 'Sin conexión'"
          size="lg"
          :tone="status === 'loading' ? 'steel' : 'danger'"
          animate
        />
        <template v-if="status === 'failed'">
          <p class="max-w-md text-xl text-steel">
            No se pudo traer el resumen. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="btn-primary" @click="load">Reintentar</button>
        </template>
      </div>
    </div>

    <main
      v-else
      class="min-h-0 flex-1 overflow-y-auto p-3 wide:grid wide:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] wide:gap-4 wide:overflow-hidden wide:p-4 tall:flex tall:flex-col tall:overflow-hidden"
    >
      <section
        class="board-frame flex min-h-0 flex-col rounded-lg tall:flex-1"
        aria-label="Resumen del día"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div class="flex items-center gap-2">
            <h1 class="sr-only">Rutas del {{ date ? formatShortDate(date) : '' }}</h1>
            <button
              type="button"
              class="btn-steel size-12 min-h-12! p-0!"
              aria-label="Día anterior"
              @click="goTo(addDays(date!, -1))"
            >
              <StrokeIcon name="chevron-left" class="text-2xl" />
            </button>
            <button
              type="button"
              class="relative min-h-12 rounded-md px-1"
              aria-label="Elegir día"
              @click="openPicker"
            >
              <FlapText :text="formatShortDate(date!)" :tone="isToday ? 'ink' : 'amber'" />
              <input
                ref="datePicker"
                type="date"
                class="pointer-events-none absolute inset-0 opacity-0"
                tabindex="-1"
                aria-hidden="true"
                :value="date"
                :max="today ?? undefined"
                @change="goTo(($event.target as HTMLInputElement).value || today!)"
              />
            </button>
            <button
              type="button"
              class="btn-steel size-12 min-h-12! p-0!"
              aria-label="Día siguiente"
              :disabled="isToday"
              :class="{ 'opacity-40': isToday }"
              @click="goTo(addDays(date!, 1))"
            >
              <StrokeIcon name="chevron-right" class="text-2xl" />
            </button>
            <button v-if="!isToday" type="button" class="btn-steel min-h-12!" @click="goTo(today!)">
              Hoy
            </button>
          </div>

          <button
            type="button"
            class="btn-steel min-h-12! border-transparent! px-2! text-steel-2!"
            :disabled="refreshing"
            @click="refreshNow"
          >
            <StrokeIcon name="refresh" class="text-xl" :class="{ 'animate-spin': refreshing }" />
            <span v-if="updatedAt">{{ colimaTime(updatedAt) }}</span>
            <span class="sr-only">Actualizar</span>
          </button>
        </div>

        <dl class="figures">
          <div>
            <dt class="caption">Salió</dt>
            <dd>
              <FlapText :text="formatKgNumber(totals.initial)" :cells="6" align="right" />
            </dd>
          </div>
          <div>
            <dt class="caption">Entregado</dt>
            <dd>
              <FlapText :text="formatKgNumber(totals.delivered)" :cells="6" align="right" />
            </dd>
          </div>
          <div>
            <dt class="caption">{{ isToday ? 'Quedan' : 'Regresó' }}</dt>
            <dd>
              <FlapText
                :text="formatKgNumber(totals.remaining)"
                :cells="6"
                align="right"
                :tone="totals.remaining < 0 ? 'danger' : 'ink'"
              />
            </dd>
          </div>
          <div>
            <dt class="caption">Cerradas</dt>
            <dd>
              <FlapText :text="`${totals.closed}/${summaries.length}`" :cells="5" align="right" />
            </dd>
          </div>
        </dl>

        <DriversBoard
          class="min-h-64 flex-1 wide:min-h-0 tall:min-h-0"
          :rows="rows"
          :selected-id="selectedId"
          :empty-text="isToday ? 'No hay repartidores activos.' : 'Nadie salió a ruta este día.'"
          @select="select"
        />
      </section>

      <section
        class="board-frame mt-3 flex min-h-0 flex-col rounded-lg p-4 wide:mt-0 tall:max-h-[45%]"
        aria-label="Detalle de la ruta"
      >
        <RouteDetail
          v-if="selected"
          class="flex-1"
          :name="selected.name"
          :summary="selected.summary"
          :deliveries="deliveries"
          :is-today="isToday"
          :busy="busy"
          :error="error"
          @reopen="reopen"
        />
        <div v-else class="grid flex-1 place-items-center gap-3 py-8 text-center">
          <p class="caption text-base!">Toca un repartidor para ver sus paradas</p>
          <p v-if="error" class="error-alert" role="alert">{{ error }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-block: 1px solid var(--color-steel-3);
}
.figures > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem clamp(0.5rem, 1.2vw, 1rem);
  overflow: hidden;
}
.figures > div + div {
  border-left: 1px solid var(--color-steel-3);
}

@media (max-width: 640px) {
  .figures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .figures > div:nth-child(3) {
    border-left: none;
  }
  .figures > div:nth-child(n + 3) {
    border-top: 1px solid var(--color-steel-3);
  }
}
</style>
