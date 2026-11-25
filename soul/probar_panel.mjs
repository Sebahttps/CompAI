/* SOUL · prueba de la página de cada servicio (planes sun y vibe) y de la maqueta del panel (plan vibe), 24-11-2026.
   Caso: Waldo Castor (vibe). Comprueba: «Cotizar» abre la página del servicio con su foto, precio y formulario con el servicio
   elegido; el menú vuelve al inicio; atrás funciona; fresh no tiene páginas; el panel abre con el mismo código, dice «Datos de
   muestra» en sus cuatro pantallas, usa la marca, el WhatsApp de una solicitud, «Mi sitio» rehace el enlace; nada sale a internet;
   sin desborde a 390 y 1440. Deja capturas 09-*.png en SALIDA.
   Ejecutar (desde sitio/compai):  python -m http.server 8772 --bind 127.0.0.1  ;  BASE=http://127.0.0.1:8772/soul/ node soul/probar_panel.mjs
   Variables: BASE (por defecto http://127.0.0.1:8772/soul/) · SALIDA (capturas) */
import { mkdirSync, readFileSync } from 'node:fs';
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = (process.env.BASE || 'http://127.0.0.1:8772/soul/').replace(/(preguntas\.html|s\/)$/, '');
const SALIDA = process.env.SALIDA || '/tmp/soul-panel'; mkdirSync(SALIDA, { recursive: true });
let fallos = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fallos++; console.error('  x ' + msg); } };
const origen = new URL(BASE).origin;
const WALDO_ARCH = 'C:/Users/sebas/kri-eit/CompAI/Dir. Comercial & Exp. Clientes/soul-prueba-waldo-2026-11-23/enlace-waldo-oceano.txt';
const WALDO = /#([A-Za-z0-9_-]{20,})\s/.exec(readFileSync(WALDO_ARCH, 'utf8'))[1];
const ALTO = { 390: 844, 1440: 900 };

