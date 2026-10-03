# Backend (Supabase)

Proyecto Supabase: `gmbixckrajmrpovsrymi` (Postgres 17).
El esquema vive en `supabase/migrations/` (la primera migración está en español; la segunda,
`*_english_names.sql`, renombró todo a inglés conservando los datos; la tercera,
`*_departure_and_payments.sql`, agregó hora de salida, dinero cobrado y precio base; la cuarta,
`*_pickups_and_notes.sql`, agregó el tipo de parada y las notas, y renombró `delivered_kg` a `kg`; la quinta y la sexta, `*_settle_route_at_close.sql` y `*_money_on_pickups.sql`, probaron y revirtieron un cierre con totales por ruta: el dinero va por recolección, no en `routes`; la séptima, `*_sales.sql`, agregó las ventas de mostrador; la octava, `*_counter_price.sql`, el precio en tortillería). La gestión de usuarios está en
`supabase/functions/admin-users/`.

## Modelo de datos

```
auth.users ──1:1── profiles ──1:N── routes ──1:N── deliveries

settings (una sola fila)
```

### `profiles`

Un registro por usuario de Auth. Lo crea automáticamente el trigger `on_auth_user_created`.

| Columna      | Tipo             | Notas                                                     |
| ------------ | ---------------- | --------------------------------------------------------- |
| `id`         | uuid PK          | = `auth.users.id` (se borra en cascada)                   |
| `username`   | text único       | `^[a-z0-9._-]{3,30}$`; es lo que se teclea en el login    |
| `full_name`  | text             | 1–80 caracteres                                           |
| `role`       | enum `user_role` | `driver` (default) o `admin`                              |
| `active`     | boolean          | `false` = no puede entrar ni escribir                     |
| `created_at` | timestamptz      |                                                           |

### `routes`

Una por repartidor por día (`unique (driver_id, route_date)`).

| Columna      | Tipo          | Notas                                    |
| ------------ | ------------- | ---------------------------------------- |
| `id`         | uuid PK       | se puede generar en el cliente           |
| `driver_id`  | uuid FK       | default `auth.uid()`                     |
| `route_date` | date          | default `business_today()`               |
| `initial_kg` | numeric(8,2)  | `>= 0`                                   |
| `departed_at`| timestamptz   | `null` = cargó pero no ha salido. Una vez puesta no cambia (trigger `lock_departed_at`) |
| `closed_at`  | timestamptz   | `null` = abierta                         |
| `created_at` | timestamptz   |                                          |

### `deliveries`

Cada parada de una ruta: una **entrega** (`kind = delivery`) o una **recolección** (`kind = pickup`,
kilos que el repartidor recoge de una tienda). La tabla conserva el nombre `deliveries`.

| Columna        | Tipo          | Notas                                    |
| -------------- | ------------- | ---------------------------------------- |
| `id`           | uuid PK       | se puede generar en el cliente           |
| `route_id`     | uuid FK       | se borra en cascada con la ruta          |
| `stop_name`    | text          | texto libre, 1–120 caracteres            |
| `kind`         | enum `stop_kind` | `delivery` (default) o `pickup`       |
| `kg`           | numeric(8,2)  | `> 0`; dejados en una entrega, recogidos en una recolección |
| `received_amount` | numeric(10,2) | pesos recibidos de la tienda, `>= 0`, default 0; solo una recolección puede tener dinero (`deliveries_delivery_amount_check`) |
| `notes`        | text          | opcional, hasta 500 caracteres           |
| `created_at`   | timestamptz   |                                          |

### `sales`

Ventas de mostrador: lo que se vende en el propio negocio durante el día, sin relación con las
rutas. Una fila por venta.

| Columna      | Tipo          | Notas                                         |
| ------------ | ------------- | --------------------------------------------- |
| `id`         | uuid PK       | se puede generar en el cliente                |
| `sale_date`  | date          | default `business_today()`                    |
| `kg`         | numeric(8,2)  | `> 0`                                         |
| `amount`     | numeric(10,2) | pesos recibidos, `>= 0`                       |
| `notes`      | text          | opcional, hasta 500 caracteres                |
| `created_by` | uuid          | quien la registró (default `auth.uid()`)      |
| `created_at` | timestamptz   |                                               |

