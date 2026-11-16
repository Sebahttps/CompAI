/* compai.cl · armador del sitio (tema claro «compAI Claro Minimal», 15-11-2026).
   Lee contenido/sitio.json + contenido/lineas.json (+ radar.json si está) y
   escribe index.html, portafolio.html, 404.html, sitemap.xml y robots.txt.
   Cambiar un texto = editar el JSON y volver a correr:
       node construir.mjs
   El workflow del repo que publica (publicacion/workflow-sitio.yml) lo corre
   solo en cada push que toque contenido/ o este archivo.

   La portada es el lienzo que Sebastián aprobó el 15-11-2026 («listo!») tras
   dos días y más de 60 comentarios: un solo HTML responsivo, cuatro líneas al
   20/40/60/80 % que vienen del video del hero, videos fundidos al fondo, barra
   de 8 iconos que al bajar pasa a la izquierda. Los textos son los del lienzo:
   ninguno nuevo sin su visto. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const lee = f => JSON.parse(readFileSync(join(raiz, f), 'utf8'));

const S = lee('contenido/sitio.json');
const LIN = lee('contenido/lineas.json').lineas;
const ESC = lee('contenido/escenas.json');
// N.º de la última actualización de este sitio (Sebastián, 08-11-2026). Lo da tools/actualizacion.py.
const RUTA_ACT = join(raiz, '../../intranet-referencia/datos/actualizaciones.json');
// 14-11-2026: el CI de CompAI vuelve a correr este script sin kri-eit al lado y el sello
// desaparecia en vivo. Aqui se deja una copia en contenido/_actualizacion.json -que
// publicar.py sube con `contenido`- y el CI la lee.
const RUTA_ACT_COPIA = join(raiz, 'contenido/_actualizacion.json');
let ACT = null;
if (existsSync(RUTA_ACT)) {
  ACT = JSON.parse(readFileSync(RUTA_ACT, 'utf8')).registros.filter(r => r.sistema === 'Sitio compai.cl').pop() || null;
  if (ACT) writeFileSync(RUTA_ACT_COPIA, JSON.stringify(ACT, null, 1) + '\n');
} else if (existsSync(RUTA_ACT_COPIA)) {
  ACT = JSON.parse(readFileSync(RUTA_ACT_COPIA, 'utf8'));
}
/* RADAR EN VIVO: `contenido/radar.json` lo deja `traer_radar.py` desde la
   salida de RAI-CA (intranet-referencia/datos/compra-agil.json). Sin el
   archivo, o con uno viejo, el panel cae a las 8 filas de EJEMPLO de
   sitio.json: la página no se cae por un radar que no corrió, y tampoco
   finge que el dato es de hoy (el sello dice EJEMPLO). */
const RADAR = existsSync(join(raiz, 'contenido/radar.json')) ? lee('contenido/radar.json') : null;
const DIAS_RADAR = 2;
const radarFresco = RADAR && Array.isArray(RADAR.filas) && RADAR.filas.length
  && (Date.now() - Date.parse(RADAR.generado || RADAR.fecha || 0)) / 864e5 <= DIAS_RADAR;

const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hoy = new Date(process.env.FECHA_SITIO || Date.now()).toISOString().slice(0, 10);

/* 13-10-2026: el lastmod del sitemap solo se mueve si el contenido REAL cambió
   respecto de lo commiteado (ver nota larga en la historia de este archivo). */
