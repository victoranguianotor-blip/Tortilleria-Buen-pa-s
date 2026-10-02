<script setup lang="ts">
import { computed } from 'vue'

import StatusLamp from '@/components/StatusLamp.vue'
import StopsBoard from '@/components/StopsBoard.vue'
import type { RouteSummary } from '@/services/admin'
import type { Delivery } from '@/services/routes'
import { colimaTime } from '@/utils/date'
import { formatKgNumber } from '@/utils/kg'
import { formatMoney } from '@/utils/money'
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
      <h2 class="min-w-0 truncate text-xl font-extrabold">{{ name }}</h2>
      <StatusLamp :text="status.text" :tone="status.tone" />
    </div>

    <p v-if="!summary" class="text-ink-2">
      {{ isToday ? 'Todavía no inicia la ruta de hoy.' : 'No salió a ruta este día.' }}
    </p>

    <template v-else>
      <p class="text-ink-2">
        <template v-if="summary.departed_at"
          >Salió a las
          <span class="font-bold text-ink tabular-nums">{{
            colimaTime(summary.departed_at)
          }}</span></template
        >
        <template v-else>Ya cargó, todavía no sale a ruta.</template>
        <template v-if="summary.pickup_count > 0">
          · recogió
          <span class="font-bold text-ink tabular-nums"
            >{{ formatKgNumber(summary.picked_kg) }} kg</span
          >
          en {{ summary.pickup_count === 1 ? '1 parada' : `${summary.pickup_count} paradas` }}
        </template>
      </p>

      <dl class="figures -mx-4">
        <div>
          <dt class="label">Salió</dt>
          <dd class="figure-value text-2xl">{{ formatKgNumber(summary.initial_kg) }}</dd>
        </div>
        <div>
          <dt class="label">Entregó</dt>
          <dd class="figure-value text-2xl">{{ formatKgNumber(summary.delivered_kg) }}</dd>
        </div>
        <div>
          <dt class="label">{{ summary.closed_at ? 'Regresa' : 'Queda' }}</dt>
          <dd class="figure-value text-2xl" :class="{ 'text-danger': over }">
            {{ formatKgNumber(summary.remaining_kg) }}
          </dd>
        </div>
        <div>
          <dt class="label">Cobró</dt>
          <dd class="figure-value text-2xl">{{ formatMoney(summary.received_amount) }}</dd>
        </div>
      </dl>

      <div class="-mx-4 flex min-h-48 flex-1 flex-col">
        <p v-if="deliveries === null" class="p-4 text-ink-3">Cargando paradas…</p>
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
        <p class="text-ink-2">Cerró a las {{ colimaTime(summary.closed_at) }}</p>
        <button
          v-if="isToday"
          type="button"
          class="btn-secondary"
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
.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 0.8fr)) minmax(0, 1.2fr);
  border-block: 1px solid var(--color-line);
}
.figures > div {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0.9rem;
}
.figures > div + div {
  border-left: 1px solid var(--color-line);
}
</style>
