import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import * as rutas from '@/services/rutas'
import type { Entrega, Ruta } from '@/services/rutas'
import { kgRestantes, sumarKg } from '@/utils/kg'

export const useRutaStore = defineStore('ruta', () => {
  const hoy = ref<string | null>(null)
  const ruta = ref<Ruta | null>(null)
  const entregas = ref<Entrega[]>([])
  const paradasRecientes = ref<string[]>([])

  const kgEntregados = computed(() => sumarKg(entregas.value.map((e) => e.kg_dejados)))
  const kgQuedan = computed(() =>
    ruta.value
      ? kgRestantes(
          ruta.value.kg_iniciales,
          entregas.value.map((e) => e.kg_dejados),
        )
      : 0,
  )
  const cerrada = computed(() => ruta.value?.cerrada_at != null)

  async function cargar(repartidorId: string) {
    hoy.value = await rutas.hoyColima()
    ruta.value = await rutas.rutaDelDia(repartidorId, hoy.value)
    entregas.value = ruta.value ? await rutas.entregasDeRuta(ruta.value.id) : []
    // El autocompletado es una ayuda: si falla, la pantalla sigue funcionando.
    paradasRecientes.value = await rutas.paradasRecientes().catch(() => [])
  }

  async function iniciar(kg: number) {
    ruta.value = await rutas.iniciarRuta(kg)
    entregas.value = []
  }

  async function corregirCarga(kg: number) {
    if (!ruta.value) return
    ruta.value = await rutas.corregirCarga(ruta.value.id, kg)
  }

  async function registrar(parada: string, kg: number): Promise<Entrega> {
    if (!ruta.value) throw new Error('Sin ruta')
    const entrega = await rutas.registrarEntrega(ruta.value.id, parada, kg)
    entregas.value = [...entregas.value, entrega]
    recordarParada(parada)
    return entrega
  }

  async function editar(id: string, parada: string, kg: number) {
    const actualizada = await rutas.editarEntrega(id, parada, kg)
    entregas.value = entregas.value.map((e) => (e.id === id ? actualizada : e))
    recordarParada(parada)
  }

  async function borrar(id: string) {
    await rutas.borrarEntrega(id)
    entregas.value = entregas.value.filter((e) => e.id !== id)
  }

  async function cerrar() {
    if (!ruta.value) return
    ruta.value = await rutas.cerrarRuta(ruta.value.id)
  }

  function recordarParada(parada: string) {
    const clave = parada.toLowerCase()
    paradasRecientes.value = [
      parada,
      ...paradasRecientes.value.filter((p) => p.toLowerCase() !== clave),
    ]
  }

  function limpiar() {
    hoy.value = null
    ruta.value = null
    entregas.value = []
    paradasRecientes.value = []
  }

  return {
    hoy,
    ruta,
    entregas,
    paradasRecientes,
    kgEntregados,
    kgQuedan,
    cerrada,
    cargar,
    iniciar,
    corregirCarga,
    registrar,
    editar,
    borrar,
    cerrar,
    limpiar,
  }
})
