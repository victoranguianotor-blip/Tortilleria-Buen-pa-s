import { describe, expect, it } from 'vitest'

import { formatearKg, kgRestantes, sumarKg } from './kg'

describe('kg', () => {
  it('suma sin errores de punto flotante', () => {
    expect(sumarKg([0.1, 0.2])).toBe(0.3)
    expect(sumarKg([])).toBe(0)
  })

  it('calcula kg restantes, incluso negativos si se entregó de más', () => {
    expect(kgRestantes(50, [12.5, 7.25])).toBe(30.25)
    expect(kgRestantes(10, [6, 5])).toBe(-1)
  })

  it('formatea en es-MX', () => {
    expect(formatearKg(1234.5)).toBe('1,234.5 kg')
    expect(formatearKg(3)).toBe('3 kg')
  })
})
