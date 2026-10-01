# Reparto de Tortillas

PWA para que los repartidores registren los kg de tortilla de su ruta y el admin vea el resumen
diario y genere reportes. Vue 3 + Vite + Supabase.

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env` y llena los valores de tu proyecto Supabase.
3. Aplica el esquema (ver comandos de Supabase en `CLAUDE.md`).
4. En Supabase > Authentication > Sign In / Providers: desactiva **Allow new users to sign up**.
5. `npm run dev`

### Primer admin

Supabase > Authentication > Users > **Add user** con email `tuusuario@reparto.local`, contraseña y
**Auto Confirm User** marcado. Luego en el SQL Editor:

```sql
update public.profiles set rol = 'admin', nombre = 'Tu nombre' where usuario = 'tuusuario';
```

Los demás usuarios se crean desde la app.
