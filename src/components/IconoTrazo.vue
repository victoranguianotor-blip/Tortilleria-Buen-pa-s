<script setup lang="ts">
// Iconos propios, trazo de 2px, esquinas cuadradas como el tablero.
defineProps<{
  nombre: 'flecha' | 'salir' | 'retroceso' | 'basura' | 'ojo' | 'ojo-no' | 'x' | 'lapiz'
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
    <template v-if="nombre === 'flecha'">
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </template>
    <template v-else-if="nombre === 'salir'">
      <path d="M10 4H5v16h5" />
      <path d="M10 12h10" />
      <path d="M16 8l4 4-4 4" />
    </template>
    <template v-else-if="nombre === 'retroceso'">
      <path d="M9 5h11v14H9l-6-7z" />
      <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
    </template>
    <template v-else-if="nombre === 'basura'">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </template>
    <template v-else-if="nombre === 'ojo'">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </template>
    <template v-else-if="nombre === 'ojo-no'">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <path d="M4 20L20 4" />
    </template>
    <template v-else-if="nombre === 'lapiz'">
      <path d="M4 20l1-5L15.5 4.5l4 4L9 19z" />
      <path d="M13 7l4 4" />
    </template>
    <template v-else-if="nombre === 'x'">
      <path d="M6 6l12 12M18 6L6 18" />
    </template>
  </svg>
</template>
