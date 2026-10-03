import { colimaTime } from './date'
import { remainingKg, sumKg } from './kg'
import { sumMoney } from './money'
import { storeKey } from './pickup'
import { sumSales, type SalesTotals } from './sales'

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

export interface ReportSaleInput {
  kg: number
  amount: number
  notes: string | null
  created_at: string
}

export interface ReportSale {
  number: number
  time: string
  kg: number
  amount: number
  notes: string
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

export type MovementType = 'departure' | 'delivery' | 'pickup' | 'close'

// Everything that happened on a route, in order: leaving, each stop and closing.
export interface ReportMovement {
  type: MovementType
  time: string
  number: number | null
  stopName: string
  kg: number | null
  amount: number | null
  notes: string
}

export interface ReportStore {
  name: string
  deliveredKg: number
  pickedKg: number
  amount: number
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
  movements: ReportMovement[]
  stores: ReportStore[]
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
  sales: ReportSale[]
  salesTotals: SalesTotals
  openRoutes: number
}

function movement(
  type: MovementType,
  time: string,
  number: number | null,
  stopName: string,
  kg: number | null,
  amount: number | null,
  notes = '',
): ReportMovement {
  return { type, time, number, stopName, kg, amount, notes }
}

function storeBalances(stops: ReportStop[]): ReportStore[] {
  const byStore = new Map<string, ReportStop[]>()
  for (const s of stops) {
    const key = storeKey(s.stopName)
    byStore.set(key, [...(byStore.get(key) ?? []), s])
  }
  return [...byStore.values()].map((own) => ({
    name: own[0]!.stopName,
    deliveredKg: sumKg(own.filter((s) => !s.pickup).map((s) => s.kg)),
    pickedKg: sumKg(own.filter((s) => s.pickup).map((s) => s.kg)),
    amount: sumMoney(own.map((s) => s.amount)),
  }))
}

export function buildDayReport(
  date: string,
  routes: ReportRouteInput[],
  deliveries: ReportDeliveryInput[],
  salesInput: ReportSaleInput[] = [],
): DayReport {
  const reportRoutes = [...routes]
    .sort((a, b) => a.driver_name.localeCompare(b.driver_name, 'es-MX'))
    .map((r) => {
      const own = deliveries
        .filter((d) => d.route_id === r.route_id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
      const kgs = own.filter((d) => d.kind === 'delivery').map((d) => d.kg)
      const stops: ReportStop[] = own.map((d, i) => ({
        number: i + 1,
        time: colimaTime(d.created_at),
        pickup: d.kind === 'pickup',
        stopName: d.stop_name.trim(),
        kg: d.kg,
        amount: d.received_amount,
        notes: d.notes?.trim() ?? '',
      }))
      return {
        driverName: r.driver_name,
        initialKg: r.initial_kg,
        deliveredKg: sumKg(kgs),
        remainingKg: remainingKg(r.initial_kg, kgs),
        pickedKg: sumKg(own.filter((d) => d.kind === 'pickup').map((d) => d.kg)),
        receivedAmount: sumMoney(own.map((d) => d.received_amount)),
        departedAt: r.departed_at,
        closedAt: r.closed_at,
        stops,
        movements: [
          ...(r.departed_at
            ? [movement('departure', colimaTime(r.departed_at), null, '', null, null)]
            : []),
          ...stops.map((s) =>
            movement(
              s.pickup ? 'pickup' : 'delivery',
              s.time,
              s.number,
              s.stopName,
              s.kg,
              s.amount,
              s.notes,
            ),
          ),
          ...(r.closed_at
            ? [movement('close', colimaTime(r.closed_at), null, '', null, null)]
            : []),
        ],
        stores: storeBalances(stops),
      }
    })

  const sales = [...salesInput]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((s, i) => ({
      number: i + 1,
      time: colimaTime(s.created_at),
      kg: s.kg,
      amount: s.amount,
      notes: s.notes?.trim() ?? '',
    }))

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
    sales,
    salesTotals: sumSales(sales),
    openRoutes: reportRoutes.filter((r) => !r.closedAt).length,
  }
}

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  departure: 'Salida',
  delivery: 'Entrega',
  pickup: 'Recolección',
  close: 'Cierre',
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// One row per movement (departure, each delivery or pickup, closing, each counter sale), with plain numbers (no thousands separator) so spreadsheets read them.
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
    if (r.movements.length === 0) return [[...base, '', '', '', '', '', '', '']]
    return r.movements.map((m) => [
      ...base,
      m.number ?? '',
      m.time,
      MOVEMENT_LABEL[m.type],
      m.stopName,
      m.kg ?? '',
      m.amount === null ? '' : m.amount.toFixed(2),
      m.notes,
    ])
  })
  const saleRows = report.sales.map((s) => [
    report.date,
    'Mostrador',
    '',
    '',
    '',
    s.number,
    s.time,
    'Venta',
    '',
    s.kg,
    s.amount.toFixed(2),
    s.notes,
  ])
  return (
    '﻿' +
    [header, ...rows, ...saleRows].map((row) => row.map(csvCell).join(',')).join('\r\n') +
    '\r\n'
  )
}
