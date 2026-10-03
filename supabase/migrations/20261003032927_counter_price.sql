-- price_per_kg stays as the price charged to stores (routes); counter_price_per_kg is the price at the shop itself.
alter table public.settings
  add column counter_price_per_kg numeric(8, 2) check (counter_price_per_kg > 0);

grant update (counter_price_per_kg) on public.settings to authenticated;
