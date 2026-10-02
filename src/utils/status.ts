export interface RouteStatus {
  text: string
  tone: 'go' | 'danger' | 'idle'
}

export function routeStatus(
  route: { closed_at: string | null } | null,
  remainingKg: number,
): RouteStatus {
  if (!route) return { text: 'Sin iniciar', tone: 'idle' }
  if (route.closed_at) return { text: 'Cerrada', tone: 'idle' }
  if (remainingKg < 0) return { text: 'Sobre-entrega', tone: 'danger' }
  return { text: 'En ruta', tone: 'go' }
}
