<script setup lang="ts">
import FlapText from '@/components/FlapText.vue'
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

function describe(row: DriverRow): string {
  const status = routeStatus(row.summary, row.summary?.remaining_kg ?? 0).text
  if (!row.summary) return `${row.name}: ${status}`
  const s = row.summary
  return `${row.name}: ${status}. Salió con ${formatKgNumber(s.initial_kg)}, entregó ${formatKgNumber(s.delivered_kg)}, quedan ${formatKgNumber(s.remaining_kg)} kilos en ${s.delivery_count} paradas`
}
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="row header caption" aria-hidden="true">
      <span />
      <span>Repartidor</span>
      <span class="text-right">Salió</span>
      <span class="text-right">Entregó</span>
      <span class="text-right">Queda</span>
      <span class="text-right">Par.</span>
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto" aria-label="Repartidores">
      <li v-for="row in rows" :key="row.driverId">
        <button
          type="button"
          class="row w-full text-left"
          :class="{ active: row.driverId === selectedId }"
          :aria-pressed="row.driverId === selectedId"
          :aria-label="describe(row)"
          @click="$emit('select', row.driverId)"
        >
          <span
            class="bulb"
            :class="`bulb-${routeStatus(row.summary, row.summary?.remaining_kg ?? 0).tone}`"
          />
          <span class="name" :class="{ idle: !row.summary }">{{ row.name }}</span>
          <template v-if="row.summary">
            <FlapText
              class="kg"
              :text="formatKgNumber(row.summary.initial_kg)"
              :cells="5"
              align="right"
              size="sm"
            />
            <FlapText
              class="kg"
              :text="formatKgNumber(row.summary.delivered_kg)"
              :cells="5"
              align="right"
              size="sm"
            />
            <FlapText
              class="justify-self-end"
              :text="formatKgNumber(row.summary.remaining_kg)"
              :cells="5"
              align="right"
              size="sm"
              :tone="row.summary.remaining_kg < 0 ? 'danger' : 'ink'"
            />
            <FlapText
              class="justify-self-end"
              :text="String(row.summary.delivery_count)"
              :cells="2"
              align="right"
              size="sm"
            />
          </template>
          <span v-else class="idle-text caption">Sin iniciar</span>
        </button>
      </li>

      <li v-if="rows.length === 0" class="row empty">
        <span />
        <span class="col-span-5 caption">{{ emptyText }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 0.8rem minmax(0, 1fr) repeat(3, 4.5rem) 1.8rem;
  align-items: center;
  gap: 0.9rem;
  min-height: 3.5rem;
  padding: 0.35rem 0.9rem;
  border-bottom: 1px solid #222327;
}
.header {
  min-height: 2.4rem;
  border-bottom-color: var(--color-steel-3);
}

button.row {
  transition: background 160ms ease-out;
}
button.row:active {
  background: var(--color-flap-2);
}
button.row.active {
  background: var(--color-amber-dark);
  box-shadow: inset 0 0 0 2px var(--color-amber);
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.name.idle {
  color: var(--color-steel);
}
.active .name {
  color: var(--color-amber);
}
.kg {
  justify-self: end;
}
.idle-text {
  grid-column: span 4;
  justify-self: end;
  color: var(--color-steel-2);
}

.bulb {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--color-steel-3);
}
.bulb-amber {
  background: var(--color-amber);
  box-shadow: 0 0 10px 1px rgb(255 180 0 / 0.6);
}
.bulb-danger {
  background: var(--color-danger);
  box-shadow: 0 0 10px 1px rgb(255 77 77 / 0.6);
}

.empty {
  border-bottom-style: dashed;
}

@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .row:not(.header) {
    min-height: 3rem;
  }
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 0.8rem minmax(0, 1fr) 4.5rem 1.8rem;
    gap: 0.6rem;
    padding-inline: 0.75rem;
  }
  .header > :nth-child(3),
  .header > :nth-child(4),
  .kg {
    display: none;
  }
  .idle-text {
    grid-column: span 2;
  }
}
</style>
