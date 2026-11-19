/* SOUL · escenas icónicas (16-11-2026).
   Cada oficio se ilustra como una ESCENA que todos reconocen: el puño en alto bajo los focos, el
   sembrador frente al sol, la mujer que vierte la leche junto a la ventana, la ola que se levanta,
   el hombre en el círculo y el cuadrado. No se copia ninguna obra ni a ninguna persona: se toma la
   pose y la composición, y se pinta con la paleta de quien responde, en cartel facetado de tres tintas.

   Expone W.SOUL_ESCENAS:
     elegir(o)  -> { clave, flip, def }   qué escena le toca (oficio + versión del arte)
     capas(o)   -> { fondo, sol, confeti, figura, horizonte, sol0, hz }   las capas SVG (sin <svg>)
     tipo(o)    -> la tipografía de cartel de esa escena (para el póster y la historia)
     cargar(T)  -> Promise: baja SOLO las fuentes que ese cartel usa (fuentes/arte/, OFL)
   Lo usa arte.js; si este archivo no está, arte.js sigue con su motivo de siempre. */
(function (W) {
  'use strict';

  var BASE = '';
  try { var cs = document.currentScript; if (cs && cs.src) BASE = cs.src.replace(/[^\/]*$/, ''); } catch (_) { /* sin DOM */ }

  /* ───────── color ───────── */
  function rgb(h) { var m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [0, 0, 0]; var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hx(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hx([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function luz(h) { var c = rgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function f(n) { return Math.round(n * 10) / 10; }
  function azar(s) { return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ───────── tipografía de cartel ─────────
     Fuentes OFL autoalojadas en fuentes/arte/. Cada escena trae su manera de componer el texto. */
  var ARCH = { 'SOUL Anton': 'anton', 'SOUL Bodoni': 'bodoni', 'SOUL Cinzel': 'cinzel', 'SOUL Bangers': 'bangers', 'SOUL Monoton': 'monoton',
    'SOUL Shippori': 'shippori', 'SOUL Marker': 'marker', 'SOUL Stencil': 'stencil', 'SOUL Teko': 'teko', 'SOUL Cormorant': 'cormorant', 'SOUL Grotesk': 'grotesk' };
  var TIPOS = {
    constructivista: { tit: 'SOUL Anton', w: 400, mayus: 1, rot: -4, bloque: 1, kick: 'SOUL Teko', nom: 'SOUL Teko', tamF: 1.22, interl: 0.98 },
    propaganda: { tit: 'SOUL Anton', w: 400, mayus: 1, globo: 1, kick: 'SOUL Teko', nom: 'SOUL Teko', tamF: 1.1, interl: 1.08 },
    museo: { tit: 'SOUL Bodoni', w: 700, alinea: 'center', filetes: 1, kick: 'SOUL Cinzel', kesp: 0.3, nom: 'SOUL Cormorant', tamF: 0.94, interl: 1.1 },
    clasico: { tit: 'SOUL Cinzel', w: 700, alinea: 'center', filetes: 1, kick: 'SOUL Cormorant', kesp: 0.2, nom: 'SOUL Cormorant', tamF: 0.86, interl: 1.14 },
    nouveau: { tit: 'SOUL Cinzel', w: 700, alinea: 'center', marco: 1, kick: 'SOUL Cormorant', kesp: 0.25, nom: 'SOUL Cormorant', tamF: 0.82, interl: 1.14 },
    pop: { tit: 'SOUL Bangers', w: 400, mayus: 1, globo: 'pop', sombra: 1, kick: 'SOUL Bangers', nom: 'SOUL Bangers', tamF: 1.14, interl: 1, esp: 0.02 },
    flash: { tit: 'SOUL Marker', w: 400, cinta: 1, sombra: 1, kick: 'SOUL Teko', nom: 'SOUL Marker', tamF: 1.02, interl: 1.04 },
    neon: { tit: 'SOUL Monoton', w: 400, mayus: 1, brillo: 1, sep: '\u2003', kick: 'SOUL Teko', nom: 'SOUL Teko', tamF: 0.72, interl: 1.14 },
    cine: { tit: 'SOUL Teko', w: 700, mayus: 1, esp: 0.04, alinea: 'center', kick: 'SOUL Teko', nom: 'SOUL Teko', tamF: 1.22, interl: 0.98 },
    recorte: { tit: '', w: 800, letras: 1, kick: 'SOUL Grotesk', nom: 'SOUL Grotesk', tamF: 1.08, interl: 1.04 },
    stencil: { tit: 'SOUL Stencil', w: 400, mayus: 1, raya: 1, kick: 'SOUL Teko', nom: 'SOUL Teko', tamF: 1.05, interl: 1.02 },
    deco: { tit: 'SOUL Teko', w: 700, mayus: 1, esp: 0.12, alinea: 'center', filetes: 1, kick: 'SOUL Teko', nom: 'SOUL Teko', tamF: 1.12, interl: 0.95 },
    ukiyo: { tit: 'SOUL Shippori', w: 700, cartucho: 1, kick: 'SOUL Shippori', nom: 'SOUL Shippori', tamF: 0.96, interl: 1.14 },
    cuaderno: { tit: 'SOUL Cormorant', w: 700, kick: 'SOUL Marker', nom: 'SOUL Cormorant', tamF: 1.08, interl: 1.04 },
    bauhaus: { tit: 'SOUL Grotesk', w: 700, minus: 1, barras: 1, kick: 'SOUL Grotesk', nom: 'SOUL Grotesk', tamF: 1.06, interl: 0.96 },
    tiza: { tit: 'SOUL Marker', w: 400, kick: 'SOUL Marker', nom: 'SOUL Marker', tamF: 0.98, interl: 1.06 },
    disco: { tit: 'SOUL Grotesk', w: 700, minus: 1, kick: 'SOUL Grotesk', nom: 'SOUL Grotesk', tamF: 0.92, interl: 1.02 }
  };
  var CARGADAS = {};
  function cargar(T) {
    if (!T || typeof FontFace === 'undefined' || !document.fonts) return Promise.resolve();
    var fams = [T.tit, T.kick, T.nom].filter(function (x) { return x && ARCH[x]; });
    return Promise.all(fams.map(function (fam) {
      if (!CARGADAS[fam]) {
        var ff = new FontFace(fam, 'url(' + BASE + 'fuentes/arte/' + ARCH[fam] + '.woff2) format("woff2")', { display: 'swap' });
        CARGADAS[fam] = ff.load().then(function (x) { document.fonts.add(x); }).catch(function () { /* queda la de sistema */ });
      }
      return CARGADAS[fam];
    }));
  }

  /* ───────── las poses ─────────
     Unidades: la figura mide ~100 (coronilla 0, pies 100), x centrada en 0. L = izquierda en pantalla.
     Orden: cabeza, cuello, hombro L, hombro R, codo L, codo R, mano L, mano R, cadera L, cadera R, rodilla L, rodilla R, pie L, pie R. */
  var ORDEN = ['h', 'n', 'sL', 'sR', 'eL', 'eR', 'wL', 'wR', 'hL', 'hR', 'kL', 'kR', 'fL', 'fR'];
  var POSES = {
    himno:     [-1, 7, 0, 14, -10, 18, 10, 19, -15, 5, 15, 32, -14, -8, 19, 45, -6, 52, 6, 52, -16, 73, 16, 72, -27, 97, 28, 97],
    victoria:  [0, 7, 0, 14, -10, 18, 10, 18, -18, 5, 18, 5, -24, -8, 24, -8, -6, 52, 6, 52, -8, 75, 8, 75, -12, 98, 12, 98],
    remangada: [-1, 7, 0, 14, -10, 18, 11, 18, -14, 33, 25, 22, -15, 46, 21, 6, -6, 52, 6, 52, -8, 75, 8, 75, -10, 98, 11, 98],
    sembrador: [3, 8, 2, 15, -7, 19, 10, 19, -11, 32, 21, 22, -8, 43, 31, 17, -5, 52, 5, 52, -13, 74, 12, 72, -24, 97, 17, 97],
    atlas:     [0, 17, 0, 23, -11, 27, 11, 27, -21, 18, 21, 18, -17, 8, 17, 8, -6, 60, 6, 60, -12, 79, 10, 96, -14, 98, 28, 98],
    tijera:    [1, 7, 0, 14, -10, 18, 10, 18, -15, 32, 20, 10, -5, 38, 15, -2, -6, 52, 6, 52, -6, 75, 8, 75, -8, 98, 15, 97],
    lechera:   [-2, 8, -1, 15, -10, 19, 9, 19, -14, 32, 17, 30, -2, 36, 10, 38, -6, 52, 6, 52, -6, 75, 6, 75, -8, 98, 8, 98],
    biceps:    [0, 7, 0, 14, -11, 18, 11, 18, -24, 20, 24, 20, -22, 6, 22, 6, -6, 52, 6, 52, -10, 75, 10, 75, -14, 98, 14, 98],
    musa:      [1, 7, 0, 14, -9, 18, 9, 18, -15, 8, 13, 31, -7, -3, 16, 43, -6, 52, 6, 52, -5, 75, 5, 75, -6, 98, 7, 98],
    ofrenda:   [0, 8, 0, 15, -10, 19, 10, 19, -12, 5, 12, 5, -7, -8, 7, -8, -6, 52, 6, 52, -7, 75, 8, 75, -10, 98, 12, 98],
    camara:    [0, 8, 0, 15, -10, 19, 10, 19, -15, 24, 14, 25, -5, 11, 6, 11, -6, 52, 6, 52, -9, 75, 7, 74, -13, 98, 11, 98],
    guitarra:  [-2, 8, -1, 15, -11, 19, 9, 19, -21, 22, 16, 33, -30, 10, 5, 47, -6, 52, 6, 52, -15, 73, 12, 70, -22, 97, 22, 96],
    perla:     [3, 9, 1, 16, -14, 23, 9, 21, -17, 40, 12, 40, -17, 55, 12, 55, -8, 55, 7, 55, -8, 75, 7, 75, -8, 98, 7, 98],
    alfarero:  [-4, 22, -3, 29, -12, 33, 6, 32, -8, 46, 16, 44, 5, 50, 19, 49, -10, 64, 0, 64, 9, 63, 15, 66, 7, 98, 15, 98],
    viga:      [0, 22, 0, 29, -10, 33, 10, 33, -16, 47, 15, 45, -20, 60, 6, 38, -6, 62, 6, 62, -8, 70, 8, 70, -10, 92, 11, 94],
    libertad:  [0, 8, 0, 15, -10, 19, 10, 19, -14, 32, 13, 4, -4, 36, 12, -10, -6, 52, 6, 52, -6, 75, 6, 75, -8, 98, 8, 98],
    firme:     [0, 8, 0, 15, -10, 19, 10, 19, -16, 32, 16, 29, -9, 42, 8, 30, -6, 52, 6, 52, -15, 74, 13, 74, -23, 98, 21, 98],
    vitruvio:  [0, 7, 0, 14, -10, 18, 10, 18, -27, 18, 27, 18, -44, 18, 44, 18, -6, 52, 6, 52, -6, 75, 6, 75, -6, 98, 6, 98],
    rodillo:   [2, 8, 1, 15, -9, 19, 11, 18, -12, 32, 19, 6, -2, 30, 18, -8, -6, 52, 6, 52, -9, 75, 10, 74, -14, 98, 13, 98],
    pensador:  [-2, 26, -1, 32, -11, 36, 9, 35, -4, 57, 16, 52, -2, 34, 9, 62, -7, 64, 7, 64, -11, 63, 12, 66, -13, 98, 15, 98],
    paso:      [3, 7, 2, 14, -6, 18, 8, 18, -10, 32, 12, 31, -14, 43, 16, 43, -3, 52, 3, 52, -9, 74, 9, 73, -17, 97, 15, 97]
  };
  var FANTASMA = { vitruvio: [0, 7, 0, 14, -10, 18, 10, 18, -24, 9, 24, 9, -40, 0, 40, 0, -6, 52, 6, 52, -12, 75, 12, 75, -20, 97, 20, 97] };
  function pose(a) { var o = {}; ORDEN.forEach(function (k, i) { o[k] = [a[i * 2], a[i * 2 + 1]]; }); o.p = [(o.hL[0] + o.hR[0]) / 2, (o.hL[1] + o.hR[1]) / 2]; return o; }

  /* ───────── las escenas ─────────
     pose, fondo (la escena detrás y delante), tipo (tipografía), props (lo que lleva), mano (la mano de la herramienta),
     pelo, ropa ('ac' | 'c3' | 'pant'), pant ('claro' | 'oscuro'), abrigo, falda, plano (recorte sin facetas),
     contorno (línea de cómic), encuadre ('busto' | 'medio'), cx (dónde va la figura), alto, caja (puntos extra a encuadrar) */
  var ESCENAS = {
    himno:     { boca: 1, pose: 'himno', fondo: 'focos', tipo: 'constructivista', props: ['pedestal'], pelo: 'rizado', pant: 'claro', caja: [[30, 100]] },
    guitarra:  { boca: 1, pose: 'guitarra', fondo: 'focos', tipo: 'neon', props: ['guitarra'], pelo: 'largo', pant: 'oscuro', caja: [[-40, 2]] },
    victoria:  { boca: 1, pose: 'victoria', fondo: 'escalinata', tipo: 'constructivista', props: ['tool:wR'], pelo: 'corto', pant: 'oscuro', alto: 0.7, suelo: 0.74 },
    remangada: { pose: 'remangada', fondo: 'propaganda', tipo: 'propaganda', props: ['tool:wL', 'remango'], pelo: 'panuelo', ropa: 'c3', encuadre: 'medio' },
    sembrador: { pose: 'sembrador', fondo: 'sol', tipo: 'museo', props: ['bolso', 'semillas'], pelo: 'sombrero', ropa: 'c3', pant: 'oscuro', cx: 0.44, alto: 0.8, suelo: 0.95 },
    atlas:     { pose: 'atlas', fondo: 'templo', tipo: 'clasico', props: ['tablon'], pelo: 'corto', ropa: 'ac', pant: 'oscuro', caja: [[-46, 4], [46, 14]] },
    pop:       { pose: 'tijera', fondo: 'pop', tipo: 'pop', props: ['tool:wR', 'peine'], pelo: 'corto', contorno: 1, pant: 'oscuro' },
    lechera:   { pose: 'lechera', fondo: 'ventana', tipo: 'museo', props: ['jarra'], pelo: 'cofia', ropa: 'ac', encuadre: 'medio', cx: 0.56 },
    flash:     { pose: 'biceps', fondo: 'flash', tipo: 'flash', props: ['tatuajes', 'tool:wR'], pelo: 'corto', contorno: 1, mangas: 'corta', pant: 'oscuro', encuadre: 'medio' },
    musa:      { pose: 'musa', fondo: 'aureola', tipo: 'nouveau', props: ['cinta'], pelo: 'largo', ropa: 'ac', falda: 1, alto: 0.84 },
    ofrenda:   { pose: 'ofrenda', fondo: 'amanecer', tipo: 'clasico', props: ['pan'], pelo: 'corto', ropa: 'c3', pant: 'oscuro', cx: 0.6, alto: 0.64, suelo: 0.74, caja: [[0, -20]] },
    noir:      { pose: 'camara', fondo: 'noir', tipo: 'cine', props: ['camara'], pelo: 'corto', ropa: 'c3', abrigo: 1, pant: 'oscuro' },
    perla:     { pose: 'perla', fondo: 'negro', tipo: 'museo', props: ['arete'], pelo: 'turbante', ropa: 'ac', encuadre: 'busto', cx: 0.52 },
    creacion:  { pose: 'manos', fondo: 'cielo', tipo: 'clasico', props: [], ropa: 'ac' },
    masaje:    { sinVelo: 1, pose: 'masaje', fondo: 'vapor', tipo: 'clasico', props: [], pelo: 'largo', ropa: 'ac', pant: 'oscuro', alto: 0.82, suelo: 0.95, caja: [[-54, 50], [54, 99]] },
    matisse:   { pose: 'alfarero', fondo: 'recortes', tipo: 'recorte', props: ['vasija'], pelo: 'corto', plano: 1, cx: 0.5, alto: 0.72, suelo: 0.9 },
    viga:      { pose: 'viga', fondo: 'ciudad', tipo: 'stencil', props: ['tool:wR'], pelo: 'casco', ropa: 'c3', pant: 'oscuro', alto: 0.76, suelo: 0.86 },
    libertad:  { boca: 1, pose: 'libertad', fondo: 'deco', tipo: 'deco', props: ['ampolleta', 'rollo'], pelo: 'corto', ropa: 'ac', abrigo: 1, pant: 'oscuro', alto: 0.76, suelo: 0.88, caja: [[0, -22]] },
    ola:       { pose: 'firme', fondo: 'ola', tipo: 'ukiyo', props: ['stilson'], pelo: 'panuelo', ropa: 'c3', pant: 'claro', cx: 0.36, alto: 0.72, suelo: 0.92 },
    vitruvio:  { pose: 'vitruvio', fondo: 'vitruvio', tipo: 'cuaderno', props: ['herramientas'], pelo: 'rizado', ropa: 'ac', pant: 'claro', alto: 0.82, suelo: 0.92, caja: [[-50, -2], [50, 99]] },
    mondrian:  { pose: 'rodillo', fondo: 'mondrian', tipo: 'bauhaus', props: ['rodillo'], pelo: 'casco', ropa: 'ac', pant: 'oscuro', cx: 0.44, caja: [[22, -40]] },
    pensador:  { pose: 'pensador', fondo: 'pizarra', tipo: 'tiza', props: ['libro'], pelo: 'corto', ropa: 'ac', pant: 'oscuro', cx: 0.5 },
    cebra:     { sinVelo: 1, pose: 'paso', fondo: 'cebra', tipo: 'disco', props: ['perro'], pelo: 'largo', ropa: 'ac', pant: 'oscuro', cx: 0.4, alto: 0.72, suelo: 0.93, caja: [[44, 98]] }
  };
  /* Por oficio (mismo orden que SOUL_DATA.OFICIOS): la escena principal y la de «otra versión». */
  var POR_OFICIO = [
    ['himno', 'victoria'], ['sembrador', 'matisse'], ['atlas', 'viga'], ['pop', 'perla'], ['lechera', 'ofrenda'],
    ['flash', 'ola'], ['musa', 'perla'], ['ofrenda', 'lechera'], ['noir', 'pop'], ['guitarra', 'himno'],
    ['perla', 'musa'], ['masaje', 'creacion'], ['matisse', 'creacion'], ['viga', 'remangada'], ['remangada', 'viga'],
    ['libertad', 'vitruvio'], ['ola', 'remangada'], ['vitruvio', 'remangada'], ['mondrian', 'libertad'], ['pensador', 'libertad'],
    ['cebra', 'sembrador'], ['victoria', 'himno']
  ];
  /* La herramienta de cada oficio, para las escenas que la ponen en la mano. */
  var HERRAMIENTA = ['microfono', 'tijera', 'martillo', 'tijera', 'cuchara', 'maquina', 'tijera', 'cuchara', 'camara', 'microfono', 'brocha',
    'brocha', 'brocha', 'soplete', 'llave', 'ampolleta', 'llave', 'martillo', 'brocha', 'libro', 'microfono', 'martillo'];

  function elegir(o) {
    var of = o.oficioN == null ? 21 : Math.max(0, Math.min(21, o.oficioN)), v = o.version || 0, lista = POR_OFICIO[of];
    var clave = lista[v % lista.length];
    return { clave: clave, def: ESCENAS[clave], flip: ((v >> 1) & 1) === 1, oficio: of };
  }
  function tipo(o) { return TIPOS[elegir(o).def.tipo] || null; }

  /* ───────── materiales: tres tonos por material (luz, medio, sombra) ───────── */
  function tonos(c, osc) { return [mix(c, '#FFFFFF', osc ? 0.24 : 0.2), c, mix(c, '#000000', osc ? 0.45 : 0.4)]; }
  function materiales(t, def) {
    var osc = luz(t.bg) < 0.45, M = { osc: osc };
    M.piel = osc ? [mix(t.ink, t.ac, 0.12), mix(t.ink, t.ac, 0.34), mix(mix(t.ink, t.ac, 0.45), t.bg, 0.4)]
                 : [mix(t.ac, t.bg, 0.45), mix(t.ac, t.ink, 0.15), mix(t.ac, t.ink, 0.55)];
    var claro = osc ? [t.ink, mix(t.ink, t.bg, 0.2), mix(t.ink, t.bg, 0.5)] : [mix(t.ink, t.bg, 0.72), mix(t.ink, t.bg, 0.55), mix(t.ink, t.bg, 0.3)];
    var oscuro = osc ? [mix(t.ink, t.bg, 0.55), mix(t.ink, t.bg, 0.72), mix(t.bg, '#000', 0.3)] : [mix(t.ink, t.bg, 0.45), mix(t.ink, t.bg, 0.2), t.ink];
    var c3 = luz(t.c3) < 0.5 ? t.c3 : mix(t.c3, '#000', 0.5);
    M.ropa = def.ropa === 'c3' ? tonos(osc && luz(c3) < 0.12 ? mix(c3, t.ac, 0.35) : c3, osc) : tonos(t.ac, osc);
    M.pant = def.pant === 'claro' ? claro : oscuro;
    M.camisa = claro;
    M.pelo = osc ? [mix(t.bg, t.ac, 0.4), mix(t.bg, t.ac, 0.22), mix(t.bg, '#000', 0.35)] : [mix(t.ink, t.ac, 0.35), t.ink, mix(t.ink, '#000', 0.4)];
    M.metal = claro; M.acc = tonos(t.ac, osc); M.c2 = tonos(t.c2, osc);
    M.linea = osc ? mix(t.bg, '#000', 0.5) : t.ink;
    if (def.plano) { var u = osc ? tonos(t.ink, osc) : tonos(mix(t.c3, t.ink, 0.3), osc); M.piel = M.ropa = M.pant = M.pelo = M.camisa = u; }
    return M;
  }

  /* ───────── geometría ───────── */
  function rot(p, o, a) { var c = Math.cos(a), s = Math.sin(a); return [o[0] + p[0] * c - p[1] * s, o[1] + p[0] * s + p[1] * c]; }
  function loc(o, a, pts) { return pts.map(function (p) { return rot(p, o, a); }); }
  function ang(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]); }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function ovalo(c, rx, ry, n, a) { var out = []; for (var i = 0; i < n; i++) { var q = i / n * Math.PI * 2; out.push(rot([Math.cos(q) * rx, Math.sin(q) * ry], c, a || 0)); } return out; }

  /* El pintor de la figura: junta polígonos en F, con su tono según de dónde viene la luz. */
  function Pintor(R) {
    var F = [];
    function tono(m, nx, ny) { var d = nx * R.luz[0] + ny * R.luz[1]; return R.plano ? m[1] : d > 0.28 ? m[0] : d < -0.28 ? m[2] : m[1]; }
    function poly(pts, col) { F.push([pts, col]); }
    // un polígono convexo, en abanico desde su centro: cada cara mira a un lado y toma su tono
    function facetas(pts, m) {
      if (R.plano) return poly(pts, m[1]);
      var c = [0, 0]; pts.forEach(function (p) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; });
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length], mx = (a[0] + b[0]) / 2 - c[0], my = (a[1] + b[1]) / 2 - c[1], l = Math.hypot(mx, my) || 1;
        poly([c, a, b], tono(m, mx / l, my / l));
      }
    }
    // un tramo de brazo o pierna: cuatro caras (luz, medio, sombra, medio)
    function seg(a, b, ta, tb, m) {
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      var a1 = [a[0] + nx * ta, a[1] + ny * ta], b1 = [b[0] + nx * tb, b[1] + ny * tb], a2 = [a[0] - nx * ta, a[1] - ny * ta], b2 = [b[0] - nx * tb, b[1] - ny * tb];
      if (R.plano) return poly([a1, b1, b2, a2], m[1]);
      var c1 = tono(m, nx, ny), c2 = tono(m, -nx, -ny);
      poly([a, a1, b1], c1); poly([a, b1, b], c1 === m[1] ? m[0] : m[1]); poly([a, b, b2], c2); poly([a, b2, a2], m[1]);
    }
    function junta(c, r, m) { facetas(ovalo(c, r, r, 6, 0.3), m); }
    return { F: F, poly: poly, facetas: facetas, seg: seg, junta: junta, tono: tono };
  }

  /* El cuerpo completo. J = pose, D = escena, M = materiales, P = pintor. */
  function cuerpo(J, D, M, P, R, opc) {
    opc = opc || {};
    var arm = D.mangas === 'corta' ? M.piel : M.ropa;
    // piernas (o falda)
    if (D.falda) {
      var pl = [J.hL[0] - 3, J.hL[1]], pr = [J.hR[0] + 3, J.hR[1]], fl = [Math.min(J.fL[0], J.hL[0]) - 9, 99], fr = [Math.max(J.fR[0], J.hR[0]) + 9, 99], n = 6;
      for (var i = 0; i < n; i++) {
        var t0 = i / n, t1 = (i + 1) / n;
        P.poly([lerp(pl, pr, t0), lerp(pl, pr, t1), lerp(fl, fr, t1), lerp(fl, fr, t0)], M.ropa[i % 2 ? 2 : (i % 3 ? 1 : 0)]);
      }
    } else {
      [['hL', 'kL', 'fL'], ['hR', 'kR', 'fR']].forEach(function (g) {
        P.seg(J[g[0]], J[g[1]], 5, 4.2, M.pant); P.junta(J[g[1]], 4.1, M.pant); P.seg(J[g[1]], J[g[2]], 4.1, 3, M.pant);
        var dir = J[g[2]][0] < J.p[0] - 1 ? -1 : J[g[2]][0] > J.p[0] + 1 ? 1 : (g[2] === 'fL' ? -1 : 1), fp = J[g[2]];
        P.facetas([[fp[0] - dir * 3, fp[1] - 2.6], [fp[0] + dir * 3, fp[1] - 2.6], [fp[0] + dir * 8, fp[1] + 0.8], [fp[0] - dir * 3.2, fp[1] + 1.4]], [M.linea, M.linea, M.linea]);
      });
    }
    // torso (con abrigo largo si corresponde)
    var cin = 0.62, wl = lerp(J.sL, J.hL, cin), wr = lerp(J.sR, J.hR, cin);
    wl[0] += 1.6; wr[0] -= 1.6;
    var hl = [J.hL[0] - 1.5, J.hL[1] + 1], hr = [J.hR[0] + 1.5, J.hR[1] + 1];
    if (D.abrigo) {
      var kl = [Math.min(J.kL[0], J.hL[0]) - 3, Math.max(J.kL[1], J.kR[1]) - 4], kr = [Math.max(J.kR[0], J.hR[0]) + 3, Math.max(J.kL[1], J.kR[1]) - 4];
      P.facetas([hl, hr, kr, kl], M.ropa);
    }
    P.facetas([J.sL, J.sR, wr, hr, hl, wl], M.ropa);
    if (!D.plano) {  // la camisa: la V del pecho
      var nb = [J.n[0], J.n[1] + 2], v = lerp(J.n, J.p, D.abrigo ? 0.55 : 0.42);
      P.poly([[nb[0] - 3.2, nb[1]], [nb[0] + 3.2, nb[1]], v], M.camisa[0]);
      P.poly([[nb[0] - 3.2, nb[1]], v, [nb[0] - 0.6, nb[1] + 4]], M.camisa[1]);
    }
    // brazos
    if (!opc.sinBrazos) {
      [['sL', 'eL', 'wL'], ['sR', 'eR', 'wR']].forEach(function (g) {
        P.junta(J[g[0]], 4, M.ropa);
        P.seg(J[g[0]], J[g[1]], 3.8, 3.3, D.mangas === 'corta' ? M.ropa : M.ropa);
        P.junta(J[g[1]], 3.2, arm);
        P.seg(J[g[1]], J[g[2]], 3.2, 2.5, arm);
      });
    }
    // cuello y cabeza
    var tilt = ang(J.n, J.h) + Math.PI / 2;
    P.seg(J.n, lerp(J.n, J.h, 0.55), 2.6, 2.3, M.piel);
    if (D.pelo === 'largo') P.facetas(loc(J.h, tilt, [[-5.6, -3], [5.6, -3], [6.6, 12], [-6.6, 12]]), M.pelo);
    if (D.pelo === 'turbante') P.facetas(loc(J.h, tilt, [[3, -4], [8, -2], [12, 10], [8, 14]]), M.c2);
    P.facetas(ovalo(J.h, 4.7, 5.9, 8, tilt + 0.2), M.piel);
    if (!D.plano) {   // la cara en tres facetas: cejas, nariz y boca
      var oscuro3 = [M.pelo[2], M.pelo[2], M.pelo[2]];
      P.facetas(loc(J.h, tilt, [[-3.4, -1.5], [-0.9, -2.1], [-0.8, -1.4], [-3.3, -0.9]]), oscuro3);
      P.facetas(loc(J.h, tilt, [[0.9, -2.1], [3.4, -1.5], [3.3, -0.9], [0.8, -1.4]]), oscuro3);
      P.poly(loc(J.h, tilt, [[0.1, -0.8], [1.3, 1.7], [-0.1, 1.9]]), M.piel[2]);
      P.facetas(loc(J.h, tilt, D.boca ? [[-1.6, 2.7], [1.6, 2.7], [0.9, 4.6], [-0.9, 4.6]] : [[-1.5, 3.1], [1.5, 3.1], [1.2, 3.6], [-1.2, 3.6]]), oscuro3);
    }
    pelo(J, D, M, P, tilt);
  }
  function pelo(J, D, M, P, tilt) {
    var h = J.h, q, pts = [], i;
    switch (D.pelo) {
      case 'rizado':
        for (i = 0; i <= 10; i++) { q = Math.PI + i / 10 * Math.PI; var rr = i % 2 ? 1.32 : 1.12; pts.push(rot([Math.cos(q) * 4.7 * rr, Math.sin(q) * 5.9 * rr], h, tilt)); }
        pts.push(rot([4.8, -0.4], h, tilt), rot([2.2, -3.4], h, tilt), rot([-2.2, -3.4], h, tilt), rot([-4.8, -0.4], h, tilt)); P.facetas(pts, M.pelo); break;
      case 'panuelo':
        P.facetas(loc(h, tilt, [[-5.2, -1.2], [-4.4, -5.4], [0, -7.2], [4.4, -5.4], [5.2, -1.2], [0, -2.4]]), M.c2);
        P.facetas(loc(h, tilt, [[-1.6, -6.8], [1.4, -10.4], [3.6, -7.2]]), M.c2);
        [[-2.6, -4.4], [0.4, -5.6], [2.8, -3.8]].forEach(function (q) { P.facetas(ovalo(rot(q, h, tilt), 0.7, 0.7, 5), M.acc); }); break;
      case 'casco':
        P.facetas(loc(h, tilt, [[-6, -2.2], [-5, -6], [0, -8.2], [5, -6], [6, -2.2]]), M.acc);
        P.poly(loc(h, tilt, [[-7.6, -2.4], [7.6, -2.4], [7.6, -1.2], [-7.6, -1.2]]), M.acc[2]); break;
      case 'turbante':
        P.facetas(loc(h, tilt, [[-5.4, -0.6], [-4.8, -6], [0, -8.4], [5.2, -6.4], [5.8, -1.2], [0, -2.6]]), M.c2);
        P.facetas(loc(h, tilt, [[-5.2, -1.2], [5.6, -1.6], [5.4, -3.4], [-5, -3]]), M.ropa); break;
      case 'sombrero':
        P.facetas(loc(h, tilt, [[-11, -1.6], [11, -1.6], [8, 0.4], [-8, 0.4]]), M.c2);
        P.facetas(loc(h, tilt, [[-5, -1.6], [-4.4, -7], [4.4, -7], [5, -1.6]]), M.c2); break;
      case 'cofia':
        P.facetas(loc(h, tilt, [[-5.8, 1], [-5.2, -5], [0, -7.6], [5.2, -5], [5.8, 1], [3.4, -1.8], [-3.4, -1.8]]), M.camisa); break;
      case 'largo':
        P.facetas(loc(h, tilt, [[-5.4, 0], [-4.4, -5.6], [0, -7], [4.4, -5.6], [5.4, 0], [2.6, -3.8], [-2.6, -3.8]]), M.pelo); break;
      default:
        P.facetas(loc(h, tilt, [[-5, -0.8], [-4.4, -5.4], [0, -6.8], [4.4, -5.4], [5, -0.8], [2.4, -3.6], [-2.4, -3.6]]), M.pelo);
    }
  }
  function mano(P, M, w, e, m) {
    var a = ang(e, w), c = rot([1.4, 0], w, a);
    P.facetas(ovalo(c, 2.7, 2.3, 6, a), m || M.piel);
  }

  /* ───────── lo que llevan en las manos ───────── */
  function barra(P, o, a, u0, u1, ww, m) { P.facetas(loc(o, a, [[u0, -ww], [u1, -ww], [u1, ww], [u0, ww]]), m); }
  function herramienta(nombre, P, M, J, w, e, R) {
    var a = ang(e, w), o = rot([2, 0], w, a);
    switch (nombre) {
      case 'microfono': barra(P, o, a - 1.2, -3, 6, 1, M.metal); P.facetas(ovalo(rot([7.6, 0], o, a - 1.2), 2.4, 2.4, 7), M.metal); break;
      case 'tijera':
        P.facetas(loc(o, a - 0.15, [[0, -0.4], [14, -1.6], [14, -0.6], [0, 0.6]]), M.metal);
        P.facetas(loc(o, a + 0.15, [[0, 0.4], [14, 1.6], [14, 0.6], [0, -0.6]]), M.metal);
        P.facetas(ovalo(rot([-1.6, -1.8], o, a), 1.8, 1.8, 6), M.acc); P.facetas(ovalo(rot([-1.6, 1.8], o, a), 1.8, 1.8, 6), M.acc); break;
      case 'martillo': barra(P, o, a, -3, 12, 0.9, M.acc); barra(P, rot([12, 0], o, a), a + Math.PI / 2, -5, 4, 1.8, M.metal); break;
      case 'llave': barra(P, o, a, -2, 12, 1, M.metal); P.facetas(loc(o, a, [[11, -3], [16, -3.4], [15, -1], [13, -0.6], [13, 0.6], [15, 1], [16, 3.4], [11, 3]]), M.metal); break;
      case 'cuchara': barra(P, o, a, -2, 11, 0.8, M.acc); P.facetas(ovalo(rot([14, 0], o, a), 3.4, 2.2, 7, a), M.metal); break;
      case 'brocha': barra(P, o, a, -2, 8, 0.9, M.acc); barra(P, o, a, 8, 10, 1.4, M.metal); P.facetas(loc(o, a, [[10, -1.6], [15, -2.6], [16, 0], [15, 2.6], [10, 1.6]]), M.pelo); break;
      case 'maquina': barra(P, o, a - 1.4, -2, 5, 1.8, M.metal); barra(P, o, a - 1.4, 5, 9, 0.4, M.acc); break;
      case 'soplete':
        barra(P, o, a - 1.1, -2, 7, 1.4, M.metal); barra(P, o, a - 1.1, 7, 10, 0.6, M.metal);
        P.facetas(loc(o, a - 1.1, [[10, -1.4], [17, 0], [10, 1.4]]), M.c2); P.facetas(loc(o, a - 1.1, [[10, -0.7], [14, 0], [10, 0.7]]), M.acc); break;
      case 'camara': P.facetas(ovalo(o, 4.5, 3, 6, a), M.metal); P.facetas(ovalo(o, 2, 2, 8), M.acc); break;
      case 'ampolleta': P.facetas(ovalo([o[0], o[1] - 5], 3.6, 4.2, 8), M.c2); barra(P, [o[0], o[1] - 1], -Math.PI / 2, -0.6, 1.6, 1.6, M.metal); break;
      case 'libro': P.facetas(loc(o, a, [[0, -6], [7, -6.6], [7, 0], [0, 0]]), M.c2); P.facetas(loc(o, a, [[0, 0], [7, 0], [7, 6.6], [0, 6]]), M.camisa); break;
      default: break;
    }
  }
  function escalar(P, desde, c, k) { for (var i = desde; i < P.F.length; i++) P.F[i][0] = P.F[i][0].map(function (q) { return [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]; }); }
  function agrandar(P, c, k, fn) { var n0 = P.F.length; fn(); escalar(P, n0, c, k); }
  function props(def, J, M, P, R, of) {
    (def.props || []).forEach(function (pr) {
      var p = pr.split(':');
      switch (p[0]) {
        case 'tool': var mn = p[1], el = mn === 'wR' ? 'eR' : 'eL'; agrandar(P, J[mn], 1.6, function () { herramienta(HERRAMIENTA[of], P, Object.assign({}, M, { metal: M.acc, acc: M.metal }), J, J[mn], J[el], R); }); break;
        case 'pedestal':
          barra(P, [J.wR[0] - 2, J.wR[1] - 8], ang([J.wR[0] - 2, J.wR[1] - 8], [J.wR[0] + 9, J.wR[1] + 46]), 0, 56, 0.8, M.metal);
          P.facetas(ovalo([J.wR[0] - 2.4, J.wR[1] - 10], 2.4, 3.2, 7, 0.3), M.metal); break;
        case 'guitarra':
          var bc = [4, 53], ax = ang(bc, J.wL);
          P.facetas(ovalo(rot([-3, 0], bc, ax), 8.6, 7.6, 10, ax), M.acc); P.facetas(ovalo(rot([6, 0], bc, ax), 6, 5.4, 9, ax), M.acc);
          P.facetas(ovalo(rot([1.5, 0], bc, ax), 2.2, 2.2, 8), [M.linea, M.linea, M.linea]);
          barra(P, rot([9, 0], bc, ax), ax, 0, Math.hypot(J.wL[0] - bc[0], J.wL[1] - bc[1]) - 4, 1.1, M.pelo);
          barra(P, J.wL, ax, 0, 6, 1.6, M.pelo); break;
        case 'bolso': P.facetas([[J.wL[0] - 5, J.wL[1]], [J.wL[0] + 4, J.wL[1]], [J.wL[0] + 5, J.wL[1] + 9], [J.wL[0] - 6, J.wL[1] + 8]], M.c2); break;
        case 'tablon':
          P.facetas([[-46, 4], [46, 4], [46, 12], [-46, 12]], M.acc);
          for (var gi = 0; gi < 5; gi++) P.poly([[-44 + gi * 18, 7.4], [-34 + gi * 18, 7.6], [-34 + gi * 18, 8.2], [-44 + gi * 18, 8]], M.acc[2]); break;
        case 'peine': barra(P, [J.wL[0] + 1, J.wL[1]], -0.5, -1, 9, 1.4, M.acc); break;
        case 'jarra':
          var jc = lerp(J.wL, J.wR, 0.5);
          P.facetas([[jc[0] - 4, jc[1] - 5], [jc[0] + 4, jc[1] - 5], [jc[0] + 5.6, jc[1] + 4], [jc[0] + 9, jc[1] + 5.4], [jc[0] + 3.6, jc[1] + 7.2], [jc[0] - 5, jc[1] + 6]], M.c2);
          P.poly([[jc[0] + 8.2, jc[1] + 5.6], [jc[0] + 9.2, jc[1] + 5.6], [jc[0] + 9.6, 62], [jc[0] + 8.6, 62]], M.camisa[0]); break;
        case 'tatuajes':
          ['L', 'R'].forEach(function (s) { var m = lerp(J['s' + s], J['e' + s], 0.55); P.facetas(ovalo(m, 2, 1.6, 5, 0.6), M.acc); P.poly([[m[0] - 0.6, m[1] - 3.4], [m[0] + 0.6, m[1] - 3.4], [m[0], m[1] - 1.8]], M.c2[0]); }); break;
        case 'cinta':
          var a0 = J.wL, a1 = J.wR, nseg = 14;
          for (var ci = 0; ci < nseg; ci++) {
            var u0 = ci / nseg, u1 = (ci + 1) / nseg;
            var q0 = [a0[0] + (a1[0] - a0[0]) * u0 + Math.sin(u0 * Math.PI) * 18, a0[1] + (a1[1] - a0[1]) * u0 + Math.sin(u0 * Math.PI * 2) * 7];
            var q1 = [a0[0] + (a1[0] - a0[0]) * u1 + Math.sin(u1 * Math.PI) * 18, a0[1] + (a1[1] - a0[1]) * u1 + Math.sin(u1 * Math.PI * 2) * 7];
            barra(P, q0, ang(q0, q1), 0, Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) + 0.4, 1.1, ci % 2 ? M.c2 : M.acc);
          } break;
        case 'pan':
          var pc = [lerp(J.wL, J.wR, 0.5)[0], lerp(J.wL, J.wR, 0.5)[1] - 5];
          P.facetas(ovalo(pc, 12, 4.6, 12), M.acc);
          for (var pi = -1; pi <= 1; pi++) P.poly([[pc[0] + pi * 5 - 1.6, pc[1] - 2.6], [pc[0] + pi * 5 + 2, pc[1] - 1.2], [pc[0] + pi * 5 + 1.4, pc[1] - 0.4], [pc[0] + pi * 5 - 2, pc[1] - 1.8]], M.c2[0]); break;
        case 'camara':
          var cc = lerp(J.wL, J.wR, 0.5), n0 = P.F.length;
          P.facetas([[cc[0] - 8, cc[1] - 3.6], [cc[0] + 8, cc[1] - 3.6], [cc[0] + 8, cc[1] + 4.2], [cc[0] - 8, cc[1] + 4.2]], M.metal);
          P.facetas(ovalo([cc[0] + 1, cc[1] + 0.4], 4, 4, 10), [M.linea, M.linea, M.linea]); P.facetas(ovalo([cc[0] + 1, cc[1] + 0.4], 2.2, 2.2, 8), M.acc);
          P.facetas([[cc[0] - 6, cc[1] - 3.6], [cc[0] - 2, cc[1] - 3.6], [cc[0] - 3, cc[1] - 6], [cc[0] - 5.6, cc[1] - 6]], M.metal); escalar(P, n0, cc, 1.35); break;
        case 'arete': var ea = rot([4.8, 3.6], J.h, 0.1); P.facetas(ovalo(ea, 1.3, 1.5, 8), M.camisa); break;
        case 'vasija':
          var vc = [12, 46];
          P.facetas([[vc[0] - 3, vc[1] - 7], [vc[0] + 3, vc[1] - 7], [vc[0] + 2, vc[1] - 4], [vc[0] + 6.6, vc[1] + 1], [vc[0] + 4.6, vc[1] + 7], [vc[0] - 4.6, vc[1] + 7], [vc[0] - 6.6, vc[1] + 1], [vc[0] - 2, vc[1] - 4]], M.acc);
          P.facetas([[vc[0] - 11, vc[1] + 7], [vc[0] + 11, vc[1] + 7], [vc[0] + 9, vc[1] + 10], [vc[0] - 9, vc[1] + 10]], M.c2); break;
        case 'ampolleta':
          var bb = [J.wR[0], J.wR[1] - 6.4];
          P.facetas(ovalo(bb, 5, 5.8, 10), M.c2); barra(P, [J.wR[0], J.wR[1] + 0.2], -Math.PI / 2, 0, 2.4, 2.2, M.metal); break;
        case 'rollo': P.facetas(ovalo(J.wL, 4.6, 4.6, 9), M.acc); P.facetas(ovalo(J.wL, 2.2, 2.2, 7), [M.linea, M.linea, M.linea]); break;
        case 'stilson':
          var so = J.wR, sa = -1.05;
          barra(P, rot([-16, 0], so, sa), sa, 0, 30, 1.5, M.metal);
          P.facetas(loc(so, sa, [[13, -2], [19, -2.6], [19, 4.6], [16, 4.6], [16, 1.6], [13, 1.6]]), M.acc); break;
        case 'herramientas':
          herramienta('martillo', P, M, J, J.wL, J.eL, R); herramienta('llave', P, M, J, J.wR, J.eR, R); break;
        case 'rodillo':
          var ro = J.wR, ra = -1.45;
          barra(P, rot([-18, 0], ro, ra), ra, 0, 44, 0.7, M.metal);
          P.facetas(loc(rot([26, 0], ro, ra), ra, [[-1, -7], [3, -7], [3, 7], [-1, 7]]), M.acc); break;
        case 'perro':
          var dc = [34, 88], k = 1;
          barra(P, J.wR, ang(J.wR, [dc[0] + 7, dc[1] - 6]), 0, Math.hypot(dc[0] + 7 - J.wR[0], dc[1] - 6 - J.wR[1]), 0.35, M.acc);
          P.facetas([[dc[0] - 8, dc[1] - 5], [dc[0] + 6, dc[1] - 5.6], [dc[0] + 7, dc[1] + 0.4], [dc[0] - 8, dc[1] + 0.6]], M.c2);
          P.facetas([[dc[0] + 5, dc[1] - 7], [dc[0] + 10, dc[1] - 9.6], [dc[0] + 13, dc[1] - 6], [dc[0] + 9, dc[1] - 3.4]], M.c2);
          P.poly([[dc[0] + 8, dc[1] - 9.6], [dc[0] + 9.2, dc[1] - 12.6], [dc[0] + 10.6, dc[1] - 9.4]], M.c2[2]);
          P.poly([[dc[0] - 8, dc[1] - 4.6], [dc[0] - 13, dc[1] - 9], [dc[0] - 12.4, dc[1] - 9.6], [dc[0] - 7, dc[1] - 5.6]], M.c2[1]);
          [[-6.5, -1], [-3.5, 1.2], [3, -1], [5.6, 1.2]].forEach(function (lg) { barra(P, [dc[0] + lg[0], dc[1]], Math.PI / 2 + lg[1] * 0.14, 0, 9, 0.9 * k, M.c2); }); break;
        case 'semillas': case 'remango': default: break;
      }
    });
  }

  /* La creación: dos brazos que casi se tocan (no hay cuerpo entero). */
  function creacion(M, P) {
    var izq = { s: [-64, 40], e: [-36, 35], w: [-10, 31] }, der = { s: [64, 12], e: [38, 21], w: [11, 27] };
    P.seg(izq.s, izq.e, 5.6, 4.6, M.piel); P.junta(izq.e, 4.6, M.piel); P.seg(izq.e, izq.w, 4.6, 3.2, M.piel);
    P.facetas([[izq.w[0] - 1, izq.w[1] - 2.6], [izq.w[0] + 4, izq.w[1] - 1.4], [izq.w[0] + 7, izq.w[1] + 1.8], [izq.w[0] + 2, izq.w[1] + 3]], M.piel);
    P.seg([izq.w[0] + 6, izq.w[1] + 1], [izq.w[0] + 11, izq.w[1] + 3.4], 0.8, 0.6, M.piel);
    P.seg(der.s, der.e, 6.6, 5.4, M.ropa); P.junta(der.e, 5.2, M.ropa); P.seg(der.e, der.w, 4.4, 3.2, M.piel);
    P.facetas([[der.w[0] + 2, der.w[1] - 2.6], [der.w[0] - 3, der.w[1] - 1.4], [der.w[0] - 4, der.w[1] + 2.6], [der.w[0] + 1, der.w[1] + 3]], M.piel);
    P.seg([der.w[0] - 3, der.w[1] + 0.4], [der.w[0] - 11, der.w[1] + 1.6], 0.8, 0.6, M.piel);
  }

  /* La masoterapia: la camilla vista de lado, quien recibe el masaje boca abajo con la toalla en la cadera y piedras
     calientes en la espalda, y quien lo da detrás, inclinada, con las dos palmas apoyadas en la espalda. */
  var MASAJISTA = [0, 10, 0, 17, -10, 21, 10, 21, -16, 38, 13, 38, -11, 57, 9, 57, -6, 54, 6, 54, -7, 76, 7, 76, -8, 98, 8, 98];
  function masaje(D, M, P, R) {
    var J = pose(MASAJISTA);
    cuerpo(J, D, M, P, R, { sinBrazos: false });
    var piel = M.piel, toalla = M.c2, cama = M.pant, pelo = M.pelo;
    // la camilla: cubierta, borde y patas
    P.facetas([[-52, 67], [52, 67], [52, 72], [-52, 72]], cama);
    P.poly([[-52, 72], [52, 72], [52, 73.6], [-52, 73.6]], cama[2]);
    [-44, 44].forEach(function (x) { P.facetas([[x - 2, 73], [x + 2, 73], [x + 2.6, 99], [x - 2.6, 99]], cama); });
    P.facetas([[-46, 86], [46, 86], [46, 88], [-46, 88]], cama);
    // quien recibe el masaje, boca abajo: cabeza en el apoyo, espalda, toalla, piernas
    P.facetas(ovalo([-44, 61.5], 5.6, 4.6, 9, 0.1), piel);
    P.facetas([[-49.4, 60], [-46, 56.6], [-41, 56.4], [-38.6, 59], [-44, 59.6]], pelo);
    P.facetas([[-39, 59.2], [-30, 57.6], [-20, 58.6], [-10, 58.2], [0, 59.6], [6, 60.2], [6, 67], [-39, 67]], piel);
    P.poly([[-32, 59.4], [-24, 58.4], [-22, 60.2], [-30, 61]], piel[2]);
    P.facetas([[-36, 62], [-22, 63.6], [-20, 67], [-36, 67]], piel);
    P.facetas([[4, 59.4], [26, 59], [44, 61.6], [47, 63.4], [47, 67], [4, 67]], toalla);
    P.poly([[14, 59.6], [16, 59.4], [17, 67], [15, 67]], toalla[2]); P.poly([[30, 60], [32, 60.2], [33, 67], [31, 67]], toalla[2]);
    P.facetas([[46, 62], [50.6, 60.6], [51.4, 64.4], [47, 66]], piel);
    // piedras calientes a lo largo de la columna
    [[-27, 57.2, 3.2], [-20, 57.6, 2.8], [-13.6, 57.6, 2.4]].forEach(function (q) { P.facetas(ovalo([q[0], q[1]], q[2], q[2] * 0.62, 8), [M.linea, M.linea, M.linea]); P.poly([[q[0] - q[2] * 0.6, q[1] - q[2] * 0.3], [q[0], q[1] - q[2] * 0.55], [q[0] + q[2] * 0.2, q[1] - q[2] * 0.3]], M.c2[0]); });
    // las manos de quien da el masaje, encima de todo: palmas abiertas sobre la espalda
    ['L', 'R'].forEach(function (s2) {
      var w = J['w' + s2];
      P.seg(J['e' + s2], [w[0], w[1] - 1], 3.2, 2.5, piel);
      P.facetas([[w[0] - 4, w[1] - 1.6], [w[0] + 4.4, w[1] - 1.4], [w[0] + 5, w[1] + 1.2], [w[0] - 4.6, w[1] + 1.2]], piel);
    });
    return J;
  }

  /* ───────── encuadre: dónde y de qué tamaño va la figura ───────── */
  function cajaPose(J, def) {
    var xs = [], ys = [];
    Object.keys(J).forEach(function (k) { xs.push(J[k][0]); ys.push(J[k][1]); });
    (def.caja || []).forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    var c = { x0: Math.min.apply(null, xs) - 6, x1: Math.max.apply(null, xs) + 6, y0: Math.min.apply(null, ys) - 8, y1: Math.max.apply(null, ys) + 2 };
    if (def.pelo === 'sombrero') { c.x0 = Math.min(c.x0, J.h[0] - 12); c.x1 = Math.max(c.x1, J.h[0] + 12); }
    return c;
  }
  function encuadre(o, def, J) {
    var w = o.w, h = o.h, c = cajaPose(J, def), alto = def.alto || 0.86, suelo = def.suelo || 0.97, cx = def.cx || 0.5;
    if (def.encuadre === 'busto') { c.y0 = J.h[1] - 11; c.y1 = J.h[1] + 46; c.x0 = J.h[0] - 24; c.x1 = J.h[0] + 22; alto = 1.0; suelo = 1.0; }
    if (def.encuadre === 'medio') { c.y0 -= 5; c.y1 = J.p[1] + 14; alto = 0.98; suelo = 1.02; }
    var fw = c.x1 - c.x0, fh = c.y1 - c.y0, k = Math.min(h * alto / fh, w * (o.anchoFig || 0.9) / fw);   // anchoFig: la portada de escritorio deja aire a los lados (el zoom lento no la corta)
    if (def.encuadre === 'medio') k = Math.min(h * alto / fh, w * 1.05 / fw);
    if (def.encuadre === 'busto') k = Math.min(h * alto / fh, w * 1.0 / fw);
    return { k: k, c: c, oy: h * suelo - c.y1 * k, cx: cx };
  }

  /* ───────── las capas ───────── */
  function capas(o) {
    var el = elegir(o), def = el.def, t = o.tintas, w = o.w, h = o.h, r = azar((o.seed || 1) ^ 0x51ED), flip = el.flip;
    var J = def.pose === 'manos' || def.pose === 'masaje' ? pose(def.pose === 'masaje' ? MASAJISTA : POSES.himno) : pose(POSES[def.pose]);
    if (def.pose === 'manos') { J = { h: [0, 10], n: [0, 20], p: [0, 30] }; def = Object.assign({}, def, { caja: [[-60, 6], [60, 46]] }); }
    var E = def.pose === 'manos' ? { k: Math.min(w * 1.32 / 124, h * 0.9 / 40), c: { x0: -62, x1: 62, y0: 6, y1: 46 }, oy: 0, cx: 0.5 } : encuadre(o, def, J);
    if (def.pose === 'manos') E.oy = h * 0.46 - 27 * E.k;
    var cxp = w * (flip ? 1 - E.cx : E.cx), mid = (E.c.x0 + E.c.x1) / 2;
    function X(p) { return [cxp + ((flip ? -1 : 1) * p[0] - (flip ? -mid : mid)) * E.k, E.oy + p[1] * E.k]; }
    var M = materiales(t, def), osc = M.osc;
    // la luz viene de arriba a la izquierda, en unidades de la pose: el espejo la da vuelta junto con todo
    var R = { luz: [-0.62, -0.78], plano: !!def.plano };
    var P = Pintor(R);
    if (def.pose === 'manos') creacion(M, P);
    else if (def.pose === 'masaje') masaje(def, M, P, R);
    else {
      if (FANTASMA[def.pose]) {   // el hombre de Vitruvio: la segunda posición, apenas insinuada
        var PG = Pintor(R), JG = pose(FANTASMA[def.pose]);
        cuerpo(JG, def, materiales(t, Object.assign({}, def, { plano: 1 })), PG, R);
        R.fantasma = PG.F;
      }
      cuerpo(J, def, M, P, R);
      props(def, J, M, P, R, el.oficio);
      ['L', 'R'].forEach(function (s) { mano(P, M, J['w' + s], J['e' + s]); });
    }
    var B = { suf: o.sufijo || '', w: w, h: h, t: t, r: r, osc: osc, X: X, k: E.k, J: J, def: def, flip: flip, M: M,
      cxp: cxp, top: X([0, E.c.y0])[1], pie: X([0, E.c.y1])[1] };
    var fn = FONDOS[def.fondo] || FONDOS.focos, bg = fn(B);
    // la figura en SVG (con contorno de cómic si la escena lo pide)
    function serial(lista, extra) {
      return lista.map(function (q) { return '<polygon points="' + q[0].map(function (p) { var x = X(p); return f(x[0]) + ',' + f(x[1]); }).join(' ') + '" fill="' + q[1] + '"' + (extra ? extra : ' stroke="' + q[1] + '" stroke-width="' + f(Math.max(0.6, E.k * 0.12)) + '" stroke-linejoin="round"') + '/>'; }).join('');
    }
    var fig = '';
    if (R.fantasma) fig += '<g opacity=".32">' + serial(R.fantasma) + '</g>';
    if (def.contorno) fig += serial(P.F, ' stroke="' + M.linea + '" stroke-width="' + f(E.k * 1.5) + '" stroke-linejoin="round"');
    fig += serial(P.F);
    var figura = (def.sombraFig === false ? '' : '<g class="vpa-sombra">' + serialSombra(P.F, X, t, osc, E.k) + '</g>') + '<g class="vpa-fig">' + fig + '</g>';
    return {
      fondo: bg.fondo || '', sol: bg.sol || '', confeti: bg.conf || '', figura: figura, horizonte: bg.hz || '',
      sol0: { x: cxp, y: (B.top + B.pie) / 2, r: (B.pie - B.top) / 2 }, hz: B.pie, clave: el.clave
    };
  }
  /* La sombra desfasada de serigrafía: la silueta entera, corrida, en una tinta. */
  function serialSombra(F, X, t, osc, k) {
    var col = osc ? mix(t.bg, '#000', 0.45) : mix(t.c3, t.bg, 0.55), dx = k * 1.8, dy = k * 1.2;
    return F.map(function (q) { return '<polygon points="' + q[0].map(function (p) { var x = X(p); return f(x[0] + dx) + ',' + f(x[1] + dy); }).join(' ') + '" fill="' + col + '" stroke="' + col + '" stroke-width="' + f(k * 0.3) + '"/>'; }).join('').replace(/^/, '<g opacity=".55">') + '</g>';
  }

  /* ───────── los fondos de cada escena ─────────
     Cada uno devuelve { fondo, sol (la forma grande, se anima), conf (partículas), hz (lo de adelante) }. */
  function rect(x, y, w, h, c, op) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + c + '"' + (op != null ? ' fill-opacity="' + op + '"' : '') + '/>'; }
  function pol(pts, c, op, extra) { return '<polygon points="' + pts.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' ') + '" fill="' + c + '"' + (op != null ? ' fill-opacity="' + op + '"' : '') + (extra || '') + '/>'; }
  function circ(x, y, rr, c, op, extra) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(rr) + '" fill="' + c + '"' + (op != null ? ' fill-opacity="' + op + '"' : '') + (extra || '') + '/>'; }
  function lin(x1, y1, x2, y2, c, sw, op, extra) { return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + c + '" stroke-width="' + f(sw) + '"' + (op != null ? ' stroke-opacity="' + op + '"' : '') + (extra || '') + '/>'; }
  function grad(id, a, b, vertical) { return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 0) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>'; }
  function uid(B) { return 'e' + Math.floor(B.r() * 1e6).toString(36) + (B.suf || ''); }   // con sufijo: dos SVG de la misma semilla en la página no comparten ids
  function estrella(x, y, rr, puntas, c, op, giro) { var pts = []; for (var i = 0; i < puntas * 2; i++) { var q = i / (puntas * 2) * Math.PI * 2 + (giro || 0), l = i % 2 ? rr * 0.42 : rr; pts.push([x + Math.cos(q) * l, y + Math.sin(q) * l]); } return pol(pts, c, op); }
  function multitud(B, y0, filas, col1, col2, evita) {
    var w = B.w, r = B.r, out = '';
    for (var fi = 0; fi < filas; fi++) {
      var y = y0 + fi * B.h * 0.045, x = -w * 0.02 + r() * w * 0.03, col = fi ? col2 : col1;
      while (x < w * 1.02) {
        var rr = w * (0.026 + r() * 0.014);
        if (!(evita && Math.abs(x - B.cxp) < evita)) {
          out += circ(x, y, rr, col);
          out += pol([[x - rr * 1.7, B.h + 2], [x - rr * 1.3, y + rr * 1.1], [x + rr * 1.3, y + rr * 1.1], [x + rr * 1.7, B.h + 2]], col);
          if (r() < 0.38) { var ax = x + (r() < 0.5 ? -1 : 1) * rr * 1.2; out += pol([[ax - rr * 0.32, y + rr], [ax - rr * 0.1 + (r() - 0.5) * rr, y - rr * 3.2], [ax + rr * 0.42 + (r() - 0.5) * rr, y - rr * 3.1], [ax + rr * 0.34, y + rr]], col); }
        }
        x += rr * (2.1 + r() * 0.7);
      }
    }
    return out;
  }
  function esquirlas(B, n, cols, y1) {
    var out = '', r = B.r;
    for (var i = 0; i < n; i++) {
      var x = r() * B.w, y = r() * (y1 || B.h), s = B.w * (0.03 + r() * 0.09), a = r() * 6.3;
      out += pol([[x, y], [x + Math.cos(a) * s, y + Math.sin(a) * s], [x + Math.cos(a + 0.6 + r()) * s * 0.7, y + Math.sin(a + 0.6 + r()) * s * 0.7]], cols[i % cols.length], f(0.14 + r() * 0.3));
    }
    return out;
  }
  function confeti(B, n, cols, y1) {
    var out = '', r = B.r;
    for (var i = 0; i < n; i++) {
      var x = r() * B.w, y = r() * (y1 || B.h * 0.7), s = B.w * (0.008 + r() * 0.014), a = r() * 180;
      out += '<g class="vpa-cf" style="--i:' + (i % 5) + '" transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(a) + ')">' + pol([[-s, -s * 0.35], [s, -s * 0.5], [s * 0.8, s * 0.45], [-s * 0.9, s * 0.3]], cols[i % cols.length]) + '</g>';
    }
    return out;
  }

  var FONDOS = {
    /* El puño en alto: focos que convergen, esquirlas facetadas y el público a los lados. */
    focos: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), sol = '', n = 5 + Math.floor(r() * 3), i;
      var fondo = grad(id, B.osc ? t.bg2 : mix(t.bg, t.ac, 0.12), t.bg, true) + rect(0, 0, w, h, 'url(#' + id + ')');
      var cols = [[t.ac, 0.42], [t.c2, 0.3], [t.ink, 0.16], [t.ac, 0.28]];
      for (i = 0; i < n; i++) {
        var lx = w * (0.04 + i / (n - 1) * 0.92), tx = B.cxp + (lx - B.cxp) * 0.25, sp = w * (0.1 + r() * 0.12), c = cols[i % 4];
        sol += pol([[lx - w * 0.012, -h * 0.01], [lx + w * 0.012, -h * 0.01], [tx + sp, h * 0.92], [tx - sp, h * 0.92]], c[0], c[1]);
      }
      sol += esquirlas(B, 18, [t.ac, t.c2, t.c3, t.ink], h * 0.8);
      for (i = 0; i < n; i++) { var lx2 = w * (0.04 + i / (n - 1) * 0.92); sol += circ(lx2, h * 0.02, w * 0.045, t.c2, 0.35) + circ(lx2, h * 0.02, w * 0.024, t.ink, 0.95); }
      var hz = multitud(B, h * 0.8, 2, mix(t.bg, t.ac, B.osc ? 0.45 : 0.6), mix(t.bg, '#000', B.osc ? 0.35 : 0.55), w * 0.2);
      hz += rect(0, h * 0.965, w, h * 0.04, mix(t.bg, '#000', 0.4));
      return { fondo: fondo, sol: sol, conf: confeti(B, 16, [t.ac, t.c2, t.ink]), hz: hz };
    },
    /* El sembrador: un sol enorme con pinceladas en anillo y surcos que se van al horizonte. */
    sol: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, hzY = h * 0.66, j = B.X(B.J.h), sx = j[0] + (B.flip ? -1 : 1) * w * 0.08, sy = Math.max(h * 0.2, j[1] + h * 0.04), sr = Math.min(w, h) * 0.34, sol = '', i;
      var fondo = rect(0, 0, w, h, t.bg) + rect(0, 0, w, hzY, t.c2, B.osc ? 0.16 : 0.35);
      sol += circ(sx, sy, sr * 1.5, t.ac, 0.14) + circ(sx, sy, sr, t.ac);
      for (i = 1; i <= 6; i++) sol += circ(sx, sy, sr * (0.3 + i * 0.2), 'none', null, ' stroke="' + (i % 2 ? t.c2 : t.c3) + '" stroke-opacity=".5" stroke-width="' + f(w / 140) + '" stroke-dasharray="' + f(w / 50) + ' ' + f(w / 90) + '"');
      for (i = 0; i < 40; i++) { var q = i / 40 * 6.283, a0 = sr * 1.08, a1 = sr * (1.25 + r() * 0.35); sol += lin(sx + Math.cos(q) * a0, sy + Math.sin(q) * a0, sx + Math.cos(q) * a1, sy + Math.sin(q) * a1, t.ac, w / 120, 0.6, ' stroke-linecap="round"'); }
      var hz = rect(0, hzY, w, h - hzY, t.bg2), vp = w * 0.5;
      for (i = 0; i < 14; i++) { var x0 = -w * 0.6 + i * w * 0.16, x1 = x0 + w * 0.08; hz += pol([[vp + (x0 - vp) * 0.08, hzY], [vp + (x1 - vp) * 0.08, hzY], [x1, h], [x0, h]], i % 2 ? t.c3 : t.ac, i % 2 ? 0.55 : 0.22); }
      for (i = 0; i < 46; i++) { var yy = hzY + r() * (h - hzY), xx = r() * w; hz += lin(xx, yy, xx + w * 0.03, yy - w * 0.006, t.ink, w / 260, 0.2, ' stroke-linecap="round"'); }
      var conf = '', wr = B.X(B.J.wR);
      for (i = 0; i < 26; i++) { var u = i / 26, cx = wr[0] + (B.flip ? -1 : 1) * u * w * 0.38, cy = wr[1] + u * u * h * 0.32 + (r() - 0.5) * h * 0.04; conf += '<g class="vpa-cf" style="--i:' + (i % 5) + '">' + '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(w / 150) + '" ry="' + f(w / 240) + '" fill="' + t.ink + '" fill-opacity=".85"/></g>'; }
      return { fondo: fondo, sol: sol, conf: conf, hz: hz };
    },
    /* Atlas: el mundo detrás, con sus meridianos, y un zócalo de templo. */
    templo: function (B) {
      var t = B.t, w = B.w, h = B.h, c = B.X([0, 14]), rr = Math.min(w, h) * 0.38, sol = '', i;
      var fondo = rect(0, 0, w, h, t.bg) + rect(0, 0, w, h, t.c2, B.osc ? 0.06 : 0.18);
      sol += circ(c[0], c[1], rr, t.ac) + circ(c[0], c[1], rr, t.c3, 0.18);
      for (i = 1; i < 5; i++) sol += '<ellipse cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" rx="' + f(rr * i / 5) + '" ry="' + f(rr) + '" fill="none" stroke="' + t.c2 + '" stroke-opacity=".55" stroke-width="' + f(w / 220) + '"/>';
      for (i = -3; i <= 3; i++) { var yy = c[1] + rr * i / 4, half = Math.sqrt(Math.max(0, rr * rr - (yy - c[1]) * (yy - c[1]))); sol += lin(c[0] - half, yy, c[0] + half, yy, t.c2, w / 220, 0.55); }
      var hz = '', y0 = B.pie - B.k * 1;
      for (i = 0; i < 3; i++) hz += rect(w * (0.08 - i * 0.05), y0 + i * h * 0.035, w * (0.84 + i * 0.1), h * 0.035, [t.bg2, t.c3, mix(t.c3, '#000', 0.3)][i]);
      hz += rect(0, y0 + h * 0.105, w, h, mix(t.c3, '#000', 0.4));
      return { fondo: fondo, sol: sol, conf: confeti(B, 8, [t.c2, t.ac]), hz: hz };
    },
    /* Pop: trama de puntos, estallido con contorno y líneas de acción. */
    pop: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), c = B.X(B.J.n), i, sol = '';
      var fondo = rect(0, 0, w, h, B.osc ? t.bg : t.c2) + '<defs><pattern id="' + id + '" width="' + f(w / 28) + '" height="' + f(w / 28) + '" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="' + f(w / 56) + '" cy="' + f(w / 56) + '" r="' + f(w / 120) + '" fill="' + t.ac + '" fill-opacity=".55"/></pattern></defs>' + rect(0, 0, w, h, 'url(#' + id + ')');
      var pts = [], n = 22;
      for (i = 0; i < n * 2; i++) { var q = i / (n * 2) * 6.283, l = (i % 2 ? 0.55 : 1) * Math.max(w, h) * (0.42 + r() * 0.12); pts.push([c[0] + Math.cos(q) * l, c[1] + Math.sin(q) * l]); }
      sol += pol(pts, B.osc ? t.c2 : t.bg, null, ' stroke="' + B.M.linea + '" stroke-width="' + f(w / 90) + '" stroke-linejoin="round"');
      sol += estrella(c[0], c[1], Math.min(w, h) * 0.3, 14, t.ac, 0.9, r());
      for (i = 0; i < 12; i++) { var q2 = r() * 6.283, a0 = Math.min(w, h) * 0.36, a1 = a0 + w * 0.08; sol += lin(c[0] + Math.cos(q2) * a0, c[1] + Math.sin(q2) * a0, c[0] + Math.cos(q2) * a1, c[1] + Math.sin(q2) * a1, B.M.linea, w / 160, 0.8, ' stroke-linecap="round"'); }
      return { fondo: fondo, sol: sol, conf: '', hz: rect(0, h * 0.97, w, h * 0.03, B.M.linea) };
    },
    /* La lechera: muro con la luz de una ventana a un costado y la mesa con su paño adelante. */
    ventana: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), izq = !B.flip, wx = izq ? w * 0.05 : w * 0.71, sol = '', i;
      var muro = B.osc ? mix(t.bg2, t.c2, 0.08) : mix(t.bg, t.c2, 0.25);
      var fondo = rect(0, 0, w, h, muro) + grad(id, izq ? t.c2 : muro, izq ? muro : t.c2) + rect(0, 0, w, h, 'url(#' + id + ')', 0.35);
      sol += rect(wx, h * 0.08, w * 0.24, h * 0.42, t.c2, 0.75);
      for (i = 1; i < 4; i++) sol += lin(wx, h * (0.08 + 0.105 * i), wx + w * 0.24, h * (0.08 + 0.105 * i), B.M.linea, w / 180, 0.5);
      sol += lin(wx + w * 0.12, h * 0.08, wx + w * 0.12, h * 0.5, B.M.linea, w / 180, 0.5);
      sol += pol([[wx + (izq ? w * 0.24 : 0), h * 0.08], [wx + (izq ? w * 0.24 : 0), h * 0.5], [izq ? w * 0.9 : w * 0.1, h * 0.9], [izq ? w * 0.7 : w * 0.3, h * 0.2]], t.c2, 0.12);
      var mesa = B.X([0, 54])[1], hz = pol([[-w * 0.05, mesa], [w * 1.05, mesa], [w * 1.05, h], [-w * 0.05, h]], t.c3);
      for (i = 0; i < 7; i++) { var x0 = r() * w, x1 = x0 + w * (0.06 + r() * 0.12); hz += pol([[x0, mesa], [x1, mesa], [(x0 + x1) / 2 + (r() - 0.5) * w * 0.1, h]], i % 2 ? t.ac : t.c2, i % 2 ? 0.3 : 0.16); }
      var bw = B.X([18, 62]); hz += '<ellipse cx="' + f(bw[0]) + '" cy="' + f(mesa + h * 0.02) + '" rx="' + f(B.k * 9) + '" ry="' + f(B.k * 3.4) + '" fill="' + t.ac + '"/>';
      var pan = B.X([-22, 58]); hz += '<ellipse cx="' + f(pan[0]) + '" cy="' + f(mesa + h * 0.03) + '" rx="' + f(B.k * 7) + '" ry="' + f(B.k * 3.6) + '" fill="' + t.c2 + '"/>';
      var conf = '';
      for (i = 0; i < 14; i++) conf += '<g class="vpa-cf" style="--i:' + (i % 5) + '">' + circ(wx + w * 0.12 + (izq ? 1 : -1) * r() * w * 0.4, h * (0.15 + r() * 0.5), w / 300, t.ink, 0.5) + '</g>';
      return { fondo: fondo, sol: sol, conf: conf, hz: hz };
    },
    /* Tatuaje de marinero: sol de rayos, golondrinas y estrellas. */
    flash: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, c = B.X(B.J.n), sol = '', i, L = B.M.linea, sw = ' stroke="' + L + '" stroke-width="' + f(w / 160) + '" stroke-linejoin="round"';
      var fondo = rect(0, 0, w, h, B.osc ? t.bg : mix(t.bg, t.c2, 0.2));
      for (i = 0; i < 18; i++) { var q0 = i / 18 * 6.283, q1 = q0 + 6.283 / 36, R0 = Math.max(w, h); sol += pol([[c[0], c[1]], [c[0] + Math.cos(q0) * R0, c[1] + Math.sin(q0) * R0], [c[0] + Math.cos(q1) * R0, c[1] + Math.sin(q1) * R0]], i % 2 ? t.c2 : t.ac, i % 2 ? 0.25 : 0.45); }
      [[0.16, 0.16, 1], [0.84, 0.2, -1]].forEach(function (g) {
        var x = w * g[0], y = h * g[1], s = w * 0.07 * g[2];
        sol += pol([[x - s, y], [x - s * 0.2, y - s * 0.25], [x + s * 0.4, y - s * 0.9], [x + s * 0.3, y - s * 0.1], [x + s, y + s * 0.1], [x + s * 0.2, y + s * 0.3], [x - s * 0.2, y + s * 0.9]], t.c3, null, sw);
        sol += pol([[x - s, y], [x - s * 0.2, y - s * 0.25], [x - s * 0.2, y + s * 0.3]], t.ac, null, sw);
      });
      for (i = 0; i < 6; i++) sol += estrella(r() * w, r() * h * 0.6, w * (0.02 + r() * 0.02), 5, t.c2, 0.9, -1.57);
      return { fondo: fondo, sol: sol, conf: confeti(B, 8, [t.ac, t.c2]), hz: '' };
    },
    /* Art nouveau: aureola de mosaico detrás de la cabeza y un arco que enmarca. */
    aureola: function (B) {
      var t = B.t, w = B.w, h = B.h, c = B.X(B.J.h), rr = B.k * 24, sol = '', i, m = w * 0.05;
      var fondo = rect(0, 0, w, h, t.bg) + rect(0, 0, w, h, t.c2, B.osc ? 0.05 : 0.2);
      sol += circ(c[0], c[1], rr * 1.18, t.ac, 0.3) + circ(c[0], c[1], rr, t.c2, B.osc ? 0.85 : 0.95);
      for (i = 0; i < 16; i++) { var q0 = i / 16 * 6.283, q1 = q0 + 6.283 / 32; sol += pol([[c[0], c[1]], [c[0] + Math.cos(q0) * rr, c[1] + Math.sin(q0) * rr], [c[0] + Math.cos(q1) * rr, c[1] + Math.sin(q1) * rr]], t.ac, 0.25); }
      for (i = 0; i < 24; i++) { var q = i / 24 * 6.283; sol += circ(c[0] + Math.cos(q) * rr * 1.09, c[1] + Math.sin(q) * rr * 1.09, w / 110, t.ac); }
      sol += '<path d="M' + f(m) + ' ' + f(h) + 'V' + f(w * 0.5) + 'A' + f(w / 2 - m) + ' ' + f(w / 2 - m) + ' 0 0 1 ' + f(w - m) + ' ' + f(w * 0.5) + 'V' + f(h) + '" fill="none" stroke="' + t.ac + '" stroke-width="' + f(w / 90) + '"/>';
      var hz = rect(0, h * 0.9, w, h * 0.1, mix(t.c3, t.bg, 0.2));
      for (i = 0; i < 9; i++) hz += circ(w * (i + 0.5) / 9, h * 0.95, w / 36, t.ac, 0.85) + circ(w * (i + 0.5) / 9, h * 0.95, w / 90, t.c2);
      return { fondo: fondo, sol: sol, conf: confeti(B, 10, [t.ac, t.c2]), hz: hz };
    },
    /* La ofrenda: rayos desde el horizonte y una roca que avanza sobre el vacío. */
    amanecer: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), hzY = h * 0.78, sx = w * (B.flip ? 0.66 : 0.34), sol = '', i;
      var fondo = grad(id, mix(t.bg, t.ac, B.osc ? 0.25 : 0.2), t.bg, true) + rect(0, 0, w, h, 'url(#' + id + ')');
      for (i = 0; i < 22; i++) { var q0 = Math.PI + i / 22 * Math.PI, q1 = q0 + Math.PI / 44, R0 = Math.max(w, h) * 1.2; sol += pol([[sx, hzY], [sx + Math.cos(q0) * R0, hzY + Math.sin(q0) * R0], [sx + Math.cos(q1) * R0, hzY + Math.sin(q1) * R0]], i % 2 ? t.c2 : t.ac, i % 2 ? 0.16 : 0.3); }
      sol += circ(sx, hzY, Math.min(w, h) * 0.22, t.ac);
      var hz = rect(0, hzY, w, h - hzY, mix(t.c3, '#000', 0.25)), pie = B.pie, fx = B.cxp, dir = B.flip ? -1 : 1, tip = fx + dir * B.k * 18;
      hz += pol([[B.flip ? w * 1.05 : -w * 0.05, h], [B.flip ? w * 1.05 : -w * 0.05, pie - h * 0.02], [fx - dir * B.k * 10, pie - h * 0.005], [tip, pie + h * 0.01], [tip - dir * B.k * 4, pie + h * 0.08], [fx - dir * w * 0.1, h]], mix(t.c3, '#000', 0.45));
      hz += pol([[fx - dir * B.k * 10, pie - h * 0.005], [tip, pie + h * 0.01], [tip - dir * B.k * 4, pie + h * 0.08]], t.c3);
      for (i = 0; i < 4; i++) { var x0 = r() * w; hz += pol([[x0 - w * 0.2, hzY + 1], [x0, hzY - h * (0.03 + r() * 0.05)], [x0 + w * 0.22, hzY + 1]], mix(t.c3, t.bg, 0.35), 0.8); }
      return { fondo: fondo, sol: sol, conf: confeti(B, 6, [t.c2]), hz: hz };
    },
    /* Cine negro: persiana de luz en diagonal y un diafragma enorme detrás. */
    noir: function (B) {
      var t = B.t, w = B.w, h = B.h, c = B.X([0, 12]), rr = Math.min(w, h) * 0.42, sol = '', i;
      var fondo = rect(0, 0, w, h, B.osc ? mix(t.bg, '#000', 0.3) : mix(t.bg, t.ink, 0.12));
      for (i = 0; i < 8; i++) { var y = -h * 0.2 + i * h * 0.16; sol += pol([[0, y], [w, y - h * 0.18], [w, y - h * 0.18 + h * 0.06], [0, y + h * 0.06]], t.c2, B.osc ? 0.12 : 0.25); }
      sol += circ(c[0], c[1], rr, t.ac, 0.38);
      for (i = 0; i < 7; i++) { var q = i / 7 * 6.283; sol += pol([[c[0] + Math.cos(q) * rr * 0.36, c[1] + Math.sin(q) * rr * 0.36], [c[0] + Math.cos(q + 0.9) * rr, c[1] + Math.sin(q + 0.9) * rr], [c[0] + Math.cos(q + 1.6) * rr * 0.6, c[1] + Math.sin(q + 1.6) * rr * 0.6]], B.M.linea, 0.35); }
      var hz = pol([[B.cxp - B.k * 14, B.pie], [B.cxp + B.k * 14, B.pie], [w * (B.flip ? 0 : 1), h], [w * (B.flip ? 0 : 1) - (B.flip ? -1 : 1) * w * 0.4, h]], mix(t.bg, '#000', 0.5), 0.55);
      return { fondo: fondo, sol: sol, conf: '', hz: hz };
    },
    /* Retrato sobre fondo negro, con una luz que apenas toca la cabeza. */
    negro: function (B) {
      var t = B.t, w = B.w, h = B.h, id = uid(B), c = B.X(B.J.h);
      var fondo = rect(0, 0, w, h, B.osc ? mix(t.bg, '#000', 0.35) : mix(t.c3, '#000', 0.55)) +
        '<defs><radialGradient id="' + id + '"><stop offset="0" stop-color="' + t.c2 + '" stop-opacity=".22"/><stop offset="1" stop-color="' + t.c2 + '" stop-opacity="0"/></radialGradient></defs>' + circ(c[0], c[1], Math.max(w, h) * 0.55, 'url(#' + id + ')');
      return { fondo: fondo, sol: '', conf: '', hz: '' };
    },
    /* La creación: nubes detrás del brazo que llega y la chispa entre los dedos. */
    cielo: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, sol = '', i, d = B.X([B.flip ? -38 : 38, 18]), g = B.X([0, 29]);
      var fondo = rect(0, 0, w, h, t.bg) + rect(0, 0, w, h, t.c2, B.osc ? 0.06 : 0.22);
      var manto = B.X([B.flip ? -66 : 66, 16]);
      sol += '<ellipse cx="' + f(manto[0]) + '" cy="' + f(manto[1]) + '" rx="' + f(w * 0.42) + '" ry="' + f(h * 0.16) + '" transform="rotate(' + (B.flip ? 14 : -14) + ' ' + f(manto[0]) + ' ' + f(manto[1]) + ')" fill="' + t.ac + '" fill-opacity=".55"/>';
      for (i = 0; i < 11; i++) sol += circ(d[0] + (r() - 0.2) * w * 0.45 * (B.flip ? -1 : 1), d[1] + (r() - 0.55) * h * 0.22, w * (0.1 + r() * 0.1), i % 2 ? mix(t.c2, t.c3, 0.18) : mix(t.c2, '#FFFFFF', 0.25), 0.9);
      if (i % 3 === 0) sol += circ(d[0] + (r() - 0.2) * w * 0.45 * (B.flip ? -1 : 1), d[1] + (r() - 0.5) * h * 0.2, w * (0.06 + r() * 0.05), t.ac, 0.22);
      var hz = pol([[B.flip ? w : 0, h * 0.62], [w * (B.flip ? 0.55 : 0.45), h * 0.8], [w * (B.flip ? 0.4 : 0.6), h], [B.flip ? w : 0, h]], mix(t.c3, t.bg, 0.2));
      return { fondo: fondo, sol: sol, conf: estrella(g[0], g[1], w * 0.03, 4, t.ac, 1, 0.78), hz: hz };
    },
    /* El vapor: piedras calientes apiladas a un lado y volutas que suben. */
    vapor: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), sol = '', conf = '', i, x = w * (B.flip ? 0.16 : 0.84);
      var fondo = grad(id, mix(t.bg, t.ac, B.osc ? 0.22 : 0.18), t.bg, true) + rect(0, 0, w, h, 'url(#' + id + ')');
      sol += circ(w / 2, h * 0.32, Math.min(w, h) * 0.42, t.c2, B.osc ? 0.16 : 0.35);
      for (i = 0; i < 4; i++) sol += '<ellipse cx="' + f(x) + '" cy="' + f(h * (0.9 - i * 0.05)) + '" rx="' + f(w * (0.12 - i * 0.022)) + '" ry="' + f(h * 0.028) + '" fill="' + (i % 2 ? t.c3 : mix(t.c3, '#000', 0.3)) + '"/>';
      for (i = 0; i < 5; i++) { var x0 = w * (0.1 + i * 0.2) + (r() - 0.5) * w * 0.06, y0 = h * (0.5 + r() * 0.2); conf += '<g class="vpa-cf" style="--i:' + i + '"><path d="M' + f(x0) + ' ' + f(y0) + 'c' + f(w * 0.05) + ' ' + f(-h * 0.05) + ' ' + f(-w * 0.05) + ' ' + f(-h * 0.1) + ' 0 ' + f(-h * 0.16) + 's' + f(-w * 0.05) + ' ' + f(-h * 0.1) + ' 0 ' + f(-h * 0.16) + '" fill="none" stroke="' + (B.osc ? t.ink : t.bg) + '" stroke-opacity=".35" stroke-width="' + f(w / 120) + '" stroke-linecap="round"/></g>'; }
      return { fondo: fondo, sol: sol, conf: conf, hz: '' };
    },
    /* Recortes de papel: paneles de color y algas recortadas alrededor. */
    recortes: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, sol = '', conf = '', i;
      var fondo = rect(0, 0, w, h, B.osc ? t.bg : mix(t.bg, t.c2, 0.3));
      sol += rect(w * 0.18, h * 0.08, w * 0.64, h * 0.74, t.ac) + rect(w * 0.1, h * 0.52, w * 0.3, h * 0.36, t.c2, 0.9);
      for (i = 0; i < 9; i++) {
        var x = (i % 2 ? w * 0.86 : w * 0.12) + (r() - 0.5) * w * 0.14, y = h * (0.1 + i * 0.09), s = w * (0.05 + r() * 0.04), pts = [];
        for (var k = 0; k < 11; k++) { var u = k / 10, side = Math.sin(u * Math.PI) * s * (0.5 + 0.5 * Math.sin(u * 9)); pts.push([x + side, y + (u - 0.5) * s * 3]); }
        for (k = 10; k >= 0; k--) { var u2 = k / 10, side2 = Math.sin(u2 * Math.PI) * s * (0.5 + 0.5 * Math.cos(u2 * 8)); pts.push([x - side2, y + (u2 - 0.5) * s * 3]); }
        conf += '<g class="vpa-cf" style="--i:' + (i % 5) + '">' + pol(pts, [t.c3, B.osc ? t.ink : t.bg, t.c2][i % 3], 0.95) + '</g>';
      }
      return { fondo: fondo, sol: sol, conf: conf, hz: rect(0, B.pie - B.k * 0.4, w, h, t.c3) };
    },
    /* Almuerzo en las alturas: la viga en el aire y la ciudad muy abajo. */
    ciudad: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), sol = '', i, viga = B.X([0, 62])[1];
      var fondo = grad(id, mix(t.bg, t.c2, B.osc ? 0.12 : 0.35), t.bg, true) + rect(0, 0, w, h, 'url(#' + id + ')');
      sol += circ(w * (B.flip ? 0.25 : 0.75), h * 0.22, Math.min(w, h) * 0.16, t.c2, 0.45);
      var x = 0;
      while (x < w) { var bw = w * (0.04 + r() * 0.06), bh = h * (0.08 + r() * 0.2); sol += rect(x, h - bh, bw - 2, bh, mix(t.c3, t.bg, 0.25 + r() * 0.3)); for (var wy = h - bh + 6; wy < h - 4; wy += h * 0.025) sol += rect(x + bw * 0.25, wy, bw * 0.15, h * 0.01, t.c2, 0.35); x += bw; }
      var bh2 = B.k * 6;
      sol += rect(-2, viga, w + 4, bh2, B.M.acc[1]) + rect(-2, viga, w + 4, bh2 * 0.22, B.M.acc[0]) + rect(-2, viga + bh2 * 0.78, w + 4, bh2 * 0.22, B.M.acc[2]);
      for (i = 0; i < 18; i++) sol += circ(i * w / 17, viga + bh2 * 0.5, bh2 * 0.09, B.M.acc[2]);
      return { fondo: fondo, sol: sol, conf: confeti(B, 8, [t.c2, t.ac], h * 0.5), hz: '' };
    },
    /* Cartel de los años 40: panel plano de color con un filete y rayas suaves. */
    propaganda: function (B) {
      var t = B.t, w = B.w, h = B.h, m = w * 0.05, sol = '', i;
      var fondo = rect(0, 0, w, h, t.bg) + rect(m, m, w - m * 2, h - m, t.ac);
      for (i = 0; i < 16; i++) sol += pol([[m + i * w * 0.12, m], [m + i * w * 0.12 + w * 0.05, m], [m + i * w * 0.12 - w * 0.25, h], [m + i * w * 0.12 - w * 0.3, h]], t.c2, 0.1);
      sol += '<rect x="' + f(m) + '" y="' + f(m) + '" width="' + f(w - m * 2) + '" height="' + f(h) + '" fill="none" stroke="' + B.M.linea + '" stroke-width="' + f(w / 70) + '"/>';
      return { fondo: fondo, sol: sol, conf: '', hz: '' };
    },
    /* Art déco: abanico de rayos desde la ampolleta y un pedestal escalonado. */
    deco: function (B) {
      var t = B.t, w = B.w, h = B.h, c = B.X([B.J.wR[0], B.J.wR[1] - 6]), sol = '', i, R0 = Math.max(w, h) * 1.3;
      var fondo = rect(0, 0, w, h, t.bg);
      for (i = 0; i < 36; i++) { var q0 = i / 36 * 6.283, q1 = q0 + 6.283 / 72; sol += pol([[c[0], c[1]], [c[0] + Math.cos(q0) * R0, c[1] + Math.sin(q0) * R0], [c[0] + Math.cos(q1) * R0, c[1] + Math.sin(q1) * R0]], i % 2 ? t.c2 : t.ac, i % 2 ? 0.12 : 0.3); }
      for (i = 1; i <= 4; i++) sol += circ(c[0], c[1], B.k * (9 + i * 7), 'none', null, ' stroke="' + t.c2 + '" stroke-opacity="' + (0.6 - i * 0.1) + '" stroke-width="' + f(w / 200) + '"');
      sol += circ(c[0], c[1], B.k * 9, t.c2, 0.4);
      var hz = '', y = B.pie;
      for (i = 0; i < 4; i++) hz += rect(B.cxp - B.k * (16 + i * 10), y + i * h * 0.03, B.k * (32 + i * 20), h * 0.03 + 1, [t.bg2, t.c3, t.ac, mix(t.c3, '#000', 0.3)][i]);
      hz += rect(0, y + h * 0.12, w, h, mix(t.c3, '#000', 0.45));
      return { fondo: fondo, sol: sol, conf: '', hz: hz };
    },
    /* La gran ola: la cresta que se curva con sus garras de espuma y un cerro chico al fondo. */
    ola: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, sol = '', i, s = B.flip ? -1 : 1, ox = B.flip ? w : 0;
      function X(u) { return ox + s * u; }
      var agua = luz(t.c3) < 0.5 ? t.c3 : mix(t.c3, '#000', 0.5), espuma = B.osc ? t.ink : t.bg;
      var fondo = rect(0, 0, w, h, B.osc ? t.bg : mix(t.bg, t.c2, 0.25));
      sol += pol([[X(w * 0.42), h * 0.8], [X(w * 0.5), h * 0.7], [X(w * 0.58), h * 0.8]], t.c2) + pol([[X(w * 0.475), h * 0.725], [X(w * 0.5), h * 0.7], [X(w * 0.525), h * 0.725]], espuma);
      // la ola en coordenadas 0..1 (u a lo ancho, v a lo alto): cuerpo que sube, cresta que se curva y cae
      function bz(p0, p1, p2, p3, n) { var out = []; for (var q = 0; q <= n; q++) { var u = q / n, a1 = (1 - u) * (1 - u) * (1 - u), b1 = 3 * (1 - u) * (1 - u) * u, c1 = 3 * (1 - u) * u * u, d1 = u * u * u; out.push([a1 * p0[0] + b1 * p1[0] + c1 * p2[0] + d1 * p3[0], a1 * p0[1] + b1 * p1[1] + c1 * p2[1] + d1 * p3[1]]); } return out; }
      function P2(q) { return [X(q[0] * w), q[1] * h]; }
      var lomo = bz([1.05, 0.5], [1.0, 0.16], [0.8, 0.04], [0.6, 0.09], 14), cresta = bz([0.6, 0.09], [0.44, 0.13], [0.36, 0.27], [0.42, 0.35], 12);
      var gancho = bz([0.42, 0.35], [0.47, 0.42], [0.57, 0.39], [0.56, 0.31], 8), cara = bz([0.56, 0.31], [0.62, 0.45], [0.5, 0.6], [0.38, 0.7], 10);
      var cuerpo = [[1.05, 1.0]].concat(lomo, cresta, gancho, cara, [[0.3, 1.0]]).map(P2);
      sol += pol(cuerpo, agua);
      var banda = bz([1.05, 0.62], [0.98, 0.3], [0.82, 0.18], [0.66, 0.2], 12).concat(bz([0.66, 0.2], [0.6, 0.3], [0.62, 0.42], [0.56, 0.55], 8), [[0.6, 1.0], [1.05, 1.0]]).map(P2);
      sol += pol(banda, mix(agua, espuma, 0.22), 0.9);
      for (i = 0; i < 3; i++) { var vv = 0.42 + i * 0.13; sol += '<path d="M' + f(X(w * (0.66 + i * 0.03))) + ' ' + f(h * vv) + 'q' + f(s * w * 0.08) + ' ' + f(-h * 0.05) + ' ' + f(s * w * 0.18) + ' ' + f(h * 0.01) + '" fill="none" stroke="' + espuma + '" stroke-opacity=".45" stroke-width="' + f(w / 150) + '" stroke-linecap="round"/>'; }
      var borde = lomo.slice(8).concat(cresta, gancho.slice(0, 5));
      for (i = 0; i < borde.length - 1; i++) {   // las garras de espuma
        var a0 = P2(borde[i]), a1 = P2(borde[i + 1]), dx = a1[0] - a0[0], dy = a1[1] - a0[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l;
        sol += pol([a0, a1, [a1[0] + nx * w * 0.035 - dx * 0.4, a1[1] + ny * w * 0.035 - dy * 0.4]], espuma) + circ(a1[0] + nx * w * 0.045, a1[1] + ny * w * 0.045, w * 0.009, espuma);
      }
      var hz = '';
      for (i = 0; i < 3; i++) { var y0 = h * (0.86 + i * 0.05), d = 'M0 ' + f(h) + 'V' + f(y0); for (var k = 0; k <= 12; k++) d += 'Q' + f(w * (k + 0.5) / 12) + ' ' + f(y0 - h * 0.03) + ' ' + f(w * (k + 1) / 12) + ' ' + f(y0); hz += '<path class="vpa-hz" style="--i:' + i + '" d="' + d + 'V' + f(h) + 'Z" fill="' + [mix(agua, espuma, 0.3), agua, mix(agua, '#000', 0.3)][i] + '"/>'; }
      var conf = '';
      for (i = 0; i < 18; i++) conf += '<g class="vpa-cf" style="--i:' + (i % 5) + '">' + circ(X(w * (0.3 + r() * 0.6)), h * (0.05 + r() * 0.3), w / (100 + r() * 120), espuma, 0.9) + '</g>';
      return { fondo: fondo, sol: sol, conf: conf, hz: hz };
    },
    /* El hombre de Vitruvio: círculo y cuadrado a pluma, sobre papel, con la escritura al margen. */
    vitruvio: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, L = B.M.osc ? t.ink : t.ink, c = B.X([0, 50]), rr = B.k * 52, sol = '', i;
      var papel = B.osc ? mix(t.bg, t.c2, 0.08) : mix(t.bg, t.c2, 0.3);
      var fondo = rect(0, 0, w, h, papel);
      for (i = 0; i < 60; i++) fondo += circ(r() * w, r() * h, w * (0.01 + r() * 0.04), t.ac, 0.04);
      var tl = B.X([B.flip ? 49 : -49, -1]);
      sol += circ(c[0], c[1], rr, 'none', null, ' stroke="' + L + '" stroke-opacity=".8" stroke-width="' + f(w / 220) + '"');
      sol += '<rect x="' + f(Math.min(tl[0], B.X([B.flip ? -49 : 49, 0])[0])) + '" y="' + f(tl[1]) + '" width="' + f(B.k * 98) + '" height="' + f(B.k * 99) + '" fill="none" stroke="' + L + '" stroke-opacity=".8" stroke-width="' + f(w / 220) + '"/>';
      sol += lin(c[0], tl[1], c[0], tl[1] + B.k * 99, L, w / 500, 0.35) + lin(c[0] - rr, c[1], c[0] + rr, c[1], L, w / 500, 0.35);
      var conf = '';
      [[0.04, 0.03], [0.04, h / w > 1.3 ? 0.88 : 0.9]].forEach(function (g) {
        for (var fi = 0; fi < 3; fi++) { var y = h * g[1] + fi * h * 0.022, x = w * 0.06, d = 'M' + f(x) + ' ' + f(y); while (x < w * 0.94) { var st = w * (0.008 + r() * 0.01); d += 'q' + f(st / 2) + ' ' + f(-w * 0.008) + ' ' + f(st) + ' 0'; x += st; if (r() < 0.12) { x += w * 0.015; d += 'm' + f(w * 0.015) + ' 0'; } } conf += '<path d="' + d + '" fill="none" stroke="' + L + '" stroke-opacity=".38" stroke-width="' + f(w / 400) + '"/>'; }
      });
      return { fondo: fondo, sol: sol, conf: conf, hz: '' };
    },
    /* Mondrian: la grilla de filetes gruesos y bloques de color; la figura pinta uno. */
    mondrian: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, L = B.M.osc ? t.ink : t.ink, sw = w / 40, sol = '', i;
      var fondo = rect(0, 0, w, h, B.osc ? t.bg : mix(t.bg, '#FFFFFF', 0.4));
      var xs = [0, w * (0.22 + r() * 0.08), w * (0.58 + r() * 0.1), w], ys = [0, h * (0.18 + r() * 0.06), h * (0.46 + r() * 0.08), h * 0.82];
      sol += rect(xs[0], ys[0], xs[1], ys[1], t.ac) + rect(xs[2], ys[1], w - xs[2], ys[2] - ys[1], t.c3) + rect(xs[0], ys[2], xs[1], ys[3] - ys[2], t.c2) + rect(xs[2], ys[0], w - xs[2], ys[1], t.c2, 0.6);
      xs.slice(1, 3).forEach(function (x) { sol += rect(x - sw / 2, 0, sw, ys[3], L); });
      ys.slice(1, 3).forEach(function (y) { sol += rect(0, y - sw / 2, w, sw, L); });
      var hz = rect(0, ys[3], w, h - ys[3], mix(t.c3, t.bg, 0.4)) + rect(0, ys[3] - sw / 2, w, sw, L);
      var bandeja = B.X([B.flip ? -26 : 26, 98]); hz += pol([[bandeja[0] - B.k * 7, bandeja[1] - B.k * 3], [bandeja[0] + B.k * 7, bandeja[1] - B.k * 3], [bandeja[0] + B.k * 5, bandeja[1]], [bandeja[0] - B.k * 5, bandeja[1]]], t.ac);
      return { fondo: fondo, sol: sol, conf: '', hz: hz };
    },
    /* El pensador: una pizarra con geometría a tiza detrás y el bloque donde está sentado. */
    pizarra: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, sol = '', i, tiza = B.osc ? t.ink : mix(t.bg, '#FFFFFF', 0.6), m = w * 0.06;
      var pz = B.osc ? mix(t.bg2, t.c3, 0.35) : mix(t.c3, '#000', 0.4);
      var fondo = rect(0, 0, w, h, t.bg) + rect(m, m, w - m * 2, h * 0.7, pz) + '<rect x="' + f(m) + '" y="' + f(m) + '" width="' + f(w - m * 2) + '" height="' + f(h * 0.7) + '" fill="none" stroke="' + t.ac + '" stroke-width="' + f(w / 50) + '"/>';
      var so = ' fill="none" stroke="' + tiza + '" stroke-opacity=".55" stroke-width="' + f(w / 260) + '" stroke-linecap="round"';
      sol += '<circle cx="' + f(w * 0.24) + '" cy="' + f(h * 0.22) + '" r="' + f(w * 0.1) + '"' + so + '/>';
      sol += '<path d="M' + f(w * 0.62) + ' ' + f(h * 0.34) + 'L' + f(w * 0.84) + ' ' + f(h * 0.34) + 'L' + f(w * 0.62) + ' ' + f(h * 0.14) + 'Z"' + so + '/>';
      sol += '<path d="M' + f(w * 0.14) + ' ' + f(h * 0.6) + 'Q' + f(w * 0.3) + ' ' + f(h * 0.4) + ' ' + f(w * 0.46) + ' ' + f(h * 0.58) + '"' + so + ' stroke-dasharray="' + f(w / 60) + ' ' + f(w / 80) + '"/>';
      for (i = 0; i < 4; i++) { var y = h * (0.44 + i * 0.05), x = w * 0.62, d = 'M' + f(x) + ' ' + f(y); while (x < w * 0.86) { var st = w * 0.012; d += 'q' + f(st / 2) + ' ' + f(-w * 0.012) + ' ' + f(st) + ' 0'; x += st + (r() < 0.2 ? w * 0.02 : 0); } sol += '<path d="' + d + '"' + so + '/>'; }
      var blk = B.X([0, 63]), hz = '';
      hz += pol([[blk[0] - B.k * 20, blk[1]], [blk[0] + B.k * 22, blk[1]], [blk[0] + B.k * 22, h], [blk[0] - B.k * 20, h]], B.M.pant[1]);
      hz += pol([[blk[0] - B.k * 20, blk[1]], [blk[0] + B.k * 22, blk[1]], [blk[0] + B.k * 18, blk[1] + B.k * 4], [blk[0] - B.k * 16, blk[1] + B.k * 4]], B.M.pant[0]);
      return { fondo: fondo, sol: sol + hz, conf: '', hz: '' };
    },
    /* Cruce de cebra: árboles redondos al fondo y las franjas en perspectiva. */
    cebra: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, sol = '', i, calle = h * 0.68;
      var fondo = rect(0, 0, w, h, t.bg) + rect(0, 0, w, calle, t.c2, B.osc ? 0.1 : 0.3);
      for (i = 0; i < 9; i++) { var x = w * (i / 8) + (r() - 0.5) * w * 0.06, y = calle - h * (0.08 + r() * 0.05), rr = w * (0.07 + r() * 0.05); sol += rect(x - w * 0.008, y, w * 0.016, calle - y, mix(t.c3, '#000', 0.3)) + circ(x, y - rr * 0.6, rr, i % 2 ? t.c3 : mix(t.c3, t.c2, 0.3), 0.95); }
      var hz = rect(0, calle, w, h - calle, B.osc ? t.bg2 : mix(t.bg, t.ink, 0.25)), franja = B.osc ? t.ink : t.bg;
      for (i = 0; i < 7; i++) { var x0 = -w * 0.05 + i * w * 0.16; hz += pol([[x0 + w * 0.02, calle + h * 0.02], [x0 + w * 0.09, calle + h * 0.02], [x0 + w * 0.11 + (x0 - w / 2) * 0.12, h], [x0 + (x0 - w / 2) * 0.12, h]], franja, 0.85); }
      return { fondo: fondo, sol: sol + hz, conf: '', hz: '' };
    },
    /* La escalinata: el sol que sale detrás y la ciudad chica; la figura arriba con los brazos en V. */
    escalinata: function (B) {
      var t = B.t, w = B.w, h = B.h, r = B.r, id = uid(B), sol = '', i;
      var fondo = grad(id, mix(t.bg, t.ac, B.osc ? 0.3 : 0.25), t.bg, true) + rect(0, 0, w, h, 'url(#' + id + ')');
      sol += circ(B.cxp, B.pie - h * 0.05, Math.min(w, h) * 0.3, t.ac);
      for (i = 0; i < 24; i++) { var q = Math.PI + i / 24 * Math.PI, a0 = Math.min(w, h) * 0.34, a1 = a0 + w * 0.12; sol += lin(B.cxp + Math.cos(q) * a0, B.pie - h * 0.05 + Math.sin(q) * a0, B.cxp + Math.cos(q) * a1, B.pie - h * 0.05 + Math.sin(q) * a1, t.ac, w / 150, 0.55); }
      var x = 0; while (x < w) { var bw = w * (0.04 + r() * 0.05), bh = h * (0.04 + r() * 0.12); sol += rect(x, B.pie - bh, bw - 1, bh, mix(t.c3, t.bg, 0.3)); x += bw; }
      var hz = '', y = B.pie, st = h * 0.055;
      for (i = 0; y < h; i++) { hz += rect(0, y, w, st, i % 2 ? mix(t.c3, '#000', 0.25) : t.c3) + rect(0, y, w, st * 0.18, mix(t.c3, t.ink, 0.35)); y += st; }
      return { fondo: fondo, sol: sol, conf: confeti(B, 14, [t.ac, t.c2, t.ink]), hz: hz };
    }
  };

  W.SOUL_ESCENAS = { elegir: elegir, capas: capas, tipo: tipo, cargar: cargar, TIPOS: TIPOS, ESCENAS: ESCENAS, POR_OFICIO: POR_OFICIO, mix: mix, luz: luz };
})(window);
