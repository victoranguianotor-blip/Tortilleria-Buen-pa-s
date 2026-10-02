<script setup lang="ts">
import FlapText from '@/components/FlapText.vue'

defineProps<{ value: string; label: string }>()
</script>

<template>
  <div
    class="flex items-end justify-between gap-4 rounded-md bg-flap px-3 py-2 ring-1 ring-steel-3"
  >
    <span class="caption pb-1 tall:sr-only">{{ label }}</span>
    <div class="flex items-end gap-2" aria-live="polite">
      <FlapText
        :text="value || '0'"
        :cells="5"
        align="right"
        size="lg"
        :tone="value ? 'amber' : 'steel'"
      />
      <span class="caption pb-1">kg</span>
    </div>
  </div>
</template>
