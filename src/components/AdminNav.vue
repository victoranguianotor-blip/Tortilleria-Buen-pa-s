<template>
  <nav class="flex gap-1" aria-label="Secciones">
    <RouterLink :to="{ name: 'admin' }" class="nav-link" exact-active-class="current">
      Rutas
    </RouterLink>
    <RouterLink :to="{ name: 'users' }" class="nav-link" exact-active-class="current">
      Usuarios
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0 0.9rem;
  border-radius: 6px;
  color: var(--color-ink-2);
  font-weight: 700;
}
.nav-link:active {
  background: var(--color-raised);
}
.nav-link.current {
  background: var(--color-raised);
  color: var(--color-ink);
  box-shadow: inset 0 -2px 0 var(--color-signal);
}
</style>
