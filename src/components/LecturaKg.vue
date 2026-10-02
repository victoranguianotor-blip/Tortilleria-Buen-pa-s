<script setup lang="ts">
// Lectura del valor tecleado, como la ventanilla de una báscula del tablero.
import FlapText from '@/components/FlapText.vue'

defineProps<{ valor: string; etiqueta: string }>()
</script>

<template>
  <div class="flex items-end justify-between gap-4 rounded-md bg-flap px-3 py-2">
    <span class="rotulo pb-1">{{ etiqueta }}</span>
    <div class="flex items-end gap-2" aria-live="polite">
      <FlapText
        :texto="valor || '0'"
        :celdas="5"
        alinear="der"
        tamano="lg"
        :tono="valor ? 'ambar' : 'acero'"
      />
      <span class="rotulo pb-1">kg</span>
    </div>
  </div>
</template>
