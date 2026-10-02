import { colimaTime } from './date'
import { remainingKg, sumKg } from './kg'

export interface ReportRouteInput {
  route_id: string
  driver_name: string
  initial_kg: number
  closed_at: string | null
}

export interface ReportDeliveryInput {
  route_id: string
  stop_name: string
  delivered_kg: number
  created_at: string
}

export interface ReportStop {
  number: number
  time: string
  stopName: string
  kg: number
}

export interface ReportRoute {
  driverName: string
  initialKg: number
  deliveredKg: number
  remainingKg: number
  closedAt: string | null
  stops: ReportStop[]
}

export interface DayReport {
  date: string
  routes: ReportRoute[]
  totals: { initialKg: number; deliveredKg: number; remainingKg: number; stops: number }
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
      const kgs = own.map((d) => d.delivered_kg)
      return {
        driverName: r.driver_name,
        initialKg: r.initial_kg,
        deliveredKg: sumKg(kgs),
        remainingKg: remainingKg(r.initial_kg, kgs),
        closedAt: r.closed_at,
        stops: own.map((d, i) => ({
          number: i + 1,
          time: colimaTime(d.created_at),
          stopName: d.stop_name.trim(),
          kg: d.delivered_kg,
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
      stops: reportRoutes.reduce((n, r) => n + r.stops.length, 0),
    },
    openRoutes: reportRoutes.filter((r) => !r.closedAt).length,
  }
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// One row per delivery, with plain numbers (no thousands separator) so spreadsheets read them.
// The BOM makes Excel open the accents as UTF-8.
export function reportToCsv(report: DayReport): string {
  const header = ['Fecha', 'Repartidor', 'Salió (kg)', 'Ruta', 'Parada #', 'Hora', 'Parada', 'Kg']
  const rows = report.routes.flatMap((r) => {
    const state = r.closedAt ? 'Cerrada' : 'Abierta'
    const base = [report.date, r.driverName, r.initialKg, state]
    if (r.stops.length === 0) return [[...base, '', '', '', 0]]
    return r.stops.map((s) => [...base, s.number, s.time, s.stopName, s.kg])
  })
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
