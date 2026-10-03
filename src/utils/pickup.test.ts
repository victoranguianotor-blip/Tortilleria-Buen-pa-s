import { describe, expect, it } from 'vitest'

import { pickupSuggestion, type StopLike } from './pickup'

const stops: StopLike[] = [
  { id: '1', kind: 'delivery', stop_name: 'Tienda Mary', kg: 12 },
  { id: '2', kind: 'delivery', stop_name: ' tienda mary ', kg: 8 },
  { id: '3', kind: 'delivery', stop_name: 'Fonda', kg: 5 },
  { id: '4', kind: 'pickup', stop_name: 'Tienda Mary', kg: 2 },
]

describe('pickupSuggestion', () => {
  it('charges what was left at the store minus what comes back', () => {
    expect(pickupSuggestion(stops, 'Tienda Mary', 1, 20, null)).toBe(340)
    expect(pickupSuggestion(stops, 'Fonda', 0.5, 20)).toBe(90)
  })
  it('ignores the pickup being edited', () => {
    expect(pickupSuggestion(stops, 'Tienda Mary', 2, 20, '4')).toBe(360)
  })
  it('has no suggestion without deliveries to that store or without price', () => {
    expect(pickupSuggestion(stops, 'Otra', 1, 20)).toBeNull()
    expect(pickupSuggestion(stops, 'Fonda', 1, null)).toBeNull()
    expect(pickupSuggestion(stops, 'Fonda', 5, 20)).toBeNull()
  })
})