No lleva método de pago. Solo quien pasa `private.can_register_sales()` (hoy el admin; después se
agrega el cajero ahí) las lee o escribe, y solo se crean, editan o borran las del día de negocio
actual; las de días pasados quedan fijas.

### `settings`

Una sola fila (`id = true`) con dos precios globales por kilo (numeric(8,2), `> 0` o `null` = sin
precio): `price_per_kg` es el **precio a tienda** (recolecciones de los repartidores) y
`counter_price_per_kg` el **precio en tortillería** (ventas de mostrador). Todo usuario con sesión
la lee; solo el admin la actualiza. En una recolección la app sugiere el dinero
de lo que se dejó en esa tienda (entregas de hoy con el mismo nombre menos lo ya recogido) por
`price_per_kg`, pero lo que se guarda es lo que el repartidor captura.

### Vista `route_summaries`

Una fila por ruta con `driver_name`, `initial_kg`, `delivered_kg`, `remaining_kg`,
`delivery_count`, `closed_at`, `departed_at`, `received_amount` (suma de lo cobrado), `picked_kg` y
`pickup_count`. Las recolecciones no cuentan en `delivered_kg`, `remaining_kg` ni `delivery_count`. Es `security_invoker`, así que cada quien ve solo las filas que su
RLS le permite. `remaining_kg` puede ser negativo (sobre-entrega: se advierte, no se bloquea).

### Funciones

| Función                          | Schema    | Uso                                                        |
| -------------------------------- | --------- | ---------------------------------------------------------- |
| `business_today()`               | public    | Fecha de hoy en Colima (`America/Mexico_City`). RPC        |
| `reopen_route(p_route_id)`       | public    | Solo admin: reabre una ruta cerrada por error. RPC         |
| `is_admin()`                     | private   | Usada por las políticas                                    |
| `is_active()`                    | private   | Usada por las políticas                                    |
| `is_my_open_route(route_id)`     | private   | Ruta propia, de hoy, ya salió, abierta y usuario activo    |
| `lock_departed_at()`             | private   | Trigger: la hora de salida no se cambia ni se borra        |
| `handle_new_user()`              | private   | Trigger que crea el perfil                                 |

El schema `private` no está expuesto por la API REST.

## Reglas de acceso (RLS)

| Acción                                        | Driver                                     | Admin          | Sin sesión |
| --------------------------------------------- | ------------------------------------------ | -------------- | ---------- |
| Ver perfiles                                  | solo el suyo                               | todos          | no         |
| Editar perfiles (`full_name`, `role`, `active`) | no                                       | los de otros   | no         |
| Ver routes / deliveries / route_summaries     | solo las suyas                             | todas          | no         |
| Crear ruta                                    | la suya, de hoy, si está activo            | no             | no         |
| Editar ruta (`initial_kg`, salir, cerrarla)   | la suya, de hoy, abierta                   | no             | no         |
| Reabrir ruta                                  | no                                         | `reopen_route` | no         |
| Crear / editar / borrar deliveries            | en su ruta de hoy abierta y ya salida, si está activo | no  | no         |
| Ver / crear / editar / borrar `sales`         | no                                         | sí, solo las de hoy para escribir | no |
| Ver `settings`                                | sí                                         | sí             | no         |
| Cambiar el precio base                        | no                                         | sí             | no         |
| Borrar rutas                                  | no                                         | no             | no         |

Además hay permisos por columna: en `routes` solo se actualizan `initial_kg`, `departed_at` y
`closed_at`; en `deliveries`, `kind`, `stop_name`, `kg`, `received_amount` y `notes`; en `settings`,
`price_per_kg` (una entrega no se puede mover de ruta ni una ruta
cambiar de dueño). Los perfiles solo los inserta el trigger.

Consecuencias prácticas:

- Una ruta cerrada o de un día anterior queda de solo lectura.
- El admin no captura datos: solo consulta, gestiona usuarios y reabre rutas.
- El admin no puede editar su propio perfil (evita quitarse el rol o desactivarse por error).

## Usuarios y login

- No hay registro público (desactivado en Authentication → Sign In / Providers).
- Cada usuario existe en Auth como `<username>@reparto.local`. El login acepta el usuario solo
  (`juan`) o, si contiene `@`, un email completo (así entra el admin original con su correo).
