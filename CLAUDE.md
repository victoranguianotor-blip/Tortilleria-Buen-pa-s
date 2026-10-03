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
npx vitest run -t "formats"           # un solo test por nombre
```

Detalle del backend (modelo, RLS, Edge Function, pruebas): `docs/backend.md`.

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
  llaman a funciones de servicio. Motivo: en la fase offline (Dexie) las escrituras se encolarán en
  IndexedDB cambiando solo `services/`. Los IDs de filas nuevas se generan en el cliente
  (`crypto.randomUUID()`) para que reintentar una escritura encolada sea idempotente.
- **Roles y seguridad en la BD, no en el cliente.** `profiles.role` es `driver | admin`. Las
  políticas RLS son la fuente de verdad: el driver (activo) solo ve lo suyo y solo escribe
  `deliveries` en su ruta **de hoy y abierta**; el admin lee todo, no captura rutas ni paradas (solo ventas de mostrador), no edita su
  propio perfil y reabre rutas con `rpc('reopen_route')`. Hay GRANTs por columna (p. ej. en
  `routes` solo se actualizan `initial_kg`, `departed_at` y `closed_at`). Los helpers de las políticas
  (`is_admin`, `is_active`, `is_my_open_route`, `handle_new_user`) viven en el schema `private`, no
  expuesto por la API. Los guards del router son solo UX.
- **Fecha de negocio = Colima** (`America/Mexico_City`). Usa `public.business_today()` en SQL; en
  el cliente no derives "hoy" de UTC.
- **Login con usuario.** Supabase Auth usa `<username>@reparto.local`; si lo tecleado contiene `@`
  se usa tal cual (el admin original entra con su email real). El trigger `handle_new_user` crea el
  `profiles` con rol `driver`. No hay registro público: los usuarios los crea el admin con la Edge
  Function `supabase/functions/admin-users` (acciones `create`, `set_password`, `set_active`;
  desactivar también bloquea el login vía `ban_duration`). Usa la secret key y se despliega con
  `deploy_edge_function` y `verify_jwt: false`: la plataforma no valida claves `sb_*`, así que la
  función verifica sesión y rol admin en su código.
- **Salida y cobro.** La ruta se crea al capturar la carga y queda "Por salir" hasta que el
  repartidor toca "Salir a ruta" (`routes.departed_at`, inmutable una vez puesta); antes de eso la
  RLS no deja registrar paradas. Una entrega solo deja kg, sin dinero. Al final del día el
  repartidor vuelve a cada tienda y registra **una recolección por tienda** con los kg sobrantes que
  recoge y el dinero que recibe (`received_amount`, pesos con centavos, 0 permitido; la BD solo lo
  admite en `pickup`). El admin fija dos precios globales en `settings`: `price_per_kg` = precio a tienda y `counter_price_per_kg` = precio en tortillería, ambos en Ajustes → Precios. La recolección usa el de tienda y sugiere el dinero de
  lo que se dejó en esa tienda (`src/utils/pickup.ts`, por nombre de parada); el repartidor puede
  cambiarlo. Suma en centavos en `src/utils/money.ts`.
- **Tipos de parada.** `deliveries.kind` es `delivery` o `pickup` (recolección: kilos que se
  recogen de una tienda y su dinero). Las recolecciones se cuentan aparte ("Recogido") y no tocan
  entregado ni restante. Cualquier parada puede llevar `notes`.
- **Resumen** (kg iniciales/entregados/restantes y cobrado) sale de la vista `route_summaries`
  (`security_invoker`, respeta RLS). Los cálculos de kg en el cliente usan `src/utils/kg.ts`
  (suma en centésimas para evitar errores de punto flotante). Los kg restantes pueden ser negativos:
  la sobre-entrega se advierte, no se bloquea.
- **Ventas de mostrador.** Lo que se vende en el propio negocio (`sales`: kg, dinero y nota, sin
  método de pago) las registra el encargado (admin) en `/admin/sales`. Solo se crean, corrigen y
  borran las del día actual (RLS). Los permisos pasan por `private.can_register_sales()`: cuando
  exista el cajero se agrega ahí, sin tocar las políticas. El dinero sugerido es `kg × precio en tortillería`.
- **Navegación del admin** (`AdminNav`): Rutas (`/admin`, seguimiento del día), Ventas
  (`/admin/sales`, captura de mostrador), Reportes (`/admin/reports`, resumen del día y descarga
  PDF/CSV) y Ajustes (`/admin/settings`, con Precios y Usuarios; `/admin/users` redirige ahí). El
  selector de día es `DayPicker` + `useDayQuery` (`?date=`).
- **Reporte diario.** `src/utils/report.ts` arma el modelo del día (rutas y ventas de mostrador) y el CSV (lógica pura, con
  tests). Cada ruta lista todos sus movimientos en orden (salida, cada entrega y recolección, cierre) y un
  balance por tienda (dejó, recogió, sin recoger, cobrado); `src/utils/reportPdf.ts` dibuja el PDF carta con jsPDF, importado bajo demanda. Las
  dependencias opcionales de jsPDF (`html2canvas`, `dompurify`, `canvg`) quedan fuera del precache
  del service worker (`globIgnores` en `vite.config.ts`).

## Diseño

Mundo visual "señalamiento vial": oscuro, plano y de alto contraste para leerse con sol. `PRODUCT.md`
guarda el contexto de producto y `DESIGN.md` los tokens y reglas visuales; respétalos al agregar
pantallas. Tokens en `src/style.css` (`ground`, `panel`, `raised`, `line`, `ink`/`ink-2`/`ink-3`,
`signal` = amarillo solo para la acción principal, el foco y la advertencia, `go` = verde solo para
"en ruta", `danger` = sobre-entrega y borrar), fuente Overpass en oración normal y cifras
tabulares. Clases de componente: `.panel`, `.topbar`, `.label`, `.figure-value`, `.field`,
`.btn-primary`, `.btn-secondary` (`.quiet`, `.danger`), `.list-row` (`.selected`, `.fresh`),
`.list-head`, `.error-alert`; variantes `wide:` (tablet horizontal) y `tall:` (tablet vertical).
Sin sombras, relieves ni animaciones decorativas: el único momento animado es el destello amarillo
de `FlashValue` (cifra de Quedan) y de la parada recién registrada. El brief y el contrato de
dirección están en `.impeccable/surfaces/`.

## Convenciones

- **Código en inglés** (archivos, componentes, variables, funciones, clases CSS, tablas y columnas,
  URLs). **Textos de la interfaz en español** (es-MX), incluidos `aria-label` y mensajes de error.
- Sin comentarios, salvo los que expliquen algo no obvio e importante (p. ej. un comportamiento de
  RLS o una decisión de seguridad).
- UI para tablet: botones y campos grandes (área táctil ≥ 48px); los kg se capturan con
  `KgKeypad` (enteros y medios) y el dinero con `KgKeypad unit="money"` (punto y dos decimales).
- Simple y sin dependencias nuevas salvo necesidad clara. Tests de Vitest solo para lógica pura
  (`*.test.ts` junto al archivo, entorno node).
- Prettier: sin punto y coma, comillas simples, 100 columnas.
- Commits pequeños por fase.

## Fases

1. Setup, PWA y Supabase (tablas, auth, RLS, Edge Function `admin-users`) — hecho
2. Login y pantalla del repartidor — hecho
3. Dashboard del admin (incluye alta de usuarios) — hecho
4. Reporte diario PDF/CSV con detalle — hecho
5. Pulido para tablet y despliegue en Netlify
   - Pendiente para lanzar: llenar `owner` y `address` en `src/legal.ts` (aviso de privacidad
     y términos en `/privacy` y `/terms`), poner `IN_DEVELOPMENT = false` (quita los avisos de
     "en prueba") y borrar las cuentas `prueba_*` con sus rutas.
6. (después) Offline con Dexie
