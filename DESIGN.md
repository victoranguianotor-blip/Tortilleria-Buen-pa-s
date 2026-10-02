---
name: Reparto de Tortillas
description: Señalamiento vial para el repartidor; lámina oscura plana, letra blanca de carretera y un solo amarillo de señal.
colors:
  ground: "#101214"
  panel: "#1a1d21"
  raised: "#24282d"
  line: "#343a41"
  ink: "#ffffff"
  ink-2: "#c4cbd3"
  ink-3: "#9aa3ad"
  signal: "#ffd000"
  signal-ink: "#101214"
  signal-soft: "#332b05"
  go: "#3ddc84"
  danger: "#ff5a4a"
  danger-soft: "#3a1714"
typography:
  display:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 4vw + 1rem, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  figure:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.3
  stop-name:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  button:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1
  button-sm:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
  key:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  label:
    fontFamily: "Overpass, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  control: "6px"
  pill: "999px"
spacing:
  keypad: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  row-x: "0.9rem"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 1.25rem"
    height: "3.5rem"
  button-primary-disabled:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink-3}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "3rem"
  button-secondary-active:
    backgroundColor: "{colors.raised}"
  button-secondary-danger:
    textColor: "{colors.danger}"
  button-secondary-quiet:
    textColor: "{colors.ink-2}"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 0.9rem"
    height: "3.25rem"
  key:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    typography: "{typography.key}"
    rounded: "{rounded.control}"
    height: "clamp(3rem, 7vh, 3.75rem)"
  key-active:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.control}"
  topbar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    height: "3.5rem"
  list-row:
    textColor: "{colors.ink}"
    padding: "0.3rem 0.9rem"
    height: "3.25rem"
  list-row-selected:
    backgroundColor: "{colors.signal-soft}"
  kg-readout:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.control}"
    padding: "0.625rem 1rem"
  status-pill:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 0.7rem"
    height: "2rem"
  status-pill-go:
    textColor: "{colors.go}"
  status-pill-danger:
    textColor: "{colors.danger}"
  alert-error:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.7rem 0.9rem"
---

# Design System: Reparto de Tortillas

## Overview

**Creative North Star: "Señalamiento vial"**

La app se lee como un letrero de carretera: lámina plana oscura, letra blanca de trazo carretero y un solo amarillo preventivo. Está hecha para leerse a distancia y con sol, desde una tablet montada en el vehículo: cifras grandes en peso 800 con dígitos tabulares, pocos colores con un trabajo fijo cada uno, y nada que brille, se levante o se mueva sin motivo.

La estructura es de consola, no de tarjetas: paneles de lámina separados por costuras de 1px, renglones con costura entre ellos y cifras en celdas de una rejilla. La jerarquía sale del peso y del tamaño dentro de una escala corta, no de colores ni de una segunda familia. Todo el texto va en oración normal. Las acciones destructivas quedan apartadas y piden un segundo toque.

Se rechazan las tarjetas grises con acento azul, cualquier relieve, brillo o sombra, y la animación decorativa.

**Key Characteristics:**
- Fondo de asfalto con paneles de lámina un paso más claros y costuras de 1px.
- Una sola familia, Overpass (heredera de Highway Gothic), autoalojada en 400, 600, 700 y 800.
- Cifras en peso 800 con dígitos tabulares; texto siempre en oración normal.
- Amarillo de señal solo para la acción principal, foco, selección y el destello de advertencia.
- Verde informativo para lo que está vivo; rojo para sobre-entrega y lo destructivo.
- Un solo momento de movimiento: el destello amarillo del restante y del renglón nuevo.
- Plano: esquinas de 6px, sin sombras proyectadas.

## Colors

Asfalto, lámina y letra blanca sin medias tintas; un amarillo de señal, un verde informativo y un rojo de alto.

