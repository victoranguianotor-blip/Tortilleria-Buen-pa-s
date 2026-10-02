<script setup lang="ts">
defineProps<{ text: string; tone: 'go' | 'danger' | 'idle' }>()
</script>

<template>
  <p class="status" :class="`status-${tone}`" role="status">
    <span class="dot" aria-hidden="true" />
    {{ text }}
  </p>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2rem;
  padding: 0 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  color: var(--color-ink-2);
  font-size: 0.9375rem;
  font-weight: 700;
  white-space: nowrap;
}
.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-ink-3);
}
.status-go {
  border-color: var(--color-go);
  color: var(--color-go);
}
.status-go .dot {
  background: var(--color-go);
}
.status-danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
.status-danger .dot {
  background: var(--color-danger);
}
</style>
