<script setup lang="ts">
import { computed } from 'vue'

import StrokeIcon from '@/components/StrokeIcon.vue'
import { useClock } from '@/composables/clock'
import { formatShortDate } from '@/utils/date'

const props = defineProps<{ date?: string | null; name: string }>()
defineEmits<{ logout: [] }>()

const time = useClock()
const dateText = computed(() => (props.date ? formatShortDate(props.date) : ''))
</script>

<template>
  <header class="topbar flex min-h-14 items-center gap-3 px-3 wide:px-4">
    <p
      class="flex items-baseline gap-2 font-bold tabular-nums"
      :class="{ 'max-md:hidden': $slots.default }"
    >
      <span v-if="dateText" class="text-ink-2">{{ dateText }}</span>
      <span>{{ time }}</span>
    </p>
    <slot />
    <p class="ml-auto hidden truncate font-semibold text-ink-2 sm:block">{{ name }}</p>
    <button
      type="button"
      class="btn-secondary quiet ml-auto sm:ml-0"
      aria-label="Salir"
      @click="$emit('logout')"
    >
      <StrokeIcon name="logout" class="text-xl" />
      <span class="max-sm:hidden">Salir</span>
    </button>
  </header>
</template>
