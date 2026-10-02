---
name: Reparto de Tortillas
description: Tablero de salidas para el repartidor; paletas negras, letra blanca, ámbar de lámpara y marco de acero.
colors:
  flap: "#0d0d0f"
  flap-campo: "#111114"
  flap-2: "#1b1b1e"
  flap-3: "#26262b"
  tinta: "#f2f2f2"
  ambar: "#ffb400"
  ambar-oscuro: "#3a2a00"
  rojo: "#ff4d4d"
  rojo-oscuro: "#3b1010"
  acero: "#b6bbc2"
  acero-2: "#7d838c"
  acero-3: "#3a3d42"
  acero-franja: "#9ea4ac"
  acero-luz: "#a7adb5"
  acero-sombra: "#5f656d"
  regla: "#222327"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(4rem, 7vw + 1rem, 7rem)"
    fontWeight: 600
    lineHeight: 1
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 5vw + 1rem, 5.5rem)"
    fontWeight: 600
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.4rem, 4.4vw, 3.4rem)"
    fontWeight: 600
    lineHeight: 1
  title-md:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(1.3rem, 1.2vw + 0.9rem, 1.7rem)"
    fontWeight: 600
    lineHeight: 1
  flap-sm:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1
  parada:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  body:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 500
    letterSpacing: "0.04em"
  button:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    letterSpacing: "0.14em"
  button-sm:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    letterSpacing: "0.14em"
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    letterSpacing: "0.18em"
rounded:
  flap: "0.07em"
  control: "6px"
  marco: "0.5rem"
spacing:
  teclado: "0.45rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  celda-gap: "0.07em"
components:
  button-primary:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.flap}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 1.6rem"
    height: "clamp(3.6rem, 8.5vh, 4.2rem)"
  button-primary-disabled:
    backgroundColor: "{colors.acero-3}"
    textColor: "{colors.acero-2}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.acero}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.control}"
    padding: "0 1.2rem"
    height: "3.4rem"
  button-secondary-danger:
    textColor: "{colors.rojo}"
  button-plate:
    backgroundColor: "{colors.flap-2}"
    textColor: "{colors.tinta}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.control}"
    padding: "0 0.9rem"
    height: "3rem"
  input:
    backgroundColor: "{colors.flap-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "3.6rem"
  key:
    backgroundColor: "{colors.flap-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    height: "clamp(3.2rem, 7.5vh, 4.1rem)"
  key-active:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.flap}"
  flap-cell:
    backgroundColor: "{colors.flap-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.flap}"
    width: "0.72em"
    height: "1.16em"
  board:
    backgroundColor: "{colors.flap-campo}"
    rounded: "{rounded.marco}"
  header-band:
    backgroundColor: "{colors.acero-franja}"
    textColor: "{colors.flap}"
  alert-error:
    backgroundColor: "{colors.rojo-oscuro}"
    textColor: "{colors.rojo}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
  board-row-active:
    backgroundColor: "{colors.ambar-oscuro}"
    textColor: "{colors.ambar}"
---

# Design System: Reparto de Tortillas

## Overview

**Creative North Star: "El tablero de salidas"**

La ruta del día se lee como el tablero de una terminal: un marco de acero que encierra un campo de paletas negras, renglones con regla y columnas fijas, y cifras que se voltean carácter por carácter cuando cambian. Todo está hecho para leerse de un vistazo desde una tablet montada en el vehículo: cifras enormes, una sola familia condensada en mayúsculas con espaciado amplio y muy pocos colores, cada uno con un trabajo fijo.

La densidad es de tablero, no de formulario: cada pantalla cabe en un viewport sin scroll de página en tablet, y lo que crece (la lista de paradas) se desplaza dentro de su propio marco. El fondo es oscuro por decisión explícita del usuario, que lo eligió por encima del riesgo de legibilidad bajo sol directo; el contraste se gana con letra casi blanca, cifras grandes y el rojo aclarado.

Se rechaza la app de captura típica: tarjetas blancas, formulario genérico, botón azul.

**Key Characteristics:**
- Paletas negras con línea de corte horizontal para cifras, horas y rótulos cortos fijos.
- Una sola sans condensada (Barlow Condensed), en mayúsculas y con tracking amplio.
- Ámbar como lámpara encendida: estado activo, advertencia y acción principal, nada más.
- Acero en tonos planos, con la luz arriba, para marcos, franja de encabezado y etiquetas.
- Cascada de volteo como única animación firma; instantánea con reduced motion.
- Confirmación destructiva con doble toque, sin modales.