### Primary
- **Amarillo de señal** (signal): la acción principal (Registrar parada, Entrar, Iniciar ruta), el anillo de foco, el cursor, la selección de texto, la tecla presionada, el renglón o la cifra que se está corrigiendo, la opción elegida y la sección actual del menú (subrayado de 2px). También es el destello del restante y del renglón nuevo, y advierte en el resumen del encargado que la fecha vista no es hoy. Sobre amarillo, el texto va en **Asfalto de señal** (signal-ink). Su fondo apagado, **Amarillo apagado** (signal-soft), rellena el renglón seleccionado, la cifra en corrección y la opción elegida, siempre con contorno interior amarillo de 1px.

### Secondary
- **Verde de paso** (go): solo "En ruta", en la píldora de estado y en el punto del tablero de repartidores. Nunca es acción, botón, cuenta activa ni aviso de confirmación (esos van en letra blanca).

### Tertiary
- **Rojo de alto** (danger): sobre-entrega (restante y "Regresa" en negativo, aviso "Se registra igual", píldora "Sobre-entrega"), botones destructivos (Borrar, el segundo toque de Cerrar ruta), campos inválidos y pistas de validación. **Rojo apagado** (danger-soft) es el fondo de la alerta de error, con borde rojo y texto blanco.

### Neutral
- **Asfalto** (ground): fondo de página y la ventanilla de lectura de kg.
- **Lámina** (panel): paneles y banda superior.
- **Lámina alzada** (raised): campos, teclas, botón primario deshabilitado y el fondo de respuesta al tocar.
- **Costura** (line): todos los bordes de 1px: paneles, campos, teclas, renglones, divisiones entre cifras.
- **Blanco carretero** (ink): texto principal y todas las cifras, incluido el reloj.
- **Gris claro** (ink-2): texto secundario: hora de la parada, nombre en la banda, fecha, unidades "kg", avisos neutros, botón discreto, teclas de función.
- **Gris rótulo** (ink-3): rótulos de cifras y columnas, número de renglón, placeholder, pistas, texto deshabilitado.

### Named Rules
**The Una Señal Rule.** El amarillo significa "actúa aquí" o "mira esto ahora": acción principal, foco, selección y advertencia. Nunca decora, nunca colorea un rótulo, un título ni un reloj en reposo.

**The Sin Medias Tintas Rule.** Los textos son blanco, gris claro o gris rótulo; no hay gris medio. Si un texto no alcanza a leerse en gris rótulo, sube a gris claro, no baja.

**The Alto Rule.** El rojo es solo para sobre-entrega y para lo que borra o cierra. La sobre-entrega se advierte, no se bloquea.

## Typography

**Display Font:** Overpass (con system-ui, sans-serif)
**Body Font:** Overpass (misma familia; 400, 600, 700 y 800, autoalojada vía @fontsource)

**Character:** Una sola grotesca de señalamiento. La jerarquía sale del peso (800 para cifras y títulos, 600–700 para texto de interfaz) y de una escala corta. La raíz es de 16px.

### Hierarchy
- **Display** (800, clamp(2.75rem, 4vw + 1rem, 4.5rem), 1, tabular; 3.25rem en tablet de pie): solo la cifra de "Quedan".
- **Headline** (800, 2.25rem, 1, tabular): lectura de kg tecleados. El título del login usa 800 en 1.875–2.25rem con interlínea ajustada.
- **Figure** (800, 1.5rem, 1, tabular): Salió / Entregado / Paradas, cifras del cierre y del detalle del encargado.
- **Title** (800, 1.25rem): título del panel de captura ("Parada 5", "Carga de hoy", nombre del repartidor).
- **Stop name** (600, 1.125rem): nombre de la parada o del repartidor en un renglón; se recorta con puntos suspensivos.
- **Body** (400, 1rem, 1.4): texto corrido y mensajes; avisos en 600.
- **Button** (800, 1.125rem) y **Button sm** (700, 1rem).
- **Key** (700, 1.75rem, tabular): dígitos del teclado; ½ y borrar en 1.5rem gris claro.
- **Label** (600, 0.8125rem, gris rótulo, oración normal): el rótulo que nombra una cifra, un campo o una columna.

### Named Rules
**The Cifra Tabular Rule.** Toda cifra de kg, hora o conteo usa dígitos tabulares; las cifras protagonistas van en peso 800 con -0.01em.

**The Oración Rule.** Todo texto va en oración normal: botones, rótulos, encabezados de columna, estados. Sin mayúsculas sostenidas ni tracking abierto.

