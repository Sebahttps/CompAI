/* compai.cl · comportamiento del sitio.
   Sin dependencias. Todo lo que anima respeta prefers-reduced-motion. */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const DATOS = window.COMPAI || {};

  /* Nada decorativo arranca antes de que la pagina termine de cargar.
     Medido el 01-10-2026 en compai.cl: con el nodo 3D girando desde el primer
     frame, Lighthouse movil daba 45 de rendimiento y 2.070 ms de bloqueo del
     hilo principal. Lo que cuesta no es dibujar: es dibujar MIENTRAS el
     navegador todavia esta armando la pagina. */
  const alCalmarse = fn => {
    const lanzar = () => (window.requestIdleCallback || (f => setTimeout(f, 220)))(fn, { timeout: 1800 });
    if (document.readyState === 'complete') lanzar();
    else addEventListener('load', lanzar, { once: true });
  };

  /* ── hero: reproducir solo cuando se puede y está a la vista ───────── */
  (() => {
    const v = $('#heroVideo');
    if (!v) return;
    const arranca = () => { if (quieto.matches) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if (quieto.matches) { v.removeAttribute('autoplay'); v.pause(); }
    else alCalmarse(arranca);   // el poster ya esta a la vista; el video entra despues
    // si el hero sale de pantalla, el video se detiene: no gasta batería ni CPU
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) arranca(); else v.pause();
      }), { threshold: .12 }).observe(v);
    }
    // el sello del centro y el logo de la barra no conviven: mientras el hero
    // esta a la vista manda el sello
    const sello = document.querySelector('.hero .arco');
    if (sello && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e =>
        document.body.classList.toggle('hero-sello', e.intersectionRatio > .35)
      ), { threshold: [0, .35, .8] }).observe(sello);
      document.body.classList.add('hero-sello');
    }
  })();

  /* ── menú a pantalla completa + nodo 3D ────────────────────────────── */
  const btn = $('#nodoBtn'), menu = $('#menu'), lbl = $('#nodoLbl');
  let abierto = false, ultimoFoco = null;
  function setMenu(v) {
    abierto = v;
    document.body.classList.toggle('menu-abierto', v);
    document.body.classList.toggle('bloqueado', v || !!$('.lamina.viva'));
    btn.setAttribute('aria-expanded', String(v));
    btn.setAttribute('aria-label', v ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!v));
    lbl.textContent = v ? 'Cerrar' : 'Menú';
    if (v) { ultimoFoco = document.activeElement; const a = menu.querySelector('a'); a && a.focus({ preventScroll: true }); }
    else if (ultimoFoco) { ultimoFoco.focus({ preventScroll: true }); ultimoFoco = null; }
  }
  btn.addEventListener('click', () => setMenu(!abierto));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  (() => { // icosaedro
    const cv = $('#nodoCv'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const t = (1 + Math.sqrt(5)) / 2;
    const V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
      .map(v => { const l = Math.hypot(...v); return v.map(c => c / l); });
    const E = [];
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++)
      if (Math.hypot(V[i][0]-V[j][0], V[i][1]-V[j][1], V[i][2]-V[j][2]) < 1.1) E.push([i, j]);
    let ax = .5, ay = 0, vel = .008, obj = .008, esc = 1, objEsc = 1, sobre = false;
    const on = () => sobre = true, off = () => sobre = false;
    btn.addEventListener('pointerenter', on); btn.addEventListener('pointerleave', off);
    btn.addEventListener('focus', on); btn.addEventListener('blur', off);
    let ultimo = 0;
    function dibuja(t) {
      requestAnimationFrame(dibuja);
      if (document.hidden) return;          // pestana en segundo plano: no se dibuja
      if (t - ultimo < 32) return;          // 30 fps bastan para una pieza de 64 px
      const dt = ultimo ? Math.min((t - ultimo) / 16.7, 4) : 1;
      ultimo = t;
      obj = abierto ? .02 : sobre ? .045 : .008;
      objEsc = abierto ? 1.08 : sobre ? 1.18 : 1;
      vel += (obj - vel) * .08 * dt; esc += (objEsc - esc) * .12 * dt;
      if (!quieto.matches) { ay += vel * dt; ax += vel * .35 * dt; }
      const W = cv.width, H = cv.height, R = W * .3 * esc, cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      const cA = Math.cos(ax), sA = Math.sin(ax), cB = Math.cos(ay), sB = Math.sin(ay);
      const P = V.map(([x, y, z]) => {
        const x1 = x * cB + z * sB, z1 = -x * sB + z * cB;
        const y1 = y * cA - z1 * sA, z2 = y * sA + z1 * cA;
        const p = 2.6 / (2.6 - z2);
        return [cx + x1 * R * p, cy + y1 * R * p, z2];
      });
      const col = abierto ? '200,121,65' : '46,143,181';          // abierto = cobre · cerrado = petróleo
      E.forEach(([i, j]) => {
        const z = (P[i][2] + P[j][2]) / 2;
        ctx.strokeStyle = `rgba(${col},${.25 + .45 * (z + 1) / 2})`;
        ctx.lineWidth = W / 64; ctx.beginPath();
        ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
      });
      P.map((p, i) => [p, i]).sort((a, b) => a[0][2] - b[0][2]).forEach(([p]) => {
        const z = (p[2] + 1) / 2;
        ctx.fillStyle = `rgba(${abierto ? '242,180,90' : '120,197,227'},${.45 + .55 * z})`;
        ctx.beginPath(); ctx.arc(p[0], p[1], W * (.028 + .03 * z) * esc, 0, 7); ctx.fill();
      });
    }
    alCalmarse(() => dibuja(0));
  })();

  /* ── / 01 · máquina de escribir corta ──────────────────────────────── */
  (() => {
    const el = $('#ofit'); if (!el) return;
    const l1 = el.dataset.l1 || '', l2 = el.dataset.l2 || '';
    if (quieto.matches) { el.innerHTML = `<span>${l1}</span><br><span class="l2">${l2}</span>`; return; }
    let hecho = false;
    const corre = () => {
      if (hecho) return; hecho = true;
      el.innerHTML = '<span class="a"></span><br><span class="l2 b"></span><span class="cur" aria-hidden="true"></span>';
      const a = el.querySelector('.a'), b = el.querySelector('.b'), cur = el.querySelector('.cur');
      let i = 0, j = 0;
      const paso = () => {
        if (i < l1.length) { a.textContent = l1.slice(0, ++i); setTimeout(paso, 34); }
        else if (j < l2.length) { b.textContent = l2.slice(0, ++j); setTimeout(paso, 40); }
        else setTimeout(() => cur.remove(), 1400);
      };
      setTimeout(paso, 260);
    };
    // el texto real ya está en el HTML para SEO; se reemplaza al entrar en pantalla
    new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { corre(); o.disconnect(); } }),
      { threshold: .35 }).observe(el);
  })();

  /* ── / 01 · lluvia binaria tenue ───────────────────────────────────── */
  (() => {
    const cv = $('#lluvia'); if (!cv || quieto.matches) return;
    const ctx = cv.getContext('2d');
    let cols = [], W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), paso = 15, vivo = false;
    function mide() {
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      paso = Math.round(15 * dpr);
      cols = Array.from({ length: Math.ceil(W / paso) }, () => Math.random() * -H);
      ctx.font = `${12 * dpr}px 'IBM Plex Mono',monospace`;
    }
    function cuadro() {
      if (!vivo) return;
      ctx.fillStyle = 'rgba(11,8,6,.14)'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < cols.length; i++) {
        const y = cols[i];
        ctx.fillStyle = Math.random() < .08 ? 'rgba(255,178,92,.9)' : 'rgba(120,197,227,.72)';
        ctx.fillText(Math.random() < .5 ? '0' : '1', i * paso, y);
        cols[i] = y > H && Math.random() > .975 ? 0 : y + paso;
      }
      requestAnimationFrame(cuadro);
    }
    addEventListener('resize', mide, { passive: true });
    mide();
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !vivo) { vivo = true; cuadro(); } else if (!e.isIntersecting) vivo = false;
    }), { threshold: .05 }).observe(cv);
  })();

  /* ── / 03 · fondo de números flotantes ─────────────────────────────── */
  (() => {
    const cv = $('#numeros'); if (!cv || quieto.matches) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, pts = [], vivo = false;
    function mide() {
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      const n = Math.min(150, Math.round(W * H / (26000 * dpr)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        v: (.1 + Math.random() * .45) * dpr, s: (8 + Math.random() * 9) * dpr,
        c: Math.random() < .22 ? '200,121,65' : '46,143,181',
        t: String(Math.floor(Math.random() * 10)), a: .12 + Math.random() * .35
      }));
    }
    function cuadro() {
      if (!vivo) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.y -= p.v; if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; p.t = String(Math.floor(Math.random() * 10)); }
        ctx.font = `${p.s}px 'IBM Plex Mono',monospace`;
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fillText(p.t, p.x, p.y);
      }
      requestAnimationFrame(cuadro);
    }
    addEventListener('resize', mide, { passive: true });
    mide();
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !vivo) { vivo = true; cuadro(); } else if (!e.isIntersecting) vivo = false;
    }), { threshold: .02 }).observe(cv);
  })();

  /* ── los videos de adorno: a media velocidad el de Grace, y todos
        empiezan al acercarse, nunca al cargar ─────────────────────────── */
  (() => {
    const vids = $$('#graceFondo, .cuore-video video, .ia-ticks video');
    if (!vids.length) return;
    // la velocidad se fija AHORA y otra vez al cargar los datos: si solo se
    // fijara al reproducir, el video del fondo de Grace arranca a 1x el primer
    // cuadro y se nota el tiron
    const fijaVel = v => {
      const vel = parseFloat(v.dataset.velocidad);
      if (vel > 0) { try { v.playbackRate = vel; } catch (_) {} }
    };
    vids.forEach(v => { fijaVel(v); v.addEventListener('loadeddata', () => fijaVel(v)); });
    const arranca = v => {
      fijaVel(v);
      if (quieto.matches) { v.removeAttribute('autoplay'); v.pause(); return; }
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    };
    if (quieto.matches) { vids.forEach(arranca); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.preload = 'auto'; alCalmarse(() => arranca(e.target)); }
      else e.target.pause();
    }), { rootMargin: '200px 0px', threshold: .05 });
    vids.forEach(v => io.observe(v));
  })();

  /* ── / 01 · el enlace de la ficha: el bloque barre al entrar en pantalla ── */
  (() => {
    const e = $('.enl.bloque'); if (!e) return;
    if (quieto.matches) { e.classList.add('corre'); return; }
    new IntersectionObserver((es, o) => es.forEach(x => {
      if (x.isIntersecting) { setTimeout(() => e.classList.add('corre'), 520); o.disconnect(); }
    }), { threshold: .6 }).observe(e);
  })();

  /* ── apariciones al hacer scroll ───────────────────────────────────── */
  (() => {
    const els = $$('.ap'); if (!els.length) return;
    if (quieto.matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('vista')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('vista'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  })();

  /* ── / 04 · láminas de servicio (capa fija, scroll propio) ─────────── */
  (() => {
    const lam = $('#lamina'); if (!lam) return;
    const servicios = DATOS.servicios || [];
    const porSlug = Object.fromEntries(servicios.map(s => [s.slug, s]));
    let activa = null, foco = null, y0 = null;

    function pinta(s) {
      $('#lamCod').textContent = `/ ${s.codigo} — ${s.titulo}`;
      $('#lamEt').textContent = s.etiqueta;
      $('#lamTit').textContent = s.titulo;
      $('#lamBaj').textContent = s.bajada;
      $('#lamTexto').innerHTML = (s.lamina || []).map(p => `<p>${p}</p>`).join('');
      $('#lamVin').innerHTML = (s.vinetas || []).map(v => `<li>${v}</li>`).join('');
      const img = $('#lamImg');
      if (s.imagen) { img.src = s.imagen; img.alt = s.imagen_alt || s.titulo; img.parentElement.hidden = false; }
      else img.parentElement.hidden = true;
      $('#lamCta').textContent = s.cta || 'Cotizar';
    }
    function abre(slug, empujarUrl = true) {
      const s = porSlug[slug]; if (!s) return;
      pinta(s); activa = slug; foco = document.activeElement;
      lam.classList.add('viva'); lam.setAttribute('aria-hidden', 'false');
      document.body.classList.add('bloqueado');
      lam.scrollTop = 0;
      $('#lamX').focus({ preventScroll: true });
      if (empujarUrl && location.hash !== '#servicio-' + slug) history.pushState({ slug }, '', '#servicio-' + slug);
    }
    function cierra(empujarUrl = true) {
      if (!activa) return;
      activa = null;
      lam.classList.remove('viva'); lam.setAttribute('aria-hidden', 'true');
      document.body.classList.toggle('bloqueado', abierto);
      if (foco) { foco.focus({ preventScroll: true }); foco = null; }
      if (empujarUrl && location.hash.startsWith('#servicio-')) history.pushState({}, '', location.pathname + '#creative');
    }
    $$('.serv').forEach(b => b.addEventListener('click', () => abre(b.dataset.slug)));
    $('#lamX').addEventListener('click', () => cierra());
    addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (activa) { cierra(); e.preventDefault(); }
      else if (abierto) { setMenu(false); e.preventDefault(); }
    });
    // cerrar deslizando hacia abajo desde arriba del todo
    lam.addEventListener('touchstart', e => { y0 = lam.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    lam.addEventListener('touchmove', e => {
      if (y0 === null) return;
      if (e.touches[0].clientY - y0 > 110) { cierra(); y0 = null; }
    }, { passive: true });
    addEventListener('popstate', () => {
      const m = location.hash.match(/^#servicio-(.+)$/);
      if (m && porSlug[m[1]]) abre(m[1], false); else cierra(false);
    });
    const m = location.hash.match(/^#servicio-(.+)$/);
    if (m && porSlug[m[1]]) addEventListener('load', () => abre(m[1], false), { once: true });
  })();

  /* ── / 05 · formulario ─────────────────────────────────────────────── */
  (() => {
    const f = $('#formLead'); if (!f) return;
    const aviso = $('#formAviso'), btnEnviar = $('#formBtn');
    const url = (DATOS.sitio && DATOS.sitio.formEndpoint) || '';
    const texto = (DATOS.sitio && DATOS.sitio.inbox) || {};

    function muestra(msg, mal) {
      aviso.textContent = msg;
      aviso.classList.toggle('mal', !!mal);
      aviso.hidden = false;
      aviso.scrollIntoView({ block: 'nearest', behavior: quieto.matches ? 'auto' : 'smooth' });
    }
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f).entries());
      if (d.sitioweb) return;                       // campo trampa: bot
      if (!d.nombre || !d.correo) { muestra('Falta el nombre o el correo.', true); return; }

      if (!url) {                                   // respaldo mientras no exista el web app
        const cuerpo = [
          `Nombre: ${d.nombre}`, `Correo: ${d.correo}`, `Teléfono: ${d.telefono || '—'}`,
          `Organismo: ${d.organismo || '—'}`, '', d.mensaje || ''
        ].join('\n');
        location.href = `mailto:hola@compai.cl?subject=${encodeURIComponent('[compai.cl] Lead — ' + d.nombre)}&body=${encodeURIComponent(cuerpo)}`;
        muestra('Te abrimos el correo con los datos listos. Si no se abrió, escríbenos a hola@compai.cl.');
        return;
      }
      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando…';
      try {
        // text/plain evita el preflight CORS contra Apps Script
        await fetch(url, { method: 'POST', body: JSON.stringify({ ...d, origen: 'compai.cl' }),
                           headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        f.reset();
        muestra(texto.exito || 'Listo, tu mensaje llegó.');
        btnEnviar.textContent = 'Enviado';
      } catch (_) {
        muestra(texto.error || 'No se pudo enviar. Escríbenos a hola@compai.cl.', true);
        btnEnviar.disabled = false;
        btnEnviar.textContent = texto.boton || 'Enviar';
      }
    });
  })();
})();
