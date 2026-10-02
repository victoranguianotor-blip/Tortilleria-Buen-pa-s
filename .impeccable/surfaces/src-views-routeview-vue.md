---
version: 1
slug: "src-views-routeview-vue"
primary_target: "src/views/RouteView.vue"
related_targets: ["src/views/LoginView.vue","src/views/AdminView.vue","src/views/UsersView.vue"]
---

# Superficie: toda la app (login, ruta del repartidor, rutas y usuarios del encargado)

Modo: Operate. Usuarios: repartidor con tablet montada en el vehículo, a menudo bajo sol directo,
perfil tecnológico mixto; encargado en tablet o celular. Tareas: iniciar ruta, registrar paradas
(texto + kg en enteros y medios), corregir, cerrar; el encargado consulta el día, reabre rutas,
gestiona usuarios y descarga el reporte. Restricciones del usuario (rediseño de 2026-10-01): fondo
oscuro con más contraste, plano, sin celdas de paleta ni volteo, letra normal en oración, tamaños
más contenidos, la distribución actual se conserva, todo responsivo.

## Direction contract

THESIS: La app se lee como un señalamiento vial: lámina plana, letra blanca de carretera y un solo
amarillo preventivo, hecha para leerse a distancia con sol. Rechaza las tarjetas grises con acento
azul y cualquier relieve, brillo o animación decorativa.

OWN-WORLD: Asfalto #101214 de fondo, lámina #1A1D21 para paneles, #24282D para campos y teclas,
costuras de 1px #343A41. Letra blanca #FFFFFF y gris claro #C4CBD3 / #9AA3AD, nunca gris medio.
Amarillo de señal #FFD000 solo para la acción principal, foco y advertencia; verde informativo para
"en ruta"; rojo #FF5A4A para sobre-entrega y borrar. Overpass (heredera de Highway Gothic), cifras
tabulares, oración normal. Esquinas de 6px, sin sombras.

STORY: El repartidor ve cuánto le queda, teclea la parada con un teclado plano grande y ve el
renglón aparecer y el restante cambiar. El encargado ve todos los repartidores en un tablero de
renglones y entra al detalle con un toque.

FIRST VIEWPORT: Banda superior delgada (fecha, hora, nombre, salir). Izquierda: panel con "Quedan"
y la cifra blanca grande (máx. 4.5rem), fila Salió / Entregado / Paradas, lista de paradas con
costuras de 1px. Derecha: panel de captura con campo, lectura de kg, teclado 3×4 y "Registrar
parada" en amarillo a todo lo ancho.

FORM: Señalamiento vial (dirección asignada por el sorteo, candidata 4 de la lista propia, elegida
por el usuario). Raises: costuras de 1px y destructivas apartadas (consola), paleta sin medias
tintas (Ikeda), escala corta con jerarquía por peso (horario). Interacción firma: el restante y el
renglón nuevo se iluminan en amarillo un instante y se apagan (sin movimiento con reduced motion).
Seed 98bfed7e.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
