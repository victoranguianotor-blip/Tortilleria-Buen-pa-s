// Gestión de usuarios para el admin: crear, cambiar contraseña y activar/desactivar.
// Usa la secret key (salta RLS), por eso valida aquí que quien llama sea admin activo.
// Se despliega con verify_jwt = false: la plataforma no valida las claves nuevas (sb_*),
// la sesión del usuario se verifica abajo con auth.getUser().
//
// POST { accion: 'crear', usuario, nombre, password, rol? }
// POST { accion: 'cambiar_password', id, password }
// POST { accion: 'activar', id, activo }

import { createClient } from 'npm:@supabase/supabase-js@2'

const DOMINIO = 'reparto.local'
const USUARIO_RE = /^[a-z0-9._-]{3,30}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BLOQUEO = '876000h' // ~100 años: equivale a bloquear el login

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const secretKey =
  JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

class ErrorHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function responder(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function verificarAdmin(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new ErrorHttp(401, 'Inicia sesión para continuar')

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new ErrorHttp(401, 'Sesión inválida o expirada')

  const { data: perfil } = await admin
    .from('profiles')
    .select('rol, activo')
    .eq('id', data.user.id)
    .maybeSingle()
  if (perfil?.rol !== 'admin' || !perfil.activo) {
    throw new ErrorHttp(403, 'Solo un administrador puede gestionar usuarios')
  }
  return data.user.id
}

function validarPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 6) {
    throw new ErrorHttp(400, 'La contraseña debe tener al menos 6 caracteres')
  }
  return password
}

function validarId(id: unknown): string {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new ErrorHttp(400, 'Usuario no válido')
  return id
}

async function crear(body: Record<string, unknown>) {
  const usuario = String(body.usuario ?? '')
    .trim()
    .toLowerCase()
  const nombre = String(body.nombre ?? '').trim()
  const password = validarPassword(body.password)
  const rol = body.rol === 'admin' ? 'admin' : 'repartidor'

  if (!USUARIO_RE.test(usuario)) {
    throw new ErrorHttp(400, 'Usuario: 3 a 30 caracteres, solo minúsculas, números, punto, guion')
  }
  if (nombre.length < 1 || nombre.length > 80) throw new ErrorHttp(400, 'Escribe el nombre')

  const { data, error } = await admin.auth.admin.createUser({
    email: `${usuario}@${DOMINIO}`,
    password,
    email_confirm: true,
    user_metadata: { usuario, nombre },
  })
  if (error) {
    // email_exists: ya hay cuenta; "Database error": el trigger chocó con un usuario existente
    if (error.code === 'email_exists' || /database error/i.test(error.message)) {
      throw new ErrorHttp(409, `El usuario "${usuario}" ya existe`)
    }
    throw new ErrorHttp(400, error.message)
  }

  // El trigger crea el perfil como repartidor; aquí se promueve si hace falta.
  if (rol === 'admin') {
    const { error: errRol } = await admin.from('profiles').update({ rol }).eq('id', data.user.id)
    if (errRol) throw errRol
  }

  return responder(201, { id: data.user.id, usuario, nombre, rol })
}

async function cambiarPassword(body: Record<string, unknown>) {
  const id = validarId(body.id)
  const password = validarPassword(body.password)

  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) throw new ErrorHttp(error.status === 404 ? 404 : 400, error.message)
  return responder(200, { ok: true })
}

async function activar(body: Record<string, unknown>, llamanteId: string) {
  const id = validarId(body.id)
  if (typeof body.activo !== 'boolean') throw new ErrorHttp(400, 'Falta "activo"')
  if (id === llamanteId) throw new ErrorHttp(400, 'No puedes desactivar tu propia cuenta')

  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: body.activo ? 'none' : BLOQUEO,
  })
  if (error) throw new ErrorHttp(error.status === 404 ? 404 : 400, error.message)

  const { error: errPerfil } = await admin
    .from('profiles')
    .update({ activo: body.activo })
    .eq('id', id)
  if (errPerfil) throw errPerfil

  return responder(200, { ok: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido' })

  try {
    const llamanteId = await verificarAdmin(req)
    const body = await req.json().catch(() => {
      throw new ErrorHttp(400, 'Cuerpo JSON inválido')
    })

    switch (body?.accion) {
      case 'crear':
        return await crear(body)
      case 'cambiar_password':
        return await cambiarPassword(body)
      case 'activar':
        return await activar(body, llamanteId)
      default:
        throw new ErrorHttp(400, 'Acción no válida')
    }
  } catch (e) {
    if (e instanceof ErrorHttp) return responder(e.status, { error: e.message })
    console.error(e)
    return responder(500, { error: 'Error interno' })
  }
})
