<script setup lang="ts">
import { ref } from 'vue'

import StrokeIcon from '@/components/StrokeIcon.vue'
import { addDays, formatShortDate } from '@/utils/date'

const props = defineProps<{ date: string; today: string }>()
const emit = defineEmits<{ change: [date: string] }>()

const picker = ref<HTMLInputElement | null>(null)

function openPicker() {
  const input = picker.value
  if (!input) return
  if (typeof input.showPicker === 'function') input.showPicker()
  else input.click()
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      type="button"
      class="btn-secondary quiet size-12 p-0!"
      aria-label="Día anterior"
      @click="emit('change', addDays(props.date, -1))"
    >
      <StrokeIcon name="chevron-left" class="text-2xl" />
    </button>
    <button
      type="button"
      class="relative min-h-12 rounded-md border border-edge bg-raised px-3 text-xl font-extrabold active:bg-line"
      :class="{ 'text-signal': props.date !== props.today }"
      aria-label="Elegir día"
      @click="openPicker"
    >
      {{ formatShortDate(props.date) }}
      <input
        ref="picker"
        type="date"
        class="pointer-events-none absolute inset-0 opacity-0"
        tabindex="-1"
        aria-hidden="true"
        :value="props.date"
        :max="props.today"
        @change="emit('change', ($event.target as HTMLInputElement).value || props.today)"
      />
    </button>
    <button
      type="button"
      class="btn-secondary quiet size-12 p-0! disabled:opacity-40"
      aria-label="Día siguiente"
      :disabled="props.date === props.today"
      @click="emit('change', addDays(props.date, 1))"
    >
      <StrokeIcon name="chevron-right" class="text-2xl" />
    </button>
    <button
      v-if="props.date !== props.today"
      type="button"
      class="btn-secondary ml-1"
      @click="emit('change', props.today)"
    >
      Hoy
    </button>
  </div>
</template>
