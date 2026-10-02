/* compai.cl · «Materialización por código» (v2 · código que BAJA).
   Cada canvas.gcanvas[data-src] arma su imagen así:
     1 · Datos   — cifras de 7 segmentos llueven por su columna y se detienen;
                   la figura se completa de arriba hacia abajo (nunca de lado a lado).
     2 · Pausa   — la imagen hecha solo de código.
     3 · Materia — la foto real baja columna a columna bajo el código.
     4 · Detalle — queda "casi materializada": foto visible y código tenue encima.
   El cursor (o el dedo) aparta las cifras. Asentada y sin cursor, el bucle se duerme.
   Opcional por canvas: data-revelado="0.85" (0 = solo código · 1 = foto completa). */
(() => {
  'use strict';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const COLORES = ['#2f6db0', '#5aa6e8', '#cfe9ff'];          // profundo · medio · brillante
  const FONDO = '#07090C';
  const ETAPAS = { datos: 2.3, pausa: 0.6 };                   // segundos
  const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

  // una cifra de 7 segmentos, dibujada a mano (sin fuentes externas)
  function cifra(g, d, x, yb, h) {
    const w = h * .52, lw = Math.max(1, h * .11), gp = lw * .7, t = yb - h, m = yb - h / 2;
    const L = { a: [x + gp, t, x + w - gp, t], b: [x + w, t + gp, x + w, m - gp], c: [x + w, m + gp, x + w, yb - gp],
      d: [x + gp, yb, x + w - gp, yb], e: [x, m + gp, x, yb - gp], f: [x, t + gp, x, m - gp], g: [x + gp, m, x + w - gp, m] };
    g.lineWidth = lw; g.beginPath();
    for (const k of SEGS[d]) { const q = L[k]; g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); }
    g.stroke();
  }

  function monta(cv) {
    const ctx = cv.getContext('2d', { alpha: false });
    const src = cv.dataset.src;
    const revelado = Math.max(0, Math.min(1, parseFloat(cv.dataset.revelado || '0.85')));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, celda = 0, cols = 0, filas = 0, n = 0;
    let lleg, lvl, col, dig, ox, oy, colRev, foto, atlas;
    let t0 = 0, corriendo = false, listo = false, puntero = null, asentado = 0, arrancado = false;

    const im = new Image();
    im.decoding = 'async';
    function pedirImagen() { if (!im.src) im.src = src; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (e.isIntersecting) { pedirImagen(); o.disconnect(); }
      }), { rootMargin: '400px 0px' }).observe(cv);
    } else pedirImagen();

    // recorte tipo "cover", con el encuadre un poco más alto (la cara)
    function recorte(cw, ch) {
      const ri = im.naturalWidth / im.naturalHeight, rc = cw / ch;
      let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
      if (ri > rc) { sw = sh * rc; sx = (im.naturalWidth - sw) / 2; }
      else { sh = sw / rc; sy = (im.naturalHeight - sh) / 2.3; }
      return [sx, sy, sw, sh];
    }

    function mide() {
      const r = cv.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      W = cv.width = Math.round(r.width * dpr);
      H = cv.height = Math.round(r.height * dpr);
      const tope = r.width < 520 ? 2600 : 4800;                // tope de cifras por canvas
      celda = Math.max(7 * dpr, Math.ceil(Math.sqrt(W * H / tope)));
      cols = Math.ceil(W / celda); filas = Math.ceil(H / celda); n = cols * filas;
      return true;
    }

    function muestrea() {
      // 1) la foto a tamaño real (para la etapa Materia)
      foto = document.createElement('canvas'); foto.width = W; foto.height = H;
      foto.getContext('2d').drawImage(im, ...recorte(W, H), 0, 0, W, H);
      // 2) una muestra por celda (para las cifras)
      const off = document.createElement('canvas'); off.width = cols; off.height = filas;
      const o = off.getContext('2d', { willReadFrequently: true });
      o.drawImage(im, ...recorte(cols, filas), 0, 0, cols, filas);
      const d = o.getImageData(0, 0, cols, filas).data;
      lleg = new Float32Array(n); lvl = new Uint8Array(n); col = new Uint8Array(n); dig = new Uint8Array(n);
      ox = new Float32Array(n); oy = new Float32Array(n);
      const jit = Array.from({ length: cols }, () => Math.random());
      for (let k = 0; k < n; k++) {
        const x = k % cols, y = (k / cols) | 0, i = k * 4, r = d[i], g = d[i + 1], b = d[i + 2];
        const luz = (r * .299 + g * .587 + b * .114) / 255;
        lvl[k] = luz < .05 ? 0 : Math.min(9, 1 + Math.round(luz * 11));
        col[k] = luz > .62 ? 2 : (r - b > 25 || luz > .3 ? 1 : 0);   // cobre/luces = medio · brillos = brillante
        dig[k] = (Math.random() * 10) | 0;
        // primero llega la fila de arriba: la figura se arma de arriba hacia abajo
        lleg[k] = (y / filas) * ETAPAS.datos * .72 + (jit[x] * .6 + Math.random() * .4) * ETAPAS.datos * .28;
      }
      colRev = Array.from({ length: cols }, () => ({ d: Math.random() * 1.4, v: .7 + Math.random() * .7, a: .55 + Math.random() * .45 }));
      // atlas de cifras: 3 colores × 10 brillos × 10 cifras
      atlas = document.createElement('canvas'); atlas.width = celda * 300; atlas.height = celda;
      const a = atlas.getContext('2d'); a.lineCap = 'butt';
      for (let c = 0; c < 3; c++) for (let l = 0; l < 10; l++) for (let q = 0; q < 10; q++) {
        a.globalAlpha = Math.max(.07, l / 9); a.strokeStyle = COLORES[c];
        a.setTransform(1, 0, -.15, 1, ((c * 10 + l) * 10 + q) * celda + celda * .25, 0);
        cifra(a, q, 0, celda * .88, celda * .74);
      }
      listo = true;
    }

    function pinta(now) {
      const t = arrancado ? (now - t0) / 1000 : 0;
      ctx.globalAlpha = 1; ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);
      const vel = H * 1.15, revIni = ETAPAS.datos + ETAPAS.pausa;
      // 3 · Materia: la foto baja columna a columna
      let rev = 0;
      if (t > revIni) {
        for (let x = 0; x < cols; x++) {
          const c = colRev[x], k = Math.min(1, Math.max(0, (t - revIni - c.d) / (.9 * c.v)));
          rev += k; if (k <= 0) continue;
          const h = H * k, cx = x * celda;
          ctx.globalAlpha = revelado * (revelado >= 1 ? 1 : c.a) * (.6 + .4 * k);
          ctx.drawImage(foto, cx, 0, celda, h, cx, 0, celda, h);
          if (k < 1) { ctx.globalAlpha = .9; ctx.fillStyle = COLORES[2]; ctx.fillRect(cx + celda * .3, h - 2 * dpr, celda * .4, 2 * dpr); }
        }
        rev /= cols;
      }
      const atenua = 1 - .55 * rev * (revelado >= 1 ? 1.7 : 1);
      // 1 · Datos: lluvia por columna
      const px = puntero ? puntero.x : -1e9, py = puntero ? puntero.y : -1e9, R = 70 * dpr, R2 = R * R;
      let moviendo = false;
      for (let k = 0; k < n; k++) {
        const L0 = lvl[k]; if (!L0) continue;
        const x0 = (k % cols) * celda, y0 = ((k / cols) | 0) * celda;
        let x = x0, y = y0, l = L0;
        if (t < lleg[k]) {                                          // cayendo por su columna
          y = y0 - vel * (lleg[k] - t); if (y < -celda) continue;
          l = Math.min(9, L0 + 4); if (Math.random() < .2) dig[k] = (Math.random() * 10) | 0;
          ctx.globalAlpha = 1;
        } else {
          if (puntero) {
            const dx = x0 + ox[k] - px, dy = y0 + oy[k] - py, d2 = dx * dx + dy * dy;
            if (d2 < R2 && d2 > .01) { const dd = Math.sqrt(d2), f = (1 - dd / R) * 6 * dpr; ox[k] += dx / dd * f; oy[k] += dy / dd * f; }
          }
          ox[k] *= .88; oy[k] *= .88;
          if (Math.abs(ox[k]) + Math.abs(oy[k]) > .3) moviendo = true;
          x += ox[k]; y += oy[k];
          ctx.globalAlpha = Math.max(0, atenua);
        }
        if (ctx.globalAlpha <= .02) continue;
        ctx.drawImage(atlas, ((col[k] * 10 + l) * 10 + dig[k]) * celda, 0, celda, celda, x, y, celda, celda);
      }
      ctx.globalAlpha = 1;
      return { fin: t > revIni + 3.2, moviendo };
    }

    function cuadro(now) {
      if (!corriendo) return;
      const s = pinta(now);
      if (s.fin && !puntero && !s.moviendo) {
        if (++asentado > 30) { corriendo = false; return; }       // asentada: se duerme
      } else asentado = 0;
      requestAnimationFrame(cuadro);
    }
    function despierta() {
      asentado = 0;
      if (!corriendo && listo) { corriendo = true; requestAnimationFrame(cuadro); }
    }
    function arranca() { if (arrancado) return; arrancado = true; t0 = performance.now(); despierta(); }

    function dibujaPlano() {                                       // sin movimiento: la foto, y ya
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      ctx.drawImage(im, ...recorte(W, H), 0, 0, W, H);
    }

    im.addEventListener('load', () => {
      if (quieto.matches) { dibujaPlano(); return; }
      if (!mide()) { setTimeout(() => im.dispatchEvent(new Event('load')), 300); return; }
      muestrea();
      pinta(performance.now());
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (e.isIntersecting) { arranca(); o.disconnect(); }
      }), { threshold: .22 }).observe(cv);
      const mueve = e => {
        const r = cv.getBoundingClientRect();
        puntero = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
        despierta();
      };
      cv.addEventListener('pointermove', mueve);
      cv.addEventListener('pointerdown', mueve);
      const suelta = () => { puntero = null; despierta(); };
      cv.addEventListener('pointerleave', suelta);
      cv.addEventListener('pointerup', suelta);
      let rt;
      addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => { if (!mide()) return; muestrea(); despierta(); }, 200);
      }, { passive: true });
    });
    im.addEventListener('error', () => {
      cv.outerHTML = `<img src="${src}" alt="${cv.getAttribute('aria-label') || ''}" class="gcanvas" loading="lazy" decoding="async">`;
    });
  }

  document.querySelectorAll('canvas.gcanvas[data-src]').forEach(monta);
})();
