// Deployed with verify_jwt = false: the platform cannot verify the new sb_* keys, so this
// function authenticates the caller itself (auth.getUser + active admin check) before using
// the secret key, which bypasses RLS.
//
// POST { action: 'create', username, fullName, password, role? }
// POST { action: 'set_password', id, password }
// POST { action: 'set_active', id, active }

import { createClient } from 'npm:@supabase/supabase-js@2'

const USER_EMAIL_DOMAIN = 'reparto.local'
const USERNAME_RE = /^[a-z0-9._-]{3,30}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BAN_DURATION = '876000h'

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

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function requireAdmin(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Inicia sesión para continuar')

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Sesión inválida o expirada')

  const { data: profile } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profile?.role !== 'admin' || !profile.active) {
    throw new HttpError(403, 'Solo un administrador puede gestionar usuarios')
  }
  return data.user.id
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres')
  }
  return password
}

function validateId(id: unknown): string {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new HttpError(400, 'Usuario no válido')
  return id
}

async function createUser(body: Record<string, unknown>) {
  const username = String(body.username ?? '')
    .trim()
    .toLowerCase()
  const fullName = String(body.fullName ?? '').trim()
  const password = validatePassword(body.password)
  const role = body.role === 'admin' ? 'admin' : 'driver'

  if (!USERNAME_RE.test(username)) {
    throw new HttpError(400, 'Usuario: 3 a 30 caracteres, solo minúsculas, números, punto, guion')
  }
  if (fullName.length < 1 || fullName.length > 80) throw new HttpError(400, 'Escribe el nombre')

  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@${USER_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName },
  })
  if (error) {
    // "Database error" means the profile trigger hit an existing username.
    if (error.code === 'email_exists' || /database error/i.test(error.message)) {
      throw new HttpError(409, `El usuario "${username}" ya existe`)
    }
    throw new HttpError(400, error.message)
  }

  if (role === 'admin') {
    const { error: roleError } = await admin
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id)
    if (roleError) throw roleError
  }

  return respond(201, { id: data.user.id, username, fullName, role })
}

async function setPassword(body: Record<string, unknown>) {
  const id = validateId(body.id)
  const password = validatePassword(body.password)

  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) throw new HttpError(error.status === 404 ? 404 : 400, error.message)
  return respond(200, { ok: true })
}

async function setActive(body: Record<string, unknown>, callerId: string) {
  const id = validateId(body.id)
  if (typeof body.active !== 'boolean') throw new HttpError(400, 'Falta "active"')
  if (id === callerId) throw new HttpError(400, 'No puedes desactivar tu propia cuenta')

  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: body.active ? 'none' : BAN_DURATION,
  })
  if (error) throw new HttpError(error.status === 404 ? 404 : 400, error.message)

  const { error: profileError } = await admin
    .from('profiles')
    .update({ active: body.active })
    .eq('id', id)
  if (profileError) throw profileError

  return respond(200, { ok: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return respond(405, { error: 'Método no permitido' })

  try {
    const callerId = await requireAdmin(req)
    const body = await req.json().catch(() => {
      throw new HttpError(400, 'Cuerpo JSON inválido')
    })

    switch (body?.action) {
      case 'create':
        return await createUser(body)
      case 'set_password':
        return await setPassword(body)
      case 'set_active':
        return await setActive(body, callerId)
      default:
        throw new HttpError(400, 'Acción no válida')
    }
  } catch (e) {
    if (e instanceof HttpError) return respond(e.status, { error: e.message })
    console.error(e)
    return respond(500, { error: 'Error interno' })
  }
})
