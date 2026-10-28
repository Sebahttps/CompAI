/* SOUL 2 · el flujo completo en un navegador real: 3 planes × 390 y 1440.
   Comprueba: pasos por plan, las 6 preguntas del alma, el borrador (portada alta, titular ≥ 40 px en la
   display de la dirección, cero meta-texto, pie §4.b con medida y 40 px), el resumen corporativo, el
   POST (resumen con filas «Marca · …»), consola limpia y sin desborde horizontal. Y la «prueba del vecino»
   en pantalla: dos personas del mismo oficio → titular y frases distintos.
   Ejecutar (desde sitio/compai):  python3 -m http.server 8765 &  ;  node soul/probar_soul2.mjs
   Variables: BASE (por defecto http://localhost:8765/soul/preguntas.html) · SALIDA (carpeta de capturas) */
import { mkdirSync } from 'node:fs';
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = process.env.BASE || 'http://localhost:8765/soul/preguntas.html';
const SALIDA = process.env.SALIDA || '/tmp/soul2'; mkdirSync(SALIDA, { recursive: true });
let fallos = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fallos++; console.error('  x ' + msg); } };

const P1 = { svc: ['Cambio de aceite', 'Frenos'], where: 1, name: 'Carlos Rojas', apodo: 'Charly', oficio: 14, origen: 'Mi papá me dejó hacerle el cambio de aceite a los once', unico: 'Le explico a cada cliente qué le cambié y por qué', nunca: 'Cambiar una pieza que todavía sirve', momento: 'Cuando el auto parte a la primera', cifra: '+15', unid: 'años', cierre: 'Andan bien. Se nota.' };
const P2 = { svc: ['Revisión eléctrica de auto', 'Cambio de batería'], where: 0, name: 'Pedro Sandoval', apodo: '', oficio: 14, origen: 'Trabajé diez años en una automotriz antes de abrir el mío', unico: 'Atiendo de noche, cuando el taller de la esquina ya cerró', nunca: 'Cobrar sin dar presupuesto antes', momento: 'Cuando el cliente vuelve sin que lo llame', cifra: '300', unid: 'clientes que volvieron', cierre: 'Pedro te saca del apuro.' };
const PM = { svc: ['Animación de matrimonio', 'Canto en misa'], where: 0, name: 'Miguel Mena', apodo: 'Mig', oficio: 0, origen: 'Aprendí sin escuela, con el micrófono acoplando', unico: 'Escribo cada ceremonia con su historia', nunca: 'Leer un libreto ajeno', momento: 'En el silencio justo antes del sí', cifra: '+50', unid: 'eventos', cierre: 'Ustedes vivan. Yo conduzco.' };
const PA = { svc: ['Pan amasado', 'Tortas por encargo'], where: 1, name: 'La Mari Panadería de San Miguel', apodo: '', oficio: 7, origen: 'A los doce amasaba con mi papá', unico: 'Amaso a mano todo lo que sale del horno cada día', nunca: 'Vender pan de ayer como si fuera de hoy', momento: 'Cuando el pan suena crujiente al partirlo', cifra: '12', unid: 'años', cierre: 'Llegó calentito.' };

