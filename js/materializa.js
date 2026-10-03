/* compai.cl · «Materialización por código» — v2.
 *
 * QUÉ PASA EN PANTALLA, EN ORDEN
 *   1. El código CAE: columnas de cifras azules de siete segmentos bajan y se
 *      apilan de arriba hacia abajo, cada columna a su ritmo.
 *   2. La foto entra COLUMNA A COLUMNA, de izquierda a derecha, tomando el
 *      color real de cada píxel bajo el código.
 *   3. Queda «casi materializada»: el código no desaparece del todo. Cuánto se
 *      deja ver la foto lo decide `data-revelado` (0 = nada · 1 = completa).
 *
 * Se engancha solo a cada <canvas class="gcanvas" data-src="…"> y no necesita
 * ninguna llamada desde fuera.
 *
 * Fuente del efecto: `grace-sitio2.html` de la carpeta de medios —la cifra de
 * siete segmentos, la paleta azul y la idea de «revelado» salen de ahí tal
 * cual—. Lo que cambia es el enganche: allá era una pantalla completa, acá son
 * tres recuadros que conviven con el resto de la página.
 *
 * RENDIMIENTO, Y NO ES UN DETALLE
 * El 01-10-2026 este sitio dio 45 de rendimiento en vivo por animar antes de
 * tiempo. Así que: nada arranca hasta que el canvas se acerca, el bucle se
 * duerme cuando la imagen queda quieta, y con `prefers-reduced-motion` se
 * dibuja la foto y se acabó.
 */
