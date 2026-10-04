# Copy que convierte — compai.cl · propuesta de GAIn

**04-10-2026 · Dir. Comercial & Exp. Clientes · GAIn**
Encargo de Sebastián del 03-10 22:07: *«falta el contenido, lo que vende… COMERCIAL, ordenada, intuitiva»*.
Fuente leída: `contenido/sitio.json`, `contenido/servicios.json`, `construir.mjs`, `js/sitio.js`,
`css/sitio.css`, `revisar.mjs`, `sitio-compai/probar_copy.py`, `sitio/LINEAS.md`, `sitio/RESTRICCIONES.md`,
`CompAI/portafolio.html` (los nueve publicados) y
`compai_workspace/Dir. Comercial & Exp. Clientes/catalogo/venta-servicio-propio.tsv` (los precios).

> **Antes de nada, dos correcciones al encargo. No las puedo dejar pasar.**
>
> 1. **`servicios.json` NO tiene 9 servicios: tiene 4.** `revisar.mjs:76` lo exige:
>    `if (serv.length !== 4) mal(...)`. Los **nueve con precio viven en
>    `C:\Users\sebas\CompAI\portafolio.html`**, escritos a mano, sin JSON y sin pasar
>    por `revisar.mjs`. Reviso las dos cosas: §3 las 4 tarjetas de la home, §4 los nueve del portafolio.
> 2. **No puedo poner precios en `servicios.json`.** `revisar.mjs:85` rechaza
>    `/ta\s*rifa|\$\s*\d/` en cualquier campo de un servicio. En `sitio.json` **sí se puede**
>    (no está auditado), y ahí es donde meto el precio. Es la palanca central de esta propuesta.

---

## 1 · Diagnóstico de conversión — por qué hoy un comprador del Estado no escribe

1. **No hay un solo precio en toda la página.** Nueve servicios tarifados existen, en otro archivo,
   detrás de un clic. El comprador con presupuesto decide por número; el número no está.
2. **El `h1` vende una categoría, no una compra.** «TECNOLOGÍA PARA CHILE / ejecutada por IA»:
   nadie compra para Chile, compra para su unidad. Y `offenbar.titulo_2` es **clave muerta** —
   `construir.mjs:143` tiene «ejecutada por IA» escrito a mano: editar el JSON no cambia nada.
3. **/02 habla de nosotros y ofende al lector.** «combatiendo la burocracia paralizante»: el visitante
   **es** la administración. Es la peor línea de la página para este público, y el párrafo entero
   («agentes con súper inteligencia») no contiene un solo término de su oficio.
4. **Dos promesas publicadas no tienen respaldo.** `grace.franja[1]` dice «5 — DÍAS HÁBILES DESDE SU ORDEN»
   y `servicios.json[3].lamina[0]` promete «el plazo en días hábiles» en cada ficha:
   medido hoy, `plazoHabiles` **no existe en ningún archivo del repo** y `portafolio.html` tiene
   **cero** apariciones de «días hábiles». La promesa se rompe en el clic siguiente.
5. **Contradicción de precio a la vista.** La home dice «Precio cerrado antes de empezar»; el portafolio
   dice **«valor desde»** en 5 de 9 tarjetas. Un comprador lee «desde» como «va a subir».
6. **El formulario pide teléfono obligatorio antes de mostrar un precio** (`construir.mjs:274`, `required`).
   Es el punto de mayor fricción del embudo y está en el peor lugar posible.
7. **La página mezcla tú y usted.** El formulario trata de tú («Cómo te llamas», «Detalla tus
   requerimientos»); las láminas de servicio tratan de usted. Para un comprador institucional eso no
   es un detalle de estilo, es una señal de que no sabemos con quién hablamos.
8. **Siete claves muertas** — `offenbar.titulo_2`, `creative.titulo`, `creative.bajada`, `grace.pie`,
   `grace.titulo`, `inbox.titulo`, `inbox.bajada`, `contacto_seccion.pregunta`. «Cuatro frentes. Uno basta
   para empezar.» **no se publica en ninguna parte**: /04 queda sin titular, solo «/ 04 — Creative».

### Las tres cosas que te cuestiono, una línea cada una

- **El orden /03 antes de /04 está BIEN y no lo toco** — con una condición: /03 es el único lugar de la
  página donde hay cifras, así que su CTA tiene que llevar el precio; sin eso /03 son 1.000 px sobre
  nuestra máquina antes de que el comprador vea un servicio. (Y el panel se queda: mi propio log del
  26-09 dice que el mecanismo de los agentes es la única prueba de capacidad de un oferente con 0 ventas.)
