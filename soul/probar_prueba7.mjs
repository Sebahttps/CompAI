/* SOUL · «pago a la semana» (Grace y Sebastián, 24-11-2026), en un navegador real y sin tocar Google:
   el Apps Script y la entrada con Google se simulan interceptando las peticiones.
   1) El sitio publicado (soul/s/#<código>): con id consulta el estado; prueba = sello + noindex; activo = sin sello;
      apagado = aviso con WhatsApp de CompAI; servidor caído = el sitio igual; enlace viejo sin id = como siempre.
   2) La pantalla final de las preguntas: con el formulario conectado, el enlace sale solo después de entrar con Google
      y registrar el sitio; el id viaja dentro del código. Sin endpoint, todo como antes.
   Ejecutar (desde sitio/compai):  python -m http.server 8772 --bind 127.0.0.1  ;  node soul/probar_prueba7.mjs
   Variables: BASE (por defecto http://127.0.0.1:8772/soul/) */
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = (process.env.BASE || 'http://127.0.0.1:8772/soul/').replace(/(preguntas\.html|s\/)$/, '');
let n = 0, fallos = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.log('  x ' + m); } };
const CFG_ON = 'window.SOUL_CFG={"endpoint":"https://script.google.com/macros/s/prueba/exec","whatsapp":"56962469977","googleId":"prueba.apps.googleusercontent.com","pagos":{"sun":{"mensual":"https://mpago.la/SUNMES","anual":"https://mpago.la/SUNANIO"}}};';
const CFG_OFF = 'window.SOUL_CFG={"endpoint":"","whatsapp":"56962469977"};';
const GSI = `window.google={accounts:{id:{initialize:function(o){window.__gcb=o.callback;},renderButton:function(el){el.innerHTML='<button type="button" data-prueba="google">Continuar con Google</button>';el.firstChild.onclick=function(){window.__gcb({credential:'tok-prueba'});};}}}};`;
const SID = 'sabc123def45';

const b = await chromium.launch();
async function pagina(cfg, responder) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const pedidos = [], errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await p.route('**/soul/config.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: cfg }));
  await p.route('**/accounts.google.com/gsi/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: GSI }));
  await p.route('**/script.google.com/**', (r) => {
    const q = JSON.parse(r.request().postData() || '{}'); pedidos.push(q);
    const res = responder(q);
    if (res === 'caido') return r.fulfill({ status: 500, body: 'error' });
    if (res === 'cuelga') return;   // nunca responde: el corte de 8 s decide
    r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(res) });
  });
  return { ctx, p, pedidos, errores };
}

// el código de un sitio de muestra, armado con el mismo codificar() del sitio
const prep = await pagina(CFG_OFF, () => ({}));
await prep.p.goto(BASE + 's/'); await prep.p.waitForFunction(() => window.SOUL_SITIO);
const codigo = (sid, extra) => prep.p.evaluate(([sid, extra]) => {
  const S = SOUL_SITIO, ST = S.nuevo();
  Object.assign(ST, { plan: 1, name: 'Carlos Rojas', apodo: 'Charly', oficio: 14, palette: 3, unico: 'Le explico a cada cliente qué le cambié y por qué', tel: '+56 9 1234 5678', modalidad: 0, where: ['Domicilio'], avg: 0, reply: 0, books: 0 }, extra || {});
  ST.svcs[0].n = 'Cambio de aceite'; ST.svcs[0].p = '$25.000';
  if (sid) ST.sid = sid;
  return S.codificar(ST);
}, [sid, extra]);
const conId = await codigo(SID), sinId = await codigo('');


