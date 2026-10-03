import type { jsPDF } from 'jspdf'

import { colimaTime, formatLongDate } from './date'
import { formatKgNumber, roundKg } from './kg'
import { formatMoney } from './money'
import { MOVEMENT_LABEL, type DayReport, type ReportMovement } from './report'

const PAGE = { width: 215.9, height: 279.4, margin: 15 }
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2
const LINE = 5
const ROW_PAD = 1.6
const INK: [number, number, number] = [20, 20, 20]
const MUTED: [number, number, number] = [110, 110, 110]
const DANGER: [number, number, number] = [190, 30, 30]
const RULE: [number, number, number] = [200, 200, 200]
const HEADER_FILL: [number, number, number] = [235, 235, 235]

interface Column {
  title: string
  width: number
  align?: 'left' | 'right'
}

interface Cell {
  text: string
  color?: [number, number, number]
}

const SUMMARY_COLUMNS: Column[] = [
  { title: 'Repartidor', width: 32 },
  { title: 'Salida', width: 15 },
  { title: 'Salió kg', width: 20, align: 'right' },
  { title: 'Entregó kg', width: 21, align: 'right' },
  { title: 'Regresa kg', width: 21, align: 'right' },
  { title: 'Recogió kg', width: 20, align: 'right' },
  { title: 'Paradas', width: 14, align: 'right' },
  { title: 'Cobrado', width: 25, align: 'right' },
  { title: 'Estado', width: CONTENT_WIDTH - 168 },
]

const MOVEMENT_COLUMNS: Column[] = [
  { title: '#', width: 10, align: 'right' },
  { title: 'Hora', width: 16 },
  { title: 'Tipo', width: 26 },
  { title: 'Detalle', width: CONTENT_WIDTH - 104 },
  { title: 'Kg', width: 24, align: 'right' },
  { title: 'Cobrado', width: 28, align: 'right' },
]

const SALE_COLUMNS: Column[] = [
  { title: '#', width: 10, align: 'right' },
  { title: 'Hora', width: 16 },
  { title: 'Nota', width: CONTENT_WIDTH - 78 },
  { title: 'Kg', width: 24, align: 'right' },
  { title: 'Cobrado', width: 28, align: 'right' },
]

const STORE_COLUMNS: Column[] = [
  { title: 'Tienda', width: CONTENT_WIDTH - 100 },
  { title: 'Dejó kg', width: 25, align: 'right' },
  { title: 'Recogió kg', width: 25, align: 'right' },
  { title: 'Sin recoger kg', width: 25, align: 'right' },
  { title: 'Cobrado', width: 25, align: 'right' },
]

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function movementText(m: ReportMovement, loadKg: number): string {
  if (m.type === 'departure') return `Sale a ruta con ${formatKgNumber(loadKg)} kg`
  if (m.type === 'close') return 'Cierra la ruta'
  return m.notes
    ? `${m.stopName}
Nota: ${m.notes}`
    : m.stopName
}

function kgCell(kg: number): Cell {
  return { text: formatKgNumber(kg), color: kg < 0 ? DANGER : undefined }
}

class Writer {
  y = PAGE.margin
  section: string | null = null

  constructor(private doc: jsPDF) {}

  ensure(height: number) {
    if (this.y + height <= PAGE.height - PAGE.margin - 8) return false
    this.doc.addPage()
    this.y = PAGE.margin
    return true
  }

  text(text: string, size: number, style: 'normal' | 'bold' = 'normal', color = INK) {
    this.doc.setFont('helvetica', style)
    this.doc.setFontSize(size)
    this.doc.setTextColor(...color)
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[]
    this.ensure(lines.length * size * 0.45)
    this.doc.text(lines, PAGE.margin, this.y, { baseline: 'top' })
    this.y += lines.length * size * 0.45
  }

  row(columns: Column[], cells: Cell[], options: { header?: boolean; bold?: boolean } = {}) {
    const doc = this.doc
    const setFont = () => {
      doc.setFont('helvetica', options.header || options.bold ? 'bold' : 'normal')
      doc.setFontSize(options.header ? 8.5 : 9.5)
    }
    setFont()

    const wrapped = cells.map(
      (cell, i) => doc.splitTextToSize(cell.text, columns[i]!.width - 3) as string[],
    )
    const height = Math.max(...wrapped.map((lines) => lines.length)) * LINE + ROW_PAD * 2
    if (this.ensure(height) && !options.header) {
      if (this.section) {
        this.text(`${this.section} (continúa)`, 9.5, 'bold', MUTED)
        this.y += 2
      }
      this.header(columns)
      setFont()
    }

    if (options.header) {
      doc.setFillColor(...HEADER_FILL)
      doc.rect(PAGE.margin, this.y, CONTENT_WIDTH, height, 'F')
    }

    let x = PAGE.margin
    wrapped.forEach((lines, i) => {
      const column = columns[i]!
      doc.setTextColor(...(options.header ? MUTED : (cells[i]!.color ?? INK)))
      const right = column.align === 'right'
      doc.text(lines, right ? x + column.width - 1.5 : x + 1.5, this.y + ROW_PAD, {
        baseline: 'top',
        align: right ? 'right' : 'left',
        lineHeightFactor: 1.25,
      })
      x += column.width
    })

    this.y += height
    doc.setDrawColor(...(options.bold ? INK : RULE))
    doc.setLineWidth(options.bold ? 0.4 : 0.2)
    doc.line(PAGE.margin, this.y, PAGE.margin + CONTENT_WIDTH, this.y)
  }

