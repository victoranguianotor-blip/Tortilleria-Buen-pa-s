-- Pruebas de RLS. Crea usuarios de prueba, verifica cada regla y hace ROLLBACK:
-- no deja datos. Si una regla falla, el script aborta con "FALLO: ...".
-- Ejecutar completo en el SQL Editor o vía MCP (execute_sql).

begin;

-- Usuarios de prueba (el trigger les crea perfil como repartidor)
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated',
   'test_admin@reparto.local', '{"usuario":"test_admin","nombre":"Admin Prueba"}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated',
   'test_rep1@reparto.local', '{"usuario":"test_rep1","nombre":"Repartidor Uno"}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated',
   'test_rep2@reparto.local', '{"usuario":"test_rep2","nombre":"Repartidor Dos"}', now(), now(), now());

do $$ begin
  assert (select count(*) from public.profiles where usuario like 'test\_%' and rol = 'repartidor') = 3,
    'FALLO: el trigger no creó los 3 perfiles como repartidor';
end $$;

update public.profiles set rol = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

-- Ruta de AYER para rep1 (creada como postgres, saltando RLS)
insert into public.rutas (id, repartidor_id, fecha, kg_iniciales)
values ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-0000000000b1',
        public.hoy_colima() - 1, 40);

-- =========================================================================
-- anon
-- =========================================================================
set local role anon;
do $$ begin
  perform 1 from public.rutas;
  raise exception 'FALLO: anon pudo leer rutas';
exception when insufficient_privilege then null;
end $$;
reset role;

-- =========================================================================
-- Repartidor 1
-- =========================================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.profiles) = 1, 'FALLO: rep1 ve perfiles ajenos';

  update public.profiles set rol = 'admin' where id = auth.uid();
  get diagnostics n = row_count;
  assert n = 0, 'FALLO: rep1 pudo cambiarse el rol';

  insert into public.rutas (id, kg_iniciales) values ('00000000-0000-0000-0000-0000000000c1', 50);
  assert (select fecha from public.rutas where id = '00000000-0000-0000-0000-0000000000c1') = public.hoy_colima(),
    'FALLO: la ruta no tomó la fecha de hoy en Colima';

  begin
    insert into public.rutas (repartidor_id, kg_iniciales) values ('00000000-0000-0000-0000-0000000000b2', 10);
    raise exception 'FALLO: rep1 creó una ruta para rep2';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.rutas (fecha, kg_iniciales) values (public.hoy_colima() + 1, 10);
    raise exception 'FALLO: rep1 creó una ruta de otro día';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.rutas (kg_iniciales) values (10);
    raise exception 'FALLO: rep1 creó dos rutas el mismo día';
  exception when unique_violation then null;
  end;

  begin
    update public.rutas set repartidor_id = '00000000-0000-0000-0000-0000000000b2'
    where id = '00000000-0000-0000-0000-0000000000c1';
    raise exception 'FALLO: rep1 cambió el dueño de la ruta';
  exception when insufficient_privilege then null;
  end;

  insert into public.entregas (id, ruta_id, parada, kg_dejados) values
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', 'Tienda Doña Mary', 12.5),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000c1', 'Abarrotes Lupita', 7.25),
    ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000c1', 'Borrar', 1);

  update public.entregas set kg_dejados = 8 where id = '00000000-0000-0000-0000-0000000000e2';
  get diagnostics n = row_count;
  assert n = 1, 'FALLO: rep1 no pudo editar su entrega';

  delete from public.entregas where id = '00000000-0000-0000-0000-0000000000e3';
  get diagnostics n = row_count;
  assert n = 1, 'FALLO: rep1 no pudo borrar su entrega';

  begin
    insert into public.entregas (ruta_id, parada, kg_dejados)
    values ('00000000-0000-0000-0000-0000000000c1', 'Cero', 0);
    raise exception 'FALLO: se aceptó una entrega de 0 kg';
  exception when check_violation then null;
  end;

  -- La ruta de ayer es suya, pero ya no se puede escribir en ella
  begin
    insert into public.entregas (ruta_id, parada, kg_dejados)
    values ('00000000-0000-0000-0000-0000000000f0', 'Ayer', 1);
    raise exception 'FALLO: rep1 escribió en la ruta de ayer';
  exception when insufficient_privilege then null;
  end;

  assert (select kg_entregados from public.resumen_rutas where ruta_id = '00000000-0000-0000-0000-0000000000c1') = 20.5,
    'FALLO: kg_entregados incorrecto';
  assert (select kg_restantes from public.resumen_rutas where ruta_id = '00000000-0000-0000-0000-0000000000c1') = 29.5,
    'FALLO: kg_restantes incorrecto';
  assert (select count(*) from public.resumen_rutas) = 2, 'FALLO: rep1 no ve exactamente sus 2 rutas';
