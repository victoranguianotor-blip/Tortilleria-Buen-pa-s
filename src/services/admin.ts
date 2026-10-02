import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type SummaryRow = Tables<'route_summaries'>
export type RouteSummary = {
  [K in Exclude<keyof SummaryRow, 'closed_at' | 'departed_at'>]: NonNullable<SummaryRow[K]>
} & Pick<SummaryRow, 'closed_at' | 'departed_at'>

export type UserProfile = Tables<'profiles'>
export type UserRole = UserProfile['role']

export async function fetchRouteSummaries(date: string): Promise<RouteSummary[]> {
  const { data, error } = await supabase
    .from('route_summaries')
    .select('*')
    .eq('route_date', date)
    .order('driver_name')
  if (error) throw error
  return data as RouteSummary[]
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name')
  if (error) throw error
  return data
}

export async function fetchDeliveriesOfRoutes(
  routeIds: string[],
): Promise<
  Pick<
    Tables<'deliveries'>,
    'route_id' | 'kind' | 'stop_name' | 'kg' | 'received_amount' | 'notes' | 'created_at'
  >[]
> {
  if (routeIds.length === 0) return []
  const { data, error } = await supabase
    .from('deliveries')
    .select('route_id, kind, stop_name, kg, received_amount, notes, created_at')
    .in('route_id', routeIds)
  if (error) throw error
  return data
}

export async function reopenRoute(routeId: string): Promise<void> {
  const { error } = await supabase.rpc('reopen_route', { p_route_id: routeId })
  if (error) throw error
}

async function invokeAdminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error instanceof FunctionsHttpError) {
    const payload = await error.context.json().catch(() => ({}))
    throw { code: 'admin_users', message: payload.error }
  }
  if (error instanceof FunctionsFetchError) throw { message: 'Failed to fetch' }
  if (error) throw error
  return data as T
}

export function createUser(input: {
  username: string
  fullName: string
  password: string
  role: UserRole
}): Promise<{ id: string; username: string }> {
  return invokeAdminUsers({ action: 'create', ...input })
}

export async function setPassword(id: string, password: string): Promise<void> {
  await invokeAdminUsers({ action: 'set_password', id, password })
}

export async function setActive(id: string, active: boolean): Promise<void> {
  await invokeAdminUsers({ action: 'set_active', id, active })
}
