-- Departure time per route, money received per delivery and an admin-set base price per kg.

-- =========================================================================
-- settings: a single row with the base price used to suggest the amount received
-- =========================================================================

create table public.settings (
  id boolean primary key default true check (id),
  price_per_kg numeric(8, 2) check (price_per_kg > 0)
);

insert into public.settings (id) values (true);

alter table public.settings enable row level security;

create policy "settings: everyone signed in reads"
  on public.settings for select to authenticated
  using (true);

create policy "settings: admin edits"
  on public.settings for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

revoke all on public.settings from anon;
revoke insert, update, delete on public.settings from authenticated;
grant update (price_per_kg) on public.settings to authenticated;

-- =========================================================================
-- routes.departed_at: set by the driver's "Salir a ruta" button
-- =========================================================================

alter table public.routes add column departed_at timestamptz;

update public.routes set departed_at = created_at;

grant update (departed_at) on public.routes to authenticated;

-- Once recorded, the departure time cannot be changed or cleared (the admin relies on it).
create function private.lock_departed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.departed_at is not null and new.departed_at is distinct from old.departed_at then
    raise exception 'Departure time already recorded' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.lock_departed_at() from public, anon, authenticated;

create trigger lock_departed_at
  before update of departed_at on public.routes
  for each row execute function private.lock_departed_at();

-- Deliveries can only be recorded after leaving.
create or replace function private.is_my_open_route(p_route_id uuid)
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
      and departed_at is not null
      and closed_at is null
  )
$$;

-- =========================================================================
-- deliveries.received_amount: pesos received at the stop (0 = nothing paid)
-- =========================================================================

alter table public.deliveries
  add column received_amount numeric(10, 2) not null default 0 check (received_amount >= 0);

grant update (received_amount) on public.deliveries to authenticated;

-- =========================================================================
-- route_summaries: new columns appended at the end
-- =========================================================================

create or replace view public.route_summaries
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
  r.closed_at,
  r.departed_at,
  coalesce(sum(d.received_amount), 0)::numeric(10, 2) as received_amount
from public.routes r
join public.profiles p on p.id = r.driver_id
left join public.deliveries d on d.route_id = r.id
group by r.id, p.full_name;
