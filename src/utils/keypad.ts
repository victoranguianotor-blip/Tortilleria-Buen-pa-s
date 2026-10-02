export type KeypadKey =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'half' | 'backspace'

const MAX_DIGITS = 3

export function applyKey(value: string, key: KeypadKey): string {
  const hasHalf = value.endsWith('.5')
  const whole = hasHalf ? value.slice(0, -2) : value

  if (key === 'backspace') {
    return hasHalf ? whole : whole.slice(0, -1)
  }

  if (key === 'half') {
    if (hasHalf) return whole
    return `${whole || '0'}.5`
  }

  if (whole.length >= MAX_DIGITS) return value
  const nextWhole = whole === '0' ? key : whole + key
  return hasHalf ? `${nextWhole}.5` : nextWhole
}

export function valueToKg(value: string): number {
  const kg = Number(value)
  return Number.isFinite(kg) ? kg : 0
}

export function kgToValue(kg: number): string {
  const halves = Math.round(kg * 2) / 2
  return halves > 0 ? String(halves) : ''
}
