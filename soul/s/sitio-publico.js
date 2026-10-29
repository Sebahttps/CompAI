/* SOUL · el enlace publico: compai.cl/soul/s/#<codigo>
   Lee el codigo del # (mismo formato que codificar() en sitio.js), arma el sitio completo de la persona
   y conecta el formulario de cotizacion. Sin servidor, sin intervencion, sin CDN.
   El render es el MISMO de la vista previa de preguntas.html (SOUL_SITIO.html): una sola fuente.
   Ejecutar: abrir soul/s/index.html#<codigo> desde un servidor estatico
   (p. ej. `python -m http.server` en sitio/compai y ir a /soul/s/#...). */
(function () {
  'use strict';
  var S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA;
  var CFG = window.SOUL_CFG || { endpoint: '', whatsapp: '56962469977' };
  var raiz = document.getElementById('sitio');
  var m = /^#([A-Za-z0-9_-]{10,20000})$/.exec(location.hash || '');
  var ST = null;
  if (m) { try { ST = S.decodificar(m[1]); } catch (_) { ST = null; } }

  function vacio() {
    document.title = 'Este enlace no abre un sitio';
    raiz.innerHTML = '<div class="vacio"><h1>Este enlace no abre ningún sitio.</h1><p>Quizá se cortó al copiarlo. Pídele a quien te lo mandó que lo envíe completo, otra vez.</p><a href="../">Conocer SOUL</a></div>';
  }
  // Un enlace sin nombre ni oficio no es un sitio: se dice, no se pinta un sitio vacio.
  if (!ST || !ST.name.trim() || ST.oficio == null) { vacio(); return; }

  var nombre = M.marcaNombre(ST);
  document.title = nombre + ' · ' + S.oficioNombre(ST, D);
  raiz.innerHTML = S.html(ST, { D: D, M: M, cfg: CFG, mem: null, base: '../', vivo: true }).replace('class="vp', 'class="vp pleno');
  var su = S.sup(ST, D, M), tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', su.bg);
  document.body.style.background = su.bg;

  // Los botones «Cotizar» bajan al formulario: el # lleva el codigo, asi que no se usa el ancla nativa.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-vp]');
    if (!a) return;
    e.preventDefault();
    var d = document.querySelector(a.getAttribute('href'));
    if (d) d.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });

  // El formulario: POST al mismo endpoint de las cotizaciones de compai.cl, marcado con el slug de este sitio.
  var f = document.querySelector('form[data-cotiza]');
  if (!f) return;
  var est = f.querySelector('.est'), btn = f.querySelector('button[type=submit]'), enviando = false;
  function dec(txt, ok) { est.textContent = txt; est.className = 'est' + (ok ? ' ok' : ''); }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando) return;
    var v = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ''; };
    var nom = v('nombre'), tel = v('telefono'), cor = v('correo');
    if (!nom) { dec('Escribe tu nombre.'); f.elements.nombre.focus(); return; }
    if (S.digitos(tel).length < 8) { dec('Escribe tu WhatsApp para poder responderte.'); f.elements.telefono.focus(); return; }
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(cor)) { dec('Revisa tu correo.'); f.elements.correo.focus(); return; }
    var extra = [];
    if (v('servicio')) extra.push('Servicio: ' + v('servicio'));
    Array.prototype.forEach.call(f.querySelectorAll('[data-campo]'), function (el) { if (el.value.trim()) extra.push(el.dataset.campo + ': ' + el.value.trim()); });
    if (v('mensaje')) extra.push(v('mensaje'));
    var slug = f.dataset.cotiza;
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
})();
