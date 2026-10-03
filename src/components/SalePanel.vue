<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import KgKeypad from '@/components/KgKeypad.vue'
import KgReadout from '@/components/KgReadout.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useTwoTapConfirm } from '@/composables/twoTapConfirm'
import type { Sale, SaleInput } from '@/services/sales'
import { amountToValue, kgToValue, valueToAmount, valueToKg } from '@/utils/keypad'
import { formatMoney, suggestedAmount } from '@/utils/money'

const props = defineProps<{
  sale: Sale | null
  saleNumber: number
  pricePerKg: number | null
  busy: boolean
  error: string | null
}>()
const emit = defineEmits<{
  save: [input: SaleInput]
  delete: []
  cancel: []
}>()

const kgValue = ref('')
const notes = ref('')
const showNotes = ref(false)
const field = ref<'kg' | 'amount'>('kg')
// Until an amount is typed, it follows kg × base price.
const amountValue = ref('')
const amountEdited = ref(false)
const deleteConfirm = useTwoTapConfirm()

watch(
  () => props.sale,
  (s) => {
    kgValue.value = s ? kgToValue(s.kg) : ''
    notes.value = s?.notes ?? ''
    showNotes.value = Boolean(s?.notes)
    amountValue.value = s ? amountToValue(s.amount) : ''
    amountEdited.value = s !== null
    field.value = 'kg'
    deleteConfirm.disarm()
  },
  { immediate: true },
)

const editing = computed(() => props.sale !== null)
const kg = computed(() => valueToKg(kgValue.value))
const suggested = computed(() => suggestedAmount(kg.value, props.pricePerKg))
const amountShown = computed(() => {
  if (amountEdited.value) return amountValue.value
  return suggested.value === null ? '' : amountToValue(suggested.value)
})
const amount = computed(() => valueToAmount(amountShown.value))
const showUseSuggested = computed(
  () => amountEdited.value && suggested.value !== null && suggested.value !== amount.value,
)

const keypadValue = computed({
  get: () => (field.value === 'kg' ? kgValue.value : amountShown.value),
  set: (next: string) => {
    if (field.value === 'kg') {
      kgValue.value = next
    } else {
      amountValue.value = next
      amountEdited.value = true
    }
  },
})

const ready = computed(() => kg.value > 0)
const title = computed(() =>
  editing.value ? `Corregir venta ${props.saleNumber}` : `Venta ${props.saleNumber}`,
)

function useSuggested() {
  amountEdited.value = false
  amountValue.value = ''
}

function save() {
  if (!ready.value || props.busy) return
  emit('save', { kg: kg.value, amount: amount.value, notes: notes.value.trim() || null })
}

function reset() {
  kgValue.value = ''
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

    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="text-left"
        :aria-pressed="field === 'kg'"
        :disabled="busy"
        @click="field = 'kg'"
      >
        <KgReadout
          :value="kgValue"
          label="Kilos vendidos"
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

    <KgKeypad
      v-model="keypadValue"
      :unit="field === 'kg' ? 'kg' : 'money'"
      :replace="field === 'amount' && !amountEdited"
      :disabled="busy"
    />

    <div class="flex min-h-6 flex-wrap items-center gap-x-3">
      <p class="notice" role="status">
        <template v-if="pricePerKg === null"
          >Sin precio en tortillería: anota lo que te dieron.</template
        >
        <template v-else-if="!amountEdited"
          >A {{ formatMoney(pricePerKg) }} el kilo. Toca Dinero si te dieron otra
          cantidad.</template
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

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

    <div class="flex gap-6">
      <button
        type="button"
        class="btn-primary min-w-0 flex-1"
        :disabled="!ready || busy"
        @click="save"
      >
        <span>{{ busy ? 'Guardando…' : editing ? 'Guardar' : 'Registrar venta' }}</span>
        <StrokeIcon v-if="!busy" name="arrow" />
      </button>
      <button
        v-if="editing"
        type="button"
        class="btn-secondary danger min-h-auto! shrink-0"
        :aria-label="
          deleteConfirm.armed.value ? 'Toca otra vez para borrar la venta' : 'Borrar venta'
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
</style>
