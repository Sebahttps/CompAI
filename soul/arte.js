/* SOUL · el generador de arte (16-11-2026).
   Una ilustración propia por persona, sin servidor, sin IA, sin CDN: se arma en el navegador con
   el oficio, la paleta, la dirección de marca y una semilla. La misma semilla da siempre la misma
   imagen, así que viaja en el enlace (ST.arte) y el sitio público pinta lo mismo que vio la persona.

   Qué produce:
     escena(o)  -> SVG de la ilustración (portada, tarjetas). Con o.anim = true trae la coreografía
                   de entrada (sol, horizonte, figura que se dibuja, confeti que flota).
     poster(o)  -> Promise<canvas>: póster listo para redes o para imprimir. Formatos:
                   'post' 1080x1350 (feed), 'historia' 1080x1920, 'afiche' 1240x1754 (A4 a 150 ppp).
     video(o)   -> Promise<{blob, ext}>: la historia animada de 6 s (MP4 si el navegador sabe, si no WebM).

   Estilo: serigrafía de tres tintas (la paleta de la persona) con desfase de registro, trama de la
   dirección y grano de papel. Escenario = foco y rayos; Taller = papel recortado; Obra = plano y bloques. */
(function (W) {
  'use strict';

  /* ───────── azar con semilla: misma semilla, misma imagen ───────── */
  function semilla(txt) {
    var h = 2166136261; txt = String(txt || '');
    for (var i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function azar(s) {
    return function () {
      s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function f(n) { return Math.round(n * 10) / 10; }

  /* ───────── la caja de cada motivo (se mide una vez en el navegador) ───────── */
  var CAJAS = {};
  function caja(d) {
    if (CAJAS[d]) return CAJAS[d];
    var b = { x: 0, y: 0, width: 24, height: 24 };
    try {
      var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), p = document.createElementNS(ns, 'path');
      s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.style.position = 'absolute'; s.style.visibility = 'hidden';
      p.setAttribute('d', d); s.appendChild(p); document.body.appendChild(s);
      var r = p.getBBox(); if (r.width > 0 && r.height > 0) b = { x: r.x, y: r.y, width: r.width, height: r.height };
      s.remove();
    } catch (_) { /* sin DOM: caja por defecto */ }
    return (CAJAS[d] = b);
  }

  /* ───────── las capas ─────────
     o = { w, h, motivo, relleno (bool: motivo de figura llena), tintas: {bg, ink, ac, c2, c3}, trama, dir, seed, ini, foco: {x,y,r} opcional } */
  function base(o) {
    var r = azar(o.seed || 1), w = o.w, h = o.h, t = o.tintas;
    var sx = w * (0.38 + r() * 0.24), sy = h * (0.26 + r() * 0.12), sr = Math.min(w, h) * (0.3 + r() * 0.1);
    return { r: r, w: w, h: h, t: t, sol: { x: sx, y: sy, r: sr }, hz: h * (0.6 + r() * 0.08) };
  }
  function idsDe(o) { return 'a' + ((o.seed || 1) % 100000) + (o.sufijo || ''); }

  function capaFondo(o, B) {
    var r = B.r, w = B.w, h = B.h, t = B.t, s = B.sol, id = idsDe(o), out = '', k;
    out += '<rect width="' + w + '" height="' + h + '" fill="' + t.bg + '"/>';
    // la trama de la dirección, en todo el fondo y muy tenue
    if (o.trama === 'rayos') {
      for (k = 0; k < 13; k++) out += '<line x1="' + f(s.x) + '" y1="' + f(s.y) + '" x2="' + f(-w * 0.3 + k * w * 0.13) + '" y2="' + h + '" stroke="' + t.ac + '" stroke-opacity=".14" stroke-width="' + f(w / 260) + '"/>';
    } else if (o.trama === 'grano') {
      out += '<defs><pattern id="' + id + 'g" width="' + f(w / 22) + '" height="' + f(w / 22) + '" patternUnits="userSpaceOnUse"><circle cx="' + f(w / 140) + '" cy="' + f(w / 140) + '" r="' + f(w / 330) + '" fill="' + t.ink + '" fill-opacity=".14"/></pattern></defs><rect width="' + w + '" height="' + h + '" fill="url(#' + id + 'g)"/>';
    } else {
      var paso = w / 10;
      for (k = 1; k < 10; k++) out += '<line x1="' + f(k * paso) + '" y1="0" x2="' + f(k * paso) + '" y2="' + h + '" stroke="' + t.ink + '" stroke-opacity=".07" stroke-width="' + f(w / 400) + '"/>';
      for (k = 1; k < h / paso; k++) out += '<line x1="0" y1="' + f(k * paso) + '" x2="' + w + '" y2="' + f(k * paso) + '" stroke="' + t.ink + '" stroke-opacity=".07" stroke-width="' + f(w / 400) + '"/>';
    }
    // el monograma gigante, en contorno (la identidad, aunque no haya foto)
    if (o.ini) out += '<text x="' + f(-w * 0.04) + '" y="' + f(h * 0.74) + '" font-family="' + esc(o.display || 'sans-serif') + '" font-weight="800" font-size="' + f(Math.min(w * 1.25, h * 0.7)) + '" letter-spacing="-.04em" fill="none" stroke="' + t.ac + '" stroke-opacity=".22" stroke-width="' + f(w / 200) + '">' + esc(o.ini) + '</text>';
    return out;
  }

  /* El sol (o el foco, o el bloque): la forma grande detrás de la figura. */
  function capaSol(o, B) {
    var r = B.r, t = B.t, s = B.sol, w = B.w, id = idsDe(o), out = '', k;
    if (o.dir === 'escenario') {
      out += '<polygon points="' + f(s.x - s.r * 0.18) + ',0 ' + f(s.x + s.r * 0.18) + ',0 ' + f(s.x + s.r * 1.25) + ',' + f(B.hz + s.r * 0.2) + ' ' + f(s.x - s.r * 1.25) + ',' + f(B.hz + s.r * 0.2) + '" fill="' + t.c2 + '" fill-opacity=".22"/>';
      out += '<circle cx="' + f(s.x) + '" cy="' + f(s.y) + '" r="' + f(s.r) + '" fill="' + t.ac + '"/>';
    } else if (o.dir === 'taller') {
      // papel recortado: borde irregular con semilla
      var n = 30, pts = [];
      for (k = 0; k < n; k++) { var a = k / n * Math.PI * 2, rr = s.r * (0.965 + r() * 0.07); pts.push(f(s.x + Math.cos(a) * rr) + ',' + f(s.y + Math.sin(a) * rr)); }
      out += '<polygon points="' + pts.join(' ') + '" fill="' + t.ac + '" transform="translate(' + f(w / 90) + ' ' + f(w / 90) + ')" fill-opacity=".35"/>';
      out += '<polygon points="' + pts.join(' ') + '" fill="' + t.ac + '"/>';
    } else {
      // obra: arco de plano
      out += '<path d="M' + f(s.x - s.r) + ' ' + f(s.y + s.r) + 'V' + f(s.y) + 'a' + f(s.r) + ' ' + f(s.r) + ' 0 0 1 ' + f(s.r * 2) + ' 0V' + f(s.y + s.r) + 'z" fill="' + t.ac + '"/>';
      out += '<path d="M' + f(s.x - s.r * 1.15) + ' ' + f(s.y + s.r) + 'H' + f(s.x + s.r * 1.15) + '" stroke="' + t.ink + '" stroke-width="' + f(w / 260) + '" stroke-dasharray="' + f(w / 80) + ' ' + f(w / 120) + '"/>';
    }
    // trama de puntos dentro del sol: la textura de la serigrafía
    out += '<defs><clipPath id="' + id + 'c"><circle cx="' + f(s.x) + '" cy="' + f(s.y) + '" r="' + f(s.r) + '"/></clipPath><pattern id="' + id + 'p" width="' + f(w / 40) + '" height="' + f(w / 40) + '" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="' + f(w / 80) + '" cy="' + f(w / 80) + '" r="' + f(w / 220) + '" fill="' + t.c3 + '" fill-opacity=".35"/></pattern></defs>';
    out += '<rect x="' + f(s.x - s.r) + '" y="' + f(s.y - s.r) + '" width="' + f(s.r * 2) + '" height="' + f(s.r * 2) + '" fill="url(#' + id + 'p)" clip-path="url(#' + id + 'c)"/>';
    return out;
  }

  /* El horizonte: cerros (taller), olas de luz (escenario) o bloques (obra). Tres planos, de atrás hacia delante. */
  function capaHorizonte(o, B) {
    var r = B.r, t = B.t, w = B.w, h = B.h, out = '', cols = [t.c2, t.c3, t.bg2 || t.ink], ops = ['.55', '.85', '1'], p, k, i;
    for (p = 0; p < 3; p++) {
      var y0 = B.hz + p * h * 0.07, d;
      if (o.dir === 'obra') {
        d = 'M0 ' + f(h);
        var x = 0;
        while (x < w) { var bw = w * (0.08 + r() * 0.12), bh = h * (0.03 + r() * 0.09) * (1 - p * 0.25); d += 'V' + f(y0 - bh) + 'H' + f(Math.min(w, x + bw)); x += bw; }
        d += 'V' + f(h) + 'Z';
      } else {
        var amp = h * (o.dir === 'escenario' ? 0.025 : 0.05) * (1 - p * 0.2), fr = 1 + r() * 2, fa = r() * 6;
        d = 'M0 ' + f(h) + 'V' + f(y0);
        for (i = 0; i <= 24; i++) { var xx = w * i / 24; d += 'L' + f(xx) + ' ' + f(y0 + Math.sin(fa + i / 24 * Math.PI * 2 * fr) * amp + Math.sin(i * 1.7 + fa) * amp * 0.25); }
        d += 'V' + f(h) + 'Z';
      }
      out += '<path class="vpa-hz" style="--i:' + p + '" d="' + d + '" fill="' + cols[p] + '" fill-opacity="' + ops[p] + '"/>';
    }
    return out;
  }

  /* La figura: el motivo del oficio, grande, con sombra desfasada como en serigrafía. */
  function capaFigura(o, B) {
    var t = B.t, s = B.sol, w = B.w, b = caja(o.motivo);
    var lado = Math.max(b.width, b.height), alto = s.r * (o.relleno ? 2.1 : 1.55), k = alto / lado;
    var cx = s.x, cy = Math.min(s.y + s.r * 0.35, B.hz - alto * 0.12);
    var tx = cx - (b.x + b.width / 2) * k, ty = cy - (b.y + b.height / 2) * k;
    var sw = Math.max(2, w / 55), des = w / 60, out = '';
    function una(dx, dy, color, op, cls) {
      return '<path class="' + cls + '" d="' + o.motivo + '" transform="translate(' + f(tx + dx) + ' ' + f(ty + dy) + ') scale(' + f(k * 1000) / 1000 + ')"' +
        (o.relleno ? ' fill="' + color + '" fill-opacity="' + op + '" stroke="none"' : ' fill="none" stroke="' + color + '" stroke-opacity="' + op + '" stroke-width="' + (Math.round(sw / k * 100) / 100) + '" stroke-linecap="round" stroke-linejoin="round"') + '/>';
    }
    out += una(des, des, t.c3, o.relleno ? '.55' : '.7', 'vpa-sombra');
    out += una(0, 0, t.ink, '1', 'vpa-fig');
    return out;
  }

  /* El confeti: herramientas chicas del oficio convertidas en signos (puntos, cruces, guiones, estrellas). */
  function capaConfeti(o, B) {
    var r = B.r, t = B.t, w = B.w, h = B.h, s = B.sol, out = '', n = 10 + Math.floor(r() * 6), k, cols = [t.ac, t.c2, t.ink];
    for (k = 0; k < n; k++) {
      var x = r() * w, y = r() * B.hz * 0.95, tam = w * (0.012 + r() * 0.02), c = cols[k % 3], tipo = Math.floor(r() * 4), rot = Math.floor(r() * 90);
      if (Math.hypot(x - s.x, y - s.y) < s.r * 1.05) continue;   // fuera del sol: no ensucia la figura
      var g = '<g class="vpa-cf" style="--i:' + (k % 5) + '" transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + rot + ')">';
      if (tipo === 0) g += '<circle r="' + f(tam * 0.5) + '" fill="' + c + '"/>';
      else if (tipo === 1) g += '<path d="M' + f(-tam / 2) + ' 0H' + f(tam / 2) + 'M0 ' + f(-tam / 2) + 'V' + f(tam / 2) + '" stroke="' + c + '" stroke-width="' + f(tam / 4) + '" stroke-linecap="round"/>';
      else if (tipo === 2) g += '<rect x="' + f(-tam / 2) + '" y="' + f(-tam / 8) + '" width="' + f(tam) + '" height="' + f(tam / 4) + '" rx="' + f(tam / 8) + '" fill="' + c + '"/>';
      else g += '<path d="M0 ' + f(-tam / 2) + 'L' + f(tam * 0.14) + ' ' + f(-tam * 0.14) + 'L' + f(tam / 2) + ' 0L' + f(tam * 0.14) + ' ' + f(tam * 0.14) + 'L0 ' + f(tam / 2) + 'L' + f(-tam * 0.14) + ' ' + f(tam * 0.14) + 'L' + f(-tam / 2) + ' 0L' + f(-tam * 0.14) + ' ' + f(-tam * 0.14) + 'Z" fill="' + c + '"/>';
      out += g + '</g>';
    }
    return out;
  }

  /* Grano de papel: el último toque que saca la ilustración de lo «digital». */
  function capaGrano(o, B) {
    var id = idsDe(o);
    return '<defs><filter id="' + id + 'n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="' + ((o.seed || 1) % 997) + '"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/></filter></defs>' +
      '<rect width="' + B.w + '" height="' + B.h + '" filter="url(#' + id + 'n)" opacity=".16" style="mix-blend-mode:multiply"/>';
  }

  function abre(w, h, extra, par) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" preserveAspectRatio="' + (par || 'xMidYMid slice') + '" aria-hidden="true" focusable="false"' + (extra || '') + '>'; }

  /* Escena icónica (escenas.js) cuando está cargado y se sabe el oficio; si no, el motivo de siempre. */
  function icono(o) { return W.SOUL_ESCENAS && o.oficioN != null ? W.SOUL_ESCENAS.capas(o) : null; }
  function hzG(s) { return /vpa-hz/.test(s) ? s : '<g class="vpa-hz" style="--i:0">' + s + '</g>'; }

  /* La escena completa, en un solo SVG. */
  function escena(o) {
    var B = base(o), I = icono(o);
    var cl = ((o.anim ? 'vpa ' : '') + (o.clase || '')).trim();
    var s = abre(B.w, B.h, cl ? ' class="' + cl + '"' : '', o.par || (I && B.h > B.w ? 'xMidYMin slice' : null));   // escena alta: si sobra, se corta abajo, nunca la cabeza
    if (I) s += I.fondo + '<g class="vpa-sol">' + I.sol + '</g>' + I.confeti + I.figura + hzG(I.horizonte);
    else s += capaFondo(o, B) + '<g class="vpa-sol">' + capaSol(o, B) + '</g>' + capaConfeti(o, B) + capaFigura(o, B) + capaHorizonte(o, B);
    if (o.grano !== false) s += capaGrano(o, B);
    return s + '</svg>';
  }
  /* Las mismas capas por separado (mismo azar, misma composición): las usa el video para moverlas. */
  function capas(o) {
    var B = base(o), w = B.w, h = B.h, I = icono(o);
    if (I) return { fondo: abre(w, h) + I.fondo + '</svg>', sol: abre(w, h) + I.sol + '</svg>', confeti: abre(w, h) + I.confeti + '</svg>',
      figura: abre(w, h) + I.figura + '</svg>', horizonte: abre(w, h) + I.horizonte + capaGrano(o, B) + '</svg>', sol0: I.sol0, hz: I.hz };
    var fondo = capaFondo(o, B), sol = capaSol(o, B), conf = capaConfeti(o, B), fig = capaFigura(o, B), hz = capaHorizonte(o, B);
    return {
      fondo: abre(w, h) + fondo + '</svg>',
      sol: abre(w, h) + sol + '</svg>',
      confeti: abre(w, h) + conf + '</svg>',
      figura: abre(w, h) + fig + '</svg>',
      horizonte: abre(w, h) + hz + capaGrano(o, B) + '</svg>',
      sol0: B.sol, hz: B.hz
    };
  }

  /* ───────── a lienzo ───────── */
  function imagen(svg) {
    return new Promise(function (ok, mal) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { mal(new Error('El arte no se pudo dibujar')); };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function cargarFuentes(fu, T) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 80px ' + fu.display), document.fonts.load('400 30px ' + fu.texto), document.fonts.load('400 24px ' + fu.mono),
      W.SOUL_ESCENAS && T ? W.SOUL_ESCENAS.cargar(T) : null
    ]).catch(function () { /* con la de sistema */ });
  }
  /* La tipografía de cartel de la escena (o la de la marca si no hay escena). */
  var LIVIANAS = { 'SOUL Anton': 400, 'SOUL Bangers': 400, 'SOUL Monoton': 400, 'SOUL Marker': 400, 'SOUL Stencil': 400 };
  function tipoDe(o) { return o.T || (W.SOUL_ESCENAS && o.escena && o.escena.oficioN != null ? W.SOUL_ESCENAS.tipo(o.escena) : null); }
  function fuente(fam, tam, def, defPeso) { return fam ? (LIVIANAS[fam] || 700) + ' ' + tam + "px '" + fam + "', " + def : (defPeso || 800) + ' ' + tam + 'px ' + def; }
  function espaciar(ctx, em) { if ('letterSpacing' in ctx) ctx.letterSpacing = em ? em + 'em' : '0px'; }
  function textoTitular(o, T) { var x = String(o.titular || ''); return T && T.minus ? x.toLowerCase() : (T ? T.mayus : o.mayus) ? x.toUpperCase() : x; }
  /* Parte un texto en líneas que caben en un ancho. */
  function lineas(ctx, txt, ancho, max, sep) {
    sep = sep || ' ';
    var ws = String(txt || '').split(/\s+/).filter(Boolean), out = [], cur = '';
    ws.forEach(function (wd) { var p = cur ? cur + sep + wd : wd; if (ctx.measureText(p).width > ancho && cur) { out.push(cur); cur = wd; } else cur = p; });
    if (cur) out.push(cur);
    if (out.length > max) { out = out.slice(0, max); out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…'; }
    return out;
  }
  var FORMATOS = { post: [1080, 1350], historia: [1080, 1920], afiche: [1240, 1754] };

  /* El bloque de texto del póster se MIDE primero, de abajo hacia arriba: pie, botón, nombre, titular, oficio.
     Lo que sobra arriba es para la ilustración. Así el botón nunca se corta ni pisa el pie, sea cual sea el largo. */
  /* T = la tipografía de cartel de la escena: familia, mayúsculas, giro, globo, filetes, cinta… */
  function medirTexto(o, W2, H2) {
    var c = document.createElement('canvas').getContext('2d'), fu = o.fuentes, T = tipoDe(o), m = W2 * 0.075, ancho = W2 - m * 2;
    var tam = Math.round(W2 * (o.formato === 'historia' ? 0.088 : o.formato === 'post' ? 0.07 : 0.078) * (T ? T.tamF : 1));
    var anchoT = ancho * (T && (T.globo || T.marco) ? 0.84 : T && T.rot ? 0.9 : 1), interl = T ? T.interl : 1.04;
    // la frase de la persona no se corta: primero se achica la letra (hasta ~55 %), recién después los puntos suspensivos
    var maxL = o.formato === 'post' ? 3 : 4, txt = textoTitular(o, T), ls;
    for (var it = 0; it < 6; it++) {
      c.font = fuente(T && T.tit, tam, fu.display, T && T.w); espaciar(c, T && T.esp);
      ls = lineas(c, txt, anchoT, 99, T && T.sep); if (ls.length <= maxL) break; tam = Math.round(tam * 0.9);
    }
    if (ls.length > maxL) ls = lineas(c, txt, anchoT, maxL, T && T.sep);
    var kick = Math.round(W2 * (T && /Teko|Bangers|Marker/.test(T.kick) ? 0.034 : 0.026));
    var nom = Math.round(W2 * (T && /Teko|Bangers|Marker|Cormorant/.test(T.nom) ? 0.044 : 0.034)), ct = Math.round(W2 * 0.03), ch = ct * 2.2;
    var pieAlto = W2 / 1080 * 2.4 * 14.4 + W2 * 0.075 * 0.75 + W2 * 0.04;
    var L = { m: m, ancho: ancho, anchoT: anchoT, tam: tam, ls: ls, kick: kick, nom: nom, ct: ct, ch: ch, T: T, interl: interl };
    var pad = T && T.globo ? tam * 0.55 : T && T.marco ? tam * 0.7 : T && T.filetes ? tam * 0.5 : T && T.bloque ? tam * 0.2 : 0;
    var inc = T && T.rot ? Math.abs(Math.sin(T.rot * Math.PI / 180)) * anchoT : 0;
    // de abajo hacia arriba
    var y = H2 - pieAlto;
    L.yCta = o.contacto ? y - ch : y; y = L.yCta - (o.contacto ? W2 * 0.03 : 0);
    if (T && T.cinta) y -= nom * 0.35;
    L.yNom = y; y -= nom * 1.4 + W2 * 0.035 + pad;
    L.yTit = y - (ls.length - 1) * tam * interl; L.pad = pad;
    y = L.yTit - tam * 0.95 - inc - pad - W2 * 0.012;
    L.yKick = y; y -= kick + W2 * 0.05;
    L.alto = Math.max(Math.round(H2 * 0.4), Math.min(Math.round(H2 * 0.64), Math.round(y)));
    return L;
  }
  /* Dibuja el bloque. p = progreso 0..1 por elemento (para el video); en el póster quieto todo en 1. */
  function textoPoster(ctx, o, W2, H2, L, prog) {
    var t = o.tintas, fu = o.fuentes, m = L.m, T = L.T || {}, cen = T.alinea === 'center', x0 = cen ? W2 / 2 : m, tam = L.tam, il = L.interl;
    var E = W.SOUL_ESCENAS, oscuro = E ? E.luz(t.bg) < 0.45 : true, tinta = t.ink;
    prog = prog || { kick: 1, tit: 1, pie: 1 };
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = cen ? 'center' : 'left';
    // el oficio, arriba, chico y espaciado
    ctx.globalAlpha = prog.kick; ctx.fillStyle = t.ac;
    ctx.font = T.kick ? fuente(T.kick, L.kick, fu.mono) : '400 ' + L.kick + 'px ' + fu.mono;
    espaciar(ctx, T.kesp != null ? T.kesp : T.kick ? 0.12 : 0);
    var kick = String(o.oficio || '').toUpperCase();
    ctx.fillText(T.kick ? kick : kick.split('').join(String.fromCharCode(8202)), x0, L.yKick, L.ancho);
    espaciar(ctx, 0);
    var yBase = L.yTit + (L.ls.length - 1) * tam * il;
    if (T.filetes || T.marco) {   // los filetes del cartel clásico: una línea, un rombo, una línea
      ctx.globalAlpha = prog.kick * 0.9; ctx.strokeStyle = t.ac; ctx.fillStyle = t.ac; ctx.lineWidth = Math.max(1.5, W2 / 540);
      var d = W2 * 0.008;
      [L.yKick + L.kick * 0.75, yBase + L.pad * 0.8].forEach(function (yy) {
        ctx.beginPath(); ctx.moveTo(W2 / 2 - W2 * 0.22, yy); ctx.lineTo(W2 / 2 - d * 2.5, yy); ctx.moveTo(W2 / 2 + d * 2.5, yy); ctx.lineTo(W2 / 2 + W2 * 0.22, yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W2 / 2, yy - d); ctx.lineTo(W2 / 2 + d, yy); ctx.lineTo(W2 / 2, yy + d); ctx.lineTo(W2 / 2 - d, yy); ctx.fill();
      });
      if (T.marco) ctx.strokeRect(m * 0.55, L.yKick - L.kick * 1.7, W2 - m * 1.1, yBase + L.pad * 1.3 - L.yKick + L.kick * 1.7);
    }
    // el titular
    ctx.font = fuente(T.tit, tam, fu.display, T.w); espaciar(ctx, T.esp);
    var anchos = L.ls.map(function (l) { return Math.min(ctx.measureText(l).width, L.anchoT); }), maxA = Math.max.apply(null, anchos.concat([1]));
    if (T.globo && prog.tit > 0) {   // el globo de diálogo (pop) o la franja del cartel (propaganda)
      var gx = (cen ? W2 / 2 - maxA / 2 : m) - tam * 0.4, gy = L.yTit - tam * 0.95 - L.pad * 0.5, gw = maxA + tam * 0.8, gh = (L.ls.length - 1) * tam * il + tam * 1.25 + L.pad;
      ctx.globalAlpha = Math.min(1, prog.tit * 2);
      if (T.globo === 'pop') {
        ctx.fillStyle = '#FFFDF4'; ctx.strokeStyle = '#141414'; ctx.lineWidth = W2 / 180;
        ctx.beginPath(); ctx.moveTo(gx + gw * 0.62, gy + 2); ctx.lineTo(gx + gw * 0.82, gy - tam * 0.9); ctx.lineTo(gx + gw * 0.76, gy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        redondo(ctx, gx, gy, gw, gh, tam * 0.6); ctx.fill(); ctx.stroke();
        tinta = '#141414';
      } else {
        ctx.fillStyle = oscuro ? t.ac : t.ink; redondo(ctx, gx, gy, gw, gh, tam * 0.15); ctx.fill();
        tinta = oscuro ? t.sobreAc : t.bg;
      }
    }
    var visibles = L.ls.length * prog.tit;
    ctx.save();
    if (T.rot) { ctx.translate(m, yBase); ctx.rotate(T.rot * Math.PI / 180); ctx.translate(-m, -yBase); }
    if (T.barras) { ctx.globalAlpha = prog.tit; ctx.fillStyle = t.ac; ctx.fillRect(m, yBase + tam * 0.32, W2 * 0.16, tam * 0.13); }
    L.ls.forEach(function (l, i) {
      var u = Math.max(0, Math.min(1, visibles - i)); if (!u) return;
      var yy = L.yTit + i * tam * il + (1 - u) * tam * 0.4;
      ctx.globalAlpha = u;
      if (T.bloque) {   // cada línea sobre su barra de color, como recortada del cartel
        ctx.fillStyle = t.ac; ctx.fillRect(m - tam * 0.12, yy - tam * 0.86, anchos[i] + tam * 0.24, tam * 1.0);
        ctx.fillStyle = t.sobreAc; ctx.fillText(l, x0, yy, L.anchoT); return;
      }
      if (T.raya) { ctx.fillStyle = t.ac; ctx.fillRect(cen ? W2 / 2 - anchos[i] / 2 : m, yy + tam * 0.08, anchos[i], tam * 0.09); }
      if (T.letras) {   // recortes: cada letra con su giro y su color, pegadas a mano
        var xx = cen ? W2 / 2 - anchos[i] / 2 : m, sem = String(o.nombre || '').length * 31 + i * 7;
        ctx.textAlign = 'left';
        l.split('').forEach(function (ch, j) {
          var a = Math.sin(sem + j * 2.3) * 0.08, dy = Math.cos(sem + j * 1.7) * tam * 0.05, cw = ctx.measureText(ch).width;
          ctx.save(); ctx.translate(xx + cw / 2, yy + dy); ctx.rotate(a); ctx.fillStyle = j % 4 === 1 ? t.ac : tinta; ctx.fillText(ch, -cw / 2, 0); ctx.restore(); xx += cw;
        });
        ctx.textAlign = cen ? 'center' : 'left'; return;
      }
      if (T.sombra) { ctx.fillStyle = t.ac; ctx.fillText(l, x0 + tam * 0.05, yy + tam * 0.05, L.anchoT); }
      if (T.brillo) { ctx.shadowColor = t.ac; ctx.shadowBlur = tam * 0.35; }
      ctx.fillStyle = tinta; ctx.fillText(l, x0, yy, L.anchoT);
      if (T.brillo) { ctx.fillText(l, x0, yy, L.anchoT); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
    });
    ctx.restore(); espaciar(ctx, 0);
    // el nombre (sobre una cinta de tatuaje si la escena lo pide) y el botón
    ctx.globalAlpha = prog.pie;
    ctx.font = T.nom ? fuente(T.nom, L.nom, fu.texto) : '600 ' + L.nom + 'px ' + fu.texto;
    if (T.cinta) {
      var nw = Math.min(ctx.measureText(o.nombre).width, L.ancho - L.nom * 3), cx0 = cen ? W2 / 2 - nw / 2 : m + L.nom * 1.6, cy = L.yNom - L.nom * 1.0, chh = L.nom * 1.4;
      ctx.fillStyle = E ? E.mix(t.ac, '#000000', 0.35) : t.ac;
      [[-1, cx0 - L.nom * 0.6], [1, cx0 + nw + L.nom * 0.6]].forEach(function (g) {
        ctx.beginPath(); ctx.moveTo(g[1], cy + chh * 0.25); ctx.lineTo(g[1] + g[0] * L.nom * 1.3, cy + chh * 0.25); ctx.lineTo(g[1] + g[0] * L.nom * 0.85, cy + chh * 0.75);
        ctx.lineTo(g[1] + g[0] * L.nom * 1.3, cy + chh * 1.25); ctx.lineTo(g[1], cy + chh * 1.25); ctx.fill();
      });
      ctx.fillStyle = t.ac; ctx.fillRect(cx0 - L.nom * 0.6, cy, nw + L.nom * 1.2, chh);
      ctx.fillStyle = t.sobreAc; ctx.textAlign = 'left'; ctx.fillText(o.nombre, cx0, L.yNom, nw);
    } else { ctx.fillStyle = t.ink; ctx.fillText(o.nombre, x0, L.yNom, L.ancho); }
    ctx.textAlign = 'left';
    if (o.contacto) {
      var cta = o.cta + ' · ' + o.contacto;
      ctx.font = '600 ' + L.ct + 'px ' + fu.texto;
      var cw = Math.min(ctx.measureText(cta).width + L.ct * 1.6, L.ancho), bx = cen ? (W2 - cw) / 2 : m;
      ctx.fillStyle = t.ac; redondo(ctx, bx, L.yCta, cw, L.ch, T.tit && /Cinzel|Bodoni|Teko|Stencil|Grotesk|Anton/.test(T.tit) ? L.ch * 0.12 : L.ch / 2); ctx.fill();
      ctx.fillStyle = t.sobreAc; ctx.fillText(cta, bx + L.ct * 0.8, L.yCta + L.ch * 0.66, cw - L.ct * 1.6);
    }
    ctx.globalAlpha = 1;
  }
  /* La ilustración entra en la zona del texto (como en un afiche de cine): la figura gana tamaño y un velo del color de
     fondo la funde antes del titular, para que el texto se siga leyendo. */
  function altoEscena(L, H2, o) {
    var E = W.SOUL_ESCENAS, d = E && o && o.escena && o.escena.oficioN != null ? E.elegir(o.escena).def : null;
    return d && d.sinVelo ? L.alto : Math.round(Math.min(H2, L.alto + (H2 - L.alto) * 0.55));   // si lo importante está abajo (la camilla), no se vela
  }
  function velo(ctx, o, W2, L, alto) {
    if (alto <= L.alto) return;
    var y0 = L.alto - (alto - L.alto) * 0.7, y1 = L.alto + (alto - L.alto) * 0.3, g = ctx.createLinearGradient(0, y0, 0, y1), bg = o.tintas.bg;
    g.addColorStop(0, bg + "00"); g.addColorStop(0.55, bg + "C0"); g.addColorStop(1, bg);
    ctx.fillStyle = g; ctx.fillRect(0, y0, W2, alto - y0 + 2);
  }
  /* El sello vertical de la estampa japonesa: el nombre en columna, sobre la imagen. */
  function cartucho(ctx, o, W2, alto, L) {
    var T = L.T, E = W.SOUL_ESCENAS; if (!T || !T.cartucho || !E) return;
    var pal = String(o.nombre || '').split(/\s+/)[0].slice(0, 8), n = pal.length, s = Math.round(W2 * 0.042), m = W2 * 0.05;
    if (!n || s * 1.12 * n + m * 2 > alto * 0.85) return;
    var x = m, y = m, w = s * 1.7, h = s * 1.12 * n + s * 0.8, tinta = E.luz(o.tintas.c2) > 0.5 ? '#1A1A1A' : '#F5F0E4';
    ctx.fillStyle = o.tintas.c2; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = tinta; ctx.lineWidth = Math.max(1.5, W2 / 400); ctx.strokeRect(x + W2 * 0.005, y + W2 * 0.005, w - W2 * 0.01, h - W2 * 0.01);
    ctx.fillStyle = tinta; ctx.font = fuente(T.nom, s, o.fuentes.texto); ctx.textAlign = 'center';
    pal.split('').forEach(function (ch, i) { ctx.fillText(ch.toUpperCase(), x + w / 2, y + s * 1.2 + i * s * 1.12); });
    ctx.textAlign = 'left';
  }
  function redondo(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  /* El pie «alma compAI» (§4.b): la misma máscara del sitio, a escala del lienzo, a la derecha y con su línea. */
  function pie(ctx, o, W2, H2) {
    if (!o.pieImg) return;
    var k = W2 / 1080 * 2.4, mw = 113.4 * k, mh = 14.4 * k, m = W2 * 0.075, y = H2 - m * 0.75 - mh;
    ctx.strokeStyle = o.tintas.ink; ctx.globalAlpha = 0.25; ctx.lineWidth = Math.max(1, W2 / 1080 * 2);
    ctx.beginPath(); ctx.moveTo(m, y - W2 * 0.02); ctx.lineTo(W2 - m, y - W2 * 0.02); ctx.stroke(); ctx.globalAlpha = 1;
    var sy = 10.08 / 34.65 * o.pieImg.naturalHeight, sh = 14.4 / 34.65 * o.pieImg.naturalHeight;
    ctx.drawImage(o.pieImg, 0, sy, o.pieImg.naturalWidth, sh, W2 - m - mw, y, mw, mh);
  }
  function cargarPie(url) {
    return new Promise(function (ok) { if (!url) return ok(null); var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = url; });
  }

  /* o = { formato, escena: {…opciones de escena sin w/h}, tintas, fuentes:{display,texto,mono}, oficio, titular, nombre, cta, contacto, mayus, pie (url) } */
  function poster(o) {
    var fm = FORMATOS[o.formato] || FORMATOS.post, W2 = fm[0], H2 = fm[1], L, alto;
    o.T = tipoDe(o);
    return Promise.all([cargarFuentes(o.fuentes, o.T), cargarPie(o.pie)]).then(function (r0) {
      L = medirTexto(o, W2, H2); alto = altoEscena(L, H2, o);
      return Promise.all([imagen(escena(Object.assign({}, o.escena, { w: W2, h: alto, anim: false, sufijo: 'p' }))), null, r0[1]]);
    }).then(function (r) {
      var c = document.createElement('canvas'); c.width = W2; c.height = H2;
      var ctx = c.getContext('2d');
      ctx.fillStyle = o.tintas.bg; ctx.fillRect(0, 0, W2, H2);
      ctx.drawImage(r[0], 0, 0, W2, alto);
      o.pieImg = r[2];
      velo(ctx, o, W2, L, alto); cartucho(ctx, o, W2, alto, L);
      textoPoster(ctx, o, W2, H2, L, null);
      pie(ctx, o, W2, H2);
      return c;
    });
  }

  /* La historia animada: 6 s a 30 cuadros, 1080x1920. Las capas se mueven por separado en el lienzo. */
  function video(o) {
    if (typeof MediaRecorder === 'undefined') return Promise.reject(new Error('Este navegador no graba video'));
    var W2 = 1080, H2 = 1920, dur = 6000, L, alto, cp;
    o = Object.assign({}, o, { formato: 'historia' }); o.T = tipoDe(o);
    return cargarFuentes(o.fuentes, o.T).then(function () {
      L = medirTexto(o, W2, H2); alto = altoEscena(L, H2, o);
      cp = capas(Object.assign({}, o.escena, { w: W2, h: alto, anim: false, sufijo: 'v' }));
      return Promise.all([imagen(cp.fondo), imagen(cp.sol), imagen(cp.confeti), imagen(cp.figura), imagen(cp.horizonte), null, cargarPie(o.pie)]);
    }).then(function (im) {
      var c = document.createElement('canvas'); c.width = W2; c.height = H2;
      var ctx = c.getContext('2d'), s = cp.sol0;
      o.pieImg = im[6];
      var tipos = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'], tipo = '';
      for (var i = 0; i < tipos.length; i++) if (MediaRecorder.isTypeSupported(tipos[i])) { tipo = tipos[i]; break; }
      var flujo = c.captureStream(30), rec = new MediaRecorder(flujo, tipo ? { mimeType: tipo, videoBitsPerSecond: 6e6 } : undefined), trozos = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) trozos.push(e.data); };
      function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }
      function rebote(x) { x = Math.max(0, Math.min(1, x)); return 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); }
      function cuadro(ms) {
        var tt = ms / 1000;
        ctx.globalAlpha = 1; ctx.fillStyle = o.tintas.bg; ctx.fillRect(0, 0, W2, H2);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W2, alto); ctx.clip();
        ctx.drawImage(im[0], 0, 0);
        var ks = 0.2 + 0.8 * ease(tt / 1.1), sy = (1 - ease(tt / 1.1)) * 260;     // el sol sube y crece
        ctx.save(); ctx.translate(s.x, s.y + sy); ctx.scale(ks, ks); ctx.translate(-s.x, -s.y); ctx.drawImage(im[1], 0, 0); ctx.restore();
        ctx.globalAlpha = ease((tt - 0.6) / 0.8);                                   // el confeti aparece y flota
        ctx.drawImage(im[2], Math.sin(tt * 1.3) * 10, Math.cos(tt * 1.1) * 14 - (1 - ease((tt - 0.6) / 0.8)) * 40);
        ctx.globalAlpha = 1;
        var kf = rebote((tt - 0.9) / 0.9), fy = (1 - ease((tt - 0.9) / 0.9)) * -120;   // la figura cae y rebota
        if (tt > 0.9) { ctx.save(); ctx.translate(s.x, s.y + fy); ctx.scale(kf, kf); ctx.translate(-s.x, -s.y); ctx.drawImage(im[3], 0, 0); ctx.restore(); }
        ctx.drawImage(im[4], 0, (1 - ease(tt / 0.9)) * 300);                          // el horizonte sube
        ctx.restore(); velo(ctx, o, W2, L, alto);
        if (tt > 1.6) { ctx.globalAlpha = ease((tt - 1.6) / 0.5); cartucho(ctx, o, W2, alto, L); ctx.globalAlpha = 1; }
        textoPoster(ctx, o, W2, H2, L, { kick: ease((tt - 1.8) / 0.5), tit: ease((tt - 2.2) / 1.4), pie: ease((tt - 3.8) / 0.6) });
        if (tt > 4.2) { ctx.globalAlpha = ease((tt - 4.2) / 0.5); pie(ctx, o, W2, H2); ctx.globalAlpha = 1; }
      }
      return new Promise(function (ok, mal) {
        rec.onstop = function () { ok({ blob: new Blob(trozos, { type: (tipo || 'video/webm').split(';')[0] }), ext: /mp4/.test(tipo) ? 'mp4' : 'webm' }); };
        rec.onerror = function (e) { mal(e.error || new Error('No se pudo grabar')); };
        var t0 = null;
        cuadro(0); rec.start(250);
        function paso(ts) {
          if (t0 == null) t0 = ts;
          var ms = ts - t0; cuadro(Math.min(ms, dur));
          if (ms < dur + 400) requestAnimationFrame(paso); else rec.stop();
        }
        requestAnimationFrame(paso);
      });
    });
  }

  W.SOUL_ARTE = { semilla: semilla, escena: escena, capas: capas, poster: poster, video: video, FORMATOS: FORMATOS, tipoDe: tipoDe };
})(window);
