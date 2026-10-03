-- Money and leftover kg are handed over once, when the route closes, not per stop.
-- routes.returned_kg = kg the driver gives back; routes.collected_amount = pesos the driver hands in.

alter table public.routes
  add column returned_kg numeric(8, 2) check (returned_kg >= 0),
  add column collected_amount numeric(10, 2) check (collected_amount >= 0);

-- Closed routes keep their history: what they collected per stop is now the amount handed in,
-- and what was left on the truck is what they gave back.
update public.routes r
set
  collected_amount = coalesce(
    (select sum(d.received_amount) from public.deliveries d where d.route_id = r.id), 0),
  returned_kg = greatest(
    r.initial_kg - coalesce(
      (select sum(d.kg) from public.deliveries d where d.route_id = r.id and d.kind = 'delivery'), 0),
    0)
where r.closed_at is not null;

alter table public.routes
  add constraint routes_settlement_check
  check (closed_at is null or (returned_kg is not null and collected_amount is not null));

grant update (returned_kg, collected_amount) on public.routes to authenticated;

-- Reopening a route discards the settlement: the driver captures it again when closing.
create or replace function public.reopen_route(p_route_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only an admin can reopen routes' using errcode = '42501';
  end if;
  update public.routes
  set closed_at = null, returned_kg = null, collected_amount = null
  where id = p_route_id;
end;
$$;

drop view public.route_summaries;

alter table public.deliveries drop constraint deliveries_pickup_amount_check;
alter table public.deliveries drop column received_amount;

create view public.route_summaries
with (security_invoker = true)
as
select
  r.id as route_id,
  r.route_date,
  r.driver_id,
  p.full_name as driver_name,
  r.initial_kg,
  coalesce(sum(d.kg) filter (where d.kind = 'delivery'), 0)::numeric(8, 2) as delivered_kg,
  (r.initial_kg - coalesce(sum(d.kg) filter (where d.kind = 'delivery'), 0))::numeric(8, 2)
    as remaining_kg,
  (count(d.id) filter (where d.kind = 'delivery'))::int as delivery_count,
  r.closed_at,
  r.departed_at,
  coalesce(sum(d.kg) filter (where d.kind = 'pickup'), 0)::numeric(8, 2) as picked_kg,
  (count(d.id) filter (where d.kind = 'pickup'))::int as pickup_count,
  r.returned_kg,
  r.collected_amount
from public.routes r
join public.profiles p on p.id = r.driver_id
left join public.deliveries d on d.route_id = r.id
group by r.id, p.full_name;

revoke all on public.route_summaries from anon;
