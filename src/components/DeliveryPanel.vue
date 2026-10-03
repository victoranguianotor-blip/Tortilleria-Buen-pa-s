<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import KgKeypad from '@/components/KgKeypad.vue'
import KgReadout from '@/components/KgReadout.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useTwoTapConfirm } from '@/composables/twoTapConfirm'
import type { Delivery, StopInput, StopKind } from '@/services/routes'
import { amountToValue, kgToValue, valueToAmount, valueToKg } from '@/utils/keypad'
import { formatKg, roundKg } from '@/utils/kg'
import { formatMoney } from '@/utils/money'
import { pickupSuggestion } from '@/utils/pickup'

const props = defineProps<{
  delivery: Delivery | null
  stops: Delivery[]
  stopNumber: number
  availableKg: number
  pricePerKg: number | null
  stopSuggestions: string[]
  busy: boolean
  error: string | null
}>()
const emit = defineEmits<{
  save: [input: StopInput]
  delete: []
  cancel: []
}>()

const kind = ref<StopKind>('delivery')
const stopName = ref('')
const value = ref('')
const notes = ref('')
const showNotes = ref(false)
const field = ref<'kg' | 'amount'>('kg')
// Until the driver types an amount, it follows what the store owes for the kg left there.
const amountValue = ref('')
const amountEdited = ref(false)
const deleteConfirm = useTwoTapConfirm()

watch(
  () => props.delivery,
  (d) => {
    kind.value = d?.kind ?? 'delivery'
    stopName.value = d?.stop_name ?? ''
    value.value = d ? kgToValue(d.kg) : ''
    notes.value = d?.notes ?? ''
    showNotes.value = Boolean(d?.notes)
    amountValue.value = d ? amountToValue(d.received_amount) : ''
    amountEdited.value = d !== null
    field.value = 'kg'
    deleteConfirm.disarm()
  },
  { immediate: true },
)

const editing = computed(() => props.delivery !== null)
const pickup = computed(() => kind.value === 'pickup')
const kg = computed(() => valueToKg(value.value))
const suggested = computed(() =>
  pickupSuggestion(
    props.stops,
    stopName.value,
    kg.value,
    props.pricePerKg,
    props.delivery?.id ?? null,
  ),
)
const amountShown = computed(() => {
  if (amountEdited.value) return amountValue.value
  return suggested.value === null ? '' : amountToValue(suggested.value)
})
const amount = computed(() => valueToAmount(amountShown.value))
const showUseSuggested = computed(
  () => amountEdited.value && suggested.value !== null && suggested.value !== amount.value,
)

const keypadValue = computed({
  get: () => (field.value === 'kg' ? value.value : amountShown.value),
  set: (next: string) => {
    if (field.value === 'kg') {
      value.value = next
    } else {
      amountValue.value = next
      amountEdited.value = true
    }
  },
})

const leftover = computed(() => roundKg(props.availableKg - kg.value))
const overDelivery = computed(() => !pickup.value && kg.value > 0 && leftover.value < 0)
const ready = computed(() => stopName.value.trim().length > 0 && kg.value > 0)
const title = computed(() => {
  const number = props.stopNumber
  return editing.value ? `Corregir parada ${number}` : `Parada ${number}`
})
const saveLabel = computed(() => {
  if (props.busy) return 'Guardando…'
  if (editing.value) return 'Guardar'
  return pickup.value ? 'Registrar recolección' : 'Registrar entrega'
})

function setKind(next: StopKind) {
  kind.value = next
  field.value = 'kg'
}

function useSuggested() {
  amountEdited.value = false
  amountValue.value = ''
}

function save() {
  if (!ready.value || props.busy) return
  emit('save', {
    kind: kind.value,
    stopName: stopName.value.trim(),
    kg: kg.value,
    amount: pickup.value ? amount.value : 0,
    notes: notes.value.trim() || null,
  })
}

function reset() {
  kind.value = 'delivery'
  stopName.value = ''
  value.value = ''
  notes.value = ''
  showNotes.value = false
  amountValue.value = ''
  amountEdited.value = false
  field.value = 'kg'
}
defineExpose({ reset })
</script>

