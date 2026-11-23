/* SOUL · landing. Solo abre y cierra el detalle de cada plan.
   Toque o Enter: lo deja abierto. Cursor encima (solo con mouse): lo muestra
   mientras esta encima, igual que el diseño aprobado. Sin JS el precio y el
   resumen de cada plan se leen igual; solo el detalle queda cerrado. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.plan'));
  var fijado = -1;
  var conMouse = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  function pinta(abierto) {
    cards.forEach(function (c, i) {
      var on = i === abierto, b = c.querySelector('.ver');
      c.querySelector('.detalle').hidden = !on;
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
      b.querySelector('.ver-t').textContent = on ? 'Ver menos −' : 'Ver qué incluye +';
    });
  }
  cards.forEach(function (c, i) {
    c.querySelector('.ver').addEventListener('click', function () {
      fijado = (fijado === i) ? -1 : i;
      pinta(fijado);
    });
    if (conMouse) {
      c.addEventListener('mouseenter', function () { if (fijado === -1) pinta(i); });
      c.addEventListener('mouseleave', function () { if (fijado === -1) pinta(-1); });
    }
  });
})();
/* Links de pago (config.js -> pagos). Solo con modo 'directo' y link https del plan el boton "Quiero" lleva al pago;
   con el link vacio o modo 'despues' no cambia nada: sigue yendo a las preguntas. */
(function () {
  var P = (window.SOUL_CFG && window.SOUL_CFG.pagos) || {};
  if (P.modo !== 'directo') return;
  ['fresh', 'sun', 'vibe'].forEach(function (n, i) {
    var u = P[n] && P[n].mensual, b = document.querySelector('.plan[data-plan="' + i + '"] .quiero');
    if (b && u && /^https:\/\//i.test(u)) { b.href = u; b.target = '_blank'; b.rel = 'noopener'; }
  });
})();
/* Aparicion al scroll (23-11-2026): fade + 24 px, escalonado 80 ms entre los que entran juntos.
   Las clases .rv las pone este script; el CSS solo las esconde si <html> lleva .js.
   Sin IntersectionObserver o con movimiento reducido: todo visible de inmediato.
   Red de seguridad: a los 6 s se muestra todo (capturas completas, pestañas en segundo plano). */
(function () {
  var rv = Array.prototype.slice.call(document.querySelectorAll(
    '.intro, .fotos6 .ofi, #como .k, #como .h2, .paso, #planes-y-precios .k, #planes-y-precios .h2, .plan, #trae .k, #trae .h2'));
  if (!rv.length) return;
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function todos() { rv.forEach(function (e) { e.classList.add('en'); }); }
  rv.forEach(function (e) { e.classList.add('rv'); });
  if (quieto || !('IntersectionObserver' in window)) { todos(); return; }
  var io = new IntersectionObserver(function (es) {
    var i = 0;
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.setProperty('--d', Math.min(i++, 6) * 80 + 'ms');
      e.target.classList.add('en');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  rv.forEach(function (e) { io.observe(e); });
  setTimeout(function () { io.disconnect(); todos(); }, 6000);
})();
