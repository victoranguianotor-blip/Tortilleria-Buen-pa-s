---
version: 1
slug: "src-views-routeview-vue"
primary_target: "src/views/RouteView.vue"
related_targets: ["src/views/LoginView.vue"]
---

# Superficie: app del repartidor (login + ruta del día)

Modo: Operate. Usuario: repartidor con tablet montada en el vehículo, a menudo bajo sol directo;
perfil tecnológico mixto. Tarea: iniciar la ruta con kg cargados, registrar cada parada (texto
libre + kg en enteros y medios, menos de 15 al día), corregir o borrar, cerrar la ruta.
Restricciones: orientación variable (horizontal y vertical), sobre-entrega se advierte y no se
bloquea, ruta cerrada o de otro día es de solo lectura. El admin ve aquí solo un aviso provisional.

## Direction contract

THESIS: La ruta del día es un tablero de salidas: un marco de acero con paletas negras donde cada
parada es un renglón y los kilos que quedan se voltean en celdas fijas. Rechaza la app de captura
típica (tarjetas blancas, formulario genérico, botón azul).

OWN-WORLD: Negro de paleta (#0D0D0F) con sombra de paleta (#1B1B1E), letra blanca de paleta
(#F2F2F2), ámbar de lámpara (#FFB400) solo para estado activo, advertencia y acción principal,
rojo de cancelado (#D32F2F) solo para sobre-entrega y borrar, acero (#B6BBC2 / #7D838C) para
marcos y etiquetas. Una sola sans condensada en mayúsculas con espaciado amplio; cada carácter
importante vive en una celda con su línea de corte horizontal. Renglones con regla, columnas fijas.

STORY: El repartidor ve de un vistazo cuánto le queda, toca para capturar la parada con un teclado
de báscula grande, y ve el renglón nuevo caer en el tablero mientras el restante se voltea.

FIRST VIEWPORT: Franja de acero arriba (fecha y reloj en paletas, nombre, salir). Izquierda (o
arriba en vertical): tablero QUEDAN con los kg en celdas gigantes, debajo SALIÓ / ENTREGADO /
PARADAS en celdas medianas, y el tablero de paradas (HORA, PARADA, KG). Derecha (o abajo): panel de
captura con campo PARADA, display de kg en celdas, teclado 0–9 + ½ + borrar, y REGISTRAR ámbar.

FORM: Tablero de salidas de terminal (challenger competitivo elegido por el usuario sobre la
asignada, candidata 3 de la lista propia). Interacción firma: cascada de volteo carácter por
carácter al cambiar cifras y al entrar un renglón; instantáneo con reduced motion. Seed 71187f1a.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
