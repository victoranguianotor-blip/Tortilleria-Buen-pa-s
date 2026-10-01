-- Esquema inicial: perfiles, rutas, entregas, RLS y vista de resumen.
-- Zona horaria de negocio: Colima (America/Mexico_City, UTC-6 sin horario de verano).

-- =========================================================================
-- Helpers
-- =========================================================================

create type public.rol as enum ('repartidor', 'admin');

-- "Hoy" según Colima, independiente de la zona horaria del servidor.
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

-- security definer: las políticas lo usan sin recursión de RLS sobre profiles.
create function public.is_admin()
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

-- Crea el perfil al dar de alta un usuario. El login es usuario@reparto.local,
-- así que "usuario" sale del email si no viene en los metadatos.
-- El rol siempre inicia como repartidor; solo un admin lo cambia.
create function public.handle_new_user()
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
  for each row execute function public.handle_new_user();

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

-- La ruta es del usuario actual, de hoy y sigue abierta.
-- security invoker: respeta la RLS de rutas.
create function public.es_mi_ruta_abierta(p_ruta_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.rutas
    where id = p_ruta_id
      and repartidor_id = (select auth.uid())
      and fecha = public.hoy_colima()
      and cerrada_at is null
  )
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

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.rutas enable row level security;
alter table public.entregas enable row level security;

-- profiles
create policy "profiles: ver el propio o admin ve todos"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: admin edita"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- rutas
create policy "rutas: ver las propias o admin ve todas"
  on public.rutas for select to authenticated
  using (repartidor_id = (select auth.uid()) or public.is_admin());

create policy "rutas: repartidor crea la suya de hoy"
  on public.rutas for insert to authenticated
  with check (repartidor_id = (select auth.uid()) and fecha = public.hoy_colima());

create policy "rutas: repartidor edita la suya abierta de hoy"
  on public.rutas for update to authenticated
  using (
    repartidor_id = (select auth.uid())
    and fecha = public.hoy_colima()
    and cerrada_at is null
  )
  with check (repartidor_id = (select auth.uid()) and fecha = public.hoy_colima());

-- entregas
create policy "entregas: ver las de rutas propias o admin ve todas"
  on public.entregas for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.rutas r
      where r.id = ruta_id and r.repartidor_id = (select auth.uid())
    )
  );

create policy "entregas: repartidor crea en su ruta abierta"
  on public.entregas for insert to authenticated
  with check (public.es_mi_ruta_abierta(ruta_id));

create policy "entregas: repartidor edita en su ruta abierta"
  on public.entregas for update to authenticated
  using (public.es_mi_ruta_abierta(ruta_id))
  with check (public.es_mi_ruta_abierta(ruta_id));

create policy "entregas: repartidor borra en su ruta abierta"
  on public.entregas for delete to authenticated
  using (public.es_mi_ruta_abierta(ruta_id));
