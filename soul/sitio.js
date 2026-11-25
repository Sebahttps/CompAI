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
  /* La paleta propia viene del enlace (#): solo valen colores #RRGGBB (Grace, 24-11-2026). Un valor raro se pegaba tal cual
     dentro del dibujo y del CSS y podía meter código ajeno en compai.cl; si no calza, va el color de la paleta por defecto. */
  var HEX = /^#[0-9A-Fa-f]{6}$/;
  function pal(ST, D) {
    var base = D.PALETTES[ST.palette == null || ST.palette === D.PALETTES.length - 1 ? 0 : ST.palette].c;
    if (ST.palette !== D.PALETTES.length - 1) return base;
    var m = Array.isArray(ST.myColors) ? ST.myColors : [];
    return [0, 1, 2].map(function (k) { return HEX.test(m[k]) ? m[k] : base[k]; });
  }
  function oficioNombre(ST, D) { return esOtro(ST, D) ? (ST.oficioOtro || 'Otro oficio') : ofi(ST, D).label; }
  function dirActual(ST, D, M) { return ST.dir != null ? ST.dir : M.elegir(ST, D); }
  function sup(ST, D, M) { return M.superficies(M.DIRS[dirActual(ST, D, M)], ST.bg === 0, pal(ST, D)[0]); }
  function svcsLlenos(ST) { return ST.svcs.filter(function (x) { return x.n.trim(); }); }
  function slug(ST) { return ((ST.marcaNombre || '').trim() || ST.name || 'tu-negocio').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'tu-negocio'; }

  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* ───────── el codigo del enlace ───────── */
  /* El enlace publico lleva las respuestas en el # (nunca llega a un servidor). Formato: JSON -> UTF-8 -> base64url.
     Para que pese poco SOLO viaja lo que la persona cambio respecto de nuevo(). Va el WhatsApp (el sitio lo muestra
     como boton de contacto); NO va el correo, ni el estado interno. */
  var FUERA = ['correo', 'email', 'result', 'step'];
  function nuevo() {
    return {
      step: 0, plan: 1, name: '', apodo: '', marcaNombre: '', oficio: null, oficioOtro: '', likes: [], likeOtro: '',
      palette: null, concept: 0, conceptText: '', style: 0, bg: 0, motion: 1, tone: 0, enfoque: 2,
      myColors: ['#E8789A', '#FFF1B8', '#2A1D45'], photoName: '',
      svcs: [0, 1, 2].map(function () { return { n: '', p: '', d: '', ph: 'lib', phName: '' }; }),
      where: [], comunas: '', insta: '', fb: '', fields: [], email: '',
      avg: null, reply: null, books: null, modalidad: null, tel: '', correo: '', result: null,
      // el alma (SOUL 2) y la dirección de marca (null = la elige el borrador)
      origen: '', unico: '', nunca: '', momento: '', cifraN: '', cifraU: '', cifraOtro: '', cierre: '', dir: null,
      arte: 0,  // la versión de la ilustración (botón «otra versión»): misma semilla, misma imagen
      gal: 0,   // cuál de las 5 frases del oficio titula la galería (OFICIOS_PORTADA.galeria)
      sid: ''   // el id del sitio que da el servidor (pago a la semana, 24-11-2026): viaja en el código del enlace
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
    var mc = nuevo().myColors; base.myColors = mc.map(function (c, k) { return HEX.test(base.myColors[k]) ? base.myColors[k] : c; });
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


  /* ───────── el arte generado (arte.js): las opciones salen de las respuestas ───────── */
  function opcionesArte(ST, D, M, extra) {
    var di = dirActual(ST, D, M), d = M.DIRS[di], su = sup(ST, D, M), p = pal(ST, D);
    var i = ST.oficio == null ? D.MOTIFS.length - 1 : ST.oficio;
    var w = M.marcaNombre(ST).split(/\s+/).filter(Boolean);
    var ini = (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : (w[0] || 'S').slice(0, 2)).toUpperCase();
    var A = W.SOUL_ARTE;
    return Object.assign({
      motivo: D.MOTIFS[i], relleno: ST.oficio === 0, trama: d.trama, dir: d.id, display: d.display, ini: ini, oficioN: i, version: ST.arte || 0,
      seed: (A ? A.semilla(M.marcaNombre(ST) + '|' + i) : 1) + (ST.arte || 0) * 7919,
      tintas: { bg: su.bg, bg2: su.bg2, ink: su.ink, ac: su.vivo, c2: p[1], c3: p[2], sobreAc: su.on }
    }, extra || {});
  }
  /* Lo que necesita el póster y la historia animada: la escena + el texto, todo dato de la persona. */
  function kit(ST, D, M, cfg) {
    var d = M.DIRS[dirActual(ST, D, M)], tel = digitos(ST.tel);
    return {
      escena: opcionesArte(ST, D, M, { ini: '' }), tintas: opcionesArte(ST, D, M).tintas,
      fuentes: { display: d.display, texto: d.texto, mono: d.mono }, mayus: !!d.mayus,
      oficio: oficioNombre(ST, D), titular: M.titular(ST) || M.marcaNombre(ST), nombre: M.marcaNombre(ST),
      cta: TONO_CTA[ST.tone] || 'Cotizar', contacto: tel.length >= 8 ? '+' + (tel.length === 9 && tel.charAt(0) === '9' ? '56 ' + tel.charAt(0) + ' ' + tel.slice(1, 5) + ' ' + tel.slice(5) : tel) : '',
      pie: ''
    };
  }

  /* ───────── piezas del diseño (23-11-2026, dirección de arte de Visu) ───────── */
  function inicialesDe(ST, M) {
    var w = M.marcaNombre(ST).split(/\s+/).filter(Boolean);
    return (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : (w[0] || 'S').slice(0, 2)).toUpperCase();
  }
  /* El titular en dos tamaños: la entrada (el comienzo, chica) y el remate (las últimas 1 o 2 palabras, enorme).
     Menos de 3 palabras: todo es remate. */
  function titPartes(t) {
    var w = String(t || '').trim().split(/\s+/).filter(Boolean);
    if (w.length < 3) return { e: '', r: w.join(' ') };
    var k = w.length > 5 ? 2 : 1;
    return { e: w.slice(0, -k).join(' '), r: w.slice(-k).join(' ') };
  }
  function masLarga(t) { return String(t || '').split(/\s+/).reduce(function (m, p) { return Math.max(m, p.length); }, 1); }
  /* La frase del manifiesto en tramos (2 a 4, de hasta 32 letras cada uno), cada tramo en su renglón en escritorio.
     Separan la coma y «o / y»; un tramo largo se parte antes de un «que». Si no se puede, null (la frase va corrida). */
  function tramos(txt) {
    var s = String(txt || '').replace(/\s+/g, ' ').trim(); if (!s) return null;
    var p = s.replace(/,\s+/g, ',|').replace(/\s+(o|y)\s+/g, '|$1 ').split('|'), out = [];
    p.forEach(function (x) {
      if (x.length <= 32) { out.push(x); return; }
      var best = -1, mid = x.length / 2, i = x.indexOf(' que ', 1);
      while (i > 0) { if (i <= 32 && x.length - i - 1 <= 32 && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; i = x.indexOf(' que ', i + 1); }
      if (best > 0) { out.push(x.slice(0, best)); out.push(x.slice(best + 1)); } else out.push(x);
    });
    return out.length >= 2 && out.length <= 4 && out.every(function (x) { return x.length <= 32; }) ? out : null;
  }
  /* El Instagram que dio la persona, como @usuario y como enlace (acepta @usuario, usuario o la URL). */
  function instaDe(s) {
    var t = String(s || '').trim(); if (!t) return null;
    var m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(t), u = m ? m[1] : t.replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '');
    return u ? { txt: '@' + u, url: 'https://www.instagram.com/' + u + '/' } : null;
  }
  /* Las opciones del sello de esta persona (marca.js lo dibuja). extra = lo que trae su carpeta de fotos: { lema, gesto } con visto de Sebastián. */
  function selloDe(ST, D, M, extra) {
    var di = dirActual(ST, D, M), idx = ST.oficio == null ? D.OFICIOS.length - 1 : ST.oficio;
    return { ini: inicialesDe(ST, M), oficio: oficioNombre(ST, D), oficioLabel: D.OFICIOS[idx].label, nombre: M.marcaNombre(ST),
      lema: extra && extra.lema || '', gesto: extra && extra.gesto || '', d: M.DIRS[di], c0: pal(ST, D)[0] };
  }
  /* La imagen de portada que declara fotos.json (24-11-2026, PORTADA.md de Visu): ancha (escritorio) y vertical (celular), cada una
     con la `medida` que escribió soul/preparar_fotos.py (la regla: zona del titular, letra, velo, recorte, sello). Una portada de
     una sola imagen y sin medida (formato de antes, o la foto que sube la persona en la vista previa) sale en modo CAJA.
     Devuelve { alt, a: {src,w,h,srcset,m}|null, v: {...}|null } o null. */
  function nombreOk(s) { return /^[\w.\-]+$/.test(s || ''); }
  function portadaDe(pp, fbase) {
    if (!pp || typeof pp !== 'object') return null;
    var una = function (x) {
      var ss = Array.isArray(x.srcset) ? x.srcset.filter(function (q) { return Array.isArray(q) && nombreOk(q[0]) && q[1] > 0; }).map(function (q) { return fbase + q[0] + ' ' + Math.round(q[1]) + 'w'; }) : [];
      return { src: fbase + x.src, w: Math.round(+x.w) || 1600, h: Math.round(+x.h) || 900, srcset: ss.join(', '), m: x.medida && typeof x.medida === 'object' ? x.medida : null };
    };
    var ok = function (x) { return x && typeof x === 'object' && nombreOk(x.src); };
    var a = ok(pp.ancha) ? una(pp.ancha) : null, v = ok(pp.vertical) ? una(pp.vertical) : null;
    if (!a && !v && nombreOk(pp.src)) a = una(pp);
    return a || v ? { alt: typeof pp.alt === 'string' ? pp.alt : '', a: a, v: v } : null;
  }
  /* Las fotos de la persona: de su carpeta (fotos.json) o, en la vista previa, las que subió. Nunca se inventan.
     Devuelve { portada: portadaDe()|null, serv: [{k,nombre,src,alt,w,h}], referencia } */
  function fotosDe(ST, D, M, F, fbase, MEM) {
    var R = { portada: null, serv: [], referencia: false }, norm = M.norm;
    if (F && typeof F === 'object') {
      R.portada = portadaDe(F.portada, fbase || '');
      svcsLlenos(ST).forEach(function (v, i) {
        var e = (F.servicios || []).filter(function (x) { return x && norm(x.servicio) === norm(v.n) && /^[\w.\-]+$/.test(x.src || ''); })[0];
        if (e) R.serv.push({ k: i, nombre: v.n.trim(), src: (fbase || '') + e.src, alt: e.alt || '', w: e.w || 800, h: e.h || 1067 });
      });
      R.referencia = F.referencia !== false;      // por defecto las fotos son «de referencia»: la nota se muestra salvo que diga lo contrario
    } else if (MEM) {
      // foto propia o retrato de «Usar en mi portada»: CAJA. Con la portada doble (24-11-2026) va la ancha al computador y la vertical al celular.
      if (MEM.photo && MEM.photoAncha) R.portada = { alt: '', a: { src: MEM.photoAncha, w: 1600, h: 900, srcset: '', m: null }, v: { src: MEM.photo, w: 900, h: 1600, srcset: '', m: null } };
      else if (MEM.photo) R.portada = { alt: '', a: { src: MEM.photo, w: 800, h: 1000, srcset: '', m: null }, v: null };
      var c = 0; ST.svcs.forEach(function (v, k) { if (v.n.trim()) { if (v.ph === 'up' && MEM.svcPh && MEM.svcPh[k]) R.serv.push({ k: c, nombre: v.n.trim(), src: MEM.svcPh[k], alt: '', w: 800, h: 1067 }); c++; } });
    }
    return R;
  }

  /* Las fotos de la persona (opcional): soul/fotos/index.json dice qué carpetas existen y soul/fotos/<slug>/fotos.json las describe.
     Sin red, sin carpeta, tarde o roto: resuelve null y el sitio sale con la ilustración de siempre (sin error en la consola). */
  function traerFotos(slug, raizFotos) {
    if (!W.fetch || !/^https?:$/.test(W.location.protocol) || !/^[a-z0-9-]+$/.test(slug)) return Promise.resolve(null);
    var pedido = W.fetch(raizFotos + 'index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (ix) {
      if (!ix || !Object.prototype.hasOwnProperty.call(ix, slug)) return null;
      return W.fetch(raizFotos + slug + '/fotos.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; });
    }).catch(function () { return null; });
    return Promise.race([pedido, new Promise(function (ok) { setTimeout(function () { ok(null); }, 2500); })]).then(function (F) { return F && typeof F === 'object' ? F : null; });
  }

  /* ───────── el render ───────── */
  /* Textos que esperan el visto de Sebastián (DIRECCION.md §5): quedan juntos para que se vean y se cambien en un solo lugar. */
  var TXT = {
    momentos: 'Momentos', nota: 'Imágenes de referencia de cada servicio.', instagram: 'Instagram', facebook: 'Facebook',
    salto: 'Ir a los servicios', cotizar: 'Cotizar', mi_limite: 'Mi límite', mi_vara: 'Mi vara', desde: 'desde',
    contenido: 'Ir al contenido',   // PROPUESTO por Visu (PORTADA.md §8, 24-11-2026): no se ve, es el salto de teclado
    // PROPUESTOS (24-11-2026, página de cada servicio en sun y vibe, y acceso al panel en la vista previa): esperan el visto de Sebastián
    volver: 'Volver al inicio', incluye: 'Qué incluye',
    panel_t: 'Tu panel', panel_p: 'Así vas a ver las solicitudes que te lleguen y cambiar tus textos y precios. Es una maqueta con datos de muestra.',
    panel_b: 'Abrir la maqueta del panel'
  };
  function trio(hex) { var n = parseInt(hex.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
  var POS = /^\d{1,3}% \d{1,3}%$/;
  /* Lo que la regla midió para esta dirección de marca, o null si no alcanza (falta, es CAJA o viene roto). */
  function medidaDe(x, dirId, ancha) {
    var m = x && x.m, r = m && m.dirs && m.dirs[dirId];
    if (!r || (r.letra !== 'clara' && r.letra !== 'oscura') || r.modo !== 'imagen' || !(r.velo >= 0 && r.velo <= 1)) return null;
    if (ancha && m.zona !== 'izq' && m.zona !== 'der') return null;
    return { letra: r.letra, velo: Math.round(r.velo * 100) / 100, zona: m.zona, pos: POS.test(m.recorte || '') ? m.recorte : (ancha ? '50% 50%' : '50% 0%'), sello: m.sello === 'izq' ? 'izq' : 'der' };
  }
  function html(ST, o) {
    var D = o.D, M = o.M, MEM = o.mem || { photo: '', svcPh: {} }, base = o.base || '', vivo = !!o.vivo;
    var WSP = (o.cfg && o.cfg.whatsapp) || '56962469977', FJ = o.fotos || null;
    var di = dirActual(ST, D, M), d = M.DIRS[di], su = sup(ST, D, M), dark = ST.bg === 0;
    var nombre = M.marcaNombre(ST), cta = TONO_CTA[ST.tone] || 'Cotizar', tel = digitos(ST.tel), lleno = svcsLlenos(ST);
    var wsp = 'https://wa.me/' + (tel.length >= 8 ? (tel.length === 9 && tel.charAt(0) === '9' ? '56' + tel : tel) : WSP) + (vivo ? '?text=' + encodeURIComponent('Hola ' + nombre + ', vi tu sitio y quiero cotizar.') : '');
    var ci = M.cifra(ST, D), tit = M.titular(ST) || nombre, cie = M.cierre(ST);
    var FT = fotosDe(ST, D, M, FJ, o.fotosBase, vivo ? null : MEM), PT = FT.portada;
    var momentos = FT.serv.length >= 2;
    var so = selloDe(ST, D, M, FJ && FJ.sello), selloAlt = 'Sello de ' + nombre + (so.lema ? ': ' + so.lema + '.' : '.');
    var tb = (function () { var t = tel.length === 11 && tel.slice(0, 2) === '56' ? tel.slice(2) : tel; if (t.length < 8) return ''; return '+' + (t.length === 9 && t.charAt(0) === '9' ? '56 ' + t.charAt(0) + ' ' + t.slice(1, 5) + ' ' + t.slice(5) : tel); })();
    var dnd = ST.plan >= 1 ? ST.where.slice() : [], com = ST.plan >= 1 ? ST.comunas.trim() : '';
    var hechos = dnd.concat(com ? [com] : []);
    var ins = ST.plan >= 1 ? instaDe(ST.insta) : null, fb = ST.plan >= 1 ? ST.fb.trim() : '';
    // estructura del 24-11-2026 (Sebastián): después de la portada va «Mi límite», la frase que marca la diferencia
    var cand = [[TXT.mi_limite, M.nunca(ST)], ['', M.origen(ST)], [TXT.mi_vara, M.momento(ST)]].filter(function (x) { return x[1]; });
    var OP = (D.OFICIOS_PORTADA || [])[ST.oficio] || null;
    var galT = OP && OP.galeria && OP.galeria.length ? OP.galeria[ST.gal >= 0 && ST.gal < OP.galeria.length ? ST.gal : 0] : TXT.momentos;
    var hoja = OP && OP.hoja === 'plano' ? 'plano' : 'cuaderno';
    var ip = o.idp || '';
    // página de cada servicio (planes sun y vibe, 24-11-2026): solo en el enlace público, que pasa su código en o.enlace.
    // El # queda «<código>&s=<n>»: el código no cambia (ni su tope de 6000) y los enlaces de siempre abren el inicio.
    var enl = vivo && ST.plan >= 1 && /^[A-Za-z0-9_-]{10,20000}$/.test(o.enlace || '') ? o.enlace : '';
    var pg = enl && o.pag != null && lleno[o.pag] ? Number(o.pag) : null;
    var aPag = function (k) { return '#' + enl + '&s=' + k; };

    var vars = '--display:' + d.display + ';--texto:' + d.texto + ';--mono:' + d.mono +
      ';--bg:' + su.bg + ';--bg2:' + su.bg2 + ';--ink:' + su.ink + ';--mut:' + su.mut + ';--ac:' + su.ac + ';--vivo:' + su.vivo + ';--on:' + su.on + ';--suave:' + su.suave + ';--vb:' + su.vb + ';--ln:' + rgba(su.ink, .22) + ';--campo:' + (dark ? su.bg2 : '#FFFFFF') +
      ';--bgI:' + su.bgI + ';--bg2I:' + su.bg2I + ';--inkI:' + su.inkI + ';--mutI:' + su.mutI + ';--acI:' + su.acI + ';--vivoI:' + su.vivoI + ';--onI:' + su.onI + ';--suaveI:' + su.suaveI + ';--vbI:' + su.vbI + ';--lnI:' + rgba(su.inkI, .22);
    var s = '<div class="vp' + (d.mayus ? ' my' : '') + '" data-dir="' + d.id + '" data-mov="' + (ST.motion === 0 ? 0 : ST.motion === 2 ? 2 : 1) + '" style="' + vars + '">';
    var primero = pg != null ? '#vp-servicio' : cand.length ? '#vp-manifiesto' : momentos ? '#vp-momentos' : lleno.length ? '#vp-servicios' : '#vp-cotiza';
    s += '<a class="salto" href="' + primero + '" data-vp>' + TXT.contenido + '</a>';
    if (lleno.length && pg == null) s += '<a class="salto" href="#vp-servicios" data-vp>' + TXT.salto + '</a>';
    // 0 · menú: el bloque del sello + el nombre; solo enlaces a secciones que existen. Con letra clara, el bloque va en papel.
    // En la página de un servicio los enlaces llevan al inicio (sitio-publico.js vuelve y baja a la sección).
    var nl = [];
    if (cand.length) nl.push(['#vp-manifiesto', 'Manifiesto']);
    if (lleno.length) nl.push(['#vp-servicios', 'Servicios']);
    if (momentos) nl.push(['#vp-momentos', galT]);
    nl.push(['#vp-cotiza', 'Contacto']);
    var mono = function (k, claro) { return '<span class="mono' + k + '" aria-hidden="true">' + M.monograma(so, 'color', null, 'mg' + ip + k.replace(/\W/g, ''), ' width="44" height="44" focusable="false"', false, claro) + '</span>'; };
    var navDe = function (monos) {
      var mc = monos + '<span class="nom">' + esc(nombre) + '</span>';
      return '<nav class="nav" aria-label="Principal">' + (pg != null ? '<a class="marca" href="#' + enl + '">' + mc + '</a>' : '<span class="marca">' + mc + '</span>') +
        '<ul class="nav-l">' + nl.map(function (x) { return '<li><a href="' + x[0] + '" data-vp>' + esc(x[1]) + '</a></li>'; }).join('') + '</ul>' +
        '<a class="btn btn-nav" href="#vp-cotiza" data-vp>' + esc(cta) + '</a></nav>';
    };
    if (pg != null) s += pagina();
    else {

    // 1 · portada (24-11-2026, PORTADA.md de Visu). Tres modos:
    //   con-img: la imagen de portada a sangre; la regla (medida en fotos.json) dice lado del titular, letra y velo.
    //   caja:    hay imagen pero no zona limpia (o no hay medida, o es la foto de la vista previa): titular en un panel sólido.
    //   sin-img: no hay imagen; la ilustración del oficio es el escenario, sobre el fondo liso de la dirección.
    var mA = PT && medidaDe(PT.a, d.id, true), mV = PT && medidaDe(PT.v, d.id, false);
    var modo = !PT ? 'sin' : mA && mV ? 'img' : 'caja';
    if (modo === 'caja') { mA = { letra: 'clara', velo: 0, zona: 'izq', pos: (PT.a || PT.v).m && POS.test((PT.a || PT.v).m.recorte || '') ? (PT.a || PT.v).m.recorte : '50% 30%', sello: 'der' }; mV = { letra: 'clara', velo: 0, pos: '50% 25%', sello: 'der' }; }
    var c0 = pal(ST, D)[0], supC = M.superficies(d, false, c0), supO = M.superficies(d, true, c0);
    // lo que va SOBRE la imagen se pinta con la letra que eligió la regla; lo sólido (botones) con las superficies de esa letra
    var pinta = function (k, m) {
      var cl = m.letra === 'clara', S2 = cl ? supO : supC, papel = cl ? d.osc.bg : d.cla.bg;
      return ';--' + k + '-ink:' + (cl ? d.osc.ink : d.cla.ink) + ';--' + k + '-bg:' + papel + ';--' + k + '-rgb:' + trio(papel) + ';--' + k + '-velo:' + m.velo +
        ';--' + k + '-vivo:' + S2.vivo + ';--' + k + '-on:' + S2.on + ';--' + k + '-vb:' + S2.vb + ';--' + k + '-pos:' + m.pos;
    };
    // la franja de abajo en el celular: papel en Obra y Taller, oscura en Escenario (PORTADA.md §4.c)
    var FS = d.id === 'escenario' ? supO : supC;
    var est = modo === 'sin' ? '' : ('--f-bg:' + FS.bg + ';--f-ink:' + FS.ink + ';--f-mut:' + FS.mut + ';--f-vivo:' + FS.vivo + ';--f-on:' + FS.on + ';--f-vb:' + FS.vb + ';--f-ac:' + FS.ac + pinta('a', mA) + pinta('v', mV)).replace(/^;/, '');

    var monos = modo === 'sin' ? mono('', false) : mA.letra === mV.letra ? mono('', mA.letra === 'clara') : mono(' m-a', mA.letra === 'clara') + mono(' m-v', mV.letra === 'clara');
    var nav = navDe(monos);

    var tp = titPartes(tit), rlen = tp.r.length, rcl = rlen <= 14 ? '' : rlen <= 22 ? ' r2' : ' r3';
    var Ht = vivo ? 'h1' : 'h2';
    // el remate va una palabra por renglón en escritorio (el <br> solo existe ahí) y en un renglón en el celular
    var titH = '<' + Ht + ' class="titular tit">' + (tp.e ? '<span class="entrada">' + esc(tp.e) + '</span> ' : '') +
      '<span class="remate' + rcl + '" style="--rw:' + masLarga(tp.r) + (ci ? ';--cm:' + ci.texto.length : '') + '">' + tp.r.split(' ').map(function (x) { return '<b>' + esc(x) + '</b>'; }).join(' <br>') +
      '<i class="cota" aria-hidden="true"></i>' + (ci ? '<b class="cota-m nopl">' + esc(ci.texto) + '</b>' : '') + '</span></' + Ht + '>';
    var dice = '<div class="dice"><p class="oficio">' + esc(oficioNombre(ST, D)) + '</p>' + titH + '</div>';
    // celular: si el titular es largo y baja de la zona que midió la regla (el 40 % de arriba de la vertical), el velo se alarga
    // hasta cubrirlo y sube a 0,5 como mínimo. Estimación a 390 px: entrada ~26 letras por renglón, remate ~14 (PORTADA.md §10).
    var tl = false;
    if (modo === 'img') {
      var fin = Math.ceil((108 + Math.ceil(tp.e.length / 26) * 27 + Math.ceil(tp.r.length / 14) * 48 + 24) / 693 * 100) + 2;
      // 24-11-2026: el velo termina donde termina el titular y se apaga en 6 %; antes llegaba fijo al 54 % y lavaba la cara.
      est += ';--v-fin:' + Math.max(24, Math.min(fin, 86)) + '%';
      if (fin > 42) { tl = true; est += ';--v-velo:' + Math.max(mV.velo, 0.5); }
      else if (fin > 36) est += ';--v-velo:' + Math.max(mV.velo, 0.4);   // llena la zona hasta abajo: más palabras sobre lo que menos se midió
    }
    var fondoH;
    if (modo === 'sin') {
      fondoH = '<div class="ilu-esc" aria-hidden="true">' + (W.SOUL_ARTE ? W.SOUL_ARTE.escena(opcionesArte(ST, D, M, { w: 448, h: 560, anim: ST.motion !== 0, clase: 'esc-d', sufijo: 'd', par: 'xMidYMin slice', anchoFig: 0.74, ini: '' })) : '') + '</div>';
    } else {
      // <picture>: el celular baja solo la vertical y el escritorio solo la ancha. Es lo primero que se ve: prioridad alta, sin «lazy».
      var IA = PT.a || PT.v, IV = PT.v || PT.a, alt = PT.alt || (nombre + ', ' + oficioNombre(ST, D));
      fondoH = '<picture class="fondo">' + (IA !== IV ? '<source media="(min-width:900px)" srcset="' + esc(IA.srcset || IA.src) + '"' + (IA.srcset ? ' sizes="100vw"' : '') + '>' : '') +
        '<img src="' + esc(IV.src) + '"' + (IV.srcset ? ' srcset="' + esc(IV.srcset) + '" sizes="100vw"' : '') +' width="' + IV.w + '" height="' + IV.h + '" alt="' + esc(alt) + '" fetchpriority="high"></picture>' +
        '<div class="velo" aria-hidden="true"></div>';
    }
    var selloH = '<span class="sello" role="img" aria-label="' + esc(selloAlt) + '" data-esq="' + (modo === 'sin' ? 'der' : mV.sello) + '">' + M.sello(so, 'color', null, 'sp' + ip, ' aria-hidden="true" focusable="false"') + '</span>';
    var accH = '<div class="acc"><a class="btn" href="#vp-cotiza" data-vp>' + esc(cta) + '</a><a class="btn btn-sec" href="' + esc(wsp) + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
      (hechos.length ? '<ul class="hechos">' + hechos.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '');
    s += '<header class="hero portada ' + (modo === 'img' ? 'con-img' + (tl ? ' tl' : '') : modo === 'caja' ? 'caja' : 'sin-img sf-a') + '" aria-label="Portada"' +
      (modo === 'sin' ? '' : ' data-zona="' + mA.zona + '" data-la="' + mA.letra + '" data-lv="' + mV.letra + '" style="' + est + '"') + '>' +
      '<div class="escena">' + fondoH + nav + (modo === 'caja' ? '' : dice) + selloH + '</div>' +
      '<div class="pie-portada">' + (modo === 'caja' ? dice : '') + accH + '</div></header>';

    // 2 · manifiesto (invertido): el rótulo y la frase grande; lo demás, debajo en columnas. Con una sola respuesta se arma igual.
    if (cand.length) {
      var gr = cand[0], resto = cand.slice(1), tr = tramos(gr[1].replace(/[.!?…]+$/, ''));
      var ccl = tr || gr[1].length <= 90 ? '' : gr[1].length <= 160 ? ' c2' : ' c3';
      var frase = tr ? tr.map(function (x, i) { return '<span' + (i ? ' class="cl"' : '') + '>' + esc(x) + (i === tr.length - 1 ? '.' : '') + '</span>'; }).join(' ') : esc(gr[1]);
      s += '<section id="vp-manifiesto" class="s inv man manifiesto" aria-label="Manifiesto">' + (gr[0] ? '<h2 class="rotulo">' + esc(gr[0]) + '</h2>' : '<span class="rotulo"></span>') +
        '<div class="mcol"><p class="cita' + ccl + '">' + frase + '</p>' +
        (resto.length ? '<div class="tres">' + resto.map(function (x) { return '<div>' + (x[0] ? '<h3 class="rotulo">' + esc(x[0]) + '</h3>' : '') + '<p>' + esc(x[1]) + '</p></div>'; }).join('') + '</div>' : '') + '</div></section>';
    }
    // 3 · servicios: la lista de partidas de un presupuesto (nombre, línea guía, «desde» + precio, Cotizar)
    if (lleno.length) {
      s += '<section id="vp-servicios" class="s sf-b b servicios" aria-label="Servicios"><h2>Lo que hago por ti</h2><ul class="partidas">' + lleno.map(function (v, k) {
        var pr = v.p.trim(), de = v.d.trim();
        return '<li' + (pr ? '' : ' class="sinp"') + '><div class="pn"><h3>' + esc(v.n.trim()) + '</h3>' + (de ? '<p class="desc">' + esc(de) + '</p>' : '') + '</div>' +
          (pr ? '<span class="guia" aria-hidden="true"></span><p class="precio"><small>' + TXT.desde + '</small> ' + esc(pr) + '</p>' : '') +
          // sun y vibe: «Cotizar» abre la página del servicio; fresh (y la vista previa) baja al formulario como siempre
          (enl ? '<a class="btn btn-sec" href="' + aPag(k) + '" data-pag="' + k + '">' : '<a class="btn btn-sec" href="#vp-cotiza" data-vp data-serv="' + k + '">') +
          TXT.cotizar + '<span class="oculto">: ' + esc(v.n.trim()) + '</span></a></li>';
      }).join('') + '</ul></section>';
    }
    // 4 · galería (antes «Momentos»): solo con 2 o más fotos de la persona (nunca de banco ni repetidas para rellenar).
    // El título sale del oficio (OFICIOS_PORTADA.galeria, p. ej. «Manos a la obra»).
    if (momentos) {
      var fig = function (f, i) {
        return '<figure class="m' + (i + 1) + '"><div class="vista"><img src="' + esc(f.src) + '" width="' + f.w + '" height="' + f.h + '" loading="lazy" alt="' + esc(f.alt) + '"></div>' +
          '<figcaption>' + (enl ? '<a href="' + aPag(f.k) + '" data-pag="' + f.k + '">' : '<a href="#vp-servicios" data-vp>') + esc(f.nombre) + '</a></figcaption></figure>';
      };
      s += '<section id="vp-momentos" class="s sf-a momentos" aria-label="' + esc(galT) + '"><div class="cab"><h2>' + esc(galT) + '</h2>' + (FT.referencia ? '<p class="nota">' + TXT.nota + '</p>' : '') + '</div>' +
        '<div class="mosaico n' + Math.min(FT.serv.length, 3) + '">' + FT.serv.slice(0, 3).map(fig).join('') + '</div>' +
        (FT.serv.length > 3 ? '<div class="mosaico mas">' + FT.serv.slice(3).map(function (f, i) { return fig(f, i + 3); }).join('') + '</div>' : '') + '</section>';
    }
    }   // fin del inicio (la página de un servicio va en pagina())
    // 5 · contacto: el cajetín (datos fijos) y el formulario
    var fila = function (k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; };
    var filas = (hechos.length ? fila('Dónde', hechos.map(esc).join('<br>')) : '') +
      (tb ? fila('WhatsApp', '<a class="cifra" href="' + esc(wsp) + '" target="_blank" rel="noopener">' + esc(tb) + '</a>') : '') +
      (ins ? fila(TXT.instagram, '<a href="' + esc(ins.url) + '" target="_blank" rel="noopener">' + esc(ins.txt) + '</a>') : '') +
      (fb ? fila(TXT.facebook, esc(fb)) : '');
    var campos = ['Nombre', 'Teléfono'].concat(ST.plan >= 1 ? ['Servicio'] : []).concat(ST.plan >= 1 ? ST.fields : []);
    var formu;
    if (!vivo) {
      formu = '<div class="form" aria-hidden="true">' + campos.map(function (c) { return '<label>' + esc(c) + '<span class="fake">' + (c === 'Servicio' ? 'Elige un servicio ▾' : '') + '</span></label>'; }).join('') + '<span class="btn">Enviar</span></div>';
    } else {
      formu = '<form class="form" data-cotiza="' + esc(slug(ST)) + '" novalidate>' +
        '<label>Tu nombre<input name="nombre" type="text" autocomplete="name" maxlength="80" required></label>' +
        '<label>Tu WhatsApp<input name="telefono" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" required></label>' +
        '<label>Tu correo<input name="correo" type="email" autocomplete="email" maxlength="120" required></label>' +
        (ST.plan >= 1 && lleno.length ? '<label>Servicio<select name="servicio">' + lleno.map(function (v, k) { return '<option' + (k === pg ? ' selected' : '') + '>' + esc(v.n.trim()) + '</option>'; }).join('') + '</select></label>' : '') +
        (ST.plan >= 1 ? ST.fields.filter(function (f) { return f !== 'Fotos'; }).map(function (f) { return '<label>' + esc(f) + '<input name="f_' + esc(f) + '" type="text" maxlength="120" data-campo="' + esc(f) + '"></label>'; }).join('') : '') +
        '<label class="ancho">Cuéntame qué necesitas<textarea name="mensaje" rows="4" maxlength="600"></textarea></label>' +
        '<span class="trampa" aria-hidden="true"><input name="sitioweb" tabindex="-1" autocomplete="off"></span>' +
        '<button class="btn" type="submit">Enviar</button><p class="est" role="status" aria-live="polite"></p></form>';
    }
    s += '<section id="vp-cotiza" class="s sf-a contacto hoja-' + hoja + (filas ? '' : ' sola') + '" aria-label="Cotiza"><div class="lado"><h2>' + esc(cta) + '</h2>' + (filas ? '<dl class="cajetin">' + filas + '</dl>' : '') + '</div>' + formu + '</section>';
    // el panel (vibe) ya no se muestra dentro del sitio: es de la persona, y su maqueta se abre desde la vista previa (app.js, panelHTML)
    // 6 · cierre (invertido): la frase de cierre o el nombre, a tamaño firma, con el sello en una tinta y los datos sueltos
    var ft = cie || nombre, fl = ft.length, fcl = fl <= 16 ? '' : fl <= 30 ? ' f2' : fl <= 50 ? ' f3' : ' f4';
    var datos = [nombre].concat(com ? [com] : []);
    s += '<footer class="cierre inv sf-i" aria-label="Cierre"><div class="cierre-in"><p class="firma' + fcl + '" style="--rw:' + masLarga(ft) + '">' + esc(ft) + '</p>' +
      '<span class="sello-cierre" aria-hidden="true">' + M.sello(so, 'tinta', su.inkI, 'sc' + ip, ' focusable="false"') + '</span></div>' +
      '<div class="acc"><a class="btn" href="#vp-cotiza" data-vp>' + esc(cta) + '</a><a class="btn btn-sec" href="' + esc(wsp) + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
      '<ul class="datos">' + datos.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + (tb ? '<li><a class="cifra" href="' + esc(wsp) + '" target="_blank" rel="noopener">' + esc(tb) + '</a></li>' : '') + '</ul>' +
      // pie oficial (CLAUDE.md 4.b): solo la imagen «alma compAI». Sobre fondo oscuro, letras crema; sobre claro, tinta. El cierre es el inverso de la página.
      '<div class="pie' + (dark ? '' : ' sobre-oscuro') + '"><div class="pie-compai"><img src="' + base + 'img/' + (dark ? 'pie-alma-compai-oscuro' : 'pie-compai-claro') + '.png" width="310" height="95" alt="alma compAI"></div></div></footer>';
    return s + '</div>';

    /* La página de un servicio (sun y vibe): misma marca y menú; título, su foto si la hay, qué incluye, precio «desde»,
       y debajo el mismo contacto con ese servicio ya elegido. Nada se inventa: lo que la persona no escribió no aparece. */
    function pagina() {
      var v = lleno[pg], pr = v.p.trim(), de = v.d.trim(), ft = FT.serv.filter(function (f) { return f.k === pg; })[0];
      var h = '<header class="pag-cab sf-a" aria-label="Encabezado">' + navDe(mono('', false)) + '</header>';
      h += '<section id="vp-servicio" class="s sf-a servicio-pag" aria-label="' + esc(v.n.trim()) + '"><a class="volver" href="#' + enl + '">' + TXT.volver + '</a>' +
        '<div class="sp-in' + (ft ? '' : ' sin-foto') + '">' +
        (ft ? '<figure class="sp-foto"><img src="' + esc(ft.src) + '" width="' + ft.w + '" height="' + ft.h + '" alt="' + esc(ft.alt) + '" fetchpriority="high">' +
          (FT.referencia ? '<figcaption class="nota">' + TXT.nota + '</figcaption>' : '') + '</figure>' : '') +
        '<div class="sp-txt"><p class="oficio">' + esc(oficioNombre(ST, D)) + '</p><h1 class="sp-h">' + esc(v.n.trim()) + '</h1>' +
        (pr ? '<p class="precio"><small>' + TXT.desde + '</small> ' + esc(pr) + '</p>' : '') +
        (de ? '<div class="sp-inc"><h2 class="rotulo">' + TXT.incluye + '</h2><p>' + esc(de) + '</p></div>' : '') +
        '<div class="acc"><a class="btn" href="#vp-cotiza" data-vp data-serv="' + pg + '">' + esc(cta) + '</a><a class="btn btn-sec" href="' + esc(wsp) + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
        (hechos.length ? '<ul class="hechos">' + hechos.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '</div></div></section>';
      return h;
    }
  }

  W.SOUL_SITIO = {
    html: html, nuevo: nuevo, mezclar: mezclar, codificar: codificar, decodificar: decodificar,
    esc: esc, pad: pad, inicialesDe: inicialesDe, titPartes: titPartes, tramos: tramos, instaDe: instaDe, selloDe: selloDe, fotosDe: fotosDe, portadaDe: portadaDe, medidaDe: medidaDe, traerFotos: traerFotos, TXT: TXT, digitos: digitos, slug: slug, pal: pal, ofi: ofi, esOtro: esOtro, oficioNombre: oficioNombre,
    dirActual: dirActual, sup: sup, svcsLlenos: svcsLlenos, TONO_CTA: TONO_CTA, opcionesArte: opcionesArte, kit: kit
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = W.SOUL_SITIO;
})(typeof window !== 'undefined' ? window : globalThis);
