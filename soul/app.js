/* SOUL · las preguntas como una app de una pagina.
   Traduccion a JS plano de Paso00..Paso20 (diseño aprobado): mismas preguntas,
   mismos saltos por plan. SOUL 2 (27-10-2026) suma 6 pasos «del alma» tras el oficio
   (fresh 16 / sun 21 / vibe 25 preguntas) y la marca en miniatura (marca.js).
   - Estado en memoria + sessionStorage (con try/catch: modo privado no rompe nada).
   - Al confirmar: POST al Apps Script de las cotizaciones con tipo «soul».
     Si falla, NUNCA en silencio: se dice en pantalla y se ofrece WhatsApp con las
     respuestas escritas.
   - La vista previa del sitio borrador se arma aca mismo, en el navegador.
   Ejecutar: abrir soul/preguntas.html desde cualquier servidor estatico
   (p. ej. `python3 -m http.server` en sitio/compai). */
(function () {
  'use strict';
  var D = window.SOUL_DATA;
  var M = window.SOUL_MARCA;
  var S = window.SOUL_SITIO;   // sitio.js: el render del sitio y el codigo del enlace, compartidos con soul/s/
  var CFG = window.SOUL_CFG || { endpoint: '', whatsapp: '56962469977' };
  var WSP = CFG.whatsapp || '56962469977';
  var WSP_TXT = '+56 9 6246 9977';
  var KEY = 'soul.respuestas.v1';
  var CUSTOM_PAL = D.PALETTES.length - 1;
  var MODOS = [
    { titulo: 'Mes a mes', desc: function (p) { return p.price + ' con IVA. Sin permanencia.'; }, resumen: function (p) { return 'Mes a mes · ' + pesos(p.mes) + ' al mes con IVA'; } },
    { titulo: 'El año de una vez', desc: function (p) { return pesos(p.anual) + ' (12 meses al precio de 10) y tu .cl propio desde el primer día.'; }, resumen: function (p) { return 'El año de una vez · ' + pesos(p.anual) + ', con .cl propio inmediato'; } }
  ];

  /* ───────── utilidades ───────── */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function pesos(n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function correoOk(c) { return /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(c); }
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }

  /* ───────── estado ───────── */
  function nuevo() { return S.nuevo(); }
  var ST = nuevo();
  // Las fotos viven solo en memoria: pesan, y no hace falta guardarlas en sessionStorage.
  var MEM = { photo: '', svcPh: {} };
  var enviando = false, pendiente = null, errorMsg = '';

  var VISTA = false;   // true cuando se abre el enlace «#borrador=…» del correo: solo mira, no guarda ni mide
  function guardar() { if (VISTA || (ST.result && ST.result.ok)) return; try { sessionStorage.setItem(KEY, JSON.stringify(ST)); } catch (_) { /* modo privado o lleno: se sigue en memoria */ } }
  function mezclar(s) { return S.mezclar(s); }
  function cargar() {
    try { var raw = sessionStorage.getItem(KEY); if (raw) ST = mezclar(JSON.parse(raw)); } catch (_) { ST = nuevo(); }
  }
  /* El borrador viaja en el enlace del correo: las respuestas (sin teléfono ni correos) en base64url. Sin servidor. */
  function codificar() { return S.codificar(ST); }
  function decodificar(h) { return S.decodificar(h); }

  /* ───────── la secuencia segun el plan ───────── */
  function seq() {
    // fresh promete «la lista de tus servicios»: el paso 11 lo piden los tres planes (26-10-2026, ClAI-nte)
    // 21..26 = las 6 preguntas del alma (marcadas F en la propuesta): van tras el oficio, en los tres planes
    return [0, 1, 21, 22, 23, 24, 25, 26, 2, 3, 4, 5, 6, 7, 8, 9, 11].concat(ST.plan >= 1 ? [12, 13, 14, 15, 16] : [], ST.plan === 2 ? [17, 18, 19, 20] : [], [10]);
  }
  function total() { return seq().length - 1; }     // indice de la ficha
  function nPreg() { return total() - 1; }

  /* ───────── datos derivados ───────── */
  function esOtro() { return S.esOtro(ST, D); }
  function ofi() { return S.ofi(ST, D); }
  function oficioLabel() { return esOtro() ? (ST.oficioOtro || 'tu oficio') : ofi().label.toLowerCase(); }
  function pal() { return S.pal(ST, D); }
  function concepto() { return ST.conceptText || ofi().concepts[ST.concept]; }
  function oficioNombre() { return S.oficioNombre(ST, D); }
  // «Otro oficio» no lleva foto de un oficio concreto: fondo neutro de la marca.
  function fotoOficio() {
    var o = ofi(), n = o.img === undefined ? ST.oficio : o.img;
    return n == null ? '' : 'img/oficio-' + pad(n) + '.webp';
  }
  function fondo(url) { return url ? 'background-image:url(' + url + ')' : 'background-image:linear-gradient(135deg,#BFE3F5 0%,#FFE9A3 60%,#FFD3B4 100%)'; }
  function slug() { return S.slug(ST); }
  var DOMINIO = 'Partes en compai.cl/tu-negocio; tu propio .cl llega desde el segundo mes, o de inmediato si pagas el año.';
  function svcsLlenos() { return S.svcsLlenos(ST); }

  function EJ() { return D.EJEMPLOS[ST.oficio == null ? D.EJEMPLOS.length - 1 : ST.oficio]; }
  function dirActual() { return S.dirActual(ST, D, M); }
  function cifraTxt() { var c = M.cifra(ST, D); return c ? c.texto : ''; }
  function sup() { return S.sup(ST, D, M); }

  /* ───────── piezas de HTML ───────── */
  function chip(label, on, a, i) { return '<button type="button" class="chip" aria-pressed="' + (on ? 'true' : 'false') + '" data-a="' + a + '" data-i="' + i + '">' + esc(label) + '</button>'; }
  function fila(inner, on, a, i) { return '<button type="button" class="rowb" aria-pressed="' + (on ? 'true' : 'false') + '" data-a="' + a + '" data-i="' + i + '">' + inner + '</button>'; }
  function filaTD(label, desc, on, a, i, quoted) {
    return fila('<span class="t"><strong>' + esc(label) + '</strong>' + (desc ? '<span>' + (quoted ? '«' + esc(desc) + '»' : esc(desc)) + '</span>' : '') + '</span>', on, a, i);
  }
  function campoTexto(label, k, val, ph, extra) {
    return '<label class="campo"><span class="mono m-sub">' + esc(label) + '</span><input class="in" type="' + ((extra && extra.type) || 'text') + '" data-k="' + k + '" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '"' + ((extra && extra.attrs) || '') + '></label>';
  }
  function kick(txt, cls) { return '<p class="mono ' + (cls || 'kick') + '" style="margin:0">' + esc(txt) + '</p>'; }

  /* Los cuatro enfoques de la escena (pregunta 5): mismos dibujos del diseño. */
  function enfSvg(i) {
    var p = pal(), singer = ST.oficio === 0, music = ST.oficio === 0 || ST.oficio === 9;
    var motif = D.MOTIFS[ST.oficio == null ? D.MOTIFS.length - 1 : ST.oficio];
    function mk(color, iconTf, singerTf) {
      return { tf: singer ? singerTf : iconTf, fill: singer ? color : 'none', stroke: singer ? 'none' : color, sw: singer ? 0 : 2.4 };
    }
    function path(t) {
      return '<path d="' + motif + '" transform="' + t.tf + '" fill="' + t.fill + '" stroke="' + t.stroke + '" stroke-width="' + t.sw + '" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>';
    }
    var o = '<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">', t;
    if (i === 0) {
      t = mk(p[1], 'translate(20 34) scale(2.5)', '');
      o += '<rect width="100" height="120" fill="' + p[2] + '"></rect><polygon points="50,0 18,120 40,120" fill="' + p[1] + '" opacity=".22"></polygon><polygon points="50,0 60,120 88,120" fill="' + p[0] + '" opacity=".4"></polygon><polygon points="50,0 0,55 0,85" fill="' + p[1] + '" opacity=".16"></polygon><polygon points="50,0 100,50 100,80" fill="' + p[0] + '" opacity=".3"></polygon><polygon points="0,120 0,100 10,94 20,102 30,96 40,104 50,98 60,104 70,96 80,102 90,94 100,100 100,120" fill="#000000" opacity=".28"></polygon>' + path(t);
    } else if (i === 1) {
      t = mk('#EDEDED', 'translate(-22 -8) scale(6)', 'translate(-82 -14) scale(2.7)');
      o += '<rect width="100" height="120" fill="#121212"></rect><circle cx="50" cy="62" r="46" fill="#232323"></circle>' + path(t) + '<rect width="100" height="120" fill="#FFFFFF" opacity=".04"></rect>';
    } else if (i === 2) {
      t = mk(p[0], 'translate(26 38) scale(2)', '');
      o += '<rect width="100" height="120" fill="#0B0A08"></rect><circle cx="12" cy="10" r="6" fill="#E8B23A" opacity=".7"></circle><circle cx="30" cy="12" r="6" fill="#E8B23A" opacity=".5"></circle><circle cx="48" cy="9" r="5" fill="#E8B23A" opacity=".4"></circle><circle cx="86" cy="14" r="5" fill="#E8B23A" opacity=".35"></circle><ellipse cx="50" cy="112" rx="40" ry="6" fill="' + p[0] + '" opacity=".18"></ellipse>' + path(t);
    } else {
      t = mk('#B4B4B4', 'translate(26 40) scale(2)', 'translate(17 30) scale(.7)');
      o += '<defs><linearGradient id="soulMonoG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4A4A"></stop><stop offset="1" stop-color="#121212"></stop></linearGradient></defs><rect width="100" height="120" fill="url(#soulMonoG)"></rect><g opacity="' + (music ? 1 : 0) + '"><rect x="24" y="12" width="30" height="3" rx="1.5" fill="#DDDDDD"></rect><rect x="24" y="18" width="14" height="2" rx="1" fill="#888888"></rect><line x1="24" y1="26" x2="76" y2="26" stroke="#777777" stroke-width="1"></line><circle cx="52" cy="26" r="1.8" fill="#DDDDDD"></circle></g>' + path(t);
    }
    return o + '</svg>';
  }
  var ENF_DESC = ['Geométrica y cálida, de afiche.', 'Detalle en blanco y negro, pura emoción.', 'Escenario real, color y focos.', 'Gris, grano y sobriedad.'];
  var SUBIR_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F4A574" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"></path></svg>';

  /* ───────── el resumen (ficha y correo comparten las mismas filas) ───────── */
  function resumen() {
    var of = ofi(), p = D.PLANS[ST.plan];
    var r = [
      { k: 'Nombre', v: ST.name.trim() },
      { k: 'Cómo le dicen', v: ST.apodo.trim() || '—' },
      { k: 'Oficio', v: oficioNombre() },
      { k: 'Cómo llegó', v: ST.origen.trim() || '—' },
      { k: 'Lo que otros no hacen', v: ST.unico.trim() || '—' },
      { k: 'Lo que nunca haría', v: ST.nunca.trim() || '—' },
      { k: 'Cuándo quedó bien', v: ST.momento.trim() || '—' },
      { k: 'Cifra de orgullo', v: cifraTxt() || '—' },
      { k: 'Qué quiere que digan', v: ST.cierre.trim() || '—' },
      { k: 'Le mueve', v: ST.likes.map(function (l) { return l === 'Otro' ? (ST.likeOtro || 'Otro') : l; }).join(' · ') || '—' },
      { k: 'Paleta', v: ST.palette === CUSTOM_PAL ? 'Propia · ' + ST.myColors.join(' ') : D.PALETTES[ST.palette == null ? 0 : ST.palette].label },
      { k: 'Enfoque', v: D.ENFOQUES[ST.enfoque].label },
      { k: 'Portada', v: concepto() },
      { k: 'Fondo', v: D.BGS[ST.bg] },
      { k: 'Movimiento', v: D.MOTIONS[ST.motion].label },
      { k: 'Tono', v: D.TONES[ST.tone].label },
      { k: 'Foto propia', v: MEM.photo ? 'Sí, cargada (' + (ST.photoName || 'foto') + ')' : 'Pendiente' },
      { k: 'Plan', v: p.label + ' · ' + p.price + ' con IVA (o ' + pesos(p.anual) + ' el año)' },
      { k: 'Modalidad', v: ST.modalidad == null ? '—' : MODOS[ST.modalidad].resumen(p) },
      { k: 'Servicios', v: svcsLlenos().map(function (x) { return x.n.trim() + (x.p.trim() ? ' (desde ' + x.p.trim() + ')' : ''); }).join(' · ') || 'Por completar' }
    ];
    if (ST.plan >= 1) {
      r.push({ k: 'Qué incluye', v: svcsLlenos().map(function (x) { return x.n.trim() + ': ' + (x.d.trim() || '—'); }).join(' · ') || '—' });
      r.push({ k: 'Fotos', v: svcsLlenos().map(function (x) { return x.n.trim() + ': ' + (x.ph === 'up' ? (x.phName || 'foto propia') : 'biblioteca SOUL'); }).join(' · ') || '—' });
      r.push({ k: 'Dónde', v: ST.where.join(' · ') + (ST.comunas.trim() ? ' — ' + ST.comunas.trim() : '') });
      r.push({ k: 'Redes', v: [ST.insta.trim(), ST.fb.trim()].filter(Boolean).join(' · ') || '—' });
      r.push({ k: 'Formulario', v: ['Nombre', 'Teléfono', 'Servicio'].concat(ST.fields).join(' · ') });
    }
    if (ST.plan === 2) {
      r.push({ k: 'Panel', v: ST.email.trim() || 'Correo por confirmar' });
      r.push({ k: 'Valor medio', v: ST.avg == null ? '—' : D.AVGS[ST.avg] });
      r.push({ k: 'Meta', v: ST.reply == null ? '—' : 'Responder ' + D.REPLIES[ST.reply].toLowerCase() });
      r.push({ k: 'Cuentas', v: ST.books == null ? '—' : D.BOOKS[ST.books] });
    }
    r.push({ k: 'WhatsApp', v: ST.tel.trim() || '—' });
    r.push({ k: 'Correo', v: ST.correo.trim() || '—' });
    return r;
  }

  function almaTag(n) { return 'tu alma · ' + n + ' de 6'; }

  /* ───────── los pasos ───────── */
  function pasoHTML(cur) {
    var h = '', of = ofi(), i;
    if (cur === 0) {
      var pl = D.PLANS;
      h += '<div class="bienvenida"><p class="mono kick" style="margin:0">● ' + nPreg() + ' preguntas · ' + (ST.plan === 0 ? '5' : ST.plan === 1 ? '10' : '12') + ' minutos</p>' +
        '<h1 class="q" tabindex="-1" id="foco" style="font-size:40px;line-height:.92;text-transform:uppercase">Tu oficio<br>ya tiene alma.<br><mark>Ahora, que se vea.</mark></h1>' +
        '<p class="hint" style="font-size:17px">Seis preguntas son sobre ti: cómo llegaste, qué haces distinto, qué no harías nunca. Con tus palabras armamos tu marca y tu sitio.</p>' +
        '<div class="col" role="group" aria-label="Elige tu plan"><span class="mono m-sub">Elige tu plan</span>';
      pl.forEach(function (p, k) { h += fila('<span class="t"><strong>' + p.label + '</strong><span>' + esc(p.desc) + '</span></span><span class="pr">' + esc(p.price) + '</span>', ST.plan === k, 'plan', k); });
      h += '<span class="hint" style="font-size:14px">No pagas nada para partir: ves tu sitio armado y pagas el primer mes cuando decides quedártelo. ' + DOMINIO + '</span></div></div>';
    } else if (cur === 1) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Quién eres y a qué te dedicas?</h1>' +
        campoTexto('Tu nombre', 'name', ST.name, 'Nombre y apellido', { attrs: ' autocomplete="name" maxlength="80"' }) +
        campoTexto('¿Cómo te dicen? (opcional)', 'apodo', ST.apodo, 'Ej: Mig. Es el nombre de tu marca', { attrs: ' maxlength="30" autocapitalize="words"' }) +
        '<div role="group" aria-labelledby="l-ofi" class="col"><span class="mono m-sub" id="l-ofi">Tu oficio</span><div class="chips">' +
        D.OFICIOS.map(function (o, k) { return chip(o.label, ST.oficio === k, 'oficio', k); }).join('') + '</div></div>';
      if (esOtro()) h += '<input class="in" type="text" data-k="oficioOtro" value="' + esc(ST.oficioOtro) + '" maxlength="60" placeholder="Ej: herrero, ceramista, guía de montaña" aria-label="Tu oficio, con tus palabras">';
    } else if (cur === 2) {
      h += '<h1 class="q" tabindex="-1" id="foco">Fuera del trabajo, ¿qué te mueve?</h1><p class="hint">Hasta 3. Le da guiños a tu sitio. ' + ST.likes.length + ' de 3.</p><div class="chips">' +
        D.LIKES.map(function (l, k) { return chip(l, ST.likes.indexOf(l) >= 0, 'like', k); }).join('') + '</div>';
      if (ST.likes.indexOf('Otro') >= 0) h += '<input class="in" type="text" data-k="likeOtro" value="' + esc(ST.likeOtro) + '" maxlength="40" placeholder="Ej: pesca, ajedrez, rayuela" aria-label="Otra cosa que te mueve">';
    } else if (cur === 3) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Con qué colores te identificas?</h1><p class="hint">Elige una paleta o arma la tuya. Será el acento de tu sitio.</p><div class="col">';
      D.PALETTES.forEach(function (p, k) {
        var c = p.c || ST.myColors;
        h += fila('<span class="sw" aria-hidden="true"><i style="background:' + c[0] + '"></i><i style="background:' + c[1] + '"></i><i style="background:' + c[2] + ';border:1px solid #8FB2C6"></i></span><span style="flex:1 1 auto;text-align:left">' + esc(p.label) + '</span>', ST.palette === k, 'pal', k);
      });
      h += '</div>';
      if (ST.palette === CUSTOM_PAL) {
        h += '<div class="custom-pal">' + ['Principal', 'Claro', 'Oscuro'].map(function (l, k) { return '<label>' + '<input type="color" data-col="' + k + '" value="' + esc(ST.myColors[k]) + '">' + l + '</label>'; }).join('') + '</div>';
      }
    } else if (cur === 4) {
      h += '<h1 class="q" tabindex="-1" id="foco">Tu escena.</h1><p class="hint">Lo que se ve en tu portada: una imagen que diga tu oficio sin palabras. Te proponemos tres para ' + esc(oficioLabel()) + '; elige una o describe la tuya.</p>' +
        '<div class="refimg ofi" style="' + fondo(fotoOficio()) + '" role="img" aria-label="Imagen de referencia para ' + esc(oficioLabel()) + '"><span class="mono">Referencia · ' + esc(oficioLabel()) + '</span></div><div class="col">' +
        of.concepts.map(function (c, k) { return fila(esc(c), !ST.conceptText && ST.concept === k, 'concept', k); }).join('') + '</div>' +
        '<input class="in" type="text" data-k="conceptText" value="' + esc(ST.conceptText) + '" maxlength="140" placeholder="O descríbela tú: …" aria-label="Describe tu propia escena">';
    } else if (cur === 5) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Cómo se ve tu escena?</h1><p class="hint">Tu escena: <strong>' + esc(concepto()) + '</strong>. Elige el enfoque; para ' + esc(oficioLabel()) + ' sugerimos <strong>' + D.ENFOQUES[of.style === 1 ? 0 : 2].label + '</strong>.</p><div class="enfs">' +
        D.ENFOQUES.map(function (e, k) { return '<button type="button" class="enf" aria-pressed="' + (ST.enfoque === k) + '" data-a="enf" data-i="' + k + '">' + enfSvg(k) + '<b>' + e.label + '</b><span>' + ENF_DESC[k] + '</span></button>'; }).join('') + '</div>';
    } else if (cur === 6) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Fondo claro u oscuro?</h1><p class="hint">Sugerido para ' + esc(oficioLabel()) + ': <strong>' + D.BGS[of.bg] + '</strong></p><div class="bgs">' +
        D.BGS.map(function (b, k) { return '<button type="button" class="bgb" aria-pressed="' + (ST.bg === k) + '" data-a="bg" data-i="' + k + '" style="' + (k === 0 ? 'background:#080A09;color:#F5F0E4' : 'background:#F5F0E4;color:#080A09') + '"><span class="aa" aria-hidden="true">Aa</span><span class="nm">' + b + '</span></button>'; }).join('') + '</div>';
    } else if (cur === 7) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Cuánto movimiento?</h1><p class="hint">Sugerido para ' + esc(oficioLabel()) + ': <strong>' + D.MOTIONS[of.motion].label + '</strong></p><div class="col">' +
        D.MOTIONS.map(function (m, k) { return filaTD(m.label, m.desc, ST.motion === k, 'motion', k); }).join('') + '</div>';
    } else if (cur === 8) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Cómo le hablas a tus clientes?</h1><p class="hint">Define cómo escribimos tus textos.</p><div class="col">' +
        D.TONES.map(function (t, k) { return filaTD(t.label, t.desc, ST.tone === k, 'tone', k, true); }).join('') + '</div>';
    } else if (cur === 9) {
      h += '<h1 class="q" tabindex="-1" id="foco">¿Tienes una foto tuya en acción?</h1><p class="hint">Opcional. Si la tienes, es la portada de tu sitio; si no, armamos una con tu marca.</p>';
      if (MEM.photo) h += '<div class="foto-caja hay"><img src="' + esc(MEM.photo) + '" alt="Tu foto, ' + esc(ST.photoName) + '"></div><div class="fila-b"><button type="button" class="btn-s" data-a="photoup">Cambiar foto</button><button type="button" class="btn-s" data-a="photorm">Quitar</button></div>';
      else h += '<div class="foto-caja"><button type="button" class="sube" data-a="photoup">' + SUBIR_SVG + 'Subir foto</button></div>';
      h += '<div class="mono checks"><span>✓ Cara visible</span><span>✓ En acción</span><span>✗ Selfie</span></div>';
    } else if (cur === 11) {
      h += kick(ST.plan === 0 ? 'fresh · tus servicios' : 'sun · tus servicios', 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Qué servicios ofreces?</h1><p class="hint">Hasta 6. El nombre y el precio «desde» que cobras.</p><div class="col">';
      ST.svcs.forEach(function (v, k) {
        h += '<div class="svc"><input class="in" type="text" data-svc="n" data-i="' + k + '" value="' + esc(v.n) + '" maxlength="70" placeholder="' + 'Ej: ' + esc(EJ().s[Math.min(k, 2)]) + '" aria-label="Nombre del servicio ' + (k + 1) + '">' +
          '<input class="in" type="text" inputmode="numeric" data-svc="p" data-i="' + k + '" value="' + esc(v.p) + '" maxlength="20" placeholder="$ desde" aria-label="Precio desde del servicio ' + (k + 1) + '"></div>';
      });
      h += '</div>';
      if (ST.svcs.length < 6) h += '<button type="button" class="btn-s" data-a="addsvc">+ Agregar servicio</button>';
    } else if (cur === 12) {
      h += kick('sun · fotos', 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">Una foto por servicio.</h1><p class="hint">Súbela desde el celular o usa una de la biblioteca SOUL de tu oficio.</p><div class="col">';
      ST.svcs.forEach(function (v, k) {
        if (!v.n.trim()) return;
        h += '<div class="svc-foto"><strong>' + esc(v.n) + '</strong><div class="fila-b">' +
          '<button type="button" class="chip" aria-pressed="' + (v.ph === 'up') + '" data-a="svcph" data-i="' + k + '" data-m="up">' + (v.ph === 'up' && MEM.svcPh[k] ? 'Cambiar foto' : 'Subir foto') + '</button>' +
          '<button type="button" class="chip" aria-pressed="' + (v.ph !== 'up') + '" data-a="svcph" data-i="' + k + '" data-m="lib">Biblioteca SOUL</button>' +
          (v.ph === 'up' && MEM.svcPh[k] ? '<img class="mini" src="' + esc(MEM.svcPh[k]) + '" alt="Foto de ' + esc(v.n) + '">' : '') + '</div></div>';
      });
      h += '</div>';
    } else if (cur === 13) {
      h += kick('sun · qué incluye', 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">En una frase, ¿qué incluye cada uno?</h1><p class="hint">Lo que el cliente recibe, sin letra chica.</p><div class="col" style="gap:10px">';
      ST.svcs.forEach(function (v, k) {
        if (!v.n.trim()) return;
        h += '<label class="campo"><span class="mono m-sub">' + esc(v.n) + '</span><input class="in" type="text" data-svc="d" data-i="' + k + '" value="' + esc(v.d) + '" maxlength="140" placeholder="Ej: ' + esc(EJ().i[Math.min(k, 2)]) + '"></label>';
      });
      h += '</div>';
    } else if (cur === 14) {
      h += kick('sun · dónde', 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Dónde trabajas?</h1><div class="chips">' +
        D.WHERE.map(function (w, k) { return chip(w, ST.where.indexOf(w) >= 0, 'where', k); }).join('') + '</div>' +
        campoTexto('Comunas o regiones', 'comunas', ST.comunas, 'Ej: Ñuñoa, Providencia, Maipú', { attrs: ' maxlength="120"' });
    } else if (cur === 15) {
      h += kick('sun · redes', 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Dónde publicas tu trabajo?</h1><p class="hint">Lo que subas ahí aparece solo en tu sitio.</p>' +
        campoTexto('Instagram', 'insta', ST.insta, '@tuoficio', { attrs: ' maxlength="60" autocapitalize="none"' }) +
        campoTexto('Facebook (opcional)', 'fb', ST.fb, 'facebook.com/tuoficio', { attrs: ' maxlength="80" autocapitalize="none"' });
    } else if (cur === 16) {
      h += kick('sun · tu formulario', 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Qué necesitas saber para cotizar?</h1><p class="hint">Marca lo que le preguntamos al cliente. Nombre y teléfono van siempre.</p><div class="chips">' +
        D.FIELDS.map(function (f, k) { return chip(f, ST.fields.indexOf(f) >= 0, 'field', k); }).join('') + '</div>' +
        '<div class="prev-form"><span class="mono kick-sun">Tu formulario pedirá</span><br>' + esc(['Nombre', 'Teléfono', 'Servicio'].concat(ST.fields).join(' · ')) + '</div>';
    } else if (cur === 17) {
      h += kick('vibe · tu panel') + '<h1 class="q" tabindex="-1" id="foco">¿Con qué correo entras a tu panel?</h1><p class="hint">Será tu usuario. La clave la creas tú al confirmar.</p>' +
        '<input class="in" type="email" data-k="email" value="' + esc(ST.email) + '" maxlength="120" placeholder="tucorreo@gmail.com" autocomplete="email" aria-label="Correo del panel">';
    } else if (cur === 18) {
      h += kick('vibe · tus cifras') + '<h1 class="q" tabindex="-1" id="foco">¿Cuánto vale, en promedio, un trabajo tuyo?</h1><p class="hint">Con esto el panel estima cuánto tienes cotizado en el mes.</p><div class="chips">' +
        D.AVGS.map(function (a, k) { return chip(a, ST.avg === k, 'avg', k); }).join('') + '</div>';
    } else if (cur === 19) {
      h += kick('vibe · tu meta') + '<h1 class="q" tabindex="-1" id="foco">¿En cuánto tiempo quieres responder?</h1><p class="hint">Es la meta que el panel te muestra cada día.</p><div class="col">' +
        D.REPLIES.map(function (r, k) { return filaTD(r, '', ST.reply === k, 'reply', k); }).join('') + '</div>';
    } else if (cur === 20) {
      h += kick('vibe · tus cuentas') + '<h1 class="q" tabindex="-1" id="foco">¿Dónde llevas hoy tus cuentas?</h1><p class="hint">Si es Excel, el panel lo conecta.</p><div class="col">' +
        D.BOOKS.map(function (b, k) { return filaTD(b, '', ST.books === k, 'books', k); }).join('') + '</div>';
    } else if (cur === 21) {
      h += kick(almaTag(1), 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Cómo llegaste a esto?</h1><p class="hint">Quién te enseñó, o tu primera vez. Abre la historia de tu sitio. Si no se te ocurre, sigue: la puedes saltar.</p>' +
        '<textarea class="in" data-k="origen" rows="3" maxlength="220" placeholder="Ej: ' + esc(EJ().o) + '." aria-label="Cómo llegaste a tu oficio">' + esc(ST.origen) + '</textarea>';
    } else if (cur === 22) {
      h += kick(almaTag(2), 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Qué haces tú que otros de tu oficio no hacen?</h1><p class="hint">Una línea, con tus palabras. Es el titular de tu sitio.</p>' +
        '<textarea class="in" data-k="unico" rows="2" maxlength="160" placeholder="Ej: ' + esc(EJ().u) + '." aria-label="Lo que haces distinto">' + esc(ST.unico) + '</textarea>';
    } else if (cur === 23) {
      h += kick(almaTag(3), 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Qué no harías nunca, aunque te paguen?</h1><p class="hint">Se entiende quién eres por lo que no aceptas. Si no se te ocurre, sigue: la puedes saltar.</p>' +
        '<textarea class="in" data-k="nunca" rows="2" maxlength="160" placeholder="Ej: ' + esc(EJ().n) + '." aria-label="Lo que no harías nunca">' + esc(ST.nunca) + '</textarea>';
    } else if (cur === 24) {
      h += kick(almaTag(4), 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿En qué momento sabes que el trabajo quedó bien?</h1><p class="hint">Esa escena que solo ve quien lo hace. Si no se te ocurre, sigue: la puedes saltar.</p>' +
        '<textarea class="in" data-k="momento" rows="2" maxlength="160" placeholder="Ej: ' + esc(EJ().m) + '." aria-label="Cuándo sabes que quedó bien">' + esc(ST.momento) + '</textarea>';
    } else if (cur === 25) {
      h += kick(almaTag(5), 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">Una cifra de la que estés orgulloso.</h1><p class="hint">Solo si es verdad: sale tal cual bajo el titular. Puedes dejarla en blanco.</p>' +
        campoTexto('El número', 'cifraN', ST.cifraN, 'Ej: +50', { attrs: ' maxlength="9" inputmode="text" autocomplete="off"' }) +
        '<div role="group" aria-labelledby="l-uni" class="col"><span class="mono m-sub" id="l-uni">De qué (opcional)</span><div class="chips">' +
        D.CIFRA_UNID.map(function (u, k) { return chip(u, ST.cifraU === u, 'cifraU', k); }).join('') + '</div></div>';
      if (ST.cifraU === 'Otro') h += '<input class="in" type="text" data-k="cifraOtro" value="' + esc(ST.cifraOtro) + '" maxlength="30" placeholder="Ej: matrimonios" aria-label="De qué es tu cifra">';
    } else if (cur === 26) {
      h += kick(almaTag(6), 'kick-sun') + '<h1 class="q" tabindex="-1" id="foco">¿Qué quieres que la gente diga de ti cuando no estás?</h1><p class="hint">Una línea. Es el cierre de tu sitio. Si no se te ocurre, sigue: la puedes saltar.</p>' +
        '<textarea class="in" data-k="cierre" rows="2" maxlength="160" placeholder="Ej: ' + esc(EJ().c) + '" aria-label="Lo que quieres que digan de ti">' + esc(ST.cierre) + '</textarea>';
    } else if (cur === 10) {
      h += fichaHTML();
    }
    return h;
  }

  /* La ficha: la tarjeta de portada + el resumen + como te escribimos. */
  function fichaHTML() {
    var dark = ST.bg === 0, p = pal(), of = ofi();
    var ink = dark ? '#F5F0E4' : '#080A09', base = dark ? '#080A09' : '#F5F0E4';
    var accent = (!dark && ST.palette === 5) ? '#080A09' : p[0];
    var anim = ST.motion === 0 ? '' : ST.motion === 1 ? ' kb1' : ' kb2';
    var h = kick('Tu ficha Soul') + '<h1 class="q" tabindex="-1" id="foco" style="font-size:24px">Así va quedando.</h1>' +
      '<div class="ficha" style="background:' + base + ';border:1px solid ' + (dark ? '#1F2624' : '#D2CBBF') + '">' +
      '<div class="img ofi' + anim + '" style="' + fondo(fotoOficio()) + ';background-color:' + (dark ? p[2] : p[1]) + '"></div>' +
      '<div class="scrim" style="background:linear-gradient(0deg,' + base + ' 0%,' + (dark ? 'rgba(8,10,9,.75)' : 'rgba(245,240,228,.82)') + ' 32%,rgba(0,0,0,0) 62%)"></div>' +
      '<div class="arr"><span class="mono" style="color:' + ink + ';letter-spacing:.1em">' + esc(ST.name || 'Tu nombre') + '</span><span class="dot' + (ST.motion === 2 ? ' pulso' : '') + '" style="background:' + accent + '"></span></div>' +
      '<div class="conc"><span class="mono">Portada · ' + esc(D.ENFOQUES[ST.enfoque].label) + '</span><br>' + esc(concepto()) + '</div>' +
      '<div class="abj"><span class="mono" style="color:' + ink + ';letter-spacing:.1em">' + esc(oficioLabel()) + '</span><p style="color:' + ink + '">' + esc(M.titular(ST) || of.head) + '</p></div></div>' +
      '<dl class="resumen">' + resumen().filter(function (r) { return r.k !== 'WhatsApp' && r.k !== 'Correo' && r.k !== 'Nombre'; }).map(function (r) { return '<div><dt class="mono">' + esc(r.k) + '</dt><dd>' + esc(r.v) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="contacto" role="group" aria-labelledby="l-modo"><h2 id="l-modo">¿Cómo prefieres pagar?</h2><p class="hint" style="margin:0">No pagas nada hoy: es para dejarte la propuesta lista.</p><div class="col">' + MODOS.map(function (m, k) { return filaTD(m.titulo, m.desc(D.PLANS[ST.plan]), ST.modalidad === k, 'modo', k); }).join('') + '</div></div>' +
      '<div class="contacto"><h2>¿Cómo te avisamos?</h2><p class="hint" style="margin:0">Para decirte que tu sitio está listo. Nada más.</p>' +
      campoTexto('Tu WhatsApp', 'tel', ST.tel, '+56 9 …', { type: 'tel', attrs: ' autocomplete="tel" maxlength="30" inputmode="tel" required' }) +
      campoTexto('Tu correo' + (ST.plan === 2 ? '' : ' (opcional)'), 'correo', ST.correo || (ST.plan === 2 ? ST.email : ''), 'tucorreo@gmail.com', { type: 'email', attrs: ' autocomplete="email" maxlength="120"' }) +
      '<span class="trampa" aria-hidden="true"><input name="sitioweb" tabindex="-1" autocomplete="off" data-k="trampa"></span></div>' +
      '<p class="hint" style="font-size:14px;margin:0">No pagas nada todavía: revisa tu sitio y paga el primer mes cuando decidas quedártelo. Sin permanencia. ' + DOMINIO + '</p>';
    return h;
  }

  /* ───────── la vista previa: el sitio borrador armado con las respuestas ─────────
     SOUL 2: la dirección de marca (marca.js) pone tipografía y superficies; el titular, el manifiesto
     y el cierre salen de las respuestas del alma. Ninguna línea habla del sitio ni de cómo se hizo,
     y la misma foto de biblioteca ya no se reparte por rubro: foto propia o arte SVG con la paleta. */
  function sitioBorrador() { return S.html(ST, { D: D, M: M, cfg: CFG, mem: MEM, base: '', vivo: false }); }

  /* Nombre simple de un color, para decirlo como se dice en la calle. */
  function colorNombre(hex) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, sa = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    if (sa < 0.12 || l < 0.1 || l > 0.93) return l > 0.75 ? 'blanco' : l < 0.25 ? 'negro' : 'gris';
    var base = h < 15 || h >= 345 ? 'rojo' : h < 40 ? (l < 0.4 ? 'café' : 'naranjo') : h < 65 ? 'amarillo' : h < 160 ? 'verde' : h < 200 ? 'turquesa' : h < 255 ? 'azul' : h < 290 ? 'violeta' : 'rosado';
    return (l > 0.82 ? base + ' claro' : l < 0.25 ? base + ' oscuro' : base);
  }

  /* El resumen corporativo, en lenguaje de quien lo lee: colores con nombre simple y letras que se ven, no que se nombran.
     Los datos técnicos (códigos, nombres de letra, contraste) van solo en el correo al estudio. */
  function corpHTML() {
    var di = dirActual(), d = M.DIRS[di], su = sup(), t3 = M.tres(ST);
    var sw = [['Fondo', su.bg], ['Fondo suave', su.bg2], ['Letra', su.ink], ['Tu color', su.ac]];
    return '<section class="corp" aria-label="Resumen corporativo"><span class="mono kick">Resumen corporativo</span><h2>' + esc(M.marcaNombre(ST)) + ': tu marca en una hoja</h2><dl>' +
      '<div><dt class="mono">Concepto</dt><dd>' + esc(M.concepto(ST, D)) + '</dd></div>' +
      '<div><dt class="mono">Estilo</dt><dd>' + esc(d.nombre + ' · ' + d.idea) + '</dd></div>' +
      '<div><dt class="mono">Tono</dt><dd>' + esc(D.TONES[ST.tone].label + ': ' + d.voz) + '</dd></div>' +
      '<div><dt class="mono">Colores</dt><dd><div class="sws">' + sw.map(function (c) { return '<span><i style="background:' + c[1] + '"></i>' + c[0] + ': ' + colorNombre(c[1]) + '</span>'; }).join('') + '</div></dd></div>' +
      '<div><dt class="mono">Letras</dt><dd class="letras"><span style="font-family:' + d.display + ';font-weight:800;font-size:26px;line-height:1.1">' + esc(M.marcaNombre(ST)) + '</span><span style="font-family:' + d.texto + ';font-size:16px">Así se leen tus textos, claros y cómodos.</span><span style="font-family:' + d.mono + ';font-size:13px;letter-spacing:.12em">' + esc((M.cifra(ST, D) || { texto: 'tus cifras, 2026' }).texto.toUpperCase()) + '</span></dd></div>' +
      '<div><dt class="mono">Tus frases</dt><dd><ol>' + t3.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ol></dd></div></dl></section>';
  }

  function dirsHTML() {
    var di = dirActual();
    return '<div class="dirs" role="group" aria-label="Dirección de marca">' + M.DIRS.map(function (d, k) { return chip(d.nombre, di === k, 'dir', k); }).join('') +
      '<p class="hint">Elegimos «' + esc(M.DIRS[M.elegir(ST, D)].nombre) + '» con tus respuestas. Prueba otra: cambia la tipografía y los fondos.</p></div>';
  }

  /* ───────── el cierre: envio + borrador ───────── */
  function waTexto() {
    var p = D.PLANS[ST.plan];
    var t = 'Hola, quiero mi sitio SOUL, plan ' + p.label + ' (' + p.price + ' con IVA).\n\nMis respuestas:\n' +
      resumen().map(function (r) { return r.k + ': ' + r.v; }).join('\n');   // la marca se deriva de estas respuestas: no viaja por WhatsApp
    if (t.length > 1500) t = t.slice(0, 1480).replace(/\s+\S*$/, '') + '…\n(Faltan datos: te los paso por acá.)';
    return t;
  }
  function waUrl() { return 'https://wa.me/' + WSP + '?text=' + encodeURIComponent(waTexto()); }
  /* El enlace publico del sitio: las respuestas viajan en el # (sin servidor). Se muestra completo, se copia y se comparte por WhatsApp. */
  function enlaceUrl() { return new URL('s/', location.href).href.replace(/[?#].*$/, '') + '#' + codificar(); }
  function enlaceHTML() {
    var u = enlaceUrl(), wa = 'https://wa.me/?text=' + encodeURIComponent('Mira mi sitio: ' + u);
    return '<div class="enlace" role="group" aria-labelledby="l-enl"><h2 id="l-enl">Tu enlace</h2><p class="hint" style="margin:0">Ábrelo en el celular: tu sitio se ve armado, como lo verían tus clientes. Mándalo a quien quieras.</p>' +
      '<textarea class="resp-txt" readonly rows="3" id="enl-txt" aria-label="Tu enlace">' + esc(u) + '</textarea>' +
      '<div class="fila-b"><button type="button" class="btn-p" data-a="copiarenl">Copiar enlace</button><a class="btn-s" href="' + esc(wa) + '" target="_blank" rel="noopener" data-a="wsp">Compartir por WhatsApp</a><a class="btn-s" href="' + esc(u) + '" target="_blank" rel="noopener" data-a="wsp">Abrir mi sitio</a></div>' +
      '<span id="copiado-enl" role="status" class="hint"></span></div>';
  }
  function copiarEnlace() {
    var ta = $('#enl-txt'), msg = $('#copiado-enl'), txt = ta ? ta.value : enlaceUrl();
    function listo(ok) { if (msg) msg.textContent = ok ? ' Copiado. Pégalo donde quieras.' : ' No pude copiar solo: selecciona el enlace y cópialo.'; if (!ok && ta) { ta.focus(); ta.select(); } }
    try { navigator.clipboard.writeText(txt).then(function () { listo(true); }, function () { listo(false); }); } catch (_) { listo(false); }
  }

  /* ───────── tus imágenes: el generador de arte (arte.js) ─────────
     La ilustración sale de tus respuestas; «otra versión» cambia la semilla (y con ella el enlace).
     Póster, historia y afiche se dibujan en el navegador y se descargan como PNG; la historia animada, como video. */
  var KIT = [['post', 'Póster para Instagram'], ['historia', 'Historia'], ['afiche', 'Afiche para imprimir'], ['video', 'Historia animada']];
  function imagenesHTML() {
    if (!window.SOUL_ARTE) return '';
    var o = S.opcionesArte(ST, D, M, { w: 400, h: 500, anim: false, sufijo: 'k' });
    return '<div class="kit" role="group" aria-labelledby="l-kit"><h2 id="l-kit">Tus imágenes</h2>' +
      '<p class="hint" style="margin:0">Hechas con tu marca. Descárgalas para tu WhatsApp, tu Instagram o para imprimir.</p>' +
      '<div class="kit-prev">' + window.SOUL_ARTE.escena(o) + '</div>' +
      '<button type="button" class="btn-s" data-a="arte" data-i="0">Otra versión</button>' +
      '<div class="kit-b">' + KIT.map(function (k) { return '<button type="button" class="btn-s" data-a="kit" data-m="' + k[0] + '">' + k[1] + '</button>'; }).join('') + '</div>' +
      '<span id="kit-msg" role="status" class="hint"></span>' + retratoHTML() + '</div>';
  }
  /* Retrato con estilo (16-11-2026): SU foto, la misma cara, en el estilo que elija. Lo hace Gemini desde el
     Apps Script del formulario; la foto no se guarda. TEXTOS PROPUESTOS: esperan el visto de Sebastián. */
  var ESTILOS_RET = [['leyenda', 'Escena legendaria'], ['facetado', 'Póster facetado'], ['bn', 'Blanco y negro'], ['retro', 'Retro'], ['revista', 'Portada de revista'], ['anime', 'Dibujo japonés']];
  var ERR_RET = { tope: 'Por hoy ya se crearon todos los retratos. Vuelve mañana.', foto: 'Esa foto no sirve. Prueba con otra.',
    'tope-persona': 'Ya creaste tus 3 retratos de hoy. Vuelve mañana.', cuenta: 'Vuelve a entrar con tu cuenta de Google.' };
  /* Cada persona entra con su cuenta de Google antes de crear (Sebastián, 16-11-2026): así el tope de 3 al día es
     por persona. El botón lo dibuja Google (accounts.google.com/gsi/client); el token vive solo en memoria. */
  function conCuenta() { return !!MEM.gtoken && Date.now() < (MEM.gexp || 0); }
  var gsi = null;
  function cargarGoogle() {
    if (gsi) return gsi;
    gsi = new Promise(function (ok, mal) {
      if (window.google && window.google.accounts && window.google.accounts.id) return ok(window.google.accounts.id);
      var sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
      sc.onload = function () { ok(window.google.accounts.id); }; sc.onerror = function () { gsi = null; mal(new Error('gsi')); };
      document.head.appendChild(sc);
    });
    return gsi;
  }
  function montarGoogle() {
    var caja = $('#g-btn'); if (!caja) return;
    cargarGoogle().then(function (id) {
      if (!document.body.contains(caja)) return;
      id.initialize({ client_id: CFG.googleId, callback: function (r) {
        if (!r || !r.credential) return;
        MEM.gtoken = r.credential; MEM.gexp = Date.now() + 50 * 60 * 1000; render(false, '[data-a="retrato"]');
      } });
      id.renderButton(caja, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', locale: 'es-419' });
    }).catch(function () { var m = $('#ret-msg'); if (m) m.textContent = ' No se pudo abrir la cuenta de Google ahora. Prueba en un rato.'; });
  }
  function retratoHTML() {
    if (VISTA || !CFG.endpoint || !CFG.googleId) return '';
    var h = '<div class="ret" role="group" aria-labelledby="l-ret"><h2 id="l-ret">Tu retrato con estilo</h2>';
    if (!MEM.photo) return h + '<p class="hint" style="margin:0">Sube una foto tuya y te devolvemos la misma cara, en el estilo que elijas.</p>' +
      '<button type="button" class="btn-s" data-a="photoup">Subir mi foto</button></div>';
    var est = MEM.retEst || 'leyenda';
    h += '<div class="ret-chips">' + ESTILOS_RET.map(function (e) { return '<button type="button" class="chip' + (e[0] === est ? ' on' : '') + '" aria-pressed="' + (e[0] === est) + '" data-a="estilo" data-i="' + e[0] + '">' + e[1] + '</button>'; }).join('') + '</div>';
    if (MEM.retrato) h += '<div class="ret-res"><img src="' + esc(MEM.retrato) + '" alt="Tu retrato, estilo ' + esc((ESTILOS_RET.filter(function (e) { return e[0] === MEM.retHecho; })[0] || ['', ''])[1]) + '"></div>' +
      '<div class="kit-b"><button type="button" class="btn-s" data-a="retuse">Usar en mi portada</button><button type="button" class="btn-s" data-a="retdl">Descargar</button></div>';
    if (conCuenta()) h += '<button type="button" class="btn-s" data-a="retrato">' + (MEM.retrato ? 'Crear otro' : 'Crear mi retrato') + '</button>';
    else h += '<p class="hint" style="margin:0">Para crear tu retrato, entra con tu cuenta de Google.</p><div id="g-btn" class="ret-g"></div>';
    return h + '<p class="hint" style="margin:0">Tu foto se usa solo para crear el retrato y no se guarda.</p><span id="ret-msg" role="status" class="hint"></span></div>';
  }
  /* La misma escena que escenas.js pinta para su oficio (Vitruvio, la gran ola, Atlas…), para que Gemini la pinte con su cara. */
  function escenaClave() {
    var E = window.SOUL_ESCENAS, i = ST.oficio == null ? D.MOTIFS.length - 1 : ST.oficio;
    try { return E ? E.elegir({ oficioN: i, version: ST.arte || 0 }).clave : ''; } catch (e) { return ''; }
  }
  function crearRetrato(btn) {
    var msg = $('#ret-msg'), est = MEM.retEst || 'leyenda';
    if (!MEM.photo || !CFG.endpoint) return;
    if (!conCuenta()) { MEM.gtoken = ''; render(false); return; }
    btn.disabled = true; if (msg) msg.textContent = ' Creando tu retrato… tarda unos 20 segundos.';
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null, reloj = ctrl ? setTimeout(function () { ctrl.abort(); }, 90000) : 0;
    fetch(CFG.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({ tipo: 'retrato', estilo: est, escena: escenaClave(), foto: MEM.photo, oficio: oficioNombre(), colores: S.pal(ST, D) || [], idToken: MEM.gtoken }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        clearTimeout(reloj);
        if (j && j.ok && /^data:image\//.test(j.img || '')) { MEM.retrato = j.img; MEM.retHecho = est; render(false, '[data-a="retrato"]'); return; }
        // el script en vivo aún no conoce «leyenda» (hasta correr DESPLEGAR-FORMULARIO-COMPAI): cae al facetado sin gastar cupo
        if (j && j.error === 'estilo' && est === 'leyenda') { MEM.retEst = 'facetado'; btn.disabled = false; crearRetrato(btn); return; }
        var txt = ERR_RET[j && j.error] || 'No se pudo crear el retrato ahora. Prueba en un rato.';
        if (j && j.error === 'tope-persona' && j.tope) txt = 'Ya creaste tus ' + j.tope + ' retratos de hoy. Vuelve mañana.';
        if (j && j.error === 'cuenta') { MEM.gtoken = ''; render(false); msg = $('#ret-msg'); }
        else btn.disabled = false;
        if (msg) msg.textContent = ' ' + txt;
      })
      .catch(function () { clearTimeout(reloj); btn.disabled = false; if (msg) msg.textContent = ' No se pudo crear el retrato ahora. Prueba en un rato.'; });
  }
  function bajarRetrato() {
    if (!MEM.retrato) return;
    var a = document.createElement('a'), ext = /image\/png/.test(MEM.retrato) ? 'png' : 'jpg';
    a.href = MEM.retrato; a.download = slug() + '-retrato-' + (MEM.retHecho || 'estilo') + '.' + ext; document.body.appendChild(a); a.click(); a.remove();
  }
  /* La vista previa del panel muestra el póster terminado (con su tipografía de cartel), no solo la ilustración.
     Mientras se arma queda la ilustración; si algo falla, también. */
  var turnoKit = 0;
  function pintarKit() {
    var A = window.SOUL_ARTE, caja = $('.kit-prev'); if (!A || !caja) return;
    var yo = ++turnoKit, k = S.kit(ST, D, M, CFG);
    k.formato = 'post'; k.pie = 'img/' + (M.sobre(k.tintas.bg) === '#FFFFFF' ? 'pie-compai-claro' : 'pie-alma-compai-oscuro') + '.png';
    A.poster(k).then(function (c) {
      if (yo !== turnoKit || !document.body.contains(caja)) return;
      var im = new Image(); im.alt = ''; im.width = 1080; im.height = 1350; im.src = c.toDataURL('image/jpeg', 0.86);
      caja.classList.add('lista'); caja.innerHTML = ''; caja.appendChild(im);
    }).catch(function () { /* queda la ilustración */ });
  }
  function descargarKit(fmt, btn) {
    var A = window.SOUL_ARTE, msg = $('#kit-msg'), k = S.kit(ST, D, M, CFG);
    k.formato = fmt;
    k.pie = 'img/' + (M.sobre(k.tintas.bg) === '#FFFFFF' ? 'pie-compai-claro' : 'pie-alma-compai-oscuro') + '.png';
    function nombre(ext) { return S.slug(ST) + '-' + fmt + '.' + ext; }
    function bajar(blob, archivo) {
      var u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = archivo; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = fmt === 'video' ? ' Grabando tu historia (6 segundos)…' : ' Armando tu imagen…';
    var tarea = fmt === 'video'
      ? A.video(k).then(function (r) { bajar(r.blob, nombre(r.ext)); })
      : A.poster(k).then(function (c) { return new Promise(function (ok) { c.toBlob(function (b) { bajar(b, nombre('png')); ok(); }, 'image/png'); }); });
    tarea.then(function () { if (msg) msg.textContent = ' Listo: quedó en tus descargas.'; })
      .catch(function () { if (msg) msg.textContent = fmt === 'video' ? ' Este navegador no graba video. Prueba con Chrome o descarga el póster.' : ' No pude armar la imagen. Prueba otra vez.'; })
      .then(function () { if (btn) btn.disabled = false; });
  }
  function finHTML() {
    var R = ST.result || { ok: false, motivo: 'sin-envio' }, h = '';
    h += '<h1 class="q" tabindex="-1" id="foco" style="font-size:26px">' + (VISTA ? 'Borrador de ' + esc(ST.name || 'la persona') : R.ok ? 'Tu sitio, en borrador.' : 'Tu borrador está listo.') + '</h1>';
    if (VISTA) {
      h += '<p class="hint">Así lo vio quien respondió. Se arma de nuevo con sus respuestas.</p>';
    } else if (R.ok) {
      h += '<div class="aviso-ok" role="status"><h2>Recibimos tus respuestas.</h2><p>Mira abajo cómo va quedando tu sitio. Te escribimos al WhatsApp ' + esc(ST.tel.trim()) + ' antes de un día hábil para afinarlo y contarte cómo pagar: mes a mes, o el año con tu .cl incluido. No pagas nada todavía.</p></div>';
    } else {
      // Tono neutro, no de error: el WhatsApp es un camino normal (ClAI-nte, 26-10-2026).
      // Igual se dice con todas sus letras que desde aquí no se pudo enviar.
      h += '<div class="aviso-n" role="status"><h2>Último paso: mándanos tus respuestas por WhatsApp.</h2><p>Desde aquí no pudimos enviarlas (' + esc(R.motivo || 'sin conexión') + '). Por WhatsApp sí: el mensaje ya viene escrito con tu plan y tus respuestas, tú solo lo envías al ' + WSP_TXT + '.</p>' +
        '<div class="fila-b"><a class="btn-p" href="' + esc(waUrl()) + '" target="_blank" rel="noopener" data-a="wsp">Enviar por WhatsApp</a><button type="button" class="btn-s" data-a="reintentar">Probar de nuevo desde aquí</button></div>' +
        '<details><summary style="min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:600">Ver o copiar mis respuestas</summary><textarea class="resp-txt" readonly aria-label="Mis respuestas" id="resp-txt">' + esc(waTexto()) + '</textarea>' +
        '<button type="button" class="btn-s" data-a="copiar" style="margin-top:8px">Copiar mis respuestas</button><span id="copiado" role="status" class="hint"></span></details></div>';
    }
    if (!VISTA) h += enlaceHTML();
    h += imagenesHTML();
    h += '<div class="borrador-t"><span class="mono">Borrador</span><span class="hint">Así se vería tu sitio. Es una vista previa: las fotos y los textos finales los afinamos contigo. ' + DOMINIO + '</span></div>' + dirsHTML() + sitioBorrador() + corpHTML();
    return h;
  }

  /* ───────── validacion minima ───────── */
  function validar(cur) {
    if (cur === 1) {
      if (!ST.name.trim()) return ['Escribe tu nombre.', '[data-k="name"]'];
      if (ST.oficio == null) return ['Elige tu oficio.', '[data-a="oficio"]'];
      if (esOtro() && !ST.oficioOtro.trim()) return ['Cuéntanos cuál es tu oficio.', '[data-k="oficioOtro"]'];
    }
    if (cur === 22 && !ST.unico.trim()) return ['Cuéntanos en una línea qué haces distinto: es el titular de tu sitio.', '[data-k="unico"]'];
    if (cur === 25 && ST.cifraN.trim() && !M.cifra(ST, D)) return ['Escribe solo el número, por ejemplo 50 o +50.', '[data-k="cifraN"]'];
    if (cur === 3 && ST.palette == null) return ['Elige una paleta.', '[data-a="pal"]'];
    if (cur === 11 && !svcsLlenos().length) return ['Escribe al menos un servicio.', '[data-svc="n"]'];
    if (cur === 14 && !ST.where.length) return ['Marca dónde trabajas.', '[data-a="where"]'];
    if (cur === 17 && !correoOk(ST.email.trim())) return ['Revisa el correo: así no podemos crear tu panel.', '[data-k="email"]'];
    if (cur === 18 && ST.avg == null) return ['Elige una opción.', '[data-a="avg"]'];
    if (cur === 19 && ST.reply == null) return ['Elige una opción.', '[data-a="reply"]'];
    if (cur === 20 && ST.books == null) return ['Elige una opción.', '[data-a="books"]'];
    if (cur === 10) {
      if (ST.modalidad == null) return ['Elige cómo prefieres pagar: mes a mes o el año.', '[data-a="modo"]'];
      if (digitos(ST.tel).length < 8) return ['Escribe tu WhatsApp para poder avisarte.', '[data-k="tel"]'];
      var c = (ST.correo || (ST.plan === 2 ? ST.email : '')).trim();
      if (ST.plan === 2 && !correoOk(c)) return ['Revisa el correo: así no te llega el acceso a tu panel.', '[data-k="correo"]'];
      if (c && !correoOk(c)) return ['Revisa el correo: así no te llega la respuesta.', '[data-k="correo"]'];
    }
    return null;
  }

  /* ───────── render ───────── */
  var appEl = $('#app'), pasoEl = $('#paso'), accEl = $('#acciones');
  var SVG_ATRAS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>';

  function curActual() {
    var sq = seq(), T = sq.length - 1;
    if (ST.result && ST.step > T) return 'fin';
    if (ST.step > T) ST.step = T;
    if (ST.step < 0) ST.step = 0;
    if (ST.step > 1 && ST.oficio == null) ST.step = 1;
    if (ST.step > sq.indexOf(3) && ST.palette == null) ST.step = sq.indexOf(3);
    return sq[ST.step];
  }

  var ultimo = null;
  /* GoatCounter (sin cookies): un evento por pantalla para saber dónde se abandona. Si el contador no cargó, no pasa nada. */
  function medir(cur, camino) {
    if (VISTA || cur === ultimo) return; ultimo = cur;
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: camino || ('soul/paso-' + pad(ST.step) + '-' + D.PLANS[ST.plan].label), title: 'SOUL paso ' + ST.step + ' (' + cur + ')', event: true }); } catch (_) { /* medir nunca rompe el flujo */ }
  }
  function render(mover, foco) {
    var cur = curActual(), T = total();
    medir(cur);
    var fin = cur === 'fin';
    appEl.classList.toggle('ancho', fin);
    pasoEl.innerHTML = fin ? finHTML() : pasoHTML(cur);
    if (fin) { pintarKit(); montarGoogle(); }
    var etiqueta = fin ? 'Tu borrador' : ST.step === 0 ? 'Bienvenida' : ST.step === T ? 'Listo' : pad(ST.step) + ' / ' + pad(nPreg());
    $('#etiqueta').textContent = etiqueta;
    var pct = fin ? 100 : Math.round(ST.step / T * 100);
    $('#barra').style.width = pct + '%';
    $('.barra').setAttribute('aria-valuenow', String(pct));
    // acciones
    var a = '';
    if (VISTA) {
      a = '';
    } else if (fin) {
      a += '<button class="btn-v" type="button" data-a="editar" aria-label="Volver a mis respuestas">' + SVG_ATRAS + '</button>';
      a += (ST.result && ST.result.ok) ? '<a class="btn-p" href="index.html">Listo, volver al inicio</a>' : '<a class="btn-p" href="' + esc(waUrl()) + '" target="_blank" rel="noopener" data-a="wsp">Enviar por WhatsApp</a>';
    } else {
      if (ST.step > 0) a += '<button class="btn-v" type="button" data-a="back" aria-label="Pregunta anterior">' + SVG_ATRAS + '</button>';
      var lbl = ST.step === 0 ? 'Empezar →' : ST.step === T - 1 ? 'Ver mi ficha →' : ST.step === T ? (ST.plan === 2 ? 'Generar mi sitio y mi panel →' : 'Generar mi sitio →') : 'Siguiente →';
      a += '<button class="btn-p" type="button" data-a="next" id="btn-next"' + (enviando ? ' disabled' : '') + '>' + (enviando ? 'Enviando…' : lbl) + '</button>';
    }
    accEl.innerHTML = '<p class="error" role="alert" id="err" style="position:absolute;left:20px;right:20px;bottom:76px;box-shadow:0 8px 24px rgba(0,0,0,.15)">' + esc(errorMsg) + '</p>' + a;
    if (mover) {
      window.scrollTo(0, 0);
      var f = $('#foco'); if (f) f.focus({ preventScroll: true });
    } else if (foco) {
      var el = $(foco); if (el) el.focus({ preventScroll: true });
    }
  }
  function mostrarError(msg, sel) {
    errorMsg = msg; var e = $('#err'); if (e) e.textContent = msg;
    var el = sel && $(sel);
    if (el) { el.focus(); if (el.setAttribute) el.setAttribute('aria-invalid', 'true'); }
  }
  function limpiarError() { errorMsg = ''; var e = $('#err'); if (e) e.textContent = ''; }
  function ir(n) { limpiarError(); ST.step = n; guardar(); render(true); }

  /* ───────── acciones ───────── */
  function toggle(arr, v) { var k = arr.indexOf(v); if (k >= 0) arr.splice(k, 1); else arr.push(v); }
  function pickEnfoque(i) {
    var e = D.ENFOQUES[i]; ST.enfoque = i; ST.style = e.style;
    if (e.palette !== null) ST.palette = e.palette;
    if (e.bg !== null) ST.bg = e.bg;
  }
  function accion(a, i, el) {
    var n = Number(i);
    limpiarError();
    switch (a) {
      case 'plan': ST.plan = n; break;
      case 'oficio': {
        var o = D.OFICIOS[n];
        ST.oficio = n; ST.style = o.style; ST.enfoque = o.style === 1 ? 0 : 2; ST.bg = o.bg; ST.motion = o.motion; ST.palette = o.palette; ST.concept = 0; ST.conceptText = '';
        break;
      }
      case 'like': {
        var l = D.LIKES[n];
        if (ST.likes.indexOf(l) < 0 && ST.likes.length >= 3) { mostrarError('Puedes elegir hasta 3. Quita una para elegir otra.'); return; }
        toggle(ST.likes, l); break;
      }
      case 'pal': ST.palette = n; break;
      case 'concept': ST.concept = n; ST.conceptText = ''; break;
      case 'enf': pickEnfoque(n); break;
      case 'bg': ST.bg = n; break;
      case 'motion': ST.motion = n; break;
      case 'tone': ST.tone = n; break;
      case 'where': toggle(ST.where, D.WHERE[n]); break;
      case 'field': toggle(ST.fields, D.FIELDS[n]); break;
      case 'modo': ST.modalidad = n; break;
      case 'dir': ST.dir = n; break;
      case 'cifraU': ST.cifraU = ST.cifraU === D.CIFRA_UNID[n] ? '' : D.CIFRA_UNID[n]; break;
      case 'avg': ST.avg = n; break;
      case 'reply': ST.reply = n; break;
      case 'books': ST.books = n; break;
      case 'addsvc': if (ST.svcs.length < 6) ST.svcs.push({ n: '', p: '', d: '', ph: 'lib', phName: '' }); break;
      case 'svcph':
        if (el.dataset.m === 'lib') { ST.svcs[n].ph = 'lib'; ST.svcs[n].phName = ''; delete MEM.svcPh[n]; }
        else { pendiente = { tipo: 'svc', i: n }; $('#archivo').click(); return; }
        break;
      case 'photoup': pendiente = { tipo: 'own' }; $('#archivo').click(); return;
      case 'photorm': MEM.photo = ''; ST.photoName = ''; break;
      case 'back': ir(ST.step - 1); return;
      case 'next': siguiente(); return;
      case 'editar': ST.result = null; ir(total()); return;
      case 'reintentar': enviar(); return;
      case 'copiar': copiar(); return;
      case 'copiarenl': copiarEnlace(); return;
      case 'kit': descargarKit(el.dataset.m, el); return;
      case 'arte': ST.arte = (ST.arte || 0) + 1; break;
      case 'estilo': MEM.retEst = el.dataset.i; break;
      case 'retrato': crearRetrato(el); return;
      case 'retdl': bajarRetrato(); return;
      case 'retuse': MEM.photo = MEM.retrato; ST.photoName = 'retrato-' + (MEM.retHecho || 'estilo') + '.jpg'; break;
      case 'wsp': return;   // enlace normal a WhatsApp
      default: return;
    }
    guardar();
    render(false, '[data-a="' + a + '"][data-i="' + i + '"]');
  }
  function siguiente() {
    var cur = curActual(), v = validar(cur);
    if (v) { mostrarError(v[0], v[1]); return; }
    if (cur === 10) { enviar(); return; }
    ir(ST.step + 1);
  }

  /* ───────── fotos: se achican en el navegador antes de usarlas ───────── */
  function achicar(file) {
    return new Promise(function (ok, mal) {
      if (!/^image\//.test(file.type)) { mal(new Error('Ese archivo no es una imagen.')); return; }
      if (file.size > 25 * 1024 * 1024) { mal(new Error('La foto pesa más de 25 MB.')); return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        try {
          var m = 1280, k = Math.min(1, m / Math.max(im.width, im.height));
          var c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          ok(c.toDataURL('image/jpeg', 0.8));
        } catch (e) { mal(e); }
      };
      im.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No pude leer esa foto. Prueba con otra.')); };
      im.src = url;
    });
  }
  $('#archivo').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0], tgt = pendiente; e.target.value = ''; pendiente = null;
    if (!f || !tgt) return;
    achicar(f).then(function (data) {
      var nom = f.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').slice(0, 40) || 'foto';
      if (tgt.tipo === 'own') { MEM.photo = data; ST.photoName = nom + '.jpg'; }
      else { MEM.svcPh[tgt.i] = data; ST.svcs[tgt.i].ph = 'up'; ST.svcs[tgt.i].phName = nom + '.jpg'; }
      limpiarError(); guardar(); render(false);
    }, function (err) { mostrarError(err.message || 'No pude usar esa foto.'); });
  });

  /* ───────── envio ───────── */
  function armarPayload() {
    var p = D.PLANS[ST.plan], archivos = [];
    if (MEM.photo) archivos.push({ nombre: 'foto-propia.jpg', b64: MEM.photo.split(',')[1] });
    ST.svcs.forEach(function (v, k) {
      if (v.ph === 'up' && MEM.svcPh[k] && v.n.trim() && archivos.length < 5) archivos.push({ nombre: 'servicio-' + (k + 1) + '-' + v.n.trim().replace(/[^\w\-]+/g, '-').slice(0, 30) + '.jpg', b64: MEM.svcPh[k].split(',')[1] });
    });
    var c = (ST.correo || (ST.plan === 2 ? ST.email : '')).trim();
    var inp = $('[data-k="trampa"]');
    return {
      tipo: 'soul', origen: 'compai.cl/soul', sitioweb: inp ? inp.value : '',
      plan: p.label, precio_mes: p.mes, precio_anual: p.anual,
      modalidad: ST.modalidad === 1 ? 'anio' : 'mes', slug: slug(),
      nombre: ST.name.trim(), telefono: ST.tel.trim(), correo: c, oficio: oficioNombre(),
      borrador: codificar(),
      resumen: M.resumenMarca(ST, D, dirActual(), sup()).concat(resumen()), archivos: archivos
    };
  }
  function enviar() {
    if (enviando) return;
    var v = validar(10); if (v) { ir(total()); mostrarError(v[0], v[1]); return; }
    enviando = true; limpiarError(); render(false);
    var payload = armarPayload();
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    var p;
    if (!CFG.endpoint) p = Promise.reject(new Error('el formulario aún no está conectado'));
    else p = fetch(CFG.endpoint, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (r) {
          // Apps Script contesta 200 aun cuando falla: lo que manda es {ok:true}.
          if (!res.ok || r.ok !== true) throw new Error(r.error ? 'error ' + r.error : 'sin confirmación del servidor');
          return r;
        });
      });
    p.then(function () { ST.result = { ok: true }; try { sessionStorage.removeItem(KEY); } catch (_) { /* nada que borrar */ } medir('enviado', 'soul/enviado-' + D.PLANS[ST.plan].label); }, function (err) {
      ST.result = { ok: false, motivo: (err && err.name === 'AbortError') ? 'tardó demasiado' : (err && err.name === 'TypeError') ? 'sin conexión con el servidor' : String((err && err.message) || err) };
    }).then(function () {
      clearTimeout(t); enviando = false; ST.step = total() + 1; guardar(); render(true);
    });
  }
  function copiar() {
    var ta = $('#resp-txt'), msg = $('#copiado'), txt = ta ? ta.value : waTexto();
    function listo(ok) { if (msg) msg.textContent = ok ? ' Copiado. Pégalo en un WhatsApp al ' + WSP_TXT : ' No pude copiar solo: selecciona el texto y cópialo.'; if (!ok && ta) { ta.focus(); ta.select(); } }
    try { navigator.clipboard.writeText(txt).then(function () { listo(true); }, function () { listo(false); }); } catch (_) { listo(false); }
  }

  /* ───────── eventos ───────── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]');
    if (b) { if (b.dataset.a === 'wsp') return; accion(b.dataset.a, b.dataset.i, b); return; }
    var vp = e.target.closest('a[data-vp]');
    if (vp) { e.preventDefault(); var d = $(vp.getAttribute('href')); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.k) { ST[t.dataset.k] = t.value; if (t.dataset.k === 'conceptText') { /* descripcion propia pisa la propuesta */ } t.removeAttribute('aria-invalid'); }
    else if (t.dataset.svc) { ST.svcs[Number(t.dataset.i)][t.dataset.svc] = t.value; }
    else if (t.dataset.col) { ST.myColors[Number(t.dataset.col)] = t.value; }
    guardar();
  });
  document.addEventListener('change', function (e) { if (e.target.dataset.col) render(false, '[data-col="' + e.target.dataset.col + '"]'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('input.in:not([type=color])')) { e.preventDefault(); siguiente(); }
  });

  /* ───────── arranque ───────── */
  var hm = /^#borrador=([A-Za-z0-9_-]{10,8000})$/.exec(location.hash || '');
  // «#cargar=…»: el estudio arma las respuestas de alguien (una prueba, o lo que mandó por WhatsApp) y la persona
  // abre la ficha ya llena, editable, y solo toca enviar. A diferencia de «#borrador=», sí guarda y sí envía.
  var hc = !hm && /^#cargar=([A-Za-z0-9_-]{10,8000})$/.exec(location.hash || '');
  if (hm) {
    try { ST = mezclar(decodificar(hm[1])); ST.result = { ok: true }; ST.step = 9999; VISTA = true; } catch (_) { ST = nuevo(); VISTA = false; }
  } else if (hc) {
    try { ST = mezclar(decodificar(hc[1])); ST.result = null; ST.step = total(); } catch (_) { ST = nuevo(); }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* sin History API: el hash queda, no molesta */ }
    guardar();
  } else {
    // Abrir la página otra vez NO hereda lo de la persona anterior: solo se conserva al recargar o al volver atrás.
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (!nav || (nav.type !== 'reload' && nav.type !== 'back_forward')) sessionStorage.removeItem(KEY);
    } catch (_) { /* sin Performance API: se parte limpio igual */ try { sessionStorage.removeItem(KEY); } catch (__) { /* sin storage */ } }
    cargar();
  }
  try {
    var q = new URLSearchParams(location.search).get('plan');
    if (!VISTA && ST.step === 0 && q !== null && /^[012]$/.test(q)) { ST.plan = Number(q); ST.step = 0; ST.result = null; }
  } catch (_) { /* sin URLSearchParams: se queda el plan guardado */ }
  render(false);
})();
