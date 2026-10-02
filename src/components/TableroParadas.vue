<script setup lang="ts">
// Renglones del tablero: una parada por renglón, columnas fijas. Un renglón se puede tocar
// para corregirlo mientras la ruta esté abierta.
import FlapText from '@/components/FlapText.vue'
import type { Entrega } from '@/services/rutas'
import { horaColima } from '@/utils/fecha'
import { formatearKg } from '@/utils/kg'

defineProps<{
  entregas: Entrega[]
  seleccionadaId: string | null
  nuevaId: string | null
  editable: boolean
}>()
defineEmits<{ elegir: [entrega: Entrega] }>()

const kgTexto = (kg: number) => formatearKg(kg).replace(' kg', '')
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="renglon encabezado rotulo" aria-hidden="true">
      <span>#</span>
      <span class="hora">Hora</span>
      <span>Parada</span>
      <span class="text-right">Kg</span>
    </div>

    <ol class="min-h-0 flex-1 overflow-y-auto" aria-label="Paradas de hoy">
      <li v-for="(e, i) in entregas" :key="e.id">
        <button
          type="button"
          class="renglon w-full text-left"
          :class="{ activo: e.id === seleccionadaId }"
          :disabled="!editable"
          :aria-pressed="e.id === seleccionadaId"
          :aria-label="`Parada ${i + 1}: ${e.parada}, ${kgTexto(e.kg_dejados)} kilos${editable ? '. Tocar para corregir' : ''}`"
          @click="$emit('elegir', e)"
        >
          <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
          <FlapText class="hora" :texto="horaColima(e.created_at)" tamano="sm" tono="acero" />
          <span class="parada">{{ e.parada }}</span>
          <FlapText
            :texto="kgTexto(e.kg_dejados)"
            :celdas="5"
            alinear="der"
            tamano="sm"
            :tono="e.id === seleccionadaId ? 'ambar' : 'tinta'"
            :animar="e.id === nuevaId"
            class="justify-self-end"
          />
        </button>
      </li>

      <li v-if="entregas.length === 0" class="renglon vacio">
        <span class="num">--</span>
        <span class="col-span-3 rotulo">Sin paradas todavía. La primera aparece aquí.</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.renglon {
  display: grid;
  grid-template-columns: 2.4rem 4.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  min-height: 3.5rem;
  padding: 0.35rem 0.9rem;
  border-bottom: 1px solid #222327;
}

.encabezado {
  min-height: 2.4rem;
  border-bottom-color: var(--color-acero-3);
}

button.renglon {
  transition: background 160ms ease-out;
}
button.renglon:not(:disabled):active {
  background: var(--color-flap-2);
}
button.renglon.activo {
  background: var(--color-ambar-oscuro);
  box-shadow: inset 0 0 0 2px var(--color-ambar);
}

.num {
  color: var(--color-acero-2);
  font-size: 1.1rem;
  font-weight: 600;
}

.parada {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.activo .parada {
  color: var(--color-ambar);
}

.vacio {
  border-bottom-style: dashed;
}

/* Celular: la hora cede su espacio al nombre de la parada. */
@media (max-width: 520px) {
  .renglon {
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    gap: 0.6rem;
    padding-inline: 0.75rem;
  }
  .hora {
    display: none;
  }
}
</style>