- **/06 no sobra, pero su enlace a «Intranet» sí.** /06 carga razón social, RUT y ficha, que `LINEAS.md`
  exige. Pero el enlace a la Intranet es **el único enlace de la página que lleva al visitante lejos de
  comprar**, y está en el último bloque, justo donde se decide escribir o cerrar.
- **`grace.titulo_lineas` no se toca.** Lo dictaste tú el 03-10 y así quedó ejecutado. Mi regla del
  03-10 (2): cuando mi objeción comercial choca con una instrucción tuya ya aplicada, no la reabro.

---

## 2 · Copy nuevo de `sitio.json`, campo por campo

Métricas verificadas con script, no de memoria: **0 palabras prohibidas** de `probar_copy.py`,
**5 términos de oficio** presentes (licencia · presupuesto · orden de compra · glosa · cotización;
el mínimo son 3), `title` 58 ch (tope 20-70), `description` 118 ch (tope 70-165).

### /00 hero y /01 Offenbar

El hero `/00` no tiene copy: `sitio.json` solo guarda `hero: "franjas"` y `hero_sello`. No hay nada que
reescribir ahí; el primer texto de la página es el `h1` de `/01`.

| Ruta JSON | Hoy | Propuesto | Por qué |
|---|---|---|---|
| `meta.title` | `compAI — Tecnología para Chile, ejecutada por IA` | `compAI — Servicios TI para el Estado, con precio publicado` | 58 ch. Lo que se busca es «servicios TI Estado», no un eslogan |
| `meta.description` | `Automatización, agentes de IA, desarrollo web y dirección creativa. Proveedor del Estado en Mercado Público. Santiago, Chile.` | `Nueve servicios de TI con su precio neto publicado, el que va en la orden de compra. Compra Ágil bajo 100 UTM. Santiago.` | La actual vende «desarrollo web y dirección creativa», que **ya no son las cuatro tarjetas**: está vencida |
| `offenbar.titulo_1` | `TECNOLOGÍA PARA CHILE` | `TECNOLOGÍA PARA EL ESTADO` | Lee «TECNOLOGÍA PARA EL ESTADO / ejecutada por IA.» — concuerda en género con la línea fija y cambia «Chile» (nadie compra para Chile) por la identidad del lector |

> **Bloqueo que no es mío:** `construir.mjs:143` tiene `ejecutada por <b>IA</b>.` escrito a mano.
> Mientras eso no salga al JSON, el titular del hero **no se puede reemplazar por una oferta**. Para
> cuando Visu/PAIton lo liberen, el par que propongo es:
> `titulo_1: "NUEVE SERVICIOS TI"` · `titulo_2: "con precio publicado."`
> Hoy esa edición no tiene efecto y por eso **no va** en el bloque JSON del final.

### /02 Il Cuore

| Ruta JSON | Hoy | Propuesto |
|---|---|---|
| `il_cuore.ia.titulo[0]` | `soluciones tecnológicas` | `precio neto publicado,` |
| `il_cuore.ia.titulo[1]` | `inteligencia artificial` | `alcance cerrado` |
| `il_cuore.ia.titulo[2]` | `& alma Creativa` | `& la glosa redactada` |

Tres cosas que el comprador necesita, no tres cosas que nosotros somos. El `&` se conserva porque
`construir.mjs:160` lo exige (`titulo[2].replace(/^&\s*/,'')` y luego lo reinyecta como `<i class="amp">`).

| Ruta JSON | Hoy | Propuesto |
|---|---|---|
| `il_cuore.ia.parrafo` | `Hablamos humano en un mundo digital.\nSomos un equipo de agentes con súper inteligencia, creados con un propósito: Ayudar al Estado a gestionar requerimientos de manera ágil, combatiendo la burocracia paralizante y creando experiencias digitales que simplifiquen la vida.` | `Hablamos humano en un mundo digital.\nUsted tiene presupuesto por ejecutar, una licencia que se le vence y un equipo que llegó en caja y sigue en caja. Publicamos nueve servicios con su valor neto —el que va en la orden de compra— y la lista de lo que no entra, antes de que pida la cotización.` |

**Qué cambia y qué no:** la primera línea es marca de Visu y **se conserva intacta**. La segunda pasa de
hablar de nosotros a describir el escritorio del lector. Medido: 256 ch contra 233 de la actual (+10 %,
no rompe la caja de 914 u) y mete 4 términos de oficio donde había 0. **Y desaparece «combatiendo la
burocracia paralizante»**, que es la frase que le dice al visitante que él es el problema.

