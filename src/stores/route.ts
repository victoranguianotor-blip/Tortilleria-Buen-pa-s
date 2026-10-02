import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import * as routes from '@/services/routes'
import type { Delivery, Route, StopInput } from '@/services/routes'
import { fetchPricePerKg } from '@/services/settings'
import { remainingKg as computeRemainingKg, sumKg } from '@/utils/kg'
import { sumMoney } from '@/utils/money'

export const useRouteStore = defineStore('route', () => {
  const today = ref<string | null>(null)
  const route = ref<Route | null>(null)
  const deliveries = ref<Delivery[]>([])
  const recentStops = ref<string[]>([])
  const pricePerKg = ref<number | null>(null)

  const deliveredOnly = computed(() => deliveries.value.filter((d) => d.kind === 'delivery'))
  const deliveredKg = computed(() => sumKg(deliveredOnly.value.map((d) => d.kg)))
  const pickedKg = computed(() =>
    sumKg(deliveries.value.filter((d) => d.kind === 'pickup').map((d) => d.kg)),
  )
  const receivedAmount = computed(() => sumMoney(deliveries.value.map((d) => d.received_amount)))
  const remainingKg = computed(() =>
    route.value
      ? computeRemainingKg(
          route.value.initial_kg,
          deliveredOnly.value.map((d) => d.kg),
        )
      : 0,
  )
  const isClosed = computed(() => route.value?.closed_at != null)
  const hasDeparted = computed(() => route.value?.departed_at != null)

  async function load(driverId: string) {
    today.value = await routes.businessToday()
    route.value = await routes.fetchRoute(driverId, today.value)
    deliveries.value = route.value ? await routes.fetchDeliveries(route.value.id) : []
    recentStops.value = await routes.fetchRecentStops().catch(() => [])
    pricePerKg.value = await fetchPricePerKg().catch(() => null)
  }

  async function start(initialKg: number) {
    route.value = await routes.startRoute(initialKg)
    deliveries.value = []
  }

  async function updateInitialKg(initialKg: number) {
    if (!route.value) return
    route.value = await routes.updateInitialKg(route.value.id, initialKg)
  }

  async function depart() {
    if (!route.value) return
    route.value = await routes.departRoute(route.value.id)
    pricePerKg.value = await fetchPricePerKg().catch(() => pricePerKg.value)
  }

  async function addDelivery(input: StopInput): Promise<Delivery> {
    if (!route.value) throw new Error('No route')
    const delivery = await routes.createDelivery(route.value.id, input)
    deliveries.value = [...deliveries.value, delivery]
    rememberStop(input.stopName)
    return delivery
  }

  async function updateDelivery(id: string, input: StopInput) {
    const updated = await routes.updateDelivery(id, input)
    deliveries.value = deliveries.value.map((d) => (d.id === id ? updated : d))
    rememberStop(input.stopName)
  }

  async function removeDelivery(id: string) {
    await routes.deleteDelivery(id)
    deliveries.value = deliveries.value.filter((d) => d.id !== id)
  }

  async function close() {
    if (!route.value) return
    route.value = await routes.closeRoute(route.value.id)
  }

  function rememberStop(stopName: string) {
    const key = stopName.toLowerCase()
    recentStops.value = [stopName, ...recentStops.value.filter((s) => s.toLowerCase() !== key)]
  }

  function reset() {
    today.value = null
    route.value = null
    deliveries.value = []
    recentStops.value = []
    pricePerKg.value = null
  }

  return {
    today,
    route,
    deliveries,
    recentStops,
    pricePerKg,
    deliveredKg,
    pickedKg,
    receivedAmount,
    remainingKg,
    isClosed,
    hasDeparted,
    load,
    start,
    updateInitialKg,
    depart,
    addDelivery,
    updateDelivery,
    removeDelivery,
    close,
    reset,
  }
})
