import { colimaTime } from './date'
import { remainingKg, sumKg } from './kg'
import { sumMoney } from './money'

export interface ReportRouteInput {
  route_id: string
  driver_name: string
  initial_kg: number
  closed_at: string | null
  departed_at: string | null
}

export interface ReportDeliveryInput {
  route_id: string
  kind: 'delivery' | 'pickup'
  stop_name: string
  kg: number
  received_amount: number
  notes: string | null
  created_at: string
}

export interface ReportStop {
  number: number
  time: string
  pickup: boolean
  stopName: string
  kg: number
  amount: number
  notes: string
}

export interface ReportRoute {
  driverName: string
  initialKg: number
  deliveredKg: number
  remainingKg: number
  pickedKg: number
  receivedAmount: number
  departedAt: string | null
  closedAt: string | null
  stops: ReportStop[]
}

export interface DayReport {
  date: string
  routes: ReportRoute[]
  totals: {
    initialKg: number
    deliveredKg: number
    remainingKg: number
    pickedKg: number
    receivedAmount: number
    stops: number
  }
  openRoutes: number
}

export function buildDayReport(
  date: string,
  routes: ReportRouteInput[],
  deliveries: ReportDeliveryInput[],
): DayReport {
  const reportRoutes = [...routes]
    .sort((a, b) => a.driver_name.localeCompare(b.driver_name, 'es-MX'))
    .map((r) => {
      const own = deliveries
        .filter((d) => d.route_id === r.route_id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
      const kgs = own.filter((d) => d.kind === 'delivery').map((d) => d.kg)
      return {
        driverName: r.driver_name,
        initialKg: r.initial_kg,
        deliveredKg: sumKg(kgs),
        remainingKg: remainingKg(r.initial_kg, kgs),
        pickedKg: sumKg(own.filter((d) => d.kind === 'pickup').map((d) => d.kg)),
        receivedAmount: sumMoney(own.map((d) => d.received_amount)),
        departedAt: r.departed_at,
        closedAt: r.closed_at,
        stops: own.map((d, i) => ({
          number: i + 1,
          time: colimaTime(d.created_at),
          pickup: d.kind === 'pickup',
          stopName: d.stop_name.trim(),
          kg: d.kg,
          amount: d.received_amount,
          notes: d.notes?.trim() ?? '',
        })),
      }
    })

  const initialKg = sumKg(reportRoutes.map((r) => r.initialKg))
  const deliveredKg = sumKg(reportRoutes.map((r) => r.deliveredKg))
  return {
    date,
    routes: reportRoutes,
    totals: {
      initialKg,
      deliveredKg,
      remainingKg: remainingKg(initialKg, [deliveredKg]),
      pickedKg: sumKg(reportRoutes.map((r) => r.pickedKg)),
      receivedAmount: sumMoney(reportRoutes.map((r) => r.receivedAmount)),
      stops: reportRoutes.reduce((n, r) => n + r.stops.length, 0),
    },
    openRoutes: reportRoutes.filter((r) => !r.closedAt).length,
  }
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// One row per stop (delivery or pickup), with plain numbers (no thousands separator) so spreadsheets read them.
// The BOM makes Excel open the accents as UTF-8.
export function reportToCsv(report: DayReport): string {
  const header = [
    'Fecha',
    'Repartidor',
    'Hora salida',
    'Salió (kg)',
    'Ruta',
    'Parada #',
    'Hora',
    'Tipo',
    'Parada',
    'Kg',
    'Cobrado ($)',
    'Notas',
  ]
  const rows = report.routes.flatMap((r) => {
    const state = r.closedAt ? 'Cerrada' : 'Abierta'
    const departed = r.departedAt ? colimaTime(r.departedAt) : ''
    const base = [report.date, r.driverName, departed, r.initialKg, state]
    if (r.stops.length === 0) return [[...base, '', '', '', '', 0, '0.00', '']]
    return r.stops.map((s) => [
      ...base,
      s.number,
      s.time,
      s.pickup ? 'Recolección' : 'Entrega',
      s.stopName,
      s.kg,
      s.amount.toFixed(2),
      s.notes,
    ])
  })
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