## Colors

Negro de paleta casi total, letra blanca, una lámpara ámbar y un rojo de cancelado; el acero pone el marco.

### Primary
- **Ámbar de lámpara** (ambar): la acción principal (REGISTRAR, ENTRAR), el estado activo (lámpara EN RUTA, renglón o cifra en corrección, tecla presionada, kg tecleados), el anillo de foco, el cursor y la selección de texto. Su fondo apagado, **Ámbar apagado** (ambar-oscuro), rellena el renglón o la cifra activos.

### Secondary
- **Rojo de cancelado** (rojo): solo sobre-entrega (QUEDAN y REGRESA en negativo, aviso, foco de la lámpara) y acciones de borrar o cerrar armadas. **Rojo apagado** (rojo-oscuro) es el fondo de la alerta de error. Se usa #FF4D4D y no el #D32F2F del contrato porque este último no alcanzaba contraste de texto sobre el negro de paleta.

### Neutral
- **Negro de paleta** (flap): fondo de página y texto sobre ámbar o sobre la franja de acero.
- **Campo del tablero** (flap-campo): el interior de cada marco, un paso más claro que la página.
- **Sombra de paleta** (flap-2): fondo de campos de texto, placas y celdas; flap-3 queda como tono intermedio.
- **Letra de paleta** (tinta): todo el texto principal y todas las cifras, incluidos los relojes.
- **Acero claro** (acero): rótulos, botón secundario, teclas de función, avisos neutros.
- **Acero medio** (acero-2): número de renglón, placeholder, pistas, texto deshabilitado.
- **Acero oscuro** (acero-3): bordes de campos, divisiones entre cifras, regla del encabezado de la lista, fondo del botón deshabilitado.
- **Franja de acero** (acero-franja) con **luz** (acero-luz) y **sombra** (acero-sombra): la franja de encabezado y el bisel del marco.
- **Regla** (regla): línea entre renglones de paradas.

### Named Rules
**The Lámpara Rule.** El ámbar significa "encendido": estado activo, advertencia o la acción principal. Nunca decora, nunca colorea un reloj ni un rótulo en reposo.

**The Cancelado Rule.** El rojo aparece solo para sobre-entrega y para acciones destructivas armadas. La sobre-entrega es la única advertencia que pasa de ámbar a rojo; se advierte, no se bloquea.

**The Relojes Blancos Rule.** Fecha y hora van en letra de paleta (tinta), en la franja y en la lista (la hora de cada parada va en acero). Los relojes no son estado.

## Typography

**Display Font:** Barlow Condensed (con Arial Narrow, sans-serif)
**Body Font:** Barlow Condensed (misma familia; 500, 600 y 700)

**Character:** Una sola condensada de rótulo de terminal. La jerarquía sale del tamaño, el peso y la celda, no de un segundo tipo. La raíz es de 18px para que todo en rem crezca para la tablet.

### Hierarchy
- **Display** (600, clamp(4rem, 7vw + 1rem, 7rem), 1; 3.6rem en tablet de pie): solo los kg que QUEDAN, en celdas.
- **Headline** (600, clamp(3rem, 5vw + 1rem, 5.5rem), 1): la marca del login en celdas.
- **Title** (600, clamp(2.4rem, 4.4vw, 3.4rem), 1): lectura de kg tecleados, cifras del cierre, estados de carga.
- **Title md** (600, clamp(1.3rem, 1.2vw + 0.9rem, 1.7rem), 1): SALIÓ / ENTREGADO / PARADAS, título del panel, reloj del login.
- **Flap sm** (600, 1.15rem, 1): reloj de la franja, hora y kg de cada renglón, lámpara.
- **Parada** (600, 1.45rem, 0.08em, mayúsculas): el nombre de la parada como texto plano.
- **Body** (500, base 18px, 0.04em): texto corrido y mensajes; los avisos van en 600, 1.15rem, 0.1em, mayúsculas.
- **Button** (700, 1.6rem, 0.14em, mayúsculas) y **Button sm** (600, 1.1rem, 0.14em, mayúsculas).
- **Label** (600, 0.78rem, 0.18em, mayúsculas, acero): el rótulo pintado en el marco que nombra una cifra o una columna.

### Named Rules
**The Celda Rule.** Las celdas de paleta son para números, horas y rótulos cortos fijos. El texto libre (nombres de parada de hasta 120 caracteres) va en mayúsculas planas con tracking, nunca en celdas.

