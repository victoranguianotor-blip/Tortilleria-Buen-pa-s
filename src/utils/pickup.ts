import { roundKg, sumKg } from './kg'
import { suggestedAmount } from './money'

export interface StopLike {
  id: string
  kind: 'delivery' | 'pickup'
  stop_name: string
  kg: number
}

export function storeKey(name: string): string {
  return name.trim().toLowerCase()
}

function sameStore(a: string, b: string): boolean {
  return storeKey(a) === storeKey(b)
}

// Money owed by a store when the driver comes back: the kg left there, minus what has already
// been picked up (earlier pickups and this one), at the base price. Null when nothing was left.
export function pickupSuggestion(
  stops: StopLike[],
  stopName: string,
  pickedKg: number,
  pricePerKg: number | null,
  excludeId: string | null = null,
): number | null {
  const own = stops.filter((s) => s.id !== excludeId && sameStore(s.stop_name, stopName))
  const left = sumKg(own.filter((s) => s.kind === 'delivery').map((s) => s.kg))
  if (left <= 0) return null
  const earlier = sumKg(own.filter((s) => s.kind === 'pickup').map((s) => s.kg))
  return suggestedAmount(roundKg(left - earlier - pickedKg), pricePerKg)
}
