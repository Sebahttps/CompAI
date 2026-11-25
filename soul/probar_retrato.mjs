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
await p.route('**/script.google.com/**', (r) => { const q = JSON.parse(r.request().postData()); pedidos.push(q); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(typeof respuesta === 'function' ? respuesta(q) : respuesta) }); });
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

// 2) selector por secciones (23-11-2026): 6 pestañas, cada una con sus efectos; se elige UNO
const SECC = { soul: ['fresh', 'sun', 'vibe'], parati: ['calida', 'cine'], color: ['gradacion', 'estudio'], nostalgia: ['ochenta'], surreal: ['clones', 'aerea'], personajes: ['arcilla', 'anime'] };
const chips = () => p.$$eval('.ret-chips [data-a="estilo"]', (l) => l.map((e) => e.dataset.i));
ok((await p.$$('.ret-tabs [data-a="retsec"]')).length === 6, 'no están las 6 secciones');
ok(JSON.stringify(await chips()) === JSON.stringify(SECC.soul), 'la sección soul no muestra fresh, sun y vibe');
ok(!(await p.$('[data-a="retcomb"]')), 'muestra «combinar» sin texto autorizado');
for (const [sec, claves] of Object.entries(SECC)) {
  await p.click(`.ret-tabs [data-i="${sec}"]`);
  ok(await p.getAttribute(`.ret-tabs [data-i="${sec}"]`, 'aria-pressed') === 'true', 'la sección ' + sec + ' no queda marcada');
  ok(JSON.stringify(await chips()) === JSON.stringify(claves), 'la sección ' + sec + ' muestra ' + (await chips()));
}
// sin desborde a 390 y áreas táctiles de al menos 44 px (pestañas y efectos de todas las secciones)
for (const sec of Object.keys(SECC)) {
  await p.click(`.ret-tabs [data-i="${sec}"]`);
  const m = await p.evaluate(() => {
    const c = document.querySelector('.ret');
    const bajos = Array.from(c.querySelectorAll('.ret-tab,.ret-chips .chip')).filter((e) => e.getBoundingClientRect().height < 43.5).length;
    const fuera = Array.from(c.querySelectorAll('button')).filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).length;
    return { sc: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bajos, fuera };
  });
  ok(m.sc <= m.cw && m.fuera === 0, 'desborde horizontal en ' + sec + ': ' + JSON.stringify(m));
  ok(m.bajos === 0, 'hay botones de menos de 44 px en ' + sec);
}
// con teclado: Enter abre una sección y Espacio elige un efecto
await p.focus('.ret-tabs [data-i="nostalgia"]'); await p.keyboard.press('Enter');
ok(await p.getAttribute('.ret-tabs [data-i="nostalgia"]', 'aria-pressed') === 'true', 'Enter no abre la sección');
await p.focus('.ret-chips [data-i="ochenta"]'); await p.keyboard.press('Space');
ok(await p.getAttribute('.ret-chips [data-i="ochenta"]', 'aria-pressed') === 'true', 'Espacio no elige el efecto');
ok(await p.$eval('.ret-tabs [data-i="nostalgia"]', (e) => e.classList.contains('tiene')), 'la sección del efecto elegido no lo marca');
await p.click('.ret-tabs [data-i="soul"]');
ok(await p.getAttribute('.ret-chips [data-i="vibe"]', 'aria-pressed') === 'false', 'vibe sigue marcado al elegir otro efecto (sin combinar)');
await p.click('.ret-tabs [data-i="nostalgia"]');
await (await p.$('.ret')).screenshot({ path: `${SALIDA}/selector-390.png` });

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
ok(q.estilo === 'ochenta' && !('estilo2' in q), 'el pedido no lleva el estilo (y solo uno): ' + q.estilo + '/' + q.estilo2);
ok(/^data:image\/jpeg;base64,/.test(q.foto || ''), 'el pedido no lleva la foto achicada en JPEG');
ok(q.oficio === 'Mecánica', 'el pedido no lleva el oficio: ' + q.oficio);
ok(Array.isArray(q.colores) && q.colores.length === 3, 'el pedido no lleva los 3 colores');
ok(q.idToken === 'tok-prueba', 'el pedido no lleva el token de Google');
ok(await p.$('[data-a="retuse"]') && await p.$('[data-a="retdl"]'), 'faltan «usar en portada» o «descargar»');
await (await p.$('.ret')).screenshot({ path: `${SALIDA}/retrato-panel-390.png` });

