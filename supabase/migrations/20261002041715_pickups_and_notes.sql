-- A stop is now a delivery or a pickup (kg collected back from a store), and any stop can carry notes.
-- delivered_kg becomes kg: for a pickup it holds the kg collected.

create type public.stop_kind as enum ('delivery', 'pickup');

alter table public.deliveries rename column delivered_kg to kg;
alter table public.deliveries rename constraint deliveries_delivered_kg_check to deliveries_kg_check;

alter table public.deliveries
  add column kind public.stop_kind not null default 'delivery',
  add column notes text check (length(notes) <= 500);

-- Nothing is charged on a pickup.
alter table public.deliveries
  add constraint deliveries_pickup_amount_check check (kind = 'delivery' or received_amount = 0);

grant update (kind, notes) on public.deliveries to authenticated;

-- Pickups do not count as delivered nor change what remains on the truck.
create or replace view public.route_summaries
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
