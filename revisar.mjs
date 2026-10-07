/* compai.cl · revisor del sitio armado.
   Vuelve ejecutables las 11 correcciones del informe tecnico del 01-10-2026 y
   los minimos de marca. Corre solo en CI; a mano:  node revisar.mjs
   Falla ruidosamente: un sitio que no falla no es un sitio que este bien. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const leer = f => readFileSync(join(raiz, f), 'utf8');
const html = leer('index.html');
// Sin los comentarios: una etiqueta citada dentro de un comentario no es una
// etiqueta de la pagina, y hacerla fallar manda a corregir lo que no esta roto.
const htmlSinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
const serv = JSON.parse(leer('contenido/servicios.json'));
const sitio = JSON.parse(leer('contenido/sitio.json'));
const fallos = [];
const mal = (m) => fallos.push(m);

/* ── las 11 correcciones del informe ─────────────────────────────────── */
if (/Copyrighting/i.test(html)) mal('«Copyrighting» sigue en la pagina: es Copywriting.');
if (/lavando/i.test(html)) mal('«campo de lavando»: es lavanda.');
if (/Materializacion|materializacion/.test(html.normalize('NFC')))
  mal('«Materializacion» sin tildes: es «Materialización por código».');
// Los pies «Grace ___ con efecto materializacion por codigo» SE QUITARON el
// 02-10-2026. Sebastian: «son instruccion, no informacion para publicar». La
// correccion 5 del informe era de ORTOGRAFIA —que llevaran tildes si estaban—,
// no una orden de que estuvieran; asi que esto deja de exigirse y queda la
// regla que sigue viva: si la frase aparece, va con tildes.
if (/materializacion por codigo/i.test(html.normalize('NFC')))
  mal('«materializacion por codigo» sin tildes.');

// Numeracion /01–/06. El error del informe era «dos / 05 y un / 06»: un mismo
// codigo puesto sobre DOS secciones distintas. Cada codigo aparece dos veces a
// proposito —en el menu y sobre su seccion—, asi que lo que se comprueba es la
// correspondencia uno a uno entre codigo y nombre, no cuantas veces sale.
const pares = [...html.matchAll(/\/\s*0(\d)\s*—\s*(?:<b>)?([^<]{2,40}?)(?:<\/b>)?\s*</g)]
  .map(m => [m[1], m[2].trim()]);
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

// el video del hero: autoplay, mudo, bucle y SIN controles
const video = html.match(/<video[^>]*id="heroVideo"[^>]*>/);
if (!video) mal('no hay video en el hero.');
else {
  const v = video[0];
  for (const a of ['muted', 'loop', 'playsinline', 'autoplay', 'poster'])
    if (!v.includes(a)) mal(`al video del hero le falta «${a}».`);
  if (/\scontrols[\s>=]/.test(v)) mal('el video del hero muestra controles.');
}

// el menu existe y funciona: seis entradas, boton con aria y panel con id
if ((html.match(/class="it"/g) || []).length !== 6) mal('el menu no tiene exactamente 6 entradas.');
if (!/id="nodoBtn"[^>]*aria-expanded/.test(html)) mal('el nodo no declara aria-expanded.');
if (!/<nav class="menu" id="menu"/.test(html)) mal('falta el panel del menu.');

// mockups sin la imagen de ejemplo de Canva
for (const s of serv) {
  if (!s.imagen) mal(`el servicio «${s.slug}» no trae imagen para la lamina.`);
  else if (!existsSync(join(raiz, s.imagen))) mal(`no existe ${s.imagen} (servicio ${s.slug}).`);
  if (!s.imagen_alt) mal(`la imagen de «${s.slug}» no tiene texto alternativo.`);
}