**The Mayúsculas Rule.** Todo texto corto de interfaz va en mayúsculas con tracking. La excepción es la alerta de error: conserva mayúsculas y minúsculas de oración para que un mensaje completo se lea bien.

## Layout

La página es negro de paleta; el contenido vive dentro de marcos de acero cuyo campo es un tono más claro. Arriba, una franja de acero de lado a lado con fecha y reloj en celdas, el nombre y SALIR.

- **Tablet horizontal** (`horizontal`: ancho ≥ 960px y landscape): dos columnas, tablero 1.3fr y panel de captura 1fr, separación 1rem, sin scroll de página; el panel se desplaza por dentro si hace falta.
- **Tablet de pie** (`vertical-alto`: portrait, ancho ≥ 700px, alto ≥ 1000px): una sola columna que no hace scroll de página. El tablero toma el espacio sobrante y la lista de paradas se desplaza por dentro con scroll-snap (cada renglón ajusta al final); el título del panel y la lectura de kg comparten fila y las teclas ceden altura.
- **Celular** (≤ 520px): columna con scroll de página; la columna HORA desaparece para dejarle ancho al nombre de la parada.
- **Ritmo:** separaciones de 0.75rem (sm) y 1rem (md), 1.25rem en formularios; el teclado usa 0.45rem. Renglones de 3.5rem de alto mínimo (3rem en tablet de pie) con columnas fijas: número, hora, parada, kg.
- **Área táctil:** nada tocable mide menos de 48px (3rem con raíz de 18px).

La parada más reciente siempre queda a la vista: la lista baja al final cuando entra un renglón.

## Elevation & Depth

El sistema es plano con dos materiales. El acero se resuelve en tonos planos con la luz arriba (borde superior más claro, inferior más oscuro); no hay relieve CSS ni remaches. Las paletas llevan su propio material: mitad superior un poco más clara que la inferior, línea de corte negra y un filo de luz de 1px. La única sombra proyectada es la del marco sobre la página y el halo ámbar del botón principal.

### Shadow Vocabulary
- **Marco** (`box-shadow: inset 0 0 0 1px #000, 0 10px 30px -12px rgb(0 0 0 / 0.8)`): el tablero se asienta sobre la página.
- **Celda** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 0.03em 0.06em rgb(0 0 0 / 0.7)`): cada paleta.
- **Tecla** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.07), 0 2px 4px rgb(0 0 0 / 0.6)`): teclas del teclado de báscula.
- **Placa** (`box-shadow: 0 1px 0 rgb(255 255 255 / 0.35), inset 0 1px 0 rgb(255 255 255 / 0.06)`): botón oscuro sobre la franja de acero.
- **Lámpara encendida** (`box-shadow: 0 6px 18px -8px rgb(255 180 0 / 0.55)`): halo del botón ámbar; el foco de la lámpara de estado brilla con `0 0 10px 1px` en ámbar o rojo al 60%.

### Named Rules
**The Acero Plano Rule.** El acero es color, no relieve: bordes de tono con la luz arriba y la franja de encabezado. Sin degradados metálicos, sin biseles en relieve, sin remaches.

## Shapes

Esquinas apenas suavizadas, como piezas troqueladas: 6px en controles, campos, placas, teclas y alertas; 0.5rem en los marcos; 0.07em en cada paleta. El bisel del marco es un borde de 5px con cuatro tonos de acero (claro arriba, medio a los lados, oscuro abajo). La línea de corte horizontal a media altura es la firma de forma: aparece en cada celda y en cada tecla. Los iconos son de trazo propio, 2.2px, extremos y uniones cuadrados, sin rellenos.

## Components

### Buttons
Interruptores de tablero: grandes, en mayúsculas, sin adornos.
- **Shape:** esquinas troqueladas (6px).
- **Primary (lámpara):** ámbar con texto negro de paleta, 700 en mayúsculas, alto clamp(3.6rem, 8.5vh, 4.2rem), una flecha de trazo al final. Al presionar baja 1px y se oscurece (brightness 0.92) en 120ms. Deshabilitado: acero oscuro con texto acero medio y sin halo.
- **Secondary (acero):** contorno de 2px acero oscuro, texto acero claro; al tocar el borde pasa a acero medio y el texto a tinta (160ms). La variante de peligro pone borde y texto en rojo.
- **Placa:** botón oscuro con filo de luz sobre la franja de acero (SALIR); al presionar se hunde a negro de paleta.
- **Focus:** anillo ámbar de 3px con 3px de separación en todo lo enfocable.

