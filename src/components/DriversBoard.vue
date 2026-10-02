<script setup lang="ts">
import type { RouteSummary } from '@/services/admin'
import { formatKgNumber } from '@/utils/kg'
import { routeStatus } from '@/utils/status'

export interface DriverRow {
  driverId: string
  name: string
  summary: RouteSummary | null
}

defineProps<{ rows: DriverRow[]; selectedId: string | null; emptyText: string }>()
defineEmits<{ select: [driverId: string] }>()

function status(row: DriverRow) {
  return routeStatus(row.summary, row.summary?.remaining_kg ?? 0)
}

function describe(row: DriverRow): string {
  if (!row.summary) return `${row.name}: ${status(row).text}`
  const s = row.summary
  return `${row.name}: ${status(row).text}. Salió con ${formatKgNumber(s.initial_kg)}, entregó ${formatKgNumber(s.delivered_kg)}, quedan ${formatKgNumber(s.remaining_kg)} kilos en ${s.delivery_count} paradas`
}
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="row list-head" aria-hidden="true">
      <span />
      <span>Repartidor</span>
      <span class="kg text-right">Salió</span>
      <span class="kg text-right">Entregó</span>
      <span class="text-right">Queda</span>
      <span class="text-right">Par.</span>
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto" aria-label="Repartidores">
      <li v-for="row in rows" :key="row.driverId">
        <button
          type="button"
          class="row list-row w-full text-left"
          :class="{ selected: row.driverId === selectedId }"
          :aria-pressed="row.driverId === selectedId"
          :aria-label="describe(row)"
          @click="$emit('select', row.driverId)"
        >
          <span class="dot" :class="`dot-${status(row).tone}`" />
          <span class="name" :class="{ 'text-ink-2': !row.summary }">{{ row.name }}</span>
          <template v-if="row.summary">
            <span class="kg num">{{ formatKgNumber(row.summary.initial_kg) }}</span>
            <span class="kg num">{{ formatKgNumber(row.summary.delivered_kg) }}</span>
            <span class="num" :class="{ 'text-danger': row.summary.remaining_kg < 0 }">
              {{ formatKgNumber(row.summary.remaining_kg) }}
            </span>
            <span class="num">{{ row.summary.delivery_count }}</span>
          </template>
          <span v-else class="idle">Sin iniciar</span>
        </button>
      </li>

      <li v-if="rows.length === 0" class="px-4 py-3 text-ink-3">{{ emptyText }}</li>
    </ul>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 0.6rem minmax(0, 1fr) repeat(3, 4.25rem) 2.25rem;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.3rem 0.9rem;
}
.list-head {
  min-height: 2.25rem;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.125rem;
  font-weight: 700;
}
.num {
  text-align: right;
  font-size: 1.0625rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.idle {
  grid-column: span 4;
  justify-self: end;
  color: var(--color-ink-3);
}

.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-ink-3);
}
.dot-go {
  background: var(--color-go);
}
.dot-danger {
  background: var(--color-danger);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 0.6rem minmax(0, 1fr) 4.25rem 2rem;
    gap: 0.6rem;
    padding-inline: 0.75rem;
  }
  .kg {
    display: none;
  }
  .idle {
    grid-column: span 2;
  }
}
</style>
