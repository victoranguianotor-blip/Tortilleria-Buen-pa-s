import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Sale = Tables<'sales'>

export interface SaleInput {
  kg: number
  amount: number
  notes: string | null
}

export async function fetchSales(date: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('sale_date', date)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createSale(input: SaleInput): Promise<Sale> {
  const { data, error } = await supabase
    .from('sales')
    .insert({ id: crypto.randomUUID(), kg: input.kg, amount: input.amount, notes: input.notes })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSale(id: string, input: SaleInput): Promise<Sale> {
  // An update blocked by RLS (a day that is not today) returns 0 rows: .single() reports PGRST116.
  const { data, error } = await supabase
    .from('sales')
    .update({ kg: input.kg, amount: input.amount, notes: input.notes })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSale(id: string): Promise<void> {
  const { data, error } = await supabase.from('sales').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw { code: 'PGRST116' }
}
