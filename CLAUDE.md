# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

PWA para repartidores de tortilla, pensada para tablets Android. El repartidor registra los kg con
que inicia su ruta del día y los kg que deja en cada parada; el admin ve un resumen de todos y genera
un reporte diario (PDF y CSV) con el detalle de entregas.

Stack: Vue 3 + TypeScript + Vite, `vite-plugin-pwa`, Pinia, Vue Router, Tailwind v4 (vía
`@tailwindcss/vite`, sin `tailwind.config`), Supabase (Postgres + Auth + RLS), jsPDF, Vitest.
Despliegue en Netlify.

## Comandos

```sh
npm run dev            # servidor de desarrollo (http://localhost:5173)
npm run build          # type-check (vue-tsc) + build de producción con service worker
npm run preview        # sirve dist/ (para probar la PWA/instalación)
npm run lint           # oxlint + eslint, ambos con --fix
npm run format         # prettier sobre src/
npm run test:run       # vitest una vez; `npm test` en modo watch
npx vitest run src/utils/kg.test.ts   # un solo archivo
npx vitest run -t "formatea"          # un solo test por nombre
```

Supabase (CLI instalada como devDependency). Las credenciales de la CLI viven en `.env` sin prefijo
`VITE_`; cárgalas antes de usarla (Git Bash):

```sh
set -a; . ./.env; set +a
npx supabase link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"   # una vez
npm run db:push        # aplica supabase/migrations/ al proyecto remoto
npm run db:types       # regenera src/types/database.ts desde el esquema remoto
```

Tras cambiar el esquema: nueva migración en `supabase/migrations/` (nunca editar una ya aplicada),
`db:push`, `db:types`.

## Arquitectura

- **Capa de servicio obligatoria.** Solo `src/services/` importa `@/lib/supabase`. Vistas y stores
  llaman a funciones de servicio. Motivo: en la fase 2 (offline con Dexie) las escrituras se
  encolarán en IndexedDB cambiando solo `services/`. Los IDs de filas nuevas se generan en el
  cliente (`crypto.randomUUID()`) para que reintentar una escritura encolada sea idempotente.
- **Roles y seguridad en la BD, no en el cliente.** `profiles.rol` es `repartidor | admin`. Las
  políticas RLS (`supabase/migrations/*_esquema_inicial.sql`) son la fuente de verdad: el repartidor
  solo ve lo suyo y solo escribe entregas en su ruta **de hoy y abierta** (`es_mi_ruta_abierta`);
  el admin lee todo vía `is_admin()`. Además hay GRANTs por columna (p. ej. en `rutas` solo se
  actualizan `kg_iniciales` y `cerrada_at`). Los guards del router son solo UX.
- **Fecha de negocio = Colima** (`America/Mexico_City`). Usa `public.hoy_colima()` en SQL; en el
  cliente no derives "hoy" de UTC.
- **Login con usuario, no email.** Supabase Auth usa `<usuario>@reparto.local`; el trigger
  `handle_new_user` crea el `profiles` con rol `repartidor`. No hay registro público: los usuarios
  los crea el admin desde la app mediante una Edge Function (usa la service role key, que nunca va
  en el frontend).
- **Resumen** (kg iniciales/entregados/restantes) sale de la vista `resumen_rutas`
  (`security_invoker`, respeta RLS). Los cálculos de kg en el cliente usan `src/utils/kg.ts`
  (suma en centésimas para evitar errores de punto flotante). Los kg restantes pueden ser negativos:
  la sobre-entrega se advierte, no se bloquea.

## Convenciones

- Textos de la interfaz en español (es-MX); nombres de dominio en español (`ruta`, `entrega`,
  `parada`, `repartidor`).
- UI para tablet: botones y campos grandes (área táctil ≥ 48px), `inputmode="decimal"` para kg.
- Simple y sin dependencias nuevas salvo necesidad clara. Tests de Vitest solo para lógica pura
  (`*.test.ts` junto al archivo, entorno node).
- Prettier: sin punto y coma, comillas simples, 100 columnas.
- Commits pequeños por fase.

## Fases

1. Setup, PWA y Supabase (tablas, auth, RLS) — hecho
2. Login y pantalla del repartidor
3. Dashboard del admin (incluye alta de usuarios)
4. Reporte diario PDF/CSV con detalle
5. Pulido para tablet y despliegue en Netlify
6. (después) Offline con Dexie