| Ruta JSON | Hoy | Propuesto | Por qué |
|---|---|---|---|
| `il_cuore.accesos[0].texto` | `Creative` | `Ver los nueve, con precio` | Un rótulo de sección no es un llamado a la acción |
| `il_cuore.accesos[1].texto` | `Contacto` | `Pedir cotización` | ídem |
| `il_cuore.accesos[1].ancla` | `#contacto` | `#inbox` | `#contacto` es una línea de correo; `#inbox` es el formulario. El botón de conversión tiene que apuntar al formulario |

### /03 L'Intelligence — Grace System

| Ruta JSON | Hoy | Propuesto |
|---|---|---|
| `grace.linea` | `La agente Grace monitorea a diario las publicaciones de Mercado\nPúblico y filtra por rubro y presupuesto antes de que alguien mire.` | `La agente Grace revisa a diario lo que publica Mercado\nPúblico y filtra por rubro y presupuesto. Si le cotizamos,\nsu compra ya pasó ese filtro.` |

La actual describe la máquina y se detiene. La nueva agrega el «y a mí qué»: si llega una cotización
nuestra, no es un disparo al aire. 142 ch contra 130, tres líneas de ≤58 ch (la caja es de 760 u).

| Ruta JSON | Hoy | **Opción A (recomendada)** | **Opción B (de respaldo)** |
|---|---|---|---|
| `grace.franja[1].cifra` | `5` | `$360.000` | `100` |
| `grace.franja[1].glosa` | `DÍAS HÁBILES DESDE SU ORDEN` | `NETO · EL SERVICIO MÁS BARATO` | `UTM: NINGUNO PASA ESE TOPE` |

**Por qué hay que sacar el «5» sí o sí:** no tiene fuente. Lo escribí yo el 03-10 citando un
`plazoHabiles` de SP-07 que **no existe en el repo** (`grep -r plazoHabiles` → 0 resultados en `.mjs`,
`.json` y `.js`), y `portafolio.html` no publica un solo plazo. Es la cifra más vendedora de la página
y la única sin respaldo: eso es exactamente lo que el «0 — COMPRUÉBELO» de al lado existe para no ser.

**A es la fuerte** — un precio en la banda de cifras es lo único que convierte a un comprador con
presupuesto, y es `DATO`: SP-07 = $360.000 neto, en el TSV y publicado en el portafolio.
**Riesgo medido, y es de Visu:** `.franja b` es `clamp(28px,4.6vw,56px)` en 3 columnas de `1fr`; a 390 px
la columna mide ~123 px y 8 caracteres a 28 px ocupan ~123 px — **justo en el borde**. Se verifica con
`python _medir.py` (ya prueba desborde a 390 px). Si desborda, entra B, que ocupa el mismo hueco que
el «5» de hoy y también es `DATO`: el bruto más alto de los nueve es 37,6 UTM (ver §4).

| Ruta JSON | Hoy | Propuesto |
|---|---|---|
| `grace.cta` | `Ver los nueve servicios, con su precio` | `Ver los nueve servicios, desde $360.000 neto` |

**Es el cambio de mayor retorno de todo el documento y cuesta ocho caracteres.** «con su precio» obliga
a un clic para saber si alcanza el presupuesto; «desde $360.000 neto» lo responde antes del clic.
44 ch en una caja de 560 u. `DATO`.

| Ruta JSON | Hoy | Propuesto |
|---|---|---|
| `grace.envivo.barrido` | *(5 frases, 73 palabras)* | `Grace revisa las publicaciones todos los días y filtra por rubro y presupuesto. De cada oportunidad pertinente emite un veredicto: GO deja la propuesta armada para que la revise una persona; NO-GO deja escrita la razón de no proceder. El panel muestra cómo se ve ese resultado.` |

Mismo contenido, 46 palabras en vez de 73. Es la corrección de Sebastián del 14-09 («hay mucho texto:
siguen explicando lo que hacen en cada paso al público»), aplicada donde todavía no se aplicó.
**`grace.envivo.estado` se queda en `EJEMPLO`** y las filas no llevan código ni fecha: así no pueden
envejecer, que es el modo real en que esto se rompió el 03-10.

### /05 Inbox — el formulario

