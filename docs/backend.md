# Backend (Supabase)

Proyecto Supabase: `gmbixckrajmrpovsrymi` (Postgres 17).
Todo el esquema vive en `supabase/migrations/`; la gestión de usuarios en
`supabase/functions/admin-usuarios/`.

## Modelo de datos

```
auth.users ──1:1── profiles ──1:N── rutas ──1:N── entregas
```

### `profiles`

Un registro por usuario de Auth. Lo crea automáticamente el trigger `on_auth_user_created`.

| Columna      | Tipo          | Notas                                                     |
| ------------ | ------------- | --------------------------------------------------------- |
| `id`         | uuid PK       | = `auth.users.id` (se borra en cascada)                   |
| `usuario`    | text único    | `^[a-z0-9._-]{3,30}$`; es lo que se teclea en el login    |
| `nombre`     | text          | 1–80 caracteres                                           |
| `rol`        | enum `rol`    | `repartidor` (default) o `admin`                          |
| `activo`     | boolean       | `false` = no puede entrar ni escribir                     |
| `created_at` | timestamptz   |                                                           |

### `rutas`

Una por repartidor por día (`unique (repartidor_id, fecha)`).

| Columna         | Tipo          | Notas                                               |
| --------------- | ------------- | --------------------------------------------------- |
| `id`            | uuid PK       | se puede generar en el cliente                      |
| `repartidor_id` | uuid FK       | default `auth.uid()`                                |
| `fecha`         | date          | default `hoy_colima()`                              |
| `kg_iniciales`  | numeric(8,2)  | `>= 0`                                              |
| `cerrada_at`    | timestamptz   | `null` = abierta                                    |
| `created_at`    | timestamptz   |                                                     |

### `entregas`

Cada parada de una ruta.

| Columna      | Tipo          | Notas                                    |
| ------------ | ------------- | ---------------------------------------- |
| `id`         | uuid PK       | se puede generar en el cliente           |
| `ruta_id`    | uuid FK       | se borra en cascada con la ruta          |
| `parada`     | text          | texto libre, 1–120 caracteres            |
| `kg_dejados` | numeric(8,2)  | `> 0`                                    |
| `created_at` | timestamptz   |                                          |

### Vista `resumen_rutas`

Una fila por ruta con `repartidor` (nombre), `kg_iniciales`, `kg_entregados`, `kg_restantes`,
`num_entregas` y `cerrada_at`. Es `security_invoker`, así que cada quien ve solo las filas que su
RLS le permite. `kg_restantes` puede ser negativo (sobre-entrega: se advierte, no se bloquea).

### Funciones

| Función                          | Schema    | Uso                                                        |
| -------------------------------- | --------- | ---------------------------------------------------------- |
| `hoy_colima()`                   | public    | Fecha de hoy en Colima (`America/Mexico_City`). RPC        |
| `reabrir_ruta(p_ruta_id)`        | public    | Solo admin: reabre una ruta cerrada por error. RPC         |
| `is_admin()`                     | private   | Usada por las políticas                                    |
| `soy_activo()`                   | private   | Usada por las políticas                                    |
| `es_mi_ruta_abierta(ruta_id)`    | private   | Ruta propia, de hoy, abierta y usuario activo              |
| `handle_new_user()`              | private   | Trigger que crea el perfil                                 |

El schema `private` no está expuesto por la API REST.

## Reglas de acceso (RLS)

| Acción                                   | Repartidor                              | Admin          | Sin sesión |
| ---------------------------------------- | --------------------------------------- | -------------- | ---------- |
| Ver perfiles                             | solo el suyo                            | todos          | no         |
| Editar perfiles (`nombre`, `rol`, `activo`) | no                                   | los de otros   | no         |
| Ver rutas / entregas / resumen           | solo las suyas                          | todas          | no         |
| Crear ruta                               | la suya, de hoy, si está activo         | no             | no         |
| Editar ruta (`kg_iniciales`, cerrarla)   | la suya, de hoy, abierta                | no             | no         |
| Reabrir ruta                             | no                                      | `reabrir_ruta` | no         |
| Crear / editar / borrar entregas         | en su ruta de hoy abierta, si está activo | no           | no         |
| Borrar rutas                             | no                                      | no             | no         |

