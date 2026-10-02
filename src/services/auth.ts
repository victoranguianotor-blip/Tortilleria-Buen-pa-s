import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { usernameToEmail } from '@/utils/email'

export type Profile = Pick<Tables<'profiles'>, 'id' | 'username' | 'full_name' | 'role' | 'active'>

export async function signIn(username: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' })
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export async function fetchProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, active')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export function onSignedOut(callback: () => void): void {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') callback()
  })
}
