<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import type { Delivery } from '@/services/routes'
import { colimaTime } from '@/utils/date'
import { formatKgNumber } from '@/utils/kg'
import { formatMoney } from '@/utils/money'

const props = withDefaults(
  defineProps<{
    deliveries: Delivery[]
    selectedId?: string | null
    newId?: string | null
    editable: boolean
    label?: string
    emptyText?: string
  }>(),
  {
    selectedId: null,
    newId: null,
    label: 'Paradas de hoy',
    emptyText: 'Sin paradas todavía. La primera aparece aquí.',
  },
)
defineEmits<{ select: [delivery: Delivery] }>()

function describe(d: Delivery, number: number): string {
  const what =
    d.kind === 'pickup'
      ? `recolección de ${formatKgNumber(d.kg)} kilos, recibido ${formatMoney(d.received_amount)}`
      : `${formatKgNumber(d.kg)} kilos`
  const note = d.notes ? `. Nota: ${d.notes}` : ''
  const hint = props.editable ? '. Tocar para corregir' : ''
  return `Parada ${number}: ${d.stop_name}, ${what}${note}${hint}`
}

const list = ref<HTMLOListElement | null>(null)

async function scrollToLast() {
  await nextTick()
  list.value?.scrollTo({ top: list.value.scrollHeight })
}

onMounted(scrollToLast)
watch(
  () => props.deliveries.length,
  (count, previous) => {
    if (count > previous) scrollToLast()
  },
)
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="row list-head" aria-hidden="true">
      <span>#</span>
      <span class="time">Hora</span>
      <span>Parada</span>
      <span class="text-right">Kg</span>
      <span class="text-right">Cobrado</span>
    </div>

    <ol ref="list" class="min-h-0 flex-1 overflow-y-auto" :aria-label="label">
      <li v-for="(d, i) in deliveries" :key="d.id">
        <button
          type="button"
          class="row list-row w-full text-left"
          :class="{ selected: d.id === selectedId, fresh: d.id === newId }"
          :disabled="!editable"
          :aria-pressed="d.id === selectedId"
          :aria-label="describe(d, i + 1)"
          @click="$emit('select', d)"
        >
          <span class="text-ink-3 tabular-nums">{{ i + 1 }}</span>
          <span class="time text-ink-2 tabular-nums">{{ colimaTime(d.created_at) }}</span>
          <span class="flex min-w-0 flex-col">
            <span class="flex min-w-0 items-baseline gap-2">
              <span v-if="d.kind === 'pickup'" class="tag">Recolección</span>
              <span class="stop">{{ d.stop_name }}</span>
            </span>
            <span v-if="d.notes" class="note">{{ d.notes }}</span>
          </span>
          <span
            class="figure-value text-right text-lg"
            :class="{ 'text-ink-2': d.kind === 'pickup' }"
          >
            {{ formatKgNumber(d.kg) }}
          </span>
          <span v-if="d.kind === 'pickup'" class="money text-right">
            {{ formatMoney(d.received_amount) }}
          </span>
          <span v-else class="money text-right text-ink-3">—</span>
        </button>
      </li>

      <li v-if="editable && deliveries.length > 0" class="hint">
        Toca una parada para corregirla o borrarla.
      </li>

      <li v-if="deliveries.length === 0" class="hint">{{ emptyText }}</li>
    </ol>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 1.75rem 3.5rem minmax(0, 1fr) 4.5rem 6.5rem;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.3rem 2.1rem 0.3rem 0.9rem;
}
.list-head {
  min-height: 2.25rem;
}

.stop {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.125rem;
  font-weight: 600;
}

.tag {
  flex-shrink: 0;
  padding: 0 0.4rem;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  color: var(--color-ink-2);
  font-size: 0.8125rem;
  font-weight: 700;
}

.note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-ink-3);
  font-size: 0.875rem;
}

.money {
  font-size: 1.0625rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.hint {
  padding: 0.8rem 0.9rem;
  color: var(--color-ink-3);
  font-size: 0.9375rem;
}

@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .row:not(.list-head) {
    min-height: 3rem;
  }
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1.5rem minmax(0, 1fr) 3.5rem 5.5rem;
    gap: 0.6rem;
    padding-left: 0.75rem;
  }
  .time {
    display: none;
  }
}
</style>