| Ruta JSON | Hoy | Propuesto | Por qué |
|---|---|---|---|
| `inbox.antetitulo` | `RUN · FORMULARIO DE COTIZACIÓN` | `RUN · COTIZACIÓN PARA SU ORDEN DE COMPRA` | «formulario» describe el campo; «para su orden de compra» describe el resultado |
| `inbox.titulo_1` | `GESTIONA UNA` | `COTICE SU` | «gestionar» es nuestro verbo; «cotizar» es el suyo. Y pasa a usted |
| `inbox.titulo_2` | `COMPRA ÁGIL` | `COMPRA ÁGIL` | **sin cambio**: es el término de oficio más valioso de la página |
| `inbox.campos.mensaje` | `Detalla tus requerimientos` | `Qué necesita cotizar` | tú → usted, y más corto |
| `inbox.placeholders.nombre` | `Cómo te llamas` | `Nombre y apellido` | ídem |
| `inbox.placeholders.mensaje` | `Qué necesitas comprar, cantidades, plazo y presupuesto estimado` | `Qué necesita comprar, cantidades, plazo y presupuesto estimado` | ídem |
| `inbox.boton` | `ENVIAR` | `PEDIR COTIZACIÓN` | «Enviar» no promete nada. (También viaja a `window.COMPAI.sitio.inbox.boton`: el JS lo restaura solo) |
| `inbox.nota` | `Recibes la respuesta, no un acuse de recibo.` | `Recibe una propuesta con precio y alcance, no un acuse de recibo.` | Dice **qué** llega |
| `inbox.exito` | `Listo. Tu mensaje llegó a hola@compai.cl — te respondemos hoy mismo.` | `Listo. Su mensaje llegó a hola@compai.cl. La respuesta va con precio y alcance, no con un acuse de recibo.` | **«hoy mismo» es un compromiso que nadie está operando**: Jun dejó de despachar solo el 10-sep. Un plazo incumplido en el primer contacto cuesta el cliente completo |
| `inbox.error` | `No se pudo enviar. Escríbenos directo a hola@compai.cl.` | `No se pudo enviar. Escríbanos a hola@compai.cl y adjunte las bases.` | Recupera la conversión en vez de solo informar la falla |
| `inbox.campos.idmp` | `ID Mercado Público (opcional)` | `ID Mercado Público (opcional)` | **sin cambio**: es el mejor campo del formulario |

> **Para PAIton, y es lo único del embudo que no se arregla con texto:**
> `construir.mjs:274` marca el teléfono como `required`. Pedir teléfono obligatorio a un funcionario
> que todavía no vio un precio es el punto de abandono más caro de la página. **Quítale `required`.**
> Si se quita, el rótulo pasa a `Teléfono (solo si prefiere que lo llamemos)`; mientras sea
> obligatorio **el rótulo se queda como está**, porque rotular «opcional» un campo que bloquea el
> envío es peor que no cambiar nada.

### /04 Creative y /06 Hablemos

| Ruta JSON | Hoy | Propuesto | Nota |
|---|---|---|---|
| `menu[3].nombre` + `creative.nombre` | `Creative` | `Servicios` | **Los dos juntos o `revisar.mjs:48` falla**: exige correspondencia 1 a 1 entre `/0X` y nombre, y el menú y el rótulo de sección usan claves distintas. **Requiere OK de Visu**: el set Offenbar / Il Cuore / L'Intelligence / Creative es marca, no mío. Mi razón: es el rótulo de la única sección que vende, en inglés, para un comprador municipal |
| `menu_aside.kicker` | `¿Necesitas ayuda con un proyecto?` | `Pida su cotización a` | Lee «Pida su cotización a / hola@compai.cl» |
| `menu_aside.enlaces[0].texto` | `Catálogo de servicios y precios` | `Los nueve servicios, desde $360.000 →` | El precio también en el menú |
| `contacto_seccion.pregunta_lineas[0]` | `¿Necesitas ayuda con un proyecto?` | `¿Tiene presupuesto por ejecutar y un requerimiento sin cotizar?` | Tercera vez que la página hace la misma pregunta genérica. Esta nombra su situación real |
| `contacto_seccion.pregunta_lineas[1]` | `Envíanos un correo a` | `Escríbanos a` | tú → usted |

**Lo que NO toco, y por qué:** `contacto.whatsapp` se queda vacío. El manual de marca prohíbe el móvil
fuera de la firma y la tarjeta, y esa regla es de Visu. **Pero dejo la objeción escrita:** la regla
prohíbe el **móvil personal del Director**, no una línea corporativa. Hoy la página tiene un solo canal
—correo— para un comprador que necesita confirmar algo en dos minutos antes del cierre de una Compra
Ágil. Una línea WhatsApp Business a nombre de la empresa no incumple el manual. Decide Visu.

---

## 3 · Las 4 tarjetas de `servicios.json`, con ojo de comprador

Las tres preguntas: **¿sabe qué recibe? ¿en cuántos días? ¿por cuánto?**

