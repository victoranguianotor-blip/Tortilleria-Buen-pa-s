import { describe, expect, it } from 'vitest'

import { formatLongDate } from './date'
import { buildDayReport, reportToCsv, type ReportDeliveryInput } from './report'

const routes = [
  { route_id: 'b', driver_name: 'Óscar', initial_kg: 10, closed_at: null, departed_at: null },
  {
    route_id: 'a',
    driver_name: 'Ana',
    initial_kg: 50.5,
    closed_at: '2026-10-01T22:00:00Z',
    departed_at: '2026-10-01T13:40:00Z',
  },
]
const deliveries: ReportDeliveryInput[] = [
  {
    route_id: 'a',
    kind: 'delivery',
    stop_name: ' Tienda "La Luz", centro ',
    kg: 0.1,
    received_amount: 0,
    notes: null,
    created_at: '2026-10-01T15:30:00Z',
  },
  {
    route_id: 'a',
    kind: 'delivery',
    stop_name: 'Abarrotes',
    kg: 0.2,
    received_amount: 0,
    notes: null,
    created_at: '2026-10-01T14:05:00Z',
  },
  {
    route_id: 'a',
    kind: 'pickup',
    stop_name: 'Abarrotes',
    kg: 1.5,
    received_amount: 0.3,
    notes: ' Sobró de ayer ',
    created_at: '2026-10-01T14:10:00Z',
  },
  {
    route_id: 'b',
    kind: 'delivery',
    stop_name: 'Fonda',
    kg: 12,
    received_amount: 0,
    notes: null,
    created_at: '2026-10-01T16:00:00Z',
  },
]

describe('buildDayReport', () => {
  const report = buildDayReport('2026-10-01', routes, deliveries)

  it('sorts drivers by name and stops by time', () => {
    expect(report.routes.map((r) => r.driverName)).toEqual(['Ana', 'Óscar'])
    expect(report.routes[0]!.stops.map((s) => [s.number, s.time, s.pickup, s.stopName])).toEqual([
      [1, '08:05', false, 'Abarrotes'],
      [2, '08:10', true, 'Abarrotes'],
      [3, '09:30', false, 'Tienda "La Luz", centro'],
    ])
  })

  it('keeps pickups out of delivered and remaining kg', () => {
    expect(report.routes[0]).toMatchObject({
      deliveredKg: 0.3,
      remainingKg: 50.2,
      pickedKg: 1.5,
      receivedAmount: 0.3,
    })
    expect(report.routes[1]).toMatchObject({
      deliveredKg: 12,
      remainingKg: -2,
      pickedKg: 0,
      receivedAmount: 0,
    })
    expect(report.totals).toEqual({
      initialKg: 60.5,
      deliveredKg: 12.3,
      remainingKg: 48.2,
      pickedKg: 1.5,
      receivedAmount: 0.3,
      stops: 4,
    })
    expect(report.openRoutes).toBe(1)
  })
})

describe('movements and stores', () => {
  const report = buildDayReport('2026-10-01', routes, deliveries)

  it('lists departure, every stop and closing in order', () => {
    expect(report.routes[0]!.movements.map((m) => [m.type, m.time, m.number])).toEqual([
      ['departure', '07:40', null],
      ['delivery', '08:05', 1],
      ['pickup', '08:10', 2],
      ['delivery', '09:30', 3],
      ['close', '16:00', null],
    ])
    expect(report.routes[1]!.movements.map((m) => m.type)).toEqual(['delivery'])
  })

  it('balances each store, merging names that differ only in case or spaces', () => {
    expect(report.routes[0]!.stores).toEqual([
      { name: 'Abarrotes', deliveredKg: 0.2, pickedKg: 1.5, amount: 0.3 },
      { name: 'Tienda "La Luz", centro', deliveredKg: 0.1, pickedKg: 0, amount: 0 },
    ])
  })
})

describe('reportToCsv', () => {
  it('writes one escaped row per stop and keeps routes without stops', () => {
    const report = buildDayReport('2026-10-01', routes, deliveries.slice(0, 3))
    const lines = reportToCsv(report).replace('﻿', '').trimEnd().split('\r\n')
    expect(lines).toEqual([
      'Fecha,Repartidor,Hora salida,Salió (kg),Ruta,Parada #,Hora,Tipo,Parada,Kg,Cobrado ($),Notas',
      '2026-10-01,Ana,07:40,50.5,Cerrada,,07:40,Salida,,,,',
      '2026-10-01,Ana,07:40,50.5,Cerrada,1,08:05,Entrega,Abarrotes,0.2,0.00,',
      '2026-10-01,Ana,07:40,50.5,Cerrada,2,08:10,Recolección,Abarrotes,1.5,0.30,Sobró de ayer',
      '2026-10-01,Ana,07:40,50.5,Cerrada,3,09:30,Entrega,"Tienda ""La Luz"", centro",0.1,0.00,',
      '2026-10-01,Ana,07:40,50.5,Cerrada,,16:00,Cierre,,,,',
      '2026-10-01,Óscar,,10,Abierta,,,,,,,',
    ])
  })
})

describe('counter sales', () => {
  const sales = [
    { kg: 2.5, amount: 56.25, notes: null, created_at: '2026-10-01T18:00:00Z' },
    { kg: 1, amount: 22, notes: ' Cliente, "fiado" ', created_at: '2026-10-01T15:00:00Z' },
  ]
  const report = buildDayReport('2026-10-01', routes, deliveries.slice(0, 3), sales)

  it('lists sales by time with their totals', () => {
    expect(report.sales.map((x) => [x.number, x.time, x.kg, x.amount, x.notes])).toEqual([
      [1, '09:00', 1, 22, 'Cliente, "fiado"'],
      [2, '12:00', 2.5, 56.25, ''],
    ])
    expect(report.salesTotals).toEqual({ count: 2, kg: 3.5, amount: 78.25 })
  })

  it('adds one CSV row per sale after the routes', () => {
    const lines = reportToCsv(report).replace('﻿', '').trimEnd().split('\r\n')
    expect(lines.slice(-2)).toEqual([
      '2026-10-01,Mostrador,,,,1,09:00,Venta,,1,22.00,"Cliente, ""fiado"""',
      '2026-10-01,Mostrador,,,,2,12:00,Venta,,2.5,56.25,',
    ])
  })

  it('has no sales by default', () => {
    expect(buildDayReport('2026-10-01', routes, deliveries).salesTotals.count).toBe(0)
  })
})

describe('formatLongDate', () => {
  it('writes the date in Spanish', () => {
    expect(formatLongDate('2026-10-01')).toBe('jueves 1 de octubre de 2026')
  })
})
