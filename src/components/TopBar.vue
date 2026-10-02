<script setup lang="ts">
import { computed } from 'vue'

import FlapText from '@/components/FlapText.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { useClock } from '@/composables/clock'
import { formatShortDate } from '@/utils/date'

const props = defineProps<{ date?: string | null; name: string }>()
defineEmits<{ logout: [] }>()

const time = useClock()
const dateText = computed(() => (props.date ? formatShortDate(props.date) : ''))
</script>

<template>
  <header class="steel-band flex items-center gap-4 px-4 py-2 wide:px-6">
    <div class="flex items-center gap-3">
      <FlapText v-if="dateText" :text="dateText" size="sm" />
      <FlapText :text="time" size="sm" />
    </div>
    <p class="caption ml-auto hidden truncate text-flap! sm:block">{{ name }}</p>
    <button
      type="button"
      class="btn-plate ml-auto sm:ml-0"
      aria-label="Salir"
      @click="$emit('logout')"
    >
      <StrokeIcon name="logout" class="text-xl" />
      <span class="max-sm:hidden">Salir</span>
    </button>
  </header>
</template>
