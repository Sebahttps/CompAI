/* SOUL · la PRESENTACIÓN DE MARCA (compai.cl/soul/semilla/#<codigo>) en un navegador real.
   Comprueba: el código de Waldo abre con sus láminas; dos personas del mismo oficio dan presentaciones distintas
   (sin fuga de una a otra); con pocas respuestas se OMITEN láminas enteras (nunca «—» ni láminas vacías);
   consola limpia y cero pedidos fuera de la máquina; sin desborde a 390; pie §4.b medido en cada lámina;
   contraste AA de cada texto sobre su fondo; al imprimir cada lámina cabe en su página (1500x1061) y el PDF trae
   una página por lámina; «Guardar como PDF» llama a print() y no se imprime; códigos rotos avisan.
   Ejecutar (desde sitio/compai):  python -m http.server 8773 --bind 127.0.0.1  ;  node soul/probar_semilla.mjs
   Variables: BASE (por defecto http://127.0.0.1:8773/soul/semilla/) · SALIDA (capturas y PDF) · CODIGO_WALDO (archivo con el código) */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = process.env.BASE || 'http://127.0.0.1:8773/soul/semilla/';
const SALIDA = process.env.SALIDA || 'C:/Users/sebas/AppData/Local/Temp/soul-semilla'; mkdirSync(SALIDA, { recursive: true });
const ARCH_WALDO = process.env.CODIGO_WALDO || 'C:/Users/sebas/compai_workspace/Dir. Comercial & Exp. Clientes/soul-prueba-2026-11-19/payload-simulado.json';
let fallos = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fallos++; console.error('  x ' + msg); } };

// El código de Waldo: campo `borrador` del payload simulado (solo lectura).
// Ese código traía la paleta «Tierra» (palette 1) por error: la aprobada de Waldo es «Océano» (3). Se corrige aquí, igual que en enlace-waldo-oceano.txt.
const WALDO = (() => { const o = JSON.parse(Buffer.from(JSON.parse(readFileSync(ARCH_WALDO, 'utf8')).borrador, 'base64url').toString('utf8')); o.palette = 3; return Buffer.from(JSON.stringify(o)).toString('base64url'); })();
ok(/^[A-Za-z0-9_-]{10,}$/.test(WALDO), 'no pude leer el código de Waldo');

const b = await chromium.launch();

/* ───────── abrir una presentación como la abriría quien recibe el enlace ───────── */
async function abrir(code, vw, vh = vw < 700 ? 844 : 900) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } }); const p = await ctx.newPage();
  const errores = [], externos = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('pageerror ' + e.message));
  p.on('request', (q) => { const u = q.url(); if (!/^(http:\/\/127\.0\.0\.1:8773|data:|blob:)/.test(u)) externos.push(u); });
  await p.goto(BASE + (code ? '#' + code : ''));
  await p.waitForFunction(() => document.body.dataset.lista === '1' || document.querySelector('.vacio'), null, { timeout: 40000 });
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p, errores, externos };
}

