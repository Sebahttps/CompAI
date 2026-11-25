/* SOUL · prueba de ROBUSTEZ del sitio que arma el enlace (soul/s/#<codigo>), 23-11-2026.
   Cubre lo que pidió Sebastián: celular primero, cero desborde a 390 y 1440 con titular corto y largo, 1 a 6 servicios,
   con y sin fotos, con pocas y muchas respuestas; contraste AA medido en las 33 combinaciones (paleta × dirección, página
   clara y oscura); foco visible con teclado y áreas táctiles de 44 px; movimiento reducido y «Quieto» sin nada que se mueva solo;
   sin pedidos a internet; la foto que falla cae a la ilustración; el formulario sigue enviando.
   Ejecutar (desde sitio/compai):  python -m http.server 8772 --bind 127.0.0.1  ;  BASE=http://127.0.0.1:8772/soul/s/ node soul/probar_sitio.mjs
   Variables: BASE (por defecto http://127.0.0.1:8772/soul/s/) · SALIDA (capturas) */
import { mkdirSync, readFileSync } from 'node:fs';
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = process.env.BASE || 'http://127.0.0.1:8772/soul/s/';
const SALIDA = process.env.SALIDA || '/tmp/soul-sitio'; mkdirSync(SALIDA, { recursive: true });
let fallos = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fallos++; console.error('  x ' + msg); } };
const origen = new URL(BASE).origin;

