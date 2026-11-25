/* SOUL 2 · la marca en miniatura (semilla-compai en pequeño).
   Un catálogo CERRADO de 3 direcciones (par tipográfico libre OFL, autoalojado, + superficies
   validadas por contraste) y las funciones que, con las respuestas del alma, eligen una,
   arman el titular, el manifiesto y el resumen corporativo.
   Todo es función pura de las respuestas: sin red, sin DOM. Por eso se puede probar en node
   (ver soul/probar_marca.mjs). Ejecutar: se carga con <script src="marca.js"> después de datos.js. */
(function (W) {
  'use strict';

  /* ───────── contraste (WCAG 2.x) ───────── */
  function rgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return [0, 0, 0];
    var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function luz(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contraste(a, b) { var x = luz(a), y = luz(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /* ───────── LA REGLA DEL ACENTO (Visu, 23-11-2026) ─────────
     La persona elige el MATIZ (su paleta); la dirección pone la LUZ y la INTENSIDAD. El color nunca se pone tal cual ni se
     oscurece mezclándolo con negro (así salió el café #98502C, rechazado). Se calcula en OKLCH (luz, intensidad, matiz).
       · neutro (intensidad < 0,04): sin color, el acento es la tinta
       · cálido (matiz 35°–115°): sobre fondo claro NO se oscurece; el texto va en tinta y el color vive como relleno (`vivo`) con filete
       · directo: mismo matiz, intensidad de la dirección, y se oscurece/aclara de a poco hasta 4,6:1 en los dos fondos
     Referencia ejecutable: CompAI/Dir. Arte…/2026-11-23-soul-sitio-direccion/_acento.mjs (misma tabla de 33 filas, ver probar_marca.mjs). */
  var A_MIN = 4.6, A_BARRO = [35, 115], A_NEUTRO = 0.04;
  function aRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); }
  function aLin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function aGam(v) { return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }
  function aOklab(h) {
    var c = aRgb(h).map(aLin), r = c[0], g = c[1], b = c[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function aDeOklab(x) {
    var L = x[0], a = x[1], b = x[2];
    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  function aLch(h) { var x = aOklab(h); return [x[0], Math.hypot(x[1], x[2]), (Math.atan2(x[2], x[1]) * 180 / Math.PI + 360) % 360]; }
  function aEnGama(c) { return c.every(function (v) { return v >= -0.0005 && v <= 1.0005; }); }
  function aHex(c) { return '#' + c.map(function (v) { var n = Math.round(Math.max(0, Math.min(1, aGam(Math.max(0, v)))) * 255); return (n < 16 ? '0' : '') + n.toString(16); }).join('').toUpperCase(); }
  /* OKLCH → hex; si el color no existe en pantalla se le baja la intensidad (nunca el matiz ni la luz). */
  function aDeLch(L, C, h) {
    var f = function (c) { return aDeOklab([L, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180)]); };
    if (aEnGama(f(C))) return aHex(f(C));
    var lo = 0, hi = C, i; for (i = 0; i < 24; i++) { var m = (lo + hi) / 2; if (aEnGama(f(m))) lo = m; else hi = m; }
    return aHex(f(lo));
  }
  function aLuz(h) { var c = aRgb(h).map(aLin); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function aContraste(a, b) { var x = aLuz(a), y = aLuz(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function aMezcla(a, b, t) { var A = aOklab(a), B = aOklab(b); return aHex(aDeOklab(A.map(function (v, i) { return v + (B[i] - v) * t; }))); }
  function aCl(v, r) { return Math.max(r[0], Math.min(r[1], v)); }
  /* el texto encima de un relleno: la tinta oscura o la clara de la dirección */
  function aSobre(f, d) { return aContraste(d.osc.bg, f) >= aContraste(d.cla.bg, f) ? d.osc.bg : d.cla.bg; }
  /* el acento de texto: la luz más cercana a la pedida que da 4,6:1 en los dos fondos */
  function aTexto(L0, C, h, fondos, haciaOscuro) {
    for (var i = 0; i <= 200; i++) {
      var L = haciaOscuro ? L0 - i * 0.004 : L0 + i * 0.004; if (L < 0.05 || L > 0.98) break;
      var x = aDeLch(L, C, h); if (fondos.every(function (f) { return aContraste(x, f) >= A_MIN; })) return x;
    }
    return null;
  }
  /* Lo ya aprobado por Sebastián no lo recalcula la fórmula (muestra de Waldo, 02-11-2026): clave «dirección|color elegido». */
  var FIJOS = { 'obra|#2F6FA8': { ac: '#2B669B', acO: '#729DC4' } };
  function acento(c0, d, fijo) {
    var lch = aLch(c0), L0 = lch[0], C0 = lch[1], h = lch[2], neutro = C0 < A_NEUTRO, barro = !neutro && h >= A_BARRO[0] && h <= A_BARRO[1];
    var C = aCl(C0, d.C), o = { matiz: Math.round(h), caso: neutro ? 'neutro' : barro ? 'cálido' : 'directo' };
    o.acO = neutro ? d.osc.ink : aTexto(Math.max(L0, 0.6), C, h, [d.osc.bg, d.osc.bg2], false);
    if (fijo && fijo.acO) o.acO = fijo.acO;
    o.onO = aSobre(o.acO, d);
    if (neutro) { o.ac = d.cla.ink; o.vivo = d.cla.ink; }
    else if (barro) { o.ac = d.cla.ink; var Lv = aCl(L0, d.vL); do { o.vivo = aDeLch(Lv, aCl(C0, d.vC), h); Lv += 0.004; } while (aContraste(aSobre(o.vivo, d), o.vivo) < A_MIN && Lv < 0.95); }
    else { o.ac = aTexto(Math.min(L0, 0.62), C, h, [d.cla.bg, d.cla.bg2], true); o.vivo = o.ac; }
    if (fijo && fijo.ac) o.ac = o.vivo = fijo.ac;
    o.on = aSobre(o.vivo, d);
    o.borde = aContraste(o.vivo, d.cla.bg) < 3;   // el relleno no se separa solo del fondo: lleva filete de tinta
    var tinte = function (bg, con, mut) { for (var t = 0.16; t > 0; t -= 0.02) { var x = aMezcla(bg, con, t); if (aContraste(mut, x) >= A_MIN) return x; } return bg; };
    // solo se tiñe si el matiz es de la temperatura de la superficie (a 100° o menos): un cálido en un fondo frío da rosado sucio
    var lejos = !neutro && d.temp != null && Math.min(Math.abs(h - d.temp), 360 - Math.abs(h - d.temp)) > 100;
    o.suave = lejos ? d.cla.bg2 : tinte(d.cla.bg2, o.vivo, d.cla.mut); o.suaveO = lejos ? d.osc.bg2 : tinte(d.osc.bg2, o.acO, d.osc.mut);
    return o;
  }
  var CACHE_A = {};
  function acentoDe(c0, d) {
    c0 = /^#[0-9a-f]{6}$/i.test(c0 || '') ? c0.toUpperCase() : '#E8789A';
    var k = d.id + '|' + c0; return CACHE_A[k] || (CACHE_A[k] = acento(c0, d, FIJOS[k]));
  }
  /* Color de texto (negro o blanco) con más contraste sobre un fondo. */
  function sobre(h) { return contraste(h, '#080A09') >= contraste(h, '#FFFFFF') ? '#080A09' : '#FFFFFF'; }

  /* ───────── EL SELLO (Visu, DIRECCION.md §3) ─────────
     Función pura: iniciales + oficio + dirección → SVG. Lienzo del bloque 100×100; lienzo del sello 200×200 con el bloque
     al centro a 74 %. Dos versiones: «color» (tinta + acento) y «tinta» (una sola tinta, letras, filete y gesto calados).
     Las letras son <text> con la letra de la dirección: el SVG se pinta dentro del sitio (donde las fuentes ya cargaron). */
  var C_CAST = '<circle cx="74" cy="-5" r="12"/><circle cx="90" cy="2" r="12"/><circle cx="102" cy="15" r="12"/><circle cx="106" cy="31" r="10"/>';
  /* El gesto: un solo recorte en la esquina superior derecha, según el oficio. «castor» es el juego propio de Waldo (apellido). */
  var GESTOS = {
    escuadra: { nombre: 'una escuadra', svg: '<path d="M78 0h22v22h-22z"/>' },
    cola: { nombre: 'una cola de milano', svg: '<path d="M70 0h30v24h-22l-8-12z"/>' },
    rayo: { nombre: 'un rayo', svg: '<path d="M72 0h28v34l-12-14 6-2z"/>' },
    almena: { nombre: 'una almena, el diente de un engranaje', svg: '<path d="M64 0h10v10h-10zM84 0h10v10h-10zM90 16h10v10h-10z"/>' },
    chaflan: { nombre: 'un chaflán, el corte de una tijera', svg: '<path d="M72 0h28v28z"/>' },
    mordisco: { nombre: 'un mordisco', svg: '<circle cx="100" cy="0" r="24"/>' },
    onda: { nombre: 'una onda', svg: '<circle cx="86" cy="0" r="12"/><circle cx="100" cy="20" r="12"/>' },
    arco: { nombre: 'un arco', svg: '<path d="M100 0v30a30 30 0 0 1-30-30z"/>' },
    castor: { nombre: 'una mordida de cuatro círculos', svg: C_CAST }
  };
  var GESTO_OFICIO = { 'Maestro chasquilla': 'escuadra', 'Gasfitería': 'escuadra', 'Pintura de casas': 'escuadra', 'Herrería y soldadura': 'escuadra', 'Otro oficio': 'escuadra',
    'Carpintería': 'cola', 'Electricidad': 'rayo', 'Mecánica': 'almena',
    'Peluquería y barbería': 'chaflan', 'Costura y diseño': 'chaflan', 'Tatuaje': 'chaflan', 'Fotografía': 'chaflan', 'Clases particulares': 'chaflan',
    'Cocina': 'mordisco', 'Panadería / pastelería': 'mordisco', 'Cuidado de mascotas': 'mordisco',
    'Animación y ceremonias': 'onda', 'Música en vivo': 'onda',
    'Jardinería': 'arco', 'Belleza y maquillaje': 'arco', 'Masoterapia': 'arco', 'Cerámica': 'arco' };
  function selloGesto(label) { return GESTO_OFICIO.hasOwnProperty(label) ? GESTO_OFICIO[label] : 'escuadra'; }
  var VETA = '<path d="M-2 9C30 9 48 11 70 10"/><path d="M-2 17C26 16 44 19 64 18S80 19 86 22"/><path d="M-2 25C28 24 52 27 102 25"/><ellipse cx="27" cy="90" rx="7" ry="3"/><path d="M-2 83C12 83 17 85.5 27 85.5C38 85.5 44 82 102 83"/><path d="M-2 90C8 90 12 94 27 94C40 94 46 90 102 91"/><path d="M-2 97C30 98 60 97 102 98"/>';
  function texturaBloque(dirId, madera) {
    var k, o = '';
    if (dirId === 'taller') { for (k = 0; k < 34; k++) o += '<circle cx="' + ((k * 37 + 11) % 97 + 2) + '" cy="' + ((k * 53 + 7) % 95 + 3) + '" r="' + (k % 3 ? 1 : 1.5) + '" fill="currentColor" stroke="none"/>'; return o; }
    if (dirId === 'escenario') { for (k = 0; k <= 8; k++) o += '<path d="M50 -4L' + (k * 12.5) + ' 104"/>'; return o; }
    if (madera) return VETA;
    for (k = 1; k < 10; k++) o += '<path d="M' + k * 10 + ' 0V100M0 ' + k * 10 + 'H100"/>';
    return o;
  }
  function mezRgb(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function escSvg(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function f1(n) { return String(Math.round(n * 100) / 100); }
  /* El texto de un arco: hasta 16 letras normal; de 17 a 20 cuerpo 14 y paso 9°; más, no cabe. */
  function arcoTam(t) { return t.length <= 16 ? { cuerpo: 17, paso: 11.25 } : t.length <= 20 ? { cuerpo: 14, paso: 9 } : null; }
  function cabe(t, mx) {
    t = limpio(t).toUpperCase(); if (t.length <= 20) return t;
    var p = t.split(' '), o = ''; for (var i = 0; i < p.length && (o + ' ' + p[i]).trim().length <= (mx || 16); i++) o = (o + ' ' + p[i]).trim();
    return o || t.slice(0, 16);
  }
  /* Letras del anillo. arriba: se lee de izquierda a derecha por la mitad superior (base en r 71); abajo: también de izquierda a derecha,
     por la inferior, con letras derechas (base en r 83). Un carácter cada `paso` grados, centrado. */
  function anilloTexto(arriba, abajo, mono) {
    var o = '', st = function (t, sup) {
      var z = arcoTam(t); if (!z) return '';
      var n = t.length, s = '', i, ang;
      for (i = 0; i < n; i++) {
        if (t.charAt(i) === ' ') continue;
        ang = sup ? (i - (n - 1) / 2) * z.paso : ((n - 1) / 2 - i) * z.paso;
        s += '<text x="100" y="' + (sup ? 29 : 183) + '" transform="rotate(' + f1(ang) + ' 100 100)" text-anchor="middle" font-size="' + z.cuerpo + '" font-family="' + mono + '">' + escSvg(t.charAt(i)) + '</text>';
      }
      return s;
    };
    return st(arriba, true) + st(abajo, false);
  }
  /* El bloque (monograma). `mod` 'color' | 'tinta'. id debe ser único en la página. */
  function bloqueSvg(o, mod, id, chico) {
    var d = o.d, ini = escSvg(o.ini), g = GESTOS[o.gesto] || GESTOS.escuadra, forma, formaMask, filete, fil;
    var disc = d.id === 'escenario', rx = d.id === 'taller' ? 14 : 0;
    forma = function (fill) { return disc ? '<circle cx="50" cy="50" r="50" fill="' + fill + '"/>' : '<rect width="100" height="100"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"/>'; };
    fil = function (fill) {
      return d.id === 'taller' ? '<path d="M14 75h68" fill="none" stroke="' + fill + '" stroke-width="4" stroke-dasharray="6 4"/>' :
        d.id === 'escenario' ? '<rect x="14" y="72" width="68" height="6" fill="' + fill + '"/>' : '<rect x="14" y="73" width="68" height="4" fill="' + fill + '"/>';
    };
    var letras = function (fill) { return '<text x="48" y="64" font-size="41" font-weight="800" letter-spacing="-2" text-anchor="middle" font-family="' + d.display.replace(/"/g, "'") + '" fill="' + fill + '">' + ini + '</text>'; };
    var cab = '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">' + forma('#fff');
    if (mod === 'tinta') {
      // una tinta: el bloque es la tinta; letras, filete y gesto quedan calados (se ve el fondo). El gesto lleva una línea de diente a su alrededor.
      var cp = id + 'c', rec = disc ? '<circle cx="50" cy="50" r="50"/>' : '<rect width="100" height="100"' + (rx ? ' rx="' + rx + '"' : '') + '/>';
      return '<clipPath id="' + cp + '">' + rec + '</clipPath>' + cab +
        '<g clip-path="url(#' + cp + ')"><g fill="none" stroke="#000" stroke-width="9">' + g.svg + '</g><g fill="none" stroke="#fff" stroke-width="5">' + g.svg + '</g></g><g fill="#000">' + g.svg + '</g>' +
        letras('#000') + fil('#000') + '</mask><rect width="100" height="100" fill="' + o.tinta + '" mask="url(#' + id + ')"/>';
    }
    cab += '<g fill="#000">' + g.svg + '</g>';
    return cab + '</mask><g mask="url(#' + id + ')">' + forma(o.tinta) +
      (chico ? '' : '<g fill="none" stroke="' + o.veta + '" stroke-width="1.3" stroke-linecap="round" style="color:' + o.veta + '">' + texturaBloque(d.id, o.madera) + '</g>') +
      '<g fill="none" stroke="' + o.borde + '" stroke-width="5">' + g.svg + '</g></g>' + letras(o.letra) + fil(o.acento);
  }
  /* Todo lo que el sello necesita, sacado de la persona. o = { ini, oficio (texto), oficioLabel, nombre, lema, dir (objeto DIRS), c0 (color elegido), gesto, claro }
     Devuelve { d, ini, arriba, abajo, gesto, tinta, papel, letra, acento, veta, borde, madera, mono }. */
  function selloOpciones(o) {
    var d = o.d, a = acentoDe(o.c0, d), obra = d.id === 'obra', ink = d.cla.ink, osc = d.osc.ink;
    var arr = limpio(o.lema || o.oficio).toUpperCase(), aba = limpio(o.nombre).toUpperCase(), ar = arr, ab = aba;
    if (!arcoTam(ar)) { ar = cabe(aba); ab = ''; }          // el oficio no cabe: el anillo lleva solo el nombre
    else if (!arcoTam(ab)) ab = cabe(aba);
    return { d: d, ini: o.ini, arriba: ar, abajo: ab, gesto: GESTOS.hasOwnProperty(o.gesto) ? o.gesto : selloGesto(o.oficioLabel), tinta: ink, papel: d.cla.bg, letra: osc, acento: a.acO,
      veta: obra ? '#1E3B58' : mezRgb(ink, osc, 0.12), borde: obra ? '#9CB8D0' : mezRgb(ink, osc, 0.62),
      madera: /chasquilla|carpinter/i.test(o.oficioLabel || ''), mono: d.mono.replace(/"/g, "'") };
  }
  /* El sello entero. modo 'color' | 'tinta'; tintaColor: la tinta única (por defecto la de la dirección; sobre fondo oscuro, la clara). */
  function sello(o, modo, tintaColor, id, atrib) {
    var p = selloOpciones(o), d = p.d, k, col = modo === 'tinta' ? (tintaColor || p.tinta) : p.tinta, m = modo === 'tinta' ? col : null;
    id = id || 'sl'; atrib = atrib || ''; if (modo === 'tinta') p.tinta = col;
    var anillo = '';
    if (d.id === 'obra') {
      var gr = '', r1 = 94.5, i2;
      for (k = 0; k < 72; k++) { var an = k * Math.PI / 36, l = k % 6 === 0 ? 6.5 : 3.5; gr += 'M' + f1(100 + r1 * Math.sin(an)) + ' ' + f1(100 - r1 * Math.cos(an)) + 'L' + f1(100 + (r1 - l) * Math.sin(an)) + ' ' + f1(100 - (r1 - l) * Math.cos(an)); }
      anillo = '<path d="' + gr + '" fill="none" stroke="' + col + '" stroke-width="1.4"/>';
    } else if (d.id === 'taller') anillo = '<circle cx="100" cy="100" r="89" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-dasharray="5 4"/>';
    else { anillo = '<g fill="' + col + '">'; for (k = 0; k < 36; k++) anillo += '<circle cx="' + f1(100 + 90.5 * Math.sin(k * Math.PI / 18)) + '" cy="' + f1(100 - 90.5 * Math.cos(k * Math.PI / 18)) + '" r="1.9"/>'; anillo += '</g>'; }
    // los rombos separan el texto de arriba del de abajo (a las 9 y a las 3)
    var rombos = '<path d="M17 100l5-5 5 5-5 5zM173 100l5-5 5 5-5 5z"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"' + (/\swidth=/.test(atrib) ? '' : ' width="200" height="200"') + atrib + '>' +
      (modo === 'tinta' ? '' : '<circle cx="100" cy="100" r="100" fill="' + p.papel + '"/>') +
      '<circle cx="100" cy="100" r="96" fill="none" stroke="' + col + '" stroke-width="3"/>' + anillo +
      '<circle cx="100" cy="100" r="60" fill="none" stroke="' + col + '" stroke-width="1.5"/>' +
      '<g fill="' + col + '" font-weight="400" letter-spacing="0">' + anilloTexto(p.arriba, p.abajo, p.mono) + rombos + '</g>' +
      '<g transform="translate(63 63) scale(.74)">' + bloqueSvg(p, modo === 'tinta' ? 'tinta' : 'color', id, false) + '</g></svg>';
  }
  /* El monograma solo (logo del menú, 44 px; bajo 40 px va sin veta). */
  /* claro = true: el bloque en el papel y las letras en la tinta (para la letra clara sobre una imagen oscura; PORTADA.md §3). */
  function monograma(o, modo, tintaColor, id, atrib, chico, claro) {
    var p = selloOpciones(o); if (modo === 'tinta') p.tinta = tintaColor || p.tinta;
    if (claro && modo !== 'tinta') { var t = p.tinta; p.tinta = p.letra; p.letra = t; p.veta = mezRgb(p.tinta, t, 0.18); p.borde = p.tinta; p.acento = acentoDe(o.c0, p.d).ac; }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"' + (atrib || '') + '>' + bloqueSvg(p, modo === 'tinta' ? 'tinta' : 'color', id || 'mg', !!chico) + '</svg>';
  }
  /* La explicación del sello. Waldo: texto PROPUESTO por Visu (su juego propio, Castor). Los demás: solo piezas que la regla ya define. */
  var TXT_SELLO_WALDO = ['Este es tu sello. Son tus iniciales, WC, en un bloque de madera al que un castor le dio un mordisco en la esquina: Castor es tu apellido y también tu oficio, el que construye y arregla para que dure.',
    'El anillo tiene las rayitas de una huincha de medir, porque tu trabajo se hace a medida. «Hecho a diente» es tu manera de decir «hecho a mano».',
    'Va en tu sitio, en tu foto de WhatsApp, en tu tarjeta y al pie de cada presupuesto.'];
  function selloExplica(o) {
    var d = o.d, g = GESTOS.hasOwnProperty(o.gesto) ? o.gesto : selloGesto(o.oficioLabel);
    if (g === 'castor' && d.id === 'obra' && /^WC$/i.test(o.ini) && /hecho a diente/i.test(o.lema || '')) return TXT_SELLO_WALDO.slice();
    var forma = d.id === 'escenario' ? 'un disco' : d.id === 'taller' ? 'un bloque de esquinas redondeadas' : 'un bloque cuadrado';
    var tex = d.id === 'obra' ? (/chasquilla|carpinter/i.test(o.oficioLabel || '') ? 'con veta de madera' : 'con una grilla fina') : d.id === 'taller' ? 'con grano' : 'con rayos que caen desde arriba';
    var ani = d.id === 'obra' ? 'graduado como una huincha de medir' : d.id === 'taller' ? 'hecho de una línea discontinua, como un timbre a mano' : 'hecho de 36 puntos, como ampolletas';
    return ['Este es tu sello. Son tus iniciales, ' + o.ini + ', en ' + forma + ' ' + tex + '.',
      'En la esquina de arriba a la derecha lleva ' + (GESTOS[g] || GESTOS.escuadra).nombre + ': es el gesto de tu oficio.',
      'El anillo está ' + ani + ', y dice tu ' + (o.lema ? 'lema' : 'oficio') + ' arriba y tu nombre abajo.'];
  }

  /* ───────── el catálogo cerrado ───────── */
  var DIRS = [
    { id: 'escenario', nombre: 'Escenario',
      idea: 'Ruido bueno y foco encima: una marca que se nota desde el fondo de la sala.',
      voz: 'frases cortas, de tú, con ritmo y un guiño',
      display: "'Syne',system-ui,sans-serif", texto: "'Instrument Sans',system-ui,sans-serif", mono: "'JetBrains Mono',ui-monospace,monospace",
      tipos: ['Syne', 'Instrument Sans', 'JetBrains Mono'], mayus: true, trama: 'rayos',
      osc: { bg: '#0B0A0D', bg2: '#1F1A26', ink: '#F4F1EC', mut: '#BDB5C4' },   // negro de sala + terciopelo
      cla: { bg: '#F4F1EC', bg2: '#E4DDEA', ink: '#0B0A0D', mut: '#4C4556' },
      C: [0.13, 0.24], vL: [0.70, 0.86], vC: [0.17, 0.30], temp: null,
      oficios: [0, 3, 5, 8, 9, 15], tono: 2, palabras: /fiesta|bulla|musica|luces|escenario|publico|micro|baile|show|noche/ },
    { id: 'taller', nombre: 'Taller',
      idea: 'Hecho a mano y a la vista: una marca que huele a lo que hace.',
      voz: 'cálida, concreta, con las manos en la masa',
      display: "'Bricolage Grotesque',system-ui,sans-serif", texto: "'Figtree',system-ui,sans-serif", mono: "'IBM Plex Mono',ui-monospace,monospace",
      tipos: ['Bricolage Grotesque', 'Figtree', 'IBM Plex Mono'], mayus: false, trama: 'grano',
      osc: { bg: '#2B1D12', bg2: '#3A2818', ink: '#F7EDDA', mut: '#D3C3A6' },   // madera tostada, no negro
      cla: { bg: '#F2E3C6', bg2: '#E6D2AC', ink: '#2A1C10', mut: '#57432E' },   // papel kraft
      C: [0.07, 0.13], vL: [0.60, 0.72], vC: [0.11, 0.15], temp: 80,
      oficios: [1, 2, 4, 6, 7, 10, 11, 12, 13, 20], tono: 0, palabras: /mano|madera|harina|barro|tierra|casa|fuego|masa|hilo|cocina/ },
    { id: 'obra', nombre: 'Obra',
      idea: 'Prolijo y a la hora: una marca que se gana la confianza con el trabajo bien hecho.',
      voz: 'directa y ordenada, sin vueltas',
      display: "'Archivo',system-ui,sans-serif", texto: "'Instrument Sans',system-ui,sans-serif", mono: "'Space Mono',ui-monospace,monospace",
      tipos: ['Archivo', 'Instrument Sans', 'Space Mono'], mayus: false, trama: 'grilla',
      osc: { bg: '#0B1E30', bg2: '#123049', ink: '#EAF2F8', mut: '#A9BFD1' },   // azul de plano
      cla: { bg: '#EEF2F5', bg2: '#DCE4EB', ink: '#0B1E30', mut: '#3F5263' },
      C: [0.09, 0.16], vL: [0.72, 0.86], vC: [0.15, 0.30], temp: 245,
      oficios: [14, 16, 17, 18, 19], tono: 3, palabras: /puntual|orden|limpio|garantia|prolijo|plazo|medida|exacto|a la hora/ }
  ];

  /* ───────── texto: utilidades ───────── */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function limpio(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function sinPunto(s) { return limpio(s).replace(/[\s.!?…]+$/, ''); }
  function cap(s) { s = sinPunto(s); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function bajo(s) { s = sinPunto(s); return s ? s.charAt(0).toLowerCase() + s.slice(1) : ''; }
  function sinYo(s) { return sinPunto(s).replace(/^yo\s+/i, ''); }

  /* ───────── las frases del alma ───────── */
  /* El nombre que se muestra: el de la marca si la persona lo dio; si no, el de siempre (apodo o nombre).
     El apodo es el trato, no la marca: solo deja de ser la marca por defecto cuando hay marcaNombre. */
  function marcaNombre(ST) { return limpio(ST.marcaNombre) || limpio(ST.apodo) || limpio(ST.name) || 'Tu nombre'; }
  function titular(ST) { var u = cap(sinYo(ST.unico)); return u ? u + '.' : ''; }
  function nunca(ST) {
    var n = sinPunto(ST.nunca); if (!n) return '';
    if (/^(nunca|jamas|jamás|ningun|ningún|ninguna|no)\b/i.test(n)) return cap(n) + '.';
    return 'Nunca ' + bajo(n) + '.';
  }
  function momento(ST) {
    var m = sinPunto(ST.momento); if (!m) return '';
    if (/^cuando\b/i.test(m)) return 'Sé que quedó bien ' + bajo(m) + '.';
    if (/^(en|al|con|despues|después|cuando)\b/i.test(m)) return 'Sé que quedó bien ' + bajo(m) + '.';
    return 'Sé que quedó bien cuando ' + bajo(m) + '.';
  }
  function origen(ST) { var o = cap(ST.origen); return o ? o + '.' : ''; }
  function cierre(ST) { var c = cap(ST.cierre); return c ? c + '.' : ''; }
  /* La cifra solo existe si la persona la dio: nada de números inventados. */
  function cifra(ST, D) {
    var n = limpio(ST.cifraN); if (!/^[+~]?\d[\d.,]*\+?$/.test(n)) return null;
    var u = ST.cifraU === 'Otro' ? limpio(ST.cifraOtro) : limpio(ST.cifraU);
    return { n: n, u: u, texto: (n + (u ? ' ' + u : '')) };
  }
  function oficioTxt(ST, D) {
    if (ST.oficio == null) return 'tu oficio';
    return (D.OFICIOS[ST.oficio].label === 'Otro oficio') ? (limpio(ST.oficioOtro) || 'tu oficio') : D.OFICIOS[ST.oficio].label.toLowerCase();
  }
  function concepto(ST, D) {
    var u = bajo(sinYo(ST.unico));
    return marcaNombre(ST) + ' · ' + oficioTxt(ST, D) + (u ? ': ' + u + '.' : '.');
  }
  /* Las tres frases propias: promesa, límite y la primera que exista de cierre / vara / origen. */
  function tres(ST) {
    var c = [titular(ST), nunca(ST), cierre(ST), momento(ST), origen(ST)].filter(Boolean);
    return c.slice(0, 3);
  }

  /* ───────── elegir una de las 3 direcciones ───────── */
  function elegir(ST, D) {
    var pts = [0, 0, 0];
    DIRS.forEach(function (d, i) { if (ST.oficio != null && d.oficios.indexOf(ST.oficio) >= 0) pts[i] += 3; });
    // el tono que eligió: Divertido → Escenario · Cercano → Taller · Sobrio → Obra · Elegante empuja a Taller y Obra
    DIRS.forEach(function (d, i) { if (d.tono === ST.tone) pts[i] += 2; });
    if (ST.tone === 1) { pts[1] += 1; pts[2] += 1; }
    if (ST.motion === 2) pts[0] += 1;
    var t = norm([ST.unico, ST.nunca, ST.momento, ST.origen, ST.cierre].join(' '));
    DIRS.forEach(function (d, i) { if (d.palabras.test(t)) pts[i] += 2; });
    var mejor = 1;                       // empate: Taller, la más neutra
    [0, 2].forEach(function (i) { if (pts[i] > pts[mejor]) mejor = i; });
    return mejor;
  }

  /* ───────── superficies y acentos, ya validados ─────────
     Por cada modo (el de la página y su inverso para las secciones invertidas):
       ac = texto y enlaces · vivo = relleno de lo que se aprieta · on = texto encima del relleno · suave = fondo teñido
       vb = color del filete de 2 px del relleno (la tinta, si el relleno solo no se separa del fondo) */
  function superficies(dir, oscuro, c0) {
    var a = acentoDe(c0, dir), base = oscuro ? dir.osc : dir.cla, inv = oscuro ? dir.cla : dir.osc;
    var P = oscuro ? { ac: a.acO, vivo: a.acO, on: a.onO, suave: a.suaveO, vb: a.acO } : { ac: a.ac, vivo: a.vivo, on: a.on, suave: a.suave, vb: a.borde ? dir.cla.ink : a.vivo };
    var Q = oscuro ? { ac: a.ac, vivo: a.vivo, on: a.on, suave: a.suave, vb: a.borde ? dir.cla.ink : a.vivo } : { ac: a.acO, vivo: a.acO, on: a.onO, suave: a.suaveO, vb: a.acO };
    return {
      bg: base.bg, bg2: base.bg2, ink: base.ink, mut: base.mut, ac: P.ac, vivo: P.vivo, on: P.on, suave: P.suave, vb: P.vb,
      bgI: inv.bg, bg2I: inv.bg2, inkI: inv.ink, mutI: inv.mut, acI: Q.ac, vivoI: Q.vivo, onI: Q.on, suaveI: Q.suave, vbI: Q.vb,
      caso: a.caso
    };
  }
  /* Todos los pares texto/fondo que usa el sitio, con su razón. Lo usa el test. */
  function pares(s) {
    var out = [];
    [['', s.bg, s.bg2, s.ink, s.mut, s.ac, s.vivo, s.on, s.suave], ['inv', s.bgI, s.bg2I, s.inkI, s.mutI, s.acI, s.vivoI, s.onI, s.suaveI]].forEach(function (g) {
      [g[1], g[2]].forEach(function (f) {
        out.push([g[0] + ' ink/' + f, g[3], f]); out.push([g[0] + ' mut/' + f, g[4], f]); out.push([g[0] + ' acento/' + f, g[5], f]);
      });
      out.push([g[0] + ' botón', g[7], g[6]]); out.push([g[0] + ' ink/suave', g[3], g[8]]); out.push([g[0] + ' mut/suave', g[4], g[8]]);
    });
    return out.map(function (p) { return { par: p[0], ratio: contraste(p[1], p[2]) }; });
  }

  /* ───────── el resumen corporativo ───────── */
  function resumenMarca(ST, D, dirIdx, sup) {
    var d = DIRS[dirIdx], tonoLbl = D.TONES[ST.tone].label;
    var min = Math.min.apply(null, pares(sup).map(function (p) { return p.ratio; }));
    return [
      { k: 'Marca · dirección', v: d.nombre + ' · ' + d.idea },
      { k: 'Marca · concepto', v: concepto(ST, D) },
      { k: 'Marca · tono', v: tonoLbl + ': ' + d.voz },
      { k: 'Marca · paleta', v: 'Fondo ' + sup.bg + ' · Fondo 2 ' + sup.bg2 + ' · Texto ' + sup.ink + ' · Acento ' + sup.vivo + ' (todo texto sobre 4,5:1; el más bajo ' + min.toFixed(1).replace('.', ',') + ':1)' },
      { k: 'Marca · tipografía', v: 'Titulares ' + d.tipos[0] + ' · Texto ' + d.tipos[1] + ' · Cifras y rótulos ' + d.tipos[2] + ' (licencia libre OFL)' },
      { k: 'Marca · frases', v: tres(ST).join(' / ') }
    ];
  }

  W.SOUL_MARCA = {
    DIRS: DIRS, luz: luz, contraste: contraste, sobre: sobre, acento: acento, acentoDe: acentoDe, FIJOS: FIJOS, aLch: aLch,
    sello: sello, monograma: monograma, selloOpciones: selloOpciones, selloGesto: selloGesto, selloExplica: selloExplica, GESTOS: GESTOS, GESTO_OFICIO: GESTO_OFICIO,
    cap: cap, bajo: bajo, sinPunto: sinPunto, limpio: limpio, norm: norm,
    marcaNombre: marcaNombre, titular: titular, nunca: nunca, momento: momento, origen: origen, cierre: cierre,
    cifra: cifra, concepto: concepto, tres: tres, elegir: elegir, superficies: superficies, pares: pares,
    resumenMarca: resumenMarca
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = W.SOUL_MARCA;
})(typeof window !== 'undefined' ? window : globalThis);