// ── 1) el sitio publicado ──
async function abrir(cod, cfg, res) {
  const x = await pagina(cfg, (q) => (q.tipo === 'estado-sitio' ? res : { ok: true }));
  await x.p.goto(BASE + 's/#' + cod);
  await x.p.waitForSelector('.vp, .vacio', { timeout: 15000 });
  await x.p.waitForTimeout(250);
  return x;
}
{
  const x = await abrir(conId, CFG_ON, { ok: true, estado: 'prueba', dias: 3 });
  const m = await x.p.evaluate(() => ({ vp: !!document.querySelector('.vp'), sello: (document.querySelector('.sello-prueba') || {}).textContent || '', robots: (document.querySelector('meta[name="robots"]') || {}).content, ov: document.documentElement.scrollWidth - innerWidth }));
  ok(m.vp && /prueba/.test(m.sello) && /3 días/.test(m.sello), 'prueba: sitio con sello y días que quedan → ' + JSON.stringify(m));
  ok(m.robots === 'noindex', 'prueba: noindex');
  ok(m.ov <= 0, 'prueba: el sello no desborda a 390');
  ok(x.pedidos.length === 1 && x.pedidos[0].tipo === 'estado-sitio' && x.pedidos[0].id === SID && Object.keys(x.pedidos[0]).length === 2, 'la consulta lleva solo tipo e id → ' + JSON.stringify(x.pedidos[0]));
  await x.p.screenshot({ path: (process.env.SALIDA || '.') + '/prueba7-sello-390.png' }).catch(() => {});
  ok(x.errores.length === 0, 'prueba: errores de página ' + x.errores);
  await x.ctx.close();
}
{
  const x = await abrir(conId, CFG_ON, { ok: true, estado: 'prueba', dias: 1 });
  ok(/queda 1 día/.test(await x.p.textContent('.sello-prueba')), 'prueba: «queda 1 día» en singular');
  await x.ctx.close();
}
{
  const x = await abrir(conId, CFG_ON, { ok: true, estado: 'activo' });
  ok(await x.p.$('.vp') && !(await x.p.$('.sello-prueba')), 'activo: el sitio sin sello');
  await x.ctx.close();
}
{
  const x = await abrir(conId, CFG_ON, { ok: true, estado: 'apagado' });
  const m = await x.p.evaluate(() => ({ vp: !!document.querySelector('.vp'), txt: document.body.innerText, ln: [...document.querySelectorAll('.vacio a')].map((a) => a.href), ov: document.documentElement.scrollWidth - innerWidth }));
  ok(!m.vp && /pausa/.test(m.txt) && !/Carlos|aceite/.test(m.txt), 'apagado: aviso y nada del sitio → ' + JSON.stringify(m).slice(0, 200));
  ok(m.ln[0] === 'https://mpago.la/SUNMES' && m.ln[1] === 'https://mpago.la/SUNANIO' && /^https:\/\/wa\.me\/56962469977\?text=/.test(m.ln[2]), 'apagado: pagar su plan (mes primero si eligió mes), después WhatsApp → ' + JSON.stringify(m.ln));
  ok(/19\.990/.test(m.txt) && /199\.900/.test(m.txt) && m.ov <= 0, 'apagado: montos del plan sun y sin desborde a 390');
  await x.p.screenshot({ path: (process.env.SALIDA || '.') + '/prueba7-pausa-390.png' }).catch(() => {});
  await x.ctx.close();
}
{
  const anual = await codigo(SID, { modalidad: 1 });
  const x = await abrir(anual, CFG_ON, { ok: true, estado: 'apagado' });
  const ln = await x.p.$$eval('.vacio a', (l) => l.map((a) => a.href));
  ok(ln[0] === 'https://mpago.la/SUNANIO', 'apagado: si eligió el año, ese enlace va primero → ' + JSON.stringify(ln));
  await x.ctx.close();
}
{
  const x = await abrir(conId, CFG_ON.replace(/,"pagos":\{"sun":\{[^}]*\}\}/, ''), { ok: true, estado: 'apagado' });
  const ln = await x.p.$$eval('.vacio a', (l) => l.map((a) => a.href));
  ok(ln.length === 1 && /wa\.me/.test(ln[0]), 'apagado sin enlaces de pago configurados: queda el WhatsApp → ' + JSON.stringify(ln));
  await x.ctx.close();
}
for (const [caso, res] of [['servidor con error', 'caido'], ['respuesta rara', { ok: true, estado: 'gratis' }], ['tope de consultas', { ok: false, error: 'tope' }]]) {
  const x = await abrir(conId, CFG_ON, res);
  ok(await x.p.$('.vp') && !(await x.p.$('.sello-prueba')), caso + ': se muestra el sitio (no se castiga al cliente)');
  await x.ctx.close();
}
{
  const t0 = Date.now(); const x = await abrir(conId, CFG_ON, 'cuelga');
  ok(await x.p.$('.vp') && Date.now() - t0 < 14000, 'servidor que no contesta: el sitio aparece tras el corte (' + (Date.now() - t0) + ' ms)');
  await x.ctx.close();
}
{
  const x = await abrir(sinId, CFG_ON, { ok: true, estado: 'apagado' });
  ok(await x.p.$('.vp') && x.pedidos.length === 0, 'enlace viejo sin id: se muestra como siempre y no consulta');
  await x.ctx.close();
}
{
  const x = await abrir(conId, CFG_OFF, { ok: true, estado: 'apagado' });
  ok(await x.p.$('.vp') && x.pedidos.length === 0, 'sin endpoint (maquetas): se muestra y no consulta');
  await x.ctx.close();
}
{
  const malo = await codigo('<img src=x onerror=alert(1)>');
  const x = await abrir(malo, CFG_ON, { ok: true, estado: 'apagado' });
  ok(await x.p.$('.vp') && x.pedidos.length === 0, 'un id que no tiene forma de id no se consulta');
  await x.ctx.close();
}

