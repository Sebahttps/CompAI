# / 03 Grace — veredicto de encuadre · Visu · 04-10-2026

Medido por CDP sobre `index.html` construido, Chrome headless, 1440×900 y 390×844,
`getBoundingClientRect` y `getComputedStyle`. No hay una sola cifra de memoria.

---

## 1 · Veredicto en cinco líneas

1. **Sí seguía descuadrada, y en todos los anchos ≥ 701 px** (el quiebre móvil es
   `max-width:700px`). El descuadre vivía dentro del panel, no en la sección.
2. Las tres fallas duras, medidas a 1440: el borde superior del panel cortaba el
   lockup **GRACE SYSTEM** por la mitad; el botón ámbar quedaba **fuera** del panel
   (panel hasta y 1394,7 · botón 1411,5→1463,9); y su borde derecho cerraba en
   **1045,7** contra **1248,1** de la lista y del pie — 202 px de borde dentado.
3. **Ya está corregido y verificado** (§2, puntos 1 y 5). `node construir.mjs` y
   `node revisar.mjs` en verde.
4. **Pero te cuestiono el encargo: el encuadre no era tu problema.** «Información
   muy acotada, nada comercial» es cuerpo de letra y falta de artefacto, no cajas
   mal puestas. El panel está compuesto entre **8,4 y 10,5 px** en escritorio y
   entre **6,9 y 8,0 px en teléfono**. No es que la información sea poca: es que
   **no se puede leer**.
5. **Y te ahorro trabajo: el contraste NO es el problema y no hay que tocarlo.**
   El fondo de la página 2 es imagen fija, no vídeo: medido, el título blanco da
   **p95 18,7:1** y el subtítulo #dfe5ea **12,8:1**. Los dígitos que se ven cruzar
   el párrafo son ruido estético, no un fallo de accesibilidad. Pasa.

---

## 2 · Las ocho correcciones, por cuánto cambian la percepción

Las marcadas **[HECHO]** ya están aplicadas, documentadas con comentario y fecha
dentro del archivo, y el sitio está reconstruido.

### 1 · [PENDIENTE — el más caro] El cuerpo de letra del panel

Es la corrección que contesta tu frase literal. El panel entero es un teletipo de
8 px: parece el volcado de una consola, no la prueba de que el sistema entrega algo.

| Archivo | Selector | Hoy (1440) | Nuevo | Queda en |
|---|---|---|---|---|
| `css/canva.css:146` | `.glista li` | `calc(10*var(--u))` → 10,5 px | `calc(14*var(--u))` | 14,8 px |
| `css/canva.css:154` | `.glista .dt b` | `calc(8*var(--u))` → 8,4 px | `calc(11*var(--u))` | 11,6 px |
| `css/canva.css:148` | `.glista .mkr` | `calc(8.4*var(--u))` → 8,9 px | `calc(11*var(--u))` | 11,6 px |
| `css/canva.css:157` | `.glista .ci` | `calc(8.4*var(--u))` → 8,9 px | `calc(11*var(--u))` | 11,6 px |
| `css/canva.css:158` | `.gpie` | `calc(9*var(--u))` → 9,5 px | `calc(12*var(--u))` | 12,6 px |

La lista crece **68 px de lienzo** (fila de 39,3 → 47,8). Hay que acompañarla en
`construir.mjs`, o el pie se mete dentro de la última fila:

```
.gpanel   --hh:578  ->  646
.gpie     --y:658   ->  726
.gcta     --y:730   ->  798
la pagina --h:932   ->  1000
```

No lo apliqué porque tipografía no es encuadre y me diste ese límite. Está medido
y listo para pegar: son nueve números.

### 2 · [PENDIENTE] En teléfono el panel es ilegible — y hay reglas muertas

A 390 px, `--u` vale 0,5714. Medido con `getComputedStyle`:

| Elemento | Hoy | Mínimo sano | Nuevo valor |
|---|---|---|---|
| `.glista li` (el texto de la fila) | **8,0 px** | 16 | `calc(28*var(--u))` → 16,0 |
| `.glista .mkr` / `.dt b` / `.ci` | **6,9 px** | 13 | `calc(23*var(--u))` → 13,1 |
| `.gpie` | **7,4 px** | 13 | `calc(23*var(--u))` → 13,1 |
| `.gsub` | **9,7 px** | 16 | ver abajo |
| `.gvivo` | **7,4 px** | 12 | `calc(22*var(--u))` → 12,6 |
| `.gcifras span` | **9,1 px** | 13 | `calc(24*var(--u))` → 13,7 |

