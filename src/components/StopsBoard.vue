<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import FlapText from '@/components/FlapText.vue'
import type { Delivery } from '@/services/routes'
import { colimaTime } from '@/utils/date'
import { formatKgNumber } from '@/utils/kg'

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
    <div class="row header caption" aria-hidden="true">
      <span>#</span>
      <span class="time">Hora</span>
      <span>Parada</span>
      <span class="text-right">Kg</span>
    </div>

    <ol ref="list" class="list min-h-0 flex-1 overflow-y-auto" :aria-label="label">
      <li v-for="(d, i) in deliveries" :key="d.id">
        <button
          type="button"
          class="row w-full text-left"
          :class="{ active: d.id === selectedId }"
          :disabled="!editable"
          :aria-pressed="d.id === selectedId"
          :aria-label="`Parada ${i + 1}: ${d.stop_name}, ${formatKgNumber(d.delivered_kg)} kilos${editable ? '. Tocar para corregir' : ''}`"
          @click="$emit('select', d)"
        >
          <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
          <FlapText class="time" :text="colimaTime(d.created_at)" size="sm" tone="steel" />
          <span class="stop">{{ d.stop_name }}</span>
          <FlapText
            :text="formatKgNumber(d.delivered_kg)"
            :cells="5"
            align="right"
            size="sm"
            :tone="d.id === selectedId ? 'amber' : 'ink'"
            :animate="d.id === newId"
            class="justify-self-end"
          />
        </button>
      </li>

      <li v-if="editable && deliveries.length > 0" class="hint caption" aria-hidden="true">
        Toca una parada para corregirla o borrarla
      </li>

      <li v-if="deliveries.length === 0" class="row empty">
        <span class="num">--</span>
        <span class="col-span-3 caption">{{ emptyText }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 2.4rem 4.6rem minmax(0, 1fr) auto;
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
button.row:not(:disabled):active {
  background: var(--color-flap-2);
}
button.row.active {
  background: var(--color-amber-dark);
  box-shadow: inset 0 0 0 2px var(--color-amber);
}

.num {
  color: var(--color-steel-2);
  font-size: 1.1rem;
  font-weight: 600;
}

.stop {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.active .stop {
  color: var(--color-amber);
}

.empty {
  border-bottom-style: dashed;
}

.hint {
  padding: 0.8rem 0.9rem;
  color: var(--color-steel-2);
}

.list {
  scroll-snap-type: y mandatory;
}
.list > li {
  scroll-snap-align: end;
}

@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .row:not(.header) {
    min-height: 3rem;
  }
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    gap: 0.6rem;
    padding-inline: 0.75rem;
  }
  .time {
    display: none;
  }
}
</style>
