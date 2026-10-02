<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import StrokeIcon from '@/components/StrokeIcon.vue'
import { applyKey, type KeypadKey } from '@/utils/keypad'

const value = defineModel<string>({ required: true })
const props = defineProps<{ disabled?: boolean }>()

const keys: KeypadKey[] = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'half', '0', 'backspace']

function press(key: KeypadKey) {
  if (!props.disabled) value.value = applyKey(value.value, key)
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return
  if (/^[0-9]$/.test(e.key)) press(e.key as KeypadKey)
  else if (e.key === '.' || e.key === ',' || e.key.toLowerCase() === 'm') press('half')
  else if (e.key === 'Backspace') press('backspace')
  else return
  e.preventDefault()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="keypad" role="group" aria-label="Teclado de kilos">
    <button
      v-for="k in keys"
      :key="k"
      type="button"
      class="key"
      :class="{ fn: k === 'half' || k === 'backspace' }"
      :disabled="disabled"
      :aria-label="k === 'half' ? 'Medio kilo' : k === 'backspace' ? 'Borrar' : k"
      @click="press(k)"
    >
      <StrokeIcon v-if="k === 'backspace'" name="backspace" />
      <template v-else-if="k === 'half'">½</template>
      <template v-else>{{ k }}</template>
    </button>
  </div>
</template>

<style scoped>
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
}

.key {
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(3.2rem, 7.5vh, 4.1rem);
  border-radius: 6px;
  background: linear-gradient(180deg, #222226 0 50%, #1a1a1d 50% 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 2px 4px rgb(0 0 0 / 0.6);
  color: var(--color-ink);
  font-size: 2.3rem;
  font-weight: 600;
  transition:
    transform 90ms ease-out,
    background 160ms ease-out,
    color 160ms ease-out;
}

.key::after {
  content: '';
  position: absolute;
  inset: calc(50% - 0.5px) 6px auto;
  height: 1px;
  background: rgb(0 0 0 / 0.8);
}

@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .key {
    min-height: 3.3rem;
  }
}
@media (min-width: 960px) and (orientation: landscape) {
  .key {
    min-height: clamp(3rem, 6.8vh, 4.1rem);
  }
}

.key.fn {
  color: var(--color-steel);
}

.key:active:not(:disabled) {
  transform: translateY(1px);
  background: var(--color-amber);
  color: var(--color-flap);
  transition-duration: 0ms;
}

.key:disabled {
  opacity: 0.4;
}
</style>
