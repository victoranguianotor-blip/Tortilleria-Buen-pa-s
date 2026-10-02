import { describe, expect, it } from 'vitest'

import { formatLongDate } from './date'
import { buildDayReport, reportToCsv } from './report'

const routes = [
  { route_id: 'b', driver_name: 'Óscar', initial_kg: 10, closed_at: null },
  { route_id: 'a', driver_name: 'Ana', initial_kg: 50.5, closed_at: '2026-10-01T22:00:00Z' },
]
const deliveries = [
  {
    route_id: 'a',
    stop_name: ' Tienda "La Luz", centro ',
    delivered_kg: 0.1,
    created_at: '2026-10-01T15:30:00Z',
  },
  { route_id: 'a', stop_name: 'Abarrotes', delivered_kg: 0.2, created_at: '2026-10-01T14:05:00Z' },
  { route_id: 'b', stop_name: 'Fonda', delivered_kg: 12, created_at: '2026-10-01T16:00:00Z' },
]

describe('buildDayReport', () => {
  const report = buildDayReport('2026-10-01', routes, deliveries)

  it('sorts drivers by name and stops by time', () => {
    expect(report.routes.map((r) => r.driverName)).toEqual(['Ana', 'Óscar'])
    expect(report.routes[0]!.stops.map((s) => [s.number, s.time, s.stopName])).toEqual([
      [1, '08:05', 'Abarrotes'],
      [2, '09:30', 'Tienda "La Luz", centro'],
    ])
  })

  it('computes per-route and day totals without float drift', () => {
    expect(report.routes[0]).toMatchObject({ deliveredKg: 0.3, remainingKg: 50.2 })
    expect(report.routes[1]).toMatchObject({ deliveredKg: 12, remainingKg: -2 })
    expect(report.totals).toEqual({
      initialKg: 60.5,
      deliveredKg: 12.3,
      remainingKg: 48.2,
      stops: 3,
    })
    expect(report.openRoutes).toBe(1)
  })
})

describe('reportToCsv', () => {
  it('writes one escaped row per delivery and keeps routes without stops', () => {
    const report = buildDayReport('2026-10-01', routes, deliveries.slice(0, 2))
    const lines = reportToCsv(report).replace('﻿', '').trimEnd().split('\r\n')
    expect(lines).toEqual([
      'Fecha,Repartidor,Salió (kg),Ruta,Parada #,Hora,Parada,Kg',
      '2026-10-01,Ana,50.5,Cerrada,1,08:05,Abarrotes,0.2',
      '2026-10-01,Ana,50.5,Cerrada,2,09:30,"Tienda ""La Luz"", centro",0.1',
      '2026-10-01,Óscar,10,Abierta,,,,0',
    ])
  })
})

describe('formatLongDate', () => {
  it('writes the date in Spanish', () => {
    expect(formatLongDate('2026-10-01')).toBe('jueves 1 de octubre de 2026')
  })
})
