// Los kg se guardan como numeric(8,2) en Postgres. En JS sumamos en centésimas
// enteras para evitar errores de punto flotante (0.1 + 0.2).

export function redondearKg(kg: number): number {
  return Math.round(kg * 100) / 100
}

export function sumarKg(valores: number[]): number {
  const centesimas = valores.reduce((total, kg) => total + Math.round(kg * 100), 0)
  return centesimas / 100
}

export function kgRestantes(kgIniciales: number, entregados: number[]): number {
  return redondearKg(kgIniciales - sumarKg(entregados))
}

export function formatearKg(kg: number): string {
  return `${kg.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kg`
}
