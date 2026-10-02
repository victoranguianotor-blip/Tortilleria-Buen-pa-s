import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Route = Tables<'routes'>
export type Delivery = Tables<'deliveries'>

export async function businessToday(): Promise<string> {
  const { data, error } = await supabase.rpc('business_today')
  if (error) throw error
  return data
}

export async function fetchRoute(driverId: string, date: string): Promise<Route | null> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('driver_id', driverId)
    .eq('route_date', date)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function startRoute(initialKg: number): Promise<Route> {
  const { data, error } = await supabase
    .from('routes')
    .insert({ id: crypto.randomUUID(), initial_kg: initialKg })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInitialKg(routeId: string, initialKg: number): Promise<Route> {
  const { data, error } = await supabase
    .from('routes')
    .update({ initial_kg: initialKg })
    .eq('id', routeId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeRoute(routeId: string): Promise<Route> {
  const { data, error } = await supabase
    .from('routes')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', routeId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchDeliveries(routeId: string): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('route_id', routeId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createDelivery(
  routeId: string,
  stopName: string,
  deliveredKg: number,
): Promise<Delivery> {
  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      id: crypto.randomUUID(),
      route_id: routeId,
      stop_name: stopName,
      delivered_kg: deliveredKg,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDelivery(
  id: string,
  stopName: string,
  deliveredKg: number,
): Promise<Delivery> {
  // An update blocked by RLS does not error: it returns 0 rows, which .single() reports as PGRST116.
  const { data, error } = await supabase
    .from('deliveries')
    .update({ stop_name: stopName, delivered_kg: deliveredKg })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDelivery(id: string): Promise<void> {
  const { data, error } = await supabase.from('deliveries').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw { code: 'PGRST116' }
}

export async function fetchRecentStops(): Promise<string[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('stop_name')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw error

  const seen = new Map<string, string>()
  for (const { stop_name } of data) {
    const key = stop_name.trim().toLowerCase()
    if (!seen.has(key)) seen.set(key, stop_name.trim())
  }
  return [...seen.values()].slice(0, 60)
}
