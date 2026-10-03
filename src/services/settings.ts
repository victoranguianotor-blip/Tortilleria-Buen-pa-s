import { supabase } from '@/lib/supabase'

// storePrice: pesos per kg charged to stores on a route. counterPrice: pesos per kg at the shop.
export interface Prices {
  storePrice: number | null
  counterPrice: number | null
}

export async function fetchPrices(): Promise<Prices> {
  const { data, error } = await supabase
    .from('settings')
    .select('price_per_kg, counter_price_per_kg')
    .maybeSingle()
  if (error) throw error
  return {
    storePrice: data?.price_per_kg ?? null,
    counterPrice: data?.counter_price_per_kg ?? null,
  }
}

export async function updateStorePrice(price: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('settings')
    .update({ price_per_kg: price })
    .eq('id', true)
    .select('price_per_kg')
    .single()
  if (error) throw error
  return data.price_per_kg
}

export async function updateCounterPrice(price: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('settings')
    .update({ counter_price_per_kg: price })
    .eq('id', true)
    .select('counter_price_per_kg')
    .single()
  if (error) throw error
  return data.counter_price_per_kg
}
