<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AdminNav from '@/components/AdminNav.vue'
import SalePanel from '@/components/SalePanel.vue'
import SalesBoard from '@/components/SalesBoard.vue'
import TopBar from '@/components/TopBar.vue'
import { businessToday } from '@/services/routes'
import * as salesService from '@/services/sales'
import type { Sale, SaleInput } from '@/services/sales'
import { fetchPrices } from '@/services/settings'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errors'
import { formatKgNumber } from '@/utils/kg'
import { formatMoney } from '@/utils/money'
import { sumSales } from '@/utils/sales'

const auth = useAuthStore()
const router = useRouter()

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const today = ref<string | null>(null)
const sales = ref<Sale[]>([])
const pricePerKg = ref<number | null>(null)
const selected = ref<Sale | null>(null)
const newSaleId = ref<string | null>(null)
const salePanel = ref<InstanceType<typeof SalePanel> | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)

const totals = computed(() => sumSales(sales.value))
const saleNumber = computed(() => {
  if (!selected.value) return sales.value.length + 1
  return sales.value.findIndex((s) => s.id === selected.value?.id) + 1
})

async function load() {
  status.value = 'loading'
  try {
    today.value = await businessToday()
    sales.value = await salesService.fetchSales(today.value)
    pricePerKg.value = await fetchPrices()
      .then((p) => p.counterPrice)
      .catch(() => null)
    status.value = 'ready'
  } catch {
    status.value = 'failed'
  }
}

async function run(action: () => Promise<unknown>) {
  busy.value = true
  error.value = null
  try {
    await action()
    return true
  } catch (e) {
    const code = (e as { code?: string } | null)?.code
    error.value =
      code === '42501' || code === 'PGRST116'
        ? 'No se guardó: solo se pueden corregir las ventas de hoy.'
        : errorMessage(e)
    return false
  } finally {
    busy.value = false
  }
}

async function save(input: SaleInput) {
  const editing = selected.value
  const ok = await run(async () => {
    if (editing) {
      const updated = await salesService.updateSale(editing.id, input)
      sales.value = sales.value.map((s) => (s.id === editing.id ? updated : s))
      newSaleId.value = null
    } else {
      const created = await salesService.createSale(input)
      sales.value = [...sales.value, created]
      markNew(created.id)
    }
  })
  if (!ok) return
  selected.value = null
  salePanel.value?.reset()
}

let newTimer: ReturnType<typeof setTimeout> | undefined
function markNew(id: string) {
  newSaleId.value = id
  clearTimeout(newTimer)
  newTimer = setTimeout(() => (newSaleId.value = null), 1400)
}
onBeforeUnmount(() => clearTimeout(newTimer))

async function remove() {
  const id = selected.value?.id
  if (!id) return
  if (await run(() => salesService.deleteSale(id))) {
    sales.value = sales.value.filter((s) => s.id !== id)
    selected.value = null
  }
}

function select(sale: Sale) {
  error.value = null
  selected.value = selected.value?.id === sale.id ? null : sale
}

function cancelEdit() {
  error.value = null
  selected.value = null
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
          {{ status === 'loading' ? 'Cargando las ventas…' : 'Sin conexión' }}
        </p>
        <template v-if="status === 'failed'">
          <p class="text-lg text-ink-2">
            No se pudieron traer las ventas. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="btn-primary" @click="load">Reintentar</button>
        </template>
      </div>
    </div>

    <main
      v-else
      class="min-h-0 flex-1 overflow-y-auto p-3 wide:grid wide:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] wide:gap-3 wide:overflow-hidden tall:flex tall:flex-col tall:overflow-hidden"
    >
      <section class="panel flex min-h-0 flex-col tall:flex-1" aria-label="Ventas del día">
        <h1 class="label px-4 pt-4 pb-3">Ventas de hoy</h1>

        <dl class="figures">
          <div>
            <dt class="label">Vendido</dt>
            <dd class="figure-value text-2xl">{{ formatKgNumber(totals.kg) }} kg</dd>
          </div>
          <div>
            <dt class="label">Cobrado</dt>
            <dd class="figure-value text-2xl">{{ formatMoney(totals.amount) }}</dd>
          </div>
          <div>
            <dt class="label">Ventas</dt>
            <dd class="figure-value text-2xl">{{ totals.count }}</dd>
          </div>
        </dl>

        <SalesBoard
          class="max-h-80 min-h-64 flex-1 wide:max-h-none wide:min-h-0 tall:max-h-none tall:min-h-0"
          :sales="sales"
          :selected-id="selected?.id ?? null"
          :new-id="newSaleId"
          @select="select"
        />
      </section>

      <section
        class="panel mt-3 shrink-0 p-4 wide:mt-0 wide:min-h-0 wide:overflow-y-auto"
        aria-label="Captura"
      >
        <SalePanel
          ref="salePanel"
          :sale="selected"
          :sale-number="saleNumber"
          :price-per-kg="pricePerKg"
          :busy="busy"
          :error="error"
          @save="save"
          @delete="remove"
          @cancel="cancelEdit"
        />
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
.figures > div + div {
  border-left: 1px solid var(--color-line);
}
</style>
