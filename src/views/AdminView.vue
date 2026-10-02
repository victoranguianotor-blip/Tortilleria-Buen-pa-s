<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AdminNav from '@/components/AdminNav.vue'
import DriversBoard, { type DriverRow } from '@/components/DriversBoard.vue'
import PricePanel from '@/components/PricePanel.vue'
import RouteDetail from '@/components/RouteDetail.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import TopBar from '@/components/TopBar.vue'
import * as admin from '@/services/admin'
import type { RouteSummary, UserProfile } from '@/services/admin'
import { businessToday, fetchDeliveries, type Delivery } from '@/services/routes'
import { fetchPricePerKg, updatePricePerKg } from '@/services/settings'
import { useAuthStore } from '@/stores/auth'
import { addDays, colimaTime, formatShortDate } from '@/utils/date'
import { downloadBlob } from '@/utils/download'
import { errorMessage } from '@/utils/errors'
import { formatKgNumber, roundKg, sumKg } from '@/utils/kg'
import { formatMoney, sumMoney } from '@/utils/money'
import { buildDayReport, reportToCsv } from '@/utils/report'

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
const exporting = ref<'pdf' | 'csv' | null>(null)
const pricePerKg = ref<number | null>(null)
const editingPrice = ref(false)
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
    received: sumMoney(summaries.value.map((s) => s.received_amount)),
    picked: sumKg(summaries.value.map((s) => s.picked_kg)),
    closed: summaries.value.filter((s) => s.closed_at).length,
  }
})

