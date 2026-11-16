/* SOUL · prueba del retrato con estilo (16-11-2026).
   Sin gastar un peso: el Apps Script se simula. Comprueba que el panel pida la foto, que se elija el estilo,
   que el pedido lleve tipo, estilo, foto, oficio y colores, que el retrato vuelva y se pueda usar, y que un
   error del servidor se diga en palabras. Requiere `python -m http.server 8765` en sitio/compai. */
import { mkdirSync } from 'node:fs';
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = process.env.BASE || 'http://localhost:8765/soul/preguntas.html';
const SALIDA = process.env.SALIDA || '/tmp/soul-retrato'; mkdirSync(SALIDA, { recursive: true });
let n = 0, fallos = 0;
function ok(c, m) { n++; if (!c) { fallos++; console.log('  x ' + m); } }
const PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQAY3Y2wAAAAAElFTkSuQmCC';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errores = [], pedidos = []; let respuesta = { ok: true, img: 'data:image/png;base64,' + PX };
p.on('pageerror', (e) => errores.push(String(e)));
await p.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
// la configuración con un ID de cliente de prueba, y Google simulado: su botón entrega un token al hacer clic
await p.route('**/soul/config.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.SOUL_CFG={"endpoint":"https://script.google.com/macros/s/prueba/exec","whatsapp":"56962469977","googleId":"prueba.apps.googleusercontent.com"};' }));
await p.route('**/accounts.google.com/gsi/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body:
  `window.google={accounts:{id:{initialize:function(o){window.__gid=o.client_id;window.__gcb=o.callback;},renderButton:function(el){el.innerHTML='<button type="button" data-prueba="google">Continuar con Google</button>';el.firstChild.onclick=function(){window.__gcb({credential:'tok-prueba'});};}}}};` }));
await p.route('**/script.google.com/**', (r) => { pedidos.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(respuesta) }); });
// la pantalla final, como la ve quien terminó: el estado se deja en la sesión y se recarga (la app parte limpia si no es recarga)
await p.goto(BASE);
await p.evaluate(() => sessionStorage.setItem('soul.respuestas.v1', JSON.stringify({ name: 'Carlos Muñoz', apodo: 'Charly', oficio: 14, palette: 3, tel: '962469977', unico: 'Le explico a cada cliente qué le cambié y por qué', step: 9999, result: { ok: false } })));
await p.reload();
await p.waitForSelector('.ret');

// 1) sin foto: pide la foto
ok(await p.$('.ret [data-a="photoup"]'), 'sin foto, el panel no ofrece subirla');
const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('.ret [data-a="photoup"]')]);
await fc.setFiles({ name: 'yo.png', mimeType: 'image/png', buffer: Buffer.from(PX, 'base64') });
await p.waitForSelector('.ret-chips');

// 2) los 5 estilos, se elige uno
ok((await p.$$('.ret-chips [data-a="estilo"]')).length === 5, 'no están los 5 estilos');
await p.click('.ret-chips [data-i="retro"]');
ok(await p.getAttribute('.ret-chips [data-i="retro"]', 'aria-pressed') === 'true', 'el estilo elegido no queda marcado');

// 3) sin cuenta de Google no se puede crear: aparece el botón de Google, con el ID de SOUL
ok(!(await p.$('[data-a="retrato"]')), 'sin cuenta ya ofrece «Crear mi retrato»');
await p.waitForSelector('#g-btn [data-prueba="google"]', { timeout: 8000 });
ok(await p.evaluate(() => window.__gid) === 'prueba.apps.googleusercontent.com', 'Google no recibió el ID de cliente de SOUL');
await p.click('#g-btn [data-prueba="google"]');
await p.waitForSelector('[data-a="retrato"]');
ok(!(await p.$('#g-btn')), 'con cuenta sigue pidiendo entrar');

// 4) el pedido y el retrato de vuelta
await p.click('[data-a="retrato"]');
await p.waitForSelector('.ret-res img', { timeout: 8000 });
const q = pedidos.find((x) => x.tipo === 'retrato') || {};
ok(q.estilo === 'retro', 'el pedido no lleva el estilo: ' + q.estilo);
ok(/^data:image\/jpeg;base64,/.test(q.foto || ''), 'el pedido no lleva la foto achicada en JPEG');
ok(q.oficio === 'Mecánica', 'el pedido no lleva el oficio: ' + q.oficio);
ok(Array.isArray(q.colores) && q.colores.length === 3, 'el pedido no lleva los 3 colores');
ok(q.idToken === 'tok-prueba', 'el pedido no lleva el token de Google');
ok(await p.$('[data-a="retuse"]') && await p.$('[data-a="retdl"]'), 'faltan «usar en portada» o «descargar»');
await (await p.$('.ret')).screenshot({ path: `${SALIDA}/retrato-panel-390.png` });

// 5) usarlo como foto de portada
await p.click('[data-a="retuse"]');
const foto = await p.evaluate(() => document.querySelector('.ret-res img') && document.querySelector('.ret-res img').getAttribute('src'));
ok(/^data:image\/png/.test(foto || ''), 'el retrato desapareció al usarlo');

// 6) los topes se dicen en palabras, sin romper nada
respuesta = { ok: false, error: 'tope-persona', tope: 3 };
await p.click('[data-a="retrato"]');
await p.waitForFunction(() => /tus 3 retratos de hoy/.test((document.querySelector('#ret-msg') || {}).textContent || ''), null, { timeout: 8000 });
ok(true, '');
// 7) si el servidor no reconoce la cuenta, vuelve a pedir entrar con Google
respuesta = { ok: false, error: 'cuenta' };
await p.click('[data-a="retrato"]');
await p.waitForSelector('#g-btn [data-prueba="google"]', { timeout: 8000 });
ok(/Vuelve a entrar/.test(await p.textContent('#ret-msg')), 'no dice que vuelva a entrar');
ok(errores.length === 0, 'errores de consola: ' + errores.join(' | '));
await b.close();
console.log(fallos ? `probar_retrato: ${fallos} falla(s) de ${n}` : `probar_retrato: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
