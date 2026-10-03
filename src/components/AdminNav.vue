<template>
  <nav class="flex gap-1" aria-label="Secciones">
    <RouterLink :to="{ name: 'admin' }" class="nav-link" exact-active-class="current">
      Rutas
    </RouterLink>
    <RouterLink :to="{ name: 'sales' }" class="nav-link" exact-active-class="current">
      Ventas
    </RouterLink>
    <RouterLink :to="{ name: 'reports' }" class="nav-link" exact-active-class="current">
      Reportes
    </RouterLink>
    <RouterLink :to="{ name: 'settings' }" class="nav-link" active-class="current">
      Ajustes
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0 0.9rem;
  border: 1px solid var(--color-edge);
  border-radius: 6px;
  background: var(--color-raised);
  color: var(--color-ink-2);
  font-weight: 700;
}
.nav-link:active {
  background: var(--color-line);
}
.nav-link.current {
  background: var(--color-raised);
  color: var(--color-ink);
  box-shadow: inset 0 -2px 0 var(--color-signal);
}
</style>
