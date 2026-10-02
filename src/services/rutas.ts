// Lecturas y escrituras de rutas y entregas. Toda escritura pasa por aquí para que la fase
// offline pueda encolarlas sin tocar la UI; por eso los IDs se generan en el cliente.
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Ruta = Tables<'rutas'>
export type Entrega = Tables<'entregas'>

export async function hoyColima(): Promise<string> {
  const { data, error } = await supabase.rpc('hoy_colima')
  if (error) throw error
  return data
}

export async function rutaDelDia(repartidorId: string, fecha: string): Promise<Ruta | null> {
  const { data, error } = await supabase
    .from('rutas')
    .select('*')
    .eq('repartidor_id', repartidorId)
    .eq('fecha', fecha)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function iniciarRuta(kgIniciales: number): Promise<Ruta> {
  const { data, error } = await supabase
    .from('rutas')
    .insert({ id: crypto.randomUUID(), kg_iniciales: kgIniciales })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function corregirCarga(rutaId: string, kgIniciales: number): Promise<Ruta> {
  const { data, error } = await supabase
    .from('rutas')
    .update({ kg_iniciales: kgIniciales })
    .eq('id', rutaId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cerrarRuta(rutaId: string): Promise<Ruta> {
  const { data, error } = await supabase
    .from('rutas')
    .update({ cerrada_at: new Date().toISOString() })
    .eq('id', rutaId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function entregasDeRuta(rutaId: string): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from('entregas')
    .select('*')
    .eq('ruta_id', rutaId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function registrarEntrega(
  rutaId: string,
  parada: string,
  kgDejados: number,
): Promise<Entrega> {
  const { data, error } = await supabase
    .from('entregas')
    .insert({ id: crypto.randomUUID(), ruta_id: rutaId, parada, kg_dejados: kgDejados })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function editarEntrega(
  id: string,
  parada: string,
  kgDejados: number,
): Promise<Entrega> {
  // Con RLS, un update bloqueado no falla: devuelve 0 filas y .single() lo reporta (PGRST116).
  const { data, error } = await supabase
    .from('entregas')
    .update({ parada, kg_dejados: kgDejados })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function borrarEntrega(id: string): Promise<void> {
  const { data, error } = await supabase.from('entregas').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw { code: 'PGRST116' }
}

/** Nombres de paradas usadas antes por este repartidor, para autocompletar. */
export async function paradasRecientes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('entregas')
    .select('parada')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw error

  const vistas = new Map<string, string>()
  for (const { parada } of data) {
    const clave = parada.trim().toLowerCase()
    if (!vistas.has(clave)) vistas.set(clave, parada.trim())
  }
  return [...vistas.values()].slice(0, 60)
}
