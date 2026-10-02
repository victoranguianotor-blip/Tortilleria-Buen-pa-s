<script setup lang="ts">
import { computed, ref } from 'vue'

import KgKeypad from '@/components/KgKeypad.vue'
import KgReadout from '@/components/KgReadout.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { amountToValue, valueToAmount } from '@/utils/keypad'

const props = defineProps<{ currentPrice: number | null; busy: boolean; error: string | null }>()
const emit = defineEmits<{ confirm: [price: number]; cancel: [] }>()

const value = ref(props.currentPrice ? amountToValue(props.currentPrice) : '')
const price = computed(() => valueToAmount(value.value))
</script>

<template>
  <section class="flex flex-col gap-4 wide:gap-3 tall:gap-3" aria-label="Precio base">
    <div class="flex min-h-12 items-center justify-between gap-3">
      <h2 class="text-xl font-extrabold">Precio base por kilo</h2>
      <button type="button" class="btn-secondary" :disabled="busy" @click="emit('cancel')">
        <StrokeIcon name="close" class="text-xl" />
        <span>Cancelar</span>
      </button>
    </div>

    <p class="text-lg text-ink-2">
      Con este precio se sugiere cuánto cobrar en cada parada; el repartidor puede anotar otra
      cantidad.
    </p>

    <KgReadout :value="value" label="Pesos por kilo" unit="money" />
    <KgKeypad v-model="value" unit="money" :disabled="busy" />

    <p v-if="error" class="error-alert" role="alert">{{ error }}</p>

    <button
      type="button"
      class="btn-primary w-full"
      :disabled="price <= 0 || busy"
      @click="emit('confirm', price)"
    >
      <span>{{ busy ? 'Guardando…' : 'Guardar precio' }}</span>
      <StrokeIcon v-if="!busy" name="arrow" />
    </button>
  </section>
</template>
