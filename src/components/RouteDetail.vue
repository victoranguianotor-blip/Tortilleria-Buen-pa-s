<script setup lang="ts">
import { computed } from 'vue'

import FlapText from '@/components/FlapText.vue'
import StatusLamp from '@/components/StatusLamp.vue'
import StopsBoard from '@/components/StopsBoard.vue'
import type { RouteSummary } from '@/services/admin'
import type { Delivery } from '@/services/routes'
import { colimaTime } from '@/utils/date'
import { formatKgNumber } from '@/utils/kg'
import { routeStatus } from '@/utils/status'

const props = defineProps<{
  name: string
  summary: RouteSummary | null
  deliveries: Delivery[] | null
  isToday: boolean
  busy: boolean
  error: string | null
}>()
defineEmits<{ reopen: [] }>()

const status = computed(() => routeStatus(props.summary, props.summary?.remaining_kg ?? 0))
const over = computed(() => (props.summary?.remaining_kg ?? 0) < 0)
</script>

<template>
  <section class="flex min-h-0 flex-col gap-4" :aria-label="`Ruta de ${name}`">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="name">{{ name }}</h2>
      <StatusLamp :text="status.text" :tone="status.tone" />
    </div>

    <p v-if="!summary" class="text-lg tracking-[0.1em] text-steel uppercase">
      {{ isToday ? 'Todavía no inicia la ruta de hoy.' : 'No salió a ruta este día.' }}
    </p>

    <template v-else>
      <dl class="figures">
        <div>
          <dt class="caption">Salió</dt>
          <dd>
            <FlapText :text="formatKgNumber(summary.initial_kg)" :cells="5" align="right" />
          </dd>
        </div>
        <div>
          <dt class="caption">Entregó</dt>
          <dd>
            <FlapText :text="formatKgNumber(summary.delivered_kg)" :cells="5" align="right" />
          </dd>
        </div>
        <div>
          <dt class="caption">{{ summary.closed_at ? 'Regresa' : 'Queda' }}</dt>
          <dd>
            <FlapText
              :text="formatKgNumber(summary.remaining_kg)"
              :cells="5"
              align="right"
              :tone="over ? 'danger' : 'ink'"
            />
          </dd>
        </div>
      </dl>

      <div class="stops flex min-h-0 flex-col">
        <p v-if="deliveries === null" class="caption p-4">Cargando paradas…</p>
        <StopsBoard
          v-else
          class="min-h-0 flex-1"
          :deliveries="deliveries"
          :editable="false"
          :label="`Paradas de ${name}`"
          empty-text="Sin paradas registradas."
        />
      </div>

      <div v-if="summary.closed_at" class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-lg tracking-[0.1em] text-steel uppercase">
          Cerró a las {{ colimaTime(summary.closed_at) }}
        </p>
        <button
          v-if="isToday"
          type="button"
          class="btn-steel"
          :disabled="busy"
          @click="$emit('reopen')"
        >
          {{ busy ? 'Reabriendo…' : 'Reabrir ruta' }}
        </button>
      </div>
    </template>

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.name {
  font-size: clamp(1.6rem, 1.4vw + 1.1rem, 2.1rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.1;
  text-transform: uppercase;
}

.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid var(--color-steel-3);
}
.figures > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem clamp(0.5rem, 1.2vw, 0.9rem);
}
.figures > div + div {
  border-left: 1px solid var(--color-steel-3);
}

.stops {
  flex: 1;
  min-height: 12rem;
  border: 1px solid var(--color-steel-3);
  border-radius: 6px;
}
</style>