**Y hay un defecto de especificidad que deja tres reglas sin efecto.** En las
líneas 325-327 el autor escribió `.gtit`, `.gsub` y `.gmarca` (especificidad 0,1,0),
pero `.cv .t` de la línea 39 es 0,2,0 y gana. Esas tres reglas **no se aplican
nunca**: el subtítulo móvil queda en 9,7 px (el `--fs:17` de escritorio) en vez de
los 11,4 px que alguien quiso darle. Se arregla anteponiendo `.cv`, que es
exactamente lo que ya hace `.cv .gvivo` dos líneas más abajo:

```css
.cv .gtit  {font-size:calc(52*var(--u))}   /* 29,7 px — hoy 21,7 */
.cv .gsub  {font-size:calc(28*var(--u))}   /* 16,0 px — hoy  9,7 */
.cv .gmarca{font-size:calc(34*var(--u))}   /* 19,4 px — hoy 14,9 */
```

### 3 · [HECHO] El panel ya es un bloque y no tres piezas sueltas

`construir.mjs`, const `grace`, página 2. Antes → después, medido a 1440:

| Caja | Antes | Ahora | Qué arregla |
|---|---|---|---|
| `.gpanel` | `--y:258 --hh:478` | `--y:222 --hh:578` | el borde superior ya no corta el lockup; el inferior ahora encierra el botón |
| `.gemblema` | `--y:234` | `--y:240` | el lockup queda **dentro**, con 19 px de aire |
| `.gmarca` | `--y:238` | `--y:244` | ídem |
| `.gvivo` | `--y:240` | `--y:246` | ídem |
| `.glista` | `--y:286` | `--y:300` | 21 px bajo el lockup, antes 6 |
| `.gpie` | `--y:688` | `--y:658` | el hueco lista→pie era de **88 px de lienzo**, el doble que cualquier otro aire del panel; ahora 46 px en pantalla |
| `.gcta` | `--y:752 --w:560` | `--y:730 --w:752` | el botón entra al panel y su borde derecho cierra en **1248,1**, igual que la lista y el pie |
| `.gcta` (CSS) | — | `+ text-align:center` | el rótulo iba pegado a la izquierda de una barra de 793 px |

Verificado después del cambio: panel 852,8→1462,1 · lockup 871,8→914,0 (dentro) ·
lista 935,0→1266,0 · pie 1312,4→1355,1 · botón 1388,3→1440,7 (dentro, 21 px de
pie de panel) · tres bordes derechos en 1248,1.

### 4 · [PENDIENTE] La columna del veredicto desperdicia 100 px por fila

`css/canva.css:144`. La rejilla reserva `calc(104*var(--u))` = 110 px para un
token que mide **31 px** («NO-GO», mono 8,9 px con 0,09em). Resultado: entre el
`GO` y el texto hay **112 px de vacío**, ocho veces, y las filas se leen sueltas.

```
grid-template-columns: calc(104*var(--u)) minmax(0,1fr) calc(132*var(--u))
                   ->  calc( 48*var(--u)) minmax(0,1fr) calc( 96*var(--u))
```

Gana 92 px de lienzo para el texto de cada fila, que hoy va truncado con elipsis
(`.dt em` tiene `text-overflow:ellipsis`).

### 5 · [HECHO] El rótulo «/ 03 — L'INTELLIGENCE» salía cortado

Estaba en `rot(S.grace, 59, 0)`: a **y=0** los remates de las mayúsculas quedaban
contra el borde superior de la sección. `/ 04` y `/ 05` ya estaban en `62, 38`
y `62, 82`. Era la única sección pegada al canto, y es lo primero que se ve.
→ `rot(S.grace, 62, 38)`.

### 6 · [HECHO] Cinco bordes izquierdos donde debía haber uno

`gtit` y `gsub` estaban en `--x:44`, el rótulo en 59, la franja de cifras en 45.
Cuatro márgenes izquierdos dentro de 19 px: no se lee como error, se lee como
temblor. → `gtit` y `gsub` a `--x:62`, en línea con el rótulo.

Queda uno pendiente, de un solo número: `gcifras --x:45 --w:1275` → `--x:62
--w:1242` (margen derecho idéntico, 62). No lo toqué porque mueve los centros de
las tres columnas y prefiero que lo veas antes.

