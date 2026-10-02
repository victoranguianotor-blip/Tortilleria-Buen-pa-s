import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import * as routes from '@/services/routes'
import type { Delivery, Route } from '@/services/routes'
import { remainingKg as computeRemainingKg, sumKg } from '@/utils/kg'

export const useRouteStore = defineStore('route', () => {
  const today = ref<string | null>(null)
  const route = ref<Route | null>(null)
  const deliveries = ref<Delivery[]>([])
  const recentStops = ref<string[]>([])

  const deliveredKg = computed(() => sumKg(deliveries.value.map((d) => d.delivered_kg)))
  const remainingKg = computed(() =>
    route.value
      ? computeRemainingKg(
          route.value.initial_kg,
          deliveries.value.map((d) => d.delivered_kg),
        )
      : 0,
  )
  const isClosed = computed(() => route.value?.closed_at != null)

  async function load(driverId: string) {
    today.value = await routes.businessToday()
    route.value = await routes.fetchRoute(driverId, today.value)
    deliveries.value = route.value ? await routes.fetchDeliveries(route.value.id) : []
    recentStops.value = await routes.fetchRecentStops().catch(() => [])
  }

  async function start(initialKg: number) {
    route.value = await routes.startRoute(initialKg)
    deliveries.value = []
  }

  async function updateInitialKg(initialKg: number) {
    if (!route.value) return
    route.value = await routes.updateInitialKg(route.value.id, initialKg)
  }

  async function addDelivery(stopName: string, kg: number): Promise<Delivery> {
    if (!route.value) throw new Error('No route')
    const delivery = await routes.createDelivery(route.value.id, stopName, kg)
    deliveries.value = [...deliveries.value, delivery]
    rememberStop(stopName)
    return delivery
  }

  async function updateDelivery(id: string, stopName: string, kg: number) {
    const updated = await routes.updateDelivery(id, stopName, kg)
    deliveries.value = deliveries.value.map((d) => (d.id === id ? updated : d))
    rememberStop(stopName)
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
  }

  return {
    today,
    route,
    deliveries,
    recentStops,
    deliveredKg,
    remainingKg,
    isClosed,
    load,
    start,
    updateInitialKg,
    addDelivery,
    updateDelivery,
    removeDelivery,
    close,
    reset,
  }
})