// 5) usarlo como foto de portada
ok(q.formato === 'vertical', 'el retrato de vista previa debía pedirse en formato celular: ' + q.formato);
const nAntesUso = pedidos.length;
await p.click('[data-a="retuse"]');
await p.waitForTimeout(600);
const qa = pedidos.slice(nAntesUso).find((x) => x.tipo === 'retrato') || {};
ok(qa.formato === 'ancha' && qa.estilo === 'ochenta' && qa.foto === q.foto, 'usar en portada debía pedir la versión de computador, mismo efecto y la foto ORIGINAL: ' + qa.formato + '/' + qa.estilo);
const foto = await p.evaluate(() => document.querySelector('.ret-res img') && document.querySelector('.ret-res img').getAttribute('src'));
ok(/^data:image\/png/.test(foto || ''), 'el retrato desapareció al usarlo');
// usarlo de nuevo no vuelve a cobrar: la versión de computador ya está hecha
const nOtra = pedidos.length; await p.click('[data-a="retuse"]'); await p.waitForTimeout(400);
ok(pedidos.length === nOtra, 'usar dos veces el mismo retrato volvió a pedir la versión de computador');
// el siguiente retrato parte de la foto original, no del retrato ya usado
await p.click('[data-a="retrato"]'); await p.waitForTimeout(600);
ok((pedidos[pedidos.length - 1] || {}).foto === q.foto, 'el retrato siguiente partió del retrato anterior y no de la foto original');

// 6) los topes se dicen en palabras, sin romper nada
respuesta = { ok: false, error: 'tope-persona', tope: 4 };
await p.click('[data-a="retrato"]');
await p.waitForFunction(() => /tus 4 retratos de hoy/.test((document.querySelector('#ret-msg') || {}).textContent || ''), null, { timeout: 8000 });
ok(true, '');
// 7) si el servidor no reconoce la cuenta, vuelve a pedir entrar con Google
respuesta = { ok: false, error: 'cuenta' };
await p.click('[data-a="retrato"]');
await p.waitForSelector('#g-btn [data-prueba="google"]', { timeout: 8000 });
ok(/Vuelve a entrar/.test(await p.textContent('#ret-msg')), 'no dice que vuelva a entrar');
// 8) el script en vivo aún no conoce los efectos nuevos: cae a uno conocido, sin error a la vista y sin un segundo cobro de cupo propio
respuesta = (q) => (q.estilo === 'calida' || q.estilo === 'sun' ? { ok: false, error: 'estilo' } : { ok: true, img: 'data:image/png;base64,' + PX });
await p.click('.ret-tabs [data-i="parati"]'); await p.click('.ret-chips [data-i="calida"]');
const antes = pedidos.length;
await p.click('#g-btn [data-prueba="google"]'); await p.waitForSelector('[data-a="retrato"]');
await p.click('[data-a="retrato"]');
await p.waitForFunction(() => /Creando/.test((document.querySelector('#ret-msg') || {}).textContent || '') === false && !document.querySelector('[data-a="retrato"][disabled]') && document.querySelector('.ret-res img'), null, { timeout: 8000 });
await p.waitForTimeout(300);
const cadena = pedidos.slice(antes).map((x) => x.estilo);
ok(JSON.stringify(cadena) === JSON.stringify(['calida', 'sun', 'retro']), 'la caída no sigue la cadena calida>sun>retro: ' + cadena);
ok(!/No se pudo/.test(await p.textContent('#ret-msg')), 'la caída muestra un error');
ok(pedidos.slice(antes).every((x) => !('estilo2' in x)), 'la caída manda estilo2');
// un estilo2 que el script viejo ignora no rompe nada: el pedido lleva estilo2 solo si se eligió
respuesta = { ok: true, img: 'data:image/png;base64,' + PX };

// 9) combinar dos efectos (solo si el texto del botón está en config.js; aquí se simula con retCombinar)
const p2 = await b.newPage({ viewport: { width: 390, height: 844 } });
const ped2 = [];
p2.on('pageerror', (e) => errores.push(String(e)));
await p2.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await p2.route('**/soul/config.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.SOUL_CFG={"endpoint":"https://script.google.com/macros/s/prueba/exec","whatsapp":"56962469977","googleId":"prueba.apps.googleusercontent.com","retCombinar":"Combinar con otro efecto"};' }));
await p2.route('**/accounts.google.com/gsi/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body:
  `window.google={accounts:{id:{initialize:function(o){window.__gcb=o.callback;},renderButton:function(el){el.innerHTML='<button type="button" data-prueba="google">Continuar con Google</button>';el.firstChild.onclick=function(){window.__gcb({credential:'tok-prueba'});};}}}};` }));