/* ── estructura de contenido ─────────────────────────────────────────── */
if (serv.length !== 4) mal(`servicios.json trae ${serv.length}; tienen que ser 4.`);
const vistos = new Set();
for (const s of serv) {
  for (const k of ['slug', 'codigo', 'titulo', 'bajada', 'vinetas', 'lamina', 'cta'])
    if (!s[k]) mal(`al servicio «${s.slug || '?'}» le falta «${k}».`);
  if (vistos.has(s.slug)) mal(`slug repetido: ${s.slug}`); vistos.add(s.slug);
  if (s.vinetas && s.vinetas.length !== 5) mal(`«${s.slug}»: ${s.vinetas.length} viñetas, tienen que ser 5.`);
  if (s.lamina && s.lamina.length < 3) mal(`«${s.slug}»: la lamina tiene menos de 3 parrafos.`);
  // Tres lineas para el Estado y, desde el 07-10-2026, la cuarta ficha es
  // Servicios PyME (pista, nodo, nucleo), por decision de Sebastian. Su PRECIO
  // sigue sin publicarse en el home: lo vigila la regla de abajo.
  if (s.etiqueta) mal(`«${s.slug}»: trae «etiqueta» ${s.etiqueta}; la ficha no lleva etiqueta.`);
  if (!['L1', 'L2', 'L3', 'PYME'].includes(s.linea)) mal(`«${s.slug}»: linea «${s.linea}» no es L1, L2, L3 ni PYME.`);
  if (!s.hoja || !s.hoja.titulo || !(s.hoja.tabla && s.hoja.tabla.filas && s.hoja.tabla.filas.length === 3))
    mal(`«${s.slug}»: la lamina no trae «hoja» con titulo y tabla de tres.`);
  // Sin precio en el home, salvo el «desde» de PyME, que Sebastian aprobo el
  // 07-10-2026 junto con la agenda de 30 min sin costo.
  if (s.linea !== 'PYME' && /ta\s*rifa|\$\s*\d/.test(JSON.stringify(s))) mal(`«${s.slug}»: hay un precio en el texto publico.`);
}
if (!['franjas', 'nucleo'].includes(sitio.hero)) mal(`hero «${sitio.hero}» no es franjas ni nucleo.`);

/* ── SEO y accesibilidad ─────────────────────────────────────────────── */
const exige = [
  [/<html lang="es-CL"/, 'falta lang="es-CL".'],
  [/<title>[^<]{20,70}<\/title>/, 'el title falta o no mide entre 20 y 70 caracteres.'],
  [/<meta name="description" content="[^"]{70,165}"/, 'la description falta o no mide entre 70 y 165 caracteres.'],
  [/<meta property="og:image" content="https:\/\/compai\.cl\/media\/og\.jpg"/, 'falta la imagen Open Graph.'],
  [/<link rel="canonical"/, 'falta el canonical.'],
  [/<h1[ >]/, 'la pagina no tiene h1.'],
  [/class="salto"/, 'falta el enlace de salto al contenido.'],
];
for (const [re, m] of exige) if (!re.test(html)) mal(m);
if ((html.match(/<h1[ >]/g) || []).length !== 1) mal('tiene que haber exactamente un h1.');
for (const img of html.match(/<img\b[^>]*>/g) || [])
  if (!/\salt=/.test(img)) mal(`<img> sin alt: ${img.slice(0, 90)}`);
if (!existsSync(join(raiz, 'sitemap.xml'))) mal('falta sitemap.xml.');
if (!existsSync(join(raiz, 'robots.txt'))) mal('falta robots.txt.');
if (!existsSync(join(raiz, 'favicon.svg'))) mal('falta favicon.svg.');
if (!existsSync(join(raiz, '404.html'))) mal('falta 404.html.');

/* ── peso de los medios ──────────────────────────────────────────────── */
const TOPE_VIDEO = 5 * 1024 * 1024;
for (const v of ['media/hero-franjas.mp4', 'media/hero-nucleo.mp4']) {
  if (!existsSync(join(raiz, v))) { mal(`falta ${v}.`); continue; }
  const b = statSync(join(raiz, v)).size;
  if (b > TOPE_VIDEO) mal(`${v} pesa ${(b / 1048576).toFixed(1)} MB; el tope son 5 MB.`);
}
for (const [v, p] of [['media/hero-franjas.mp4', 'media/hero-franjas.webp'],
                      ['media/hero-nucleo.mp4', 'media/hero-nucleo.webp']])
  if (!existsSync(join(raiz, p))) mal(`${v} no tiene poster (${p}).`);

/* ── respeto por prefers-reduced-motion ──────────────────────────────── */
const css = leer('css/sitio.css');
if (!/@media \(prefers-reduced-motion:reduce\)/.test(css.replace(/\s+/g, ' ').replace(/: /g, ':')))
  mal('la hoja de estilos no atiende prefers-reduced-motion.');
for (const js of ['js/sitio.js', 'js/materializa.js'])
  if (!/prefers-reduced-motion/.test(leer(js))) mal(`${js} no mira prefers-reduced-motion.`);

/* ── resultado ───────────────────────────────────────────────────────── */
if (fallos.length) {
  console.error(`revisar: ${fallos.length} problema(s)`);
  for (const f of fallos) console.error('  x ' + f);
  process.exit(1);
}
console.log(`revisar: OK — ${serv.length} servicios, /01–/06 sin duplicados, hero sin controles, ` +
            `${(html.match(/<img\b/g) || []).length} imagenes con alt, videos bajo 5 MB.`);
