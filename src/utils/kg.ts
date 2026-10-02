// Sums in integer hundredths to avoid floating point drift (0.1 + 0.2).

export function roundKg(kg: number): number {
  return Math.round(kg * 100) / 100
}

export function sumKg(values: number[]): number {
  const hundredths = values.reduce((total, kg) => total + Math.round(kg * 100), 0)
  return hundredths / 100
}

export function remainingKg(initialKg: number, delivered: number[]): number {
  return roundKg(initialKg - sumKg(delivered))
}

export function formatKg(kg: number): string {
  return `${kg.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`
}

export function formatKgNumber(kg: number): string {
  return formatKg(kg).replace(' kg', '')
}
