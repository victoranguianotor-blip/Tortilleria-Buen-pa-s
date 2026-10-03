-- Deliveries only leave kg. At the end of the day the driver goes back to each store and records a
-- pickup: the leftover kg collected and the money received from that store.
-- Replaces the route-level settlement (routes.returned_kg / routes.collected_amount).

drop view public.route_summaries;

alter table public.routes drop constraint routes_settlement_check;
alter table public.routes drop column returned_kg, drop column collected_amount;

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
  update public.routes set closed_at = null where id = p_route_id;
end;
$$;

alter table public.deliveries
  add column received_amount numeric(10, 2) not null default 0 check (received_amount >= 0);

-- Money is only received on a pickup.
alter table public.deliveries
  add constraint deliveries_delivery_amount_check check (kind = 'pickup' or received_amount = 0);

grant update (received_amount) on public.deliveries to authenticated;

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
  coalesce(sum(d.received_amount), 0)::numeric(10, 2) as received_amount,
  coalesce(sum(d.kg) filter (where d.kind = 'pickup'), 0)::numeric(8, 2) as picked_kg,
  (count(d.id) filter (where d.kind = 'pickup'))::int as pickup_count
from public.routes r
join public.profiles p on p.id = r.driver_id
left join public.deliveries d on d.route_id = r.id
group by r.id, p.full_name;

revoke all on public.route_summaries from anon;
