import { onBeforeUnmount, ref } from 'vue'

import { horaColima } from '@/utils/fecha'

/** Hora de Colima (HH:MM) que se actualiza sola. */
export function useReloj() {
  const hora = ref(horaColima(new Date()))
  const id = setInterval(() => (hora.value = horaColima(new Date())), 10_000)
  onBeforeUnmount(() => clearInterval(id))
  return hora
}