Además hay permisos por columna: en `rutas` solo se actualizan `kg_iniciales` y `cerrada_at`, y en
`entregas` solo `parada` y `kg_dejados` (una entrega no se puede mover de ruta ni una ruta cambiar
de dueño). Los perfiles solo los inserta el trigger.

Consecuencias prácticas:

- Una ruta cerrada o de un día anterior queda de solo lectura.
- El admin no captura datos: solo consulta, gestiona usuarios y reabre rutas.
- El admin no puede editar su propio perfil (evita quitarse el rol o desactivarse por error).

## Usuarios y login

- No hay registro público (desactivado en Authentication → Sign In / Providers).
- Cada usuario existe en Auth como `<usuario>@reparto.local`. El login acepta el usuario solo
  (`juan`) o, si contiene `@`, un email completo (así entra el admin original con su correo).
- Desactivar a alguien hace dos cosas: bloquea su login en Auth y marca `profiles.activo = false`,
  con lo que la RLS le impide escribir aunque su sesión siga abierta.

### Primer admin (proyecto nuevo)

1. Authentication → Users → **Add user**, con **Auto Confirm User**.
2. En el SQL Editor:

   ```sql
   update public.profiles set rol = 'admin', nombre = 'Tu nombre' where usuario = 'tuusuario';
   ```

## Edge Function `admin-usuarios`

`POST https://gmbixckrajmrpovsrymi.supabase.co/functions/v1/admin-usuarios`

Requiere la sesión de un **admin activo** en `Authorization: Bearer <access_token>`. Desde la app:

```ts
const { data, error } = await supabase.functions.invoke('admin-usuarios', {
  body: { accion: 'crear', usuario: 'juan', nombre: 'Juan Pérez', password: 'secreta1' },
})
```

### Acciones

| `accion`           | Campos                                            | Respuesta OK                            |
| ------------------ | ------------------------------------------------- | --------------------------------------- |
| `crear`            | `usuario`, `nombre`, `password`, `rol?`           | `201 { id, usuario, nombre, rol }`      |
| `cambiar_password` | `id`, `password`                                  | `200 { ok: true }`                      |
| `activar`          | `id`, `activo` (boolean)                          | `200 { ok: true }`                      |

- `usuario` se normaliza a minúsculas; `rol` es `repartidor` si no se indica.
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

Crea un admin y dos repartidores de prueba dentro de una transacción, verifica cada regla de la
tabla de arriba (más los cálculos de `resumen_rutas`) y hace `ROLLBACK`: no deja datos. Si algo
falla, aborta con `FALLO: <regla>`; si todo pasa devuelve `OK: todas las pruebas de RLS pasaron`.

Se ejecuta completo en el SQL Editor o con `execute_sql` del MCP. Requiere
`plpgsql.check_asserts = on` (default en Supabase).

### Edge Function

Se verificó contra el proyecto real (2026-10-01) con un admin temporal, después borrado: crear
usuario, duplicados (409), datos inválidos (400), repartidor sin permiso (403), cambio de
contraseña, desactivar (login bloqueado) y reactivar, protección contra auto-desactivación y
creación de admin.

## Hacer cambios

1. Nueva migración en `supabase/migrations/` (nunca editar una ya aplicada).
2. Aplicarla con `apply_migration` del MCP y renombrar el archivo al `version` que devuelve
   `list_migrations`.
3. Actualizar y correr `rls_test.sql`.
4. Revisar `get_advisors` (security y performance).
5. Regenerar `src/types/database.ts` con `generate_typescript_types`.
6. Si cambia la función: editar `supabase/functions/admin-usuarios/index.ts` y desplegar con
   `deploy_edge_function` (`verify_jwt: false`).

## Avisos del linter aceptados

| Aviso                                              | Por qué se acepta                                       |
| -------------------------------------------------- | ------------------------------------------------------- |
| `reabrir_ruta` es SECURITY DEFINER ejecutable      | Intencional; valida `is_admin()` adentro (probado)      |
| `rutas_fecha_idx` sin uso                          | Aún no hay datos; lo usará el dashboard por fecha       |
| Protección de contraseñas filtradas desactivada    | Requiere plan Pro                                       |
