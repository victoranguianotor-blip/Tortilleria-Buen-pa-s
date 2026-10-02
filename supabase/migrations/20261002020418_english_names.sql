-- Renames the schema to English. Data is preserved (ALTER ... RENAME).

drop view public.resumen_rutas;

drop policy "profiles: ver el propio o admin ve todos" on public.profiles;
drop policy "profiles: admin edita a otros" on public.profiles;
drop policy "rutas: ver las propias o admin ve todas" on public.rutas;
drop policy "rutas: repartidor crea la suya de hoy" on public.rutas;
drop policy "rutas: repartidor edita la suya abierta de hoy" on public.rutas;
drop policy "entregas: ver las de rutas propias o admin ve todas" on public.entregas;
drop policy "entregas: repartidor crea en su ruta abierta" on public.entregas;
drop policy "entregas: repartidor edita en su ruta abierta" on public.entregas;
drop policy "entregas: repartidor borra en su ruta abierta" on public.entregas;

drop function public.reabrir_ruta(uuid);
drop function private.es_mi_ruta_abierta(uuid);
drop function private.soy_activo();

alter type public.rol rename to user_role;
alter type public.user_role rename value 'repartidor' to 'driver';

alter table public.profiles rename column usuario to username;
alter table public.profiles rename column nombre to full_name;
alter table public.profiles rename column rol to role;
alter table public.profiles rename column activo to active;
alter table public.profiles rename constraint profiles_usuario_key to profiles_username_key;
alter table public.profiles rename constraint profiles_usuario_check to profiles_username_check;
alter table public.profiles rename constraint profiles_nombre_check to profiles_full_name_check;

alter table public.rutas rename to routes;
alter table public.routes rename column repartidor_id to driver_id;
alter table public.routes rename column fecha to route_date;
alter table public.routes rename column kg_iniciales to initial_kg;
alter table public.routes rename column cerrada_at to closed_at;
alter table public.routes rename constraint rutas_pkey to routes_pkey;
alter table public.routes rename constraint rutas_kg_iniciales_check to routes_initial_kg_check;
alter table public.routes rename constraint rutas_repartidor_id_fecha_key to routes_driver_id_route_date_key;
alter table public.routes rename constraint rutas_repartidor_id_fkey to routes_driver_id_fkey;
alter index public.rutas_fecha_idx rename to routes_route_date_idx;

alter table public.entregas rename to deliveries;
alter table public.deliveries rename column ruta_id to route_id;
alter table public.deliveries rename column parada to stop_name;
alter table public.deliveries rename column kg_dejados to delivered_kg;
alter table public.deliveries rename constraint entregas_pkey to deliveries_pkey;
alter table public.deliveries rename constraint entregas_parada_check to deliveries_stop_name_check;
alter table public.deliveries rename constraint entregas_kg_dejados_check to deliveries_delivered_kg_check;
alter table public.deliveries rename constraint entregas_ruta_id_fkey to deliveries_route_id_fkey;
alter index public.entregas_ruta_id_idx rename to deliveries_route_id_idx;

create function public.business_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Mexico_City')::date
$$;

alter table public.routes alter column route_date set default public.business_today();
drop function public.hoy_colima();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active
  )
$$;

create function private.is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and active)
$$;

create function private.is_my_open_route(p_route_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_active() and exists (
    select 1 from public.routes
    where id = p_route_id
      and driver_id = (select auth.uid())
      and route_date = public.business_today()
      and closed_at is null
  )
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create function public.reopen_route(p_route_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can reopen routes' using errcode = '42501';
  end if;
  update public.routes set closed_at = null where id = p_route_id;
end;
$$;

create view public.route_summaries
with (security_invoker = true)
as
select
  r.id as route_id,
  r.route_date,
  r.driver_id,
  p.full_name as driver_name,
  r.initial_kg,
  coalesce(sum(d.delivered_kg), 0)::numeric(8, 2) as delivered_kg,
  (r.initial_kg - coalesce(sum(d.delivered_kg), 0))::numeric(8, 2) as remaining_kg,
  count(d.id)::int as delivery_count,
  r.closed_at
from public.routes r
join public.profiles p on p.id = r.driver_id
left join public.deliveries d on d.route_id = r.id
group by r.id, p.full_name;

revoke all on public.route_summaries from anon;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin(), private.is_active(),
  private.is_my_open_route(uuid) to authenticated;
revoke execute on function public.reopen_route(uuid), public.business_today() from public, anon;
grant execute on function public.reopen_route(uuid), public.business_today() to authenticated;

create policy "profiles: read own, admin reads all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy "profiles: admin updates others"
  on public.profiles for update to authenticated
  using (private.is_admin() and id <> (select auth.uid()))
  with check (private.is_admin() and id <> (select auth.uid()));

create policy "routes: read own, admin reads all"
  on public.routes for select to authenticated
  using (driver_id = (select auth.uid()) or private.is_admin());

create policy "routes: driver creates own for today"
  on public.routes for insert to authenticated
  with check (
    driver_id = (select auth.uid())
    and route_date = public.business_today()
    and private.is_active()
  );

create policy "routes: driver updates own open route of today"
  on public.routes for update to authenticated
  using (
    driver_id = (select auth.uid())
    and route_date = public.business_today()
    and closed_at is null
    and private.is_active()
  )
  with check (driver_id = (select auth.uid()) and route_date = public.business_today());

create policy "deliveries: read on own routes, admin reads all"
  on public.deliveries for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.routes r
      where r.id = route_id and r.driver_id = (select auth.uid())
    )
  );

create policy "deliveries: driver inserts on open route"
  on public.deliveries for insert to authenticated
  with check (private.is_my_open_route(route_id));

create policy "deliveries: driver updates on open route"
  on public.deliveries for update to authenticated
  using (private.is_my_open_route(route_id))
  with check (private.is_my_open_route(route_id));

create policy "deliveries: driver deletes on open route"
  on public.deliveries for delete to authenticated
  using (private.is_my_open_route(route_id));