const b = await chromium.launch();
async function pagina(vw, opts = {}) {
  const ALTO = { 390: 844, 1366: 607, 1440: 900, 1920: 1080 };
  const ctx = await b.newContext({ viewport: { width: vw, height: opts.alto || ALTO[vw] || (vw < 700 ? 844 : 900) }, reducedMotion: opts.reducido ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errores = [], externos = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('pageerror ' + e.message));
  p.on('request', (q) => { const u = q.url(); if (!u.startsWith(origen) && !/^(data:|blob:)/.test(u) && !/gc\.zgo\.at/.test(u)) externos.push(u); });
  await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  return { ctx, p, errores, externos };
}
const WALDO_ARCH = 'C:/Users/sebas/kri-eit/CompAI/Dir. Comercial & Exp. Clientes/soul-prueba-waldo-2026-11-23/enlace-waldo-oceano.txt';
const WALDO = /#([A-Za-z0-9_-]{20,})\s/.exec(readFileSync(WALDO_ARCH, 'utf8'))[1];

// ── las personas de la matriz, armadas dentro de la página con el mismo código del enlace ──
async function codigos(p) {
  await p.goto(BASE + '#' + WALDO); await p.waitForSelector('.vp');
  return p.evaluate(() => {
    const S = SOUL_SITIO, mk = (o) => Object.assign(S.nuevo(), o);
    const sv = (a) => a.map(([n, pr, d]) => ({ n, p: pr, d: d || '' }));
    let k = 7; const pal = 'ñandú árbol cañería mantención instalación reparación ceremonia matrimonio camión señora pequeño garantía además también atención jardín día'.split(' ');
    const txt = (len) => { let s = ''; while (s.length < len) { k = (k * 31 + 11) % 997; s += pal[k % pal.length] + ' '; } return s.slice(0, len).trim(); };
    const base = { plan: 1, name: 'Carlos Rojas', apodo: 'Charly', oficio: 14, tel: '+56 9 1234 5678', where: ['En mi taller o local'], comunas: 'Ñuñoa', tone: 3, bg: 1 };
    const out = {};
    for (const [di, dn] of ['escenario', 'taller', 'obra'].entries()) {
      // pocas respuestas: solo el titular corto, un servicio sin precio
      out['corto-' + dn] = S.codificar(mk({ ...base, dir: di, unico: 'Lo dejo andando', svcs: sv([['Cambio de aceite', '']]) }));
      // muchas respuestas: titular largo, 6 servicios con precio y descripción, todo al tope
      out['largo-' + dn] = S.codificar(mk({ ...base, dir: di, plan: 2, unico: txt(90), origen: txt(200), nunca: txt(90), momento: txt(90), cierre: txt(80), cifraN: '+1.500', cifraU: 'Otro', cifraOtro: 'clientes que volvieron', insta: 'tallercharly', fb: 'Taller Charly', where: ['A domicilio', 'En mi taller o local', 'En línea'], comunas: txt(180), fields: ['Fecha', 'Dirección', 'Cantidad'],
        svcs: [0, 1, 2, 3, 4, 5].map(() => ({ n: txt(60), p: '$150.000', d: txt(120) })) }));
      // una palabra larguísima en el remate (peor caso del titular)
      out['palabra-' + dn] = S.codificar(mk({ ...base, dir: di, unico: 'Instalaciones certificadas extraordinariamente', nombre: '', svcs: sv([['Gasfitería', '$30.000'], ['Calefont', '$45.000']]) }));
      // Waldo en cada dirección (con sus fotos)
      const w = S.decodificar(location.hash.slice(1)); w.dir = di; out['waldo-' + dn] = S.codificar(w);
      // Waldo con un titular largo sobre su imagen de portada (peor caso de la portada a sangre)
      w.unico = txt(90); out['waldolargo-' + dn] = S.codificar(w);
      if (dn === 'obra') { w.unico = txt(130); out['waldotope-' + dn] = S.codificar(w); }
    }
    return out;
  });
}
const { ctx: c0, p: p0 } = await pagina(1440); const CODES = await codigos(p0); await c0.close();

// ── medidores dentro de la página ──
const medir = (p) => p.evaluate(async () => {
  await document.fonts.ready;
  const r = (e) => e.getBoundingClientRect(), vp = document.querySelector('.vp');
  const toques = [...vp.querySelectorAll('a,button,input:not(.trampa input),select,textarea')].filter((e) => !e.closest('.trampa') && !e.classList.contains('salto') && r(e).width && r(e).height).map((e) => ({ t: (e.textContent || e.name || '').trim().slice(0, 24), w: r(e).width, h: r(e).height })).filter((x) => x.w < 44 || x.h < 44);
  const cortado = [...vp.querySelectorAll('.titular,.remate,.firma,.cita,h2,h3,.partidas h3,.cajetin dd,.hechos li')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className + ':' + e.textContent.slice(0, 20));
  const fuera = [...vp.querySelectorAll('.portada *,.s *,.cierre *')].filter((e) => { const q = r(e); return q.width && q.right > innerWidth + 1 && !e.closest('svg') && !e.closest('.sello') && !e.closest('.sello-cierre') && !e.closest('.ilu-esc') && !e.closest('.fondo') && !e.classList.contains('velo'); }).map((e) => e.tagName + '.' + e.className).slice(0, 4);
  return { ov: document.documentElement.scrollWidth - innerWidth, toques, cortado, fuera, h: document.documentElement.scrollHeight, texto: vp.innerText, anim: document.getAnimations().length,
    orden: [...vp.querySelectorAll('section[id^="vp-"]')].map((e) => e.id.slice(3)).join(','), galT: (vp.querySelector('#vp-momentos h2') || {}).textContent || '',
    hoja: ((vp.querySelector('#vp-cotiza') || {}).className || '').match(/hoja-(\w+)/)?.[1] || '',
    nSvc: vp.querySelectorAll('.partidas li').length, momentos: !!vp.querySelector('#vp-momentos'), ilu: !!vp.querySelector('.portada.sin-img .ilu-esc svg'), foto: !!vp.querySelector('.portada.con-img .fondo img'), h1: document.querySelectorAll('h1').length };
});
// contraste AA: cada texto HTML contra el fondo real que tiene detrás. Lo que va directo SOBRE la imagen de portada no tiene fondo
// sólido: eso se mide aparte, contra los píxeles reales (sección 8).
const contraste = (p) => p.evaluate(() => {
  const num = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = (c) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const sobreImagen = (e) => { const h = e.closest('.portada.con-img,.portada.caja'); if (!h) return false; for (let x = e; x && x !== h; x = x.parentElement) { const c = num(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.9)) return false; } return true; };
  const fondoDe = (e) => { for (let x = e; x; x = x.parentElement) { const c = num(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.9)) return c; } return [255, 255, 255]; };
  const malos = []; let medidos = 0;
  const w = document.createTreeWalker(document.querySelector('.vp'), NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    const e = t.parentElement; if (!t.textContent.trim() || e.closest('svg') || e.closest('.oculto') || e.closest('.trampa') || !e.getBoundingClientRect().width) continue;
    if (sobreImagen(e)) continue;
    const cs = getComputedStyle(e), fg = num(cs.color), bg = fondoDe(e); if (fg.length < 3) continue;
    const a = lum(fg), c = lum(bg), rt = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05); medidos++;
    if (rt < 4.5) malos.push(e.tagName + '.' + e.className + ' «' + t.textContent.trim().slice(0, 18) + '» ' + rt.toFixed(2));
  }
  return { malos, medidos };
});

