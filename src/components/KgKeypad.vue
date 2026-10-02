<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'

import StrokeIcon from '@/components/StrokeIcon.vue'
import { applyKey, applyMoneyKey, type KeypadKey, type MoneyKey } from '@/utils/keypad'

type Key = KeypadKey | MoneyKey

const value = defineModel<string>({ required: true })
const props = withDefaults(
  defineProps<{ disabled?: boolean; unit?: 'kg' | 'money'; replace?: boolean }>(),
  { unit: 'kg', replace: false },
)

const money = computed(() => props.unit === 'money')
const keys = computed<Key[]>(() => [
  '7',
  '8',
  '9',
  '4',
  '5',
  '6',
  '1',
  '2',
  '3',
  money.value ? 'dot' : 'half',
  '0',
  'backspace',
])

// With `replace`, the first key starts a new value instead of editing the shown one.
function press(key: Key) {
  if (props.disabled) return
  const base = props.replace ? '' : value.value
  value.value = money.value
    ? applyMoneyKey(base, key as MoneyKey)
    : applyKey(base, key as KeypadKey)
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return
  if (/^[0-9]$/.test(e.key)) press(e.key as Key)
  else if (e.key === '.' || e.key === ',') press(money.value ? 'dot' : 'half')
  else if (!money.value && e.key.toLowerCase() === 'm') press('half')
  else if (e.key === 'Backspace') press('backspace')
  else return
  e.preventDefault()
}

function keyLabel(k: Key): string {
  if (k === 'half') return 'Medio kilo'
  if (k === 'dot') return 'Punto decimal'
  if (k === 'backspace') return 'Borrar'
  return k
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="keypad" role="group" :aria-label="money ? 'Teclado de pesos' : 'Teclado de kilos'">
    <button
      v-for="k in keys"
      :key="k"
      type="button"
      class="key"
      :class="{ fn: k === 'half' || k === 'dot' || k === 'backspace' }"
      :disabled="disabled"
      :aria-label="keyLabel(k)"
      @click="press(k)"
    >
      <StrokeIcon v-if="k === 'backspace'" name="backspace" />
      <template v-else-if="k === 'half'">½</template>
      <template v-else-if="k === 'dot'">.</template>
      <template v-else>{{ k }}</template>
    </button>
  </div>
</template>

<style scoped>
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.key {
  display: grid;
  place-items: center;
  min-height: clamp(3rem, 7vh, 3.75rem);
  border-radius: 6px;
  background: var(--color-raised);
  border: 1px solid var(--color-line);
  color: var(--color-ink);
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition:
    background 140ms ease-out,
    color 140ms ease-out;
}

@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .key {
    min-height: 3.25rem;
  }
}

.key.fn {
  color: var(--color-ink-2);
  font-size: 1.5rem;
}

.key:active:not(:disabled) {
  background: var(--color-signal);
  border-color: var(--color-signal);
  color: var(--color-signal-ink);
  transition-duration: 0ms;
}

.key:disabled {
  opacity: 0.4;
}
</style>
