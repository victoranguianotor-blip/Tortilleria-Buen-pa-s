<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import KgKeypad from '@/components/KgKeypad.vue'
import KgReadout from '@/components/KgReadout.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { fetchPrices, updateCounterPrice, updateStorePrice } from '@/services/settings'
import { errorMessage } from '@/utils/errors'
import { amountToValue, valueToAmount } from '@/utils/keypad'
import { formatMoney } from '@/utils/money'

type Field = 'store' | 'counter'

const status = ref<'loading' | 'ready' | 'failed'>('loading')
const saved = ref<Record<Field, number | null>>({ store: null, counter: null })
const values = ref<Record<Field, string>>({ store: '', counter: '' })
const field = ref<Field>('store')
const busy = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

const keypadValue = computed({
  get: () => values.value[field.value],
  set: (next: string) => {
    values.value[field.value] = next
    notice.value = null
  },
})

const typed = computed(() => ({
  store: valueToAmount(values.value.store),
  counter: valueToAmount(values.value.counter),
}))
// A price is saved only when it was changed and is above zero.
const changed = computed(() => ({
  store: typed.value.store > 0 && typed.value.store !== saved.value.store,
  counter: typed.value.counter > 0 && typed.value.counter !== saved.value.counter,
}))
const dirty = computed(() => changed.value.store || changed.value.counter)

const LABELS: Record<Field, string> = { store: 'A tienda', counter: 'En tortillería' }

async function load() {
  status.value = 'loading'
  try {
    const prices = await fetchPrices()
    saved.value = { store: prices.storePrice, counter: prices.counterPrice }
    values.value = {
      store: prices.storePrice ? amountToValue(prices.storePrice) : '',
      counter: prices.counterPrice ? amountToValue(prices.counterPrice) : '',
    }
    status.value = 'ready'
  } catch {
    status.value = 'failed'
  }
}

async function save() {
  if (!dirty.value || busy.value) return
  busy.value = true
  error.value = null
  notice.value = null
  try {
    if (changed.value.store) saved.value.store = await updateStorePrice(typed.value.store)
    if (changed.value.counter) saved.value.counter = await updateCounterPrice(typed.value.counter)
    notice.value = 'Precios guardados.'
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div v-if="status !== 'ready'" class="grid flex-1 place-items-center p-6">
      <div class="flex max-w-md flex-col items-center gap-4 text-center">
        <p class="text-2xl font-extrabold" :class="{ 'text-danger': status === 'failed' }">
          {{ status === 'loading' ? 'Cargando precios…' : 'Sin conexión' }}
        </p>
        <template v-if="status === 'failed'">
          <p class="text-lg text-ink-2">
            No se pudieron traer los precios. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="btn-primary" @click="load">Reintentar</button>
        </template>
      </div>
    </div>

    <main v-else class="min-h-0 flex-1 overflow-y-auto p-3">
      <section class="panel mx-auto flex max-w-xl flex-col gap-4 p-4" aria-label="Precios por kilo">
        <h1 class="text-xl font-extrabold">Precios por kilo</h1>
        <p class="text-lg text-ink-2">
          El precio a tienda se sugiere en las recolecciones de los repartidores; el de tortillería,
          en las ventas del mostrador. Quien captura puede anotar otra cantidad.
        </p>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="f in ['store', 'counter'] as const"
            :key="f"
            type="button"
            class="text-left"
            :aria-pressed="field === f"
            :disabled="busy"
            @click="field = f"
          >
            <KgReadout
              :value="values[f]"
              :label="LABELS[f]"
              unit="money"
              :active="field === f"
              selectable
              stacked
            />
          </button>
        </div>

        <KgKeypad v-model="keypadValue" unit="money" :disabled="busy" />

        <p class="text-ink-2" role="status">
          Guardado: a tienda {{ saved.store ? formatMoney(saved.store) : 'sin precio' }}, en
          tortillería {{ saved.counter ? formatMoney(saved.counter) : 'sin precio' }}.
        </p>
        <p v-if="notice" class="text-go font-bold" role="status">{{ notice }}</p>
        <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

        <button type="button" class="btn-primary w-full" :disabled="!dirty || busy" @click="save">
          <span>{{ busy ? 'Guardando…' : 'Guardar precios' }}</span>
          <StrokeIcon v-if="!busy" name="arrow" />
        </button>
      </section>
    </main>
  </div>
</template>