/* ───────── las personas: dos del MISMO oficio (mecánica), una mínima, una al tope ───────── */
const { ctx: c0, p: p0 } = await abrir(WALDO, 1440);
const PERSONAS = await p0.evaluate(() => {
  const S = SOUL_SITIO, mk = (o) => Object.assign(S.nuevo(), o);
  const sv = (a) => a.map(([n, p, d]) => ({ n, p, d: d || '' }));
  let k = 7; const pal = 'ñandú árbol cañería mantención instalación reparación ceremonia matrimonio camión señora pequeño garantía además también atención jardín día'.split(' ');
  const txt = (len) => { let s = ''; while (s.length < len) { k = (k * 31 + 11) % 997; s += pal[k % pal.length] + ' '; } return s.slice(0, len).trim(); };
  const carlos = mk({ plan: 1, name: 'Carlos Rojas', apodo: 'Charly', oficio: 14, palette: 3, tone: 3, bg: 1, where: ['En mi taller o local'], comunas: 'Ñuñoa y Providencia', insta: 'tallercharly',
    svcs: sv([['Cambio de aceite', '$25.000', 'Aceite, filtro y revisión de niveles'], ['Frenos', '$60.000', ''], ['', '', ''] ].filter((x) => x[0])), fields: ['Fecha', 'Dirección'], tel: '+56 9 1234 5678',
    origen: 'Mi papá me dejó hacerle el cambio de aceite a los once', unico: 'Le explico a cada cliente qué le cambié y por qué', nunca: 'Cambiar una pieza que todavía sirve', momento: 'Cuando el auto parte a la primera', cifraN: '+15', cifraU: 'años', cierre: 'Andan bien. Se nota.' });
  const pedro = mk({ plan: 0, name: 'Pedro Sandoval', marcaNombre: 'Taller El Pistón', oficio: 14, palette: 5, tone: 0, bg: 0, comunas: 'Maipú', tel: '+56 9 8765 4321',
    svcs: sv([['Revisión eléctrica de auto', '$30.000', ''], ['Cambio de batería', '$80.000', '']]),
    origen: 'Trabajé diez años en una automotriz antes de abrir el mío', unico: 'Atiendo de noche, cuando el taller de la esquina ya cerró', nunca: 'Cobrar sin dar presupuesto antes', momento: 'Cuando el cliente vuelve sin que lo llame', cifraN: '300', cifraU: 'clientes que volvieron', cierre: 'Pedro te saca del apuro.' });
  const minima = mk({ plan: 0, name: 'Ana Vera', oficio: 7 });
  const tope = mk({ plan: 2, name: txt(40), apodo: txt(30), marcaNombre: txt(40), oficio: 21, oficioOtro: txt(60), palette: 5, tone: 3, bg: 0, motion: 2,
    where: ['A domicilio', 'En mi taller o local', 'En línea'], comunas: txt(200), insta: txt(40), fb: txt(40), fields: ['Fecha', 'Dirección', 'Cantidad', 'Fotos', 'Presupuesto', 'Horario'], avg: 3, reply: 2, books: 1, modalidad: 0, tel: '+56 9 1234 5678',
    origen: txt(220), unico: txt(90), nunca: txt(90), momento: txt(90), cifraN: '+1.500', cifraU: 'Otro', cifraOtro: txt(30), cierre: txt(80),
    svcs: [0, 1, 2, 3, 4, 5].map(() => ({ n: txt(70), p: '$150.000', d: txt(140) })) });
  return { carlos: S.codificar(carlos), pedro: S.codificar(pedro), minima: S.codificar(minima), tope: S.codificar(tope) };
});
await c0.close();

/* ───────── medidas en la página ───────── */
const medir = (p) => p.evaluate(() => {
  const r = (e) => e.getBoundingClientRect();
  const lam = [...document.querySelectorAll('.lamina')];
  return {
    ids: lam.map((l) => l.id), titulo: document.title, texto: document.getElementById('pres').innerText, overflow: document.documentElement.scrollWidth - innerWidth,
    h1: document.querySelector('#portada h1')?.innerText || '', porLamina: lam.map((l) => ({ id: l.id, texto: l.innerText.trim(), h2: [...l.querySelectorAll('h2')].map((x) => x.innerText) })),
    pies: lam.map((l) => {
      const pie = l.querySelector('.pie'), caja = pie.querySelector('.pie-compai'), im = caja.querySelector('img'), cs = getComputedStyle(pie);
      let arriba = -1e9; l.querySelectorAll('*').forEach((e) => { if (pie.contains(e) || e.contains(pie) || e.closest('svg') || !e.getBoundingClientRect().width) return; const q = r(e); if (q.bottom <= r(pie).top + 1 && q.bottom > arriba) arriba = q.bottom; });
      return { id: l.id, w: r(caja).width, h: r(caja).height, iw: r(im).width, ih: r(im).height, top: getComputedStyle(im).top, mt: cs.marginTop, src: im.getAttribute('src'), nat: im.naturalWidth, imgOk: im.complete,
        derecha: Math.abs(r(caja).right - (r(l).right - parseFloat(getComputedStyle(l.id === 'portada' ? l.querySelector('.izq') : l).paddingRight))) < 2 || l.id === 'portada', dentro: r(pie).bottom <= r(l).bottom + 1 };
    }),
    pz: [...document.querySelectorAll('.pz')].map((z) => ({ f: z.dataset.f, lista: z.classList.contains('lista'), im: z.querySelector('img') ? [z.querySelector('img').naturalWidth, z.querySelector('img').naturalHeight] : null }))
  };
});

