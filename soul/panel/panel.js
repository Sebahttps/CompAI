/* SOUL · maqueta del panel del plan vibe (24-11-2026). Se abre con el mismo código del enlace del sitio:
     soul/panel/#<código>              resumen
     soul/panel/#<código>&v=lista      las solicitudes
     soul/panel/#<código>&v=sol-<n>    el detalle de una solicitud (con su botón de WhatsApp)
     soul/panel/#<código>&v=editar     cambiar textos y precios del sitio, sin programador
   Sin servidor y sin CDN: todo se arma en el navegador con sitio.js (decodificar) y marca.js (colores, letras y sello).
   Las solicitudes son DATOS DE MUESTRA, armados aquí mismo, y el cartel «Datos de muestra» se ve en todas las pantallas.
   Nada se guarda: lo que se edita abre el sitio con un enlace nuevo. */
(function () {
  'use strict';
  var S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA, esc = S.esc;
  var raiz = document.getElementById('panel');

  /* Textos visibles del panel: TODOS PROPUESTOS (24-11-2026), esperan el visto de Sebastián. Juntos para cambiarlos en un solo lugar. */
  var TXT = {
    muestra: 'Datos de muestra', muestra_p: 'Las solicitudes de esta maqueta son inventadas, para que veas cómo funciona.',
    titulo: 'Tu panel', ver_sitio: 'Ver mi sitio',
    resumen: 'Resumen', lista: 'Solicitudes', editar: 'Mi sitio',
    k_mes: 'solicitudes este mes', k_meta: 'tu meta de respuesta', k_valor: 'valor medio por trabajo', k_cuentas: 'donde llevas tus cuentas',
    pendientes: function (n) { return n === 1 ? '1 solicitud espera tu respuesta.' : n + ' solicitudes esperan tu respuesta.'; },
    al_dia: 'Estás al día: no hay solicitudes por responder.',
    ultimas: 'Últimas solicitudes', ver_todas: 'Ver todas',
    nueva: 'Por responder', resp: 'Respondida',
    volver: 'Volver a las solicitudes',
    d_fecha: 'Llegó', d_serv: 'Servicio', d_tel: 'WhatsApp', d_lugar: 'Dónde', d_msg: 'Mensaje',
    wsp: 'Responder por WhatsApp', marcar: 'Marcar como respondida', desmarcar: 'Marcar como por responder',
    wsp_txt: function (cli, yo, sv) { return 'Hola ' + cli + ', soy ' + yo + '. Te escribo por tu solicitud de ' + sv + '.'; },
    ed_t: 'Cambia tus textos y precios', ed_p: 'Escribe y mira cómo queda. En esta maqueta los cambios no se guardan: el botón abre tu sitio con ellos.',
    ed_tit: 'Tu frase principal', ed_svc: 'Servicio', ed_n: 'Nombre', ed_pr: 'Precio desde', ed_d: 'Qué incluye', ed_cierre: 'Frase de cierre',
    ed_ver: 'Ver mi sitio con estos cambios', ed_deshacer: 'Volver a como estaba',
    hoy: 'hoy', ayer: 'ayer', hace: function (n) { return 'hace ' + n + ' días'; },
    vacio: 'Este enlace no abre ningún panel.', vacio_p: 'Quizá se cortó al copiarlo. Pide el enlace completo otra vez.',
    solo_vibe: 'El panel viene con el plan vibe.', solo_vibe_p: 'Este sitio es de otro plan: su enlace abre el sitio, no un panel.'
  };
  /* Las solicitudes de muestra: nombres de pila con inicial, teléfonos 9 0000 000x (no son de nadie) y mensajes que sirven a cualquier oficio. */
  var MUESTRA = {
    nombres: ['Carolina M.', 'Jorge P.', 'Daniela R.', 'Patricio V.', 'Fernanda S.', 'Luis A.', 'Camila T.'],
    mensajes: ['¿Puedes venir a ver el trabajo esta semana?', 'Necesito el presupuesto con materiales incluidos.', '¿Tienes hora disponible el sábado en la mañana?',
      'Me lo recomendó una vecina. ¿Cuánto saldría más o menos?', 'Es urgente, ¿podrías pasar hoy?', 'Quiero saber el plazo y el precio para empezar este mes.', 'Gracias por la rapidez de la vez pasada. Necesito otro trabajo.'],
    dias: [0, 1, 3, 5, 8, 12, 19]
  };

  var RUTA = /^#([A-Za-z0-9_-]{10,20000})(?:&v=(lista|editar|sol-\d{1,2}))?$/;
  var m = RUTA.exec(location.hash || ''), ST = null, CODIGO = m ? m[1] : '';
  if (m) { try { ST = S.decodificar(m[1]); } catch (_) { ST = null; } }

  function aviso(t, p) { document.title = t; raiz.innerHTML = '<div class="vacio"><h1>' + esc(t) + '</h1><p>' + esc(p) + '</p></div>'; }
  if (!ST || !ST.name.trim() || ST.oficio == null) { aviso(TXT.vacio, TXT.vacio_p); return; }
  if (ST.plan !== 2) { aviso(TXT.solo_vibe, TXT.solo_vibe_p); return; }

  // la marca de la persona: superficies y letras de su dirección, su monograma y su sello
  var di = S.dirActual(ST, D, M), d = M.DIRS[di], su = S.sup(ST, D, M), so = S.selloDe(ST, D, M, null);
  var nombre = M.marcaNombre(ST), lleno = S.svcsLlenos(ST), oficio = S.oficioNombre(ST, D);
  var lugar = ST.comunas.trim() || ST.where[0] || '';
  var root = document.documentElement.style;
  [['--display', d.display], ['--texto', d.texto], ['--mono', d.mono], ['--bg', su.bg], ['--bg2', su.bg2], ['--ink', su.ink], ['--mut', su.mut],
    ['--ac', su.ac], ['--vivo', su.vivo], ['--on', su.on], ['--vb', su.vb], ['--suave', su.suave], ['--rad', d.id === 'taller' ? '14px' : '0px']].forEach(function (x) { root.setProperty(x[0], x[1]); });
  document.body.style.background = su.bg;
  var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', su.ink);
  try { var ico = document.querySelector('link[rel="icon"]'); ico.href = 'data:image/svg+xml,' + encodeURIComponent(M.monograma(so, 'color', null, 'fv', ' width="64" height="64"', true)); } catch (_) { /* el ícono de siempre */ }

  // las solicitudes de muestra, armadas con los servicios de la persona
  var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  var SOL = MUESTRA.nombres.map(function (n, i) {
    var f = new Date(hoy.getTime() - MUESTRA.dias[i] * 864e5);
    return { i: i, nombre: n, tel: '+56 9 0000 000' + (i + 1), wa: '5690000000' + (i + 1), fecha: f, dias: MUESTRA.dias[i],
      servicio: lleno.length ? lleno[i % lleno.length].n.trim() : oficio, mensaje: MUESTRA.mensajes[i], resp: i >= 2 };
  });
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fechaTxt(s) { return s.fecha.getDate() + ' de ' + MESES[s.fecha.getMonth()]; }
  function haceTxt(s) { return s.dias === 0 ? TXT.hoy : s.dias === 1 ? TXT.ayer : TXT.hace(s.dias); }
  function delMes() { return SOL.filter(function (s) { return s.fecha.getMonth() === hoy.getMonth() && s.fecha.getFullYear() === hoy.getFullYear(); }).length; }
  function porResp() { return SOL.filter(function (s) { return !s.resp; }).length; }

  // lo que se edita en «Mi sitio»: una copia; el original queda para «Volver a como estaba»
  var EDT = S.decodificar(CODIGO);

  function ruta(v) { return '#' + CODIGO + (v ? '&v=' + v : ''); }
  function estado(s) { return '<span class="est' + (s.resp ? '' : ' nueva') + '">' + (s.resp ? TXT.resp : TXT.nueva) + '</span>'; }
  function fila(s) {
    return '<li><a class="sol" href="' + ruta('sol-' + s.i) + '"><span class="sol-n">' + esc(s.nombre) + '</span><span class="sol-s">' + esc(s.servicio) + '</span>' +
      '<span class="sol-f">' + esc(haceTxt(s)) + '</span>' + estado(s) + '</a></li>';
  }

  function resumenH() {
    var cif = [[String(delMes()), TXT.k_mes], [ST.reply == null ? '—' : D.REPLIES[ST.reply], TXT.k_meta], [ST.avg == null ? '—' : D.AVGS[ST.avg], TXT.k_valor], [ST.books == null ? '—' : D.BOOKS[ST.books], TXT.k_cuentas]];
    var n = porResp();
    return '<div class="res"><div class="res-in"><h1>' + TXT.resumen + '</h1><p class="lead">' + esc(n ? TXT.pendientes(n) : TXT.al_dia) + '</p>' +
      '<ul class="cifras">' + cif.map(function (c) { return '<li><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></li>'; }).join('') + '</ul></div>' +
      '<span class="sello" aria-hidden="true">' + M.sello(so, 'color', null, 'ps', ' focusable="false"') + '</span></div>' +
      '<section class="bloque" aria-labelledby="l-ult"><div class="bl-cab"><h2 id="l-ult">' + TXT.ultimas + '</h2><a class="mas" href="' + ruta('lista') + '">' + TXT.ver_todas + '</a></div>' +
      '<ul class="sols">' + SOL.slice(0, 3).map(fila).join('') + '</ul></section>';
  }
  function listaH() {
    return '<h1>' + TXT.lista + '</h1><p class="lead">' + esc(porResp() ? TXT.pendientes(porResp()) : TXT.al_dia) + '</p><ul class="sols">' + SOL.map(fila).join('') + '</ul>';
  }
  function detalleH(s) {
    var wa = 'https://wa.me/' + s.wa + '?text=' + encodeURIComponent(TXT.wsp_txt(s.nombre.split(' ')[0], nombre, s.servicio));
    var dl = [[TXT.d_fecha, fechaTxt(s) + ' · ' + haceTxt(s)], [TXT.d_serv, s.servicio], [TXT.d_tel, s.tel]].concat(lugar ? [[TXT.d_lugar, lugar]] : []);
    return '<a class="volver" href="' + ruta('lista') + '">' + TXT.volver + '</a><div class="det-cab"><h1>' + esc(s.nombre) + '</h1>' + estado(s) + '</div>' +
      '<div class="det"><dl class="datos">' + dl.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="msj"><h2>' + TXT.d_msg + '</h2><p>' + esc(s.mensaje) + '</p></div></div>' +
      '<div class="acc"><a class="btn" href="' + esc(wa) + '" target="_blank" rel="noopener">' + TXT.wsp + '</a>' +
      '<button type="button" class="btn btn-sec" data-marcar="' + s.i + '">' + (s.resp ? TXT.desmarcar : TXT.marcar) + '</button></div>';
  }
  function editarH() {
    var campo = function (lbl, attrs, val, area) {
      return '<label>' + esc(lbl) + (area ? '<textarea rows="3" ' + attrs + '>' + esc(val) + '</textarea>' : '<input type="text" ' + attrs + ' value="' + esc(val) + '">') + '</label>';
    };
    return '<h1>' + TXT.ed_t + '</h1><p class="lead">' + TXT.ed_p + '</p><form class="ed" onsubmit="return false">' +
      '<div class="ed-uno">' + campo(TXT.ed_tit, 'data-e="unico" maxlength="90"', EDT.unico, false) + '</div>' +
      EDT.svcs.map(function (v, k) {
        if (!v.n.trim() && k >= lleno.length) return '';
        return '<fieldset><legend>' + esc(TXT.ed_svc + ' ' + (k + 1)) + '</legend><div class="ed-g">' + campo(TXT.ed_n, 'data-s="n" data-i="' + k + '" maxlength="70"', v.n, false) +
          campo(TXT.ed_pr, 'data-s="p" data-i="' + k + '" maxlength="20" inputmode="text"', v.p, false) + '</div>' + campo(TXT.ed_d, 'data-s="d" data-i="' + k + '" maxlength="140"', v.d, true) + '</fieldset>';
      }).join('') +
      '<div class="ed-uno">' + campo(TXT.ed_cierre, 'data-e="cierre" maxlength="80"', EDT.cierre, false) + '</div></form>' +
      '<div class="acc pegado"><a class="btn" id="ed-ver" href="' + esc('../s/#' + S.codificar(EDT)) + '" target="_blank" rel="noopener">' + TXT.ed_ver + '</a>' +
      '<button type="button" class="btn btn-sec" data-deshacer="1">' + TXT.ed_deshacer + '</button></div>';
  }

  function pintar() {
    var r = RUTA.exec(location.hash || ''), v = r && r[1] === CODIGO ? r[2] || '' : '';
    var s = /^sol-(\d+)$/.exec(v), sol = s && SOL[Number(s[1])], tab = v === 'editar' ? 'editar' : v === 'lista' || sol ? 'lista' : 'resumen';
    var cuerpo = v === 'editar' ? editarH() : sol ? detalleH(sol) : v === 'lista' ? listaH() : resumenH();
    var tabs = [['resumen', '', TXT.resumen], ['lista', 'lista', TXT.lista], ['editar', 'editar', TXT.editar]];
    raiz.innerHTML = '<div class="pn' + (ST.bg === 0 ? ' oscuro' : '') + '" data-dir="' + d.id + '">' +
      '<div class="muestra" role="note"><b>' + TXT.muestra + '</b><span>' + TXT.muestra_p + '</span></div>' +
      '<header class="cab"><a class="marca" href="' + ruta('') + '"><span class="mono" aria-hidden="true">' + M.monograma(so, 'color', null, 'pm', ' width="40" height="40" focusable="false"', false, false) + '</span>' +
      '<span class="nom">' + esc(nombre) + '<small>' + TXT.titulo + '</small></span></a>' +
      '<a class="ver" href="' + esc('../s/#' + CODIGO) + '" target="_blank" rel="noopener">' + TXT.ver_sitio + '</a></header>' +
      '<nav class="tabs" aria-label="' + TXT.titulo + '">' + tabs.map(function (t) { return '<a href="' + ruta(t[1]) + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[2] + '</a>'; }).join('') + '</nav>' +
      '<main class="cont" id="contenido" data-vista="' + (sol ? 'detalle' : tab) + '">' + cuerpo + '</main></div>';
    document.title = (sol ? sol.nombre : tab === 'editar' ? TXT.editar : tab === 'lista' ? TXT.lista : TXT.resumen) + ' · ' + TXT.titulo + ' · ' + nombre;
  }

  window.addEventListener('hashchange', function () {
    var r = RUTA.exec(location.hash || '');
    if (!r || r[1] !== CODIGO) return;   // otro código: se abre al recargar, como el sitio
    pintar(); window.scrollTo(0, 0);
    var h = raiz.querySelector('.cont h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  raiz.addEventListener('click', function (e) {
    var b = e.target.closest('[data-marcar]');
    if (b) { var s = SOL[Number(b.dataset.marcar)]; s.resp = !s.resp; pintar(); var nb = raiz.querySelector('[data-marcar]'); if (nb) nb.focus(); return; }
    if (e.target.closest('[data-deshacer]')) { EDT = S.decodificar(CODIGO); pintar(); }
  });
  // cada letra que se escribe rehace el enlace del botón: abre el sitio con lo que hay en pantalla
  raiz.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.e) EDT[t.dataset.e] = t.value;
    else if (t.dataset.s && EDT.svcs[Number(t.dataset.i)]) EDT.svcs[Number(t.dataset.i)][t.dataset.s] = t.value;
    else return;
    var a = document.getElementById('ed-ver'); if (a) a.href = '../s/#' + S.codificar(EDT);
  });
  pintar();
})();
