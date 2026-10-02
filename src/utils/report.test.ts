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
    received_amount: 0.1,
    notes: null,
    created_at: '2026-10-01T15:30:00Z',
  },
  {
    route_id: 'a',
    kind: 'delivery',
    stop_name: 'Abarrotes',
    kg: 0.2,
    received_amount: 0.2,
    notes: null,
    created_at: '2026-10-01T14:05:00Z',
  },
  {
    route_id: 'a',
    kind: 'pickup',
    stop_name: 'Abarrotes',
    kg: 1.5,
    received_amount: 0,
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

describe('reportToCsv', () => {
  it('writes one escaped row per stop and keeps routes without stops', () => {
    const report = buildDayReport('2026-10-01', routes, deliveries.slice(0, 3))
    const lines = reportToCsv(report).replace('﻿', '').trimEnd().split('\r\n')
    expect(lines).toEqual([
      'Fecha,Repartidor,Hora salida,Salió (kg),Ruta,Parada #,Hora,Tipo,Parada,Kg,Cobrado ($),Notas',
      '2026-10-01,Ana,07:40,50.5,Cerrada,1,08:05,Entrega,Abarrotes,0.2,0.20,',
      '2026-10-01,Ana,07:40,50.5,Cerrada,2,08:10,Recolección,Abarrotes,1.5,0.00,Sobró de ayer',
      '2026-10-01,Ana,07:40,50.5,Cerrada,3,09:30,Entrega,"Tienda ""La Luz"", centro",0.1,0.10,',
      '2026-10-01,Óscar,,10,Abierta,,,,,0,0.00,',
    ])
  })
})

describe('formatLongDate', () => {
  it('writes the date in Spanish', () => {
    expect(formatLongDate('2026-10-01')).toBe('jueves 1 de octubre de 2026')
  })
})
