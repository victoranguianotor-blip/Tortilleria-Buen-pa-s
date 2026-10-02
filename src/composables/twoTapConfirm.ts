import { onBeforeUnmount, ref } from 'vue'

export function useTwoTapConfirm(ms = 4000) {
  const armed = ref(false)
  let id: ReturnType<typeof setTimeout> | undefined

  function tap(action: () => void) {
    if (armed.value) {
      disarm()
      action()
      return
    }
    armed.value = true
    id = setTimeout(disarm, ms)
  }

  function disarm() {
    armed.value = false
    clearTimeout(id)
  }

  onBeforeUnmount(disarm)
  return { armed, tap, disarm }
}
