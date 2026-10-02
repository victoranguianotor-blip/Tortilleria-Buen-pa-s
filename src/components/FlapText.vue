<script setup lang="ts">
// Cells are keyed by position + character, so only changed characters remount and flip.
import { computed, onMounted, ref, type Directive } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    cells?: number
    align?: 'left' | 'right'
    size?: 'xl' | 'title' | 'lg' | 'md' | 'sm'
    tone?: 'ink' | 'amber' | 'danger' | 'steel'
    animate?: boolean
  }>(),
  { align: 'left', size: 'md', tone: 'ink', animate: false },
)

const mounted = ref(false)
onMounted(() => requestAnimationFrame(() => (mounted.value = true)))

const chars = computed(() => {
  const text = props.text.toUpperCase()
  const padding = ' '.repeat(Math.max(0, (props.cells ?? 0) - text.length))
  return [...(props.align === 'right' ? padding + text : text + padding)]
})

const vFlip: Directive<HTMLElement, boolean> = {
  mounted(el, { value }) {
    if (value) el.classList.add('flipping')
  },
}
</script>

<template>
  <span class="flaps" :class="[`flaps-${size}`, `tone-${tone}`]">
    <span class="sr-only">{{ text }}</span>
    <span
      v-for="(c, i) in chars"
      :key="`${i}-${c}`"
      v-flip="mounted || animate"
      class="flap"
      :class="{ empty: c === ' ' }"
      :style="{ '--i': i }"
      aria-hidden="true"
      >{{ c === ' ' ? ' ' : c }}</span
    >
  </span>
</template>

<style scoped>
.flaps {
  display: inline-flex;
  gap: 0.07em;
  font-family: var(--font-board);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.flaps-xl {
  font-size: clamp(4rem, 7vw + 1rem, 7rem);
}
@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .flaps-xl {
    font-size: 3.6rem;
  }
}
.flaps-title {
  font-size: clamp(3rem, 5vw + 1rem, 5.5rem);
}
.flaps-lg {
  font-size: clamp(2.4rem, 4.4vw, 3.4rem);
}
.flaps-md {
  font-size: clamp(1.3rem, 1.2vw + 0.9rem, 1.7rem);
}
.flaps-sm {
  font-size: 1.15rem;
}

.flap {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 0.72em;
  height: 1.16em;
  border-radius: 0.07em;
  background: linear-gradient(180deg, #212125 0 50%, #19191c 50% 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 0.03em 0.06em rgb(0 0 0 / 0.7);
  color: var(--tone);
}

.flap::after {
  content: '';
  position: absolute;
  inset: calc(50% - 0.5px) 0 auto;
  height: 1px;
  background: rgb(0 0 0 / 0.85);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.04);
}

.flap.empty {
  background: linear-gradient(180deg, #19191c 0 50%, #151517 50% 100%);
}

.tone-ink {
  --tone: var(--color-ink);
}
.tone-amber {
  --tone: var(--color-amber);
}
.tone-danger {
  --tone: var(--color-danger);
}
.tone-steel {
  --tone: var(--color-steel);
}

.flipping {
  animation: flip 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 55ms);
}

@keyframes flip {
  0% {
    transform: perspective(6em) rotateX(-92deg);
    filter: brightness(1.8);
  }
  55% {
    transform: perspective(6em) rotateX(14deg);
  }
  100% {
    transform: none;
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flipping {
    animation: none;
  }
}
</style>
