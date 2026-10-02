<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const FLASH_MS = 1400

const props = defineProps<{ text: string }>()

const flashing = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.text,
  () => {
    flashing.value = false
    clearTimeout(timer)
    requestAnimationFrame(() => {
      flashing.value = true
      timer = setTimeout(() => (flashing.value = false), FLASH_MS)
    })
  },
)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span class="figure-value" :class="{ flash: flashing }">{{ text }}</span>
</template>
