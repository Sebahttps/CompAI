/* SOUL · el sitio de la persona, una sola fuente de verdad (28-10-2026).
   Lo usan DOS paginas: preguntas.html (vista previa del borrador) y s/index.html (el enlace publico que
   la persona comparte). Aqui viven: el codigo del enlace (codificar/decodificar), los ayudantes que
   derivan datos de las respuestas (paleta, direccion, superficies) y el render del sitio completo.
   Sin servidor, sin CDN: el sitio se arma en el navegador de quien abre el enlace.
   Uso: SOUL_SITIO.html(ST, { D, M, cfg, mem, base, vivo }) -> string HTML.
     base = prefijo de las imagenes ('' en soul/, '../' en soul/s/). vivo = formulario real (true) o maqueta (false). */
(function (W) {
  'use strict';
  var TONO_CTA = ['Cuéntame qué necesitas', 'Solicitar cotización', '¡Hablemos!', 'Cotizar'];
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }
  function fondo(url) { return url ? 'background-image:url(' + url + ')' : 'background-image:linear-gradient(135deg,#BFE3F5 0%,#FFE9A3 60%,#FFD3B4 100%)'; }

  /* ───────── ayudantes: derivan datos de las respuestas (ST) ───────── */
  function esOtro(ST, D) { return ST.oficio === D.OFICIOS.length - 1; }
  function ofi(ST, D) { return D.OFICIOS[ST.oficio == null ? D.OFICIOS.length - 1 : ST.oficio]; }
  function pal(ST, D) { return ST.palette === D.PALETTES.length - 1 ? ST.myColors : D.PALETTES[ST.palette == null ? 0 : ST.palette].c; }
  function oficioNombre(ST, D) { return esOtro(ST, D) ? (ST.oficioOtro || 'Otro oficio') : ofi(ST, D).label; }
  function dirActual(ST, D, M) { return ST.dir != null ? ST.dir : M.elegir(ST, D); }
  function sup(ST, D, M) { return M.superficies(M.DIRS[dirActual(ST, D, M)], ST.bg === 0, pal(ST, D)[0]); }
  function svcsLlenos(ST) { return ST.svcs.filter(function (x) { return x.n.trim(); }); }
  function slug(ST) { return (ST.name || 'tu-negocio').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'tu-negocio'; }

  /* ───────── el codigo del enlace ───────── */
  /* El enlace publico lleva las respuestas en el # (nunca llega a un servidor). Formato: JSON -> UTF-8 -> base64url.
     Para que pese poco SOLO viaja lo que la persona cambio respecto de nuevo(). Va el WhatsApp (el sitio lo muestra
     como boton de contacto); NO va el correo, ni el estado interno. */
  var FUERA = ['correo', 'email', 'result', 'step'];
  function nuevo() {
    return {
      step: 0, plan: 1, name: '', apodo: '', oficio: null, oficioOtro: '', likes: [], likeOtro: '',
      palette: null, concept: 0, conceptText: '', style: 0, bg: 0, motion: 1, tone: 0, enfoque: 2,
      myColors: ['#E8789A', '#FFF1B8', '#2A1D45'], photoName: '',
      svcs: [0, 1, 2].map(function () { return { n: '', p: '', d: '', ph: 'lib', phName: '' }; }),
      where: [], comunas: '', insta: '', fb: '', fields: [], email: '',
      avg: null, reply: null, books: null, modalidad: null, tel: '', correo: '', result: null,
      // el alma (SOUL 2) y la dirección de marca (null = la elige el borrador)
      origen: '', unico: '', nunca: '', momento: '', cifraN: '', cifraU: '', cifraOtro: '', cierre: '', dir: null
    };
  }
  /* Une unas respuestas leidas (de sessionStorage o de un enlace) con los valores por defecto: lo que falta se completa. */
  function mezclar(s) {
    var base = nuevo();
    Object.keys(base).forEach(function (k) {
      if (s[k] === undefined || s[k] === null) { if (k === 'oficio' || k === 'dir' || k === 'palette' || k === 'avg' || k === 'reply' || k === 'books' || k === 'result' || k === 'modalidad') base[k] = null; return; }
      if (Array.isArray(base[k]) !== Array.isArray(s[k])) return;
      base[k] = s[k];
    });
    if (base.svcs.length < 1 || base.svcs.length > 6) base.svcs = nuevo().svcs;
    return base;
  }
  function b64u(str) {
    var by = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < by.length; i++) bin += String.fromCharCode(by[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function deB64u(h) {
    h = h.replace(/-/g, '+').replace(/_/g, '/'); while (h.length % 4) h += '=';
    var bin = atob(h), by = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) by[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(by);
  }
  function codificar(ST) {
    var def = nuevo(), o = {};
    Object.keys(ST).forEach(function (k) {
      if (FUERA.indexOf(k) >= 0 || !(k in def)) return;
      if (JSON.stringify(ST[k]) !== JSON.stringify(def[k])) o[k] = ST[k];
    });
    if (o.svcs) o.svcs = ST.svcs.filter(function (v) { return v.n.trim(); }).map(function (v) { return { n: v.n, p: v.p, d: v.d }; });   // las fotos subidas no viajan: pesan
    return b64u(JSON.stringify(o));
  }
  function decodificar(h) { return mezclar(JSON.parse(deB64u(h))); }


  /* ───────── el render ───────── */
  function html(ST, o) {
    var D = o.D, M = o.M, MEM = o.mem || { photo: '', svcPh: {} }, base = o.base || '', vivo = !!o.vivo;
    var WSP = (o.cfg && o.cfg.whatsapp) || '56962469977', sobre = M.sobre;
    function oficioNombre_() { return oficioNombre(ST, D); }
    function dirActual_() { return dirActual(ST, D, M); }
    function sup_() { return sup(ST, D, M); }
    function svcsLlenos_() { return svcsLlenos(ST); }
  function iniciales() {
    var w = M.marcaNombre(ST).split(/\s+/).filter(Boolean);
    return (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : (w[0] || 'S').slice(0, 2)).toUpperCase();
  }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  /* El arte de la portada y de las tarjetas: monograma gigante + el motivo del oficio + la trama de la dirección. */
  function motivoG(tf, sw) {
    var singer = ST.oficio === 0, m = D.MOTIFS[ST.oficio == null ? D.MOTIFS.length - 1 : ST.oficio];
    return '<path d="' + m + '" transform="' + tf + '" fill="' + (singer ? 'var(--ac)' : 'none') + '" fill-opacity="' + (singer ? '.5' : '0') + '" stroke="' + (singer ? 'none' : 'var(--ac)') + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".6"></path>';
  }
  function arteSVG(d) {
    var o = '<svg viewBox="0 0 400 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">', k;
    if (d.trama === 'rayos') {
      for (k = 0; k < 9; k++) o += '<line x1="200" y1="-40" x2="' + (k * 50 - 20) + '" y2="780" stroke="var(--ac)" stroke-opacity=".16" stroke-width="1.2"></line>';
    } else if (d.trama === 'grano') {
      o += '<defs><pattern id="vpg" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="var(--ink)" fill-opacity=".16"></circle><circle cx="14" cy="14" r="1" fill="var(--ink)" fill-opacity=".1"></circle></pattern></defs><rect width="400" height="760" fill="url(#vpg)"></rect>';
    } else {
      for (k = 1; k < 10; k++) o += '<line x1="' + k * 40 + '" y1="0" x2="' + k * 40 + '" y2="760" stroke="var(--ink)" stroke-opacity=".08"></line>';
      for (k = 1; k < 19; k++) o += '<line x1="0" y1="' + k * 40 + '" x2="400" y2="' + k * 40 + '" stroke="var(--ink)" stroke-opacity=".08"></line>';
      o += '<path d="M40 40h40M40 40v40M360 720h-40M360 720v-40" stroke="var(--ac)" stroke-width="2" fill="none"></path>';
    }
    o += '<text x="-14" y="560" style="font-family:var(--display);font-weight:800;font-size:520px;letter-spacing:-.04em" fill="none" stroke="var(--ac)" stroke-opacity=".34" stroke-width="2">' + esc(iniciales()) + '</text>';
    o += ST.oficio === 0 ? motivoG('translate(-38 120) scale(4.6)', 2) : motivoG('translate(88 190) scale(9)', 2.4);
    return o + '</svg>';
  }
  function arteTarjeta() {
    var m = D.MOTIFS[ST.oficio == null ? D.MOTIFS.length - 1 : ST.oficio];
    var tf = ST.oficio === 0 ? 'translate(78 -2) scale(.95)' : 'translate(66 14) scale(2.6)';
    return '<svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path d="' + m + '" transform="' + tf + '" fill="' + (ST.oficio === 0 ? 'var(--ac)' : 'none') + '" fill-opacity=".45" stroke="' + (ST.oficio === 0 ? 'none' : 'var(--ac)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".7"></path></svg>';
  }

  /* Las últimas palabras del titular van en el acento: el remate se lee primero (vara de Miguel). */
  function titHTML(t) {
    var w = String(t).split(' '); if (w.length < 3) return esc(t);
    var k = w.length > 5 ? 2 : 1;
    return esc(w.slice(0, -k).join(' ')) + ' <em>' + esc(w.slice(-k).join(' ')) + '</em>';
  }
  function sitioBorrador_() {
    var dark = ST.bg === 0, di = dirActual_(), d = M.DIRS[di], su = sup_();
    var anim = ST.motion === 0 ? '' : ST.motion === 1 ? ' kb1' : ' kb2';
    var nombre = M.marcaNombre(ST);
    var cta = TONO_CTA[ST.tone] || 'Cotizar';
    var tel = digitos(ST.tel);
    var wsp = 'https://wa.me/' + (tel.length >= 8 ? (tel.length === 9 && tel.charAt(0) === '9' ? '56' + tel : tel) : WSP) + (vivo ? '?text=' + encodeURIComponent('Hola ' + nombre + ', vi tu sitio y quiero cotizar.') : '');
    var ci = M.cifra(ST, D), tit = M.titular(ST), cie = M.cierre(ST);
    var n = 0; function num(t) { n++; return '<p class="mn num">' + pad(n) + ' — ' + esc(t) + '</p>'; }
    var vars = '--display:' + d.display + ';--texto:' + d.texto + ';--mono:' + d.mono +
      ';--bg:' + su.bg + ';--bg2:' + su.bg2 + ';--ink:' + su.ink + ';--mut:' + su.mut + ';--ac:' + su.ac + ';--on:' + sobre(su.ac) + ';--ln:' + rgba(su.ink, .22) +
      ';--bgI:' + su.bgI + ';--bg2I:' + su.bg2I + ';--inkI:' + su.inkI + ';--mutI:' + su.mutI + ';--acI:' + su.acI + ';--onI:' + sobre(su.acI) + ';--lnI:' + rgba(su.inkI, .22);
    var s = '<div class="vp' + (d.mayus ? ' my' : '') + '" data-dir="' + d.id + '" style="' + vars + '">';
    // portada alta: nav + arte (foto propia si la hay; si no, arte SVG con la paleta) + titular
    s += '<section class="hero sf-a" aria-label="Portada"><div class="arte' + anim + '"' + (MEM.photo ? ' style="' + fondo(MEM.photo) + '"' : '') + '>' + (MEM.photo ? '' : arteSVG(d)) + '</div><div class="scrim"></div>' +
      '<div class="nav"><span class="logo"><i aria-hidden="true">' + esc(iniciales()) + '</i><b>' + esc(nombre) + '</b></span><a class="cta" href="#vp-cotiza" data-vp>' + esc(cta) + '</a></div>' +
      '<div class="in-h"><p class="mn">' + esc(oficioNombre_()) + '</p><h2 class="tit">' + titHTML(tit || nombre) + '</h2>' +
      (ci ? '<p class="mn prueba">' + esc(ci.texto) + '</p>' : '') +
      '<div class="acc"><a class="cta" href="#vp-cotiza" data-vp>' + esc(cta) + '</a><a class="cta sec" href="' + esc(wsp) + '" target="_blank" rel="noopener">WhatsApp</a></div></div></section>';
    // manifiesto: origen + dos principios, todo con palabras de la persona
    var ori = M.origen(ST), pr = [['I · Mi límite', M.nunca(ST)], ['II · Mi vara', M.momento(ST)]].filter(function (x) { return x[1]; });
    if (ori || pr.length) {
      s += '<section class="s sf-i" aria-label="Manifiesto">' + num('Manifiesto') + (ori ? '<p class="mani">' + esc(ori) + '</p>' : '') +
        (pr.length ? '<div class="tres">' + pr.map(function (x) { return '<div><p class="mn">' + esc(x[0]) + '</p><p>' + esc(x[1]) + '</p></div>'; }).join('') + '</div>' : '') + '</section>';
    }
    // servicios
    var lleno = svcsLlenos_();
    if (lleno.length) {
      if (ST.plan === 0) {
        s += '<section class="s sf-a" aria-label="Servicios">' + num('Servicios') + '<h3>Lo que hago por ti</h3><ul class="lista">' +
          lleno.map(function (v) { return '<li><b>' + esc(v.n.trim()) + '</b>' + (v.p.trim() ? '<span class="pr">desde ' + esc(v.p.trim()) + '</span>' : '') + '</li>'; }).join('') + '</ul></section>';
      } else {
        var c = 0;
        s += '<section class="s sf-a" aria-label="Servicios">' + num('Servicios') + '<h3>Lo que hago por ti</h3><div class="svcs">' +
          ST.svcs.map(function (v, k) {
            if (!v.n.trim()) return '';
            c++;
            var propia = v.ph === 'up' && MEM.svcPh[k];
            return '<div class="svcc">' + (propia ? '<div class="ph" style="' + fondo(esc(MEM.svcPh[k])) + '"></div>' : '<div class="ph art">' + arteTarjeta() + '<p class="mn">' + pad(c) + '</p></div>') +
              '<div class="bd"><b>' + esc(v.n.trim()) + '</b>' + (v.p.trim() ? '<span class="pr">desde ' + esc(v.p.trim()) + '</span>' : '') + (v.d.trim() ? '<p>' + esc(v.d.trim()) + '</p>' : '') + '</div></div>';
          }).join('') + '</div></section>';
      }
    }
    if (ST.plan >= 1) {
      var dnd = ST.where.join(' · ');
      s += '<section class="s sf-b" aria-label="Dónde trabajo">' + num('Dónde') + '<h3>' + esc(dnd || 'Dónde trabajo') + '</h3>' +
        (ST.comunas.trim() ? '<p class="t">' + esc(ST.comunas.trim()) + '</p>' : '') +
        ((ST.insta.trim() || ST.fb.trim()) ? '<div class="tags">' + [ST.insta.trim(), ST.fb.trim()].filter(Boolean).map(function (r) { return '<span class="tag">' + esc(r) + '</span>'; }).join('') + '</div>' : '') + '</section>';
    }
    // formulario de cotización
    var campos = ['Nombre', 'Teléfono'].concat(ST.plan >= 1 ? ['Servicio'] : []).concat(ST.plan >= 1 ? ST.fields : []);
    if (!vivo) {
      // vista previa en preguntas.html: maqueta, no se puede escribir
      s += '<section class="s sf-a" id="vp-cotiza" aria-label="Cotiza">' + num('Contacto') + '<h3>' + esc(cta) + '</h3><div class="form" aria-hidden="true">' +
        campos.map(function (c) { return '<label>' + esc(c) + '<span class="fake">' + (c === 'Servicio' ? 'Elige un servicio ▾' : '') + '</span></label>'; }).join('') +
        '<span class="cta">Enviar</span></div><a class="wsp" href="' + esc(wsp) + '" target="_blank" rel="noopener">Escríbeme por WhatsApp</a></section>';
    } else {
      // enlace público: formulario real. s/index.html lo envia al endpoint con el slug (ver s/sitio-publico.js).
      var lleno2 = svcsLlenos_();
      s += '<section class="s sf-a" id="vp-cotiza" aria-label="Cotiza">' + num('Contacto') + '<h3>' + esc(cta) + '</h3>' +
        '<form class="form" data-cotiza="' + esc(slug(ST)) + '" novalidate>' +
        '<label>Tu nombre<input name="nombre" type="text" autocomplete="name" maxlength="80" required></label>' +
        '<label>Tu WhatsApp<input name="telefono" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" required></label>' +
        '<label>Tu correo<input name="correo" type="email" autocomplete="email" maxlength="120" required></label>' +
        (ST.plan >= 1 && lleno2.length ? '<label>Servicio<select name="servicio">' + lleno2.map(function (v) { return '<option>' + esc(v.n.trim()) + '</option>'; }).join('') + '</select></label>' : '') +
        (ST.plan >= 1 ? ST.fields.filter(function (f) { return f !== 'Fotos'; }).map(function (f) { return '<label>' + esc(f) + '<input name="f_' + esc(f) + '" type="text" maxlength="120" data-campo="' + esc(f) + '"></label>'; }).join('') : '') +
        '<label class="ancho">Cuéntame qué necesitas<textarea name="mensaje" rows="3" maxlength="600"></textarea></label>' +
        '<span class="trampa" aria-hidden="true"><input name="sitioweb" tabindex="-1" autocomplete="off"></span>' +
        '<button class="cta" type="submit">Enviar</button><p class="est" role="status" aria-live="polite"></p></form>' +
        '<a class="wsp" href="' + esc(wsp) + '" target="_blank" rel="noopener">Escríbeme por WhatsApp</a></section>';
    }
    // el panel (vibe)
    if (ST.plan === 2 && !vivo) {   // el panel es de la persona, no de quien visita su sitio
      s += '<section class="s sf-b" aria-label="Tu panel">' + num('Tu panel') + '<h3>Cada solicitud, guardada.</h3><p class="t">Entras con <b>' + esc(ST.email.trim() || 'tu correo') + '</b> y ves solo lo tuyo.</p><div class="panel">' +
        '<div><b>0</b><span>solicitudes este mes</span></div>' +
        '<div><b>' + esc(ST.avg == null ? '—' : D.AVGS[ST.avg]) + '</b><span>valor medio por trabajo</span></div>' +
        '<div><b>' + esc(ST.reply == null ? '—' : D.REPLIES[ST.reply]) + '</b><span>tu meta de respuesta</span></div>' +
        '<div><b>' + esc(ST.books == null ? '—' : D.BOOKS[ST.books]) + '</b><span>donde llevas hoy tus cuentas</span></div></div></section>';
    }
    // cierre: la frase que la persona quiere que digan de ella
    if (cie) s += '<section class="s sf-i" aria-label="Cierre"><p class="cie">' + esc(cie) + '</p><a class="wsp" href="' + esc(wsp) + '" target="_blank" rel="noopener">Escríbeme por WhatsApp</a></section>';
    // pie oficial (CLAUDE.md 4.b): solo la imagen «alma compAI», 40 px libres arriba y la línea. Oscuro → crema; claro → tinta.
    var finOscuro = cie ? !dark : dark;
    s += '<footer class="vf ' + (cie ? 'sf-i' : 'sf-a') + '"><div class="pie"><div class="pie-compai"><img src="' + base + 'img/' + (finOscuro ? 'pie-compai-claro' : 'pie-alma-compai-oscuro') + '.png" width="310" height="95" alt="alma compAI"></div></div></footer>';
    return s + '</div>';
  }
    return sitioBorrador_();
  }

  W.SOUL_SITIO = {
    html: html, nuevo: nuevo, mezclar: mezclar, codificar: codificar, decodificar: decodificar,
    esc: esc, pad: pad, digitos: digitos, slug: slug, pal: pal, ofi: ofi, esOtro: esOtro, oficioNombre: oficioNombre,
    dirActual: dirActual, sup: sup, svcsLlenos: svcsLlenos, TONO_CTA: TONO_CTA
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = W.SOUL_SITIO;
})(typeof window !== 'undefined' ? window : globalThis);
