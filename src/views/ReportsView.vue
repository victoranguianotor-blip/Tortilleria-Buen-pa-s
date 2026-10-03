<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AdminNav from '@/components/AdminNav.vue'
import DayPicker from '@/components/DayPicker.vue'
import DriversBoard, { type DriverRow } from '@/components/DriversBoard.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import TopBar from '@/components/TopBar.vue'
import { useDayQuery } from '@/composables/dayQuery'
import * as admin from '@/services/admin'
import type { RouteSummary } from '@/services/admin'
import { businessToday } from '@/services/routes'
import { fetchSales, type Sale } from '@/services/sales'
import { useAuthStore } from '@/stores/auth'
import { formatLongDate, formatShortDate } from '@/utils/date'
import { downloadBlob } from '@/utils/download'
import { errorMessage } from '@/utils/errors'
import { formatKgNumber, sumKg } from '@/utils/kg'
import { formatMoney, sumMoney } from '@/utils/money'
import { buildDayReport, reportToCsv } from '@/utils/report'
import { sumSales } from '@/utils/sales'

const auth = useAuthStore()
const router = useRouter()

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const loadingDay = ref(false)
const today = ref<string | null>(null)
const summaries = ref<RouteSummary[]>([])
const sales = ref<Sale[]>([])
const exporting = ref<'pdf' | 'csv' | null>(null)
const error = ref<string | null>(null)
let request = 0

const { date, isToday, goTo } = useDayQuery(today)

const rows = computed<DriverRow[]>(() =>
  summaries.value.map((s) => ({ driverId: s.driver_id, name: s.driver_name, summary: s })),
)

const routeTotals = computed(() => ({
  initial: sumKg(summaries.value.map((s) => s.initial_kg)),
  delivered: sumKg(summaries.value.map((s) => s.delivered_kg)),
  picked: sumKg(summaries.value.map((s) => s.picked_kg)),
  received: sumMoney(summaries.value.map((s) => s.received_amount)),
  open: summaries.value.filter((s) => !s.closed_at).length,
}))
const saleTotals = computed(() => sumSales(sales.value))
const dayMoney = computed(() => sumMoney([routeTotals.value.received, saleTotals.value.amount]))
const empty = computed(() => summaries.value.length === 0 && sales.value.length === 0)

async function loadDay() {
  if (!date.value) return
  const current = ++request
  loadingDay.value = true
  try {
    const [routes, daySales] = await Promise.all([
      admin.fetchRouteSummaries(date.value),
      fetchSales(date.value),
    ])
    if (current !== request) return
    summaries.value = routes
    sales.value = daySales
  } finally {
    if (current === request) loadingDay.value = false
  }
}

async function load() {
  status.value = 'loading'
  try {
    today.value = await businessToday()
    await loadDay()
    status.value = 'ready'
  } catch {
    status.value = 'failed'
  }
}

