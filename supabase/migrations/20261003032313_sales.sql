-- Counter sales: tortillas sold at the shop itself during the day (not tied to a route).
-- Only whoever can register sales (today the admin; later a cashier) reads or writes them,
-- and only sales of the current business day can be changed.

create function private.can_register_sales()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_admin()
$$;

revoke execute on function private.can_register_sales() from public, anon, authenticated;
grant execute on function private.can_register_sales() to authenticated;

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default public.business_today(),
  kg numeric(8, 2) not null check (kg > 0),
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  notes text check (length(notes) <= 500),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index sales_sale_date_idx on public.sales (sale_date);

alter table public.sales enable row level security;

create policy "sales: reader reads"
  on public.sales for select to authenticated
  using (private.can_register_sales());

create policy "sales: register today"
  on public.sales for insert to authenticated
  with check (
    private.can_register_sales()
    and sale_date = public.business_today()
    and created_by = (select auth.uid())
  );

create policy "sales: edit today"
  on public.sales for update to authenticated
  using (private.can_register_sales() and sale_date = public.business_today())
  with check (private.can_register_sales() and sale_date = public.business_today());

create policy "sales: delete today"
  on public.sales for delete to authenticated
  using (private.can_register_sales() and sale_date = public.business_today());

revoke all on public.sales from anon;
revoke update on public.sales from authenticated;
grant update (kg, amount, notes) on public.sales to authenticated;
