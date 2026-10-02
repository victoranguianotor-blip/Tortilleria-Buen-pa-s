import { describe, expect, it } from 'vitest'

import { formatKg, formatKgNumber, remainingKg, sumKg } from './kg'

describe('kg', () => {
  it('sums without floating point drift', () => {
    expect(sumKg([0.1, 0.2])).toBe(0.3)
    expect(sumKg([])).toBe(0)
  })

  it('computes remaining kg, negative on over-delivery', () => {
    expect(remainingKg(50, [12.5, 7.25])).toBe(30.25)
    expect(remainingKg(10, [6, 5])).toBe(-1)
  })

  it('formats for es-MX', () => {
    expect(formatKg(1234.5)).toBe('1,234.5 kg')
    expect(formatKg(3)).toBe('3 kg')
    expect(formatKgNumber(12.5)).toBe('12.5')
  })
})