end $$;

-- =========================================================================
-- Repartidor 2: no ve ni toca lo de rep1
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.rutas) = 0, 'FALLO: rep2 ve rutas ajenas';
  assert (select count(*) from public.entregas) = 0, 'FALLO: rep2 ve entregas ajenas';
  assert (select count(*) from public.resumen_rutas) = 0, 'FALLO: rep2 ve el resumen ajeno';

  begin
    insert into public.entregas (ruta_id, parada, kg_dejados)
    values ('00000000-0000-0000-0000-0000000000c1', 'Intruso', 1);
    raise exception 'FALLO: rep2 escribió en la ruta de rep1';
  exception when insufficient_privilege then null;
  end;

  update public.entregas set kg_dejados = 99 where id = '00000000-0000-0000-0000-0000000000e1';
  get diagnostics n = row_count;
  assert n = 0, 'FALLO: rep2 editó una entrega de rep1';

  delete from public.entregas where id = '00000000-0000-0000-0000-0000000000e1';
  get diagnostics n = row_count;
  assert n = 0, 'FALLO: rep2 borró una entrega de rep1';

  begin
    perform public.reabrir_ruta('00000000-0000-0000-0000-0000000000c1');
    raise exception 'FALLO: rep2 pudo llamar reabrir_ruta';
  exception when insufficient_privilege then null;
  end;

  begin
    perform private.is_admin();
    -- Tiene EXECUTE (lo usan las políticas), pero debe devolver false
    assert not private.is_admin(), 'FALLO: rep2 es admin';
  end;
end $$;

-- =========================================================================
-- Repartidor 1 cierra su ruta: ya no puede escribir
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

do $$
declare n int;
begin
  update public.rutas set cerrada_at = now() where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 1, 'FALLO: rep1 no pudo cerrar su ruta';

  begin
    insert into public.entregas (ruta_id, parada, kg_dejados)
    values ('00000000-0000-0000-0000-0000000000c1', 'Tarde', 1);
    raise exception 'FALLO: rep1 escribió en una ruta cerrada';
  exception when insufficient_privilege then null;
  end;

  update public.rutas set cerrada_at = null where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 0, 'FALLO: rep1 reabrió su propia ruta';
end $$;

-- =========================================================================
-- Admin
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$
declare n int;
begin
  assert (select count(*) from public.profiles where usuario like 'test\_%') = 3, 'FALLO: admin no ve todos los perfiles';
  assert (select count(*) from public.rutas where repartidor_id = '00000000-0000-0000-0000-0000000000b1') = 2,
    'FALLO: admin no ve las rutas de rep1';
  assert (select count(*) from public.entregas where ruta_id = '00000000-0000-0000-0000-0000000000c1') = 2,
    'FALLO: admin no ve las entregas de rep1';

  begin
    insert into public.entregas (ruta_id, parada, kg_dejados)
    values ('00000000-0000-0000-0000-0000000000c1', 'Admin', 1);
    raise exception 'FALLO: admin capturó una entrega';
  exception when insufficient_privilege then null;
  end;

  update public.rutas set kg_iniciales = 999 where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  assert n = 0, 'FALLO: admin cambió kg de una ruta ajena';

  perform public.reabrir_ruta('00000000-0000-0000-0000-0000000000c1');
  assert (select cerrada_at is null from public.rutas where id = '00000000-0000-0000-0000-0000000000c1'),
    'FALLO: admin no pudo reabrir la ruta';

  update public.profiles set activo = false where id = '00000000-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  assert n = 1, 'FALLO: admin no pudo desactivar a rep2';

  update public.profiles set rol = 'repartidor' where id = auth.uid();
  get diagnostics n = row_count;
  assert n = 0, 'FALLO: admin pudo editar su propio perfil';
end $$;

-- =========================================================================
-- Rep1 de nuevo puede escribir (ruta reabierta); rep2 desactivado no
-- =========================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  insert into public.entregas (ruta_id, parada, kg_dejados)
  values ('00000000-0000-0000-0000-0000000000c1', 'Después de reabrir', 2);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  insert into public.rutas (kg_iniciales) values (10);
  raise exception 'FALLO: un repartidor desactivado creó una ruta';
exception when insufficient_privilege then null;
end $$;

reset role;
select 'OK: todas las pruebas de RLS pasaron' as resultado;

rollback;
