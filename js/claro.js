/* compai.cl · comportamiento del tema claro.
   Sin dependencias. Todo lo que se mueve respeta prefers-reduced-motion:
   con movimiento reducido ningún video arranca (queda el póster). */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const DATOS = window.COMPAI || {};

  /* Nada decorativo arranca antes de que la página termine de cargar
     (medido en 2026-10 en compai.cl: lo que cuesta es dibujar MIENTRAS el
     navegador arma la página). */
  const alCalmarse = fn => {
    const lanzar = () => (window.requestIdleCallback || (f => setTimeout(f, 220)))(fn, { timeout: 1800 });
    if (document.readyState === 'complete') lanzar();
    else addEventListener('load', lanzar, { once: true });
  };

  /* ── videos fundidos: reproducir solo a la vista, nunca con movimiento reducido ── */
  (() => {
    const vids = $$('video[data-auto]');
    if (!vids.length) return;
    const arranca = v => { if (quieto.matches) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if (quieto.matches) vids.forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'metadata'; arranca(v); }
        else v.pause();
      }), { threshold: .12, rootMargin: '120px 0px' });
      vids.forEach(v => io.observe(v));
    } else alCalmarse(() => vids.forEach(arranca));
    const hero = $('#heroVideo');
    if (hero) alCalmarse(() => arranca(hero));
  })();

  /* ── la barra de iconos: en el hero arriba; al bajar, atracada a la izquierda ── */
  (() => {
    const nav = $('.hero-nav'), dock = $('.ibar-dock');
    if (!nav || !dock || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(es => es.forEach(e =>
      document.body.classList.toggle('dock-on', !e.isIntersecting)
    ), { threshold: 0 }).observe(nav);
  })();

  /* ── radar: «quedan N h/d» desde la hora de cierre y copiar el ID ─────── */
  (() => {
    const pad = n => String(n).padStart(2, '0');
    for (const q of $$('.que[data-cierre]')) {
      const m = q.dataset.cierre.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
      if (!m) continue;
      const fin = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
      const ms = fin - Date.now();
      const txt = q.querySelector('.qt'); if (!txt) continue;
      if (ms <= 0) { txt.textContent = 'cerrada'; q.classList.add('cerrada'); continue; }
      const h = Math.floor(ms / 36e5);
      txt.textContent = h < 1 ? 'queda menos de 1 h' : h < 48 ? `quedan ${h} h` : `quedan ${Math.floor(h / 24)} d`;
    }
    for (const b of $$('.glista .cp')) b.addEventListener('click', async () => {
      const id = b.dataset.id; if (!id) return;
      try { await navigator.clipboard.writeText(id); b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 1200); } catch (_) { }
    });
  })();

  /* ── / 05 Run · el formulario (mismo mecanismo que el sitio anterior:
         POST al web app de Apps Script, adjuntos en base64, correo de respaldo) ── */
  (() => {
    const f = $('#formLead'); if (!f) return;
    const aviso = $('#formAviso'), btnEnviar = $('#formBtn');
    const url = (DATOS.sitio && DATOS.sitio.formEndpoint) || '';
    const texto = (DATOS.sitio && DATOS.sitio.inbox) || {};
    const campoArch = $('#f-archivos'), listaArch = $('#f-lista');
    const MAX_ARCH = 5, MAX_UNO = 10 * 1024 * 1024, MAX_TODOS = 20 * 1024 * 1024;
    const OK_EXT = ['pdf','doc','docx','xls','xlsx','odt','ods','rtf','txt','jpg','jpeg','png','webp','zip'];
    const kb = n => n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
    function elegidos() {
      if (!campoArch) return { lista: [], malos: [] };
      const lista = [], malos = []; let total = 0;
      for (const ar of Array.from(campoArch.files || [])) {
        const ext = (ar.name.split('.').pop() || '').toLowerCase();
        if (!OK_EXT.includes(ext)) { malos.push(ar.name + ' — tipo no permitido'); continue; }
        if (ar.size > MAX_UNO) { malos.push(ar.name + ' — pasa de 10 MB'); continue; }
        if (lista.length >= MAX_ARCH) { malos.push(ar.name + ' — van 5, el tope'); continue; }
        if (total + ar.size > MAX_TODOS) { malos.push(ar.name + ' — el envío pasa de 20 MB'); continue; }
        total += ar.size; lista.push(ar);
      }
      return { lista, malos };
    }
    function pintaArch() {
      if (!listaArch) return;
      const { lista, malos } = elegidos();
      listaArch.innerHTML =
        lista.map(a => `<li>${a.name.replace(/[<>&]/g, '')} <span>${kb(a.size)}</span></li>`).join('') +
        malos.map(m => `<li class="mal">${m.replace(/[<>&]/g, '')}</li>`).join('');
    }
    if (campoArch) campoArch.addEventListener('change', pintaArch);
    const aBase64 = ar => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1] || '');
      r.onerror = () => rej(r.error);
      r.readAsDataURL(ar);
    });
    function muestra(msg, mal) {
      aviso.textContent = msg; aviso.classList.toggle('mal', !!mal); aviso.hidden = false;
      aviso.scrollIntoView({ block: 'nearest', behavior: quieto.matches ? 'auto' : 'smooth' });
    }
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f).entries());
      if (d.sitioweb) return;                       // campo trampa: bot
      if (!d.nombre || !d.correo) { muestra('Falta el nombre o el correo.', true); return; }
      const correo = () => {
        const cuerpo = [
          `Nombre y apellido: ${d.nombre}`, `Correo electronico: ${d.correo}`,
          `Telefono de contacto: ${d.telefono || '-'}`, `ID Mercado Publico: ${d.idmp || '-'}`,
          '', 'Requerimientos:', d.mensaje || '-', '',
          'Adjunta aqui las bases, el anexo o la orden de compra.'
        ].join('\n');
        const asunto = `Compra Agil — ${d.idmp || d.nombre}`;
        location.href = `mailto:hola@compai.cl?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
      };
      if (!url) { correo(); muestra('Te abrimos el correo con los datos listos. Adjunta ahi las bases u orden de compra.'); return; }
      const { lista, malos } = elegidos();
      if (malos.length) { muestra('Revisa los archivos: ' + malos.join(' · '), true); return; }
      btnEnviar.disabled = true;
      btnEnviar.textContent = lista.length ? 'Subiendo…' : 'Enviando…';
      try {
        const archivos = [];
        for (const ar of lista) archivos.push({ nombre: ar.name, b64: await aBase64(ar) });
        const res = await fetch(url, { method: 'POST', body: JSON.stringify({ ...d, archivos, origen: 'compai.cl' }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        let r = {}; try { r = await res.json(); } catch (_) { }
        if (!res.ok || r.ok === false) throw new Error(r.error || 'respuesta');
        f.reset(); pintaArch();
        const subidos = Number(r.adjuntos || 0);
        if (lista.length && subidos < lista.length) {
          correo();
          muestra('Recibimos tu mensaje, pero ' + (lista.length - subidos) + ' archivo(s) no se pudieron guardar. Te abrimos el correo para adjuntarlos.', true);
        } else {
          muestra(subidos ? `Listo. Recibimos tu mensaje y ${subidos} archivo(s).` : (texto.exito || 'Listo, tu mensaje llegó.'));
        }
        btnEnviar.textContent = 'Enviado';
      } catch (_) {
        correo();
        muestra(texto.error || 'No se pudo enviar. Escríbenos a hola@compai.cl.', true);
        btnEnviar.disabled = false;
        btnEnviar.textContent = texto.boton || 'Enviar';
      }
    });
  })();

  /* ── catálogo · carrusel (portafolio.html) ───────────────────────────── */
  (() => {
    const rail = $('#rail'); if (!rail) return;
    const cards = $$('.card', rail);
    const vid = c => c.querySelector('video');
    const toca = i => cards.forEach((c, k) => { const v = vid(c); if (!v) return; if (k === i - 1 && !quieto.matches) { if (v.preload === 'none') v.preload = 'metadata'; const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); });
    const sel = (i, desplaza = true) => {
      const r = document.getElementById('t' + i); if (r) r.checked = true;
      const c = cards[i - 1];
      if (c && desplaza) rail.scrollTo({ left: c.offsetLeft - rail.offsetLeft - rail.clientWidth * (innerWidth > 860 ? .2 : .06), behavior: quieto.matches ? 'auto' : 'smooth' });
      toca(i);
    };
    const cur = () => { for (let i = 1; i <= cards.length; i++) if (document.getElementById('t' + i).checked) return i; return 1; };
    cards.forEach(c => c.addEventListener('click', () => sel(+c.dataset.i)));
    $$('.dot').forEach(d => d.addEventListener('click', () => sel(+d.dataset.i)));
    const p = $('#prev'), n = $('#next');
    if (p) p.addEventListener('click', () => sel(Math.max(1, cur() - 1)));
    if (n) n.addEventListener('click', () => sel(Math.min(cards.length, cur() + 1)));
    // #L3, #escena-03 (de los enlaces viejos: la escena 03 ilustra la L3) o #t3 abren esa línea
    const porHash = () => {
      const h = location.hash.replace('#', '');
      let i = 0;
      const m = h.match(/^(?:L|t)(\d)$/i);
      if (m) i = +m[1];
      else { const e = h.match(/^escena-0?(\d)$/); if (e) { const c = cards.find(x => x.dataset.escena === String(e[1]).padStart(2, '0')); if (c) i = +c.dataset.i; } }
      if (i >= 1 && i <= cards.length) { sel(i, true); return true; }
      return false;
    };
    addEventListener('hashchange', porHash);
    if (!porHash()) alCalmarse(() => toca(1));
  })();
})();