<template>
  <section class="flex flex-col gap-4 wide:gap-3 tall:gap-3" :aria-label="title">
    <div class="flex min-h-12 items-center justify-between gap-3">
      <h2 class="text-xl font-extrabold">{{ title }}</h2>
      <div class="flex gap-2">
        <button
          v-if="!showNotes"
          type="button"
          class="btn-secondary quiet"
          :disabled="busy"
          @click="showNotes = true"
        >
          <StrokeIcon name="plus" class="text-xl" />
          <span>Nota</span>
        </button>
        <button
          v-if="editing"
          type="button"
          class="btn-secondary"
          :disabled="busy"
          @click="emit('cancel')"
        >
          <StrokeIcon name="close" class="text-xl" />
          <span>Cancelar</span>
        </button>
      </div>
    </div>

    <div class="kinds" role="group" aria-label="Tipo de parada">
      <button
        type="button"
        class="kind"
        :aria-pressed="!pickup"
        :disabled="busy"
        @click="setKind('delivery')"
      >
        Entrega
      </button>
      <button
        type="button"
        class="kind"
        :aria-pressed="pickup"
        :disabled="busy"
        @click="setKind('pickup')"
      >
        Recolección
      </button>
    </div>

    <label class="flex flex-col">
      <span class="sr-only">Nombre de la parada</span>
      <input
        v-model="stopName"
        class="field"
        type="text"
        list="recent-stops"
        maxlength="120"
        autocomplete="off"
        autocapitalize="sentences"
        enterkeyhint="done"
        placeholder="Tienda o cliente"
        :disabled="busy"
        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      />
      <datalist id="recent-stops">
        <option v-for="s in stopSuggestions" :key="s" :value="s" />
      </datalist>
    </label>

    <label v-if="showNotes" class="flex flex-col">
      <span class="sr-only">Nota</span>
      <input
        v-model="notes"
        class="field"
        type="text"
        maxlength="500"
        autocomplete="off"
        autocapitalize="sentences"
        enterkeyhint="done"
        placeholder="Nota (opcional)"
        :disabled="busy"
        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      />
    </label>

    <div v-if="pickup" class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="text-left"
        :aria-pressed="field === 'kg'"
        :disabled="busy"
        @click="field = 'kg'"
      >
        <KgReadout
          :value="value"
          label="Kilos que recoges"
          :active="field === 'kg'"
          selectable
          stacked
        />
      </button>
      <button
        type="button"
        class="text-left"
        :aria-pressed="field === 'amount'"
        :disabled="busy"
        @click="field = 'amount'"
      >
        <KgReadout
          :value="amountShown"
          :label="amountEdited || suggested === null ? 'Dinero recibido' : 'Dinero (sugerido)'"
          unit="money"
          :active="field === 'amount'"
          selectable
          stacked
        />
      </button>
    </div>
    <KgReadout v-else :value="value" label="Kilos que dejas" />

    <KgKeypad
      v-model="keypadValue"
      :unit="field === 'kg' ? 'kg' : 'money'"
      :replace="field === 'amount' && !amountEdited"
      :disabled="busy"
    />

    <div v-if="pickup" class="flex min-h-6 flex-wrap items-center gap-x-3">
      <p class="notice" role="status">
        <template v-if="suggested === null && pricePerKg === null"
          >Sin precio base: anota lo que te dieron.</template
        >
        <template v-else-if="suggested === null">Anota lo que te dieron.</template>
        <template v-else-if="!amountEdited"
          >A {{ formatMoney(pricePerKg!) }} el kilo, por lo que dejaste. Toca Dinero si te dieron
          otra cantidad.</template
        >
        <template v-else>Dinero recibido: {{ formatMoney(amount) }}.</template>
      </p>
      <button
        v-if="showUseSuggested"
        type="button"
        class="btn-secondary"
        :disabled="busy"
        @click="useSuggested"
      >
        Usar {{ formatMoney(suggested!) }}
      </button>
    </div>
    <p v-else class="notice" :class="{ over: overDelivery }" role="status">
      <template v-if="overDelivery"
        >Quedarían {{ formatKg(leftover) }}. Se registra igual.</template
      >
      <template v-else-if="kg > 0">Te quedarían {{ formatKg(leftover) }}.</template>
      <template v-else>Traes {{ formatKg(availableKg) }}.</template>
    </p>

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

    <div class="flex gap-6">
      <button
        type="button"
        class="btn-primary min-w-0 flex-1"
        :disabled="!ready || busy"
        @click="save"
      >
        <span>{{ saveLabel }}</span>
        <StrokeIcon v-if="!busy" name="arrow" />
      </button>
      <button
        v-if="editing"
        type="button"
        class="btn-secondary danger min-h-auto! shrink-0"
        :aria-label="
          deleteConfirm.armed.value ? 'Toca otra vez para borrar la parada' : 'Borrar parada'
        "
        :disabled="busy"
        @click="deleteConfirm.tap(() => emit('delete'))"
      >
        <StrokeIcon name="trash" class="text-xl" />
        <span>{{ deleteConfirm.armed.value ? '¿Borrar?' : 'Borrar' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.notice {
  min-height: 1.5rem;
  color: var(--color-ink-2);
  font-size: 1rem;
  font-weight: 600;
}
.notice.over {
  color: var(--color-danger);
}

.kinds {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--color-edge);
  border-radius: 6px;
  overflow: hidden;
}
.kind {
  min-height: 3rem;
  background: var(--color-raised);
  color: var(--color-ink-2);
  font-size: 1.0625rem;
  font-weight: 700;
  transition: background 140ms ease-out;
}
.kind + .kind {
  border-left: 1px solid var(--color-edge);
}
.kind[aria-pressed='true'] {
  background: var(--color-signal-soft);
  box-shadow: inset 0 0 0 1px var(--color-signal);
  color: var(--color-ink);
}
</style>
