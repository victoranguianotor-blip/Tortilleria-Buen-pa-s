<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import DeliveryPanel from '@/components/DeliveryPanel.vue'
import FlapText from '@/components/FlapText.vue'
import LoadPanel from '@/components/LoadPanel.vue'
import StatusLamp from '@/components/StatusLamp.vue'
import StopsBoard from '@/components/StopsBoard.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import TopBar from '@/components/TopBar.vue'
import { useTwoTapConfirm } from '@/composables/twoTapConfirm'
import type { Delivery } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'
import { useRouteStore } from '@/stores/route'
import { colimaTime } from '@/utils/date'
import { errorMessage } from '@/utils/errors'
import { formatKg, formatKgNumber, roundKg } from '@/utils/kg'
import { routeStatus } from '@/utils/status'

const auth = useAuthStore()
const store = useRouteStore()
const router = useRouter()

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const busy = ref(false)
const error = ref<string | null>(null)
const selected = ref<Delivery | null>(null)
const editingLoad = ref(false)
const newDeliveryId = ref<string | null>(null)
const deliveryPanel = ref<InstanceType<typeof DeliveryPanel> | null>(null)
const closeConfirm = useTwoTapConfirm()

const isOpen = computed(() => store.route !== null && !store.isClosed)
const overDelivery = computed(() => store.remainingKg < 0)

const lamp = computed(() => routeStatus(store.route, store.remainingKg))

const stopNumber = computed(() => {
  if (!selected.value) return store.deliveries.length + 1
  return store.deliveries.findIndex((d) => d.id === selected.value?.id) + 1
})

// While editing a stop, its own kilos count as still available.
const availableKg = computed(() => roundKg(store.remainingKg + (selected.value?.delivered_kg ?? 0)))

async function load() {
  status.value = 'loading'
  try {
    await store.load(auth.profile!.id)
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
    error.value = errorMessage(e)
    return false
  } finally {
    busy.value = false
  }
}

async function startRoute(kg: number) {
  await run(() => store.start(kg))
}

async function saveLoad(kg: number) {
  if (await run(() => store.updateInitialKg(kg))) editingLoad.value = false
}

async function saveDelivery(stopName: string, kg: number) {
  const editing = selected.value
  const ok = await run(async () => {
    if (editing) {
      await store.updateDelivery(editing.id, stopName, kg)
      newDeliveryId.value = null
    } else {
      newDeliveryId.value = (await store.addDelivery(stopName, kg)).id
    }
  })
  if (!ok) return
  selected.value = null
  deliveryPanel.value?.reset()
}

async function deleteDelivery() {
  const id = selected.value?.id
  if (id && (await run(() => store.removeDelivery(id)))) selected.value = null
}

function select(d: Delivery) {
  error.value = null
  editingLoad.value = false
  selected.value = selected.value?.id === d.id ? null : d
}

function cancelEdit() {
  error.value = null
  selected.value = null
  editingLoad.value = false
}

function editLoad() {
  if (!isOpen.value) return
  error.value = null
  selected.value = null
  editingLoad.value = true
}

function closeRoute() {
  closeConfirm.tap(() => run(() => store.close()))
}

async function logout() {
  await auth.signOut()
  store.reset()
  router.replace({ name: 'login' })
}

onMounted(load)
</script>