async function load() {
  status.value = 'loading'
  try {
    today.value = await businessToday()
    ;[users.value, pricePerKg.value] = await Promise.all([admin.fetchUsers(), fetchPricePerKg()])
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
  editingPrice.value = false
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

function editPrice() {
  error.value = null
  editingPrice.value = true
}

async function savePrice(price: number) {
  busy.value = true
  error.value = null
  try {
    pricePerKg.value = await updatePricePerKg(price)
    editingPrice.value = false
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

function cancelPrice() {
  error.value = null
  editingPrice.value = false
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

async function exportReport(format: 'pdf' | 'csv') {
  const day = date.value
  if (!day || exporting.value) return
  exporting.value = format
  error.value = null
  try {
    await refresh()
    const routes = summaries.value
    const deliveries = await admin.fetchDeliveriesOfRoutes(routes.map((r) => r.route_id))
    const report = buildDayReport(day, routes, deliveries)
    if (format === 'csv') {
      downloadBlob(
        new Blob([reportToCsv(report)], { type: 'text/csv;charset=utf-8' }),
        `reporte-${day}.csv`,
      )
    } else {
      const { reportToPdf } = await import('@/utils/reportPdf')
      downloadBlob(await reportToPdf(report), `reporte-${day}.pdf`)
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    exporting.value = null
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
      <div class="flex max-w-md flex-col items-center gap-4 text-center">
        <p class="text-2xl font-extrabold" :class="{ 'text-danger': status === 'failed' }">
          {{ status === 'loading' ? 'Cargando el resumen…' : 'Sin conexión' }}
        </p>
        <template v-if="status === 'failed'">
          <p class="text-lg text-ink-2">
            No se pudo traer el resumen. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="btn-primary" @click="load">Reintentar</button>
        </template>
      </div>
    </div>

    <main
      v-else
      class="min-h-0 flex-1 overflow-y-auto p-3 wide:grid wide:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] wide:gap-3 wide:overflow-hidden tall:flex tall:flex-col tall:overflow-hidden"
    >
      <section
        class="panel flex min-h-0 flex-col tall:max-h-[55%] tall:flex-[0_1_auto]"
        aria-label="Resumen del día"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-3 pt-3 pb-3 sm:px-4">
          <div class="flex items-center gap-1">
            <h1 class="sr-only">Rutas del {{ date ? formatShortDate(date) : '' }}</h1>
            <button
              type="button"
              class="btn-secondary quiet size-12 p-0!"
              aria-label="Día anterior"
              @click="goTo(addDays(date!, -1))"
            >
              <StrokeIcon name="chevron-left" class="text-2xl" />
            </button>
            <button
              type="button"
              class="relative min-h-12 rounded-md px-2 text-xl font-extrabold"
              :class="{ 'text-signal': !isToday }"
              aria-label="Elegir día"
              @click="openPicker"
            >
              {{ formatShortDate(date!) }}
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
              class="btn-secondary quiet size-12 p-0! disabled:opacity-40"
              aria-label="Día siguiente"
              :disabled="isToday"
              @click="goTo(addDays(date!, 1))"
            >
              <StrokeIcon name="chevron-right" class="text-2xl" />
            </button>
            <button v-if="!isToday" type="button" class="btn-secondary ml-1" @click="goTo(today!)">
              Hoy
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn-secondary"
              :class="{ 'border-signal!': editingPrice }"
              :aria-label="
                pricePerKg
                  ? `Precio base ${formatMoney(pricePerKg)} por kilo. Tocar para cambiarlo`
                  : 'Poner precio base por kilo'
              "
              @click="editPrice"
            >
              <StrokeIcon name="pencil" class="text-lg" />
              <span class="tabular-nums">{{
                pricePerKg ? `${formatMoney(pricePerKg)}/kg` : 'Precio base'
              }}</span>
            </button>
            <button
              type="button"
              class="btn-secondary quiet px-2!"
              :disabled="refreshing"
              @click="refreshNow"
            >
              <StrokeIcon name="refresh" class="text-xl" :class="{ 'animate-spin': refreshing }" />
              <span v-if="updatedAt" class="tabular-nums">{{ colimaTime(updatedAt) }}</span>
              <span class="sr-only">Actualizar</span>
            </button>
            <button
              v-for="format in ['pdf', 'csv'] as const"
              :key="format"
              type="button"
              class="btn-secondary disabled:opacity-40"
              :aria-label="`Descargar reporte del día en ${format.toUpperCase()}`"
              :disabled="summaries.length === 0 || exporting !== null"
              @click="exportReport(format)"
            >
              <StrokeIcon name="download" class="text-xl" />
              <span>{{ exporting === format ? '…' : format.toUpperCase() }}</span>
            </button>
          </div>
        </div>

        <dl class="figures">
          <div>
            <dt class="label">Salió</dt>
            <dd class="figure-value text-2xl">{{ formatKgNumber(totals.initial) }}</dd>
          </div>
          <div>
            <dt class="label">Entregado</dt>
            <dd class="figure-value text-2xl">{{ formatKgNumber(totals.delivered) }}</dd>
          </div>
          <div>
            <dt class="label">{{ isToday ? 'Quedan' : 'Regresó' }}</dt>
            <dd class="figure-value text-2xl" :class="{ 'text-danger': totals.remaining < 0 }">
              {{ formatKgNumber(totals.remaining) }}
            </dd>
          </div>
          <div>
            <dt class="label">Recogido</dt>
            <dd class="figure-value text-2xl">{{ formatKgNumber(totals.picked) }}</dd>
          </div>
          <div>
            <dt class="label">Cobrado</dt>
            <dd class="figure-value text-2xl">{{ formatMoney(totals.received) }}</dd>
          </div>
          <div>
            <dt class="label">Cerradas</dt>
            <dd class="figure-value text-2xl">{{ totals.closed }} de {{ summaries.length }}</dd>
          </div>
        </dl>

        <DriversBoard
          class="min-h-64 flex-1 wide:min-h-0 tall:min-h-24"
          :rows="rows"
          :selected-id="selectedId"
          :empty-text="isToday ? 'No hay repartidores activos.' : 'Nadie salió a ruta este día.'"
          @select="select"
        />
      </section>

      <section
        class="panel mt-3 flex min-h-0 flex-col p-4 wide:mt-0 tall:flex-1"
        aria-label="Detalle de la ruta"
      >
        <PricePanel
          v-if="editingPrice"
          :current-price="pricePerKg"
          :busy="busy"
          :error="error"
          @confirm="savePrice"
          @cancel="cancelPrice"
        />
        <RouteDetail
          v-else-if="selected"
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
          <p class="text-ink-2">Toca un repartidor para ver sus paradas.</p>
          <p v-if="error" class="error-alert" role="alert">{{ error }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid var(--color-line);
}
.figures > div {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem clamp(0.6rem, 1.2vw, 1rem);
  overflow: hidden;
}
.figures > div:not(:nth-child(3n + 1)) {
  border-left: 1px solid var(--color-line);
}
.figures > div:nth-child(n + 4) {
  border-top: 1px solid var(--color-line);
}

@media (max-width: 640px) {
  .figures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .figures > div:nth-child(odd) {
    border-left: none;
  }
  .figures > div:nth-child(even) {
    border-left: 1px solid var(--color-line);
  }
  .figures > div:nth-child(n + 3) {
    border-top: 1px solid var(--color-line);
  }
}
</style>