- Desactivar a alguien hace dos cosas: bloquea su login en Auth y marca `profiles.active = false`,
  con lo que la RLS le impide escribir aunque su sesión siga abierta.

### Primer admin (proyecto nuevo)

1. Authentication → Users → **Add user**, con **Auto Confirm User**.
2. En el SQL Editor:

   ```sql
   update public.profiles set role = 'admin', full_name = 'Tu nombre' where username = 'tuusuario';
   ```

## Edge Function `admin-users`

`POST https://gmbixckrajmrpovsrymi.supabase.co/functions/v1/admin-users`

Requiere la sesión de un **admin activo** en `Authorization: Bearer <access_token>`. Desde la app:

```ts
const { data, error } = await supabase.functions.invoke('admin-users', {
  body: { action: 'create', username: 'juan', fullName: 'Juan Pérez', password: 'secreta1' },
})
```

### Acciones

| `action`       | Campos                                       | Respuesta OK                              |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| `create`       | `username`, `fullName`, `password`, `role?`  | `201 { id, username, fullName, role }`    |
| `set_password` | `id`, `password`                             | `200 { ok: true }`                        |
| `set_active`   | `id`, `active` (boolean)                     | `200 { ok: true }`                        |

- `username` se normaliza a minúsculas; `role` es `driver` si no se indica.
- `password`: mínimo 6 caracteres.

### Errores

Todos responden `{ error: "<mensaje en español>" }`:

| Código | Cuándo                                                               |
| ------ | -------------------------------------------------------------------- |
| 400    | Datos inválidos, acción desconocida, desactivarse a sí mismo         |
| 401    | Sin sesión o sesión inválida/expirada                                |
| 403    | Quien llama no es admin activo                                       |
| 404    | El usuario a modificar no existe                                     |
| 405    | Método distinto de POST                                              |
| 409    | El usuario ya existe                                                 |
| 500    | Error inesperado (ver logs de la función)                            |

### Por qué `verify_jwt = false`

El proyecto usa las claves nuevas (`sb_publishable_…` / `sb_secret_…`), que la verificación
automática de la plataforma no entiende. La función valida el token con `auth.getUser()` y luego
el rol en `profiles`. Usa la secret key (lee `SUPABASE_SECRET_KEYS`, con respaldo en la legacy
`SUPABASE_SERVICE_ROLE_KEY`), que solo existe en el servidor.

## Pruebas

### RLS: `supabase/tests/rls_test.sql`

Crea un admin y dos drivers de prueba dentro de una transacción, verifica cada regla de la tabla de
arriba (más los cálculos de `route_summaries`) y hace `ROLLBACK`: no deja datos. Si algo falla,
aborta con `FAIL: <regla>`; si todo pasa devuelve `OK: all RLS tests passed`.

Se ejecuta completo en el SQL Editor o con `execute_sql` del MCP. Requiere
`plpgsql.check_asserts = on` (default en Supabase).

### Edge Function

Verificada contra el proyecto real con `prueba_admin` y un usuario temporal (después borrado):
crear usuario, duplicados (409), repartidor sin permiso (403), cambio de contraseña, desactivar
(login bloqueado) y reactivar, y acción inválida (400).

## Hacer cambios

1. Nueva migración en `supabase/migrations/` (nunca editar una ya aplicada).
2. Aplicarla con `apply_migration` del MCP y renombrar el archivo al `version` que devuelve
   `list_migrations`.
3. Actualizar y correr `rls_test.sql`.
4. Revisar `get_advisors` (security y performance).
5. Regenerar `src/types/database.ts` con `generate_typescript_types`.
6. Si cambia la función: editar `supabase/functions/admin-users/index.ts` y desplegar con
   `deploy_edge_function` (`verify_jwt: false`).

## Avisos del linter aceptados

| Aviso                                              | Por qué se acepta                                       |
| -------------------------------------------------- | ------------------------------------------------------- |
| `reopen_route` es SECURITY DEFINER ejecutable      | Intencional; valida `is_admin()` adentro (probado)      |
| Protección de contraseñas filtradas desactivada    | Requiere plan Pro                                       |