// ── 2) la pantalla final de las preguntas ──
const cargar = await codigo('');
async function terminar(cfg, responder) {
  const x = await pagina(cfg, responder);
  await x.p.goto(BASE + 'preguntas.html#cargar=' + cargar);
  await x.p.waitForSelector('#btn-next'); await x.p.click('#btn-next');
  await x.p.waitForSelector('.vp', { timeout: 15000 }); await x.p.waitForTimeout(300);
  return x;
}
const enlace = (p) => p.evaluate(() => (document.getElementById('enl-txt') || {}).value || '');
const sidDe = (p, url) => p.evaluate((u) => SOUL_SITIO.decodificar(u.split('#')[1]).sid, url);
{
  let estado = { ok: true, id: SID, estado: 'prueba', dias: 7 };
  const x = await terminar(CFG_ON, (q) => (q.tipo === 'sitio' ? estado : { ok: true }));
  ok(x.pedidos.some((q) => q.tipo === 'soul'), 'las respuestas se envían como siempre');
  ok(!(await enlace(x.p)), 'sin cuenta de Google no entrega el enlace');
  ok(await x.p.$('#g-btn-enl [data-prueba="google"]'), 'pide entrar con Google en «Tu enlace»');
  const wa = await x.p.$eval('.enlace a[href^="https://wa.me/56962469977"]', (a) => a.href).catch(() => '');
  ok(/Google/.test(decodeURIComponent(wa)), 'salida manual: WhatsApp de CompAI para quien no puede entrar con Google');
  ok(!x.pedidos.some((q) => q.tipo === 'sitio'), 'no registra sin cuenta');
  await x.p.click('#g-btn-enl [data-prueba="google"]');
  await x.p.waitForSelector('#enl-txt', { timeout: 8000 });
  const reg = x.pedidos.find((q) => q.tipo === 'sitio') || {};
  ok(reg.idToken === 'tok-prueba' && reg.plan === 'sun' && /1234/.test(reg.telefono) && reg.slug, 'el registro lleva token, plan, WhatsApp y slug → ' + JSON.stringify(reg));
  const u = await enlace(x.p);
  ok(/\/soul\/s\/#[A-Za-z0-9_-]{10,}$/.test(u) && await sidDe(x.p, u) === SID, 'el enlace lleva el id del servidor dentro del código');
  ok(u.split('#')[1].length <= 6000, 'el código con id cabe en 6000');
  ok(/7 días/.test(await x.p.textContent('.enlace')), 'dice que es una prueba de 7 días');
  ok(x.pedidos.filter((q) => q.tipo === 'sitio').length === 1, 'registra una sola vez');
  // «otra versión» cambia el código pero no pierde el id
  await x.p.click('[data-a="arte"]'); const u2 = await enlace(x.p);
  ok(u2 !== u && await sidDe(x.p, u2) === SID, '«Otra versión» conserva el id');
  ok(x.errores.length === 0, 'final: errores de página ' + x.errores);
  await x.ctx.close();
}
for (const [caso, res, re] of [['prueba ya usada', { ok: true, id: SID, estado: 'apagado', existente: true }, /Ya usaste tu prueba/], ['en espera', { ok: true, id: SID, estado: 'espera' }, /en la fila/]]) {
  const x = await terminar(CFG_ON, (q) => (q.tipo === 'sitio' ? res : { ok: true }));
  await x.p.click('#g-btn-enl [data-prueba="google"]');
  await x.p.waitForFunction((r) => new RegExp(r).test(document.querySelector('.enlace').textContent), re.source, { timeout: 8000 }).catch(() => {});
  ok(re.test(await x.p.textContent('.enlace')) && !(await enlace(x.p)) && await x.p.$('.enlace a[href^="https://wa.me/56962469977"]'), caso + ': lo dice, sin enlace y con WhatsApp');
  await x.ctx.close();
}
{
  let res = { ok: false, error: 'cuenta' };
  const x = await terminar(CFG_ON, (q) => (q.tipo === 'sitio' ? res : { ok: true }));
  await x.p.click('#g-btn-enl [data-prueba="google"]');
  await x.p.waitForSelector('#g-btn-enl [data-prueba="google"]', { timeout: 8000 });
  ok(!(await enlace(x.p)), 'cuenta rechazada: vuelve a pedir Google');
  res = 'caido';
  await x.p.click('#g-btn-enl [data-prueba="google"]');
  await x.p.waitForSelector('[data-a="regenl"]', { timeout: 8000 });
  ok(/No pudimos/.test(await x.p.textContent('.enlace')), 'servidor caído al registrar: lo dice y ofrece probar de nuevo');
  res = { ok: true, id: SID, estado: 'prueba', dias: 7 };
  await x.p.click('[data-a="regenl"]');
  await x.p.waitForSelector('#enl-txt', { timeout: 8000 });
  ok(await sidDe(x.p, await enlace(x.p)) === SID, '«Probar de nuevo» entrega el enlace');
  await x.ctx.close();
}
{
  const x = await terminar(CFG_OFF, () => ({ ok: true }));
  ok(/\/soul\/s\/#/.test(await enlace(x.p)) && !(await x.p.$('#g-btn-enl')) && x.pedidos.length === 0, 'sin endpoint: el enlace sale como antes, sin Google');
  await x.ctx.close();
}
await prep.ctx.close(); await b.close();
console.log(fallos ? `probar_prueba7: ${fallos} falla(s) de ${n}` : `probar_prueba7: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
