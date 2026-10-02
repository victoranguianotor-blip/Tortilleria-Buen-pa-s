<script setup lang="ts">
import { computed } from 'vue'

import FlapText from '@/components/FlapText.vue'
import IconoTrazo from '@/components/IconoTrazo.vue'
import { useReloj } from '@/composables/reloj'
import { fechaCorta } from '@/utils/fecha'

const props = defineProps<{ fecha?: string | null; nombre: string }>()
defineEmits<{ salir: [] }>()

const hora = useReloj()
const fechaTexto = computed(() => (props.fecha ? fechaCorta(props.fecha) : ''))
</script>

<template>
  <header class="marco flex items-center gap-4 px-4 py-2.5 horizontal:px-6">
    <div class="flex items-center gap-3">
      <FlapText v-if="fechaTexto" :texto="fechaTexto" tamano="sm" />
      <FlapText :texto="hora" tamano="sm" tono="ambar" />
    </div>
    <p class="rotulo ml-auto hidden truncate sm:block">{{ nombre }}</p>
    <button
      type="button"
      class="boton-acero ml-auto min-h-12! px-3! sm:ml-0"
      aria-label="Salir"
      @click="$emit('salir')"
    >
      <IconoTrazo nombre="salir" class="text-xl" />
      <span class="max-sm:hidden">Salir</span>
    </button>
  </header>
</template>
