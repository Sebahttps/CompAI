/* SOUL · movimiento del sitio de la persona (Cínema, 23-11-2026). Sin librerías.
   SOUL_MOV.iniciar(raiz) -> llamar justo después de pintar el sitio, en el mismo turno. raiz = el elemento con data-mov.
   SOUL_MOV.marca()       -> al tocar «Cotizar» de un servicio: subraya el campo Servicio (muestra qué cambió).
   SOUL_MOV.no(campo)     -> cuando la validación rechaza un campo: lo sacude corto. */
(function (W) {
  'use strict';
  var D = document;
  function reducido() { return !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion:reduce)').matches); }
  function todos(r, s, f) { Array.prototype.forEach.call(r.querySelectorAll(s), f); }
  /* Cada palabra en su caja (.pl > span): la caja corta, la palabra entra. El texto y sus etiquetas no cambian. */
  function partir(el) {
    if (!el || el.dataset.pl) return;
    el.dataset.pl = '1';
    var i = 0;
    (function baja(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 1) { if (c.classList.contains('nopl')) return; return baja(c); }   // .nopl: lo que no se parte (la medida de la cota)
        if (c.nodeType !== 3 || !c.textContent.trim()) return;
        var f = D.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(D.createTextNode(' ')); return; }
          var caja = D.createElement('span'), pal = D.createElement('span');
          caja.className = 'pl'; caja.style.setProperty('--i', i++); pal.textContent = t;
          caja.appendChild(pal); f.appendChild(caja);
        });
        n.replaceChild(f, c);
      });
    })(el);
  }
  function iniciar(raiz) {
    if (!raiz) return;
    var mov = Number(raiz.dataset.mov || 0);
    if (!mov || reducido() || !W.IntersectionObserver) return;
    var portada = raiz.querySelector('.portada');
    if (portada) new IntersectionObserver(function (es) { portada.classList.toggle('fuera', !es[0].isIntersecting); }).observe(portada);   // el zoom no corre si la portada no se ve
    if (mov < 2) return;
    todos(raiz, '.titular,.firma', partir);
    raiz.classList.add('mv-js');
    var io = new IntersectionObserver(function (es) {
      // «a la vista»: 35 % de la pieza, o la mitad de la pantalla si la pieza es más alta que eso (nunca queda tapada)
      es.forEach(function (e) { if (e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= W.innerHeight * 0.45)) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75] });
    todos(raiz, '.portada .sello,.cita,.mosaico,.partidas,.cierre-in', function (s) { io.observe(s); });
  }
  function otraVez(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function marca() { var s = D.querySelector('[data-mov] form select[name=servicio]'); otraVez(s && s.closest('label'), 'mv-marca'); }
  function no(campo) { otraVez(campo && campo.closest('label'), 'mv-no'); }
  D.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-mov] a[data-serv]')) marca(); });
  W.SOUL_MOV = { iniciar: iniciar, marca: marca, no: no, partir: partir };
})(window);