async function flujo(browser, plan, vw, persona, vh = vw < 700 ? 844 : 900, pagina = null) {
  const ctx = pagina ? pagina.context() : await browser.newContext({ viewport: { width: vw, height: vh } });
  const p = pagina || await ctx.newPage();
  await p.addInitScript(() => { window.__gc = []; window.goatcounter = { count: (o) => window.__gc.push(o.path) }; });
  await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' })); const errores = []; let envio = null;
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('pageerror ' + e.message));
  await p.route('**/script.google.com/**', (r) => { envio = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); });
  await p.goto(BASE + '?plan=' + plan);
  await p.evaluate(() => 0);
  const sig = () => p.click('#btn-next');
  const etiqueta = () => p.textContent('#etiqueta');
  await sig();                                           // bienvenida → 1
  await p.fill('[data-k="name"]', persona.name); if (persona.apodo) await p.fill('[data-k="apodo"]', persona.apodo);
  await p.click(`[data-a="oficio"][data-i="${persona.oficio}"]`);
  const total = Number((await etiqueta()).split('/')[1]);   // «01 / NN»
  await sig();
  // las 6 del alma, en orden: cada una con su pregunta y su campo
  const alma = [['origen', '¿Cómo llegaste a esto?'], ['unico', '¿Qué haces tú que otros'], ['nunca', '¿Qué no harías nunca'], ['momento', '¿En qué momento sabes'], ['cifra', 'Una cifra de la que'], ['cierre', '¿Qué quieres que la gente diga']];
  for (const [campo, titulo] of alma) {
    ok((await p.textContent('h1.q')).includes(titulo), `plan ${plan}: se esperaba «${titulo}»`);
    ok((await p.textContent('.kick-sun')).includes('tu alma'), 'falta el rótulo «tu alma»');
    if (campo === 'cifra') {
      await p.fill('[data-k="cifraN"]', persona.cifra);
      await p.click(`.chip:has-text("${persona.unid}")`);
    } else {
      const ph = await p.getAttribute(`[data-k="${campo}"]`, 'placeholder'); ok(/^Ej: /.test(ph), `${campo}: sin ejemplo de muestra`);
      await p.fill(`[data-k="${campo}"]`, persona[campo]);
    }
    await sig();
  }
  // el resto: contesta lo mínimo que pide cada paso hasta llegar a la ficha
  for (let i = 0; i < 40; i++) {
    if (await p.$('.contacto [data-k="tel"]')) break;
    if (await p.$('[data-svc="n"]')) { const ins = await p.$$('[data-svc="n"]'); await ins[0].fill(persona.svc[0]); await ins[1].fill(persona.svc[1]); const pr = await p.$$('[data-svc="p"]'); await pr[0].fill('$25.000'); }
    if (await p.$('[data-a="where"]')) await p.click(`[data-a="where"][data-i="${persona.where}"]`);
    if (await p.$('[data-k="email"]')) await p.fill('[data-k="email"]', 'taller@example.cl');
    for (const a of ['avg', 'reply', 'books']) if (await p.$(`[data-a="${a}"]`)) await p.click(`[data-a="${a}"][data-i="0"]`);
    await sig();
  }
  await p.click('[data-a="modo"][data-i="0"]'); await p.fill('[data-k="tel"]', '+56 9 1234 5678');
  await sig(); await p.waitForSelector('.vp'); await p.waitForTimeout(400);
  return { ctx, p, errores, total, envio: () => envio, gc: () => p.evaluate(() => window.__gc) };
}

