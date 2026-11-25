/* SOUL 2 · prueba de la marca (sin navegador).
   1) Contraste: las 3 direcciones × claro/oscuro × las paletas de SOUL (la propia incluida): todo texto y todo botón ≥ 4,5:1.
   2) «Prueba del vecino»: dos personas del mismo oficio con respuestas distintas NO pueden compartir
      titular, frases ni cierre, y ninguna usa la frase fija del rubro.
   3) Cero cifras inventadas: sin cifra dada, no sale cifra.
   Ejecutar:  node sitio/compai/soul/probar_marca.mjs   (sale 1 si algo falla) */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
const aqui = dirname(fileURLToPath(import.meta.url));
const W = {}; vm.createContext(W); W.window = W;
for (const f of ['datos.js', 'marca.js']) vm.runInContext(readFileSync(join(aqui, f), 'utf8'), W);
const D = W.SOUL_DATA, M = W.SOUL_MARCA;
let fallos = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fallos++; console.error('  x ' + msg); } };

// 1) contraste
for (const [di, d] of M.DIRS.entries())
  for (const oscuro of [true, false])
    for (const [pi, p] of D.PALETTES.entries()) {
      const c = p.c ? p.c[0] : '#E8789A';
      for (const r of M.pares(M.superficies(d, oscuro, c)))
        ok(r.ratio >= 4.5, `${d.id} ${oscuro ? 'oscuro' : 'claro'} paleta ${pi} · ${r.par} = ${r.ratio.toFixed(2)}`);
    }
// 2) vecino
const base = { name: 'X', apodo: '', oficio: 14, oficioOtro: '', tone: 3, motion: 1, cifraN: '', cifraU: '', cifraOtro: '' };
const A = { ...base, name: 'Carlos Rojas', apodo: 'Charly', unico: 'Le explico a cada cliente qué le cambié y por qué', nunca: 'Cambiar una pieza que todavía sirve', momento: 'Cuando el auto parte a la primera', origen: 'Mi papá me dejó hacerle el cambio de aceite a los once', cifraN: '+15', cifraU: 'años', cierre: 'Andan bien. Se nota.' };
const B = { ...base, name: 'Pedro Sandoval', unico: 'Atiendo de noche, cuando el taller de la esquina ya cerró', nunca: 'Cobrar sin dar presupuesto antes', momento: 'Cuando el cliente vuelve sin que lo llame', origen: 'Trabajé diez años en una automotriz antes de abrir el mío', cifraN: '300', cifraU: 'clientes que volvieron', cierre: 'Pedro te saca del apuro.' };
const fija = D.OFICIOS[14].head;
for (const [campo, f] of [['titular', M.titular], ['nunca', M.nunca], ['momento', M.momento], ['origen', M.origen], ['cierre', M.cierre], ['concepto', (s) => M.concepto(s, D)]])
  ok(f(A) && f(B) && f(A) !== f(B), `vecino: «${campo}» igual en los dos`);
