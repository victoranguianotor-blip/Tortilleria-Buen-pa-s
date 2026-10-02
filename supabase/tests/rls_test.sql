-- RLS tests: creates test users, checks every rule and rolls back (leaves no data).
-- Aborts with "FAIL: ..." on the first broken rule; otherwise returns "OK: ...".

begin;

insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated',
   'test_admin@reparto.local', '{"username":"test_admin","full_name":"Test Admin"}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated',
   'test_drv1@reparto.local', '{"username":"test_drv1","full_name":"Driver One"}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated',
   'test_drv2@reparto.local', '{"username":"test_drv2","full_name":"Driver Two"}', now(), now(), now());

do $$ begin
  assert (select count(*) from public.profiles where username like 'test\_%' and role = 'driver') = 3,
    'FAIL: trigger did not create 3 driver profiles';
end $$;

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

insert into public.routes (id, driver_id, route_date, initial_kg)
values ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-0000000000b1',
        public.business_today() - 1, 40);

set local role anon;
do $$ begin
  perform 1 from public.routes;
  raise exception 'FAIL: anon can read routes';
exception when insufficient_privilege then null;
end $$;
reset role;

-- Driver 1
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.profiles) = 1, 'FAIL: driver sees other profiles';

  update public.profiles set role = 'admin' where id = auth.uid();
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: driver changed own role';

  insert into public.routes (id, initial_kg) values ('00000000-0000-0000-0000-0000000000c1', 50);
  assert (select route_date from public.routes where id = '00000000-0000-0000-0000-0000000000c1') = public.business_today(),
    'FAIL: route did not default to business_today()';

  begin
    insert into public.routes (driver_id, initial_kg) values ('00000000-0000-0000-0000-0000000000b2', 10);
    raise exception 'FAIL: driver created a route for someone else';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.routes (route_date, initial_kg) values (public.business_today() + 1, 10);
    raise exception 'FAIL: driver created a route for another day';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.routes (initial_kg) values (10);
    raise exception 'FAIL: driver created two routes on the same day';
  exception when unique_violation then null;
  end;

  begin
    update public.routes set driver_id = '00000000-0000-0000-0000-0000000000b2'
    where id = '00000000-0000-0000-0000-0000000000c1';
    raise exception 'FAIL: driver changed route owner';
  exception when insufficient_privilege then null;
  end;

  insert into public.deliveries (id, route_id, stop_name, delivered_kg) values
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', 'Tienda Doña Mary', 12.5),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000c1', 'Abarrotes Lupita', 7.25),
    ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000c1', 'To delete', 1);

  update public.deliveries set delivered_kg = 8 where id = '00000000-0000-0000-0000-0000000000e2';
  get diagnostics n = row_count;
  assert n = 1, 'FAIL: driver could not edit own delivery';

  delete from public.deliveries where id = '00000000-0000-0000-0000-0000000000e3';
  get diagnostics n = row_count;
  assert n = 1, 'FAIL: driver could not delete own delivery';

  begin
    insert into public.deliveries (route_id, stop_name, delivered_kg)
    values ('00000000-0000-0000-0000-0000000000c1', 'Zero', 0);
    raise exception 'FAIL: accepted a 0 kg delivery';
  exception when check_violation then null;
  end;

  begin
    insert into public.deliveries (route_id, stop_name, delivered_kg)
    values ('00000000-0000-0000-0000-0000000000f0', 'Yesterday', 1);
    raise exception 'FAIL: driver wrote to yesterday''s route';
  exception when insufficient_privilege then null;
  end;

  assert (select delivered_kg from public.route_summaries where route_id = '00000000-0000-0000-0000-0000000000c1') = 20.5,
    'FAIL: wrong delivered_kg';
  assert (select remaining_kg from public.route_summaries where route_id = '00000000-0000-0000-0000-0000000000c1') = 29.5,
    'FAIL: wrong remaining_kg';
  assert (select count(*) from public.route_summaries) = 2, 'FAIL: driver does not see exactly own 2 routes';
end $$;

-- Driver 2 cannot see or touch driver 1's data
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.routes) = 0, 'FAIL: driver 2 sees other routes';
  assert (select count(*) from public.deliveries) = 0, 'FAIL: driver 2 sees other deliveries';
  assert (select count(*) from public.route_summaries) = 0, 'FAIL: driver 2 sees other summaries';

  begin
    insert into public.deliveries (route_id, stop_name, delivered_kg)
    values ('00000000-0000-0000-0000-0000000000c1', 'Intruder', 1);
    raise exception 'FAIL: driver 2 wrote to driver 1 route';
  exception when insufficient_privilege then null;
  end;

  update public.deliveries set delivered_kg = 99 where id = '00000000-0000-0000-0000-0000000000e1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: driver 2 edited driver 1 delivery';

  delete from public.deliveries where id = '00000000-0000-0000-0000-0000000000e1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: driver 2 deleted driver 1 delivery';

  begin
    perform public.reopen_route('00000000-0000-0000-0000-0000000000c1');
    raise exception 'FAIL: driver could call reopen_route';
  exception when insufficient_privilege then null;
  end;

  assert not private.is_admin(), 'FAIL: driver 2 is admin';
end $$;

-- Driver 1 closes the route: no more writes
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

do $$
declare n int;
begin
  update public.routes set closed_at = now() where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 1, 'FAIL: driver could not close own route';

  begin
    insert into public.deliveries (route_id, stop_name, delivered_kg)
    values ('00000000-0000-0000-0000-0000000000c1', 'Late', 1);
    raise exception 'FAIL: driver wrote to a closed route';
  exception when insufficient_privilege then null;
  end;

  update public.routes set closed_at = null where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: driver reopened own route';
end $$;

-- Admin
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.profiles where username like 'test\_%') = 3, 'FAIL: admin does not see all profiles';
  assert (select count(*) from public.routes where driver_id = '00000000-0000-0000-0000-0000000000b1') = 2,
    'FAIL: admin does not see driver 1 routes';
  assert (select count(*) from public.deliveries where route_id = '00000000-0000-0000-0000-0000000000c1') = 2,
    'FAIL: admin does not see driver 1 deliveries';

  begin
    insert into public.deliveries (route_id, stop_name, delivered_kg)
    values ('00000000-0000-0000-0000-0000000000c1', 'Admin', 1);
    raise exception 'FAIL: admin recorded a delivery';
  exception when insufficient_privilege then null;
  end;

  update public.routes set initial_kg = 999 where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: admin changed another route''s kg';

  perform public.reopen_route('00000000-0000-0000-0000-0000000000c1');
  assert (select closed_at is null from public.routes where id = '00000000-0000-0000-0000-0000000000c1'),
    'FAIL: admin could not reopen the route';

  update public.profiles set active = false where id = '00000000-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  assert n = 1, 'FAIL: admin could not deactivate driver 2';

  update public.profiles set role = 'driver' where id = auth.uid();
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: admin edited own profile';
end $$;

-- Driver 1 can write again (reopened); inactive driver 2 cannot
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  insert into public.deliveries (route_id, stop_name, delivered_kg)
  values ('00000000-0000-0000-0000-0000000000c1', 'After reopen', 2);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  insert into public.routes (initial_kg) values (10);
  raise exception 'FAIL: inactive driver created a route';
exception when insufficient_privilege then null;
end $$;

reset role;
select 'OK: all RLS tests passed' as result;

rollback;
