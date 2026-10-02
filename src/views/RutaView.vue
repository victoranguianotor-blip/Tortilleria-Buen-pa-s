<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import BarraSuperior from '@/components/BarraSuperior.vue'
import FlapText from '@/components/FlapText.vue'
import IconoTrazo from '@/components/IconoTrazo.vue'
import PanelCarga from '@/components/PanelCarga.vue'
import PanelEntrega from '@/components/PanelEntrega.vue'
import TableroParadas from '@/components/TableroParadas.vue'
import { useConfirmar } from '@/composables/confirmar'
import type { Entrega } from '@/services/rutas'
import { useAuthStore } from '@/stores/auth'
import { useRutaStore } from '@/stores/ruta'
import { horaColima } from '@/utils/fecha'
import { formatearKg, redondearKg } from '@/utils/kg'
import { mensajeDeError } from '@/utils/errores'

const auth = useAuthStore()
const ruta = useRutaStore()
const router = useRouter()

const estado = ref<'cargando' | 'listo' | 'fallo'>('cargando')
const ocupado = ref(false)
const error = ref<string | null>(null)
const seleccionada = ref<Entrega | null>(null)
const corrigiendoCarga = ref(false)
const nuevaId = ref<string | null>(null)
const panelEntrega = ref<InstanceType<typeof PanelEntrega> | null>(null)
const cierre = useConfirmar()

const kgTexto = (kg: number) => formatearKg(kg).replace(' kg', '')
const abierta = computed(() => ruta.ruta !== null && !ruta.cerrada)
const sobreEntrega = computed(() => ruta.kgQuedan < 0)

const lampara = computed(() => {
  if (!ruta.ruta) return { texto: 'Sin iniciar', tono: 'acero' as const }
  if (ruta.cerrada) return { texto: 'Cerrada', tono: 'acero' as const }
  if (sobreEntrega.value) return { texto: 'Sobre-entrega', tono: 'rojo' as const }
  return { texto: 'En ruta', tono: 'ambar' as const }
})

const numeroParada = computed(() => {
  if (!seleccionada.value) return ruta.entregas.length + 1
  return ruta.entregas.findIndex((e) => e.id === seleccionada.value?.id) + 1
})

// Al corregir una parada, sus kilos vuelven a estar "disponibles" para el cálculo.
const kgDisponibles = computed(() =>
  redondearKg(ruta.kgQuedan + (seleccionada.value?.kg_dejados ?? 0)),
)

async function cargar() {
  estado.value = 'cargando'
  try {
    await ruta.cargar(auth.perfil!.id)
    estado.value = 'listo'
  } catch {
    estado.value = 'fallo'
  }
}

async function ejecutar(accion: () => Promise<unknown>) {
  ocupado.value = true
  error.value = null
  try {
    await accion()
    return true
  } catch (e) {
    error.value = mensajeDeError(e)
    return false
  } finally {
    ocupado.value = false
  }
}

async function iniciar(kg: number) {
  await ejecutar(() => ruta.iniciar(kg))
}

async function guardarCarga(kg: number) {
  if (await ejecutar(() => ruta.corregirCarga(kg))) corrigiendoCarga.value = false
}

async function guardarEntrega(parada: string, kg: number) {
  const editando = seleccionada.value
  const ok = await ejecutar(async () => {
    if (editando) {
      await ruta.editar(editando.id, parada, kg)
      nuevaId.value = null
    } else {
      nuevaId.value = (await ruta.registrar(parada, kg)).id
    }
  })
  if (!ok) return
  seleccionada.value = null
  panelEntrega.value?.limpiar()
}

async function borrarEntrega() {
  const id = seleccionada.value?.id
  if (id && (await ejecutar(() => ruta.borrar(id)))) seleccionada.value = null
}

function elegir(e: Entrega) {
  error.value = null
  corrigiendoCarga.value = false
  seleccionada.value = seleccionada.value?.id === e.id ? null : e
}

function cancelarEdicion() {
  error.value = null
  seleccionada.value = null
  corrigiendoCarga.value = false
}

function abrirCorreccionCarga() {
  if (!abierta.value) return
  error.value = null
  seleccionada.value = null
  corrigiendoCarga.value = true
}

