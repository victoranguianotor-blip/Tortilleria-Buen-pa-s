import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { usuarioAEmail } from '@/utils/login'

export type Perfil = Pick<Tables<'profiles'>, 'id' | 'usuario' | 'nombre' | 'rol' | 'activo'>

export async function iniciarSesion(usuario: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: usuarioAEmail(usuario),
    password,
  })
  if (error) throw error
}

export async function cerrarSesion(): Promise<void> {
  // scope local: no invalida las sesiones de otros dispositivos del mismo usuario.
  await supabase.auth.signOut({ scope: 'local' })
}

export async function idUsuarioActual(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export async function obtenerPerfil(id: string): Promise<Perfil> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, usuario, nombre, rol, activo')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export function alCerrarSesion(callback: () => void): void {
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT') callback()
  })
}