| # | slug | Qué recibe | En cuántos días | Por cuánto |
|---|---|---|---|---|
| 01 | `automatizacion` | **Sí.** Las 5 viñetas son concretas y la lámina nombra el acta y la rendición | **No** | **No** (bloqueado por `revisar.mjs`) |
| 02 | `especificacion` | **Sí**, y la lámina 3 es el mejor párrafo del sitio | **No** | **No** |
| 03 | `continuidad` | **Sí** | **Dice «esta semana» y nada lo respalda** | **No** |
| 04 | `catalogo` | **Sí** | **Promete un plazo que la ficha no trae** | Remite al portafolio |

**El copy de estas cuatro ya funciona y no lo voy a reescribir para parecer productivo.** Lo que falla es
otra cosa: ninguna dice cuándo ni cuánto, y dos prometen plazos inexistentes. Cambio cuatro cosas.

| Ruta JSON | Hoy | Propuesto | Por qué |
|---|---|---|---|
| `[2].bajada` (`continuidad`) | `Que lo que ya compró quede andando **esta semana**, y siga andando los doce meses siguientes sin que nadie lo vigile a mano.` | `Que lo que ya compró **deje de estar en la caja**, y siga andando los doce meses siguientes sin que nadie lo vigile a mano.` | **«esta semana» es el mismo defecto que el «5»**: un plazo publicado que nada respalda. «Deje de estar en la caja» dice lo mismo sin comprometer un día. 119 ch |
| `[3].bajada` (`catalogo`) | `Nueve servicios en tres líneas, cada uno con su valor publicado: el neto que va en la orden de compra y lo que NO entra.` | `Nueve servicios con su valor neto publicado y lo que no entra. Ninguno pasa las 100 UTM: los nueve van por Compra Ágil.` | **«100 UTM» pasa el filtro de precios** (`/\$\s*\d/` no lo atrapa) y es el dato que más vende de todo el catálogo: **puede comprar cualquiera de los nueve sin licitar.** 118 ch |
| `[3].lamina[0]` (`catalogo`) | `…trae lo mismo: el valor, el neto que va en la orden de compra, **el plazo en días hábiles** y las dos listas completas…` | `Nueve servicios repartidos en tres líneas, y cada ficha trae lo mismo: el valor, el neto que va en la orden de compra y las dos listas completas, la de lo que entra y la de lo que no entra. Las dos, antes de que usted pida la cotización.` | **Falsedad verificable: `portafolio.html` tiene CERO «días hábiles».** Se saca la promesa hoy; el arreglo de verdad es publicar el plazo (§4). 49 palabras |
| `[0].lamina[2]` (`automatizacion`) | `Se cotiza por entregable y **jamás por hora**…` | `Se cotiza por entregable **y no por hora trabajada**…` | «Jamás por hora» es un absoluto que SP-11 del catálogo rompe: es la única unidad-hora que existe ($58.500/h). Un comprador que lo note deja de creer el resto |
| `[0..2].cta` | `Solicitar cotización` | `Pedir precio y plazo` | Nombra **lo que llega de vuelta**. `js/sitio.js:306` lo pinta en la lámina; sin `cta_url` sigue yendo a `#inbox`, que es donde debe ir |

**Y una recomendación de orden que sí cambia la plata, aunque no sea copy.** Hoy la primera tarjeta es
`automatizacion`, cuyo producto de entrada (SP-01, mensajería) depende de que Meta apruebe plantillas
—riesgo declarado en el TSV, fuera de nuestro control— y necesita un tercero. La segunda es
`especificacion`, cuyo producto de entrada (SP-04, $480.000 neto) **no depende de nadie**: el TSV lo dice
textual, «el entregable es texto propio y no depende de terceros», 75 % de margen, y es la puerta por la
que ya emití GO el 30-09. **Poner primero el producto con riesgo de proveedor y segundo el de margen
puro sin terceros está al revés.** El cambio es mecánico: intercambiar los elementos 0 y 1 del array
**y sus `codigo`** (`01`↔`02`), porque `construir.mjs:228` elige el color de las viñetas por `codigo`
y así la alternancia azul/ámbar se conserva. Los mockups (teléfono/monitor) son decorativos.
**No lo meto en el bloque JSON: es reordenar el array completo y eso lo aplica Visu con la captura a la vista.**

---

## 4 · Los nueve del portafolio — lo que el comprador no puede saber

Estos nueve están en `C:\Users\sebas\CompAI\portafolio.html` escritos a mano. **No es mi archivo y no
lo toco**, así que van como reemplazos exactos para quien lo opere. Netos leídos del TSV y del HTML
publicado; UTM calculada con **UTM oct-2026 = $72.151**, que medí en sii.cl el 30-09.

