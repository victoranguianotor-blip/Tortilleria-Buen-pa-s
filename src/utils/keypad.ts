export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type KeypadKey = Digit | 'half' | 'backspace'
export type MoneyKey = Digit | 'dot' | 'backspace'

const MAX_DIGITS = 3
const MAX_MONEY_DIGITS = 5

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

export function applyMoneyKey(value: string, key: MoneyKey): string {
  if (key === 'backspace') return value.slice(0, -1)

  const [whole, cents] = value.split('.') as [string, string | undefined]
  if (key === 'dot') return cents === undefined ? `${whole || '0'}.` : value

  if (cents !== undefined) return cents.length < 2 ? value + key : value
  if (whole.length >= MAX_MONEY_DIGITS) return value
  return whole === '0' ? key : whole + key
}

export function valueToAmount(value: string): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export function amountToValue(amount: number): string {
  return amount > 0 ? String(Math.round(amount * 100) / 100) : ''
}
