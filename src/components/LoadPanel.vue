<script setup lang="ts">
import { computed, ref } from 'vue'

import FlapText from '@/components/FlapText.vue'
import KgKeypad from '@/components/KgKeypad.vue'
import KgReadout from '@/components/KgReadout.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { kgToValue, valueToKg } from '@/utils/keypad'

const props = defineProps<{
  mode: 'start' | 'edit'
  currentKg?: number
  busy: boolean
  error: string | null
}>()
const emit = defineEmits<{ confirm: [kg: number]; cancel: [] }>()

const value = ref(props.currentKg ? kgToValue(props.currentKg) : '')
const kg = computed(() => valueToKg(value.value))
const starting = computed(() => props.mode === 'start')
</script>

<template>
  <section
    class="flex flex-col gap-4 wide:gap-3 tall:gap-3"
    :aria-label="starting ? 'Carga de hoy' : 'Corregir carga'"
  >
    <div class="flex min-h-12 items-center justify-between gap-3">
      <h2>
        <FlapText
          :text="starting ? 'Carga de hoy' : 'Corregir carga'"
          size="md"
          :tone="starting ? 'ink' : 'amber'"
        />
      </h2>
      <button
        v-if="!starting"
        type="button"
        class="btn-steel min-h-12!"
        :disabled="busy"
        @click="emit('cancel')"
      >
        <StrokeIcon name="close" class="text-xl" />
        <span>Cancelar</span>
      </button>
    </div>

    <p class="text-xl font-semibold tracking-[0.1em] uppercase">
      {{ starting ? '¿Con cuántos kilos sales hoy?' : '¿Cuántos kilos cargaste en realidad?' }}
    </p>

    <KgReadout :value="value" label="Kilos cargados" />
    <KgKeypad v-model="value" :disabled="busy" />

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

    <button
      type="button"
      class="btn-primary w-full"
      :disabled="kg <= 0 || busy"
      @click="emit('confirm', kg)"
    >
      <span>{{ busy ? 'Guardando…' : starting ? 'Iniciar ruta' : 'Guardar carga' }}</span>
      <StrokeIcon v-if="!busy" name="arrow" />
    </button>
  </section>
</template>