  header(columns: Column[]) {
    this.row(
      columns,
      columns.map((c) => ({ text: c.title })),
      { header: true },
    )
  }
}

export async function reportToPdf(report: DayReport, generatedAt = new Date()): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  doc.setProperties({ title: `Reporte de reparto ${report.date}` })
  const w = new Writer(doc)

  w.text('Reporte de reparto', 18, 'bold')
  w.y += 1.5
  w.text(capitalize(formatLongDate(report.date)), 12)
  w.y += 1
  w.text(`Generado a las ${colimaTime(generatedAt)} (hora de Colima)`, 8.5, 'normal', MUTED)
  if (report.openRoutes > 0) {
    w.y += 2
    const n = report.openRoutes
    w.text(
      `${n === 1 ? 'Hay 1 ruta abierta' : `Hay ${n} rutas abiertas`}: sus cifras todavía pueden cambiar.`,
      9.5,
      'bold',
      DANGER,
    )
  }

  w.y += 6
  w.text('Resumen', 12, 'bold')
  w.section = 'Resumen'
  w.y += 2
  w.header(SUMMARY_COLUMNS)
  for (const r of report.routes) {
    w.row(SUMMARY_COLUMNS, [
      { text: r.driverName },
      { text: r.departedAt ? colimaTime(r.departedAt) : '—' },
      kgCell(r.initialKg),
      kgCell(r.deliveredKg),
      kgCell(r.remainingKg),
      kgCell(r.pickedKg),
      { text: String(r.stops.length) },
      { text: formatMoney(r.receivedAmount) },
      { text: r.closedAt ? `Cerrada ${colimaTime(r.closedAt)}` : 'Abierta' },
    ])
  }
  w.row(
    SUMMARY_COLUMNS,
    [
      { text: 'Total' },
      { text: '' },
      kgCell(report.totals.initialKg),
      kgCell(report.totals.deliveredKg),
      kgCell(report.totals.remainingKg),
      kgCell(report.totals.pickedKg),
      { text: String(report.totals.stops) },
      { text: formatMoney(report.totals.receivedAmount) },
      { text: '' },
    ],
    { bold: true },
  )

  for (const r of report.routes) {
    w.y += 8
    w.ensure(30)
    w.text(r.driverName, 12, 'bold')
    w.section = r.driverName
    w.y += 1
    w.text(
      `${r.departedAt ? `Salió a las ${colimaTime(r.departedAt)} con` : 'Cargó (sin salida registrada)'} ${formatKgNumber(r.initialKg)} kg · entregó ${formatKgNumber(r.deliveredKg)} kg · regresa ${formatKgNumber(r.remainingKg)} kg · recogió ${formatKgNumber(r.pickedKg)} kg · cobró ${formatMoney(r.receivedAmount)}`,
      9.5,
      'normal',
      r.remainingKg < 0 ? DANGER : MUTED,
    )
    w.y += 2
    if (r.stops.length === 0) {
      w.text('Sin paradas registradas.', 9.5, 'normal', MUTED)
    }
    if (r.movements.length > 0) {
      w.header(MOVEMENT_COLUMNS)
      for (const m of r.movements) {
        w.row(MOVEMENT_COLUMNS, [
          { text: m.number === null ? '' : String(m.number) },
          { text: m.time },
          { text: MOVEMENT_LABEL[m.type] },
          { text: movementText(m, r.initialKg) },
          m.kg === null ? { text: '' } : kgCell(m.kg),
          { text: m.type === 'pickup' ? formatMoney(m.amount ?? 0) : '' },
        ])
      }
    }
    if (r.stores.length > 0) {
      w.y += 5
      w.ensure(20)
      w.text('Por tienda', 10, 'bold')
      w.section = `${r.driverName} · por tienda`
      w.y += 1
      w.header(STORE_COLUMNS)
      for (const s of r.stores) {
        w.row(STORE_COLUMNS, [
          { text: s.name },
          kgCell(s.deliveredKg),
          kgCell(s.pickedKg),
          kgCell(roundKg(s.deliveredKg - s.pickedKg)),
          { text: formatMoney(s.amount) },
        ])
      }
    }
  }

  w.y += 8
  w.ensure(30)
  w.text('Ventas de mostrador', 12, 'bold')
  w.section = 'Ventas de mostrador'
  w.y += 2
  if (report.sales.length === 0) {
    w.text('Sin ventas registradas.', 9.5, 'normal', MUTED)
  } else {
    w.header(SALE_COLUMNS)
    for (const s of report.sales) {
      w.row(SALE_COLUMNS, [
        { text: String(s.number) },
        { text: s.time },
        { text: s.notes || '—', color: s.notes ? undefined : MUTED },
        kgCell(s.kg),
        { text: formatMoney(s.amount) },
      ])
    }
    w.row(
      SALE_COLUMNS,
      [
        { text: '' },
        { text: '' },
        {
          text: `Total · ${report.salesTotals.count} ${report.salesTotals.count === 1 ? 'venta' : 'ventas'}`,
        },
        kgCell(report.salesTotals.kg),
        { text: formatMoney(report.salesTotals.amount) },
      ],
      { bold: true },
    )
  }

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`Reparto de Tortillas · ${report.date}`, PAGE.margin, PAGE.height - 10)
    doc.text(`Página ${page} de ${pages}`, PAGE.width - PAGE.margin, PAGE.height - 10, {
      align: 'right',
    })
  }

  return doc.output('blob')
}
