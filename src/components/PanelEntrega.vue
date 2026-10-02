<script setup lang="ts">
// Captura de una parada (nueva o corrección). Sobre-entregar se advierte, no se bloquea.
import { computed, ref, watch } from 'vue'

import FlapText from '@/components/FlapText.vue'
import IconoTrazo from '@/components/IconoTrazo.vue'
import LecturaKg from '@/components/LecturaKg.vue'
import TecladoKg from '@/components/TecladoKg.vue'
import { useConfirmar } from '@/composables/confirmar'
import type { Entrega } from '@/services/rutas'
import { formatearKg, redondearKg } from '@/utils/kg'
import { kgAValor, valorAKg } from '@/utils/teclado'

const props = defineProps<{
  entrega: Entrega | null
  numero: number
  kgDisponibles: number
  paradas: string[]
  ocupado: boolean
  error: string | null
}>()
const emit = defineEmits<{
  guardar: [parada: string, kg: number]
  borrar: []
  cancelar: []
}>()

const parada = ref('')
const valor = ref('')
const borrado = useConfirmar()

watch(
  () => props.entrega,
  (e) => {
    parada.value = e?.parada ?? ''
    valor.value = e ? kgAValor(e.kg_dejados) : ''
    borrado.desarmar()
  },
  { immediate: true },
)

const editando = computed(() => props.entrega !== null)
const kg = computed(() => valorAKg(valor.value))
const quedarian = computed(() => redondearKg(props.kgDisponibles - kg.value))
const sobreEntrega = computed(() => kg.value > 0 && quedarian.value < 0)
const listo = computed(() => parada.value.trim().length > 0 && kg.value > 0)
const titulo = computed(() =>
  editando.value
    ? `Corregir ${String(props.numero).padStart(2, '0')}`
    : `Parada ${String(props.numero).padStart(2, '0')}`,
)

function guardar() {
  if (listo.value && !props.ocupado) emit('guardar', parada.value.trim(), kg.value)
}

/** Lo llama la vista después de registrar, para dejar el panel listo para la siguiente. */
function limpiar() {
  parada.value = ''
  valor.value = ''
}
defineExpose({ limpiar })
</script>

<template>
  <section class="flex flex-col gap-4 horizontal:gap-3 vertical-alto:gap-3" :aria-label="titulo">
    <div class="flex min-h-12 items-center justify-between gap-3">
      <h2><FlapText :texto="titulo" tamano="md" :tono="editando ? 'ambar' : 'tinta'" /></h2>
      <button
        v-if="editando"
        type="button"
        class="boton-acero min-h-12!"
        :disabled="ocupado"
        @click="emit('cancelar')"
      >
        <IconoTrazo nombre="x" class="text-xl" />
        <span>Cancelar</span>
      </button>
    </div>

    <label class="flex flex-col">
      <span class="sr-only">Nombre de la parada</span>
      <input
        v-model="parada"
        class="campo uppercase"
        type="text"
        list="paradas-recientes"
        maxlength="120"
        autocomplete="off"
        autocapitalize="characters"
        enterkeyhint="done"
        placeholder="Tienda o cliente"
        :disabled="ocupado"
        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      />
      <datalist id="paradas-recientes">
        <option v-for="p in paradas" :key="p" :value="p" />
      </datalist>
    </label>

    <LecturaKg :valor="valor" etiqueta="Kilos que dejas" />
    <TecladoKg v-model="valor" :deshabilitado="ocupado" />

    <p class="aviso" :class="{ sobre: sobreEntrega }" role="status">
      <template v-if="sobreEntrega">
        Quedarían {{ formatearKg(quedarian) }}. Se registra igual.
      </template>
      <template v-else-if="kg > 0">Te quedarían {{ formatearKg(quedarian) }}.</template>
      <template v-else>Traes {{ formatearKg(kgDisponibles) }}.</template>
    </p>

    <p v-if="error" class="alerta-error" role="alert">{{ error }}</p>

    <div class="flex gap-3">
      <button
        type="button"
        class="boton-ambar min-w-0 flex-1"
        :disabled="!listo || ocupado"
        @click="guardar"
      >
        <span>{{
          ocupado ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar parada'
        }}</span>
        <IconoTrazo v-if="!ocupado" nombre="flecha" />
      </button>
      <button
        v-if="editando"
        type="button"
        class="boton-acero peligro min-h-auto! shrink-0"
        :aria-label="borrado.armado.value ? 'Toca otra vez para borrar la parada' : 'Borrar parada'"
        :disabled="ocupado"
        @click="borrado.tocar(() => emit('borrar'))"
      >
        <IconoTrazo nombre="basura" class="text-2xl" />
        <span v-if="borrado.armado.value">¿Borrar?</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.aviso {
  min-height: 1.5rem;
  color: var(--color-acero);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.aviso.sobre {
  color: var(--color-rojo);
}
</style>