### Inputs / Fields
- **Style:** celda del tablero: sombra de paleta, borde de 2px acero oscuro, 6px, alto 3.6rem, texto 1.5rem 600. El nombre de parada se teclea en mayúsculas; el placeholder va en acero medio.
- **Focus:** el borde pasa a ámbar en 160ms; el cursor es ámbar.
- **Error:** la alerta de error (fondo rojo apagado, texto rojo, 600 en 1.15rem, oración normal) va bajo los campos y nombra el problema y cómo seguir.

### Navigation
- **Franja de acero:** banda gris acero con luz arriba (2px) y sombra abajo (3px); fecha y reloj en celdas pequeñas en tinta, nombre en rótulo negro, placa SALIR. En celular el nombre se oculta y SALIR queda solo con su icono.

### Tablero de paradas
- Encabezado de rótulos (#, HORA, PARADA, KG) sobre regla acero oscuro; renglones de alto fijo separados por la regla.
- Número en acero medio con dos dígitos, hora en celdas acero, nombre en mayúsculas planas, kg en 5 celdas alineadas a la derecha.
- El renglón tocado para corregir se enciende: fondo ámbar apagado, contorno interior ámbar de 2px, nombre y kg en ámbar.
- Vacío: renglón con regla punteada y un rótulo que dice dónde aparecerá la primera parada.

### Teclado de báscula
- Rejilla de 3×4 (7-8-9 arriba, ½ / 0 / borrar abajo), cada tecla es una paleta grande con su línea de corte, dígitos en tinta 2.3rem, teclas de función en acero.
- Al presionar la tecla se enciende en ámbar al instante y baja 1px; deshabilitado al 40%.
- La lectura de kg es una ventanilla negra con contorno acero oscuro: rótulo a la izquierda y 5 celdas a la derecha, acero cuando está en cero y ámbar cuando hay valor.

### Lámpara de estado
Placa negra con un foco redondo y el estado en celdas: EN RUTA en ámbar con foco encendido, SOBRE-ENTREGA en rojo, CERRADA y SIN INICIAR en acero con foco apagado.

### Celda de paleta (firma)
Cada carácter en su paleta (0.72em × 1.16em, separación 0.07em), mitad superior #212125 y mitad inferior #19191C, línea de corte negra a media altura; las celdas vacías son más oscuras para mantener columnas fijas. Tonos: tinta, ámbar, rojo, acero. Cinco tamaños: xl, titulo, lg, md, sm. Al cambiar, solo la celda cuyo carácter cambió se voltea: giro en X de -92° a 14° y a reposo en 460ms con cubic-bezier(0.16, 1, 0.3, 1), destello de brillo al inicio y 55ms de retraso por posición, en cascada. En el primer render nada se mueve salvo un renglón recién agregado. Con reduced motion el cambio es instantáneo. El texto real se ofrece a lectores de pantalla; las celdas son decorativas.

### Confirmación de dos toques
Borrar una parada y cerrar la ruta no abren modales: el primer toque arma el botón (pasa a rojo y pregunta "¿Borrar?" / "¿Cerrar? Toca otra vez") y el segundo ejecuta. CERRAR RUTA en reposo es discreto: texto acero medio, sin borde.

## Do's and Don'ts

### Do:
- **Do** poner números, horas y rótulos cortos fijos en celdas de paleta con columnas de ancho fijo (kg en 5 celdas alineadas a la derecha).
- **Do** reservar el ámbar (#FFB400) para estado activo, advertencia y la acción principal.
- **Do** usar el rojo #FF4D4D para sobre-entrega y acciones destructivas armadas, con #3B1010 como su fondo.
- **Do** escribir en mayúsculas con tracking todo texto corto de interfaz; las alertas de error conservan oración normal.
- **Do** confirmar acciones destructivas con un segundo toque sobre el mismo botón.
- **Do** mantener cada pantalla de tablet sin scroll de página y dejar que la lista de paradas se desplace por dentro.
- **Do** dar a cualquier cambio de cifra la cascada de volteo, y dejarla instantánea con prefers-reduced-motion.

### Don't:
- **Don't** poner texto libre (nombres de parada) en celdas de paleta.
- **Don't** pintar relojes ni rótulos en reposo de ámbar.
- **Don't** dar relieve al acero: sin embossing CSS, sin degradados metálicos, sin remaches.
- **Don't** abrir modales para confirmar.
- **Don't** usar tarjetas blancas, formularios genéricos ni botones azules.
- **Don't** introducir una segunda familia tipográfica.
