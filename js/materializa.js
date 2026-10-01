/* compai.cl · «Materialización por código».
   La imagen de Grace no se muestra: se arma. Cada píxel baja como un dígito
   cobre o petróleo y, al llegar a su sitio, toma su color real.
   El cursor la desordena; en teléfono el que la dispara es el scroll.
   Cuando todo se asienta el bucle se detiene: no quema batería. */
(() => {
  'use strict';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const COBRE = [200, 121, 65], PETROLEO = [46, 143, 181];
  const DIGITOS = '0123456789';

  function monta(cv) {
    const ctx = cv.getContext('2d', { alpha: false });
    const src = cv.dataset.src;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, celda = 0, cols = 0, filas = 0, P = null, img = null;
    let corriendo = false, listo = false, avance = 0, puntero = null, asentado = 0;

    const im = new Image();
    im.decoding = 'async';
    // La imagen no se pide hasta que el canvas se acerca a la pantalla. Con las
    // tres pedidas de entrada, Lighthouse movil daba 45: tres descargas y tres
    // muestreos de pixeles compitiendo con el primer pintado de la pagina.
    function pedirImagen() {
      if (im.src) return;
      im.src = src;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (e.isIntersecting) { pedirImagen(); o.disconnect(); }
      }), { rootMargin: '400px 0px' }).observe(cv);
    } else pedirImagen();

    function mide() {
      const r = cv.getBoundingClientRect();
      if (!r.width) return false;
      W = cv.width = Math.round(r.width * dpr);
      H = cv.height = Math.round(r.height * dpr);
      // tope de partículas según el área: nunca más de 5.000 en escritorio
      const tope = r.width < 520 ? 2600 : 5000;
      celda = Math.max(3 * dpr, Math.ceil(Math.sqrt(W * H / tope)));
      cols = Math.ceil(W / celda); filas = Math.ceil(H / celda);
      return true;
    }

    function muestrea() {
      // se dibuja la imagen recortada a la caja y se leen sus píxeles una sola vez
      const off = document.createElement('canvas');
      off.width = cols; off.height = filas;
      const o = off.getContext('2d', { willReadFrequently: true });
      const ri = im.naturalWidth / im.naturalHeight, rc = cols / filas;
      let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
      if (ri > rc) { sw = sh * rc; sx = (im.naturalWidth - sw) / 2; }
      else { sh = sw / rc; sy = (im.naturalHeight - sh) / 2.3; }   // encuadre un poco más alto: la cara
      o.drawImage(im, sx, sy, sw, sh, 0, 0, cols, filas);
      const d = o.getImageData(0, 0, cols, filas).data;

      P = new Array(cols * filas);
      for (let y = 0, k = 0; y < filas; y++) for (let x = 0; x < cols; x++, k++) {
        const i = k * 4, r = d[i], g = d[i + 1], b = d[i + 2];
        const luz = (r * .299 + g * .587 + b * .114) / 255;
        P[k] = {
          tx: x * celda, ty: y * celda,
          x: x * celda + (Math.random() - .5) * celda * 7,
          y: y * celda - H * (.55 + Math.random() * 1.25),
          r, g, b,
          mar: luz > .46 ? COBRE : PETROLEO,                 // claro = cobre · oscuro = petróleo
          d: Math.random() * .42 + (y / filas) * .3,          // cae de arriba hacia abajo
          dig: Math.random() < .035 ? DIGITOS[(Math.random() * 10) | 0] : null,
          ox: 0, oy: 0
        };
      }
      listo = true;
    }

    function pinta() {
      ctx.fillStyle = '#07090C';
      ctx.fillRect(0, 0, W, H);
      const px = puntero ? puntero.x : -1e9, py = puntero ? puntero.y : -1e9;
      const radio = 72 * dpr, radio2 = radio * radio;
      let digitos = '';
      ctx.font = `${Math.max(9, celda * 1.05)}px 'IBM Plex Mono',monospace`;
      ctx.textBaseline = 'top';

      for (let k = 0; k < P.length; k++) {
        const p = P[k];
        const t = Math.max(0, Math.min(1, (avance - p.d) / (1 - p.d)));
        const e = t * t * (3 - 2 * t);                        // suavizado
        let x = p.x + (p.tx - p.x) * e, y = p.y + (p.ty - p.y) * e;

        if (puntero) {                                        // el cursor empuja
          const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
          if (d2 < radio2 && d2 > .01) {
            const f = (1 - Math.sqrt(d2) / radio) * 34 * dpr, inv = 1 / Math.sqrt(d2);
            p.ox += dx * inv * f * .18; p.oy += dy * inv * f * .18;
          }
        }
        p.ox *= .88; p.oy *= .88;
        x += p.ox; y += p.oy;

        if (e < .82) {
          const m = p.mar, a = .18 + e * .72;
          ctx.fillStyle = `rgba(${m[0]},${m[1]},${m[2]},${a})`;
          if (p.dig && e < .7) digitos += '1';                // marca: se dibuja aparte
        } else {
          const a = (e - .82) / .18;
          const m = p.mar;
          ctx.fillStyle = `rgb(${Math.round(m[0] + (p.r - m[0]) * a)},${Math.round(m[1] + (p.g - m[1]) * a)},${Math.round(m[2] + (p.b - m[2]) * a)})`;
        }
        ctx.fillRect(x, y, celda + .6, celda + .6);
      }

      if (avance < 1 && digitos) {                            // los dígitos, solo mientras cae
        ctx.fillStyle = 'rgba(255,178,92,.85)';
        for (let k = 0; k < P.length; k++) {
          const p = P[k]; if (!p.dig) continue;
          const t = Math.max(0, Math.min(1, (avance - p.d) / (1 - p.d)));
          if (t > .72) continue;
          const e = t * t * (3 - 2 * t);
          ctx.fillText(p.dig, p.x + (p.tx - p.x) * e + p.ox, p.y + (p.ty - p.y) * e + p.oy);
        }
      }
    }

    function cuadro() {
      if (!corriendo) return;
      if (avance < 1) avance = Math.min(1, avance + .011);
      pinta();
      // ya puesta en su sitio y sin cursor encima: se dan unas vueltas para que
      // el empuje residual se apague y el bucle se duerme
      if (avance >= 1 && !puntero) {
        if (++asentado > 36) { dibujaPlano(); corriendo = false; return; }  // ya asentada: la foto nitida
      } else asentado = 0;
      requestAnimationFrame(cuadro);
    }
    function despierta() {
      asentado = 0;
      if (!corriendo && listo) { corriendo = true; requestAnimationFrame(cuadro); }
    }

    function dibujaPlano() {                                  // sin movimiento: la imagen, y ya
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      const ri = im.naturalWidth / im.naturalHeight, rc = W / H;
      let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
      if (ri > rc) { sw = sh * rc; sx = (im.naturalWidth - sw) / 2; }
      else { sh = sw / rc; sy = (im.naturalHeight - sh) / 2.3; }
      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
    }

    im.addEventListener('load', () => {
      if (quieto.matches) { dibujaPlano(); return; }
      if (!mide()) return;
      muestrea();
      pinta();
      const esTactil = matchMedia('(hover: none)').matches;
      if (esTactil) {
        // en teléfono manda el scroll: la posición de la sección decide el avance
        const alScroll = () => {
          const r = cv.getBoundingClientRect();
          const p = 1 - (r.top - innerHeight * .15) / (innerHeight * .72);
          const antes = avance;
          avance = Math.max(0, Math.min(1, p));
          // una vez armada se deja quieta: despertarla al seguir bajando
          // volvia a dibujar los cuadritos sobre la foto ya nitida
          if (avance > 0 && (avance < 1 || antes < 1)) despierta();
        };
        addEventListener('scroll', alScroll, { passive: true });
        alScroll();
      } else {
        new IntersectionObserver((es, o) => es.forEach(e => {
          if (e.isIntersecting) { despierta(); o.disconnect(); }
        }), { threshold: .22 }).observe(cv);
      }
      cv.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        puntero = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
        despierta();
      });
      cv.addEventListener('pointerleave', () => { puntero = null; despierta(); });
      addEventListener('resize', () => {
        if (!mide()) return; muestrea(); despierta();
      }, { passive: true });
    });
    im.addEventListener('error', () => {
      cv.outerHTML = `<img src="${src}" alt="${cv.getAttribute('aria-label') || ''}" class="gcanvas" loading="lazy" decoding="async">`;
    });
  }

  document.querySelectorAll('canvas.gcanvas[data-src]').forEach(monta);
})();
