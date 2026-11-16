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

  function abre(w, h, extra) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"' + (extra || '') + '>'; }

  /* La escena completa, en un solo SVG. */
  function escena(o) {
    var B = base(o);
    var s = abre(B.w, B.h, o.anim ? ' class="vpa"' : '');
    s += capaFondo(o, B) + '<g class="vpa-sol">' + capaSol(o, B) + '</g>' + capaConfeti(o, B) + capaFigura(o, B) + capaHorizonte(o, B);
    if (o.grano !== false) s += capaGrano(o, B);
    return s + '</svg>';
  }
  /* Las mismas capas por separado (mismo azar, misma composición): las usa el video para moverlas. */
  function capas(o) {
    var B = base(o), w = B.w, h = B.h;
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
  function cargarFuentes(fu) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 80px ' + fu.display), document.fonts.load('400 30px ' + fu.texto), document.fonts.load('400 24px ' + fu.mono)
    ]).catch(function () { /* con la de sistema */ });
  }
  /* Parte un texto en líneas que caben en un ancho. */
  function lineas(ctx, txt, ancho, max) {
    var ws = String(txt || '').split(/\s+/).filter(Boolean), out = [], cur = '';
    ws.forEach(function (wd) { var p = cur ? cur + ' ' + wd : wd; if (ctx.measureText(p).width > ancho && cur) { out.push(cur); cur = wd; } else cur = p; });
    if (cur) out.push(cur);
    if (out.length > max) { out = out.slice(0, max); out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…'; }
    return out;
  }
  var FORMATOS = { post: [1080, 1350], historia: [1080, 1920], afiche: [1240, 1754] };

  /* El bloque de texto del póster se MIDE primero, de abajo hacia arriba: pie, botón, nombre, titular, oficio.
     Lo que sobra arriba es para la ilustración. Así el botón nunca se corta ni pisa el pie, sea cual sea el largo. */
  function medirTexto(o, W2, H2) {
    var c = document.createElement('canvas').getContext('2d'), fu = o.fuentes, m = W2 * 0.075, ancho = W2 - m * 2;
    var tam = Math.round(W2 * (o.formato === 'historia' ? 0.088 : o.formato === 'post' ? 0.07 : 0.078));
    c.font = '800 ' + tam + 'px ' + fu.display;
    var ls = lineas(c, o.mayus ? String(o.titular).toUpperCase() : o.titular, ancho, o.formato === 'post' ? 3 : 4);
    var kick = Math.round(W2 * 0.026), nom = Math.round(W2 * 0.034), ct = Math.round(W2 * 0.03), ch = ct * 2.2;
    var pieAlto = W2 / 1080 * 2.4 * 14.4 + W2 * 0.075 * 0.75 + W2 * 0.04;
    var L = { m: m, ancho: ancho, tam: tam, ls: ls, kick: kick, nom: nom, ct: ct, ch: ch };
    // de abajo hacia arriba
    var y = H2 - pieAlto;
    L.yCta = o.contacto ? y - ch : y; y = L.yCta - (o.contacto ? W2 * 0.03 : 0);
    L.yNom = y; y -= nom * 1.4 + W2 * 0.035;
    L.yTit = y - (ls.length - 1) * tam * 1.04; y = L.yTit - tam * 1.15;
    L.yKick = y; y -= kick + W2 * 0.05;
    L.alto = Math.max(Math.round(H2 * 0.4), Math.min(Math.round(H2 * 0.64), Math.round(y)));
    return L;
  }
  /* Dibuja el bloque. p = progreso 0..1 por elemento (para el video); en el póster quieto todo en 1. */
  function textoPoster(ctx, o, W2, H2, L, prog) {
    var t = o.tintas, fu = o.fuentes, m = L.m;
    prog = prog || { kick: 1, tit: 1, pie: 1 };
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = prog.kick; ctx.fillStyle = t.ac;
    ctx.font = '400 ' + L.kick + 'px ' + fu.mono;
    ctx.fillText(String(o.oficio || '').toUpperCase().split('').join(String.fromCharCode(8202)), m, L.yKick, L.ancho);
    ctx.fillStyle = t.ink; ctx.font = '800 ' + L.tam + 'px ' + fu.display;
    var visibles = L.ls.length * prog.tit;
    L.ls.forEach(function (l, i) {
      var u = Math.max(0, Math.min(1, visibles - i)); if (!u) return;
      ctx.globalAlpha = u; ctx.fillText(l, m, L.yTit + i * L.tam * 1.04 + (1 - u) * L.tam * 0.4, L.ancho);
    });
    ctx.globalAlpha = prog.pie;
    ctx.font = '600 ' + L.nom + 'px ' + fu.texto; ctx.fillStyle = t.ink;
    ctx.fillText(o.nombre, m, L.yNom, L.ancho);
    if (o.contacto) {
      var cta = o.cta + ' · ' + o.contacto;
      ctx.font = '600 ' + L.ct + 'px ' + fu.texto;
      var cw = Math.min(ctx.measureText(cta).width + L.ct * 1.6, L.ancho);
      ctx.fillStyle = t.ac; redondo(ctx, m, L.yCta, cw, L.ch, L.ch / 2); ctx.fill();
      ctx.fillStyle = t.sobreAc; ctx.fillText(cta, m + L.ct * 0.8, L.yCta + L.ch * 0.66, cw - L.ct * 1.6);
    }
    ctx.globalAlpha = 1;
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
    return Promise.all([cargarFuentes(o.fuentes), cargarPie(o.pie)]).then(function (r0) {
      L = medirTexto(o, W2, H2); alto = L.alto;
      return Promise.all([imagen(escena(Object.assign({}, o.escena, { w: W2, h: alto, anim: false, sufijo: 'p' }))), null, r0[1]]);
    }).then(function (r) {
      var c = document.createElement('canvas'); c.width = W2; c.height = H2;
      var ctx = c.getContext('2d');
      ctx.fillStyle = o.tintas.bg; ctx.fillRect(0, 0, W2, H2);
      ctx.drawImage(r[0], 0, 0, W2, alto);
      o.pieImg = r[2];
      textoPoster(ctx, o, W2, H2, L, null);
      pie(ctx, o, W2, H2);
      return c;
    });
  }

  /* La historia animada: 6 s a 30 cuadros, 1080x1920. Las capas se mueven por separado en el lienzo. */
  function video(o) {
    if (typeof MediaRecorder === 'undefined') return Promise.reject(new Error('Este navegador no graba video'));
    var W2 = 1080, H2 = 1920, dur = 6000, L, alto, cp;
    o = Object.assign({}, o, { formato: 'historia' });
    return cargarFuentes(o.fuentes).then(function () {
      L = medirTexto(o, W2, H2); alto = L.alto;
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
        ctx.restore();
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

  W.SOUL_ARTE = { semilla: semilla, escena: escena, capas: capas, poster: poster, video: video, FORMATOS: FORMATOS };
})(window);