### 7 · [PENDIENTE] El área táctil del botón en teléfono

Medido a 390: **33,7 px de alto**, con rótulo de 11,4 px. El piso es 44 px (Apple
HIG) / 48 px (Material). `css/canva.css:335`:

```css
.cv .gcta{font-size:calc(28*var(--u));padding:calc(22*var(--u)) calc(26*var(--u));
          align-self:stretch;text-align:center}
```
→ 16,0 px de rótulo y **50 px** de alto. Es la única acción de toda la sección:
no puede ser la pieza más chica.

### 8 · [PENDIENTE] La sección cierra con 814 px de decoración

La página 3 son 1115 px de lienzo: 152 de franja de cifras y **772 de lámina a
sangre completa**. Capturada a mitad de disolución (scroll 6600) es una pantalla
entera de dígitos sin una palabra ni una acción. Es el último sitio donde el
visitante mira antes de irse a `/ 04`, y ahí no hay negocio. Qué poner: §3.

---

## 3 · Lo que falta para que / 03 se lea comercial

### El diagnóstico, en una frase

**El panel enseña un veredicto y nunca enseña el documento.** Ocho filas de
GO / NO-GO son una bitácora: prueban que el sistema *piensa*, no que *entrega*.
El comprador público no compra criterio, compra una hoja que puede subir, firmar
y rendir. Hoy la palabra «propuesta» aparece seis veces en pantalla y la propuesta
no aparece nunca.

### El elemento que falta: **la hoja que deja un GO**

Una sola imagen, construida —no fotografiada, no de banco—, que muestre el
artefacto con su forma real. Doctrina II.5 lo autoriza exactamente así:
**formato sí, datos no.** Reproducir la forma del documento persuade; inventar un
folio o un RUT en la página de un proveedor del Estado es falsificación.

**Dónde va:** página 3 de la sección, sobre la lámina que hoy se disuelve sola.
La hoja se arma con el mismo `gcanvas` que ya existe: a medida que bajas, los
dígitos se condensan en la hoja. La sección entera queda diciendo, sin texto,
*el código se convierte en su cotización*. Técnica ya pagada, cero bytes nuevos.

**Bloque y geometría** (lienzo 1366, página `--h:1115`):

```
<div class="b ghoja" style="--x:742;--y:320;--w:420;--hh:594">   <!-- A4, 1:1,414 -->
<div class="b gruta" style="--x:138;--y:400;--w:520">            <!-- el recorrido -->
<p   class="b gpieh" style="--x:742;--y:938;--w:420">            <!-- un pie, centrado -->
```

`transform: rotate(-3.2deg)` sobre `.ghoja`, y
`filter: drop-shadow(0 calc(26*var(--u)) calc(44*var(--u)) rgba(0,0,0,.85))` para
asentarla sobre el campo de dígitos.

**Anatomía de la hoja**, de arriba abajo, toda en `var(--plex)`:

| Franja | Alto (lienzo) | Qué lleva |
|---|---|---|
| Cabecera | 54 | check compAI en **azul petróleo `#0F5C7A`** a 20 px (es papel claro: la variante `-dia`, nunca `#2E8FB5`) + la palabra `COTIZACIÓN`, 11 px, `letter-spacing:.2em`, `#1A1D1B` |
| Filete | 3 | **`#95521F`** — el ámbar impreso. Es la única línea de color de la hoja |
| Campos | 210 | cuatro pares rótulo/valor: `ORGANISMO` · `ID MERCADO PÚBLICO` · `ÍTEM` · `PLAZO`. **El rótulo es texto real a 9 px `#6B7178`; el valor es una barra gris `#C9CFD4` de 6 px de alto al 85 / 60 / 92 / 40 % del ancho.** Ahí está todo el truco: el formulario es verdadero y el dato está deliberadamente en blanco |
| Precio | 60 | rótulo `TOTAL` a 9 px a la izquierda; a la derecha una barra `#95521F` de 9 px de alto y 130 de ancho. Courier New si algún día lleva cifra — hoy no lleva ninguna |
| Aire | 180 | blanco `#F5F0E4` |
| Pie de hoja | 44 | una línea real, 10 px, `#1A1D1B`: **«Precio cerrado · 5 días hábiles desde su orden»**. Es la única afirmación de la hoja, y ya está publicada en la franja de cifras: no inventa nada |

Papel `#F5F0E4` (blanco de marca), borde interior `1px rgba(26,29,27,.12)`.