| Cód | Servicio | Neto `DATO` | Bruto `DATO` | UTM bruto `DATO` | Horas TSV | Días hábiles `SUPUESTO` |
|---|---|---|---|---|---|---|
| SP-01 | Avisos y recordatorios por WhatsApp conectados a su sistema | $504.000 | $599.760 | 8,3 | 12 | 6 |
| SP-02 | Automatización de un proceso administrativo | $900.000 | $1.071.000 | 14,8 | 20 | 8 |
| SP-03 | Desarrollo a medida o integración entre sistemas, por hitos | $2.280.000 | $2.713.200 | 37,6 | 60 | por hito (30/40/30) |
| SP-04 | Informe corto de especificación técnica | $480.000 | $571.200 | 7,9 | 8 | 5 |
| SP-05 | Especificación técnica para bases de licitación | $1.200.000 | $1.428.000 | 19,8 | 20 | 8 |
| SP-06 | Evaluación comparada de alternativas | $720.000 | $856.800 | 11,9 | 12 | 6 |
| SP-07 | Puesta en marcha de licencias y equipos ya comprados | $360.000 | $428.400 | 5,9 | 8 | 5 |
| SP-08 | Migración de sitio, correo, dominio y certificado | $720.000 | $856.800 | 11,9 | 16 | 7 |
| SP-09 | Plan de mantención de sistemas, 12 meses | $2.160.000 | $2.570.400 | 35,6 | 48 | plan anual |

**El hallazgo comercial más grande de este documento está en la columna UTM:** el más caro de los nueve
es **37,6 UTM** contra un tope de Compra Ágil de 100 UTM = **$7.215.100**. O sea, **los nueve se compran
sin licitar, sin garantía y sin comisión de evaluación.** Eso no está escrito en ninguna parte del sitio.
Es verificable, es de oficio y es lo que destraba la compra. Va a `servicios.json[3].bajada` (§3).

### Los cuatro reemplazos exactos para `portafolio.html`

1. **`valor desde` → `precio cerrado`** en SP-01, SP-02, SP-03, SP-07 y SP-08
   (`<span class="cw-cond">valor desde</span>`). Son **cinco de nueve**, y contradicen la viñeta
   «Precio cerrado antes de empezar» de la home. El TSV dice «Proyecto cerrado, **precio total**»:
   el dato está de nuestro lado, el error es solo el rótulo. **«Desde» es la palabra que más conversión
   cuesta en toda la vitrina**, porque le dice al comprador que el número que está leyendo no es el final.

2. **Agregar una línea de plazo a cada tarjeta**, junto al precio:
   `<p class="cw-plazo">Entrega en <b>N días hábiles</b> <span>· contados desde su orden de compra</span></p>`
   con los N de la tabla. **Marcado `SUPUESTO` y requiere tu firma antes de publicarse.** El número no
   sale de ninguna entrega hecha —CompAI no ha emitido una factura (log 29-09)— sino de una regla que
   construyo a la vista: `días = ceil(horas ÷ 4) + 3`, cuatro horas productivas al día sobre un proyecto
   más tres días de coordinación. **Un plazo publicado es una obligación contractual: no lo publico yo
   solo.** Y mientras no esté publicado, el «5» de la franja no vuelve.

3. **Mover el «Recomendado» de SP-06 a SP-04** en la línea L2 (`data-dest="1"`). El anclaje clásico
   recomienda el del medio; con **0 ventas** el objetivo no es el ticket mayor, es la **primera orden**.
   SP-04 cuesta $480.000, está 51 % bajo la mediana de su UNSPSC por diseño (TSV, 80101507 PU mediana
   $980.000, n=83) y no necesita proveedor. Y es el único de los nueve sobre el que ya hay un GO escrito.

4. **Arreglar la cabecera antes de mandarle tráfico**, que es lo que hacen el CTA de /03 y el menú:
   medido hoy, `portafolio.html` tiene **6 `<h1>`**, **sin `meta description`**, y `<title>` =
   «Portafolio — CompAI · registros cine (CinemAI)» — **el nombre de un agente interno en la pestaña del
   navegador del comprador**. No pasa por `revisar.mjs`, que solo audita `index.html`. Esto es de PAIton.
   Y la palabra «Portafolio» promete trabajo hecho y entrega una lista de precios: con 0 ventas es la
   peor pregunta que podemos provocar. **Rótulo propuesto: «Servicios y precios».**

---

## 5 · Veredicto y corte

