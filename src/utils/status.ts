export interface RouteStatus {
  text: string
  tone: 'amber' | 'danger' | 'steel'
}

export function routeStatus(
  route: { closed_at: string | null } | null,
  remainingKg: number,
): RouteStatus {
  if (!route) return { text: 'Sin iniciar', tone: 'steel' }
  if (route.closed_at) return { text: 'Cerrada', tone: 'steel' }
  if (remainingKg < 0) return { text: 'Sobre-entrega', tone: 'danger' }
  return { text: 'En ruta', tone: 'amber' }
}
