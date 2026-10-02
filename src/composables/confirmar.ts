import { onBeforeUnmount, ref } from 'vue'

/**
 * Confirmación de dos toques sin modal: el primer toque arma la acción por unos segundos,
 * el segundo la ejecuta.
 */
export function useConfirmar(ms = 4000) {
  const armado = ref(false)
  let id: ReturnType<typeof setTimeout> | undefined

  function tocar(accion: () => void) {
    if (armado.value) {
      desarmar()
      accion()
      return
    }
    armado.value = true
    id = setTimeout(desarmar, ms)
  }

  function desarmar() {
    armado.value = false
    clearTimeout(id)
  }

  onBeforeUnmount(desarmar)
  return { armado, tocar, desarmar }
}
