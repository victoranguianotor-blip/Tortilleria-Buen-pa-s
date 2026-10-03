<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import type { Sale } from '@/services/sales'
import { colimaTime } from '@/utils/date'
import { formatKgNumber } from '@/utils/kg'
import { formatMoney } from '@/utils/money'

const props = defineProps<{
  sales: Sale[]
  selectedId: string | null
  newId: string | null
}>()
defineEmits<{ select: [sale: Sale] }>()

function describe(s: Sale, number: number): string {
  const note = s.notes ? `. Nota: ${s.notes}` : ''
  return `Venta ${number}: ${formatKgNumber(s.kg)} kilos, ${formatMoney(s.amount)}${note}. Tocar para corregir`
}

const list = ref<HTMLOListElement | null>(null)

async function scrollToLast() {
  await nextTick()
  list.value?.scrollTo({ top: list.value.scrollHeight })
}

onMounted(scrollToLast)
watch(
  () => props.sales.length,
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
      <span>Nota</span>
      <span class="text-right">Kg</span>
      <span class="text-right">Dinero</span>
    </div>

    <ol ref="list" class="min-h-0 flex-1 overflow-y-auto" aria-label="Ventas de hoy">
      <li v-for="(s, i) in sales" :key="s.id">
        <button
          type="button"
          class="row list-row w-full text-left"
          :class="{ selected: s.id === selectedId, fresh: s.id === newId }"
          :aria-pressed="s.id === selectedId"
          :aria-label="describe(s, i + 1)"
          @click="$emit('select', s)"
        >
          <span class="text-ink-3 tabular-nums">{{ i + 1 }}</span>
          <span class="time text-ink-2 tabular-nums">{{ colimaTime(s.created_at) }}</span>
          <span class="note" :class="{ 'text-ink-3': !s.notes }">{{ s.notes || '—' }}</span>
          <span class="figure-value text-right text-lg">{{ formatKgNumber(s.kg) }}</span>
          <span class="money text-right">{{ formatMoney(s.amount) }}</span>
        </button>
      </li>

      <li v-if="sales.length > 0" class="hint">Toca una venta para corregirla o borrarla.</li>
      <li v-else class="hint">Sin ventas todavía. La primera aparece aquí.</li>
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

.note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.0625rem;
  font-weight: 600;
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
