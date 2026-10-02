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

Supabase se administra con el **MCP de Supabase** (scope local, proyecto `gmbixckrajmrpovsrymi`):

- Cambio de esquema: crear un archivo nuevo en `supabase/migrations/`, aplicarlo con
  `apply_migration` y renombrar el archivo al `version` que devuelve `list_migrations` (así el repo
  y el remoto coinciden). Nunca editar una migración ya aplicada.
- Después de cada cambio: correr `supabase/tests/rls_test.sql` completo con `execute_sql` (debe
  devolver `OK: ...`; hace ROLLBACK y no deja datos), revisar `get_advisors` (security y
  performance) y regenerar `src/types/database.ts` con `generate_typescript_types`.
- Los datos propios del entorno (p. ej. promover un admin) van por `execute_sql`, no en migraciones.

## Arquitectura

- **Capa de servicio obligatoria.** Solo `src/services/` importa `@/lib/supabase`. Vistas y stores
  llaman a funciones de servicio. Motivo: en la fase 2 (offline con Dexie) las escrituras se
  encolarán en IndexedDB cambiando solo `services/`. Los IDs de filas nuevas se generan en el
  cliente (`crypto.randomUUID()`) para que reintentar una escritura encolada sea idempotente.
- **Roles y seguridad en la BD, no en el cliente.** `profiles.rol` es `repartidor | admin`. Las
  políticas RLS (`supabase/migrations/*_esquema_inicial.sql`) son la fuente de verdad: el repartidor
  (activo) solo ve lo suyo y solo escribe entregas en su ruta **de hoy y abierta**; el admin lee
  todo, no captura datos, no edita su propio perfil y reabre rutas con `rpc('reabrir_ruta')`. Hay
  GRANTs por columna (p. ej. en `rutas` solo se actualizan `kg_iniciales` y `cerrada_at`). Los
  helpers de las políticas (`is_admin`, `soy_activo`, `es_mi_ruta_abierta`, `handle_new_user`)
  viven en el schema `private`, no expuesto por la API. Los guards del router son solo UX.
- **Fecha de negocio = Colima** (`America/Mexico_City`). Usa `public.hoy_colima()` en SQL; en el
  cliente no derives "hoy" de UTC.
- **Login con usuario.** Supabase Auth usa `<usuario>@reparto.local`; si lo tecleado contiene `@`
  se usa tal cual (el admin original entra con su email real). El trigger `handle_new_user` crea el
  `profiles` con rol `repartidor`. No hay registro público: los usuarios los crea el admin con la
  Edge Function `supabase/functions/admin-usuarios` (acciones `crear`, `cambiar_password`,
  `activar`; desactivar también bloquea el login vía `ban_duration`). Usa la secret key y se
  despliega con `deploy_edge_function` y `verify_jwt: false`: la plataforma no valida claves `sb_*`,
  así que la función verifica sesión y rol admin en su código.
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

1. Setup, PWA y Supabase (tablas, auth, RLS, Edge Function `admin-usuarios`) — hecho
2. Login y pantalla del repartidor
3. Dashboard del admin (incluye alta de usuarios)
4. Reporte diario PDF/CSV con detalle
5. Pulido para tablet y despliegue en Netlify
6. (después) Offline con Dexie