**GO CONDICIONADO.** El copy de §2 y §3 se aplica hoy: es reversible, pasa las dos compuertas y no
compromete nada que no podamos cumplir. Lo condicionado es el plazo.

| Condición | Quién | Cuándo |
|---|---|---|
| Firmar o rechazar los días hábiles `SUPUESTO` de §4 punto 2 | Sebastián | antes de publicar el plazo |
| Medir `$360.000` en la franja a 390 px (`python _medir.py`); si desborda, entra la Opción B | Visu | antes del push |
| Quitar `required` del teléfono (`construir.mjs:274`) | PAIton | antes del push |
| Decidir `Creative` → `Servicios` (los dos campos juntos) | Visu | antes del push |
| Arreglar `<title>`, 6 `<h1>` y `meta description` de `portafolio.html` | PAIton | antes de mandarle tráfico |

**Corte que me mide a mí: 31-10-2026.** ≥1 contacto entrante que **nombre un servicio o un código SP**.
Si a esa fecha hay 0, el problema no es el copy: es que la página no recibe visitas y el embudo hay que
abrirlo por fuera (correo saliente), no por dentro. Línea base de hoy, para que el número signifique
algo: **0 cotizaciones enviadas, 0 facturas emitidas, 0 ventas en el Estado.** Evento creado en el
calendario de CompAI; es compromiso interno mío, no plazo de un tercero.

**Lo que NO se hace, por tentador que sea:** no se inventa un cliente, un logo ni un testimonio;
no vuelve el «5 días hábiles» hasta que esté en las nueve fichas; no se dice «respondemos hoy mismo»
mientras nadie opere la bandeja; y el «0 — VENTAS EN EL ESTADO: COMPRUÉBELO» no se toca ni se suaviza:
**es el número más creíble que tenemos y nadie más lo publica.**

---

## JSON PARA APLICAR

Solo las claves que cambian. `sitio.json` primero, `servicios.json` después. Las que requieren OK de
otro agente van en la tabla de abajo, no dentro del bloque — el JSON tiene que quedar válido al pegar.

```json
{
  "meta": {
    "title": "compAI — Servicios TI para el Estado, con precio publicado",
    "description": "Nueve servicios de TI con su precio neto publicado, el que va en la orden de compra. Compra Ágil bajo 100 UTM. Santiago."
  },
  "menu_aside": {
    "kicker": "Pida su cotización a",
    "enlaces": [
      { "texto": "Los nueve servicios, desde $360.000 →", "url": "/portafolio.html#servicios" },
      { "texto": "Ficha proveedores del Estado →", "url": "https://proveedor.mercadopublico.cl/ficha/78.491.451-8" }
    ]
  },
  "offenbar": {
    "titulo_1": "TECNOLOGÍA PARA EL ESTADO"
  },
  "il_cuore": {
    "ia": {
      "titulo": [
        "precio neto publicado,",
        "alcance cerrado",
        "& la glosa redactada"
      ],
      "parrafo": "Hablamos humano en un mundo digital.\nUsted tiene presupuesto por ejecutar, una licencia que se le vence y un equipo que llegó en caja y sigue en caja. Publicamos nueve servicios con su valor neto —el que va en la orden de compra— y la lista de lo que no entra, antes de que pida la cotización."
    },
    "accesos": [
      { "texto": "Ver los nueve, con precio", "ancla": "#creative" },
      { "texto": "Pedir cotización", "ancla": "#inbox" }
    ]
  },
  "grace": {
    "linea": "La agente Grace revisa a diario lo que publica Mercado\nPúblico y filtra por rubro y presupuesto. Si le cotizamos,\nsu compra ya pasó ese filtro.",
    "cta": "Ver los nueve servicios, desde $360.000 neto",
    "envivo": {
      "barrido": "Grace revisa las publicaciones todos los días y filtra por rubro y presupuesto. De cada oportunidad pertinente emite un veredicto: GO deja la propuesta armada para que la revise una persona; NO-GO deja escrita la razón de no proceder. El panel muestra cómo se ve ese resultado."
    },
    "franja": [
      { "cifra": "9", "glosa": "SERVICIOS CON PRECIO PUBLICADO" },
      { "cifra": "$360.000", "glosa": "NETO · EL SERVICIO MÁS BARATO" },
      { "cifra": "0", "glosa": "VENTAS EN EL ESTADO: COMPRUÉBELO" }
    ]
  },
  "inbox": {
    "antetitulo": "RUN · COTIZACIÓN PARA SU ORDEN DE COMPRA",
    "titulo_1": "COTICE SU",
    "titulo_2": "COMPRA ÁGIL",
    "boton": "PEDIR COTIZACIÓN",
    "nota": "Recibe una propuesta con precio y alcance, no un acuse de recibo.",
    "exito": "Listo. Su mensaje llegó a hola@compai.cl. La respuesta va con precio y alcance, no con un acuse de recibo.",
    "error": "No se pudo enviar. Escríbanos a hola@compai.cl y adjunte las bases.",
    "campos": {
      "nombre": "Nombre y apellido",
      "correo": "Correo electrónico",
      "telefono": "Teléfono de contacto",
      "mensaje": "Qué necesita cotizar",
      "idmp": "ID Mercado Público (opcional)"
    },
    "placeholders": {
      "nombre": "Nombre y apellido",
      "correo": "nombre@institucion.cl",
      "telefono": "+56 9 1234 5678",
      "mensaje": "Qué necesita comprar, cantidades, plazo y presupuesto estimado",
      "idmp": "1057417-15390-AG26"
    }
  },
  "contacto_seccion": {
    "pregunta_lineas": [
      "¿Tiene presupuesto por ejecutar y un requerimiento sin cotizar?",
      "Escríbanos a"
    ]
  }
}
```