async function exportReport(format: 'pdf' | 'csv') {
  const day = date.value
  if (!day || exporting.value) return
  exporting.value = format
  error.value = null
  try {
    await loadDay()
    const routes = summaries.value
    const deliveries = await admin.fetchDeliveriesOfRoutes(routes.map((r) => r.route_id))
    const report = buildDayReport(day, routes, deliveries, sales.value)
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

function changeDay(next: string) {
  error.value = null
  goTo(next)
}

watch(date, (next, previous) => {
  if (previous && next !== previous) loadDay().catch((e) => (error.value = errorMessage(e)))
})

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
          {{ status === 'loading' ? 'Cargando el reporte…' : 'Sin conexión' }}
        </p>
        <template v-if="status === 'failed'">
          <p class="text-lg text-ink-2">
            No se pudo traer el reporte. Revisa la señal e inténtalo otra vez.
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
        class="panel flex min-h-0 flex-col tall:max-h-[60%] tall:flex-[0_1_auto]"
        aria-label="Resumen del reporte"
      >
        <div class="flex flex-wrap items-center gap-3 px-3 pt-3 pb-3 sm:px-4">
          <h1 class="sr-only">Reporte del {{ date ? formatShortDate(date) : '' }}</h1>
          <DayPicker v-if="date && today" :date="date" :today="today" @change="changeDay" />
        </div>

        <div class="groups">
          <div class="group">
            <h2 class="label">Rutas</h2>
            <dl class="figures">
              <div>
                <dt class="label">Salió</dt>
                <dd class="figure-value text-2xl">{{ formatKgNumber(routeTotals.initial) }}</dd>
              </div>
              <div>
                <dt class="label">Entregado</dt>
                <dd class="figure-value text-2xl">{{ formatKgNumber(routeTotals.delivered) }}</dd>
              </div>
              <div>
                <dt class="label">Recogido</dt>
                <dd class="figure-value text-2xl">{{ formatKgNumber(routeTotals.picked) }}</dd>
              </div>
              <div>
                <dt class="label">Cobrado</dt>
                <dd class="figure-value text-2xl">{{ formatMoney(routeTotals.received) }}</dd>
              </div>
            </dl>
          </div>
          <div class="group">
            <h2 class="label">Mostrador</h2>
            <dl class="figures">
              <div>
                <dt class="label">Ventas</dt>
                <dd class="figure-value text-2xl">{{ saleTotals.count }}</dd>
              </div>
              <div>
                <dt class="label">Vendido</dt>
                <dd class="figure-value text-2xl">{{ formatKgNumber(saleTotals.kg) }}</dd>
              </div>
              <div>
                <dt class="label">Cobrado</dt>
                <dd class="figure-value text-2xl">{{ formatMoney(saleTotals.amount) }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <DriversBoard
          class="min-h-48 flex-1 border-t border-line wide:min-h-0 tall:min-h-24"
          :rows="rows"
          :selected-id="null"
          :empty-text="isToday ? 'Todavía no sale nadie a ruta.' : 'Nadie salió a ruta este día.'"
        />
      </section>

      <section
        class="panel mt-3 flex min-h-0 flex-col gap-4 p-4 wide:mt-0 wide:overflow-y-auto"
        aria-label="Descargar reporte"
      >
        <h2 class="text-xl font-extrabold">Reporte del día</h2>
        <p v-if="date" class="text-lg text-ink-2">{{ formatLongDate(date) }}</p>

        <div class="total">
          <p class="label">Dinero del día</p>
          <p class="figure-value text-3xl">{{ formatMoney(dayMoney) }}</p>
          <p class="text-ink-2">
            {{ formatMoney(routeTotals.received) }} de recolecciones y
            {{ formatMoney(saleTotals.amount) }} de mostrador.
          </p>
        </div>

        <p v-if="routeTotals.open > 0" class="warn" role="status">
          {{
            routeTotals.open === 1
              ? 'Hay 1 ruta abierta'
              : `Hay ${routeTotals.open} rutas abiertas`
          }}: sus cifras todavía pueden cambiar.
        </p>
        <p v-if="empty" class="text-ink-2">No hay movimientos este día.</p>
        <p v-else class="text-ink-2">
          Incluye cada movimiento de las rutas, el balance por tienda y las ventas de mostrador.
        </p>

        <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-3">
          <button
            v-for="format in ['pdf', 'csv'] as const"
            :key="format"
            type="button"
            class="btn-primary min-w-40 flex-1"
            :aria-label="`Descargar reporte del día en ${format.toUpperCase()}`"
            :disabled="empty || exporting !== null || loadingDay"
            @click="exportReport(format)"
          >
            <StrokeIcon v-if="exporting !== format" name="download" class="text-xl" />
            <span>{{
              exporting === format ? 'Generando…' : `Descargar ${format.toUpperCase()}`
            }}</span>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.groups {
  display: grid;
  border-block: 1px solid var(--color-line);
}
.group + .group {
  border-top: 1px solid var(--color-line);
}
.group > .label {
  padding: 0.65rem clamp(0.6rem, 1.2vw, 1rem) 0;
}
.figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
}
.figures > div {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem clamp(0.6rem, 1.2vw, 1rem) 0.65rem;
  overflow: hidden;
}
.total {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-line);
  border-radius: 6px;
}
.warn {
  color: var(--color-signal);
  font-weight: 700;
}
</style>
