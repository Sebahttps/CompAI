/* SOUL · la presentación de marca: compai.cl/soul/semilla/#<codigo>
   Con el MISMO código del enlace del sitio (soul/s/#<codigo>) arma sola la «presentación de marca» de la
   persona: portada, tu marca, sistema de diseño, tu sitio, tus imágenes y cómo sigue. Una lámina por página
   al imprimir (@page + break-after); el botón «Guardar como PDF» llama a window.print().
   Todo sale de las respuestas (ST), de marca.js y de datos.js: nada se inventa. Si una lámina no tiene datos
   de la persona, se OMITE entera (nunca una lámina con rayas «—»).
   Ejecutar: servidor estático en sitio/compai (python -m http.server) y abrir /soul/semilla/#<codigo>.
   Cargar antes: config.js, datos.js, marca.js, escenas.js, arte.js, sitio.js (se usan, no se tocan). */
(function () {
  'use strict';
  var S = window.SOUL_SITIO, D = window.SOUL_DATA, M = window.SOUL_MARCA, A = window.SOUL_ARTE;
  var CFG = window.SOUL_CFG || { whatsapp: '56962469977' };
  var raiz = document.getElementById('pres');
  var esc = S.esc, pad = S.pad;

  var h = /^#([A-Za-z0-9_-]{10,20000})$/.exec(location.hash || ''), ST = null;
  if (h) { try { ST = S.decodificar(h[1]); } catch (_) { ST = null; } }
  window.addEventListener('hashchange', function () { location.reload(); });   // otro código = otra presentación

  function vacio() {
    document.title = 'Este enlace no abre una presentación';
    raiz.innerHTML = '<div class="vacio"><h1>Este enlace no abre ninguna presentación.</h1><p>Quizá se cortó al copiarlo. Pídele a quien te lo mandó que lo envíe completo, otra vez.</p><a href="../">Conocer SOUL</a></div>';
    document.body.classList.add('es-vacio');
  }
  // Igual que soul/s/: sin nombre ni oficio no hay marca que presentar.
  var ok = false;
  try { ok = !!ST && typeof ST.name === 'string' && !!ST.name.trim() && ST.oficio != null && !!D.OFICIOS[ST.oficio]; } catch (_) { ok = false; }
  if (!ok) { vacio(); return; }

  // las fotos de la persona traen su sello propio (lema y gesto con visto); si no hay carpeta, el sello sale de la regla general
  var FX = null;
  S.traerFotos(S.slug(ST), '../fotos/').then(function (F) { FX = F; try { armar(); } catch (e) { if (window.console && console.warn) { /* nunca una pantalla a medias */ } vacio(); } });

  function armar() {
    /* ───────── los datos: todo función de las respuestas ───────── */
    var dir = M.DIRS[S.dirActual(ST, D, M)], su = S.sup(ST, D, M), baseOscura = ST.bg === 0;
    var nombre = M.marcaNombre(ST), oficio = S.oficioNombre(ST, D);
    var tit = M.titular(ST), ori = M.origen(ST), nun = M.nunca(ST), mom = M.momento(ST), cie = M.cierre(ST), ci = M.cifra(ST, D);
    var svcs = S.svcsLlenos(ST), plan = D.PLANS[ST.plan] || D.PLANS[1];
    var tono = D.TONES[ST.tone] ? D.TONES[ST.tone].label : '';
    var resumen = M.resumenMarca(ST, D, M.DIRS.indexOf(dir), su);
    var cta = S.TONO_CTA[ST.tone] || 'Cotizar';
    var ws = w_(ST);
    function w_(st) { var w = M.marcaNombre(st).split(/\s+/).filter(Boolean); return w; }
    var ini = (ws.length > 1 ? ws[0].charAt(0) + ws[1].charAt(0) : (ws[0] || 'S').slice(0, 2)).toUpperCase();
    var primer = M.limpio(ST.apodo) || M.limpio(ST.name).split(/\s+/)[0] || nombre;
    var mes = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function ratio(a, b) { return M.contraste(a, b).toFixed(1).replace('.', ',') + ':1'; }
    function pesos(n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    function titHTML(t) {
      var w = String(t).split(' '); if (w.length < 3) return esc(t);
      var k = w.length > 5 ? 2 : 1;
      return esc(w.slice(0, -k).join(' ')) + ' <em>' + esc(w.slice(-k).join(' ')) + '</em>';
    }
    function tam(t) { var l = String(t).length; return l <= 34 ? 'g' : l <= 64 ? 'm' : 'p'; }

    /* ───────── bloques comunes ───────── */
    function mono(extra) { return '<span class="lk' + (extra || '') + '"><i class="mono" aria-hidden="true">' + esc(ini) + '</i><b class="nom">' + esc(nombre) + '</b></span>'; }
    // pie oficial §4.b: mismo recorte que soul/soul.css. Lámina oscura -> imagen clara; clara -> imagen oscura.
    function pie(osc) {
      var oscura = osc ? !baseOscura : baseOscura;
      return '<div class="pie"><div class="pie-compai"><img src="../img/' + (oscura ? 'pie-compai-claro' : 'pie-alma-compai-oscuro') + '.png" width="310" height="95" alt="alma compAI"></div></div>';
    }
    function cab(n, titulo, h1, baj) {
      return '<header class="cab"><div><p class="k"><b>' + pad(n) + '</b> · ' + esc(titulo) + '</p><h1 class="' + tam(h1) + '">' + titHTML(h1) + '</h1>' +
        (baj ? '<p class="baj">' + esc(baj) + '</p>' : '') + '</div><button type="button" class="volver" data-ir="portada">← Portada</button></header>';
    }
    function lamina(id, osc, cuerpo, etq) {
      return '<section class="lamina' + (osc ? ' osc' : '') + '" id="' + id + '" data-lam="' + id + '" aria-label="' + esc(etq) + '">' + cuerpo + pie(osc) + '</section>';
    }

    var laminas = [];   // { id, tit, sub, html(n) }

    /* ───────── 2 · tu marca ───────── (se omite si la persona no escribió ninguna frase) */
    var frases = [];
    if (tit) frases.push({ k: 'Tu frase', t: tit, grande: true });
    if (nun) frases.push({ k: 'Lo que nunca', t: nun });
    if (mom) frases.push({ k: 'Mi vara', t: mom });
    if (ori) frases.push({ k: 'De dónde sale la marca', t: ori });
    if (cie) frases.push({ k: 'Cierre', t: cie });
    if (frases.length) {
      laminas.push({ id: 'marca', tit: 'Tu marca', sub: 'concepto y cómo hablas', html: function (n) {
        var fila = function (k, v) { return '<div class="rf"><span class="k">' + esc(k) + '</span><p>' + esc(v) + '</p></div>'; };
        var ficha = fila('Dirección', dir.nombre + ' · ' + dir.idea) + fila('Concepto', M.concepto(ST, D)) + (tono ? fila('Tono', tono + ': ' + dir.voz) : '');
        var so = S.selloDe(ST, D, M, FX && FX.sello), expl = M.selloExplica(so);
        var selloH = '<div class="selloB caja"><div class="sb-s">' + M.sello(so, 'color', null, 'sm', ' role="img" aria-label="Sello de ' + esc(nombre) + '" focusable="false"') + '</div><div class="sb-t"><p class="k">Tu sello</p>' +
          expl.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div></div>';
        var cuerpo = cab(n, 'Tu marca', dir.idea, M.concepto(ST, D)) +
          '<div class="marco2"><div class="ficha caja">' + ficha + '</div><div class="frases f' + Math.min(frases.length, 5) + '">' +
          frases.map(function (f, i) { return '<div class="fr' + (f.grande ? ' grande osc' : ' caja' + (i === frases.length - 1 && (frases.length - (frases[0].grande ? 1 : 0)) % 2 === 1 ? ' solo' : '')) + '"><p class="k">' + esc(f.k) + '</p><p class="tx">' + esc(f.t) + '</p></div>'; }).join('') + '</div></div>' + selloH;
        return lamina('marca', false, cuerpo, 'Tu marca');
      } });
    }

    /* ───────── 3 · sistema de diseño ───────── (siempre: la paleta y las letras salen de la dirección) */
    laminas.push({ id: 'sistema', tit: 'Sistema de diseño', sub: 'colores y letras', html: function (n) {
      var cols = [['Fondo', su.bg, ratio(su.ink, su.bg) + ' con el Texto', 'Fondo de toda la página'],
        ['Fondo 2', su.bg2, ratio(su.ink, su.bg2) + ' con el Texto', 'Separa bloques y tarjetas'],
        ['Texto', su.ink, ratio(su.ink, su.bg) + ' sobre el Fondo', 'Titulares y texto corrido'],
        ['Texto suave', su.mut, ratio(su.mut, su.bg2) + ' sobre el Fondo 2', 'Bajadas y notas'],
        ['Acento', su.vivo, ratio(su.ac, su.bg2) + ' como texto sobre el Fondo 2', 'Botones, precios y enlaces']];
      var min = Math.min.apply(null, M.pares(su).map(function (p) { return p.ratio; }));
      var muestra1 = svcs.length ? svcs[0].n.trim() : nombre;
      var precio1 = svcs.length && svcs[0].p.trim() ? 'desde ' + svcs[0].p.trim() : (ci ? ci.texto : su.vivo);
      var tramas = { rayos: 'Rayos de foco', grano: 'Grano de papel', grilla: 'Grilla de plano' };
      var cuerpo = cab(n, 'Sistema de diseño', 'Tus colores, y qué hace cada uno', 'Dirección «' + dir.nombre + '»: ' + dir.idea) +
        '<div class="colores">' + cols.map(function (c) {
          return '<div class="sw" style="background:' + c[1] + ';color:' + M.sobre(c[1]) + '"><p class="n">' + esc(c[0]) + '</p><p class="hx">' + c[1] + '</p><p class="us">' + esc(c[3]) + '</p><p class="rt">' + esc(c[2]) + '</p></div>';
        }).join('') + '</div>' +
        '<p class="nota"><strong>La regla:</strong> todo texto queda sobre 4,5:1 de contraste; el par más justo da ' + esc(min.toFixed(1).replace('.', ',')) + ':1.</p>' +
        '<div class="dos2"><div><div class="sh"><b>1</b><h2>Tus letras, con tus servicios</h2></div><div class="caja tipos">' +
        '<div class="tipo"><span class="aa" style="font-family:' + dir.display + ';font-weight:800">Aa</span><p class="mu" style="font-family:' + dir.display + ';font-weight:800;' + (dir.mayus ? 'text-transform:uppercase;' : '') + '">' + esc(muestra1) + '</p><p class="f"><b>' + esc(dir.tipos[0]) + '</b>Titulares</p></div>' +
        '<div class="tipo"><span class="aa" style="font-family:' + dir.texto + ';font-weight:400">Aa</span><p class="mu" style="font-family:' + dir.texto + '">' + esc(oficio) + (ST.comunas && ST.comunas.trim() ? ' · ' + esc(ST.comunas.trim()) : '') + '</p><p class="f"><b>' + esc(dir.tipos[1]) + '</b>Texto</p></div>' +
        '<div class="tipo"><span class="aa" style="font-family:' + dir.mono + '">Aα</span><p class="mu" style="font-family:' + dir.mono + ';color:var(--ac)">' + esc(precio1) + '</p><p class="f"><b>' + esc(dir.tipos[2]) + '</b>Cifras y rótulos</p></div>' +
        '</div><p class="nota">Licencia libre OFL.</p></div>' +
        '<div><div class="sh"><b>2</b><h2>Elementos propios</h2></div><div class="caja elem">' +
        '<div><span class="btn">' + esc(cta) + '</span><p>Botón de acento. Lo único que se aprieta.</p></div>' +
        '<div><div class="tr ' + dir.trama + '" aria-hidden="true"></div><p>' + esc(tramas[dir.trama] || '') + ' detrás de la portada.</p></div>' +
        '<div><p class="mu2">' + (dir.mayus ? 'TITULARES EN MAYÚSCULAS' : 'Titulares en minúsculas y mayúsculas') + '</p><p>' + esc(dir.voz.charAt(0).toUpperCase() + dir.voz.slice(1)) + '.</p></div>' +
        '</div></div></div>';
      return lamina('sistema', false, cuerpo, 'Sistema de diseño');
    } });

    /* ───────── 4 · tu sitio ───────── (siempre: portada y contacto existen en todos los planes) */
    laminas.push({ id: 'sitio', tit: ST.plan === 2 ? 'Tu sitio y tu panel' : 'Tu sitio', sub: ST.plan === 2 ? 'qué ve el cliente y qué ves tú' : 'qué ve el cliente', html: function (n) {
      var bl = [['Portada', 'Tu frase y el botón «' + cta + '»']];
      if (ori || nun || mom) bl.push(['Manifiesto', 'Cómo llegaste y tus dos principios']);
      if (svcs.length) bl.push(['Servicios', svcs.length + (svcs.length === 1 ? ' servicio' : ' servicios') + ', con precio desde']);
      if (ST.plan >= 1) bl.push(['Dónde', ST.where.length ? ST.where.join(' · ') : 'Dónde trabajas']);
      var campos = ['Nombre', 'Teléfono'].concat(ST.plan >= 1 ? ['Servicio'] : []).concat(ST.plan >= 1 ? ST.fields : []);
      bl.push(['Contacto', campos.join(' · ') + ' y WhatsApp']);
      if (ST.plan === 2) bl.push(['Tu panel', 'Entras y ves solo lo tuyo']);
      if (cie) bl.push(['Cierre', cie]);
      var servH = svcs.length ? '<div class="sh sp"><b>' + pad(1) + '</b><h2>Servicios</h2></div><div class="svcs s' + Math.min(svcs.length, 3) + '">' +
        svcs.map(function (v, k) {
          return '<div class="svc caja"><b class="no">' + pad(k + 1) + '</b><h3>' + esc(v.n.trim()) + '</h3>' + (v.d.trim() ? '<p>' + esc(v.d.trim()) + '</p>' : '') +
            (v.p.trim() ? '<p class="precio"><span>desde</span> <strong>' + esc(v.p.trim()) + '</strong></p>' : '') + '</div>';
        }).join('') + '</div>' : '';
      var pn = [];
      if (ST.plan === 2) {
        if (ST.avg != null && D.AVGS[ST.avg]) pn.push([D.AVGS[ST.avg], 'valor medio por trabajo']);
        if (ST.reply != null && D.REPLIES[ST.reply]) pn.push([D.REPLIES[ST.reply], 'tu meta de respuesta']);
        if (ST.books != null && D.BOOKS[ST.books]) pn.push([D.BOOKS[ST.books], 'donde llevas hoy tus cuentas']);
      }
      var panelH = pn.length ? '<div class="sh sp"><b>' + pad(svcs.length ? 2 : 1) + '</b><h2>Tu panel</h2></div><div class="cifras c' + pn.length + '">' +
        pn.map(function (x) { return '<div><strong>' + esc(x[0]) + '</strong><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' : '';
      var cuerpo = cab(n, ST.plan === 2 ? 'Tu sitio y tu panel' : 'Tu sitio', 'Tu sitio, hecho para el celular', 'Plan ' + plan.label + ' · ' + plan.price) +
        '<div class="mapa m' + bl.length + '">' + bl.map(function (b, k) {
          return '<div class="pg' + (k === 0 ? ' yo' : '') + '"><b>' + pad(k + 1) + '</b><h3>' + esc(b[0]) + '</h3><p>' + esc(b[1]) + '</p></div>';
        }).join('') + '</div>' + servH + panelH;
      return lamina('sitio', false, cuerpo, 'Tu sitio');
    } });

    /* ───────── 5 · tus imágenes ───────── (siempre: si el póster no se arma, queda la ilustración) */
    var PZ = [['post', 'Póster para Instagram', 1080, 1350], ['historia', 'Historia', 1080, 1920], ['afiche', 'Afiche para imprimir', 1240, 1754]];
    laminas.push({ id: 'imagenes', tit: 'Tus imágenes', sub: 'póster, historia y afiche', html: function (n) {
      var cuerpo = cab(n, 'Tus imágenes', nombre, 'Hechas con tu marca.') +
        '<div class="piezas">' + PZ.map(function (p) {
          var o = S.opcionesArte(ST, D, M, { w: 400, h: Math.round(400 * p[3] / p[2]), anim: false, sufijo: 'z' + p[0], grano: false });
          return '<figure><div class="pz" data-f="' + p[0] + '" style="aspect-ratio:' + p[2] + '/' + p[3] + '">' + (A ? A.escena(o) : '') + '</div><figcaption>' + esc(p[1]) + '</figcaption></figure>';
        }).join('') + '</div>';
      return lamina('imagenes', false, cuerpo, 'Tus imágenes');
    } });

    /* ───────── 6 · cómo sigue ───────── (siempre: el plan sale del cuestionario) */
    laminas.push({ id: 'cierre', tit: 'Próximos pasos', sub: 'y contacto', html: function (n) {
      var tel = '+56 9 6246 9977', wa = 'https://wa.me/' + (CFG.whatsapp || '56962469977') + '?text=' + encodeURIComponent('Hola, vi la presentación de ' + nombre + ' y quiero seguir.');
      var anual = ST.modalidad !== 0, desc = plan.desc.split(' · ')[0];
      var grande = anual ? pesos(plan.anual) : pesos(plan.mes);
      var l1 = anual ? 'al año, con IVA. 12 meses al precio de 10.' : 'al mes, con IVA. Sin permanencia.';
      var l2 = anual ? 'O mes a mes: ' + pesos(plan.mes) + '. Sin permanencia: si te vas, te vas.' : 'O el año de una vez: ' + pesos(plan.anual) + ' (12 meses al precio de 10).';
      var pasos = [['Revisas esta presentación y tu borrador', 'Lo que no suene a ti, lo cambiamos. Es tu marca.'],
        ['Nos mandas fotos de trabajos terminados', 'Para «Trabajos hechos»: reales, con permiso del dueño de casa.'],
        ['Afinamos fotos, precios y tu frase', 'Y te lo mostramos antes de publicar.'],
        ['Lo publicas y decides si te lo quedas', 'Plan ' + plan.label + ': ' + pesos(plan.anual) + ' al año o ' + pesos(plan.mes) + ' al mes, con IVA. Nada para partir.']];
      var cuerpo = '<div class="cierre"><div class="col">' +
        '<div class="plan"><p class="k">Tu plan</p><p class="pn">' + esc(plan.label) + '</p><p class="ds">' + esc(desc) + '</p><p class="monto">' + esc(grande) + '</p><p class="ds">' + esc(l1) + '</p><p class="ln">' + esc(l2) + '</p>' +
        '<p class="ok"><b>No pagas nada para partir.</b> Ves tu sitio armado y pagas cuando decides quedártelo.</p></div>' +
        (cie ? '<p class="cita">«' + esc(cie.replace(/\.$/, '')) + '»</p>' : '') + '</div>' +
        '<div class="col"><header><p class="k"><b>' + pad(laminas.length) + '</b> · Próximos pasos</p><h1 class="' + tam('x'.repeat(40)) + '">' + titHTML(primer + ', tu sitio ya está armado. Falta tu sí.') + '</h1></header>' +
        '<ol class="pasos">' + pasos.map(function (p, k) { return '<li><b>' + pad(k + 1) + '</b><div><strong>' + esc(p[0]) + '</strong><span>' + esc(p[1]) + '</span></div></li>'; }).join('') + '</ol>' +
        '<div class="contacto"><div><h3>Escríbeme y lo dejamos andando.</h3><p>Te respondo por WhatsApp.</p></div><div class="datos"><strong>Sebastián Tapia Mena</strong><a href="' + esc(wa) + '" target="_blank" rel="noopener">' + tel + '</a><span>stapiamena@compai.cl</span></div></div>' +
        '<p class="hecho"><span>hecho con</span> <b class="soul">soul</b> · SOUL · El alma de tu oficio · Un servicio de compAI</p>' +
        '<button type="button" class="volver" data-ir="portada">← Volver a la portada</button></div></div>';
      return lamina('cierre', true, cuerpo, 'Próximos pasos');
    } });

    /* ───────── 1 · portada (lleva el índice de las demás) ───────── */
    var bajada = [oficio].concat(ST.where || []).concat(ST.comunas && ST.comunas.trim() ? [ST.comunas.trim()] : []).join(' · ');
    var indice = laminas.map(function (l, i) { return '<div class="fila"><b>' + pad(i + 1) + '</b><span>' + esc(l.tit) + '</span><i>' + esc(l.sub) + '</i></div>'; }).join('');
    var hero = A ? A.escena(S.opcionesArte(ST, D, M, { w: 560, h: 1061, anim: false, sufijo: 'por', par: 'xMidYMid slice', anchoFig: 0.74 })) : '';
    var titP = tit || nombre;
    var portada = '<section class="lamina portada" id="portada" data-lam="portada" aria-label="Portada"><div class="izq">' + mono() +
      '<p class="k">Presentación corporativa · ' + esc(mes) + '</p><h1 class="' + tam(titP) + '">' + titHTML(titP) + '</h1>' +
      '<p class="baj">' + esc(bajada) + '</p>' + (ci ? '<p class="k prueba">' + esc(ci.texto) + '</p>' : '') +
      '<div class="indice"><p class="k">Contenido</p>' + indice + '</div>' +
      '<div class="abajo"><p class="quien"><strong>Preparado para ' + esc(ST.name.trim()) + '</strong>' + (ST.insta && ST.insta.trim() ? '@' + esc(ST.insta.trim().replace(/^@/, '')) : '') + '</p><p class="hecho"><span>hecho con</span> <b class="soul">soul</b></p></div>' +
      pie(false) + '</div><div class="der">' + hero + '</div></section>';

    /* ───────── montaje ───────── */
    var vars = '--display:' + dir.display + ';--texto:' + dir.texto + ';--mono:' + dir.mono +
      ';--Bbg:' + su.bg + ';--Bbg2:' + su.bg2 + ';--Bink:' + su.ink + ';--Bmut:' + su.mut + ';--Bac:' + su.ac + ';--Bvivo:' + su.vivo + ';--Bvb:' + su.vb + ';--Bon:' + su.on + ';--Bln:' + rgba(su.ink, .3) +
      ';--Ibg:' + su.bgI + ';--Ibg2:' + su.bg2I + ';--Iink:' + su.inkI + ';--Imut:' + su.mutI + ';--Iac:' + su.acI + ';--Ivivo:' + su.vivoI + ';--Ivb:' + su.vbI + ';--Ion:' + su.onI + ';--Iln:' + rgba(su.inkI, .3);
    document.title = 'Presentación de marca · ' + nombre;
    document.body.style.background = '#C9D3DC';
    raiz.setAttribute('style', vars);
    raiz.setAttribute('data-dir', dir.id);
    raiz.innerHTML = '<div class="barra"><span class="bn">' + esc(nombre) + '</span><button type="button" class="guardar" id="guardar">Guardar como PDF</button></div>' +
      portada + laminas.map(function (l, i) { return l.html(i + 1); }).join('');

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ir]'); if (!b) return;
      var d = document.getElementById(b.getAttribute('data-ir'));
      if (d) d.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });

    /* Las imágenes (póster, historia, afiche) se dibujan con arte.js; hasta entonces —o si algo falla— queda la ilustración.
       «Guardar como PDF» espera a que estén, para que el PDF no salga con la ilustración en su lugar. */
    var lista = Promise.resolve();
    if (A && A.poster) {
      PZ.forEach(function (p) {
        lista = lista.then(function () {
          var k = S.kit(ST, D, M, CFG); k.formato = p[0];
          k.pie = '../img/' + (M.sobre(k.tintas.bg) === '#FFFFFF' ? 'pie-compai-claro' : 'pie-alma-compai-oscuro') + '.png';
          return A.poster(k).then(function (c) {
            var caja = raiz.querySelector('.pz[data-f="' + p[0] + '"]'); if (!caja) return;
            var im = new Image(); im.alt = p[1] + ' de ' + nombre; im.width = p[2]; im.height = p[3]; im.src = c.toDataURL('image/jpeg', 0.86);
            return new Promise(function (ok2) { im.onload = im.onerror = ok2; caja.classList.add('lista'); caja.innerHTML = ''; caja.appendChild(im); });
          }).catch(function () { /* queda la ilustración */ });
        });
      });
    }
    /* Ajuste a la página impresa: con las letras ya cargadas, cada lámina se mide a 1500 x 1061; si no cabe pasa a .apr y, si aún
       no cabe, a .apr2 (corta con «…» lo larguísimo). Así una respuesta muy larga nunca empuja nada fuera de su página. */
    function ajustar() {
      raiz.classList.add('medir');
      [].forEach.call(raiz.querySelectorAll('.lamina'), function (l) {
        l.classList.remove('apr', 'apr2');
        ['', 'apr', 'apr2'].some(function (c) { l.classList.remove('apr', 'apr2'); if (c) l.classList.add(c); return l.scrollHeight <= l.clientHeight; });
      });
      raiz.classList.remove('medir');
    }
    var fuentes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    window.__semillaLista = fuentes.then(ajustar).then(function () { return lista; }).then(function () { document.body.setAttribute('data-lista', '1'); return true; });
    document.getElementById('guardar').addEventListener('click', function () { window.__semillaLista.then(function () { window.print(); }); });
  }
})();
