-- Esquema inicial: perfiles, rutas, entregas, RLS y vista de resumen.
-- Zona horaria de negocio: Colima (America/Mexico_City, UTC-6 sin horario de verano).
--
-- Los helpers usados por las políticas viven en el schema `private`, que la API no expone.

create schema if not exists private;
grant usage on schema private to authenticated;

create type public.rol as enum ('repartidor', 'admin');

-- "Hoy" según Colima, independiente de la zona horaria del servidor.
-- Público: el cliente lo puede pedir con supabase.rpc('hoy_colima').
create function public.hoy_colima()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Mexico_City')::date
$$;

-- =========================================================================
-- profiles: un registro por usuario de auth.users
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique check (usuario ~ '^[a-z0-9._-]{3,30}$'),
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  rol public.rol not null default 'repartidor',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- security definer: las políticas de profiles lo usan sin recursión de RLS.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and rol = 'admin' and activo
  )
$$;

create function private.soy_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and activo)
$$;

-- Crea el perfil al dar de alta un usuario. El login normal es usuario@reparto.local,
-- así que "usuario" sale del email si no viene en los metadatos.
-- El rol siempre inicia como repartidor; solo un admin lo cambia.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, usuario, nombre)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'usuario', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Usuarios creados antes de este trigger.
insert into public.profiles (id, usuario, nombre)
select id, lower(split_part(email, '@', 1)), split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

-- =========================================================================
-- rutas: una por repartidor por día
-- =========================================================================

create table public.rutas (
  id uuid primary key default gen_random_uuid(),
  repartidor_id uuid not null default auth.uid() references public.profiles (id),
  fecha date not null default public.hoy_colima(),
  kg_iniciales numeric(8, 2) not null check (kg_iniciales >= 0),
  cerrada_at timestamptz,
  created_at timestamptz not null default now(),
  unique (repartidor_id, fecha)
);

create index rutas_fecha_idx on public.rutas (fecha);

-- =========================================================================
-- entregas: cada parada de una ruta
-- =========================================================================

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  ruta_id uuid not null references public.rutas (id) on delete cascade,
  parada text not null check (length(trim(parada)) between 1 and 120),
  kg_dejados numeric(8, 2) not null check (kg_dejados > 0),
  created_at timestamptz not null default now()
);

create index entregas_ruta_id_idx on public.entregas (ruta_id);

-- La ruta es del usuario actual (activo), de hoy y sigue abierta.
-- security invoker: respeta la RLS de rutas.
create function private.es_mi_ruta_abierta(p_ruta_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.soy_activo() and exists (
    select 1 from public.rutas
    where id = p_ruta_id
      and repartidor_id = (select auth.uid())
      and fecha = public.hoy_colima()
      and cerrada_at is null
  )
$$;

-- Reabrir una ruta cerrada por error. Solo admin; no le da permiso de cambiar kg.
create function public.reabrir_ruta(p_ruta_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo un administrador puede reabrir rutas' using errcode = '42501';
  end if;
  update public.rutas set cerrada_at = null where id = p_ruta_id;
end;
$$;

-- =========================================================================
-- Vista de resumen (dashboard y reporte). security_invoker => aplica RLS.
-- =========================================================================

create view public.resumen_rutas
with (security_invoker = true)
as
select
  r.id as ruta_id,
  r.fecha,
  r.repartidor_id,
  p.nombre as repartidor,
  r.kg_iniciales,
  coalesce(sum(e.kg_dejados), 0)::numeric(8, 2) as kg_entregados,
  (r.kg_iniciales - coalesce(sum(e.kg_dejados), 0))::numeric(8, 2) as kg_restantes,
  count(e.id)::int as num_entregas,
  r.cerrada_at
from public.rutas r
join public.profiles p on p.id = r.repartidor_id
left join public.entregas e on e.ruta_id = r.id
group by r.id, p.nombre;

-- =========================================================================
-- Permisos. Supabase da ALL a anon/authenticated por defecto; lo acotamos.
-- =========================================================================

revoke all on public.profiles, public.rutas, public.entregas, public.resumen_rutas from anon;

-- profiles: solo el trigger inserta; el admin edita nombre/rol/activo.
revoke insert, update, delete on public.profiles from authenticated;
grant update (nombre, rol, activo) on public.profiles to authenticated;

-- rutas: no se borran; solo se corrigen kg iniciales o se cierran.
revoke update, delete on public.rutas from authenticated;
grant update (kg_iniciales, cerrada_at) on public.rutas to authenticated;

-- entregas: no se mueven de ruta.
revoke update on public.entregas from authenticated;
grant update (parada, kg_dejados) on public.entregas to authenticated;

-- Funciones: Postgres da EXECUTE a PUBLIC por defecto.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin(), private.soy_activo(),
  private.es_mi_ruta_abierta(uuid) to authenticated;
revoke execute on function public.reabrir_ruta(uuid), public.hoy_colima() from public, anon;
grant execute on function public.reabrir_ruta(uuid), public.hoy_colima() to authenticated;

-- Event trigger que Supabase crea para activar RLS automáticamente; no debe ser RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.rutas enable row level security;
alter table public.entregas enable row level security;

-- profiles
create policy "profiles: ver el propio o admin ve todos"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());

-- El admin no edita su propio perfil (evita quitarse el rol o desactivarse).
create policy "profiles: admin edita a otros"
  on public.profiles for update to authenticated
  using (private.is_admin() and id <> (select auth.uid()))
  with check (private.is_admin() and id <> (select auth.uid()));

-- rutas
create policy "rutas: ver las propias o admin ve todas"
  on public.rutas for select to authenticated
  using (repartidor_id = (select auth.uid()) or private.is_admin());

create policy "rutas: repartidor crea la suya de hoy"
  on public.rutas for insert to authenticated
  with check (
    repartidor_id = (select auth.uid())
    and fecha = public.hoy_colima()
    and private.soy_activo()
  );

create policy "rutas: repartidor edita la suya abierta de hoy"
  on public.rutas for update to authenticated
  using (
    repartidor_id = (select auth.uid())
    and fecha = public.hoy_colima()
    and cerrada_at is null
    and private.soy_activo()
  )
  with check (repartidor_id = (select auth.uid()) and fecha = public.hoy_colima());

-- entregas
create policy "entregas: ver las de rutas propias o admin ve todas"
  on public.entregas for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.rutas r
      where r.id = ruta_id and r.repartidor_id = (select auth.uid())
    )
  );

create policy "entregas: repartidor crea en su ruta abierta"
  on public.entregas for insert to authenticated
  with check (private.es_mi_ruta_abierta(ruta_id));

create policy "entregas: repartidor edita en su ruta abierta"
  on public.entregas for update to authenticated
  using (private.es_mi_ruta_abierta(ruta_id))
  with check (private.es_mi_ruta_abierta(ruta_id));

create policy "entregas: repartidor borra en su ruta abierta"
  on public.entregas for delete to authenticated
  using (private.es_mi_ruta_abierta(ruta_id));