// ───────── 1) la matriz: 3 direcciones × 4 casos × 2 anchos ─────────
for (const vw of [390, 1366, 1440, 1920]) {
  const { ctx, p, errores, externos } = await pagina(vw);
  for (const [caso, code] of Object.entries(CODES)) {
    const t = `${caso} @${vw}`;
    await p.goto(BASE + '#' + code); await p.reload(); await p.waitForSelector('.vp'); await p.waitForTimeout(vw === 390 ? 700 : 500);
    await p.evaluate(() => { document.querySelectorAll('.vp img').forEach((i) => { i.loading = 'eager'; }); return document.fonts.ready; });
    const m = await medir(p);
    ok(m.ov <= 0, `${t}: desborde horizontal ${m.ov}px`);
    ok(m.fuera.length === 0, `${t}: algo se sale de la pantalla → ${m.fuera}`);
    ok(m.cortado.length === 0, `${t}: texto cortado por su borde → ${m.cortado}`);
    ok(m.toques.length === 0, `${t}: áreas táctiles menores de 44 px → ${JSON.stringify(m.toques)}`);
    ok(m.h1 === 1, `${t}: debía haber un solo h1 (hay ${m.h1})`);
    if (caso.startsWith('corto')) ok(m.nSvc === 1 && !m.momentos && m.ilu, `${t}: un servicio, sin fotos → sin Momentos y con la ilustración (${m.nSvc} ${m.momentos} ${m.ilu})`);
    if (caso.startsWith('largo')) ok(m.nSvc === 6 && !m.momentos, `${t}: seis servicios sin fotos (${m.nSvc})`);
    if (caso.startsWith('waldo')) ok(m.momentos && m.foto && !m.ilu && m.nSvc === 3, `${t}: Waldo debía traer sus fotos, su portada a sangre y Momentos (${m.momentos} ${m.foto} ${m.ilu})`);
    // estructura del 24-11-2026: Mi límite → servicios → galería (título del oficio) → contacto en plano (oficio de obra)
    if (/^waldo-/.test(caso)) {
      ok(m.orden === 'manifiesto,servicios,momentos,cotiza', `${t}: orden de secciones ${m.orden}`);
      ok(m.galT === 'Manos a la obra', `${t}: la galería de un maestro chasquilla debía titularse «Manos a la obra» y dice «${m.galT}»`);
      ok(m.hoja === 'plano', `${t}: el contacto de un oficio de obra va en plano y está en «${m.hoja}»`);
    }
    ok(!/undefined|NaN|\[object|null/.test(m.texto), `${t}: aparece undefined/NaN/null`);
    ok(!/Momentos/.test(m.texto) || caso.startsWith('waldo'), `${t}: Momentos sin fotos de la persona`);
    const c = await contraste(p); ok(c.malos.length === 0, `${t}: contraste bajo 4,5:1 → ${c.malos.slice(0, 4).join(' | ')}`);
    if (['corto-taller', 'largo-escenario', 'palabra-obra', 'waldo-escenario', 'waldo-taller', 'largo-obra', 'waldolargo-obra', 'palabra-escenario'].includes(caso)) await p.screenshot({ path: `${SALIDA}/sitio-${caso}-${vw}.png`, fullPage: true });
  }
  ok(errores.length === 0, `@${vw}: consola con ruido → ${errores.slice(0, 3).join(' | ')}`);
  ok(externos.length === 0, `@${vw}: pidió cosas a internet → ${externos.slice(0, 3)}`);
  await ctx.close();
}

// ───────── 2) contraste AA en las 33 combinaciones (11 paletas × 3 direcciones), página clara y oscura ─────────
{
  const { ctx, p } = await pagina(1440);
  await p.goto(BASE + '#' + WALDO); await p.waitForSelector('.vp');
  let medidos = 0;
  for (let pal = 0; pal < 12; pal++) for (let di = 0; di < 3; di++) for (const bg of [1, 0]) {
    await p.evaluate(({ pal, di, bg }) => { const S = SOUL_SITIO, ST = S.decodificar(location.hash.slice(1)); ST.palette = pal; ST.dir = di; ST.bg = bg; ST.myColors = ['#8B4513', '#FFF1B8', '#2A1D45'];
      document.getElementById('sitio').innerHTML = S.html(ST, { D: SOUL_DATA, M: SOUL_MARCA, cfg: SOUL_CFG, mem: null, base: '../', vivo: true }); }, { pal, di, bg });
    const c = await contraste(p), t = `paleta ${pal} × dirección ${di} × ${bg ? 'claro' : 'oscuro'}`;
    medidos += c.medidos; ok(c.malos.length === 0 && c.medidos > 30, `${t}: contraste bajo 4,5:1 → ${c.malos.slice(0, 4).join(' | ')} (${c.medidos} textos)`);
    const caf = await p.evaluate(() => /98502C/i.test(document.getElementById('sitio').innerHTML)); ok(!caf, `${t}: volvió el café #98502C`);
  }
  console.log(`contraste: ${medidos} textos medidos en 72 sitios (12 paletas incluida «mis 3 colores» × 3 direcciones × claro/oscuro)`);
  await ctx.close();
}

// ───────── 3) teclado: foco visible de 3 px y el salto a los servicios ─────────
{
  const { ctx, p } = await pagina(1440);
  await p.goto(BASE + '#' + WALDO); await p.reload(); await p.waitForSelector('.vp'); await p.waitForTimeout(400);
  const foco = [];
  for (let i = 0; i < 10; i++) { await p.keyboard.press('Tab'); foco.push(await p.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return { t: (e.textContent || e.name || '').trim().slice(0, 20), w: parseFloat(cs.outlineWidth), s: cs.outlineStyle }; })); }
  ok(foco.every((f) => f.s !== 'none' && f.w >= 3), `foco: algún elemento sin contorno de 3 px → ${JSON.stringify(foco.filter((f) => f.s === 'none' || f.w < 3))}`);
  ok(/Ir al contenido/.test(foco[0].t) && /Ir a los servicios/.test(foco[1].t), `los dos primeros Tab debían ser «Ir al contenido» e «Ir a los servicios» (fueron «${foco[0].t}», «${foco[1].t}»)`);
  await p.focus('.vp .salto'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'vp-manifiesto'), '«Ir al contenido» debía llevar el foco al manifiesto');
  await ctx.close();
}

