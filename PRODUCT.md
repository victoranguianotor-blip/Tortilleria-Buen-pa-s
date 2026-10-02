# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Repartidor** (usuario principal): reparte tortilla en ruta. Al salir registra con cuántos kg
  carga; en cada parada registra cuántos kg dejó. Son pocos, con perfil tecnológico mixto (algunos
  con poca práctica en apps), así que la app debe entenderse sin capacitación.
- **Admin**: dueño o encargado. Consulta el resumen diario de todos los repartidores, da de alta
  usuarios y genera el reporte del día (PDF y CSV).

## Product Purpose

Reemplazar el control a mano de los kilos de tortilla que salen a ruta y se entregan. Éxito: al
final del día el admin sabe, por repartidor, cuánto salió, cuánto se entregó en cada parada y
cuánto regresa, sin llamadas ni papeles.

## Operating Context

- PWA instalada en tablets Android.
- El repartidor usa la tablet **montada en el vehículo**, capturando en las pausas entre paradas,
  a menudo **bajo sol directo**: la lectura al aire libre y los toques rápidos y certeros importan
  más que la densidad de información.
- Un día de trabajo = una ruta por repartidor. Fecha de negocio según hora de Colima.
- Las paradas son texto libre (nombre de la tienda o cliente); no hay catálogo de clientes por
  ahora.

## Capabilities and Constraints

- Login con usuario y contraseña (sin registro público; el admin crea las cuentas).
- Repartidor: iniciar la ruta del día con kg iniciales, registrar entregas (parada + kg),
  editar o borrar sus entregas mientras la ruta esté abierta, cerrar la ruta. Solo ve lo suyo.
- Entregar más kg de los que quedan se **advierte, no se bloquea**.
- Admin: dashboard por fecha, alta/baja de usuarios, reabrir rutas cerradas, reporte diario con
  detalle de entregas.
- Offline (cola en IndexedDB) es una fase posterior; hoy requiere conexión.
- Textos en español de México. Unidades en kilogramos con hasta 2 decimales.

## Brand Commitments

Sin marca por ahora: nombre genérico "Reparto de Tortillas", sin logo ni colores obligados.

## Evidence on Hand

No hay datos reales, clientes ni métricas todavía. Las cuentas `prueba_*` son de prueba.

## Product Principles

1. **El número manda.** Los kg restantes deben leerse de un vistazo desde el asiento del
   vehículo.
2. **Capturar una entrega toma segundos.** Pocos toques, objetivos grandes, nada de menús
   escondidos.
3. **Errores corregibles, no bloqueados.** Mejor dejar editar y advertir que impedir.
4. **Cero ambigüedad para quien no es técnico.** Palabras del oficio (ruta, parada, kilos), un
   solo camino evidente por pantalla.

## Accessibility & Inclusion

Legibilidad a pleno sol (alto contraste, cifras grandes) y objetivos táctiles amplios para uso
con la tablet fija en un soporte.
