<script setup lang="ts">
// Texto de tablero: cada carácter en su paleta. Una celda cuyo carácter cambia se monta de
// nuevo (key = posición + carácter) y se voltea; las demás no se mueven. En el primer render
// no se anima nada, salvo que `animar` lo pida (un renglón recién agregado).
import { computed, onMounted, ref, type Directive } from 'vue'

const props = withDefaults(
  defineProps<{
    texto: string
    celdas?: number
    alinear?: 'izq' | 'der'
    tamano?: 'xl' | 'titulo' | 'lg' | 'md' | 'sm'
    tono?: 'tinta' | 'ambar' | 'rojo' | 'acero'
    animar?: boolean
  }>(),
  { alinear: 'izq', tamano: 'md', tono: 'tinta', animar: false },
)

const montado = ref(false)
onMounted(() => requestAnimationFrame(() => (montado.value = true)))

const caracteres = computed(() => {
  const texto = props.texto.toUpperCase()
  const relleno = ' '.repeat(Math.max(0, (props.celdas ?? 0) - texto.length))
  return [...(props.alinear === 'der' ? relleno + texto : texto + relleno)]
})

const vVoltear: Directive<HTMLElement, boolean> = {
  mounted(el, { value }) {
    if (value) el.classList.add('voltea')
  },
}
</script>

<template>
  <span class="flaps" :class="[`flaps-${tamano}`, `tono-${tono}`]">
    <span class="sr-only">{{ texto }}</span>
    <span
      v-for="(c, i) in caracteres"
      :key="`${i}-${c}`"
      v-voltear="montado || animar"
      class="flap"
      :class="{ vacia: c === ' ' }"
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
  font-family: var(--font-tablero);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.flaps-xl {
  font-size: clamp(4rem, 7vw + 1rem, 7rem);
}
.flaps-titulo {
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
  color: var(--tono);
}

/* Línea de corte entre la mitad de arriba y la de abajo. */
.flap::after {
  content: '';
  position: absolute;
  inset: calc(50% - 0.5px) 0 auto;
  height: 1px;
  background: rgb(0 0 0 / 0.85);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.04);
}

.flap.vacia {
  background: linear-gradient(180deg, #19191c 0 50%, #151517 50% 100%);
}

.tono-tinta {
  --tono: var(--color-tinta);
}
.tono-ambar {
  --tono: var(--color-ambar);
}
.tono-rojo {
  --tono: var(--color-rojo);
}
.tono-acero {
  --tono: var(--color-acero);
}

.voltea {
  animation: voltear 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 55ms);
}

@keyframes voltear {
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
  .voltea {
    animation: none;
  }
}
</style>
