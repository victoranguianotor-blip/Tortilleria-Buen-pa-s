<script setup lang="ts">
defineProps<{ value: string; label: string }>()
</script>

<template>
  <div
    class="flex items-baseline justify-between gap-4 rounded-md border border-line bg-ground px-4 py-2.5"
  >
    <span class="label tall:sr-only">{{ label }}</span>
    <p class="flex items-baseline gap-1.5" aria-live="polite">
      <span class="figure-value text-4xl" :class="value ? 'text-ink' : 'text-ink-3'">
        {{ value || '0' }}
      </span>
      <span class="font-semibold text-ink-2">kg</span>
    </p>
  </div>
</template>
