/* SOUL · prueba del generador de arte (arte.js, 16-11-2026).
   Arma la ilustración de los 22 oficios en las 3 direcciones, comprueba que no salga NaN ni vacía,
   que la misma semilla dé la misma imagen y otra semilla otra, dibuja los 3 pósters y graba la historia animada.
   Deja las imágenes en SALIDA para MIRARLAS (una prueba en verde no dice que se vean bien).
   Requiere un servidor estático en sitio/compai: `python -m http.server 8765`. */
import { mkdirSync, writeFileSync } from 'node:fs';
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(m)); break; } catch (_) { /* siguiente */ } }
const BASE = process.env.BASE || 'http://localhost:8765';
const SALIDA = process.env.SALIDA || '/tmp/soul-arte'; mkdirSync(SALIDA, { recursive: true });
let n = 0, fallos = 0;
function ok(c, m) { n++; if (!c) { fallos++; console.log('  x ' + m); } }

const b = await chromium.launch();
const p = await b.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(String(e)));
await p.goto(BASE + '/soul/s/index.html');

// 1) la escena de los 22 oficios x 3 direcciones
const r = await p.evaluate(() => {
  const S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA, A = window.SOUL_ARTE, out = [];
  for (let of = 0; of < D.OFICIOS.length; of++) for (let dir = 0; dir < 3; dir++) {
    const ST = S.mezclar({ name: 'Prueba ' + of, oficio: of, dir, palette: of % 8 });
    const svg = A.escena(S.opcionesArte(ST, D, M, { w: 400, h: 760 }));
    out.push({ of, dir, nan: /NaN|undefined|Infinity/.test(svg), largo: svg.length, fig: (svg.match(/vpa-fig/g) || []).length });
  }
  const ST = S.mezclar({ name: 'Waldo', oficio: 14 });
  const a1 = A.escena(S.opcionesArte(ST, D, M, { w: 400, h: 760 })), a2 = A.escena(S.opcionesArte(ST, D, M, { w: 400, h: 760 }));
  ST.arte = 1; const a3 = A.escena(S.opcionesArte(ST, D, M, { w: 400, h: 760 }));
  return { out, igual: a1 === a2, distinta: a1 !== a3, viaja: S.decodificar(S.codificar(ST)).arte === 1 };
});
r.out.forEach((x) => { ok(!x.nan, `oficio ${x.of} dir ${x.dir}: NaN/undefined en el SVG`); ok(x.fig === 1 && x.largo > 2000, `oficio ${x.of} dir ${x.dir}: escena vacía o sin figura`); });
ok(r.igual, 'la misma semilla no dio la misma imagen');
ok(r.distinta, '«otra versión» no cambió la imagen');
ok(r.viaja, 'la versión del arte no viaja en el enlace');

// 2) una hoja de contacto: 6 oficios x 3 direcciones, para mirar
await p.setViewportSize({ width: 1260, height: 1500 });
await p.evaluate(() => {
  const S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA, A = window.SOUL_ARTE;
  const ofs = [0, 2, 7, 11, 14, 20];
  document.body.innerHTML = '<div id="h" style="display:grid;grid-template-columns:repeat(6,200px);gap:10px;padding:10px;background:#888"></div>';
  [0, 1, 2].forEach((dir) => ofs.forEach((of) => {
    const ST = S.mezclar({ name: 'Persona ' + of, oficio: of, dir, palette: of % 8, bg: dir === 1 ? 1 : 0 });
    const d = document.createElement('div'); d.style.cssText = 'width:200px;height:380px;overflow:hidden';
    d.innerHTML = A.escena(S.opcionesArte(ST, D, M, { w: 400, h: 760 })).replace('<svg ', '<svg style="width:100%;height:100%" ');
    document.getElementById('h').appendChild(d);
  }));
});
await p.waitForTimeout(400);
await p.screenshot({ path: `${SALIDA}/hoja-escenas.png`, fullPage: true });

// 3) los pósters y la historia animada, de una persona real de prueba
await p.goto(BASE + '/soul/s/index.html');
const kits = await p.evaluate(async () => {
  const S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA, A = window.SOUL_ARTE;
  const ST = S.mezclar({ name: 'Carlos Muñoz', apodo: 'Charly', oficio: 14, palette: 3, tel: '962469977', unico: 'le explico a cada cliente qué le cambié y por qué', tone: 1 });
  const out = {};
  for (const fm of ['post', 'historia', 'afiche']) {
    const k = S.kit(ST, D, M); k.formato = fm; k.pie = '../img/' + (M.sobre(k.tintas.bg) === '#FFFFFF' ? 'pie-compai-claro' : 'pie-alma-compai-oscuro') + '.png';
    const c = await A.poster(k); out[fm] = { w: c.width, h: c.height, url: c.toDataURL('image/png') };
  }
  try {
    const k = S.kit(ST, D, M); k.pie = '../img/pie-compai-claro.png';
    const v = await A.video(k); out.video = { tam: v.blob.size, ext: v.ext, tipo: v.blob.type };
    const fr = new FileReader(); out.videoUrl = await new Promise((ok) => { fr.onload = () => ok(fr.result); fr.readAsDataURL(v.blob); });
  } catch (e) { out.video = { error: String(e) }; }
  return out;
});
const FM = { post: [1080, 1350], historia: [1080, 1920], afiche: [1240, 1754] };
for (const fm of Object.keys(FM)) {
  ok(kits[fm].w === FM[fm][0] && kits[fm].h === FM[fm][1], `póster ${fm}: medida ${kits[fm].w}x${kits[fm].h}`);
  writeFileSync(`${SALIDA}/poster-${fm}.png`, Buffer.from(kits[fm].url.split(',')[1], 'base64'));
}
if (kits.videoUrl) writeFileSync(`${SALIDA}/historia.${kits.video.ext}`, Buffer.from(kits.videoUrl.split(',')[1], 'base64'));
ok(kits.video && kits.video.tam > 50000, `historia animada: ${JSON.stringify(kits.video)}`);
ok(errores.length === 0, 'errores de consola: ' + errores.join(' | '));
console.log(`historia animada: ${kits.video.tam ? Math.round(kits.video.tam / 1024) + ' KB ' + kits.video.ext : kits.video.error}`);
await b.close();
console.log(fallos ? `probar_arte: ${fallos} falla(s) de ${n}` : `probar_arte: OK — ${n}/${n} comprobaciones`);
process.exit(fallos ? 1 : 0);
