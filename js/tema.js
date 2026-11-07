/* compai.cl · motor del tema claro/oscuro.
 * La decision SIN parpadeo la toma un script bloqueante en el <head>
 * (ver construir.mjs, antes de los <link rel=stylesheet>): ese es el unico
 * que no puede esperar. Este archivo es el resto: persistir el cambio,
 * escuchar al sistema cuando el visitante no eligio, actualizar el
 * <meta name=theme-color>, y avisarle a los canvas (js/sitio.js,
 * js/materializa.js) que repinten con los tokens nuevos.
 *
 * No depende de nada. Se carga ANTES de sitio.js y materializa.js (orden de
 * <script defer> = orden del documento), asi que window.CompAI.colores()
 * ya existe cuando esos dos lo piden.
 */
(() => {
  'use strict';
  const CLAVE = 'tema';
  const sistema = matchMedia('(prefers-color-scheme: light)');

  function elegido() {
    try { return localStorage.getItem(CLAVE); } catch (_) { return null; }
  }
  function guarda(v) {
    try { localStorage.setItem(CLAVE, v); } catch (_) {}
  }
  function resuelve() {
    return elegido() || (sistema.matches ? 'claro' : 'oscuro');
  }

  function leeColores() {
    const cs = getComputedStyle(document.documentElement);
    const g = n => cs.getPropertyValue('--' + n).trim();
    return {
      noche: g('noche-rgb'), brasa: g('brasa-rgb'), sol: g('sol-rgb'),
      petroleo: g('petroleo-rgb'), petroleo2: g('petroleo2-rgb'),
      cobreclaro: g('cobreclaro-rgb'),
      grace1: g('grace-1'), grace2: g('grace-2'), grace3: g('grace-3'),
    };
  }

  let _colores = leeColores();
  window.CompAI = window.CompAI || {};
  window.CompAI.colores = () => _colores;

  function metaColor() {
    // el "color del navegador" sigue al fondo real, no a una tabla aparte
    const hex = getComputedStyle(document.documentElement)
      .getPropertyValue('--noche').trim();
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    if (hex) m.setAttribute('content', hex);
  }

  function aplica(tema, { avisar = true } = {}) {
    document.documentElement.setAttribute('data-tema', tema);
    _colores = leeColores();
    metaColor();
    document.querySelectorAll('[data-accion="alternar-tema"]').forEach(b => {
      b.setAttribute('aria-pressed', String(tema === 'claro'));
    });
    if (avisar) document.dispatchEvent(new CustomEvent('tema:cambio', { detail: { tema } }));
  }

  function alternar() {
    const actual = document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'oscuro';
    const siguiente = actual === 'claro' ? 'oscuro' : 'claro';
    guarda(siguiente);
    aplica(siguiente);
  }
  window.CompAI.alternarTema = alternar;

  // el script del <head> ya puso data-tema antes del primer pintado; acá
  // solo se sincroniza _colores y el meta con lo que haya quedado.
  aplica(document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'oscuro',
         { avisar: false });

  // si el visitante no elige, el sitio sigue al sistema en caliente
  sistema.addEventListener('change', () => {
    if (elegido()) return;   // ya hay una preferencia explicita: manda ella
    aplica(sistema.matches ? 'claro' : 'oscuro');
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-accion="alternar-tema"]');
    if (b) alternar();
  });
})();
