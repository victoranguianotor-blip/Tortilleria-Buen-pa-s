<script setup lang="ts">
defineProps<{
  name:
    | 'arrow'
    | 'logout'
    | 'backspace'
    | 'trash'
    | 'eye'
    | 'eye-off'
    | 'close'
    | 'pencil'
    | 'chevron-left'
    | 'chevron-right'
    | 'refresh'
    | 'plus'
}>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="square"
    stroke-linejoin="miter"
    aria-hidden="true"
  >
    <template v-if="name === 'arrow'">
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M10 4H5v16h5" />
      <path d="M10 12h10" />
      <path d="M16 8l4 4-4 4" />
    </template>
    <template v-else-if="name === 'backspace'">
      <path d="M9 5h11v14H9l-6-7z" />
      <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </template>
    <template v-else-if="name === 'eye-off'">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <path d="M4 20L20 4" />
    </template>
    <template v-else-if="name === 'pencil'">
      <path d="M4 20l1-5L15.5 4.5l4 4L9 19z" />
      <path d="M13 7l4 4" />
    </template>
    <template v-else-if="name === 'chevron-left'">
      <path d="M15 5l-7 7 7 7" />
    </template>
    <template v-else-if="name === 'chevron-right'">
      <path d="M9 5l7 7-7 7" />
    </template>
    <template v-else-if="name === 'refresh'">
      <path d="M19 12a7 7 0 1 1-2.05-4.95" />
      <path d="M19 4v4h-4" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6L6 18" />
    </template>
  </svg>
</template>