**`servicios.json` — solo los campos que cambian, identificados por `slug`:**

```json
[
  {
    "slug": "automatizacion",
    "cta": "Pedir precio y plazo",
    "lamina_2": "Se cotiza por entregable y no por hora trabajada: usted no termina discutiendo cuántas horas fueron. Al cierre se entrega el acta de puesta en marcha y la documentación de operación de su equipo, que es exactamente lo que la rendición de la orden de compra necesita."
  },
  {
    "slug": "especificacion",
    "cta": "Pedir precio y plazo"
  },
  {
    "slug": "continuidad",
    "bajada": "Que lo que ya compró deje de estar en la caja, y siga andando los doce meses siguientes sin que nadie lo vigile a mano.",
    "cta": "Pedir precio y plazo"
  },
  {
    "slug": "catalogo",
    "bajada": "Nueve servicios con su valor neto publicado y lo que no entra. Ninguno pasa las 100 UTM: los nueve van por Compra Ágil.",
    "lamina_0": "Nueve servicios repartidos en tres líneas, y cada ficha trae lo mismo: el valor, el neto que va en la orden de compra y las dos listas completas, la de lo que entra y la de lo que no entra. Las dos, antes de que usted pida la cotización."
  }
]
```

> `lamina_2` y `lamina_0` **no son claves nuevas**: son el índice 2 y el índice 0 del array `lamina`
> existente. Se reemplaza ese elemento y los otros dos quedan intactos. Los nombré así porque un
> `"lamina[2]"` dentro de un JSON pegable sería una clave literal y eso rompería la lámina.
> El `cta` de `catalogo` («Ver los nueve, con precio») y su `cta_url` **no cambian**.

**Fuera del bloque, porque la decisión es de otro:**

| Clave | Valor propuesto | Quién decide |
|---|---|---|
| `menu[3].nombre` **y** `creative.nombre` | `"Servicios"` (los dos, o `revisar.mjs` falla) | Visu |
| `grace.franja[1]` respaldo si desborda a 390 px | `{ "cifra": "100", "glosa": "UTM: NINGUNO PASA ESE TOPE" }` | Visu, con `_medir.py` |
| `offenbar.titulo_1` / `titulo_2` | `"NUEVE SERVICIOS TI"` / `"con precio publicado."` | PAIton: primero hay que sacar la línea fija de `construir.mjs:143` |
| `inbox.campos.telefono` | `"Teléfono (solo si prefiere que lo llamemos)"` | PAIton: solo si quita `required` |
| `contacto.whatsapp` | una línea WhatsApp Business corporativa | Visu + manual de marca |

**Validación corrida antes de entregar, no después:** 0 palabras prohibidas de `probar_copy.py`
(decreto · reglamento · artículo · ley n° · normativa · procedimiento · diario oficial);
5 de los 9 términos de oficio presentes (mínimo 3); `title` 58 ch y `description` 118 ch dentro de
los topes de `revisar.mjs`; 4 servicios con 5 viñetas cada uno, todas ≤42 ch; láminas de 46-50
palabras por párrafo, 3 párrafos cada una; `0` coincidencias de `/ta\s*rifa|\$\s*\d/` en los textos
nuevos de `servicios.json`. **Ningún precio, plazo ni cifra de este documento es inventado:** los
netos salen del TSV y del HTML publicado, la UTM de sii.cl (30-09), y lo único que no está medido
—los días hábiles— va rotulado `SUPUESTO` con su fórmula a la vista y sin publicarse hasta tu firma.
