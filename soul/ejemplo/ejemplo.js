/* Ejemplo SOUL · Miguel Chaurán. Solo demostrativo: NINGUN formulario envia nada.
   - index: carrusel de servicios (en el celular se desliza con el dedo).
   - cotizacion / agenda: validan, muestran «esto es un ejemplo» y listo. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* carrusel */
  var track = $('#track');
  if (track) {
    var cards = $$('.svc', track), idx = 0, n = cards.length;
    var paso = function () { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 400; };
    var pinta = function () {
      cards.forEach(function (c, i) { c.classList.toggle('on', i === idx); });
      track.style.transform = 'translateX(-' + (idx * paso()) + 'px)';
      $('#cnt').textContent = String(idx + 1).padStart(2, '0') + ' — ' + String(n).padStart(2, '0');
    };
    $('#prev').addEventListener('click', function () { idx = (idx - 1 + n) % n; pinta(); });
    $('#next').addEventListener('click', function () { idx = (idx + 1) % n; pinta(); });
    window.addEventListener('resize', pinta);
  }

  /* cotizacion */
  var chips = $('#chips');
  if (chips) {
    var label = $('#srvLabel');
    var pick = function (b) {
      $$('.chip', chips).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      label.textContent = b.dataset.v;
    };
    chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) pick(b); });
    var q = /[?&]s=(\d)/.exec(location.search);
    if (q && $$('.chip', chips)[Number(q[1])]) pick($$('.chip', chips)[Number(q[1])]);
  }

  /* validacion minima compartida */
  function valida(form) {
    var err = $('#err'), malo = null;
    $$('input[required],select[required],textarea[required]', form).forEach(function (el) {
      var vacio = !el.value.trim();
      el.setAttribute('aria-invalid', vacio ? 'true' : 'false');
      if (vacio && !malo) malo = el;
    });
    err.textContent = malo ? 'Completa los campos marcados para ver cómo sigue (es un ejemplo: no se envía nada).' : '';
    if (malo) malo.focus();
    return !malo;
  }

  var f = $('#f');   // cotizacion
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valida(f)) return;
    f.hidden = true; $('#ok').hidden = false; $('#okh').focus(); window.scrollTo(0, 0);
  });

  /* agenda */
  var p1 = $('#p1');
  if (p1) {
    var p2 = $('#p2'), p3 = $('#p3'), pasos = $$('#pasos li');
    var ir = function (n, inicial) {
      p1.hidden = n !== 1; p2.hidden = n !== 2; p3.hidden = n !== 3;
      pasos.forEach(function (li) { li.classList.toggle('on', Number(li.dataset.p) <= n); });
      if (inicial) return;
      var h = $('h2', n === 1 ? p1 : p3); if (n !== 2 && h) h.focus();
      if (n === 2) $('input', p2).focus();
      window.scrollTo(0, 0);
    };
    ir(1, true);
    $('#login').addEventListener('click', function () { ir(2); });
    $('#logout').addEventListener('click', function () { ir(1); });
    $('#again').addEventListener('click', function () { ir(2); });
    $('#slots').addEventListener('click', function (e) {
      var b = e.target.closest('.slot'); if (!b) return;
      $$('.slot').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
    p2.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valida(p2)) return;
      var h = 'a las ' + $('.slot[aria-pressed="true"]').textContent;
      $('#hr').textContent = h; $('.hr2').textContent = h; ir(3);
    });
  }
})();
