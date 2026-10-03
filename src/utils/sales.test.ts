import { describe, expect, it } from 'vitest'

import { sumSales } from './sales'

describe('sumSales', () => {
  it('sums kg and pesos without float drift', () => {
    expect(
      sumSales([
        { kg: 0.1, amount: 0.1 },
        { kg: 0.2, amount: 0.2 },
        { kg: 2.5, amount: 56.25 },
      ]),
    ).toEqual({ count: 3, kg: 2.8, amount: 56.55 })
  })
  it('is zero without sales', () => {
    expect(sumSales([])).toEqual({ count: 0, kg: 0, amount: 0 })
  })
})