await p2.route('**/script.google.com/**', (r) => { ped2.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, img: 'data:image/png;base64,' + PX }) }); });
await p2.goto(BASE);
await p2.evaluate(() => sessionStorage.setItem('soul.respuestas.v1', JSON.stringify({ name: 'Carlos Muñoz', apodo: 'Charly', oficio: 14, palette: 3, tel: '962469977', unico: 'x', step: 9999, result: { ok: false } })));
await p2.reload(); await p2.waitForSelector('.ret');
const [fc2] = await Promise.all([p2.waitForEvent('filechooser'), p2.click('.ret [data-a="photoup"]')]);
await fc2.setFiles({ name: 'yo.png', mimeType: 'image/png', buffer: Buffer.from(PX, 'base64') });
await p2.waitForSelector('[data-a="retcomb"]');
const marc = (k) => p2.getAttribute(`.ret-chips [data-i="${k}"]`, 'aria-pressed');
ok(await p2.getAttribute('[data-a="retcomb"]', 'aria-pressed') === 'false', '«combinar» parte apagado');
// apagado, elegir otro reemplaza (un solo efecto)
await p2.click('.ret-tabs [data-i="parati"]'); await p2.click('.ret-chips [data-i="calida"]');
await p2.click('.ret-tabs [data-i="soul"]');
ok(await marc('vibe') === 'false', 'sin combinar, vibe sigue marcado');
// con «combinar»: calida (Para ti) + arcilla (Personajes)
await p2.click('[data-a="retcomb"]');
ok(await p2.getAttribute('[data-a="retcomb"]', 'aria-pressed') === 'true', 'no se enciende «combinar»');
await p2.click('.ret-tabs [data-i="personajes"]'); await p2.click('.ret-chips [data-i="arcilla"]');
ok(await marc('arcilla') === 'true', 'arcilla no queda marcada');
await p2.click('.ret-tabs [data-i="parati"]');
ok(await marc('calida') === 'true', 'calida pierde la marca al combinar');
await p2.click('.ret-chips [data-i="cine"]');   // misma sección que calida: la reemplaza
ok(await marc('cine') === 'true' && await marc('calida') === 'false', 'en la misma sección no reemplaza');
const marcadosTab = await p2.$$eval('.ret-tabs .tiene', (l) => l.map((e) => e.dataset.i));
ok(JSON.stringify(marcadosTab) === JSON.stringify(['parati', 'personajes']), 'las secciones con efecto elegido: ' + marcadosTab);
await p2.waitForSelector('#g-btn [data-prueba="google"]'); await p2.click('#g-btn [data-prueba="google"]');
await p2.waitForSelector('[data-a="retrato"]'); await p2.click('[data-a="retrato"]');
await p2.waitForSelector('.ret-res img');
const q2 = ped2.find((x) => x.tipo === 'retrato') || {};
ok(q2.estilo === 'cine' && q2.estilo2 === 'arcilla', 'el pedido combinado: ' + q2.estilo + '+' + q2.estilo2);
ok(/cine/.test(await p2.getAttribute('.ret-res img', 'alt') || '') === false && /Cinematográfico, Arcilla/.test(await p2.getAttribute('.ret-res img', 'alt')), 'el texto de la imagen no nombra los dos efectos');
await (await p2.$('.ret')).screenshot({ path: `${SALIDA}/combinar-390.png` });
// apagar «combinar» deja solo el primero
await p2.click('[data-a="retcomb"]');
ok(await marc('cine') === 'true' && (await p2.$$eval('.ret-tabs .tiene', (l) => l.length)) === 1, 'al apagar «combinar» quedan dos efectos');

// 10) enlace «#cargar=»: con el correo del panel en el código, la ficha queda con correo de aviso (plan vibe lo exige)
const cod = Buffer.from(JSON.stringify({ plan: 2, name: 'Ana Rojas', oficio: 14, email: 'ana@correo.cl', tel: '962469977' })).toString('base64url');
const p3 = await b.newPage({ viewport: { width: 390, height: 844 } });
p3.on('pageerror', (e) => errores.push(String(e)));
await p3.route('**/gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await p3.goto(BASE + '#cargar=' + cod);
await p3.waitForSelector('#paso');
// la ficha final solo se ve con todo contestado: se comprueba lo que la ficha va a mostrar y enviar (el correo guardado de la sesión)
const corr = () => p3.evaluate(() => (JSON.parse(sessionStorage.getItem('soul.respuestas.v1') || '{}')).correo);
ok(await corr() === 'ana@correo.cl', 'con #cargar el correo de aviso queda vacío: ' + await corr());
const cod2 = Buffer.from(JSON.stringify({ plan: 2, name: 'Ana Rojas', oficio: 14, tel: '962469977' })).toString('base64url');
await p3.evaluate(() => sessionStorage.clear());
await p3.goto(BASE + '#cargar=' + cod2); await p3.reload(); await p3.waitForSelector('#paso');
ok(await corr() === '', 'sin email en el código no se inventa correo');
await p3.screenshot({ path: `${SALIDA}/cargar-vibe-390.png` });

ok(errores.length === 0, 'errores de consola: ' + errores.join(' | '));
await b.close();
console.log(fallos ? `probar_retrato: ${fallos} falla(s) de ${n}` : `probar_retrato: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
