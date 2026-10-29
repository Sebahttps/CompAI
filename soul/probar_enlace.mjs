/* SOUL · Fase 2: el ENLACE PUBLICO (compai.cl/soul/s/#<codigo>), de punta a punta en un navegador real.
   Recorre fresh, sun y vibe con respuestas de oficios distintos (panaderia, mecanica, animacion), toma el
   enlace de la pantalla final y lo abre en 390x844 y 1440x900. Comprueba: consola limpia, sin scroll
   horizontal, WhatsApp (con el numero de ESA persona) y formulario, nombre y servicios de ESA persona y
   nada de la otra (fuga), pie 4.b, POST del formulario con el slug, peso del codigo y enlaces rotos.
   Ejecutar (desde sitio/compai):  python -m http.server 8765  ;  node soul/probar_enlace.mjs
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
const casos = [
  { plan: 0, per: PA, otra: ['Cambio de aceite', 'Frenos', 'Canto en misa'], etq: 'fresh-panaderia' },
  { plan: 1, per: P1, otra: ['Pan amasado', 'Tortas por encargo', 'Canto en misa'], etq: 'sun-mecanico' },
  { plan: 2, per: PM, otra: ['Cambio de aceite', 'Frenos', 'Pan amasado'], etq: 'vibe-animador' }
];
const urls = {};
for (const c of casos) {
  const t = c.etq;
  const { ctx, p, errores, envio } = await flujo(b, c.plan, 390, c.per);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  // la pantalla final muestra el enlace con sus dos botones
  const enl = await p.evaluate(() => ({ txt: document.getElementById('enl-txt')?.value || '', btnCopiar: !!document.querySelector('[data-a="copiarenl"]'), wa: document.querySelector('.enlace a[href^="https://wa.me/?text="]')?.href || '' }));
  ok(/\/soul\/s\/#[A-Za-z0-9_-]{10,}$/.test(enl.txt), `${t}: la pantalla final no muestra «Tu enlace» (${enl.txt.slice(0, 60)})`);
  ok(enl.btnCopiar, `${t}: falta «Copiar enlace»`);
  ok(enl.wa && decodeURIComponent(enl.wa).includes(enl.txt), `${t}: «Compartir por WhatsApp» no lleva el enlace`);
  await p.click('[data-a="copiarenl"]');
  await p.waitForFunction(() => document.getElementById('copiado-enl').textContent.length > 0, null, { timeout: 3000 }).catch(() => {});
  const copiado = await p.evaluate(() => document.getElementById('copiado-enl').textContent);
  ok(/Copiado/.test(copiado), `${t}: Copiar enlace no confirmó («${copiado}»)`);
  const portapapeles = await p.evaluate(() => navigator.clipboard.readText()).catch(() => enl.txt);
  ok(portapapeles === enl.txt, `${t}: el portapapeles no tiene el enlace`);
  const e = envio(); ok(e && /^[A-Za-z0-9_-]{10,6000}$/.test(e.borrador), `${t}: el POST trae un borrador que Code.gs rechazaría (${e && e.borrador.length})`);
  ok(e && enl.txt.endsWith('#' + e.borrador), `${t}: el enlace de la pantalla y el del correo no son el mismo código`);
  ok(errores.length === 0, `${t}: consola con ruido en las preguntas → ${errores.join(' | ')}`);
  urls[t] = enl.txt;
  console.log(`${t}: código de ${enl.txt.split('#')[1].length} caracteres · ${enl.txt.length} la URL entera`);
  await p.screenshot({ path: `${SALIDA}/enlace-final-${t}-390.png` });
  await ctx.close();
}

// abrir cada enlace «como lo abriría un cliente»: contexto limpio, sin estado de las preguntas
for (const c of casos) for (const [vw, vh] of [[390, 844], [1440, 900]]) {
  const t = `${c.etq} @${vw}`;
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } }); const p = await ctx.newPage();
  const errores = []; let post = null, cargasPreguntas = 0;
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()); });
  p.on('pageerror', (er) => errores.push('pageerror ' + er.message));
  p.on('request', (q) => { if (/preguntas\.html|app\.js/.test(q.url())) cargasPreguntas++; });
  await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await p.route('**/script.google.com/**', (r) => { post = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); });
  await p.goto(urls[c.etq]); await p.waitForSelector('.vp'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const m = await p.evaluate(() => {
    const vp = document.querySelector('.vp'), r = (e) => e.getBoundingClientRect(), pc = vp.querySelector('.pie-compai'), im = pc.querySelector('img');
    const wa = [...vp.querySelectorAll('a[href^="https://wa.me/"]')].map((a) => a.href);
    return {
      titulo: document.title, h2: vp.querySelector('h2.tit').textContent, texto: vp.innerText, overflow: document.documentElement.scrollWidth - innerWidth,
      form: !!vp.querySelector('form[data-cotiza]'), slug: vp.querySelector('form[data-cotiza]')?.dataset.cotiza, wa,
      cuestionario: !!document.querySelector('.app,#btn-next,.cab-app') || /Siguiente|Ver mi ficha|Empezar/.test(document.body.innerText),
      panel: !!vp.querySelector('[aria-label="Tu panel"]'), fake: !!vp.querySelector('.fake'),
      pc: [r(pc).width, r(pc).height, r(im).width, r(im).height, getComputedStyle(im).top, getComputedStyle(vp.querySelector('footer .pie')).marginTop],
      pieImg: im.getAttribute('src'), imgOk: im.complete && im.naturalWidth === 310, vh: innerHeight, hero: r(vp.querySelector('.hero')).height
    };
  });
  ok(m.h2.includes(c.per.unico.split(' ').slice(0, 3).join(' ')), `${t}: el titular no es el de la persona («${m.h2}»)`);
  ok(m.titulo.includes(c.per.apodo || c.per.name), `${t}: el título de la pestaña no es el de la persona («${m.titulo}»)`);
  for (const s of c.per.svc) ok(m.texto.includes(s), `${t}: falta su servicio «${s}»`);
  for (const s of c.otra) ok(!m.texto.includes(s), `${t}: FUGA, aparece «${s}» de otra persona`);
  ok(m.overflow <= 0, `${t}: desborde horizontal ${m.overflow}px`);
  ok(m.form && m.slug, `${t}: falta el formulario de cotización`);
  ok(m.wa.length >= 2 && m.wa.every((h) => h.startsWith('https://wa.me/56912345678?text=')), `${t}: WhatsApp no apunta al número de la persona (${m.wa.join(' ')})`);
  ok(!m.cuestionario, `${t}: se ve como cuestionario`);
  ok(!m.fake && (c.plan !== 2 || !m.panel), `${t}: maqueta de formulario o panel privado a la vista`);
  ok(!/borrador|referencia|hecho con|ejemplo/i.test(m.texto), `${t}: el sitio habla de sí mismo`);
  const cerca = (a, z) => Math.abs(a - z) < 0.1;
  ok(cerca(m.pc[0], 113.4) && cerca(m.pc[1], 14.4) && cerca(m.pc[2], 113.4) && cerca(m.pc[3], 34.65) && m.pc[4] === '-10.08px' && m.pc[5] === '40px' && m.imgOk && /pie-(compai-claro|alma-compai-oscuro)\.png$/.test(m.pieImg), `${t}: pie 4.b → ${JSON.stringify(m.pc)} ${m.pieImg}`);
  ok(m.hero >= 0.7 * m.vh - 80, `${t}: portada baja (${Math.round(m.hero)} de ${m.vh})`);
  ok(cargasPreguntas === 0, `${t}: el enlace cargó el cuestionario`);
  // el formulario: validar, enviar, y el POST lleva el slug
  await p.click('.vp form button[type=submit]');
  ok(/nombre/i.test(await p.textContent('.vp .est')), `${t}: formulario vacío no avisó`);
  await p.fill('.vp form [name=nombre]', 'Cliente Prueba'); await p.fill('.vp form [name=telefono]', '+56 9 8888 7777'); await p.fill('.vp form [name=correo]', 'cliente@example.cl');
  await p.fill('.vp form [name=mensaje]', 'Necesito una cotización para el sábado');
  await p.click('.vp form button[type=submit]'); await p.waitForFunction(() => /Listo/.test(document.querySelector('.vp .est').textContent), null, { timeout: 5000 }).catch(() => {});
  ok(post && post.organismo === 'Sitio SOUL · ' + m.slug && post.nombre === 'Cliente Prueba' && post.correo === 'cliente@example.cl' && /sábado/.test(post.mensaje) && post.mensaje.includes(m.slug) && !post.tipo, `${t}: POST del formulario → ${JSON.stringify(post)}`);
  ok(/Listo/.test(await p.textContent('.vp .est')), `${t}: no confirmó el envío`);
  ok(errores.length === 0, `${t}: consola con ruido → ${errores.join(' | ')}`);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: `${SALIDA}/enlace-${c.etq}-${vw}-portada.png` });
  await p.screenshot({ path: `${SALIDA}/enlace-${c.etq}-${vw}-completo.png`, fullPage: true });
  console.log(`${t}: «${m.h2}» · ${m.wa.length} botones WhatsApp · form ${m.slug} · ${errores.length} errores de consola`);
  await ctx.close();
}

// enlaces rotos: se dice, no se pinta un sitio vacío
{
  const base = new URL('s/', BASE).href;
  for (const h of ['', '#', '#abc', '#' + 'A'.repeat(40), '#e30']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (er) => errs.push(er.message));
    await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await p.goto(base + h);
    ok(await p.$('.vacio') && !(await p.$('.vp')) && errs.length === 0, `enlace roto «${h.slice(0, 12)}»: no avisó bien (${errs})`);
    if (h === '#abc') await p.screenshot({ path: `${SALIDA}/enlace-roto-390.png` });
    await ctx.close();
  }
}

// peso del código en el peor caso razonable: vibe, 6 servicios, todas las líneas al tope de caracteres, con tildes
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.goto(BASE); await p.waitForFunction(() => window.SOUL_SITIO);
  const r = await p.evaluate(() => {
    const S = SOUL_SITIO, ST = S.nuevo();
    const pal = 'ñandú árbol cañería mantención instalación reparación ceremonia matrimonio camión señora pequeño garantía además también atención jardín día'.split(' ');
    let k = 7; const txt = (n) => { let s = ''; while (s.length < n) { k = (k * 31 + 11) % 997; s += pal[k % pal.length] + ' '; } return s.slice(0, n).trim(); };
    Object.assign(ST, { plan: 2, name: txt(40), apodo: txt(30), oficio: 21, oficioOtro: txt(60), likes: ['Otro', 'a', 'b'], likeOtro: txt(60), palette: 5, conceptText: txt(140), enfoque: 0, tone: 3, bg: 1, motion: 2,
      where: ['Santiago', 'Domicilio', 'Online'], comunas: txt(200), insta: txt(40), fb: txt(40), fields: ['Fecha', 'Dirección', 'Cantidad', 'Fotos', 'Presupuesto', 'Horario'], avg: 3, reply: 3, books: 3, modalidad: 1, tel: '+56 9 1234 5678',
      origen: txt(220), unico: txt(90), nunca: txt(90), momento: txt(90), cifraN: '+1.500', cifraU: 'Otro', cifraOtro: txt(30), cierre: txt(80), dir: 1 });
    ST.svcs = [0, 1, 2, 3, 4, 5].map(() => ({ n: txt(70), p: '$150.000', d: txt(140), ph: 'lib', phName: '' }));
    const c = S.codificar(ST), antes = btoa(unescape(encodeURIComponent(JSON.stringify(ST)))).length;
    const vuelta = S.decodificar(c);
    return { largo: c.length, sinRecortar: antes, igual: JSON.stringify(vuelta.svcs.map((v) => v.n)) === JSON.stringify(ST.svcs.map((v) => v.n)) && vuelta.cierre === ST.cierre && vuelta.tel === ST.tel };
  });
  console.log(`peor caso (vibe, 6 servicios, todo al tope): código ${r.largo} caracteres (el formato anterior sin recortar: ${r.sinRecortar})`);
  ok(r.largo <= 8000, `el código del peor caso pesa ${r.largo} (> 8000)`);
  ok(r.largo <= 6000, `el código del peor caso pesa ${r.largo} y Code.gs solo acepta 6000: se perdería el enlace del correo`);
  ok(r.igual, 'codificar → decodificar no devuelve lo mismo');
  await ctx.close();
}
await b.close();
console.log(fallos ? `probar_enlace: ${fallos} falla(s) de ${n}` : `probar_enlace: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
