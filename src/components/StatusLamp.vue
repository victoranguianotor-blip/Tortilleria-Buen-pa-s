<script setup lang="ts">
import FlapText from '@/components/FlapText.vue'

defineProps<{ text: string; tone: 'amber' | 'danger' | 'steel' }>()
</script>

<template>
  <p class="lamp" :class="`lamp-${tone}`" role="status">
    <span class="bulb" aria-hidden="true" />
    <FlapText :text="text" size="sm" :tone="tone" />
  </p>
</template>

<style scoped>
.lamp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  background: #000;
}
.lamp-amber {
  box-shadow: 0 0 0 1px var(--color-amber-dark);
}
.lamp-danger {
  box-shadow: 0 0 0 1px var(--color-danger-dark);
}

.bulb {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--color-steel-3);
}
.lamp-amber .bulb {
  background: var(--color-amber);
  box-shadow: 0 0 10px 1px rgb(255 180 0 / 0.6);
}
.lamp-danger .bulb {
  background: var(--color-danger);
  box-shadow: 0 0 10px 1px rgb(255 77 77 / 0.6);
}
</style>