const b = await chromium.launch();
const sigPaso = (p) => p.click('#btn-next');
const esperado = { 0: 16, 1: 21, 2: 25 };
for (const plan of [0, 1, 2]) for (const vw of [390, 1440]) {
  const t = `plan ${plan} @${vw}`;
  const { ctx, p, errores, total, envio } = await flujo(b, plan, vw, P1);
  ok(total === esperado[plan], `${t}: ${total} preguntas, se esperaban ${esperado[plan]}`);
  const m = await p.evaluate(async () => {
    await document.fonts.ready;
    const vp = document.querySelector('.vp'), h = vp.querySelector('h2.tit'), cs = getComputedStyle(h), hero = vp.querySelector('.hero');
    const pie = vp.querySelector('footer .pie'), pc = vp.querySelector('.pie-compai'), im = pc.querySelector('img');
    const r = (e) => e.getBoundingClientRect();
    const dir = vp.dataset.dir, fam = { escenario: 'Syne', taller: 'Bricolage Grotesque', obra: 'Archivo' }[dir];
    return {
      dir, h2: h.textContent, fs: parseFloat(cs.fontSize), ff: cs.fontFamily, heroH: r(hero).height, vh: innerHeight,
      overflow: document.documentElement.scrollWidth - innerWidth, texto: vp.innerText,
      pcW: r(pc).width, pcH: r(pc).height, imW: r(im).width, imH: r(im).height, imTop: getComputedStyle(im).top, pieMargen: getComputedStyle(pie).marginTop,
      pieTexto: vp.querySelector('footer').innerText.trim(), pieImg: im.getAttribute('src'), pieAlt: im.alt, fuenteOk: document.fonts.check('800 20px "' + fam + '"'),
      corp: document.querySelector('.corp') ? document.querySelector('.corp').innerText : '', secciones: [...vp.querySelectorAll('section.s')].map((s) => parseFloat(getComputedStyle(s).paddingTop)),
      cortado: [...vp.querySelectorAll('h2.tit,.cie,.mani,h3')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.slice(0, 20)),
      fotoBiblioteca: /oficio-\d\d\.webp/.test(vp.innerHTML), nBtnHero: hero.querySelectorAll('.acc a').length
    };
  });
  ok(m.h2.includes('Le explico a cada cliente'), `${t}: el titular no es el de la persona («${m.h2}»)`);
  ok(m.fs >= 40, `${t}: titular de ${m.fs}px (< 40)`);
  ok(m.heroH >= (vw < 700 ? 0.8 : 0.7) * m.vh - 80, `${t}: portada baja (${Math.round(m.heroH)} de ${m.vh})`);
  ok(m.overflow <= 0, `${t}: desborde horizontal ${m.overflow}px`);
  ok(!/referencia|ejemplo|borrador|hecho con|versi[oó]n final/i.test(m.texto), `${t}: el sitio habla de sí mismo`);
  const cerca = (a, b) => Math.abs(a - b) < 0.1;
  ok(cerca(m.pcW, 113.4) && cerca(m.pcH, 14.4) && cerca(m.imW, 113.4) && cerca(m.imH, 34.65) && m.imTop === '-10.08px', `${t}: medida del pie ${m.pcW}x${m.pcH} img ${m.imW}x${m.imH} top ${m.imTop}`);
  ok(m.pieMargen === '40px', `${t}: margen del pie ${m.pieMargen}`);
  ok(m.pieTexto === '' && /pie-(compai-claro|alma-compai-oscuro)\.png$/.test(m.pieImg), `${t}: el pie lleva texto o la pieza equivocada («${m.pieTexto}» ${m.pieImg})`);
  ok(m.fuenteOk, `${t}: la fuente de la dirección «${m.dir}» no cargó`);
  ok(m.secciones.every((x) => x >= 72), `${t}: sección con menos de 72 px (${m.secciones})`);
  ok(m.cortado.length === 0, `${t}: texto cortado por el borde: ${m.cortado}`);
  ok(!m.fotoBiblioteca, `${t}: usó una foto de biblioteca`);
  ok(m.nBtnHero <= 2, `${t}: más de dos botones en la portada`);
  ok(/concepto/i.test(m.corp) && /charly/i.test(m.corp) && /letras/i.test(m.corp) && /colores/i.test(m.corp) && /tono/i.test(m.corp) && /frases/i.test(m.corp) && /estilo/i.test(m.corp), `${t}: resumen corporativo incompleto`);
  const corpT = await p.evaluate(() => document.querySelector('.corp').innerText);
  ok(!/#[0-9a-f]{6}/i.test(corpT) && !/Syne|Archivo|Instrument|Bricolage|Figtree|JetBrains|Plex|Space Mono|OFL/i.test(corpT), `${t}: el resumen corporativo muestra códigos o nombres de letras`);
  const gc = await p.evaluate(() => window.__gc);
  ok(gc.length >= total + 1 && gc.some((x) => x.startsWith('soul/enviado-')) && gc.some((x) => x.startsWith('soul/paso-00')), `${t}: GoatCounter vio ${gc.length} eventos (se esperaban ≥ ${total + 1} con el de envío)`);
  const e = envio(); ok(e && e.tipo === 'soul', `${t}: no hubo POST`);
  ok(e && !(await p.evaluate(() => sessionStorage.getItem('soul.respuestas.v1'))), `${t}: tras enviar, quedan respuestas guardadas en la pestaña`);
  if (e) {
    const k = e.resumen.map((r) => r.k);
    ok(['Marca · dirección', 'Marca · concepto', 'Marca · tono', 'Marca · paleta', 'Marca · tipografía', 'Marca · frases'].every((x) => k.includes(x)), `${t}: faltan filas «Marca · …» en el POST`);
    ok(e.resumen.length <= 40, `${t}: ${e.resumen.length} filas (> 40 que acepta Code.gs)`);
    ok(e.resumen.find((r) => r.k === 'Cifra de orgullo').v === '+15 años', `${t}: la cifra no viaja tal cual`);
  }
  ok(errores.length === 0, `${t}: consola con ruido → ${errores.join(' | ')}`);
  if (vw === 390 && plan === 1) { await p.locator('.vp').screenshot({ path: `${SALIDA}/borrador-sun-390-charly.png` }); }
  if (vw === 390) await p.screenshot({ path: `${SALIDA}/borrador-p${plan}-390-portada.png` });
  if (vw === 1440 && plan === 1) await p.locator('.vp').screenshot({ path: `${SALIDA}/borrador-sun-1440-charly.png` });
  console.log(`${t}: ${total} preguntas · dirección ${m.dir} · titular ${m.fs}px ${m.ff.split(',')[0]} · portada ${Math.round(m.heroH)}px · ${errores.length} errores de consola`);
  await ctx.close();
}

// prueba del vecino en pantalla (sun, 390): dos personas del mismo oficio
const salida = [];
for (const [nombre, per] of [['charly', P1], ['pedro', P2], ['miguel', PM]]) {
  const { ctx, p } = await flujo(b, 1, 390, per);
  const r = await p.evaluate(() => ({ h2: document.querySelector('.vp h2.tit').textContent, dir: document.querySelector('.vp').dataset.dir, mani: document.querySelector('.vp .mani')?.textContent || '', cie: document.querySelector('.vp .cie')?.textContent || '', frases: [...document.querySelectorAll('.corp ol li')].map((l) => l.textContent), nav: document.querySelector('.vp .logo b').textContent }));
  salida.push([nombre, r]);
  if (nombre !== 'charly') await p.locator('.vp').screenshot({ path: `${SALIDA}/borrador-${nombre}-390.png` });
  await ctx.close();
}
const [[, a], [, c]] = salida;
ok(a.h2 !== c.h2 && a.mani !== c.mani && a.cie !== c.cie && a.nav !== c.nav && JSON.stringify(a.frases) !== JSON.stringify(c.frases), 'vecino en pantalla: titular, manifiesto, cierre, marca o frases iguales');
ok(!salida.some(([, r]) => /Lo dejo andando/.test(JSON.stringify(r))), 'vecino: salió la frase fija del rubro');
ok(salida[2][1].dir === 'escenario', `Miguel debería caer en Escenario (cayó en ${salida[2][1].dir})`);
console.log('vecino:', salida.map(([n, r]) => `${n} → «${r.h2}» (${r.dir}, ${r.nav})`).join('  |  '));

// BUG de ClAI-nte (27-10): volver a abrir la página en la misma pestaña NO arrastra a la persona anterior
{
  const { p } = await flujo(b, 1, 390, P1);
  await p.goto(BASE.replace('preguntas', 'index'));   // misma pestaña: vuelve al inicio y abre las preguntas otra vez
  await p.goto(BASE + '?plan=1');
  await sigPaso(p);
  ok((await p.inputValue('[data-k="name"]')) === '', 'fuga: el nombre de la persona anterior sigue ahí');
  ok(await p.evaluate(() => !sessionStorage.getItem('soul.respuestas.v1') || JSON.parse(sessionStorage.getItem('soul.respuestas.v1')).name === ''), 'fuga: quedaron respuestas guardadas');
  const { p: p2 } = await flujo(b, 1, 390, PM, 844, p);   // ahora contesta Miguel en esa misma pestaña
  const t = await p2.evaluate(() => document.querySelector('.vp').innerText + ' ' + document.querySelector('.corp').innerText);
  ok(!/Frenos|Cambio de aceite|taller o local/i.test(t) && /Canto en misa/.test(t), 'fuga: el borrador de Miguel trae datos del mecánico');
  await p.close();
}
// lo mismo, pero abandonando a medias (sin enviar): lo escrito queda en la pestaña y la página nueva NO debe leerlo
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.goto(BASE + '?plan=1'); await sigPaso(p); await p.fill('[data-k="name"]', 'Carlos Rojas');
  await p.click('[data-a="oficio"][data-i="14"]'); await sigPaso(p);
  ok(await p.evaluate(() => JSON.parse(sessionStorage.getItem('soul.respuestas.v1')).name === 'Carlos Rojas'), 'preparación: no quedó nada guardado a medias');
  await p.goto(BASE.replace('preguntas', 'index')); await p.goto(BASE + '?plan=1'); await sigPaso(p);
  ok((await p.inputValue('[data-k="name"]')) === '' && (await p.evaluate(() => sessionStorage.getItem('soul.respuestas.v1'))) === null || (await p.evaluate(() => JSON.parse(sessionStorage.getItem('soul.respuestas.v1')).name)) === '', 'fuga a medias: la persona nueva ve el nombre de la anterior');
  await ctx.close();
}
// recargar SÍ conserva lo escrito (no pierde a quien actualiza por error)
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.goto(BASE + '?plan=0'); await sigPaso(p); await p.fill('[data-k="name"]', 'Ana Prueba'); await p.reload();
  ok((await p.inputValue('[data-k="name"]')) === 'Ana Prueba', 'recargar perdió lo escrito');
  await ctx.close();
}
// nombre largo en móvil: se lee entero (ajusta, no corta)
{
  const { ctx, p } = await flujo(b, 0, 390, PA);
  const r = await p.evaluate(() => { const l = document.querySelector('.vp .logo b'), nav = document.querySelector('.vp .nav'); const a = l.getBoundingClientRect(), c = nav.getBoundingClientRect(); return { sw: l.scrollWidth, cw: l.clientWidth, dentro: a.right <= c.right + 1 && a.left >= c.left - 1, ov: getComputedStyle(l).textOverflow, t: l.textContent }; });
  ok(r.sw <= r.cw + 1 && r.dentro && r.ov === 'clip', `nombre cortado en 390: ${JSON.stringify(r)}`);
  await p.locator('.vp').screenshot({ path: `${SALIDA}/borrador-mari-390.png` });
  // el enlace del correo vuelve a dibujar el borrador, sin POST ni datos de contacto
  const env = await (async () => { const f = await flujo(b, 0, 390, P1); const e = f.envio(); await f.ctx.close(); return e; })();
  ok(env && /^[A-Za-z0-9_-]{10,6000}$/.test(env.borrador), 'el POST no trae el borrador codificado');
  const v = await ctx.newPage(); let post = false; v.on('request', (q) => { if (q.method() === 'POST') post = true; });
  await v.goto(BASE + '#borrador=' + env.borrador); await v.waitForSelector('.vp');
  const vt = await v.evaluate(() => ({ h2: document.querySelector('.vp h2.tit').textContent, h1: document.querySelector('h1.q').textContent, acc: document.getElementById('acciones').innerText, tel: document.body.innerText.includes('1234 5678') }));
  ok(vt.h2.includes('Le explico a cada cliente') && /Borrador de Carlos/.test(vt.h1) && !post && !vt.tel && vt.acc.trim() === '', `enlace del borrador: ${JSON.stringify(vt)}`);
  await ctx.close();
}
// cambiar de dirección cambia la tipografía
{
  const { ctx, p } = await flujo(b, 0, 390, P1);
  const antes = await p.evaluate(() => getComputedStyle(document.querySelector('.vp h2.tit')).fontFamily);
  const actual = await p.evaluate(() => ['escenario', 'taller', 'obra'].indexOf(document.querySelector('.vp').dataset.dir));
  await p.click(`[data-a="dir"][data-i="${(actual + 1) % 3}"]`);
  const despues = await p.evaluate(() => getComputedStyle(document.querySelector('.vp h2.tit')).fontFamily);
  ok(antes !== despues, 'cambiar la dirección no cambió la tipografía');
  await ctx.close();
}
await b.close();
console.log(fallos ? `probar_soul2: ${fallos} falla(s) de ${n}` : `probar_soul2: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
