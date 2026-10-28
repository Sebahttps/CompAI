/* SOUL 2 · prueba de la marca (sin navegador).
   1) Contraste: las 3 direcciones × claro/oscuro × las paletas de SOUL (la propia incluida): todo texto y todo botón ≥ 4,5:1.
   2) «Prueba del vecino»: dos personas del mismo oficio con respuestas distintas NO pueden compartir
      titular, frases ni cierre, y ninguna usa la frase fija del rubro.
   3) Cero cifras inventadas: sin cifra dada, no sale cifra.
   Ejecutar:  node sitio/compai/soul/probar_marca.mjs   (sale 1 si algo falla) */
import { readFileSync } from 'node:fs';
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
// 3) cifras
ok(M.cifra({ cifraN: '', cifraU: 'años' }, D) === null, 'inventó una cifra con el número vacío');
ok(M.cifra({ cifraN: 'muchos', cifraU: 'años' }, D) === null, 'aceptó una cifra que no es número');
ok(M.cifra(A, D).texto === '+15 años', 'la cifra no sale tal cual');
// la dirección es determinista y responde al tono / oficio
ok(M.elegir({ ...base, oficio: 0, tone: 2, motion: 2 }, D) === 0, 'animador divertido debería ser Escenario');
ok(M.elegir({ ...base, oficio: 7, tone: 0 }, D) === 1, 'panadería cercana debería ser Taller');
ok(M.elegir({ ...base, oficio: 16, tone: 3 }, D) === 2, 'gasfitería sobria debería ser Obra');
console.log(fallos ? `probar_marca: ${fallos} falla(s) de ${n}` : `probar_marca: OK — ${n}/${n} comprobaciones (contraste 3×2×${D.PALETTES.length} paletas, vecino, cifras, dirección)`);
process.exit(fallos ? 1 : 0);
