/* SOUL · el enlace publico: compai.cl/soul/s/#<codigo>
   Lee el codigo del # (mismo formato que codificar() en sitio.js), arma el sitio completo de la persona
   y conecta el formulario de cotizacion. Sin servidor, sin intervencion, sin CDN.
   El render es el MISMO de la vista previa de preguntas.html (SOUL_SITIO.html): una sola fuente.
   Fotos: si existe soul/fotos/<slug>/fotos.json (y el slug esta en soul/fotos/index.json) el sitio las usa;
   si no existe, tarda o falla una imagen, cae a lo de siempre (la ilustracion del oficio) sin error.
   Ejecutar: abrir soul/s/index.html#<codigo> desde un servidor estatico
   (p. ej. `python -m http.server` en sitio/compai y ir a /soul/s/#...). */
(function () {
  'use strict';
  var S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA;
  var CFG = window.SOUL_CFG || { endpoint: '', whatsapp: '56962469977' };
  var raiz = document.getElementById('sitio');
  // #<código> abre el inicio; #<código>&s=<n> abre la página del servicio n (planes sun y vibe, 24-11-2026)
  var RUTA = /^#([A-Za-z0-9_-]{10,20000})(?:&s=(\d{1,2}))?$/;
  var m = RUTA.exec(location.hash || '');
  var ST = null, CODIGO = m ? m[1] : '', PAG = m && m[2] != null ? Number(m[2]) : null;
  if (m) { try { ST = S.decodificar(m[1]); } catch (_) { ST = null; } }

  function vacio() {
    document.title = 'Este enlace no abre un sitio';
    raiz.innerHTML = '<div class="vacio"><h1>Este enlace no abre ningún sitio.</h1><p>Quizá se cortó al copiarlo. Pídele a quien te lo mandó que lo envíe completo, otra vez.</p><a href="../">Conocer SOUL</a></div>';
  }
  // Un enlace sin nombre ni oficio no es un sitio: se dice, no se pinta un sitio vacio.
  if (!ST || !ST.name.trim() || ST.oficio == null) { vacio(); return; }

  var nombre = M.marcaNombre(ST), titulo = nombre + ' · ' + S.oficioNombre(ST, D);
  document.title = titulo;
  var su = S.sup(ST, D, M), tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', su.bg);
  document.body.style.background = su.bg;

  function reducido() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches; }

  /* ───────── las fotos de la persona (opcional) ───────── */
  var slug = S.slug(ST);
  function traerFotos() { return S.traerFotos(slug, '../fotos/'); }

  var enviando = false, irA = null;
  /* Pinta el sitio (con o sin fotos) y conecta formulario y movimiento. */
  function armar(F) {
    raiz.innerHTML = S.html(ST, { D: D, M: M, cfg: CFG, mem: null, base: '../', vivo: true, fotos: F, fotosBase: F ? '../fotos/' + slug + '/' : '', enlace: CODIGO, pag: PAG }).replace('class="vp', 'class="vp pleno');
    var sp = raiz.querySelector('#vp-servicio .sp-h');
    document.title = sp ? sp.textContent + ' · ' + nombre : titulo;
    var ico = document.querySelector('link[rel="icon"]');
    try { if (ico) { ico.type = 'image/svg+xml'; ico.href = 'data:image/svg+xml,' + encodeURIComponent(M.monograma(S.selloDe(ST, D, M, F && F.sello), 'color', null, 'fv', ' width="64" height="64"', true)); } } catch (_) { /* el ícono de siempre */ }
    if (window.SOUL_MOV) window.SOUL_MOV.iniciar(raiz.querySelector('.vp'));
    conectar();
  }
  /* Cambió el # (página de un servicio ↔ inicio): se vuelve a pintar arriba, o en la sección que pidió el menú. */
  window.addEventListener('hashchange', function () {
    var r = RUTA.exec(location.hash || '');
    if (!r || r[1] !== CODIGO) return;   // otro código: como antes, no se repinta (se abre al recargar)
    var nueva = r[2] != null ? Number(r[2]) : null;
    if (nueva === PAG && !irA) return;
    PAG = nueva; armar(conFotos);
    var d = irA && document.querySelector(irA); irA = null;
    if (d) d.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
    var h = !d && document.querySelector('#vp-servicio .sp-h');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  // una foto que no carga: se vuelve a lo de siempre, si la persona aún no empezó a escribir
  var conFotos = null;
  raiz.addEventListener('error', function (e) {
    if (!conFotos || !e.target || e.target.tagName !== 'IMG' || !e.target.closest('.vp')) return;
    var f = raiz.querySelector('form[data-cotiza]');
    if (f && Array.prototype.some.call(f.elements, function (el) { return el.value && el.type !== 'submit' && el.tagName !== 'BUTTON' && el.name !== 'servicio'; })) return;
    conFotos = null; armar(null);
  }, true);

  // Los botones «Cotizar» bajan al formulario: el # lleva el codigo, asi que no se usa el ancla nativa.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-vp]');
    if (!a) return;
    e.preventDefault();
    // en la página de un servicio, el menú lleva a secciones del inicio: se vuelve al inicio y se baja a esa sección
    if (!document.querySelector(a.getAttribute('href')) && PAG != null) { irA = a.getAttribute('href'); location.hash = '#' + CODIGO; return; }
    var sel = document.querySelector('form[data-cotiza] select[name=servicio]');   // «Cotizar» de una partida deja ese servicio elegido
    if (sel && a.dataset.serv != null && sel.options[Number(a.dataset.serv)]) sel.selectedIndex = Number(a.dataset.serv);
    var d = document.querySelector(a.getAttribute('href'));
    if (d) d.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'start' });
    if (d && a.classList.contains('salto')) { d.setAttribute('tabindex', '-1'); d.focus({ preventScroll: true }); }   // el salto de teclado lleva el foco, no solo la vista
    if (a.dataset.serv != null && window.SOUL_MOV) window.SOUL_MOV.marca();
  });

  // El formulario: POST al mismo endpoint de las cotizaciones de compai.cl, marcado con el slug de este sitio.
  function conectar() {
    var f = document.querySelector('form[data-cotiza]');
    if (!f) return;
    var est = f.querySelector('.est'), btn = f.querySelector('button[type=submit]');
    function dec(txt, ok) { est.textContent = txt; est.className = 'est' + (ok ? ' ok' : ''); }
    function malo(campo) { campo.focus(); if (window.SOUL_MOV) window.SOUL_MOV.no(campo); }   // el campo rechazado se sacude corto
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) return;
      var v = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ''; };
      var nom = v('nombre'), tel = v('telefono'), cor = v('correo');
      if (!nom) { dec('Escribe tu nombre.'); malo(f.elements.nombre); return; }
      if (S.digitos(tel).length < 8) { dec('Escribe tu WhatsApp para poder responderte.'); malo(f.elements.telefono); return; }
      if (!/^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(cor)) { dec('Revisa tu correo.'); malo(f.elements.correo); return; }
      var extra = [];
      if (v('servicio')) extra.push('Servicio: ' + v('servicio'));
      Array.prototype.forEach.call(f.querySelectorAll('[data-campo]'), function (el) { if (el.value.trim()) extra.push(el.dataset.campo + ': ' + el.value.trim()); });
      if (v('mensaje')) extra.push(v('mensaje'));
      var payload = { nombre: nom, correo: cor, telefono: tel, organismo: 'Sitio SOUL · ' + slug,
        mensaje: ('Cotización pedida en compai.cl/soul/s (' + slug + '). ' + extra.join(' · ')).slice(0, 1400), sitioweb: v('sitioweb') };
      enviando = true; btn.disabled = true; dec('Enviando…');
      var ctrl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
      var p = !CFG.endpoint ? Promise.reject(new Error('sin endpoint')) :
        fetch(CFG.endpoint, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctrl ? ctrl.signal : undefined })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok !== true) throw new Error('sin confirmación'); }); });
      p.then(function () {
        dec('Listo, recibí tu solicitud. Te escribo pronto. Si es urgente, escríbeme por WhatsApp aquí abajo.', true);
        f.reset();
        try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'soul/s/cotizacion', title: 'cotizacion en sitio SOUL', event: true }); } catch (_) { /* medir nunca rompe */ }
      }, function () {
        dec('No pude enviarla desde aquí. Escríbeme por WhatsApp aquí abajo y lo vemos ahí.');
      }).then(function () { clearTimeout(t); enviando = false; btn.disabled = false; });
    });
  }

  /* ───────── «pago a la semana» (Grace y Sebastián, 24-11-2026) ─────────
     Si el código trae el id del sitio (ST.sid), se pregunta al servidor si está activo:
       prueba  -> el sitio, con un sello discreto «de prueba» y sin indexar en buscadores
       activo  -> el sitio, sin sello
       apagado -> en vez del sitio, un aviso con el WhatsApp de CompAI para reactivarlo
     Si el servidor no responde (o no hay endpoint, como en las maquetas), se muestra el sitio: una falla nuestra
     no castiga al cliente. Los enlaces viejos sin id se muestran como siempre (ya están entregados).
     TEXTOS PROPUESTOS: esperan el visto de Sebastián. */
  var TXT = {
    sello: 'Sitio de prueba',
    quedan: function (n) { return n === 1 ? 'queda 1 día' : 'quedan ' + n + ' días'; },
    apagado_t: 'Este sitio está en pausa.',
    apagado_p: 'Si es tuyo, paga tu plan y lo volvemos a encender.',
    pagar_mes: function (pl) { return 'Pagar mes a mes · $' + pl.mes.toLocaleString('es-CL'); },
    pagar_anio: function (pl) { return 'Pagar el año · $' + pl.anual.toLocaleString('es-CL'); },
    apagado_b: 'Escribir por WhatsApp'
  };
  var SID = /^[a-z0-9]{12}$/.test(String(ST.sid || '')) ? String(ST.sid) : '';
  function consultar() {
    if (!SID || !CFG.endpoint || !window.fetch) return Promise.resolve(null);
    var ctrl = window.AbortController ? new AbortController() : null;
    var corte = new Promise(function (ok) { setTimeout(function () { if (ctrl) ctrl.abort(); ok(null); }, 8000); });
    var pide = fetch(CFG.endpoint, { method: 'POST', body: JSON.stringify({ tipo: 'estado-sitio', id: SID }), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.ok === true && /^(prueba|activo|apagado)$/.test(j.estado) ? j : null; }, function () { return null; });
    return Promise.race([pide, corte]);
  }
  function apagado() {
    document.title = TXT.apagado_t;
    var wa = 'https://wa.me/' + (CFG.whatsapp || '56962469977') + '?text=' + encodeURIComponent('Hola, quiero reactivar mi sitio SOUL (' + slug + ').');
    var caja = document.createElement('div'), h = document.createElement('h1'), p = document.createElement('p'), a = document.createElement('a');
    caja.className = 'vacio'; h.textContent = TXT.apagado_t; p.textContent = TXT.apagado_p;
    a.href = wa; a.target = '_blank'; a.rel = 'noopener'; a.textContent = TXT.apagado_b;
    caja.appendChild(h); caja.appendChild(p);
    // los enlaces de pago del plan de esta persona (contenido/sitio.json → soulPagos); el que eligió va primero
    var pl = D.PLANS[ST.plan], ln = pl && CFG.pagos && CFG.pagos[pl.label], https = /^https:\/\//;
    if (ln) {
      var pagos = [[ln.mensual, TXT.pagar_mes(pl)], [ln.anual, TXT.pagar_anio(pl)]];
      if (ST.modalidad === 1) pagos.reverse();
      pagos.forEach(function (x) {
        if (!https.test(String(x[0] || ''))) return;
        var b = document.createElement('a');
        b.href = x[0]; b.target = '_blank'; b.rel = 'noopener'; b.className = 'pagar'; b.textContent = x[1];
        caja.appendChild(b);
      });
    }
    caja.appendChild(a);
    raiz.textContent = ''; raiz.appendChild(caja);
  }
  function selloPrueba(dias) {
    var rb = document.querySelector('meta[name="robots"]');
    if (!rb) { rb = document.createElement('meta'); rb.name = 'robots'; document.head.appendChild(rb); }
    rb.setAttribute('content', 'noindex');
    var s = document.createElement('div');
    s.className = 'sello-prueba'; s.setAttribute('role', 'note');
    s.textContent = TXT.sello + (dias > 0 ? ' · ' + TXT.quedan(dias) : '');
    document.body.appendChild(s);
  }

  Promise.all([traerFotos(), consultar()]).then(function (r) {
    var E = r[1];
    if (E && E.estado === 'apagado') { apagado(); return; }
    conFotos = r[0] && typeof r[0] === 'object' ? r[0] : null; armar(conFotos);
    if (E && E.estado === 'prueba') selloPrueba(Number(E.dias) || 0);
  });
})();
