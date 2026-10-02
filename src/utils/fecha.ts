// Fecha de negocio: Colima (America/Mexico_City). "Hoy" lo da el servidor (hoy_colima);
// aquí solo se formatea.
const ZONA = 'America/Mexico_City'

const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** "2026-10-01" -> "JUE 01 OCT" */
export function fechaCorta(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number) as [number, number, number]
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return `${DIAS[diaSemana]} ${String(dia).padStart(2, '0')} ${MESES[mes - 1]}`
}

/** Hora HH:MM en Colima, de un timestamp ISO o un Date. */
export function horaColima(momento: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(typeof momento === 'string' ? new Date(momento) : momento)
}
