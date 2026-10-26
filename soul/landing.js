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
