<script setup lang="ts">
withDefaults(
  defineProps<{
    value: string
    label: string
    unit?: 'kg' | 'money'
    active?: boolean
    stacked?: boolean
  }>(),
  { unit: 'kg', active: false, stacked: false },
)
</script>

<template>
  <div
    class="flex rounded-md border bg-ground px-4 py-2.5"
    :class="[
      active ? 'readout-active border-signal' : 'border-line',
      stacked ? 'flex-col gap-1.5' : 'items-baseline justify-between gap-4',
    ]"
  >
    <span class="label" :class="{ 'tall:sr-only': !stacked }">{{ label }}</span>
    <p class="flex items-baseline gap-1.5" aria-live="polite">
      <span v-if="unit === 'money'" class="font-semibold text-ink-2">$</span>
      <span class="figure-value text-4xl" :class="value ? 'text-ink' : 'text-ink-3'">
        {{ value || '0' }}
      </span>
      <span v-if="unit === 'kg'" class="font-semibold text-ink-2">kg</span>
    </p>
  </div>
</template>

<style scoped>
.readout-active {
  box-shadow: inset 0 0 0 1px var(--color-signal);
}
</style>