/* contraste AA: cada texto HTML contra el fondo real que tiene detrás (se ignoran SVG y las imágenes dibujadas) */
const contraste = (p) => p.evaluate(() => {
  const num = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = (c) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const fondo = (e) => { for (let x = e; x; x = x.parentElement) { const c = num(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c.length === 3 || c[3] > 0.99)) return c; } return [255, 255, 255]; };
  const malos = []; let vistos = 0;
  document.querySelectorAll('#pres *').forEach((e) => {
    if (e.closest('svg') || e.closest('.pz') || e.closest('.der')) return;
    const propio = [...e.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim());
    if (!propio) return;
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const fg = num(cs.color), bg = fondo(e); const a = lum(fg) , z = lum(bg), rr = (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05);
    const px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700);
    vistos++;
    if (rr < (grande ? 3 : 4.5)) malos.push(`${e.className || e.tagName} «${e.innerText.slice(0, 24)}» ${rr.toFixed(2)}:1 (${cs.color} sobre rgb(${bg.slice(0, 3)}))`);
  });
  return { vistos, malos };
});

/* ═══════ 1. el código de Waldo abre, a 1440 y a 390 ═══════ */
const cap = (nom) => `${SALIDA}/${nom}`;
{
  const { ctx, p, errores, externos } = await abrir(WALDO, 1440);
  const m = await medir(p);
  ok(JSON.stringify(m.ids) === JSON.stringify(['portada', 'marca', 'sistema', 'sitio', 'imagenes', 'cierre']), `Waldo: láminas ${m.ids}`);
  ok(/Que el arreglo sea para siempre/.test(m.h1), `Waldo: el titular no es el suyo («${m.h1}»)`);
  ok(m.titulo.includes('Waldo Castor'), `Waldo: título de pestaña «${m.titulo}»`);
  for (const s of ['Arreglos y recambio de materiales', 'Rediseño y ampliaciones', 'Construcciones', '$20.000', '$500.000', '$2.000.000', 'Obra', '#2B669B', 'Archivo', 'Instrument Sans', 'Space Mono', 'Región de Valparaíso', 'Plan vibe']) ok(m.texto.toLowerCase().includes(s.toLowerCase()), `Waldo: falta «${s}»`);   // algunos rótulos van en MAYÚSCULAS por estilo
  ok(!/98502C/i.test(m.texto), 'Waldo: volvió el café #98502C');
  // el sello (Visu, 23-11): en la lámina «Tu marca», con su explicación; Waldo trae su juego propio (Castor) desde fotos/waldo-castor/fotos.json
  { const sl = m.porLamina.find((l) => l.id === 'marca');
    const sb = await p.evaluate(() => { const b = document.querySelector('#marca .selloB'); return b ? { svg: b.querySelectorAll('svg').length, txt: b.innerText, letras: b.querySelectorAll('svg text').length, w: b.querySelector('svg').getBoundingClientRect().width } : null; });
    ok(sb && sb.svg === 1 && /Este es tu sello\. Son tus iniciales, WC/.test(sb.txt) && /castor/i.test(sb.txt) && /huincha/.test(sb.txt), `Waldo: falta el sello con su explicación en «Tu marca» (${JSON.stringify(sb)})`);
    ok(sb && sb.letras === 1 + 'HECHOADIENTE'.length + 'WALDOCASTOR'.length && sb.w >= 96, `Waldo: el sello debía llevar HECHO A DIENTE / WALDO CASTOR y medir ≥ 96 px (${sb && sb.letras}, ${sb && sb.w})`);
    ok(!!sl, 'Waldo: falta la lámina «Tu marca»'); }
  ok(!/—/.test(m.texto), 'Waldo: aparece una raya «—» en la presentación');
  ok(!/undefined|NaN|\[object|null/.test(m.texto), 'Waldo: aparece undefined/NaN/null en el texto');
  for (const l of m.porLamina) ok(l.texto.replace(/\s/g, '').length > (l.id === 'imagenes' ? 60 : 120), `Waldo: lámina «${l.id}» casi vacía (${l.texto.length} caracteres)`);
  // lo que NO respondió no aparece: sin origen, vara, cifra ni cierre
  ok(!/De dónde sale la marca|Mi vara|Cierre\b/.test(m.texto), 'Waldo: muestra frases que no respondió');
  ok(m.porLamina.find((l) => l.id === 'sitio').h2.join('|') === 'Servicios|Tu panel', `Waldo: bloques de «Tu sitio» ${m.porLamina.find((l) => l.id === 'sitio').h2}`);
  // el póster, la historia y el afiche se dibujaron (no quedó la ilustración de reserva)
  ok(m.pz.length === 3 && m.pz.every((z) => z.lista && z.im && z.im[0] > 1000), `Waldo: imágenes ${JSON.stringify(m.pz)}`);
  // pie §4.b en cada lámina
  const cerca = (a, z) => Math.abs(a - z) < 0.1;
  for (const q of m.pies) ok(cerca(q.w, 113.4) && cerca(q.h, 14.4) && cerca(q.iw, 113.4) && cerca(q.ih, 34.65) && q.top === '-10.08px' && q.mt === '40px' && q.imgOk && q.nat === 310 && q.derecha && q.dentro && /\.\.\/img\/pie-(compai-claro|alma-compai-oscuro)\.png$/.test(q.src), `Waldo: pie §4.b en «${q.id}» → ${JSON.stringify(q)}`);
  // sobre fondo claro (Waldo es claro) la imagen es la oscura; la lámina de cierre, invertida, lleva la clara
  ok(m.pies.filter((q) => q.id !== 'cierre').every((q) => /alma-compai-oscuro/.test(q.src)) && /pie-compai-claro/.test(m.pies.at(-1).src), 'Waldo: el pie no cambia de imagen según el fondo');
  const co = await contraste(p); ok(co.vistos > 60 && co.malos.length === 0, `Waldo: contraste AA → ${co.malos.join(' | ')} (${co.vistos} textos)`);
  ok(errores.length === 0, `Waldo: consola con ruido → ${errores.join(' | ')}`);
  ok(externos.length === 0, `Waldo: pidió cosas fuera de la máquina → ${externos.join(' | ')}`);
  ok(m.overflow <= 0, `Waldo @1440: desborde ${m.overflow}px`);
  await p.addStyleTag({ content: '.barra{display:none!important}' });
  for (const id of m.ids) await (await p.$('#' + id)).screenshot({ path: cap(`waldo-1440-${id}.png`) });
  console.log(`Waldo: ${m.ids.length} láminas · titular «${m.h1.replace(/\n/g, ' ')}» · ${co.vistos} textos con contraste ≥ AA`);

  // el botón «Guardar como PDF»: llama a print() una vez y no se imprime
  const p2 = await ctx.newPage(); await p2.addInitScript(() => { window.__imp = 0; window.print = () => { window.__imp++; }; });
  await p2.goto(BASE + '#' + WALDO); await p2.waitForFunction(() => document.body.dataset.lista === '1');
  ok((await p2.evaluate(() => window.__imp)) === 0, 'Waldo: imprimió sin que nadie lo pidiera');
  ok(await p2.evaluate(() => getComputedStyle(document.querySelector('.barra')).display !== 'none'), 'Waldo: el botón no se ve en pantalla');
  await p2.click('#guardar'); await p2.waitForFunction(() => window.__imp === 1, null, { timeout: 5000 }).catch(() => {});
  ok((await p2.evaluate(() => window.__imp)) === 1, 'Waldo: «Guardar como PDF» no llamó a print()');
  await p2.emulateMedia({ media: 'print' });
  ok(await p2.evaluate(() => [...document.querySelectorAll('.barra,.volver')].every((e) => getComputedStyle(e).display === 'none')), 'Waldo: el botón se imprimiría');
  await p2.close();

  // el PDF de Waldo: una página por lámina, con fondos
  const pp = await ctx.newPage(); await pp.goto(BASE + '#' + WALDO); await pp.waitForFunction(() => document.body.dataset.lista === '1'); await pp.emulateMedia({ media: 'print' });
  await pp.pdf({ path: cap('Waldo_Castor_Presentacion_de_marca.pdf'), printBackground: true, preferCSSPageSize: true });
  const pdf = readFileSync(cap('Waldo_Castor_Presentacion_de_marca.pdf')).toString('latin1');
  const paginas = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok(paginas === m.ids.length, `Waldo: el PDF trae ${paginas} páginas y hay ${m.ids.length} láminas`);
  console.log(`PDF de Waldo: ${paginas} páginas → ${cap('Waldo_Castor_Presentacion_de_marca.pdf')}`);
  await ctx.close();
}
{
  const { ctx, p, errores } = await abrir(WALDO, 390);
  const m = await medir(p);
  ok(m.overflow <= 0, `Waldo @390: desborde ${m.overflow}px`);
  ok(errores.length === 0, `Waldo @390: consola con ruido → ${errores.join(' | ')}`);
  const co = await contraste(p); ok(co.malos.length === 0, `Waldo @390: contraste → ${co.malos.join(' | ')}`);
  await p.addStyleTag({ content: '.barra{position:static!important}' });
  await p.screenshot({ path: cap('waldo-390-completo.png'), fullPage: true });
  await ctx.close();
}

/* ═══════ 2. dos personas del mismo oficio: presentaciones distintas, sin fuga ═══════ */
const R = {};
for (const [k, code] of Object.entries(PERSONAS)) {
  const { ctx, p, errores, externos } = await abrir(code, 1440);
  const m = await medir(p); const co = await contraste(p);
  R[k] = m;
  ok(errores.length === 0, `${k}: consola con ruido → ${errores.join(' | ')}`);
  ok(externos.length === 0, `${k}: pidió cosas fuera → ${externos.join(' | ')}`);
  ok(co.malos.length === 0, `${k}: contraste AA → ${co.malos.join(' | ')}`);
  ok(!/undefined|NaN|\[object/.test(m.texto), `${k}: undefined/NaN en el texto`);
  ok(!/—/.test(m.texto), `${k}: raya «—» en la presentación`);
  for (const q of m.pies) { const cerca = (a, z) => Math.abs(a - z) < 0.1; ok(cerca(q.w, 113.4) && cerca(q.h, 14.4) && cerca(q.ih, 34.65) && q.top === '-10.08px' && q.mt === '40px' && q.derecha && q.dentro, `${k}: pie §4.b en «${q.id}» ${JSON.stringify(q)}`); }
  for (const l of m.porLamina) ok(l.texto.replace(/\s/g, '').length > (l.id === 'imagenes' ? 40 : 80), `${k}: lámina «${l.id}» casi vacía`);
  ok(m.pz.every((z) => z.lista), `${k}: póster/historia/afiche sin dibujar → ${JSON.stringify(m.pz)}`);
  // imprimir: cada lámina cabe en su página de 1500 x 1061
  await p.emulateMedia({ media: 'print' }); await p.setViewportSize({ width: 1500, height: 1061 });
  const cab = await p.evaluate(() => [...document.querySelectorAll('.lamina')].map((l) => ({ id: l.id, sh: l.scrollHeight, ch: l.clientHeight, sw: l.scrollWidth, cw: l.clientWidth })));
  for (const l of cab) ok(l.ch === 1061 && l.sh <= l.ch && l.sw <= l.cw, `${k}: en papel la lámina «${l.id}» no cabe (${l.sh} de ${l.ch} alto, ${l.sw} de ${l.cw} ancho)`);
  await p.emulateMedia({ media: 'screen' }); await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(150);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(ov <= 0, `${k} @390: desborde ${ov}px`);
  if (k === 'tope') await p.screenshot({ path: cap('tope-390-completo.png'), fullPage: true });
  await ctx.close();
}
const C = R.carlos, P = R.pedro, Mi = R.minima, T = R.tope;
// mismo oficio, distinta persona: nada de una aparece en la otra
const unicos = (a, b2) => [...new Set(a.texto.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 14))].filter((s) => !b2.texto.includes(s));
for (const s of ['Cambio de aceite', 'Frenos', 'Le explico a cada cliente', 'Charly', 'Ñuñoa']) ok(C.texto.includes(s) && !P.texto.includes(s), `fuga o ausencia de «${s}» (Carlos / Pedro)`);
for (const s of ['Revisión eléctrica de auto', 'Cambio de batería', 'Atiendo de noche', 'Taller El Pistón', 'Maipú']) ok(P.texto.includes(s) && !C.texto.includes(s), `fuga o ausencia de «${s}» (Pedro / Carlos)`);
ok(C.h1 !== P.h1 && unicos(C, P).length > 15 && unicos(P, C).length > 15, `Carlos y Pedro (ambos mecánica) no difieren lo bastante (${unicos(C, P).length}/${unicos(P, C).length} líneas propias)`);
ok(C.titulo !== P.titulo, 'Carlos y Pedro tienen el mismo título de pestaña');
ok(JSON.stringify(C.porLamina.find((l) => l.id === 'sitio').h2) !== JSON.stringify(P.porLamina.find((l) => l.id === 'sitio').h2) || C.ids.length === P.ids.length, 'Carlos/Pedro: estructura');
ok(C.texto.includes('Tu sitio') && !C.texto.includes('Tu sitio y tu panel') && !P.texto.includes('Tu sitio y tu panel') && !/Tu panel/.test(C.texto + P.texto), 'plan sun/fresh: aparece el panel del plan vibe');
ok(!/Dónde/.test(P.texto) && /Dónde/.test(C.texto), 'plan fresh no trae «Dónde»; sun sí');
ok(/\+15 años/i.test(C.texto) && /300 clientes que volvieron/i.test(P.texto), 'la cifra de cada una no aparece');
ok(P.texto.includes('Cierre') && C.texto.includes('Andan bien') && P.texto.includes('Pedro te saca del apuro'), 'el cierre de cada una no aparece');
// la mínima: se omite «Tu marca» entera, sin servicios ni panel ni rayas
ok(JSON.stringify(Mi.ids) === JSON.stringify(['portada', 'sistema', 'sitio', 'imagenes', 'cierre']), `mínima: láminas ${Mi.ids} (debe omitir «marca»)`);
ok(!/Tu marca/.test(Mi.texto) && !/Servicios/.test(Mi.texto) && !/Tu panel/.test(Mi.texto) && !/desde/.test(Mi.porLamina.find((l) => l.id === 'sitio').texto), 'mínima: aparecen bloques sin datos');
ok(/Ana Vera/.test(Mi.h1) || /Ana Vera/.test(Mi.texto), 'mínima: sin nombre');
ok(/^0[1-4]/m.test(Mi.texto) && !/05 · Tu marca/.test(Mi.texto), 'mínima: numeración');
// el tope: todo el contenido posible, 6 servicios, y aun así 6 láminas que caben (verificado arriba en papel)
ok(T.ids.length === 6, `tope: láminas ${T.ids}`);

/* ═══════ 3. enlaces rotos: se dice, no se pinta una presentación vacía ═══════ */
for (const h of ['', '#', '#abc', '#' + 'A'.repeat(40), '#e30', '#' + Buffer.from('{"name":"","oficio":3}').toString('base64url'), '#' + Buffer.from('{"name":"X","oficio":99}').toString('base64url'), '#' + Buffer.from('{"name":5,"oficio":3}').toString('base64url')]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (er) => errs.push(er.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE + h); await p.waitForTimeout(300);
  ok(await p.$('.vacio') && !(await p.$('.lamina')) && errs.length === 0 && /no abre ninguna presentación/.test(await p.textContent('.vacio')), `enlace roto «${h.slice(0, 14)}»: no avisó bien (${errs})`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `enlace roto «${h.slice(0, 14)}»: desborde`);
  if (h === '#abc') await p.screenshot({ path: cap('semilla-enlace-roto-390.png') });
  await ctx.close();
}

await b.close();
console.log(fallos ? `probar_semilla: ${fallos} falla(s) de ${n}` : `probar_semilla: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