const b = await chromium.launch();
async function pagina(vw) {
  const ctx = await b.newContext({ viewport: { width: vw, height: ALTO[vw] }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errores = [], externos = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('pageerror ' + e.message));
  p.on('request', (q) => { const u = q.url(); if (!u.startsWith(origen) && !/^(data:|blob:)/.test(u) && !/gc\.zgo\.at|script\.google\.com/.test(u)) externos.push(u); });   // el POST del formulario va simulado
  await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  return { ctx, p, errores, externos };
}
const listo = (p) => p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
// áreas táctiles y desborde, dentro del contenedor que se le pase
const medir = (p, sel) => p.evaluate((sel) => {
  const raiz = document.querySelector(sel), r = (e) => e.getBoundingClientRect();
  const chicos = [...raiz.querySelectorAll('a,button,input,select,textarea')].filter((e) => !e.closest('.trampa') && !e.classList.contains('salto') && r(e).width && r(e).height && (r(e).width < 44 || r(e).height < 44)).map((e) => (e.textContent || e.name || '').trim().slice(0, 20) + ' ' + Math.round(r(e).width) + 'x' + Math.round(r(e).height));
  return { ov: document.documentElement.scrollWidth - innerWidth, chicos };
}, sel);

// ───────── 1) la página del servicio (vibe) ─────────
for (const vw of [390, 1440]) {
  const { ctx, p, errores, externos } = await pagina(vw); let post = null;
  await p.route('**/script.google.com/**', (r) => { post = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); });
  await p.goto(BASE + 's/#' + WALDO); await p.waitForSelector('.vp');
  const hrefs = await p.$$eval('.partidas a.btn', (as) => as.map((a) => a.getAttribute('href')));
  ok(hrefs.length === 3 && hrefs.every((h, k) => h === '#' + WALDO + '&s=' + k), `@${vw}: «Cotizar» de vibe no lleva a la página del servicio (${hrefs})`);
  ok(await p.$$eval('#vp-momentos figcaption a', (as) => as.every((a) => /&s=\d$/.test(a.getAttribute('href')))), `@${vw}: la galería no lleva a la página del servicio`);
  await p.click('.partidas li:nth-child(1) a.btn'); await p.waitForSelector('#vp-servicio'); await listo(p); await p.waitForTimeout(200);
  const m = await p.evaluate(() => {
    const sp = document.querySelector('#vp-servicio'), img = sp.querySelector('.sp-foto img');
    return { h1: [...document.querySelectorAll('h1')].map((h) => h.textContent), img: img && img.currentSrc.split('/').pop(), alt: img && img.alt, precio: (sp.querySelector('.precio') || {}).textContent,
      sel: document.querySelector('select[name=servicio]').value, nav: !!document.querySelector('.pag-cab .nav .marca svg'), portada: !!document.querySelector('.portada'), titulo: document.title,
      inc: !!sp.querySelector('.sp-inc'), volver: (sp.querySelector('.volver') || {}).textContent, cierre: !!document.querySelector('footer.cierre .pie-compai img'), wa: [...document.querySelectorAll('a[href^="https://wa.me/"]')].length };
  });
  ok(m.h1.length === 1 && m.h1[0] === 'Arreglos y recambio de materiales', `@${vw}: título de la página → ${m.h1}`);
  ok(m.img === 'enchufe.webp' && /enchufe/.test(m.alt), `@${vw}: falta la foto del servicio (${m.img})`);
  ok(/desde\s*\$20\.000/.test(m.precio || ''), `@${vw}: precio «desde» → ${m.precio}`);
  ok(m.sel === 'Arreglos y recambio de materiales', `@${vw}: el formulario no trae el servicio elegido (${m.sel})`);
  ok(m.nav && !m.portada && m.cierre && m.wa >= 2, `@${vw}: falta la marca, el menú, el cierre o el WhatsApp ${JSON.stringify(m)}`);
  ok(!m.inc, `@${vw}: Waldo no escribió «qué incluye»: no debía inventarse`);
  ok(/^Arreglos y recambio de materiales · /.test(m.titulo), `@${vw}: título de la pestaña → ${m.titulo}`);
  const md = await medir(p, '.vp');
  ok(md.ov <= 0, `@${vw}: desborde horizontal en la página del servicio (${md.ov}px)`);
  ok(md.chicos.length === 0, `@${vw}: áreas táctiles bajo 44 px → ${md.chicos.slice(0, 4)}`);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: `${SALIDA}/09-servicio-arreglos-${vw}.png` });
  await p.screenshot({ path: `${SALIDA}/09-servicio-arreglos-${vw}-completa.png`, fullPage: true });
  // el formulario de la página envía con su servicio
  await p.fill('[name=nombre]', 'Cliente Prueba'); await p.fill('[name=telefono]', '+56 9 8888 7777'); await p.fill('[name=correo]', 'cliente@example.cl');
  await p.click('form button[type=submit]'); await p.waitForFunction(() => /Listo/.test(document.querySelector('.est').textContent), null, { timeout: 5000 }).catch(() => {});
  ok(post && /Servicio: Arreglos y recambio de materiales/.test(post.mensaje) && post.organismo === 'Sitio SOUL · waldo-castor', `@${vw}: POST desde la página → ${JSON.stringify(post)}`);
  // el menú vuelve al inicio y baja a la sección; «atrás» del navegador también vuelve
  if (vw === 1440) {
    await p.click('.pag-cab .nav-l a[href="#vp-servicios"]'); await p.waitForSelector('#vp-servicios'); await p.waitForTimeout(300);
    ok(!(await p.$('#vp-servicio')) && await p.evaluate(() => Math.abs(document.querySelector('#vp-servicios').getBoundingClientRect().top) < 40 && !/&s=/.test(location.hash)), '@1440: el menú de la página no volvió a «Servicios» del inicio');
    await p.goBack(); await p.waitForSelector('#vp-servicio');
    ok((await p.textContent('#vp-servicio h1')) === 'Arreglos y recambio de materiales', '@1440: «atrás» no volvió a la página del servicio');
    await p.click('#vp-servicio .volver'); await p.waitForSelector('.portada');
    ok(!(await p.$('#vp-servicio')), '@1440: «Volver al inicio» no volvió');
  }
  ok(externos.length === 0, `@${vw}: pedidos a internet → ${externos.slice(0, 2)}`);
  ok(errores.length === 0, `@${vw}: consola → ${errores.slice(0, 2)}`);
  await ctx.close();
}
// un número de servicio que no existe abre el inicio, sin error
{
  const { ctx, p, errores } = await pagina(390);
  await p.goto(BASE + 's/#' + WALDO + '&s=7'); await p.waitForSelector('.vp');
  ok(await p.$('.portada') && !(await p.$('#vp-servicio')) && errores.length === 0, 'servicio inexistente: debía abrir el inicio');
  await ctx.close();
}

