// Pesos are summed in integer cents, like kg in hundredths (see kg.ts).

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function sumMoney(values: number[]): number {
  const cents = values.reduce((total, amount) => total + Math.round(amount * 100), 0)
  return cents / 100
}

export function suggestedAmount(kg: number, pricePerKg: number | null): number | null {
  if (!pricePerKg || kg <= 0) return null
  return Math.round(kg * pricePerKg * 100) / 100
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
