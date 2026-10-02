<script setup lang="ts">
// Kilos con los que sale la ruta: al iniciarla o para corregir la carga.
import { computed, ref } from 'vue'

import FlapText from '@/components/FlapText.vue'
import IconoTrazo from '@/components/IconoTrazo.vue'
import LecturaKg from '@/components/LecturaKg.vue'
import TecladoKg from '@/components/TecladoKg.vue'
import { kgAValor, valorAKg } from '@/utils/teclado'

const props = defineProps<{
  modo: 'iniciar' | 'corregir'
  kgActual?: number
  ocupado: boolean
  error: string | null
}>()
const emit = defineEmits<{ confirmar: [kg: number]; cancelar: [] }>()

const valor = ref(props.kgActual ? kgAValor(props.kgActual) : '')
const kg = computed(() => valorAKg(valor.value))
const iniciar = computed(() => props.modo === 'iniciar')
</script>

<template>
  <section
    class="flex flex-col gap-4 horizontal:gap-3 vertical-alto:gap-3"
    :aria-label="iniciar ? 'Carga de hoy' : 'Corregir carga'"
  >
    <div class="flex min-h-12 items-center justify-between gap-3">
      <h2>
        <FlapText
          :texto="iniciar ? 'Carga de hoy' : 'Corregir carga'"
          tamano="md"
          :tono="iniciar ? 'tinta' : 'ambar'"
        />
      </h2>
      <button
        v-if="!iniciar"
        type="button"
        class="boton-acero min-h-12!"
        :disabled="ocupado"
        @click="emit('cancelar')"
      >
        <IconoTrazo nombre="x" class="text-xl" />
        <span>Cancelar</span>
      </button>
    </div>

    <p class="text-2xl font-semibold tracking-wide">
      {{ iniciar ? '¿Con cuántos kilos sales hoy?' : '¿Cuántos kilos cargaste en realidad?' }}
    </p>

    <LecturaKg :valor="valor" etiqueta="Kilos cargados" />
    <TecladoKg v-model="valor" :deshabilitado="ocupado" />

    <p v-if="error" class="alerta-error" role="alert">{{ error }}</p>

    <button
      type="button"
      class="boton-ambar w-full"
      :disabled="kg <= 0 || ocupado"
      @click="emit('confirmar', kg)"
    >
      <span>{{ ocupado ? 'Guardando…' : iniciar ? 'Iniciar ruta' : 'Guardar carga' }}</span>
      <IconoTrazo v-if="!ocupado" nombre="flecha" />
    </button>
  </section>
</template>