// ───────── 4) «Quieto» y movimiento reducido: nada se mueve solo y todo está visible ─────────
{
  const mod = async (motion, reducido) => { const { ctx, p } = await pagina(1440, { reducido }); const c = await p.goto(BASE + '#' + WALDO) && await p.evaluate(() => 0);
    const code = await p.evaluate((mv) => { const S = SOUL_SITIO, ST = S.decodificar(location.hash.slice(1)); ST.motion = mv; return S.codificar(ST); }, motion);
    await p.goto(BASE + '#' + code); await p.reload(); await p.waitForSelector('.vp'); await p.waitForTimeout(2600);
    const r = await p.evaluate(() => ({ anim: document.getAnimations().length, mv: document.querySelector('.vp').dataset.mov, js: document.querySelector('.vp').classList.contains('mv-js'), op: [...document.querySelectorAll('.vp .cita .cl, .vp .titular .pl>span, .vp .vista')].map((e) => getComputedStyle(e).opacity).filter((o) => o !== '1').length,
      ocultas: [...document.querySelectorAll('.vp .vista')].map((e) => getComputedStyle(e, '::after').transform).filter((t) => t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)').length }));
    await ctx.close(); return r; };
  const q = await mod(0, false), red = await mod(2, true), vida = await mod(2, false), sutil = await mod(1, false);
  ok(q.anim === 0 && q.mv === '0' && !q.js, `Quieto: ${q.anim} animaciones (debían ser 0)`);
  ok(red.anim === 0 && !red.js && red.op === 0, `movimiento reducido con nivel «Con vida»: ${red.anim} animaciones, ${red.op} piezas no visibles, mv-js ${red.js}`);
  ok(vida.mv === '2' && vida.js && vida.anim > 0, `«Con vida» debía mover cosas (${vida.anim})`);
  ok(sutil.mv === '1' && sutil.anim >= 1 && sutil.anim <= 8, `«Sutil»: ${sutil.anim} animaciones (se esperaban pocas)`);
  console.log(`movimiento: Quieto ${q.anim} · reducido ${red.anim} · Sutil ${sutil.anim} · Con vida ${vida.anim} animaciones activas`);
}

// ───────── 5) fotos: si no existen o fallan, cae a la ilustración sin ruido ─────────
{
  // la carpeta no existe para esa persona
  const { ctx, p, errores } = await pagina(390);
  await p.goto(BASE + '#' + CODES['corto-obra']); await p.reload(); await p.waitForSelector('.vp'); await p.waitForTimeout(500);
  ok(await p.$('.portada.sin-img .ilu-esc svg') && !(await p.$('#vp-momentos')) && errores.length === 0, `persona sin carpeta de fotos: debía salir la ilustración sin ruido (${errores})`);
  await ctx.close();
  // una foto se rompe: vuelve a lo de siempre
  const w = await pagina(390); const caidas = [];
  await w.p.route('**/fotos/waldo-castor/viga.webp', (r) => { caidas.push(1); r.abort(); });
  await w.p.goto(BASE + '#' + WALDO); await w.p.reload(); await w.p.waitForSelector('.vp'); await w.p.waitForTimeout(1800);
  ok(caidas.length >= 1 && await w.p.$('.portada.sin-img .ilu-esc svg') && !(await w.p.$('#vp-momentos')), 'una foto que no carga debía devolver la ilustración y quitar Momentos');
  ok(await w.p.$('form[data-cotiza]') && (await w.p.textContent('.titular')).includes('arreglo'), 'tras el fallo de la foto el sitio sigue completo');
  await w.ctx.close();
  // el índice de fotos no responde
  const x = await pagina(390);
  await x.p.route('**/fotos/index.json', (r) => r.fulfill({ status: 404, body: '' }));
  await x.p.goto(BASE + '#' + WALDO); await x.p.reload(); await x.p.waitForSelector('.vp');
  ok(await x.p.$('.portada.sin-img .ilu-esc svg') && !(await x.p.$('#vp-momentos')), 'sin índice de fotos: debía caer a la ilustración');
  await x.ctx.close();
  // la imagen de portada no carga (celular y escritorio): cae a la portada sin imagen, sin errores de programa
  for (const [vw, arch] of [[390, 'portada-vertical-1080.webp'], [1440, 'portada-ancha-1920.webp']]) {
    const y = await pagina(vw); const caidas2 = []; const errJs = []; y.p.on('pageerror', (e) => errJs.push(e.message));
    await y.p.route('**/fotos/waldo-castor/' + arch, (r) => { caidas2.push(1); r.abort(); });
    await y.p.goto(BASE + '#' + WALDO); await y.p.reload(); await y.p.waitForSelector('.vp'); await y.p.waitForTimeout(1800);
    ok(caidas2.length >= 1 && await y.p.$('.portada.sin-img .ilu-esc svg') && errJs.length === 0 && (await y.p.textContent('.titular')).includes('arreglo'), `@${vw}: la portada que no carga debía caer a la ilustración (${caidas2.length} ${errJs})`);
    ok(y.errores.filter((t) => !/Failed to load resource|ERR_FAILED/.test(t)).length === 0, `@${vw}: ruido en consola además del aviso del archivo caído → ${y.errores}`);
    await y.ctx.close();
  }
}

// ───────── 6) el formulario y «Cotizar» ─────────
{
  const { ctx, p } = await pagina(390); let post = null;
  await p.route('**/script.google.com/**', (r) => { post = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); });
  await p.goto(BASE + '#' + WALDO); await p.reload(); await p.waitForSelector('.vp'); await p.waitForTimeout(600);
  // Waldo es vibe: «Cotizar» abre la página del servicio (24-11-2026) y su formulario ya trae el servicio elegido
  await p.click('.partidas li:nth-child(2) a[data-pag]'); await p.waitForSelector('#vp-servicio'); await p.waitForTimeout(300);
  ok((await p.textContent('#vp-servicio h1')) === 'Rediseño y ampliaciones' && /&s=1$/.test(await p.evaluate(() => location.hash)), '«Cotizar» no abrió la página del servicio');
  ok((await p.inputValue('select[name=servicio]')) === 'Rediseño y ampliaciones', '«Cotizar» no dejó elegido el servicio');
  await p.click('#vp-servicio a[data-serv]'); await p.waitForTimeout(900);
  ok(await p.evaluate(() => !!document.querySelector('label.mv-marca')), '«Cotizar» de la página no marcó el campo Servicio');
  await p.click('form button[type=submit]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => /nombre/i.test(document.querySelector('.est').textContent) && !!document.querySelector('label.mv-no') && document.activeElement.name === 'nombre'), 'formulario vacío: debía avisar, sacudir el campo y llevar el foco');
  await p.fill('[name=nombre]', 'Cliente Prueba'); await p.fill('[name=telefono]', '+56 9 8888 7777'); await p.fill('[name=correo]', 'cliente@example.cl'); await p.fill('[name=mensaje]', 'Necesito cotizar una ampliación');
  await p.click('form button[type=submit]'); await p.waitForFunction(() => /Listo/.test(document.querySelector('.est').textContent), null, { timeout: 5000 }).catch(() => {});
  ok(post && post.organismo === 'Sitio SOUL · waldo-castor' && /Rediseño y ampliaciones/.test(post.mensaje) && /ampliación/.test(post.mensaje), `POST del formulario → ${JSON.stringify(post)}`);
  ok(await p.evaluate(() => document.querySelector('.est').classList.contains('ok')), 'no confirmó el envío');
  await ctx.close();
  // fresh no tiene páginas: «Cotizar» sigue bajando al formulario con el servicio elegido, y un «&s=» de más abre el inicio
  const f = await pagina(390);
  await f.p.goto(BASE + '#' + WALDO); await f.p.waitForSelector('.vp');
  const fresh = await f.p.evaluate(() => { const S = SOUL_SITIO, ST = S.decodificar(location.hash.slice(1)); ST.plan = 0; return S.codificar(ST); });
  await f.p.goto(BASE + '#' + fresh + '&s=1'); await f.p.reload(); await f.p.waitForSelector('.vp'); await f.p.waitForTimeout(400);
  ok(!(await f.p.$('#vp-servicio')) && !(await f.p.$('a[data-pag]')) && (await f.p.$$('.partidas a[data-serv]')).length === 3, 'fresh: no debía tener página de servicio');
  await f.p.click('.partidas li:nth-child(3) a[data-serv]'); await f.p.waitForTimeout(900);
  ok(await f.p.evaluate(() => { const r = document.querySelector('#vp-cotiza').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), 'fresh: «Cotizar» no bajó al formulario');
  ok(f.errores.length === 0, `fresh: consola → ${f.errores.slice(0, 2)}`);
  await f.ctx.close();
}

// ───────── 7) el código del enlace de Waldo corregido: Océano, y pesa poco ─────────
{
  const { ctx, p } = await pagina(1440);
  await p.goto(BASE + '#' + WALDO); await p.waitForSelector('.vp');
  const r = await p.evaluate(() => { const ST = SOUL_SITIO.decodificar(location.hash.slice(1)); const su = SOUL_SITIO.sup(ST, SOUL_DATA, SOUL_MARCA); return { pal: ST.palette, ac: su.ac, vivo: su.vivo, largo: location.hash.length - 1, sello: document.querySelectorAll('.vp .sello svg text').length }; });
  ok(r.pal === 3 && r.ac === '#2B669B' && r.vivo === '#2B669B', `Waldo: paleta ${r.pal}, acento ${r.ac}/${r.vivo} (debía ser Océano #2B669B)`);
  ok(r.largo < 6000, `el código de Waldo pesa ${r.largo}`);
  await ctx.close();
}
// ───────── 8) portada a sangre (PORTADA.md de Visu, 24-11): contraste contra los píxeles REALES, peso, la regla y el modo CAJA ─────────
// Método de Visu (_capturar.mjs): captura con la letra transparente y cada texto contra los píxeles de su caja; se exige el p05 ≥ 4,5.
async function pixeles(p) {
  const cajas = await p.evaluate(() => {
    const out = [], h = document.querySelector('.portada');
    for (const e of h.querySelectorAll('*')) {
      if (![...e.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim()) || !e.getClientRects().length || e.closest('svg') || e.closest('.oculto')) continue;
      let solido = null;
      for (let x = e; x && x !== h; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor.match(/[\d.]+/g).map(Number); if (c.length < 4 || c[3] > 0.99) { solido = c; break; } }
      const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); if (!q.width || q.bottom < 0 || q.top > innerHeight) continue;
      out.push({ t: e.textContent.trim().slice(0, 18), color: getComputedStyle(e).color.match(/[\d.]+/g).map(Number).slice(0, 3), solido, caja: [Math.max(0, Math.floor(q.left)), Math.max(0, Math.floor(q.top)), Math.ceil(q.width), Math.ceil(q.height)] });
    }
    return out;
  });
  const css = await p.addStyleTag({ content: '.portada *{color:transparent!important;-webkit-text-fill-color:transparent!important} .portada .cota,.portada .cota::before,.portada .cota::after{background:transparent!important}' });
  const png = await p.screenshot({ type: 'png' });
  await css.evaluate((n) => n.remove());
  return p.evaluate(async ([b64, cajas]) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }, L = (r, g, bb) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bb);
    const cr = (a, b2) => (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05);
    return cajas.map((k) => {
      const lt = L(...k.color);
      if (k.solido) return { t: k.t, p05: +cr(lt, L(k.solido[0], k.solido[1], k.solido[2])).toFixed(2), sobre: false };
      const [a, b3, ww, hh] = k.caja, d = x.getImageData(a, b3, Math.max(1, Math.min(ww, c.width - a)), Math.max(1, Math.min(hh, c.height - b3))).data, v = [];
      for (let i = 0; i < d.length; i += 4) v.push(cr(lt, L(d[i], d[i + 1], d[i + 2])));
      v.sort((p1, p2) => p1 - p2); return { t: k.t, p05: +v[Math.floor(v.length * 0.05)].toFixed(2), sobre: true };
    });
  }, [png.toString('base64'), cajas]);
}
{
  const tabla = [];
  for (const [caso, sizes] of [['waldo-obra', [390, 1366, 1440, 1920]], ['waldo-escenario', [390, 1440]], ['waldo-taller', [390, 1440]], ['waldolargo-obra', [390, 1366]], ['waldotope-obra', [390, 1440]]]) for (const vw of sizes) {
    const { ctx, p, errores } = await pagina(vw, { reducido: true }); const kb = {};
    p.on('response', async (r) => { const u = r.url(); if (/portada-(ancha|vertical)/.test(u)) { try { kb[u.split('/').pop()] = Math.round((await r.body()).length / 1024); } catch (_) { /* nada */ } } });
    await p.goto(BASE + '#' + CODES[caso]); await p.reload(); await p.waitForSelector('.portada.con-img');
    await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('.portada img')].map((i) => i.decode().catch(() => 0))); }); await p.waitForTimeout(300);
    const res = await pixeles(p), sobre = res.filter((r) => r.sobre), peor = res.slice().sort((x, y) => x.p05 - y.p05)[0];
    ok(sobre.length >= (vw < 900 ? 3 : 6), `${caso} @${vw}: debían medirse los textos sobre la imagen (${sobre.length})`);
    ok(res.every((r) => r.p05 >= 4.5), `${caso} @${vw}: contraste contra la imagen bajo 4,5 → ${res.filter((r) => r.p05 < 4.5).map((r) => r.t + ' ' + r.p05).join(' | ')}`);
    const tit = res.filter((r) => /para|siempre|arreglo/i.test(r.t)).map((r) => r.p05);
    tabla.push(`${caso} @${vw}: titular ${tit.length ? Math.min(...tit) : '—'} · más bajo ${peor.p05} («${peor.t}»)`);
    const img = await p.evaluate(() => { const i = document.querySelector('.portada .fondo img'); return { src: i.currentSrc.split('/').pop(), alt: i.alt, prio: i.getAttribute('fetchpriority'), lazy: i.loading }; });
    if (caso === 'waldo-obra') {
      ok(vw < 900 ? img.src === 'portada-vertical-1080.webp' && !kb['portada-ancha-1920.webp'] && !kb['portada-ancha-2560.webp'] : /portada-ancha-(1920|2560)\.webp/.test(img.src) && !kb['portada-vertical-1080.webp'], `@${vw}: imagen de portada equivocada o bajó las dos (${img.src} ${JSON.stringify(kb)})`);
      if (vw < 900) ok(Object.values(kb).reduce((a, x) => a + x, 0) <= 350, `@${vw}: la portada del celular pesa ${JSON.stringify(kb)} (tope ~350 KB)`);
      ok(img.prio === 'high' && img.lazy !== 'lazy' && /desde arriba/.test(img.alt), `@${vw}: imagen sin prioridad o sin texto alternativo (${JSON.stringify(img)})`);
      const g = await p.evaluate(() => { const h = document.querySelector('.portada'); return { zona: h.dataset.zona, la: h.dataset.la, lv: h.dataset.lv, velo: getComputedStyle(h).getPropertyValue('--velo').trim(), pos: getComputedStyle(document.querySelector('.portada .fondo img')).objectPosition, esq: document.querySelector('.portada .sello').dataset.esq }; });
      ok(g.zona === 'izq' && g.la === 'oscura' && g.lv === 'oscura' && g.velo === '0.3' && (vw < 900 ? g.pos === '50% 0%' : g.pos === '64% 100%') && g.esq === 'der', `@${vw}: la regla de Waldo no llegó a la página → ${JSON.stringify(g)}`);
    }
    ok(errores.length === 0, `${caso} @${vw}: consola → ${errores.slice(0, 2)}`);
    await ctx.close();
  }
  console.log('contraste contra la imagen (p05):\n  ' + tabla.join('\n  '));
}
// la regla con otras imágenes: zona DER y letra clara (imagen oscura), y modo CAJA (sin zona limpia, o sin medida)
{
  for (const vw of [390, 1440]) {
    const { ctx, p, errores } = await pagina(vw, { reducido: true });
    await p.goto(BASE + '#' + WALDO); await p.reload(); await p.waitForSelector('.portada.con-img');
    const pinta = (F) => p.evaluate((F) => { const S = SOUL_SITIO, ST = S.decodificar(location.hash.slice(1)); document.getElementById('sitio').innerHTML = S.html(ST, { D: SOUL_DATA, M: SOUL_MARCA, cfg: SOUL_CFG, mem: null, base: '../', vivo: true, fotos: F, fotosBase: '../fotos/waldo-castor/' }).replace('class="vp', 'class="vp pleno'); }, F);
    const F0 = await p.evaluate(() => fetch('../fotos/waldo-castor/fotos.json').then((r) => r.json()));
    const oscura = JSON.parse(JSON.stringify(F0));
    for (const k of ['ancha', 'vertical']) { const m = oscura.portada[k].medida; if (k === 'ancha') { m.zona = 'der'; m.recorte = '35% 100%'; } for (const d of Object.keys(m.dirs)) m.dirs[d] = { letra: 'clara', velo: 0, p05: 6.2, modo: 'imagen' }; }
    await pinta(oscura);
    const r1 = await p.evaluate(() => { const h = document.querySelector('.portada'), q = (s) => document.querySelector(s).getBoundingClientRect(); return { cl: h.className, zona: h.dataset.zona, color: getComputedStyle(document.querySelector('.remate')).color, x: q('.dice').left, ov: document.documentElement.scrollWidth - innerWidth }; });
    ok(/con-img/.test(r1.cl) && r1.zona === 'der' && r1.color === 'rgb(234, 242, 248)' && r1.ov <= 0 && (vw < 900 || r1.x > 0.5 * vw), `@${vw}: imagen oscura con la persona a la izquierda → titular a la derecha con letra clara (${JSON.stringify(r1)})`);
    const caja = JSON.parse(JSON.stringify(F0)); caja.portada.vertical.medida.dirs.obra.modo = 'caja';
    await pinta(caja);
    const r2 = await p.evaluate(() => { const h = document.querySelector('.portada'), pie = h.querySelector('.pie-portada'); return { cl: h.className, enPie: !!pie.querySelector('.titular'), bg: getComputedStyle(pie).backgroundColor, ov: document.documentElement.scrollWidth - innerWidth }; });
    ok(/caja/.test(r2.cl) && r2.enPie && r2.bg !== 'rgba(0, 0, 0, 0)' && r2.ov <= 0, `@${vw}: sin zona limpia → modo CAJA con el titular en un panel sólido (${JSON.stringify(r2)})`);
    const c2 = await contraste(p); ok(c2.malos.length === 0, `@${vw}: CAJA con contraste bajo → ${c2.malos.slice(0, 3)}`);
    await pinta({ ...F0, portada: { src: 'enchufe.webp', w: 800, h: 1072, alt: '' } });
    ok(await p.evaluate(() => /caja/.test(document.querySelector('.portada').className) && /enchufe/.test(document.querySelector('.portada .fondo img').src)), `@${vw}: una portada de una sola imagen sin medida debía salir en CAJA`);
    ok(errores.length === 0, `@${vw}: consola con la regla → ${errores.slice(0, 2)}`);
    await ctx.close();
  }
}
await b.close();
console.log(fallos ? `probar_sitio: ${fallos} falla(s) de ${n}` : `probar_sitio: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
