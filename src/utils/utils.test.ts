import { describe, expect, it } from 'vitest'

import { mensajeDeError } from './errores'
import { fechaCorta, horaColima } from './fecha'
import { usuarioAEmail } from './login'
import { aplicarTecla, kgAValor, valorAKg, type Tecla } from './teclado'

function teclear(teclas: Tecla[], inicial = ''): string {
  return teclas.reduce(aplicarTecla, inicial)
}

describe('usuarioAEmail', () => {
  it('agrega el dominio interno al usuario', () => {
    expect(usuarioAEmail('  Juan ')).toBe('juan@reparto.local')
  })
  it('respeta un email completo', () => {
    expect(usuarioAEmail('Victor@Gmail.com')).toBe('victor@gmail.com')
  })
})

describe('teclado de kg', () => {
  it('escribe enteros y quita el cero inicial', () => {
    expect(teclear(['0', '1', '2'])).toBe('12')
  })
  it('agrega y quita el medio', () => {
    expect(teclear(['7', 'medio'])).toBe('7.5')
    expect(teclear(['7', 'medio', 'medio'])).toBe('7')
    expect(teclear(['medio'])).toBe('0.5')
  })
  it('conserva el medio al seguir tecleando', () => {
    expect(teclear(['1', 'medio', '2'])).toBe('12.5')
  })
  it('borra primero el medio y luego dígitos', () => {
    expect(teclear(['1', '2', 'medio', 'borrar'])).toBe('12')
    expect(teclear(['1', '2', 'borrar', 'borrar', 'borrar'])).toBe('')
  })
  it('limita a 3 dígitos enteros', () => {
    expect(teclear(['9', '9', '9', '9'])).toBe('999')
  })
  it('convierte entre valor y kg', () => {
    expect(valorAKg('12.5')).toBe(12.5)
    expect(valorAKg('')).toBe(0)
    expect(kgAValor(12.5)).toBe('12.5')
    expect(kgAValor(7.25)).toBe('7.5')
    expect(kgAValor(0)).toBe('')
  })
})

describe('fecha', () => {
  it('formatea la fecha de negocio', () => {
    expect(fechaCorta('2026-10-01')).toBe('JUE 01 OCT')
  })
  it('da la hora de Colima (UTC-6)', () => {
    expect(horaColima('2026-10-01T18:05:00Z')).toBe('12:05')
  })
})

describe('mensajeDeError', () => {
  it('reconoce errores de red', () => {
    expect(mensajeDeError({ message: 'TypeError: Failed to fetch' })).toMatch(/Sin conexión/)
  })
  it('traduce códigos conocidos', () => {
    expect(mensajeDeError({ code: 'invalid_credentials' })).toMatch(/incorrectos/)
    expect(mensajeDeError({ code: '42501' })).toMatch(/cerrada/)
  })
  it('tiene un mensaje por defecto', () => {
    expect(mensajeDeError(null)).toMatch(/Algo salió mal/)
  })
})
