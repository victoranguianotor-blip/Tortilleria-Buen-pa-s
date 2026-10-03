import { sumKg } from './kg'
import { sumMoney } from './money'

export interface SaleLike {
  kg: number
  amount: number
}

export interface SalesTotals {
  count: number
  kg: number
  amount: number
}

export function sumSales(sales: SaleLike[]): SalesTotals {
  return {
    count: sales.length,
    kg: sumKg(sales.map((s) => s.kg)),
    amount: sumMoney(sales.map((s) => s.amount)),
  }
}