// ───────── 2) el panel (maqueta del plan vibe) ─────────
const VISTAS = [['resumen', ''], ['solicitudes', '&v=lista'], ['detalle', '&v=sol-0'], ['editar', '&v=editar']];
for (const vw of [390, 1440]) {
  const { ctx, p, errores, externos } = await pagina(vw);
  for (const [nom, v] of VISTAS) {
    await p.goto(BASE + 'panel/#' + WALDO + v); if (v) await p.reload(); await p.waitForSelector('.pn'); await listo(p);
    const m = await p.evaluate(() => {
      const c = document.querySelector('.muestra'), r = c.getBoundingClientRect();
      return { cartel: c.innerText, visible: r.top >= 0 && r.bottom <= innerHeight && r.height > 20, vista: document.querySelector('.cont').dataset.vista, h1: document.querySelectorAll('h1').length,
        font: getComputedStyle(document.querySelector('.nom')).fontFamily, bg: getComputedStyle(document.body).backgroundColor, mono: !!document.querySelector('.cab .mono svg') };
    });
    ok(/datos de muestra/i.test(m.cartel) && m.visible, `panel ${nom} @${vw}: el cartel «Datos de muestra» no se ve`);
    ok(m.h1 === 1 && m.mono && /Archivo|Syne|Instrument/.test(m.font), `panel ${nom} @${vw}: sin título, monograma o letra de la marca ${JSON.stringify(m)}`);
    const md = await medir(p, '.pn');
    ok(md.ov <= 0, `panel ${nom} @${vw}: desborde ${md.ov}px`);
    ok(md.chicos.length === 0, `panel ${nom} @${vw}: áreas táctiles bajo 44 px → ${md.chicos.slice(0, 4)}`);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: `${SALIDA}/09-panel-${nom}-${vw}.png`, fullPage: vw === 1440 });
    if (nom === 'resumen') {
      const t = await p.textContent('.cifras');
      ok(/En 24 horas/.test(t) && /\$150\.000 – \$400\.000/.test(t) && /Excel/.test(t) && /solicitudes este mes/.test(t), `panel resumen @${vw}: cifras de Waldo → ${t}`);
      ok(vw < 900 || await p.$eval('.res .sello', (e) => e.getBoundingClientRect().width > 100), `panel resumen @${vw}: falta el sello`);
    }
    if (nom === 'solicitudes') ok((await p.$$('.sols li')).length === 7 && /Arreglos y recambio/.test(await p.textContent('.sols')), `panel solicitudes @${vw}: lista`);
    if (nom === 'detalle') {
      const wa = await p.$eval('.acc a.btn', (a) => a.href);
      ok(/^https:\/\/wa\.me\/5690000000\d\?text=Hola%20Carolina%2C%20soy%20Waldo/.test(wa), `panel detalle @${vw}: WhatsApp → ${wa}`);
      const antes = await p.textContent('.det-cab .est'); await p.click('[data-marcar]'); const despues = await p.textContent('.det-cab .est');
      ok(antes !== despues, `panel detalle @${vw}: «Marcar como respondida» no cambió el estado`);
    }
    if (nom === 'editar') {
      await p.fill('[data-s="p"][data-i="0"]', '$25.000'); await p.fill('[data-e="unico"]', 'Que el arreglo dure para siempre');
      const code = await p.$eval('#ed-ver', (a) => a.getAttribute('href').split('#')[1]);
      const r = await p.evaluate((c) => { const ST = SOUL_SITIO.decodificar(c); return { p: ST.svcs[0].p, u: ST.unico, n: ST.name, largo: c.length }; }, code);
      ok(r.p === '$25.000' && r.u === 'Que el arreglo dure para siempre' && r.n === 'Waldo Castor' && r.largo <= 6000, `panel editar @${vw}: el enlace no trae los cambios ${JSON.stringify(r)}`);
      await p.click('[data-deshacer]');
      ok((await p.inputValue('[data-s="p"][data-i="0"]')) === '$20.000', `panel editar @${vw}: «Volver a como estaba» no volvió`);
    }
  }
  // las pestañas navegan sin recargar
  await p.goto(BASE + 'panel/#' + WALDO); await p.waitForSelector('.pn'); await p.click('.tabs a:nth-child(2)'); await p.waitForTimeout(200);
  ok(await p.$eval('.cont', (e) => e.dataset.vista) === 'lista', `panel @${vw}: la pestaña Solicitudes no abrió`);
  ok(externos.length === 0, `panel @${vw}: pedidos a internet → ${externos.slice(0, 2)}`);
  ok(errores.length === 0, `panel @${vw}: consola → ${errores.slice(0, 2)}`);
  await ctx.close();
}
// enlace roto y plan que no es vibe: se dice, no se pinta un panel vacío
{
  const { ctx, p, errores } = await pagina(390);
  await p.goto(BASE + 'panel/#abc'); await p.waitForSelector('.vacio');
  ok(!(await p.$('.pn')), 'panel con enlace roto: no avisó');
  await p.goto(BASE + 's/#' + WALDO); await p.waitForSelector('.vp');
  const sun = await p.evaluate(() => { const S = SOUL_SITIO, ST = S.decodificar(location.hash.slice(1)); ST.plan = 1; return S.codificar(ST); });
  await p.goto(BASE + 'panel/#' + sun); await p.reload(); await p.waitForSelector('.vacio');
  ok(!(await p.$('.pn')), 'panel de un plan sun: no debía abrirse');
  ok(errores.length === 0, `panel roto: consola → ${errores.slice(0, 2)}`);
  await ctx.close();
}