ok(JSON.stringify(M.tres(A)) !== JSON.stringify(M.tres(B)), 'vecino: las 3 frases son iguales');
ok(!M.tres(A).concat(M.tres(B), M.titular(A), M.titular(B)).some((t) => t.includes(fija.replace(/\.$/, ''))), `vecino: aparece la frase fija del rubro «${fija}»`);
// el titular es de la persona: contiene sus palabras
ok(M.titular(A).toLowerCase().includes('explico a cada cliente'), 'el titular no usa lo que escribió');
// 2b) marca vs apodo (23-11): el apodo es el trato; la marca manda solo cuando existe
ok(M.marcaNombre({ name: 'Miguel Mena', apodo: 'Mig' }) === 'Mig', 'a: apodo sin marca debía seguir siendo el nombre mostrado');
ok(M.marcaNombre({ name: 'Pedro Sandoval', apodo: '', marcaNombre: 'Taller El Pistón' }) === 'Taller El Pistón', 'b: marca sin apodo');
ok(M.marcaNombre({ name: 'Carlos Rojas', apodo: 'Charly', marcaNombre: ' Taller   El Pistón ' }) === 'Taller El Pistón', 'c: con los dos manda la marca (y se limpia)');
ok(M.concepto({ ...A, marcaNombre: 'Taller El Pistón' }, D).startsWith('Taller El Pistón ·') && M.concepto(A, D).startsWith('Charly ·'), 'concepto: marca primero, apodo si no hay');
ok(M.marcaNombre({ name: 'Ana', apodo: '', marcaNombre: '   ' }) === 'Ana', 'marca en blanco debía caer al nombre');
ok(W.SOUL_DATA.NOMBRES.length === D.OFICIOS.length, 'NOMBRES (ejemplos del paso 1) no calza con OFICIOS');
// 3) cifras
ok(M.cifra({ cifraN: '', cifraU: 'años' }, D) === null, 'inventó una cifra con el número vacío');
ok(M.cifra({ cifraN: 'muchos', cifraU: 'años' }, D) === null, 'aceptó una cifra que no es número');
ok(M.cifra(A, D).texto === '+15 años', 'la cifra no sale tal cual');
// la dirección es determinista y responde al tono / oficio
ok(M.elegir({ ...base, oficio: 0, tone: 2, motion: 2 }, D) === 0, 'animador divertido debería ser Escenario');
ok(M.elegir({ ...base, oficio: 7, tone: 0 }, D) === 1, 'panadería cercana debería ser Taller');
ok(M.elegir({ ...base, oficio: 16, tone: 3 }, D) === 2, 'gasfitería sobria debería ser Obra');
// 4) LA REGLA DEL ACENTO (Visu, 23-11): las 33 filas de la tabla, hex por hex, y el café #98502C no vuelve nunca
const tabla = JSON.parse(readFileSync(join(aqui, 'acento-tabla.json'), 'utf8'));
ok(tabla.length === 33, `la tabla de Visu debía traer 33 filas y trae ${tabla.length}`);
const dirDe = (id) => M.DIRS.find((d) => d.id === id);
for (const f of tabla) {
  const d = dirDe(f.dir), su = M.superficies(d, false, f.c0), t = `${f.dir}/${f.paleta}`;
  ok(su.ac === f.ac && su.vivo === f.vivo && su.on === f.on && su.suave === f.suave, `${t}: claro ${su.ac}/${su.vivo}/${su.on}/${su.suave} ≠ tabla ${f.ac}/${f.vivo}/${f.on}/${f.suave}`);
  ok(su.acI === f.acO && su.onI === f.onO && su.suaveI === f.suaveO, `${t}: oscuro ${su.acI}/${su.onI}/${su.suaveI} ≠ tabla ${f.acO}/${f.onO}/${f.suaveO}`);
  const so = M.superficies(d, true, f.c0);   // página oscura: el acento de la página es el de oscuro y el inverso el de claro
  ok(so.ac === f.acO && so.acI === f.ac && so.vivoI === f.vivo, `${t}: página oscura no invierte bien`);
  ok(M.pares(su).concat(M.pares(so)).every((r) => r.ratio >= 4.5), `${t}: un par de texto bajo 4,5:1`);
  ok(su.vb === (f.borde ? d.cla.ink : f.vivo), `${t}: filete del relleno`);
  for (const [nom, c] of Object.entries({ ...su, ...Object.fromEntries(Object.entries(so).map(([k, v]) => ['o' + k, v])) }))
    ok(!(/^#[0-9A-F]{6}$/i.test(c) && c.toUpperCase() === '#98502C'), `${t}: salió el café #98502C en ${nom}`);
}
// ningún acento de texto o de relleno sobre claro cae en la «zona café» (matiz 35°–115°, luz baja), ni con un color propio café
for (const d of M.DIRS) for (const c0 of [...D.PALETTES.filter((p) => p.c).map((p) => p.c[0]), '#8B4513', '#98502C', '#A0522D', '#6B4F1D', '#556B2F'])
  for (const oscuro of [false, true]) {
    const su = M.superficies(d, oscuro, c0);
    for (const [nom, c] of [['ac', su.ac], ['vivo', su.vivo], ['acI', su.acI], ['vivoI', su.vivoI]]) {
      const fondoClaro = oscuro ? nom.endsWith('I') : !nom.endsWith('I'), [L, C, h] = M.aLch(c);
      ok(!(fondoClaro && C >= 0.04 && h >= 35 && h <= 115 && L < 0.6), `${d.id} ${c0} ${nom}=${c}: cayó en zona café (L ${L.toFixed(2)} h ${Math.round(h)})`);
      ok(c.toUpperCase() !== '#98502C', `${d.id} ${c0} ${nom}: volvió el café rechazado`);
    }
  }
const rech = M.aLch('#98502C'); ok(rech[2] >= 35 && rech[2] <= 115 && rech[0] < 0.6, 'el café rechazado debía caer en la zona prohibida');

// 5) EL SELLO: función pura iniciales + oficio + dirección → SVG, en color y en una tinta
const svgOk = (x, t) => { ok((x.match(/<svg/g) || []).length === 1 && (x.match(/<\/svg>/g) || []).length === 1, `${t}: svg mal formado`); for (const tag of ['g', 'mask', 'text', 'clipPath']) ok((x.match(new RegExp('<' + tag + '[ >]', 'g')) || []).length === (x.match(new RegExp('</' + tag + '>', 'g')) || []).length, `${t}: <${tag}> sin cerrar`); ok(!/undefined|NaN|\[object/.test(x), `${t}: trae «undefined/NaN»`); };
const colores = (x) => [...new Set((x.match(/#[0-9A-Fa-f]{6}/g) || []).map((c) => c.toUpperCase()))];
const gestos = new Set();
for (const d of M.DIRS) for (const of of D.OFICIOS) {
  const o = { ini: 'AB', oficio: of.label, oficioLabel: of.label, nombre: 'Ana Pérez', d, c0: '#2F6FA8' }, t = `sello ${d.id}/${of.label}`;
  const c = M.sello(o, 'color', null, 'x1'), u = M.sello(o, 'tinta', '#123456', 'x2'), g = M.monograma(o, 'color', null, 'x3');
  svgOk(c, t + ' color'); svgOk(u, t + ' tinta'); svgOk(g, t + ' monograma');
  ok(c.includes('>AB</text>'), `${t}: faltan las iniciales`);
  ok(JSON.stringify(colores(u)) === '["#123456"]', `${t}: la versión de una tinta usa más de un color → ${colores(u)}`);
  ok(colores(c).length <= 7, `${t}: demasiados colores en el sello (${colores(c).length})`);
  ok(M.GESTOS[M.selloGesto(of.label)], `${t}: oficio sin gesto`); gestos.add(M.selloGesto(of.label));
  ok(M.selloExplica(o).length === 3 && M.selloExplica(o).every((x) => x.length > 20 && !/undefined/.test(x)), `${t}: explicación incompleta`);
}
ok(gestos.size === 8, `los 8 gestos por oficio debían usarse, se usan ${gestos.size}`);
// el de Waldo: el mismo dibujo que el sello de Visu (misma tinta, mismo papel, misma mordida, mismo anillo graduado)
const WO = { ini: 'WC', oficio: 'Maestro chasquilla', oficioLabel: 'Maestro chasquilla', nombre: 'Waldo Castor', lema: 'Hecho a diente', gesto: 'castor', d: dirDe('obra'), c0: '#2F6FA8' };
const sw = M.sello(WO, 'color', null, 'w1'), swu = M.sello(WO, 'tinta', '#EAF2F8', 'w2');
svgOk(sw, 'sello Waldo'); svgOk(swu, 'sello Waldo una tinta');
ok(JSON.stringify(colores(sw).sort()) === JSON.stringify(['#0B1E30', '#1E3B58', '#729DC4', '#9CB8D0', '#EAF2F8', '#EEF2F5']), `sello Waldo: colores de Visu → ${colores(sw)}`);
ok((sw.match(/<circle cx="(74|90|102|106)" cy="(-5|2|15|31)"/g) || []).length === 8, 'sello Waldo: la mordida de cuatro círculos (máscara y borde)');
ok((sw.match(/<circle cx="(74|90|102|106)" cy="(-5|2|15|31)" r="1[02]"\/>/g) || []).length === 8, 'sello Waldo: círculos de la mordida');
ok(sw.includes('r="96"') && sw.includes('r="60"') && (sw.match(/M[\d.]+ [\d.]+L/g) || []).length === 72, 'sello Waldo: anillo r96/r60 con 72 rayas');
ok((sw.match(/<text x="100"/g) || []).length === 'HECHOADIENTE'.length + 'WALDOCASTOR'.length, 'sello Waldo: letras del anillo (HECHO A DIENTE / WALDO CASTOR)');
ok(sw.includes('font-size="41"') && sw.includes('>WC</text>') && sw.includes('<rect x="14" y="73" width="68" height="4"'), 'sello Waldo: iniciales cuerpo 41 y filete de 4');
ok(M.selloExplica(WO)[0].startsWith('Este es tu sello. Son tus iniciales, WC, en un bloque de madera al que un castor') && M.selloExplica(WO).length === 3, 'explicación de Waldo = texto de Visu');
ok(!M.selloExplica({ ...WO, gesto: '', lema: '' }).join(' ').includes('castor'), 'otra persona no hereda la historia del castor');
ok(M.sello({ ...WO, gesto: 'constructor' }, 'color').indexOf('undefined') < 0, 'un gesto inventado en el enlace no rompe el sello');
// los arcos largos: 17–20 letras achican; más de 20 no caben y el anillo lleva solo el nombre
const m20 = M.selloOpciones({ ...WO, oficio: 'Instalaciones eléctricas y gas', lema: '' }); ok(m20.arriba === 'WALDO CASTOR' && m20.abajo === '', 'oficio de más de 20 letras: el anillo lleva solo el nombre');
const m18 = M.sello({ ...WO, oficio: 'Gasfitería y calefon', lema: '' }, 'color'); ok(m18.includes('font-size="14"'), 'de 17 a 20 letras el anillo baja a cuerpo 14');
const wf = join(aqui, '..', '..', '..', 'CompAI', 'Dir. Arte, Comunicacion & Prod. Audiovisual', '2026-11-23-soul-sitio-direccion', 'sello-wc.svg');
if (existsSync(wf)) { const vs = readFileSync(wf, 'utf8'); ok(JSON.stringify(colores(vs).sort()) === JSON.stringify(colores(sw).sort()), `sello Waldo: paleta distinta a la del SVG de Visu (${colores(vs)} / ${colores(sw)})`); ok((vs.match(/M[\d.]+ [\d.]+L/g) || []).length >= 72, 'el SVG de Visu debía traer las 72 rayas'); }
console.log(fallos ? `probar_marca: ${fallos} falla(s) de ${n}` : `probar_marca: OK — ${n}/${n} comprobaciones (contraste 3×2×${D.PALETTES.length} paletas, regla del acento en las 33 filas de Visu, sin el café, sello de 22 oficios × 3 direcciones y el de Waldo, vecino, cifras, dirección)`);
process.exit(fallos ? 1 : 0);
