<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import FlapText from '@/components/FlapText.vue'
import KgKeypad from '@/components/KgKeypad.vue'
import KgReadout from '@/components/KgReadout.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useTwoTapConfirm } from '@/composables/twoTapConfirm'
import type { Delivery } from '@/services/routes'
import { formatKg, roundKg } from '@/utils/kg'
import { kgToValue, valueToKg } from '@/utils/keypad'

const props = defineProps<{
  delivery: Delivery | null
  stopNumber: number
  availableKg: number
  stopSuggestions: string[]
  busy: boolean
  error: string | null
}>()
const emit = defineEmits<{
  save: [stopName: string, kg: number]
  delete: []
  cancel: []
}>()

const stopName = ref('')
const value = ref('')
const deleteConfirm = useTwoTapConfirm()

watch(
  () => props.delivery,
  (d) => {
    stopName.value = d?.stop_name ?? ''
    value.value = d ? kgToValue(d.delivered_kg) : ''
    deleteConfirm.disarm()
  },
  { immediate: true },
)

const editing = computed(() => props.delivery !== null)
const kg = computed(() => valueToKg(value.value))
const leftover = computed(() => roundKg(props.availableKg - kg.value))
const overDelivery = computed(() => kg.value > 0 && leftover.value < 0)
const ready = computed(() => stopName.value.trim().length > 0 && kg.value > 0)
const title = computed(() => {
  const number = String(props.stopNumber).padStart(2, '0')
  return editing.value ? `Corregir ${number}` : `Parada ${number}`
})

function save() {
  if (ready.value && !props.busy) emit('save', stopName.value.trim(), kg.value)
}

function reset() {
  stopName.value = ''
  value.value = ''
}
defineExpose({ reset })
</script>

<template>
  <section class="panel flex flex-col gap-4 wide:gap-3 tall:gap-3" :aria-label="title">
    <div class="heading flex min-h-12 items-center justify-between gap-3">
      <h2><FlapText :text="title" size="md" :tone="editing ? 'amber' : 'ink'" /></h2>
      <button
        v-if="editing"
        type="button"
        class="btn-steel min-h-12!"
        :disabled="busy"
        @click="emit('cancel')"
      >
        <StrokeIcon name="close" class="text-xl" />
        <span>Cancelar</span>
      </button>
    </div>

    <label class="flex flex-col">
      <span class="sr-only">Nombre de la parada</span>
      <input
        v-model="stopName"
        class="field uppercase"
        type="text"
        list="recent-stops"
        maxlength="120"
        autocomplete="off"
        autocapitalize="characters"
        enterkeyhint="done"
        placeholder="Tienda o cliente"
        :disabled="busy"
        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      />
      <datalist id="recent-stops">
        <option v-for="s in stopSuggestions" :key="s" :value="s" />
      </datalist>
    </label>

    <KgReadout class="readout" :value="value" label="Kilos que dejas" />
    <KgKeypad v-model="value" :disabled="busy" />

    <p class="notice" :class="{ over: overDelivery }" role="status">
      <template v-if="overDelivery"
        >Quedarían {{ formatKg(leftover) }}. Se registra igual.</template
      >
      <template v-else-if="kg > 0">Te quedarían {{ formatKg(leftover) }}.</template>
      <template v-else>Traes {{ formatKg(availableKg) }}.</template>
    </p>

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

    <div class="flex gap-3">
      <button
        type="button"
        class="btn-primary min-w-0 flex-1"
        :disabled="!ready || busy"
        @click="save"
      >
        <span>{{ busy ? 'Guardando…' : editing ? 'Guardar' : 'Registrar parada' }}</span>
        <StrokeIcon v-if="!busy" name="arrow" />
      </button>
      <button
        v-if="editing"
        type="button"
        class="btn-steel danger min-h-auto! shrink-0"
        :aria-label="
          deleteConfirm.armed.value ? 'Toca otra vez para borrar la parada' : 'Borrar parada'
        "
        :disabled="busy"
        @click="deleteConfirm.tap(() => emit('delete'))"
      >
        <StrokeIcon name="trash" class="text-2xl" />
        <span>{{ deleteConfirm.armed.value ? '¿Borrar?' : 'Borrar' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.notice {
  min-height: 1.5rem;
  color: var(--color-steel);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.notice.over {
  color: var(--color-danger);
}

@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
  .panel > * {
    grid-column: 1 / -1;
  }
  .panel > .heading {
    grid-column: 1;
    grid-row: 1;
  }
  .panel > .readout {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
