/* compai.cl · revisor del sitio armado (tema claro, 15-11-2026).
   Vuelve ejecutables las correcciones del informe técnico del 01-10-2026 que
   siguen vigentes, los mínimos de marca y lo que el lienzo aprobado exige.
   Corre solo en CI; a mano:  node revisar.mjs
   Falla ruidosamente: un sitio que no falla no es un sitio que esté bien. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const leer = f => readFileSync(join(raiz, f), 'utf8');
const html = leer('index.html');
const port = leer('portafolio.html');
const sitio = JSON.parse(leer('contenido/sitio.json'));
const lineas = JSON.parse(leer('contenido/lineas.json')).lineas;
const fallos = [];
const mal = (m) => fallos.push(m);

/* ── las correcciones del informe que siguen vivas ───────────────────── */
for (const [nombre, t] of [['index.html', html], ['portafolio.html', port]]) {
  if (/Copyrighting/i.test(t)) mal(`${nombre}: «Copyrighting» sigue en la pagina: es Copywriting.`);
  if (/lavando/i.test(t)) mal(`${nombre}: «campo de lavando»: es lavanda.`);
  if (/materializacion por codigo/i.test(t.normalize('NFC'))) mal(`${nombre}: «materializacion por codigo» sin tildes.`);
  // el rotulo de propuesta del lienzo no se publica (Sebastian, 15-11-2026)
  if (/futuro minimalista/i.test(t)) mal(`${nombre}: el rotulo «tema claro · futuro minimalista» es del lienzo, no del sitio.`);
  if (/\/_blob\//.test(t)) mal(`${nombre}: quedo una imagen del lienzo (/_blob/): hay que mapearla a media/.`);
  if (/fonts\.googleapis\.com/.test(t)) mal(`${nombre}: carga fuentes de Google; las fuentes se sirven desde el propio sitio.`);
}

// Numeración / 01–/ 06: cada código rotula UNA sección y cada nombre lleva UN código.
const pares = [...html.matchAll(/>\/\s*0(\d)\s+([^<"]{1,30}?)\s*</g)].map(m => [m[1], m[2].trim()]);
const porCodigo = new Map(), porNombre = new Map();
for (const [c, n] of pares) {
  (porCodigo.get(c) || porCodigo.set(c, new Set()).get(c)).add(n);
  (porNombre.get(n) || porNombre.set(n, new Set()).get(n)).add(c);
}
if ([...porCodigo.keys()].sort().join('') !== '123456')
  mal(`numeracion /01–/06 incompleta: hay ${[...porCodigo.keys()].sort().join(',') || 'ninguna'}`);
for (const [c, ns] of porCodigo)
  if (ns.size !== 1) mal(`el codigo /0${c} rotula ${ns.size} secciones distintas: ${[...ns].join(' · ')}`);
for (const [n, cs] of porNombre)
  if (cs.size !== 1) mal(`«${n}» aparece con ${cs.size} codigos distintos: ${[...cs].map(x => '/0' + x).join(' ')}`);
// / 05 es Run (formulario) y / 06 es Inbox (correo): Sebastian, 15-11-2026
if (!/\/ 05 Run</.test(html)) mal('/ 05 no se llama Run.');
if (!/\/ 06 Inbox</.test(html)) mal('/ 06 no se llama Inbox.');

// el video del hero: autoplay, mudo, bucle, póster y SIN controles
const video = html.match(/<video[^>]*id="heroVideo"[^>]*>/);
if (!video) mal('no hay video en el hero.');
else {
  const v = video[0];
  for (const a of ['muted', 'loop', 'playsinline', 'autoplay', 'poster'])
    if (!v.includes(a)) mal(`al video del hero le falta «${a}».`);
  if (/\scontrols[\s>=]/.test(v)) mal('el video del hero muestra controles.');
}
for (const v of html.match(/<video\b[^>]*>/g) || [])
  if (/\scontrols[\s>=]/.test(v)) mal(`un video muestra controles: ${v.slice(0, 80)}`);

// la barra de 8 iconos: 6 secciones + herramienta + huella, en el hero y en el atracadero
const barras = html.match(/<nav class="ibar[^"]*"[^>]*>[\s\S]*?<\/nav>/g) || [];
if (barras.length !== 2) mal(`tiene que haber 2 barras de iconos (hero y atracadero); hay ${barras.length}.`);
for (const b of barras) {
  const n = (b.match(/<a\b|<span class="sin"/g) || []).length;
  if (n !== 8) mal(`una barra de iconos trae ${n} iconos; son 8.`);
  if (!/href="https:\/\/compai\.cl\/estado\/"/.test(b)) mal('la huella de la barra no lleva a https://compai.cl/estado/.');
  if (/href="https:\/\/compai\.cl\/soporte\/"/.test(b)) mal('la barra enlaza /soporte/, que no existe: el icono va sin enlace hasta que exista.');
}

/* ── las cuatro líneas y el 16:9 del hero ────────────────────────────── */
const css = leer('css/claro.css');
for (const p of ['20%', '40%', '60%', '80%'])
  if (!new RegExp(`\\.lineas span:nth-child\\(\\d\\)\\{left:${p}\\}`).test(css)) mal(`falta la linea vertical al ${p}.`);
if (!/#offenbar\{[^}]*aspect-ratio:16\/9/.test(css)) mal('el hero no es 16:9 exacto (las lineas del video no calzan con las del diseno).');
if (!/@media \(max-width:860px\)/.test(css)) mal('la hoja no trae el bloque movil (max-width:860px).');

/* ── contenido ───────────────────────────────────────────────────────── */
if (lineas.length !== 5) mal(`lineas.json trae ${lineas.length}; tienen que ser 5.`);
lineas.forEach((l, i) => {
  if (l.codigo !== `L${i + 1}`) mal(`la linea ${i + 1} no es L${i + 1}: ${l.codigo}`);
  for (const k of ['titulo', 'descripcion', 'escena', 'subservicios']) if (!l[k]) mal(`a ${l.codigo} le falta «${k}».`);
  if (l.subservicios && l.subservicios.length < 3) mal(`${l.codigo}: menos de 3 sub-servicios.`);
  if (!html.includes(`portafolio.html#${l.codigo}`)) mal(`/ 04 no enlaza ${l.codigo} al catalogo.`);
  if (!port.includes(`id="${l.codigo}"`)) mal(`el catalogo no trae el detalle de ${l.codigo}.`);
  // sin precio en la vitrina: el valor se cotiza (Sebastian, 07-10-2026)
  if (/\$\s*\d/.test(JSON.stringify(l))) mal(`${l.codigo}: hay un precio en el texto publico.`);
});
const ag = sitio.contacto_seccion.agentes || [];
if (ag.length !== 15) mal(`el pie trae ${ag.length} agentes; son 15.`);
const F = sitio.grace.envivo.filas;
if (!Array.isArray(F) || F.length !== 8) mal('las filas de EJEMPLO del radar tienen que ser 8.');
if (!/RADAR EN VIVO/.test(html)) mal('falta el panel RADAR EN VIVO.');
if ((html.match(/<ul class="glista">[\s\S]*?<\/ul>/) || [''])[0].split('<li>').length - 1 !== 8) mal('el radar no pinta 8 filas.');
if (!/id="formLead"/.test(html) || !/name="archivos"/.test(html)) mal('falta el formulario / 05 con su campo de adjuntos.');
if (!sitio.formEndpoint) mal('formEndpoint vacio: el formulario caeria al mailto.');
for (const t of ['hola@compai.cl', 'B2G', 'TECNOLOGÍA PARA CHILE', 'ejecutada por IA.'])
  if (!html.toUpperCase().includes(t.toUpperCase())) mal(`al pie le falta «${t}».`);

/* ── SEO y accesibilidad ─────────────────────────────────────────────── */
for (const [nombre, t] of [['index.html', html], ['portafolio.html', port]]) {
  const exige = [
    [/<html lang="es-CL"/, 'falta lang="es-CL".'],
    [/<title>[^<]{20,70}<\/title>/, 'el title falta o no mide entre 20 y 70 caracteres.'],
    [/<meta name="description" content="[^"]{70,165}"/, 'la description falta o no mide entre 70 y 165 caracteres.'],
    [/<meta property="og:image" content="https:\/\/compai\.cl\/media\/og\.jpg"/, 'falta la imagen Open Graph.'],
    [/<link rel="canonical"/, 'falta el canonical.'],
    [/class="salto"/, 'falta el enlace de salto al contenido.'],
    [/fuente-del-sitio: sitio\/compai/, 'falta el marcador fuente-del-sitio (lo lee probar_copy.py).'],
  ];
  for (const [re, m] of exige) if (!re.test(t)) mal(`${nombre}: ${m}`);
  if ((t.match(/<h1[ >]/g) || []).length !== 1) mal(`${nombre}: tiene que haber exactamente un h1.`);
  for (const img of t.match(/<img\b[^>]*>/g) || [])
    if (!/\salt=/.test(img)) mal(`${nombre}: <img> sin alt: ${img.slice(0, 90)}`);
  for (const v of t.match(/<video\b[^>]*>/g) || [])
    if (!/aria-(hidden|label)=/.test(v)) mal(`${nombre}: <video> sin aria-hidden ni aria-label: ${v.slice(0, 80)}`);
}
if (!existsSync(join(raiz, 'sitemap.xml'))) mal('falta sitemap.xml.');
if (!existsSync(join(raiz, 'robots.txt'))) mal('falta robots.txt.');
if (!existsSync(join(raiz, 'favicon.svg'))) mal('falta favicon.svg.');
if (!existsSync(join(raiz, '404.html'))) mal('falta 404.html.');

/* ── medios: existen, pesan poco, con póster ─────────────────────────── */
const TOPE_VIDEO = 5 * 1024 * 1024;
const medios = new Set([...html.matchAll(/(?:src|poster)="(media\/[^"]+)"/g), ...port.matchAll(/(?:src|poster)="(media\/[^"]+)"/g)].map(m => m[1]));
for (const m of medios) {
  if (!existsSync(join(raiz, m))) { mal(`falta ${m}.`); continue; }
  const b = statSync(join(raiz, m)).size;
  if (/\.mp4$/.test(m) && b > TOPE_VIDEO) mal(`${m} pesa ${(b / 1048576).toFixed(1)} MB; el tope son 5 MB.`);
}
for (const v of html.match(/<video\b[^>]*>/g) || [])
  if (!/poster="/.test(v)) mal(`un video del home no tiene poster: ${v.slice(0, 80)}`);
for (const f of ['css/fuentes/spacegrotesk-var-latin.woff2', 'css/fuentes/plexmono-400-latin.woff2', 'css/fuentes/plexmono-500-latin.woff2',
                 'media/logo-compai-noche.svg', 'media/logo-compai-dia.svg', 'media/logo-compai-mono.svg'])
  if (!existsSync(join(raiz, f))) mal(`falta ${f}.`);

/* ── respeto por prefers-reduced-motion ──────────────────────────────── */
if (!/@media \(prefers-reduced-motion:reduce\)/.test(css.replace(/\s+/g, ' ').replace(/: /g, ':')))
  mal('la hoja de estilos no atiende prefers-reduced-motion.');
if (!/prefers-reduced-motion/.test(leer('js/claro.js'))) mal('js/claro.js no mira prefers-reduced-motion.');

/* ── soul/ · compai.cl/soul (26-10-2026) ─────────────────────────────── */
for (const f of ['soul/index.html', 'soul/preguntas.html', 'soul/sitio.js', 'soul/arte.js', 'soul/sitio.css', 'soul/s/index.html', 'soul/s/sitio-publico.js', 'soul/app.js', 'soul/datos.js', 'soul/marca.js', 'soul/config.js',
                 'soul/img/pie-compai-claro.png', 'soul/img/pie-alma-compai-oscuro.png',
                 'soul/ejemplo/index.html', 'soul/ejemplo/cotizacion.html', 'soul/ejemplo/agenda.html'])
  if (!existsSync(join(raiz, f))) mal(`falta ${f}.`);
if (existsSync(join(raiz, 'soul/index.html'))) {
  const sm = leer('sitemap.xml');
  if (!sm.includes('https://compai.cl/soul/')) mal('el sitemap no incluye https://compai.cl/soul/.');
  if (!sm.includes('https://compai.cl/soul/ejemplo/')) mal('el sitemap no incluye /soul/ejemplo/.');
  for (const f of ['soul/index.html', 'soul/preguntas.html', 'soul/ejemplo/index.html', 'soul/ejemplo/cotizacion.html', 'soul/ejemplo/agenda.html']) {
    const t = leer(f);
    if (!/<div class="pie-compai"><img src="img\/pie-(compai-claro|alma-compai-oscuro)\.png"/.test(t)) mal(`${f}: falta el pie oficial de marca.`);
    for (const img of t.match(/<img\b[^>]*>/g) || []) if (!/\salt=/.test(img)) mal(`${f}: <img> sin alt.`);
  }
  if (!/pie-compai\{width:113\.4px;height:14\.4px;overflow:hidden/.test(leer('soul/soul.css'))) mal('soul.css: el pie no tiene la medida de 4.b.');
  const gs = existsSync(join(raiz, 'apps-script/Code.gs')) ? leer('apps-script/Code.gs') : '';
  const dd = leer('soul/datos.js');
  for (const [pl, mes, anual] of [['fresh', 9990, 99900], ['sun', 19990, 199900], ['vibe', 39990, 399900]]) {
    if (!new RegExp(`label: '${pl}'[^}]*mes: ${mes}, anual: ${anual}`).test(dd)) mal(`soul/datos.js: precio de ${pl} distinto de $${mes}/$${anual}.`);
    if (gs && !new RegExp(`"${pl}": \\{[^}]*"bruto": ${mes},[^}]*"anual": ${anual}`).test(gs)) mal(`Code.gs: precio de ${pl} distinto del de SOUL.`);
  }
  if (gs && !/d\.tipo === 'soul'/.test(gs)) mal('Code.gs no recibe el tipo «soul».');
  if (!html.includes('href="soul/"') || !port.includes('href="soul/"')) mal('el sello SOUL no lleva a soul/ en el home y el catalogo.');
}

/* ── resultado ───────────────────────────────────────────────────────── */
if (fallos.length) {
  console.error(`revisar: ${fallos.length} problema(s)`);
  for (const f of fallos) console.error('  x ' + f);
  process.exit(1);
}
console.log(`revisar: OK — 5 lineas L1–L5, /01–/06 sin duplicados, 2 barras de 8 iconos, hero 16:9 sin controles, ` +
            `${(html.match(/<img\b/g) || []).length + (port.match(/<img\b/g) || []).length} imagenes con alt, ${medios.size} medios presentes y bajo 5 MB.`);
