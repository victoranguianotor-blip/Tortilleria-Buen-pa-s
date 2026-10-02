// Teclado de kilos: solo enteros y medios (p. ej. "12" o "12.5"), hasta 999.5 kg.

export type Tecla = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'medio' | 'borrar'

const MAX_DIGITOS = 3

export function aplicarTecla(valor: string, tecla: Tecla): string {
  const tieneMedio = valor.endsWith('.5')
  const entero = tieneMedio ? valor.slice(0, -2) : valor

  if (tecla === 'borrar') {
    return tieneMedio ? entero : entero.slice(0, -1)
  }

  if (tecla === 'medio') {
    if (tieneMedio) return entero
    return `${entero || '0'}.5`
  }

  // Dígito: se agrega a la parte entera; el ".5" se conserva al final.
  if (entero.length >= MAX_DIGITOS) return valor
  const nuevoEntero = entero === '0' ? tecla : entero + tecla
  return tieneMedio ? `${nuevoEntero}.5` : nuevoEntero
}

export function valorAKg(valor: string): number {
  const kg = Number(valor)
  return Number.isFinite(kg) ? kg : 0
}

export function kgAValor(kg: number): string {
  // Redondea al medio más cercano para que siempre sea editable con el teclado.
  const medios = Math.round(kg * 2) / 2
  return medios > 0 ? String(medios) : ''
}
