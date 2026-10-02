import { describe, expect, it } from 'vitest'

import { addDays, colimaTime, formatShortDate } from './date'
import { usernameToEmail } from './email'
import { errorMessage } from './errors'
import { applyKey, kgToValue, valueToKg, type KeypadKey } from './keypad'
import { routeStatus } from './status'
import { isValidUsername, normalizeUsername } from './users'

function type(keys: KeypadKey[], initial = ''): string {
  return keys.reduce(applyKey, initial)
}

describe('usernameToEmail', () => {
  it('appends the internal domain', () => {
    expect(usernameToEmail('  Juan ')).toBe('juan@reparto.local')
  })
  it('keeps a full email', () => {
    expect(usernameToEmail('Victor@Gmail.com')).toBe('victor@gmail.com')
  })
})

describe('kg keypad', () => {
  it('types whole numbers and drops a leading zero', () => {
    expect(type(['0', '1', '2'])).toBe('12')
  })
  it('toggles the half', () => {
    expect(type(['7', 'half'])).toBe('7.5')
    expect(type(['7', 'half', 'half'])).toBe('7')
    expect(type(['half'])).toBe('0.5')
  })
  it('keeps the half while typing digits', () => {
    expect(type(['1', 'half', '2'])).toBe('12.5')
  })
  it('backspace removes the half first, then digits', () => {
    expect(type(['1', '2', 'half', 'backspace'])).toBe('12')
    expect(type(['1', '2', 'backspace', 'backspace', 'backspace'])).toBe('')
  })
  it('limits to 3 whole digits', () => {
    expect(type(['9', '9', '9', '9'])).toBe('999')
  })
  it('converts between value and kg', () => {
    expect(valueToKg('12.5')).toBe(12.5)
    expect(valueToKg('')).toBe(0)
    expect(kgToValue(12.5)).toBe('12.5')
    expect(kgToValue(7.25)).toBe('7.5')
    expect(kgToValue(0)).toBe('')
  })
})

describe('date', () => {
  it('formats the business date', () => {
    expect(formatShortDate('2026-10-01')).toBe('Jue 1 oct')
  })
  it('uses Colima time (UTC-6)', () => {
    expect(colimaTime('2026-10-01T18:05:00Z')).toBe('12:05')
  })
  it('adds days across months and years', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('usernames', () => {
  it('normalizes and validates like the Edge Function', () => {
    expect(normalizeUsername('  Juan.P ')).toBe('juan.p')
    expect(isValidUsername('Juan_2')).toBe(true)
    expect(isValidUsername('jo')).toBe(false)
    expect(isValidUsername('juan pérez')).toBe(false)
  })
})

describe('errorMessage', () => {
  it('detects network errors', () => {
    expect(errorMessage({ message: 'TypeError: Failed to fetch' })).toMatch(/Sin conexión/)
  })
  it('translates known codes', () => {
    expect(errorMessage({ code: 'invalid_credentials' })).toMatch(/incorrectos/)
    expect(errorMessage({ code: '42501' })).toMatch(/cerrada/)
  })
  it('passes through Edge Function messages', () => {
    expect(errorMessage({ code: 'admin_users', message: 'El usuario "juan" ya existe' })).toBe(
      'El usuario "juan" ya existe',
    )
  })
  it('has a default message', () => {
    expect(errorMessage(null)).toMatch(/Algo salió mal/)
  })
})

describe('routeStatus', () => {
  it('reads the state of a route', () => {
    expect(routeStatus(null, 0).text).toBe('Sin iniciar')
    expect(routeStatus({ closed_at: '2026-10-01T20:00:00Z' }, -3).text).toBe('Cerrada')
    expect(routeStatus({ closed_at: null }, -0.5).tone).toBe('danger')
    expect(routeStatus({ closed_at: null }, 4).tone).toBe('go')
  })
})