## Layout

La página es asfalto; el contenido vive en paneles de lámina. Arriba, una banda delgada (3.5rem) de lado a lado con fecha y hora, el nombre y Salir; en el encargado suma el menú de secciones.

- **Tablet horizontal** (`wide`: ancho ≥ 960px y landscape): dos columnas, tablero 1.3fr y captura 1fr, separación 0.75rem, sin scroll de página; la lista y el panel de captura se desplazan por dentro.
- **Tablet de pie** (`tall`: portrait, ancho ≥ 700px, alto ≥ 1000px): una columna sin scroll de página. El tablero toma el espacio sobrante y la lista se desplaza por dentro; el título del panel y la lectura de kg comparten fila, las teclas bajan a 3.25rem y los renglones a 3rem.
- **Celular**: columna con scroll de página. La lista de paradas se limita a 20rem de alto (mín. 16rem) y se desplaza por dentro para que la captura quede alcanzable; ≤ 520px desaparece la columna Hora y ≤ 640px el tablero de repartidores oculta Salió y Entregó.
- **Ritmo:** 0.75rem entre paneles y en el margen de página, 1rem de relleno de panel y entre bloques de captura (0.75rem en tablet), 0.5rem entre teclas. Renglones de 3.25rem con relleno lateral de 0.9rem y columnas fijas (#, hora, parada, kg).
- **Área táctil:** nada tocable mide menos de 48px.

La parada más reciente siempre queda a la vista: la lista baja al final cuando entra un renglón.

## Elevation & Depth

El sistema es plano. La profundidad sale del tono (asfalto, lámina, lámina alzada) y de las costuras de 1px, nunca de sombras proyectadas. Los únicos `box-shadow` son contornos interiores de 1px en amarillo (campo enfocado, renglón o cifra seleccionados) y el subrayado interior de 2px de la sección actual; son trazos, no elevación.

### Named Rules
**The Lámina Plana Rule.** Sin sombras proyectadas, degradados, brillos ni relieves. Un nivel se distingue por su tono y su costura.

## Shapes

Esquinas apenas suavizadas de 6px en paneles, campos, teclas, botones, alertas y la ventanilla de kg. Todos los bordes son costuras de 1px. La única forma redonda es la de los indicadores de estado: la píldora de estado y su punto, y el punto del tablero de repartidores. Los iconos son de trazo propio, 2.2px, extremos y uniones cuadrados, sin relleno, en 1em.

## Components

### Buttons
Interruptores de lámina: grandes, en oración normal, sin adornos.
- **Shape:** esquinas de 6px.
- **Primary:** amarillo con texto asfalto, 800 en 1.125rem, alto 3.5rem, a todo lo ancho en la captura, con flecha de trazo al final. Al presionar se oscurece (brightness 0.88, 120ms). Deshabilitado: lámina alzada con texto gris rótulo.
- **Secondary:** costura de 1px, texto blanco 700, alto 3rem; al tocar se rellena de lámina alzada (140ms).
- **Danger:** borde y texto rojos (Borrar, Cerrar ruta armada).
- **Quiet:** sin borde, texto gris claro (Salir, Cerrar ruta en reposo, flechas de día).
- **Focus:** anillo amarillo de 3px con 2px de separación en todo lo enfocable.

### Chips
- **Píldora de estado:** píldora redonda de 2rem con punto y texto 700. "En ruta" en verde, "Sobre-entrega" en rojo, "Cerrada" / "Sin iniciar" / "Activo" / "Desactivado" en gris claro con costura.
- **Opción de selección** (rol al dar de alta): placa de 3rem con costura; la elegida se enciende con borde amarillo y fondo amarillo apagado.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** lámina sobre asfalto.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** costura de 1px.
- **Internal Padding:** 1rem; las cifras y listas llegan al borde del panel, separadas por costuras.

### Inputs / Fields
- **Style:** lámina alzada, costura de 1px, 6px, alto 3.25rem, texto 1.125rem 600; placeholder en gris rótulo 400.
- **Focus:** el borde pasa a amarillo con contorno interior de 1px (140ms); cursor amarillo.
- **Error / Disabled:** campo inválido con borde rojo. La alerta de error (rojo apagado, borde rojo, texto blanco 600) va bajo los campos y nombra el problema y cómo seguir.

### Navigation
- **Banda superior:** lámina con costura inferior; fecha en gris claro y hora en blanco 700 tabular, nombre en gris claro 600, Salir discreto (en celular solo su icono).
- **Secciones del encargado** (Rutas, Usuarios): enlaces de 3rem en gris claro 700; la actual se rellena de lámina alzada, va en blanco y lleva subrayado interior amarillo de 2px.

### Tablero de renglones
- Encabezado de columnas en gris rótulo 600 de 0.8125rem sobre costura; renglones de 3.25rem separados por costura.
- Número en gris rótulo, hora en gris claro tabular, nombre en blanco 600, kg en cifra 800 alineada a la derecha.
- El renglón tocado para corregir se selecciona: fondo amarillo apagado con contorno interior amarillo de 1px.
- Vacío y pista ("Toca una parada para corregirla o borrarla.") en gris rótulo.
- El encargado usa el mismo tablero para repartidores (punto de estado, nombre, Salió, Entregó, Queda, paradas) y usuarios.

### Teclado de kg
- Rejilla 3×4 (7-8-9 arriba; ½ / 0 / borrar abajo), teclas de lámina alzada con costura, 6px, dígitos blancos 700 tabulares.
- Al presionar la tecla se enciende en amarillo al instante y vuelve en 140ms; deshabilitado al 40%.
- La lectura de kg es una ventanilla de asfalto con costura: rótulo a la izquierda, cifra a la derecha (gris rótulo en cero, blanca con valor) y "kg" en gris claro.

### Destello de señal (firma)
El único movimiento del sistema. Cuando cambia "Quedan" la cifra se ilumina en amarillo; cuando entra una parada su renglón se enciende en amarillo apagado con contorno amarillo. Dura 1400ms: amarillo pleno el primer 30% para que se lea con sol y luego se apaga con cubic-bezier(0.16, 1, 0.3, 1). Con reduced motion el mismo resaltado aparece fijo y se quita sin transición al terminar. Ninguna otra pantalla anima entradas, cambios de cifra ni decoraciones.

### Confirmación de dos toques
Borrar una parada, cerrar la ruta y desactivar un usuario no abren modales: el primer toque arma el botón (pasa a rojo y pregunta "¿Borrar?" / "¿Cerrar? Toca otra vez") y el segundo ejecuta. Las destructivas quedan apartadas de la acción principal.

### Reporte impreso
El PDF del reporte diario (src/utils/reportPdf.ts) es un documento claro para imprimir, tamaño carta, en Helvetica; no sigue este sistema de pantalla y no debe tomarse como referencia para él.

## Do's and Don'ts

### Do:
- **Do** usar el amarillo de señal (#FFD000) solo para la acción principal, el foco, la selección y la advertencia.
- **Do** poner cifras de kg, horas y conteos en peso 800 con dígitos tabulares.
- **Do** escribir todo en oración normal, incluidos botones, rótulos y encabezados de columna.
- **Do** separar niveles con tono y costuras de 1px (#343A41), con esquinas de 6px.
- **Do** reservar el verde (#3DDC84) para "En ruta" y nada más.
- **Do** confirmar acciones destructivas con un segundo toque sobre el mismo botón.
- **Do** dejar el destello de señal como único movimiento, y fijo bajo prefers-reduced-motion.
- **Do** mantener cada pantalla de tablet sin scroll de página y dejar que las listas se desplacen por dentro.

### Don't:
- **Don't** usar sombras proyectadas, degradados, brillos ni relieves.
- **Don't** usar mayúsculas sostenidas ni tracking abierto.
- **Don't** pintar de amarillo rótulos, títulos o relojes en reposo.
- **Don't** usar gris medio para texto; los textos son blanco, #C4CBD3 o #9AA3AD.
- **Don't** abrir modales para confirmar.
- **Don't** usar tarjetas grises con acento azul.
- **Don't** introducir una segunda familia tipográfica.
