import { onBeforeUnmount, ref } from 'vue'

import { colimaTime } from '@/utils/date'

export function useClock() {
  const time = ref(colimaTime(new Date()))
  const id = setInterval(() => (time.value = colimaTime(new Date())), 10_000)
  onBeforeUnmount(() => clearInterval(id))
  return time
}