function cerrarRuta() {
  cierre.tocar(() => ejecutar(() => ruta.cerrar()))
}

async function salir() {
  await auth.salir()
  ruta.limpiar()
  router.replace({ name: 'login' })
}

onMounted(cargar)
</script>

<template>
  <div class="relative flex h-dvh flex-col overflow-hidden">
    <BarraSuperior :fecha="ruta.hoy" :nombre="auth.perfil?.nombre ?? ''" @salir="salir" />

    <div v-if="estado !== 'listo'" class="grid flex-1 place-items-center p-6">
      <div class="flex flex-col items-center gap-6 text-center">
        <FlapText
          :texto="estado === 'cargando' ? 'Cargando' : 'Sin conexión'"
          tamano="lg"
          :tono="estado === 'cargando' ? 'acero' : 'rojo'"
          animar
        />
        <template v-if="estado === 'fallo'">
          <p class="max-w-md text-xl text-acero">
            No se pudo traer tu ruta. Revisa la señal e inténtalo otra vez.
          </p>
          <button type="button" class="boton-ambar" @click="cargar">Reintentar</button>
        </template>
      </div>
    </div>

    <main
      v-else
      class="relative min-h-0 flex-1 overflow-y-auto p-3 horizontal:grid horizontal:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] horizontal:gap-4 horizontal:overflow-hidden horizontal:p-4 vertical-alto:flex vertical-alto:flex-col vertical-alto:overflow-hidden"
    >
      <!-- Tablero: lo que queda, la carga y las paradas -->
      <section
        class="marco flex min-h-0 flex-col rounded-lg vertical-alto:flex-1"
        aria-label="Tablero de la ruta"
      >
        <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 pb-3">
          <div class="flex flex-col gap-2">
            <h1 class="rotulo">Quedan</h1>
            <div class="flex items-end gap-3">
              <FlapText
                :texto="ruta.ruta ? kgTexto(ruta.kgQuedan) : '--'"
                :celdas="5"
                alinear="der"
                tamano="xl"
                :tono="sobreEntrega ? 'rojo' : 'tinta'"
              />
              <span class="rotulo pb-3 text-base!">kg</span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <p class="lampara" :class="`lampara-${lampara.tono}`" role="status">
              <span class="foco" aria-hidden="true" />
              <FlapText :texto="lampara.texto" tamano="sm" :tono="lampara.tono" />
            </p>
            <button
              v-if="abierta"
              type="button"
              class="boton-acero min-h-12! px-3!"
              :class="{ peligro: cierre.armado.value }"
              :disabled="ocupado"
              @click="cerrarRuta"
            >
              {{ cierre.armado.value ? '¿Cerrar? Toca otra vez' : 'Cerrar ruta' }}
            </button>
          </div>
        </div>

        <div class="cifras">
          <button
            type="button"
            class="cifra text-left"
            :disabled="!abierta"
            :class="{ activa: corrigiendoCarga }"
            :aria-label="`Salió con ${ruta.ruta ? kgTexto(ruta.ruta.kg_iniciales) : 0} kilos${abierta ? '. Tocar para corregir' : ''}`"
            @click="abrirCorreccionCarga"
          >
            <span class="rotulo flex items-center gap-1.5">
              Salió
              <IconoTrazo v-if="abierta" nombre="lapiz" class="text-acero-2" />
            </span>
            <span>
              <FlapText
                :texto="ruta.ruta ? kgTexto(ruta.ruta.kg_iniciales) : '--'"
                :celdas="5"
                alinear="der"
                tamano="md"
                :tono="corrigiendoCarga ? 'ambar' : 'tinta'"
              />
            </span>
          </button>
          <div class="cifra">
            <span class="rotulo">Entregado</span>
            <span>
              <FlapText :texto="kgTexto(ruta.kgEntregados)" :celdas="5" alinear="der" tamano="md" />
            </span>
          </div>
          <div class="cifra">
            <span class="rotulo">Paradas</span>
            <span>
              <FlapText
                :texto="String(ruta.entregas.length)"
                :celdas="2"
                alinear="der"
                tamano="md"
              />
            </span>
          </div>
        </div>

        <TableroParadas
          class="min-h-64 flex-1 horizontal:min-h-0 vertical-alto:min-h-0"
          :entregas="ruta.entregas"
          :seleccionada-id="seleccionada?.id ?? null"
          :nueva-id="nuevaId"
          :editable="abierta"
          @elegir="elegir"
        />
      </section>

      <!-- Panel de captura -->
      <section
        class="marco mt-3 shrink-0 rounded-lg p-4 horizontal:mt-0 horizontal:min-h-0 horizontal:overflow-y-auto"
        aria-label="Captura"
      >
        <PanelCarga
          v-if="!ruta.ruta"
          modo="iniciar"
          :ocupado="ocupado"
          :error="error"
          @confirmar="iniciar"
        />

        <div v-else-if="ruta.cerrada" class="flex flex-col gap-5">
          <h2><FlapText texto="Ruta cerrada" tamano="md" tono="acero" /></h2>
          <dl class="cierre">
            <div>
              <dt class="rotulo">Cerró</dt>
              <dd><FlapText :texto="horaColima(ruta.ruta.cerrada_at!)" tamano="lg" /></dd>
            </div>
            <div>
              <dt class="rotulo">Salió</dt>
              <dd>
                <FlapText
                  :texto="kgTexto(ruta.ruta.kg_iniciales)"
                  :celdas="5"
                  alinear="der"
                  tamano="lg"
                />
              </dd>
            </div>
            <div>
              <dt class="rotulo">Entregó</dt>
              <dd>
                <FlapText
                  :texto="kgTexto(ruta.kgEntregados)"
                  :celdas="5"
                  alinear="der"
                  tamano="lg"
                />
              </dd>
            </div>
            <div>
              <dt class="rotulo">Regresa</dt>
              <dd>
                <FlapText
                  :texto="kgTexto(ruta.kgQuedan)"
                  :celdas="5"
                  alinear="der"
                  tamano="lg"
                  :tono="sobreEntrega ? 'rojo' : 'tinta'"
                />
              </dd>
            </div>
          </dl>
          <p class="text-lg tracking-[0.1em] text-acero uppercase">
            ¿Te equivocaste? Pide al encargado que la reabra.
          </p>
        </div>

        <PanelCarga
          v-else-if="corrigiendoCarga"
          modo="corregir"
          :kg-actual="ruta.ruta.kg_iniciales"
          :ocupado="ocupado"
          :error="error"
          @confirmar="guardarCarga"
          @cancelar="cancelarEdicion"
        />

        <PanelEntrega
          v-else
          ref="panelEntrega"
          :entrega="seleccionada"
          :numero="numeroParada"
          :kg-disponibles="kgDisponibles"
          :paradas="ruta.paradasRecientes"
          :ocupado="ocupado"
          :error="error"
          @guardar="guardarEntrega"
          @borrar="borrarEntrega"
          @cancelar="cancelarEdicion"
        />
      </section>
      <p class="sr-only" aria-live="polite">
        <template v-if="ruta.ruta">Quedan {{ formatearKg(ruta.kgQuedan) }}</template>
      </p>
    </main>
  </div>
</template>

<style scoped>
.lampara {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  background: #000;
}

/* Foco de la lámpara: encendido en ruta, rojo en sobre-entrega, apagado al cerrar. */
.foco {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--color-acero-3);
}
.lampara-ambar .foco {
  background: var(--color-ambar);
  box-shadow: 0 0 10px 1px rgb(255 180 0 / 0.6);
}
.lampara-rojo .foco {
  background: var(--color-rojo);
  box-shadow: 0 0 10px 1px rgb(255 77 77 / 0.6);
}

.cierre {
  display: grid;
  gap: 0.9rem;
}
.cierre > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--color-acero-3);
}
.lampara-ambar {
  box-shadow: 0 0 0 1px var(--color-ambar-oscuro);
}
.lampara-rojo {
  box-shadow: 0 0 0 1px var(--color-rojo-oscuro);
}

.cifras {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid var(--color-acero-3);
}

.cifra {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem clamp(0.6rem, 1.5vw, 1rem);
}
.cifra + .cifra {
  border-left: 1px solid var(--color-acero-3);
}
button.cifra:not(:disabled):active,
button.cifra.activa {
  background: var(--color-ambar-oscuro);
}
</style>