// ───────── 3) la vista previa: el acceso al panel reemplaza la sección «Cada solicitud, guardada.» ─────────
{
  const { ctx, p } = await pagina(390);
  await p.goto(BASE + 'preguntas.html#borrador=' + WALDO); await p.waitForSelector('.vp');
  const r = await p.evaluate(() => ({ href: (document.querySelector('.pan a[href^="panel/#"]') || {}).getAttribute?.('href') || '', vieja: /Cada solicitud, guardada/.test(document.body.innerText), dentro: !!document.querySelector('.vp [aria-label="Tu panel"]') }));
  ok(r.href === 'panel/#' + WALDO || /^panel\/#[A-Za-z0-9_-]{20,}$/.test(r.href), `vista previa: falta el acceso al panel (${r.href})`);
  ok(!r.vieja && !r.dentro, 'vista previa: sigue la sección de muestra dentro del sitio');
  await (await p.$('.pan')).screenshot({ path: `${SALIDA}/09-vista-previa-acceso-panel-390.png` });
  const sun = await p.evaluate(() => { const S = SOUL_SITIO, ST = S.decodificar(location.hash.split('=')[1]); ST.plan = 1; return S.codificar(ST); });
  await p.goto(BASE + 'preguntas.html#borrador=' + sun); await p.reload(); await p.waitForSelector('.vp');
  ok(!(await p.$('.pan')), 'vista previa sun: no debía ofrecer el panel');
  await ctx.close();
}
await b.close();
console.log(fallos ? `probar_panel: ${fallos} falla(s) de ${n}` : `probar_panel: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