<template>
  <div class="relative flex h-dvh flex-col overflow-hidden">
    <TopBar :date="store.today" :name="auth.profile?.full_name ?? ''" @logout="logout" />

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
            No se pudo traer tu ruta. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="btn-primary" @click="load">Reintentar</button>
        </template>
      </div>
    </div>

    <main
      v-else
      class="relative min-h-0 flex-1 overflow-y-auto p-3 wide:grid wide:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] wide:gap-4 wide:overflow-hidden wide:p-4 tall:flex tall:flex-col tall:overflow-hidden"
    >
      <section
        class="board-frame flex min-h-0 flex-col rounded-lg tall:flex-1"
        aria-label="Tablero de la ruta"
      >
        <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 pb-3">
          <div class="flex flex-col gap-2">
            <h1 class="caption">Quedan</h1>
            <div class="flex items-end gap-3">
              <FlapText
                :text="store.route ? formatKgNumber(store.remainingKg) : '--'"
                :cells="5"
                align="right"
                size="xl"
                :tone="overDelivery ? 'danger' : 'ink'"
              />
              <span class="caption pb-3 text-base!">kg</span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <StatusLamp :text="lamp.text" :tone="lamp.tone" />
            <button
              v-if="isOpen"
              type="button"
              class="btn-steel min-h-12! px-3!"
              :class="closeConfirm.armed.value ? 'danger' : 'border-transparent! text-steel-2!'"
              :disabled="busy"
              @click="closeRoute"
            >
              {{ closeConfirm.armed.value ? '¿Cerrar? Toca otra vez' : 'Cerrar ruta' }}
            </button>
          </div>
        </div>

        <div class="figures">
          <button
            type="button"
            class="figure text-left"
            :disabled="!isOpen"
            :class="{ active: editingLoad }"
            :aria-label="`Salió con ${store.route ? formatKgNumber(store.route.initial_kg) : 0} kilos${isOpen ? '. Tocar para corregir' : ''}`"
            @click="editLoad"
          >
            <span class="caption flex items-center gap-1.5">
              Salió
              <StrokeIcon v-if="isOpen" name="pencil" class="text-steel-2" />
            </span>
            <span>
              <FlapText
                :text="store.route ? formatKgNumber(store.route.initial_kg) : '--'"
                :cells="5"
                align="right"
                size="md"
                :tone="editingLoad ? 'amber' : 'ink'"
              />
            </span>
          </button>
          <div class="figure">
            <span class="caption">Entregado</span>
            <span>
              <FlapText
                :text="formatKgNumber(store.deliveredKg)"
                :cells="5"
                align="right"
                size="md"
              />
            </span>
          </div>
          <div class="figure">
            <span class="caption">Paradas</span>
            <span>
              <FlapText
                :text="String(store.deliveries.length)"
                :cells="2"
                align="right"
                size="md"
              />
            </span>
          </div>
        </div>

        <StopsBoard
          class="min-h-64 flex-1 wide:min-h-0 tall:min-h-0"
          :deliveries="store.deliveries"
          :selected-id="selected?.id ?? null"
          :new-id="newDeliveryId"
          :editable="isOpen"
          @select="select"
        />
      </section>

      <section
        class="board-frame mt-3 shrink-0 rounded-lg p-4 wide:mt-0 wide:min-h-0 wide:overflow-y-auto"
        aria-label="Captura"
      >
        <LoadPanel
          v-if="!store.route"
          mode="start"
          :busy="busy"
          :error="error"
          @confirm="startRoute"
        />

        <div v-else-if="store.isClosed" class="flex flex-col gap-5">
          <h2><FlapText text="Ruta cerrada" size="md" tone="steel" /></h2>
          <dl class="summary">
            <div>
              <dt class="caption">Cerró</dt>
              <dd><FlapText :text="colimaTime(store.route.closed_at!)" size="lg" /></dd>
            </div>
            <div>
              <dt class="caption">Salió</dt>
              <dd>
                <FlapText
                  :text="formatKgNumber(store.route.initial_kg)"
                  :cells="5"
                  align="right"
                  size="lg"
                />
              </dd>
            </div>
            <div>
              <dt class="caption">Entregó</dt>
              <dd>
                <FlapText
                  :text="formatKgNumber(store.deliveredKg)"
                  :cells="5"
                  align="right"
                  size="lg"
                />
              </dd>
            </div>
            <div>
              <dt class="caption">Regresa</dt>
              <dd>
                <FlapText
                  :text="formatKgNumber(store.remainingKg)"
                  :cells="5"
                  align="right"
                  size="lg"
                  :tone="overDelivery ? 'danger' : 'ink'"
                />
              </dd>
            </div>
          </dl>
          <p class="text-lg tracking-[0.1em] text-steel uppercase">
            ¿Te equivocaste? Pide al encargado que la reabra.
          </p>
        </div>

        <LoadPanel
          v-else-if="editingLoad"
          mode="edit"
          :current-kg="store.route.initial_kg"
          :busy="busy"
          :error="error"
          @confirm="saveLoad"
          @cancel="cancelEdit"
        />

        <DeliveryPanel
          v-else
          ref="deliveryPanel"
          :delivery="selected"
          :stop-number="stopNumber"
          :available-kg="availableKg"
          :stop-suggestions="store.recentStops"
          :busy="busy"
          :error="error"
          @save="saveDelivery"
          @delete="deleteDelivery"
          @cancel="cancelEdit"
        />
      </section>
      <p class="sr-only" aria-live="polite">
        <template v-if="store.route">Quedan {{ formatKg(store.remainingKg) }}</template>
      </p>
    </main>
  </div>
</template>

<style scoped>
.summary {
  display: grid;
  gap: 0.9rem;
}
.summary > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--color-steel-3);
}

.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid var(--color-steel-3);
}

.figure {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem clamp(0.6rem, 1.5vw, 1rem);
}
.figure + .figure {
  border-left: 1px solid var(--color-steel-3);
}
button.figure:not(:disabled):active,
button.figure.active {
  background: var(--color-amber-dark);
}
</style>
