<template>
  <div class="dev-notice" role="note">
    <p class="font-extrabold text-ink">
      <slot name="title">Versión en desarrollo</slot>
    </p>
    <p><slot /></p>
  </div>
</template>

<style scoped>
.dev-notice {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-signal);
  border-radius: 6px;
  background: var(--color-signal-soft);
  color: var(--color-ink-2);
  font-size: 1rem;
  line-height: 1.45;
}
</style>
