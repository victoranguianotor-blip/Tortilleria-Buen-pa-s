<template>
  <nav class="flex gap-2" aria-label="Secciones">
    <RouterLink :to="{ name: 'admin' }" class="btn-plate nav-plate" exact-active-class="current">
      Rutas
    </RouterLink>
    <RouterLink :to="{ name: 'users' }" class="btn-plate nav-plate" exact-active-class="current">
      Usuarios
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav-plate.current {
  background: var(--color-flap);
  color: var(--color-amber);
}
</style>