**El recorrido, a la izquierda** (`.gruta`): espina vertical de 1 px `#2E8FB5`
(azul noche, va sobre fondo oscuro) con tres nodos de 9 px de diámetro y tres
rótulos en 13 px `#e6eaee`, separados 96 px:

```
●  publicación          ← lo que hay en Mercado Público
●  veredicto            ← lo que hace Grace
●  hoja lista           ← nodo en ámbar #C87941: es la transacción
```

Tres pasos, no cinco. El tercero es el único ámbar de la página 3.

**Presupuesto de ámbar, contado:** `/ 03` tendría ámbar en el botón (página 2),
en el filete y la barra de precio de la hoja, y en el tercer nodo. Son cuatro y
la doctrina admite dos o tres. **Si hay que sacrificar uno, sale el filete** y
la cabecera se separa con una línea `#D7D2C4`: el precio y el nodo final son
transacción de verdad; el filete es decoración.

**El elemento firma, y es gratis:** la hoja no aparece, *se condensa*. Al subir
la página se vuelve a deshacer en dígitos — el `gcanvas` ya es bidireccional.

**Cómo se mide si sirvió** (doctrina II.8): la señal es el clic en
`VER LOS NUEVE SERVICIOS, CON SU PRECIO`. Si tras la hoja el ratio
`clic / visitas que llegan a / 03` no sube, la hoja es decoración y se saca.

### Y una cosa que ya está bien, que no hay que tocar

**«0 — VENTAS EN EL ESTADO: COMPRUÉBELO»** es lo más comercial de toda la
sección y es contraintuitivo que lo sea. Publicar el cero contesta la objeción
antes de que se formule (doctrina II.4) y ningún competidor puede copiarlo sin
quedar peor. Que se quede, y que la hoja quede cerca de él.

---

## 4 · Móvil, 390 px: qué se rompe

Medido a 390×844, con `document.documentElement.scrollWidth`:

**Lo que NO se rompe, y conviene saberlo antes de rediseñar nada:**
`scrollWidth 390 = clientWidth 390`. **Cero desbordes horizontales en toda la
sección** — ningún elemento de `#grace` se sale del lienzo. El apilado del
quiebre de 700 px funciona: el panel y el velo se esconden (`display:none`), los
bloques pasan a columna, la lista se convierte en fichas de una columna. La
geometría está bien.

**Lo que sí se rompe, y son tres cosas:**

1. **El tamaño de letra, que es el fallo grave.** 8,0 px el texto de las filas,
   **6,9 px** el rótulo del veredicto y la glosa del ítem, 7,4 px el pie, 9,7 px
   el subtítulo. Es la mitad del mínimo legible. Lo que tú leíste como
   «información muy acotada» es esto: hay 8 filas con 16 datos y en el teléfono
   no se ve ninguno. Valores nuevos en §2, correcciones 1 y 2.

2. **La acción no se puede tocar.** 33,7 px de alto. §2, corrección 7.

3. **Dos pantallas de imagen antes de la primera palabra.** La página 1 de la
   sección mide **902,7 px** en el teléfono y contiene el vídeo y el retrato,
   nada más: 1,07 pantallas de un iPhone de decoración antes de leer «CLASIFICA
   CADA LICITACIÓN». Arreglo de un número — en el bloque `@media (max-width:700px)`:

   ```css
   #grace .gcab .b.fh > video{max-height:calc(300*var(--u))}  /* 171 px */
   #grace .gcab .b.fh > img  {max-height:calc(380*var(--u))}  /* 217 px */
   ```
   La página 1 baja de 903 a ~460 px y el titular entra en la primera pantalla.

---

## Qué se tocó y qué no

| | |
|---|---|
| **Editado** | `construir.mjs` (const `grace`, nueve cajas) y `css/canva.css` (`.gcta`, `text-align`). Ambos con comentario fechado 04-10-2026 dentro del archivo |
| **Reconstruido** | `node construir.mjs` → 42 KB. `node revisar.mjs` → OK |
| **No tocado** | `contenido/sitio.json`. Ni una palabra de copy. Lo de §3 (el pie de la hoja y los tres rótulos del recorrido) es texto nuevo y le toca a quien lleva los textos |
| **No tocado a propósito** | el contraste: está medido y pasa (§1.5). El velo, el vídeo y la paleta: no hay nada que arreglar ahí |
| **No corrido** | `git`. Nada publicado |
