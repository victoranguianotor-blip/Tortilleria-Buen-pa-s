import { supabase } from '@/lib/supabase'

export async function fetchPricePerKg(): Promise<number | null> {
  const { data, error } = await supabase.from('settings').select('price_per_kg').maybeSingle()
  if (error) throw error
  return data?.price_per_kg ?? null
}

export async function updatePricePerKg(pricePerKg: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('settings')
    .update({ price_per_kg: pricePerKg })
    .eq('id', true)
    .select('price_per_kg')
    .single()
  if (error) throw error
  return data.price_per_kg
}
