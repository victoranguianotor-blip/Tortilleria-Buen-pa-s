<script setup lang="ts">
// Teclado de báscula: dígitos, medio kilo y borrar. También acepta el teclado físico
// (números, punto o "m" para el medio, retroceso) cuando no se está escribiendo en un campo.
import { onBeforeUnmount, onMounted } from 'vue'

import IconoTrazo from '@/components/IconoTrazo.vue'
import { aplicarTecla, type Tecla } from '@/utils/teclado'

const valor = defineModel<string>({ required: true })
const props = defineProps<{ deshabilitado?: boolean }>()

const teclas: Tecla[] = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'medio', '0', 'borrar']

function pulsar(tecla: Tecla) {
  if (!props.deshabilitado) valor.value = aplicarTecla(valor.value, tecla)
}

function alTeclear(e: KeyboardEvent) {
  const destino = e.target as HTMLElement | null
  if (destino?.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return
  if (/^[0-9]$/.test(e.key)) pulsar(e.key as Tecla)
  else if (e.key === '.' || e.key === ',' || e.key.toLowerCase() === 'm') pulsar('medio')
  else if (e.key === 'Backspace') pulsar('borrar')
  else return
  e.preventDefault()
}

onMounted(() => window.addEventListener('keydown', alTeclear))
onBeforeUnmount(() => window.removeEventListener('keydown', alTeclear))
</script>

<template>
  <div class="teclado" role="group" aria-label="Teclado de kilos">
    <button
      v-for="t in teclas"
      :key="t"
      type="button"
      class="tecla"
      :class="{ funcion: t === 'medio' || t === 'borrar' }"
      :disabled="deshabilitado"
      :aria-label="t === 'medio' ? 'Medio kilo' : t === 'borrar' ? 'Borrar' : t"
      @click="pulsar(t)"
    >
      <IconoTrazo v-if="t === 'borrar'" nombre="retroceso" />
      <template v-else-if="t === 'medio'">½</template>
      <template v-else>{{ t }}</template>
    </button>
  </div>
</template>

<style scoped>
.teclado {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
}

.tecla {
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(3.2rem, 7.5vh, 4.1rem);
  border-radius: 6px;
  background: linear-gradient(180deg, #222226 0 50%, #1a1a1d 50% 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 2px 4px rgb(0 0 0 / 0.6);
  color: var(--color-tinta);
  font-size: 2.3rem;
  font-weight: 600;
  transition:
    transform 90ms ease-out,
    background 160ms ease-out,
    color 160ms ease-out;
}

.tecla::after {
  content: '';
  position: absolute;
  inset: calc(50% - 0.5px) 6px auto;
  height: 1px;
  background: rgb(0 0 0 / 0.8);
}

/* Tablet de pie: el teclado cede altura para que se vean las paradas. */
@media (orientation: portrait) and (min-width: 700px) and (min-height: 1000px) {
  .tecla {
    min-height: 3.6rem;
  }
}

.tecla.funcion {
  color: var(--color-acero);
}

.tecla:active:not(:disabled) {
  transform: translateY(1px);
  background: var(--color-ambar);
  color: var(--color-flap);
  transition-duration: 0ms;
}

.tecla:disabled {
  opacity: 0.4;
}
</style>