(() => {
  'use strict';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── cifra de siete segmentos, dibujada a mano ─────────────────────────
     Sin fuentes externas a propósito: una cifra de reloj digital no existe en
     ninguna tipografía de sistema, y cargar una web font para esto costaría
     más que dibujarla. */
  const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc',
                 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

  function cifra(g, d, x, yb, h) {
    const sg = SEGS[d]; if (!sg) return;
    const w = h * .52, lw = Math.max(.75, h * .11), gp = lw * .7;
    const t = yb - h, m = yb - h / 2;
    const L = {
      a: [x + gp, t, x + w - gp, t], b: [x + w, t + gp, x + w, m - gp],
      c: [x + w, m + gp, x + w, yb - gp], d: [x + gp, yb, x + w - gp, yb],
      e: [x, m + gp, x, yb - gp], f: [x, t + gp, x, m - gp],
      g: [x + gp, m, x + w - gp, m]
    };
    g.lineWidth = lw; g.lineCap = 'butt'; g.beginPath();
    for (const k of sg) { const q = L[k]; g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); }
    g.stroke();
  }

  const AZULES = ['#2f6db0', '#5aa6e8', '#cfe9ff'];   // profundo · medio · brillante

  function monta(cv) {
    const ctx = cv.getContext('2d', { alpha: true });
    const src = cv.dataset.src;
    const revelado = Math.max(0, Math.min(1, parseFloat(cv.dataset.revelado) || 0.82));
    // Donde se planta la figura dentro de la banda. El resto queda transparente
    // y deja ver el campo de codigo de la seccion.
    const ANCLAJES = {
      derecha:   { x0: .54, x1: 1 },
      izquierda: { x0: 0,   x1: .46 },
      cubrir:    { x0: 0,   x1: 1 }
    };
    const ancla = ANCLAJES[cv.dataset.anclaje] || ANCLAJES.cubrir;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    let W = 0, H = 0, cel = 0, cols = 0, filas = 0;
    let pix = null;        // color real de cada celda
    let col = null;        // estado de cada columna
    let im = null, listo = false, corriendo = false, dormido = 0;
    // `desfase` guarda el tiempo ya corrido. Sin el, cualquier resize —y el
    // navegador dispara uno al capturar una seccion mas alta que la ventana—
    // rebobinaba la materializacion a cero y la foto desaparecia. (03-10-2026)
    let t0 = 0, desfase = 0, tAhora = 0, puntero = null;

    function mide() {
      const r = cv.getBoundingClientRect();
      if (!r.width) return false;
      W = cv.width = Math.round(r.width * dpr);
      H = cv.height = Math.round(r.height * dpr);
      // el alto de la cifra manda: ni tan chica que sea ruido, ni tan grande
      // que se cuenten los dígitos
      cel = Math.max(7 * dpr, Math.round((r.width < 420 ? 9 : 11) * dpr));
      cols = Math.ceil(W / cel);
      filas = Math.ceil(H / (cel * 1.18));
      return true;
    }

    let rec = null;   // recorte de la foto que calza con el canvas

    function franja() {                      // en columnas
      return { desde: Math.floor(ancla.x0 * cols), hasta: Math.ceil(ancla.x1 * cols) };
    }

    function encuadre() {
      const anchoFranja = Math.max(1, (ancla.x1 - ancla.x0) * W);
      const ri = im.naturalWidth / im.naturalHeight, rc = anchoFranja / H;
      let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
      if (ri > rc) { sw = sh * rc; sx = (im.naturalWidth - sw) / 2; }
      else { sh = sw / rc; sy = (im.naturalHeight - sh) / 2.3; }   // encuadre a la cara
      return { sx, sy, sw, sh };
    }

    let fr = null;    // columnas que ocupa la figura dentro de la banda

    function muestrea() {
      fr = franja();
      const anchoCols = Math.max(1, fr.hasta - fr.desde);
      rec = encuadre();
      // miniatura del tamaño de la retícula de la FRANJA: solo para saber el
      // color y la luz de cada cifra. La foto se dibuja aparte, a resolución
      // completa, porque celda a celda quedaba un mosaico.
      const off = document.createElement('canvas');
      off.width = anchoCols; off.height = filas;
      const o = off.getContext('2d', { willReadFrequently: true });
      o.drawImage(im, rec.sx, rec.sy, rec.sw, rec.sh, 0, 0, anchoCols, filas);
      pix = o.getImageData(0, 0, anchoCols, filas).data;
      fr.ancho = anchoCols;

      col = new Array(cols);
      for (let x = fr.desde; x < fr.hasta; x++) {
        col[x] = {
          caida: -Math.random() * 1.1,          // cuándo empieza a caer el código
          foto: 1.1 + Math.random() * 0.9,      // cuándo empieza a entrar la foto
          vel: 0.75 + Math.random() * 0.7,
          semilla: (Math.random() * 1e6) | 0,
          emp: 0                                 // empuje del cursor
        };
      }
      listo = true;
    }

    function pinta(t) {
      // transparente, no negro: detrás hay un video de campo de código que
      // tiene que verse en la parte que la figura no ocupa
      ctx.clearRect(0, 0, W, H);
      const alto = cel * 1.18;
      const px = puntero ? puntero.x : -1e9;
      const paso = (t * 7) | 0;
      const anchoPx = fr.ancho * cel;
      const escX = rec.sw / anchoPx, escY = rec.sh / H;

      for (let x = fr.desde; x < fr.hasta; x++) {
        const c = col[x]; if (!c) continue;
        const i = x - fr.desde;                  // columna dentro de la franja
        const empuje = puntero ? Math.max(0, 1 - Math.abs(x * cel - px) / (90 * dpr)) : 0;
        c.emp += (empuje - c.emp) * 0.16;
        const dx = c.emp * 16 * dpr * (x % 2 ? 1 : -1);

        const hastaCod = Math.max(0, Math.min(1, (t - c.caida) * c.vel * 0.55)) * filas;
        const hastaFoto = Math.max(0, Math.min(1, (t - c.foto) * c.vel * 0.42)) * filas;

        // 1 · la foto, a resolución completa, recortada a esta columna
        if (hastaFoto > 0) {
          const hFoto = Math.min(H, hastaFoto * alto);
          ctx.globalAlpha = revelado;
          ctx.drawImage(im,
            rec.sx + i * cel * escX, rec.sy, cel * escX, hFoto * escY,
            x * cel + dx, 0, cel + .8, hFoto);
          ctx.globalAlpha = 1;
        }

        // 2 · las cifras, de donde llegó la foto hasta donde llegó el código
        const desde = Math.max(0, Math.floor(hastaFoto) - (revelado > .95 ? 0 : 2));
        for (let y = desde; y <= Math.min(filas - 1, hastaCod); y++) {
          const k = (y * fr.ancho + i) * 4;
          const luz = (pix[k] * .299 + pix[k + 1] * .587 + pix[k + 2] * .114) / 255;
          const borde = Math.min(1, (hastaCod - y) / 2.5);
          const tapada = y < hastaFoto ? revelado : 0;
          const a = (0.22 + luz * 0.72) * borde * (1 - tapada);
          if (a <= 0.02) continue;
          ctx.globalAlpha = a;
          ctx.strokeStyle = AZULES[luz > .62 ? 2 : luz > .3 ? 1 : 0];
          // la cifra de la punta titila: es la que está cayendo
          const d = (c.semilla + x * 31 + y * 17 + (y === (hastaCod | 0) ? paso * 3 : 0)) % 10;
          cifra(ctx, d, x * cel + dx, (y + 1) * alto - alto * .12, cel * .76);
          ctx.globalAlpha = 1;
        }
      }
    }

    function cuadro(ms) {
      if (!corriendo) return;
      if (!t0) t0 = ms;
      tAhora = (ms - t0) / 1000 + desfase;
      pinta(tAhora);
      if (tAhora > 4.2 && !puntero) { if (++dormido > 20) { corriendo = false; return; } }
      else dormido = 0;
      requestAnimationFrame(cuadro);
    }

    function despierta() {
      dormido = 0;
      if (!corriendo && listo) { corriendo = true; requestAnimationFrame(cuadro); }
    }

    function plana() {
      if (!mide()) return;
      const e = encuadre();
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(im, e.sx, e.sy, e.sw, e.sh,
        ancla.x0 * W, 0, (ancla.x1 - ancla.x0) * W, H);
    }

    /* ── la imagen no se pide hasta que el canvas se acerca ──────────── */
    function pedir() {
      if (im) return;
      im = new Image();
      im.decoding = 'async';
      im.addEventListener('load', () => {
        if (quieto.matches) { plana(); return; }
        if (!mide()) return;
        muestrea();
        pinta(0);
        if (matchMedia('(hover: none)').matches) {
          const alScroll = () => {
            const r = cv.getBoundingClientRect();
            if (r.top < innerHeight * .85 && r.bottom > 0) despierta();
          };
          addEventListener('scroll', alScroll, { passive: true });
          alScroll();
        } else {
          new IntersectionObserver((es, o) => es.forEach(e => {
            if (e.isIntersecting) { despierta(); o.disconnect(); }
          }), { threshold: .2 }).observe(cv);
        }
        cv.addEventListener('pointermove', e => {
          const r = cv.getBoundingClientRect();
          puntero = { x: (e.clientX - r.left) * dpr };
          despierta();
        });
        cv.addEventListener('pointerleave', () => { puntero = null; despierta(); });
        addEventListener('resize', () => {
          if (mide()) { muestrea(); desfase = tAhora; t0 = 0; despierta(); }
        }, { passive: true });
      });
      im.addEventListener('error', () => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = cv.getAttribute('aria-label') || '';
        img.className = cv.className;
        img.loading = 'lazy'; img.decoding = 'async';
        cv.replaceWith(img);
      });
      im.src = src;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (e.isIntersecting) { pedir(); o.disconnect(); }
      }), { rootMargin: '400px 0px' }).observe(cv);
    } else pedir();
  }

  document.querySelectorAll('canvas.gcanvas[data-src]').forEach(monta);
})();