const INDEX_ANTES = existsSync(join(raiz, 'index.html')) ? readFileSync(join(raiz, 'index.html'), 'utf8') : null;
const PORT_ANTES = existsSync(join(raiz, 'portafolio.html')) ? readFileSync(join(raiz, 'portafolio.html'), 'utf8') : null;
const SITEMAP_ANTES = existsSync(join(raiz, 'sitemap.xml')) ? readFileSync(join(raiz, 'sitemap.xml'), 'utf8') : '';
const LASTMODS_ANTES = [...SITEMAP_ANTES.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(m => m[1]);

/* ── piezas ──────────────────────────────────────────────────────────── */
/* Aparición al primer scroll (Sebastián, 15-11-2026): `.rv` + data-rv marca lo
   que entra «bajando» (abajo) o «subiendo» (arriba); css/claro.css lo esconde
   solo si <html> lleva .js y js/claro.js lo muestra una vez a la vista.
   RV va dentro de class="…", RV_ATR va suelto en la etiqueta. */
const RV = { abajo: ' rv" data-rv="abajo', arriba: ' rv" data-rv="arriba' };
const RV_ATR = { abajo: ' class="rv" data-rv="abajo"', arriba: ' class="rv" data-rv="arriba"' };
const LINEAS = (clase = '') => `<div class="lineas${clase ? ' ' + clase : ''}" aria-hidden="true"><span></span><span></span><span></span><span></span></div>`;

// los 8 iconos de la barra: 6 secciones | herramienta, huella (lienzo v360)
const ICO = [
  '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>',
  '<path d="M12 7v11"/><path d="M12 9C10 5 4 4 3 7c-1 3 3 6 6 6-3 0-6 3-5 6 1 2 6 0 8-4"/><path d="M12 9c2-4 8-5 9-2 1 3-3 6-6 6 3 0 6 3 5 6-1 2-6 0-8-4"/>',
  '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><circle cx="12" cy="6" r="2.5"/><path d="M8 16.5l3-8M16 16.5l-3-8M8.5 18h7"/>',
  '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18"/>',
  '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
];
const ICO_HERR = '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>';
const ICO_HUELLA = '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01M21.8 16c.2-2 .131-5.354 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2M8.65 22c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2"/>';
const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ibar = (clase, base = '') => {
  const secs = S.menu.map((m, i) => `<a href="${base}${esc(m.ancla)}" aria-label="${esc(m.codigo)} ${esc(m.nombre)}" title="${esc(m.codigo)} ${esc(m.nombre)}">${svg(ICO[i])}</a>`).join('');
  const [herr, huella] = S.herramientas;
  // 15-11-2026: /soporte/ no existe todavia; el icono queda sin enlace, no se inventa la pagina
  const h1 = herr.url
    ? `<a href="${esc(herr.url)}" aria-label="${esc(herr.nombre)}" title="${esc(herr.nombre)}">${svg(ICO_HERR)}</a>`
    : `<span class="sin" role="img" aria-label="${esc(herr.nombre)}" title="${esc(herr.nombre)}">${svg(ICO_HERR)}</span>`;
  const h2 = `<a href="${esc(huella.url)}" aria-label="${esc(huella.nombre)}" title="${esc(huella.nombre)}">${svg(ICO_HUELLA)}</a>`;
  return `<nav class="ibar ${clase}" aria-label="Secciones">${secs}<i class="sep" aria-hidden="true"></i>${h1}${h2}</nav>`;
};

const MK_GO = '<svg class="mk go" viewBox="0 0 24 24" role="img" aria-label="GO"><path d="M2 13l4 4L13 9M9 13l4 4L22 9"/></svg>';
const MK_NOGO = '<svg class="mk nogo" viewBox="0 0 24 24" role="img" aria-label="NO-GO"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>';
const REL = '<svg class="rel" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>';
const SOUL_ICO = '<svg class="sl-ico" viewBox="0 0 100 100" aria-hidden="true"><path d="M8 50 A31 31 0 0 1 70 50 Z" fill="#5BA8D6"/><path d="M30 50 A31 31 0 0 0 92 50 Z" fill="#F4A574"/><circle cx="74" cy="24" r="9" fill="#FFD966"/></svg>';
const selloSoul = s => `<a class="sello-soul" href="${esc(s.url)}" aria-label="${esc(s.aria)}">${SOUL_ICO}<span class="sl-w">${esc(s.palabra)}</span><span class="sl-t">${esc(s.texto)}</span></a>`;

const video = (src, poster, extra = '') => `<video src="${esc(src)}" poster="${esc(poster)}" muted loop playsinline preload="none" data-auto
        disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"${extra}></video>`;

const pieBar = () => {
  const P = S.contacto_seccion.pie_marca;
  return `<div class="pie-bar">
  <span class="pie-izq"><img src="${esc(P.logo)}" alt="compAI" width="372" height="131"><span class="b2g">&nbsp; &nbsp;${esc(P.separador)} <b>${esc(P.negrita)}</b> ${esc(P.resto)}</span></span>
  <span class="pie-der"><span class="tpc">${esc(S.offenbar.titulo_1)}</span> <span class="eia">${esc(S.offenbar.titulo_2)}</span></span>
 </div>`;
};

/* ── / 01 Offenbar ───────────────────────────────────────────────────── */
const O = S.offenbar;
const offenbar = `
<section id="offenbar">
 <video id="heroVideo" class="hvid" src="${esc(O.video)}" poster="${esc(O.video_poster)}" muted loop playsinline autoplay preload="metadata" data-auto
        disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
 <div class="hvelo" aria-hidden="true"></div>
 <header class="hero-nav">
  <a class="logo" href="#offenbar" aria-label="compAI, inicio"><img src="media/logo-compai-noche.svg" alt="compAI" width="372" height="131"></a>
  ${ibar('ibar-hero')}
 </header>
 <div class="hero-grid">
  <p class="hero-l hero-l1${RV.abajo}">${O.rotulo_izq.map(esc).join('<br>')}</p>
  <p class="hero-l hero-l2${RV.abajo}">${O.rotulo_der.map(esc).join('<br>')}</p>
  <p class="hero-w${RV.abajo}">${O.wordmark.map(esc).join('<br>')}</p>
 </div>
 <div class="hero-foot"><span class="mono">${esc(O.codigo)} ${esc(O.nombre)}</span></div>
</section>

<section id="offenbar-2" class="of2">
 <div class="of2-in">
  <p class="of2-ficha"><a href="${esc(S.contacto.ficha)}" target="_blank" rel="noopener">${esc(O.enlace_texto)}</a></p>
  <h1 class="hero-t${RV.abajo}">${esc(O.titulo_1)}</h1>
  <p class="sub${RV.abajo}">${esc(O.titulo_2)}</p>
  <a class="pill pill-lleno${RV.arriba}" href="#inbox">${esc(O.boton)}</a>
 </div>
</section>
${ibar('ibar-dock')}`;

/* ── / 02 Il Cuore ───────────────────────────────────────────────────── */
const C = S.il_cuore;
const ilCuore = `
<section id="il-cuore" class="sec">
 <p class="kick">${esc(C.codigo)} ${esc(C.nombre)}</p>
 <figure class="fundido fundido-lados cuore-fig">${video(C.video, C.video_poster)}</figure>
 <div class="cuore-esp"></div>
 <div class="cuore-txt">
  <h2${RV_ATR.abajo}>${C.ia.titulo.map(esc).join('<br>')}</h2>
  <p>${esc(C.ia.parrafo)}</p>
  <div class="cuore-acc">${C.accesos.map(a => `<a class="pill${RV.arriba}" href="${esc(a.ancla)}">${esc(a.texto)}</a>`).join('\n   ')}</div>
 </div>
</section>`;

/* ── / 03 L'Intelligence ─────────────────────────────────────────────── */
const grace = (() => {
  const G = S.grace, L = G.lamina;
  const filas = radarFresco ? RADAR.filas : G.envivo.filas;
  // 12-10-2026, Sebastian: «actualizado <fecha>», no «barrido»: vocabulario del comprador
  const sello = radarFresco ? `actualizado ${RADAR.fecha}` : G.envivo.estado;
  const fila = f => { const no = /^NO/.test(f.marca); return `<li><span class="mkr">${no ? MK_NOGO : MK_GO}</span><span class="dt">
     <b class="nom">${esc(f.nombre)}</b>
     <span class="f2"><i class="lin">${esc(f.linea)}</i><span class="lnom">${esc(f.linea_nombre)}</span></span>
     <span class="f2"><i class="sc">${esc(f.score)}</i><span class="cod">${esc(f.codigo)} <button type="button" class="cp" data-id="${esc(f.codigo)}" title="${esc(G.envivo.copiar)}" aria-label="${esc(G.envivo.copiar)} ${esc(f.codigo)}">⧉</button></span><b class="monto">${esc(f.monto)}</b></span>
     <span class="org">${esc(f.organismo)}</span>
     <span class="f2"><span class="fec">${esc(f.fecha)}</span><span class="que"${f.cierre_iso ? ` data-cierre="${esc(f.cierre_iso)}"` : ''}>${REL}<span class="qt">${esc(f.quedan)}</span></span></span>
    </span></li>`; };
  const iconos = G.iconos.map(i => `<li><span class="ico${RV.abajo}">${i.svg}</span><b>${esc(i.n)}</b><span>${esc(i.d)}</span></li>`).join('');
  const pasos = G.procedimiento.map(x => `<li><b${RV_ATR.abajo}>${esc(x.n)}</b><strong>${esc(x.t)}</strong><span>${esc(x.d)}</span></li>`).join('');
  return `
<section id="grace">
 <div class="lam1">
  <p class="kick lam1-kick">${esc(G.codigo)} ${esc(G.nombre)}</p>
  <div class="lam1-cuadro">
   <figure class="fundido fundido-horiz lam1-fig">${video(L.video, L.video_poster)}</figure>
   <div class="lam1-over">
    <div class="lam1-txt">
     <h2${RV_ATR.abajo}>${L.titulo.map(esc).join('<br>')}</h2>
     <p>${esc(L.izquierda)}</p>
    </div>
    <ul class="gldcha">${L.derecha.map(d => `<li>${/^NO/.test(d.marca) ? MK_NOGO : MK_GO}<span>${esc(d.texto)}</span></li>`).join('')}</ul>
   </div>
  </div>
 </div>

 <div class="lam2">
  <figure class="fundido fundido-suave lam2-fig">${video(G.radar_video, G.radar_video_poster)}</figure>
  <div class="lam2-list">
   <div class="radar-cab"><p class="tit${RV.abajo}">${esc(G.envivo.titulo)}</p><span class="sello">${esc(sello)}</span></div>
   <ul class="glista">
    ${filas.map(fila).join('\n    ')}
   </ul>
   <p class="radar-pie">${esc(G.envivo.pie)}</p>
  </div>
  <div class="ante">
   <p class="kick">${esc(G.antecedentes_rotulo)}</p>
   <ul class="gicos">${iconos}</ul>
   <p class="kick k2">${esc(G.procedimiento_rotulo)}</p>
   <ol class="gpasos">${pasos}</ol>
  </div>
 </div>

 <div class="lam3">
  <figure class="lam3-fig">
   ${video(G.flor_video, G.flor_video_poster)}
   ${LINEAS('lineas-blancas')}
   <div class="lam3-velo" aria-hidden="true"></div>
   <div class="gcifras-sobre">${G.franja.map(f => `<div${RV_ATR.arriba}><b>${esc(f.cifra)}</b><span>${esc(f.glosa)}</span></div>`).join('')}</div>
  </figure>
  <p class="lam3-pie">${esc(G.pie)}</p>
 </div>
</section>`;
})();

/* ── / 04 Creative · las cinco líneas en las cinco columnas ──────────── */
const creative = `
<section id="creative">
 <div class="cre-kick"><p class="kick">${esc(S.creative.codigo)} ${esc(S.creative.nombre)}</p></div>
 <div class="serv5">
${LIN.map(l => `  <div class="serv">
   <span class="cod${RV.abajo}">${esc(l.codigo)}</span>
   <h3${RV_ATR.abajo}><a href="portafolio.html#${esc(l.codigo)}">${esc(l.titulo)}</a></h3>
   <p>${esc(l.descripcion)}</p>${l.soul ? `
   ${selloSoul(S.creative.soul_sello)}` : ''}
  </div>`).join('\n')}
 </div>
 <div class="cre-btn"><a class="btn${RV.arriba}" href="${esc(S.creative.llamado.url)}">${esc(S.creative.llamado.enlace)}</a></div>
</section>`;

/* ── / 05 Run · el formulario (mismo mecanismo: Apps Script + adjuntos) ── */
const I = S.inbox;
const inbox = `
<section id="inbox" class="sec">
 ${LINEAS('lineas-blancas lineas-sec')}
 <p class="kick">${esc(I.codigo)} ${esc(I.nombre)}</p>
 <div class="col2 run-col">
  <div class="run-txt">
   <h2${RV_ATR.abajo}>${esc(I.titulo_1)}<br>${esc(I.titulo_2)}</h2>
   <p>${esc(I.bajada)}</p>
  </div>
  <form class="run-form" id="formLead" novalidate>
   <div class="campo"><label for="f-nombre">${esc(I.campos.nombre)}</label><input id="f-nombre" name="nombre" type="text" autocomplete="name" placeholder="${esc(I.placeholders.nombre)}" required></div>
   <div class="campo"><label for="f-correo">${esc(I.campos.correo)}</label><input id="f-correo" name="correo" type="email" autocomplete="email" placeholder="${esc(I.placeholders.correo)}" required></div>
   <div class="campo"><label for="f-telefono">${esc(I.campos.telefono)}</label><input id="f-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder="${esc(I.placeholders.telefono)}"></div>
   <div class="campo"><label for="f-idmp">${esc(I.campos.idmp)}</label><input id="f-idmp" name="idmp" type="text" placeholder="${esc(I.placeholders.idmp)}"></div>
   <div class="campo"><label for="f-mensaje">${esc(I.campos.mensaje)}</label><textarea id="f-mensaje" name="mensaje" rows="4" placeholder="${esc(I.placeholders.mensaje)}" required></textarea></div>
   <div class="iadjunta">
    <input id="f-archivos" name="archivos" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.rtf,.txt,.jpg,.jpeg,.png,.webp,.zip">
    <label for="f-archivos"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M13.5 6.5 7.9 12a2.1 2.1 0 0 0 3 3l5.6-5.6a4 4 0 1 0-5.7-5.7L5 9.6a5.9 5.9 0 0 0 8.4 8.4l4.3-4.3"/></svg><b>${esc(I.adjunta.titulo)}</b><span>${esc(I.adjunta.nota)}</span></label>
    <ul class="ilista" id="f-lista" aria-live="polite"></ul>
   </div>
   <p class="trampa" aria-hidden="true"><label for="f-sitioweb">No llenar</label><input id="f-sitioweb" name="sitioweb" type="text" tabindex="-1" autocomplete="off"></p>
   <div class="enviar"><button type="submit" class="btn btn-lleno${RV.arriba}" id="formBtn">${esc(I.boton)}</button><span class="nota">${esc(I.nota)}</span></div>
   <p class="aviso" id="formAviso" role="status" aria-live="polite" hidden></p>
  </form>
 </div>
</section>`;

/* ── / 06 Inbox · el pie ─────────────────────────────────────────────── */
const K = S.contacto_seccion;
const contacto = `
<footer id="contacto" class="sec">
 <p class="kick">${esc(K.codigo)} ${esc(K.nombre)}</p>
 <div class="col2 pie-col">
  <a class="pie-mail${RV.arriba}" href="mailto:${esc(S.contacto.correo)}">${esc(S.contacto.correo)}</a>
  <div class="pie-dat">${esc(S.contacto.razon_social)}<br>RUT ${esc(S.contacto.rut)}<br>${esc(S.contacto.lugar)}</div>
 </div>
 <p class="kick k-ag">${esc(K.agentes_rotulo)}</p>
 <ul class="agentes">
${K.agentes.map(([n, d]) => `  <li><b>${esc(n)}</b><span>${esc(d)}</span></li>`).join('\n')}
 </ul>
 ${pieBar()}
</footer>`;

/* ── el documento ────────────────────────────────────────────────────── */
const datos = { sitio: { formEndpoint: S.formEndpoint, inbox: { exito: I.exito, error: I.error, boton: I.boton } } };

const cabeza = (titulo, descripcion, url, extra = '') => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="${esc(S.meta.theme_color)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CL">
<meta property="og:site_name" content="compAI">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(S.meta.og_image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(S.meta.og_image_alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" as="font" type="font/woff2" href="css/fuentes/spacegrotesk-var-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="css/fuentes/plexmono-400-latin.woff2" crossorigin>
${extra}<link rel="stylesheet" href="css/claro.css">`;

const html = `<!doctype html>
<!-- compai.cl · armado por sitio/compai/construir.mjs desde contenido/*.json.
     fuente-del-sitio: sitio/compai
     No editar este archivo a mano: el siguiente build lo pisa. -->
${ACT ? `<!-- ${ACT.sistema} · Actualización N.º ${ACT.n} · ${ACT.fecha} -->\n` : ''}<html lang="${esc(S.meta.lang)}">
<head>
<script>document.documentElement.className+=' js'</script>
${cabeza(S.meta.title, S.meta.description, S.meta.url, `<link rel="preload" as="image" href="${esc(O.video_poster)}" fetchpriority="high">\n`)}
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ProfessionalService',
  name: 'compAI', legalName: S.contacto.razon_social, taxID: S.contacto.rut,
  url: S.meta.url, image: S.meta.og_image, email: S.contacto.correo,
  description: S.meta.description,
  address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
  areaServed: 'CL', sameAs: [S.contacto.ficha],
  makesOffer: LIN.map(l => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: `${l.codigo} · ${l.titulo}`, description: l.descripcion } }))
})}</script>
</head>
<body>
<a class="salto" href="#offenbar-2">Saltar al contenido</a>
<div class="pg">
${LINEAS()}
<main>
${offenbar}
${ilCuore}
${grace}
${creative}
${inbox}
</main>
${contacto}
</div>
<script>window.COMPAI=${JSON.stringify(datos).replace(/</g, '\\u003c')};</script>
<script src="js/claro.js" defer></script>
</body>
</html>
`;
writeFileSync(join(raiz, 'index.html'), html, 'utf8');

/* ── 404 ─────────────────────────────────────────────────────────────── */
const c404 = `<!doctype html>
<!-- compai.cl · armado por sitio/compai/construir.mjs. fuente-del-sitio: sitio/compai -->
<html lang="${esc(S.meta.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Esta página no existe · compAI</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="${esc(S.meta.theme_color)}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/css/claro.css">
</head>
<body>
<div class="pg">
${LINEAS()}
<main class="e404">
 <div>
  <img class="lg" src="/media/logo-compai-mono.svg" alt="compAI" width="372" height="131">
  <p class="cod">404</p>
  <h1>Esta página no existe.</h1>
  <p>Puede que el enlace esté viejo. Lo que sí está: el sitio, el portafolio y una casilla que alguien lee.</p>
  <div class="vol">
   <a class="btn" href="/">Volver al inicio</a>
   <a class="btn" href="/portafolio.html">Portafolio</a>
   <a class="btn" href="mailto:${esc(S.contacto.correo)}">${esc(S.contacto.correo)}</a>
  </div>
 </div>
</main>
</div>
</body>
</html>
`;
writeFileSync(join(raiz, '404.html'), c404, 'utf8');

const cambioHome = INDEX_ANTES !== html;
const lastmodHome = (!cambioHome && LASTMODS_ANTES[0]) ? LASTMODS_ANTES[0] : hoy;

writeFileSync(join(raiz, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /estado/\n\nSitemap: https://compai.cl/sitemap.xml\n`, 'utf8');

/* ── soul/ · compai.cl/soul (26-10-2026): solo su config.js sale de acá ── */
const SOUL_DIR = join(raiz, 'soul');
if (existsSync(SOUL_DIR)) {
  const wa = String((S.creative && S.creative.whatsapp_pyme) || 'https://wa.me/56962469977').replace(/\D/g, '');
  writeFileSync(join(SOUL_DIR, 'config.js'),
    `/* LO ESCRIBE construir.mjs desde contenido/sitio.json — NO SE EDITA A MANO. */\nwindow.SOUL_CFG = ${JSON.stringify({ endpoint: S.formEndpoint || '', whatsapp: wa })};\n`, 'utf8');
  console.log(`soul/config.js · endpoint ${S.formEndpoint ? 'configurado' : 'VACIO (las preguntas ofreceran WhatsApp)'}`);
}

const kb = n => Math.round(n / 102.4) / 10;
console.log(`index.html  ${kb(Buffer.byteLength(html))} KB · ${LIN.length} líneas · radar ${radarFresco ? `en vivo (${RADAR.fecha})` : 'EJEMPLO'} · formEndpoint ${S.formEndpoint ? 'configurado' : 'VACÍO (mailto de respaldo)'}`);
if (!existsSync(join(raiz, 'media/og.jpg'))) console.warn('AVISO: falta media/og.jpg (Open Graph 1200×630)');

/* ── portafolio.html · el catálogo carrusel (vista A, elegida por Sebastián el 15-11-2026) ──
   Cinco tarjetas con scroll-snap, flechas, puntos y el detalle de sub-servicios
   de la línea elegida. La escena de cada tarjeta es el video del catálogo vivo
   (contenido/escenas.json): L1 ← escena 04, L2 ← 02, L3 ← 03, L4 ← 01, L5 ← 05
   más las muestras SOUL. Reemplaza al portafolio con formularios y precios del
   05-10-2026, que queda en sitio/_archivo/oscuro-2026-11-14/. */
const CAT = S.catalogo;
const escena = id => ESC.escenas.find(e => e.id === id) || {};
const tarjeta = (l, i) => { const e = escena(l.escena); return `   <label class="card" for="t${i + 1}" id="card-${i + 1}" data-i="${i + 1}" data-escena="${esc(l.escena)}">
    <video src="${esc(e.video)}" poster="${esc(e.poster)}" muted loop playsinline preload="none" disablepictureinpicture controlslist="nodownload noplaybackrate" aria-label="${esc(e.titulo || e.carrete || l.titulo)}"></video>
    <span class="card-v"></span>
    <span class="card-t"><i class="cat-cod">${esc(l.codigo)}</i><b>${esc(l.titulo)}</b><small>${esc(l.descripcion)}</small></span>
   </label>`; };
const detalle = (l, i) => `   <div class="det d${i + 1}" id="${esc(l.codigo)}">
    <div class="det-l"><i class="cat-cod">${esc(l.codigo)}</i><h2>${esc(l.titulo)}</h2><p>${esc(l.descripcion)}</p></div>
    <ul class="cat-subs">
${l.subservicios.map(s => `     <li><b>${esc(s.nombre)}</b><span>${esc(s.detalle)}</span></li>`).join('\n')}
    </ul>${l.muestras ? `
    <div class="cat-muestras">
     <p class="kick">${esc(l.muestras.titulo)}</p>
${l.muestras.items.map(m => `     <figure><a href="${esc(m.url)}"><img src="${esc(m.img)}" alt="${esc(m.alt)}" width="640" height="400" loading="lazy" decoding="async"></a></figure>`).join('\n')}
    </div>` : ''}${l.soul ? `
    <p class="det-soul">${selloSoul(S.creative.soul_sello)}</p>` : ''}
   </div>`;
const portafolio = `<!doctype html>
<!-- compai.cl · catálogo, armado por sitio/compai/construir.mjs desde contenido/lineas.json + escenas.json.
     fuente-del-sitio: sitio/compai
     No editar este archivo a mano: el siguiente build lo pisa. -->
${ACT ? `<!-- ${ACT.sistema} · Actualización N.º ${ACT.n} · ${ACT.fecha} -->\n` : ''}<html lang="${esc(S.meta.lang)}">
<head>
${cabeza(CAT.title, CAT.description, 'https://compai.cl/portafolio.html')}
</head>
<body>
<a class="salto" href="#servicios">Saltar al contenido</a>
<div class="pg">
${LINEAS()}
 <header class="cat-head">
  <a class="logo" href="/" aria-label="compAI, inicio"><img src="media/logo-compai-dia.svg" alt="compAI" width="372" height="131"></a>
  ${ibar('ibar-cat', '/')}
 </header>
 <main id="servicios">
 <div class="cat-top">
  <p class="kick">${esc(CAT.kicker)}</p>
  <h1>${CAT.titulo.map(esc).join('<br>')}</h1>
  <div class="nav"><button type="button" class="arr" id="prev" aria-label="${esc(CAT.anterior)}"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="arr" id="next" aria-label="${esc(CAT.siguiente)}"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>
 </div>
 <div class="cat-wrap">
${LIN.map((l, i) => `<input type="radio" name="cat" id="t${i + 1}" class="cat-r"${i === 0 ? ' checked' : ''} aria-label="${esc(l.codigo)}">`).join('\n')}
  <div class="rail" id="rail">
${LIN.map(tarjeta).join('\n')}
  </div>
  <div class="dots">${LIN.map((l, i) => `<label class="dot" for="t${i + 1}" data-i="${i + 1}" aria-label="${esc(l.codigo)}"></label>`).join('')}</div>
  <div class="dets">
${LIN.map(detalle).join('\n')}
  </div>
 </div>
 </main>
 <div class="cat-pie">
 ${pieBar()}
 </div>
</div>
<script src="js/claro.js" defer></script>
</body>
</html>
`;
writeFileSync(join(raiz, 'portafolio.html'), portafolio, 'utf8');
const lastmodPort = (PORT_ANTES === portafolio && LASTMODS_ANTES[1]) ? LASTMODS_ANTES[1] : hoy;
console.log(`portafolio.html · ${LIN.length} líneas · ${LIN.reduce((a, l) => a + l.subservicios.length, 0)} sub-servicios`);

/* ── apps-script/Code.gs · precios de la cotización en PDF ───────────────
   Salen de contenido/escenas.json (SP-01..SP-09 y SOUL): el servidor no confía
   en los que manda el navegador. apps-script/ NO viaja al repo público (ver
   publicar.py, VIAJAN) y se despliega a mano; por eso la guarda existsSync. */
{
  const GS = join(raiz, 'apps-script/Code.gs');
  if (existsSync(GS)) {
    const PRE = {};
    for (const e of [...ESC.escenas].reverse()) for (const g of e.grupos || []) for (const it of g.items || []) {
      const s = it.sp && ESC.servicios[it.sp]; if (!s || PRE[it.sp]) continue;
      PRE[it.sp] = { nombre: it.nombre, detalle: it.detalle || '', bruto: Number(String(s.bruto).replace(/[^0-9]/g, '')), cond: s.cond };
      if (s.anual) PRE[it.sp].anual = Number(String(s.anual).replace(/[^0-9]/g, ''));
    }
    const gs = readFileSync(GS, 'utf8');
    const reP = /\/\/ PRECIOS:INICIO[\s\S]*?\/\/ PRECIOS:FIN/;
    if (reP.test(gs)) {
      const nuevo = gs.replace(reP, () => `// PRECIOS:INICIO\nvar PRECIOS = ${JSON.stringify(PRE, null, 1)};\n// PRECIOS:FIN`);
      if (nuevo !== gs) writeFileSync(GS, nuevo, 'utf8');
      console.log(`apps-script/Code.gs · ${Object.keys(PRE).length} precios para la cotizacion en PDF`);
    }
  }
}

/* ── sitemap: al final, con los lastmod ya resueltos ─────────────────── */
const lastmodSoul = (SITEMAP_ANTES.match(/<loc>https:\/\/compai\.cl\/soul\/<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/) || [])[1] || hoy;
const lastmodEj = (SITEMAP_ANTES.match(/<loc>https:\/\/compai\.cl\/soul\/ejemplo\/<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/) || [])[1] || hoy;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${S.meta.url}</loc><lastmod>${lastmodHome}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>https://compai.cl/portafolio.html</loc><lastmod>${lastmodPort}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
${existsSync(join(raiz, 'soul/index.html')) ? `  <url><loc>https://compai.cl/soul/</loc><lastmod>${lastmodSoul}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n` : ''}${existsSync(join(raiz, 'soul/ejemplo/index.html')) ? `  <url><loc>https://compai.cl/soul/ejemplo/</loc><lastmod>${lastmodEj}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n` : ''}</urlset>
`;
writeFileSync(join(raiz, 'sitemap.xml'), sitemap, 'utf8');
