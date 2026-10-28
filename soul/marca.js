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
  /* Devuelve el acento más cercano al pedido que lee ≥ min sobre TODOS los fondos dados.
     Si no llega, lo empuja hacia blanco (fondo oscuro) o negro (fondo claro). */
  function acentoSobre(ac, fondos, min) {
    min = min || 4.5;
    var oscuro = fondos.every(function (f) { return luz(f) < 0.3; });
    var meta = oscuro ? [255, 255, 255] : [0, 0, 0], base = rgb(ac);
    for (var t = 0; t <= 1.0001; t += 0.04) {
      var h = hex(base.map(function (v, i) { return v + (meta[i] - v) * t; }));
      if (fondos.every(function (f) { return contraste(h, f) >= min; })) return h;
    }
    return hex(meta);
  }
  /* Color de texto (negro o blanco) con más contraste sobre un fondo. */
  function sobre(h) { return contraste(h, '#080A09') >= contraste(h, '#FFFFFF') ? '#080A09' : '#FFFFFF'; }

  /* ───────── el catálogo cerrado ───────── */
  var DIRS = [
    { id: 'escenario', nombre: 'Escenario',
      idea: 'Ruido bueno y foco encima: una marca que se nota desde el fondo de la sala.',
      voz: 'frases cortas, de tú, con ritmo y un guiño',
      display: "'Syne',system-ui,sans-serif", texto: "'Instrument Sans',system-ui,sans-serif", mono: "'JetBrains Mono',ui-monospace,monospace",
      tipos: ['Syne', 'Instrument Sans', 'JetBrains Mono'], mayus: true, trama: 'rayos',
      osc: { bg: '#0B0A0D', bg2: '#1F1A26', ink: '#F4F1EC', mut: '#BDB5C4' },   // negro de sala + terciopelo
      cla: { bg: '#F4F1EC', bg2: '#E4DDEA', ink: '#0B0A0D', mut: '#4C4556' },
      oficios: [0, 3, 5, 8, 9, 15], tono: 2, palabras: /fiesta|bulla|musica|luces|escenario|publico|micro|baile|show|noche/ },
    { id: 'taller', nombre: 'Taller',
      idea: 'Hecho a mano y a la vista: una marca que huele a lo que hace.',
      voz: 'cálida, concreta, con las manos en la masa',
      display: "'Bricolage Grotesque',system-ui,sans-serif", texto: "'Figtree',system-ui,sans-serif", mono: "'IBM Plex Mono',ui-monospace,monospace",
      tipos: ['Bricolage Grotesque', 'Figtree', 'IBM Plex Mono'], mayus: false, trama: 'grano',
      osc: { bg: '#2B1D12', bg2: '#3A2818', ink: '#F7EDDA', mut: '#D3C3A6' },   // madera tostada, no negro
      cla: { bg: '#F2E3C6', bg2: '#E6D2AC', ink: '#2A1C10', mut: '#57432E' },   // papel kraft
      oficios: [1, 2, 4, 6, 7, 10, 11, 12, 13, 20], tono: 0, palabras: /mano|madera|harina|barro|tierra|casa|fuego|masa|hilo|cocina/ },
    { id: 'obra', nombre: 'Obra',
      idea: 'Prolijo y a la hora: una marca que se gana la confianza con el trabajo bien hecho.',
      voz: 'directa y ordenada, sin vueltas',
      display: "'Archivo',system-ui,sans-serif", texto: "'Instrument Sans',system-ui,sans-serif", mono: "'Space Mono',ui-monospace,monospace",
      tipos: ['Archivo', 'Instrument Sans', 'Space Mono'], mayus: false, trama: 'grilla',
      osc: { bg: '#0B1E30', bg2: '#123049', ink: '#EAF2F8', mut: '#A9BFD1' },   // azul de plano
      cla: { bg: '#EEF2F5', bg2: '#DCE4EB', ink: '#0B1E30', mut: '#3F5263' },
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
  function marcaNombre(ST) { return limpio(ST.apodo) || limpio(ST.name) || 'Tu nombre'; }
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

  /* ───────── superficies y acentos, ya validados ───────── */
  function superficies(dir, oscuro, acentoPedido) {
    var base = oscuro ? dir.osc : dir.cla, inv = oscuro ? dir.cla : dir.osc;
    return {
      bg: base.bg, bg2: base.bg2, ink: base.ink, mut: base.mut,
      ac: acentoSobre(acentoPedido, [base.bg, base.bg2]),
      bgI: inv.bg, bg2I: inv.bg2, inkI: inv.ink, mutI: inv.mut,
      acI: acentoSobre(acentoPedido, [inv.bg, inv.bg2])
    };
  }
  /* Todos los pares texto/fondo que usa el borrador, con su razón. Lo usa el test. */
  function pares(s) {
    var out = [];
    [['', s.bg, s.bg2, s.ink, s.mut, s.ac], ['inv', s.bgI, s.bg2I, s.inkI, s.mutI, s.acI]].forEach(function (g) {
      [g[1], g[2]].forEach(function (f) {
        out.push([g[0] + ' ink/' + f, g[3], f]); out.push([g[0] + ' mut/' + f, g[4], f]); out.push([g[0] + ' acento/' + f, g[5], f]);
      });
      out.push([g[0] + ' botón', sobre(g[5]), g[5]]);
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
      { k: 'Marca · paleta', v: 'Fondo ' + sup.bg + ' · Fondo 2 ' + sup.bg2 + ' · Texto ' + sup.ink + ' · Acento ' + sup.ac + ' (todo texto sobre 4,5:1; el más bajo ' + min.toFixed(1).replace('.', ',') + ':1)' },
      { k: 'Marca · tipografía', v: 'Titulares ' + d.tipos[0] + ' · Texto ' + d.tipos[1] + ' · Cifras y rótulos ' + d.tipos[2] + ' (licencia libre OFL)' },
      { k: 'Marca · frases', v: tres(ST).join(' / ') }
    ];
  }

  W.SOUL_MARCA = {
    DIRS: DIRS, luz: luz, contraste: contraste, acentoSobre: acentoSobre, sobre: sobre,
    cap: cap, bajo: bajo, sinPunto: sinPunto, limpio: limpio, norm: norm,
    marcaNombre: marcaNombre, titular: titular, nunca: nunca, momento: momento, origen: origen, cierre: cierre,
    cifra: cifra, concepto: concepto, tres: tres, elegir: elegir, superficies: superficies, pares: pares,
    resumenMarca: resumenMarca
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = W.SOUL_MARCA;
})(typeof window !== 'undefined' ? window : globalThis);
