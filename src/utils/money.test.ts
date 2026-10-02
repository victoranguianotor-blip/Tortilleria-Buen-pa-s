import { describe, expect, it } from 'vitest'

import { formatMoney, sumMoney, suggestedAmount } from './money'

describe('money', () => {
  it('sums without float drift', () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3)
    expect(sumMoney([281.25, 150.1])).toBe(431.35)
    expect(sumMoney([])).toBe(0)
  })
  it('suggests kg × price rounded to cents', () => {
    expect(suggestedAmount(12.5, 22.5)).toBe(281.25)
    expect(suggestedAmount(0.5, 23.33)).toBe(11.67)
    expect(suggestedAmount(3, null)).toBeNull()
    expect(suggestedAmount(0, 22)).toBeNull()
  })
  it('formats pesos with cents', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
    expect(formatMoney(0)).toBe('$0.00')
  })
})
