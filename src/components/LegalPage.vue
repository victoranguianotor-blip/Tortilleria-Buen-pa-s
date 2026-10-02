<script setup lang="ts">
import { useRouter } from 'vue-router'

import DevNotice from '@/components/DevNotice.vue'
import StrokeIcon from '@/components/StrokeIcon.vue'
import { IN_DEVELOPMENT, LEGAL } from '@/legal'
import { formatLongDate } from '@/utils/date'

defineProps<{ title: string }>()

const router = useRouter()

function back() {
  if (window.history.state?.back) router.back()
  else router.replace({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh">
    <header class="topbar sticky top-0 flex min-h-14 items-center gap-3 px-3 wide:px-4">
      <button type="button" class="btn-secondary quiet" @click="back">
        <StrokeIcon name="chevron-left" class="text-xl" />
        <span>Regresar</span>
      </button>
      <nav class="ml-auto flex gap-1" aria-label="Documentos legales">
        <RouterLink :to="{ name: 'privacy' }" class="doc-link" exact-active-class="current">
          Privacidad
        </RouterLink>
        <RouterLink :to="{ name: 'terms' }" class="doc-link" exact-active-class="current">
          Términos
        </RouterLink>
      </nav>
    </header>

    <main class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl leading-tight font-extrabold">{{ title }}</h1>
        <p class="text-ink-3">Última actualización: {{ formatLongDate(LEGAL.updatedAt) }}</p>
      </div>
      <DevNotice v-if="IN_DEVELOPMENT">
        <template #title>Borrador: documento todavía no vigente</template>
        La aplicación está en pruebas y aún no se usa de forma oficial. Este documento es una
        versión preliminar: le faltan datos del negocio y puede cambiar antes de entrar en vigor.
      </DevNotice>
      <article class="legal">
        <slot />
      </article>
    </main>
  </div>
</template>

<style scoped>
.doc-link {
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
.doc-link:active {
  background: var(--color-line);
}
.doc-link.current {
  background: var(--color-raised);
  color: var(--color-ink);
  box-shadow: inset 0 -2px 0 var(--color-signal);
}

.legal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--color-ink-2);
  font-size: 1.0625rem;
  line-height: 1.6;
}
.legal :slotted(h2) {
  margin-top: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-line);
  color: var(--color-ink);
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.3;
}
.legal :slotted(ul) {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-left: 1.25rem;
  list-style: disc;
}
.legal :slotted(strong) {
  color: var(--color-ink);
}
.legal :slotted(a) {
  color: var(--color-signal);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
