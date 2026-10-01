/* compai.cl · armador del sitio.
   Lee contenido/sitio.json + contenido/servicios.json y escribe index.html,
   sitemap.xml y robots.txt. Cambiar un texto = editar el JSON y volver a correr:
       node construir.mjs
   El workflow .github/workflows/sitio-compai.yml lo corre solo en cada push. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const lee = f => JSON.parse(readFileSync(join(raiz, f), 'utf8'));

const S = lee('contenido/sitio.json');
const SERV = lee('contenido/servicios.json');
const LOGO = readFileSync(join(raiz, 'media/logo-compai.svg'), 'utf8')
  .replace(/<\?xml[^>]*\?>\s*/, '').trim();

const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hoy = (process.env.FECHA_SITIO || new Date().toISOString()).slice(0, 10);

/* ── el isotipo: el doble check de la marca, suelto y en neón ─────────── */
const TICKS = (clase, etiqueta) => `<svg class="${clase}" viewBox="0 0 22 20" role="img" aria-label="${etiqueta}">
      <title>${etiqueta}</title>
      <path d="M2.56 7.37 4.86 9.68 9.83 3.64"/><path d="M1 8.5 5 12.5 12 4"/><path d="M.22 10.41 5.14 15.32 12.26 6.67"/>
      <path d="M11.56 7.37 13.86 9.68 18.83 3.64"/><path d="M10 8.5 14 12.5 21 4"/><path d="M9.22 10.41 14.14 15.32 21.26 6.67"/>
    </svg>`;

/* ── la mariposa: dibujada, no tomada de ninguna parte ───────────────── */
const MARIPOSA = `<svg class="mariposa" viewBox="0 0 400 310" role="img" aria-label="Mariposa">
      <title>Mariposa</title>
      <defs>
        <linearGradient id="alaSup" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stop-color="#2BE6F5"/><stop offset=".42" stop-color="#1F9CC4"/>
          <stop offset="1" stop-color="#0C3A4E"/>
        </linearGradient>
        <linearGradient id="alaInf" x1=".2" y1="0" x2=".8" y2="1">
          <stop offset="0" stop-color="#1A8DB6"/><stop offset="1" stop-color="#07222E"/>
        </linearGradient>
        <radialGradient id="brilloAla" cx=".22" cy=".22" r=".6">
          <stop offset="0" stop-color="#8FF4FF" stop-opacity=".95"/><stop offset="1" stop-color="#8FF4FF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g class="ala i">
        <path d="M199 141 L68 46 C40 42 20 72 29 108 C38 146 86 170 130 174 C158 176 186 154 199 148 Z" fill="url(#alaSup)" stroke="#0A2F3E" stroke-width="2"/>
        <path d="M199 141 L68 46 C40 42 20 72 29 108 Z" fill="url(#brilloAla)"/>
        <path d="M197 157 L92 236 C72 258 82 284 110 287 C142 290 174 260 186 228 C194 206 197 176 197 157 Z" fill="url(#alaInf)" stroke="#0A2F3E" stroke-width="2"/>
        <g fill="#EFF9FF">
          <ellipse cx="134" cy="120" rx="9" ry="13" transform="rotate(-18 134 120)"/>
          <ellipse cx="152" cy="140" rx="7" ry="11" transform="rotate(-16 152 140)"/>
          <ellipse cx="166" cy="162" rx="6" ry="10" transform="rotate(-12 166 162)"/>
          <ellipse cx="172" cy="186" rx="6" ry="11" transform="rotate(-8 172 186)"/>
          <ellipse cx="174" cy="210" rx="5" ry="10"/>
        </g>
        <g fill="#C87941" opacity=".85">
          <rect x="146" y="106" width="7" height="13" rx="2" transform="rotate(-20 146 106)"/>
          <rect x="157" y="112" width="6" height="12" rx="2" transform="rotate(-20 157 112)"/>
        </g>
      </g>
      <g class="ala d">
        <path d="M201 141 L332 46 C360 42 380 72 371 108 C362 146 314 170 270 174 C242 176 214 154 201 148 Z" fill="url(#alaSup)" stroke="#0A2F3E" stroke-width="2"/>
        <path d="M201 141 L332 46 C360 42 380 72 371 108 Z" fill="url(#brilloAla)"/>
        <path d="M203 157 L308 236 C328 258 318 284 290 287 C258 290 226 260 214 228 C206 206 203 176 203 157 Z" fill="url(#alaInf)" stroke="#0A2F3E" stroke-width="2"/>
        <g fill="#EFF9FF">
          <ellipse cx="266" cy="120" rx="9" ry="13" transform="rotate(18 266 120)"/>
          <ellipse cx="248" cy="140" rx="7" ry="11" transform="rotate(16 248 140)"/>
          <ellipse cx="234" cy="162" rx="6" ry="10" transform="rotate(12 234 162)"/>
          <ellipse cx="228" cy="186" rx="6" ry="11" transform="rotate(8 228 186)"/>
          <ellipse cx="226" cy="210" rx="5" ry="10"/>
        </g>
        <g fill="#C87941" opacity=".85">
          <rect x="247" y="106" width="7" height="13" rx="2" transform="rotate(20 247 106)"/>
          <rect x="236" y="112" width="6" height="12" rx="2" transform="rotate(20 236 112)"/>
        </g>
      </g>
      <g stroke="#BFE6F5" stroke-width="2.2" fill="none" stroke-linecap="round">
        <path d="M197 118c-8-20-22-32-38-37"/><path d="M203 118c8-20 22-32 38-37"/>
      </g>
      <ellipse cx="200" cy="176" rx="7" ry="62" fill="#0B2A38" stroke="#7FC4DF" stroke-width="1.4"/>
      <circle cx="200" cy="118" r="9" fill="#0B2A38" stroke="#7FC4DF" stroke-width="1.4"/>
    </svg>`;

/* ── las secciones ───────────────────────────────────────────────────── */
const heroFranjas = `
  <section class="hero" id="hero" aria-label="compAI">
    <div class="muro">
      <video id="heroVideo" src="media/hero-franjas.mp4" poster="media/hero-franjas.webp"
             muted loop playsinline autoplay preload="metadata"
             disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
    </div>
    <div class="sello" role="img" aria-label="compAI">
      <svg viewBox="1 3 22 15" aria-hidden="true"><path d="M2.5 12.5l4 4 7-9"/><path d="M11 14.5l2 2 8.5-10"/></svg>
      <span class="w">comp<b>AI</b></span>
    </div>
    <a class="baja mono" href="#offenbar"><span>Bajar</span><i aria-hidden="true"></i></a>
  </section>`;

const heroNucleo = `
  <section class="hero hero-nucleo" id="hero" aria-label="compAI">
    <div class="nucleo" aria-hidden="true">
      <video id="heroVideo" src="media/hero-nucleo.mp4" poster="media/hero-nucleo.webp"
             muted loop playsinline autoplay preload="metadata"
             disablepictureinpicture controlslist="nodownload noplaybackrate"></video>
    </div>
    <a class="baja mono" href="#offenbar"><span>Bajar</span><i aria-hidden="true"></i></a>
  </section>`;

const menu = `
  <nav class="menu" id="menu" aria-label="Menú principal" aria-hidden="true">
    <ol>
      ${S.menu.map(m => `<li><a class="it" href="${esc(m.ancla)}"><span class="c mono">${esc(m.codigo)} — ${esc(m.nombre)}</span><b>${esc(m.titulo)}</b></a></li>`).join('\n      ')}
    </ol>
    <aside>
      <div><p class="mono">${esc(S.menu_aside.kicker)}</p><p class="big"><a href="mailto:${esc(S.contacto.correo)}">${esc(S.contacto.correo)}</a></p></div>
      <div class="pags">
        <span class="mono">Páginas</span>
        ${S.menu_aside.enlaces.map(e => `<a href="${esc(e.url)}"${e.url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(e.texto)}</a>`).join('\n        ')}
      </div>
      <div><p class="big">${esc(S.contacto.ciudad)}</p><p class="mono">${esc(S.contacto.lugar)}</p></div>
    </aside>
  </nav>`;

const offenbar = `
  <section class="sec" id="offenbar">
    <div class="circuitos" aria-hidden="true"></div>
    <div class="ancho offen">
      <div>
        <p class="kick mono">${esc(S.offenbar.codigo)} — <b>${esc(S.offenbar.nombre)}</b></p>
        <h1 class="ofit" id="ofit" data-l1="${esc(S.offenbar.titulo_1)}" data-l2="${esc(S.offenbar.titulo_2)}"><span>${esc(S.offenbar.titulo_1)}</span><br><span class="l2">${esc(S.offenbar.titulo_2)}</span></h1>
        <a class="enl" href="${esc(S.contacto.ficha)}" target="_blank" rel="noopener">${esc(S.offenbar.enlace_texto)}</a>
      </div>
      <canvas id="lluvia" aria-hidden="true"></canvas>
    </div>
  </section>`;

const ilCuore = `
  <section class="sec ap" id="il-cuore">
    <div class="ancho">
      <p class="kick mono" style="justify-content:center">${esc(S.il_cuore.codigo)} — <b>${esc(S.il_cuore.nombre)}</b></p>
      ${MARIPOSA}
      <h2 class="manif">${S.il_cuore.manifiesto.map(l => `<span>${esc(l)}</span>`).join('')}</h2>
      <p class="sub">${esc(S.il_cuore.parrafo)}</p>
      <div class="accesos">
        ${S.il_cuore.accesos.map((a, i) => `<a href="${esc(a.ancla)}"><span class="ic" aria-hidden="true">${i === 0
          ? '<svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 3.2V11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4.4a1 1 0 0 0-1-1H8L6.4 1.4A1 1 0 0 0 5.7 1H2a1 1 0 0 0-1 1z"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="5.6" r="2.7"/><path d="M2.6 14c.5-3 2.7-4.6 5.4-4.6S12.9 11 13.4 14"/></svg>'}</span><span>${esc(a.texto)}</span></a>`).join('\n        ')}
      </div>
      ${TICKS('isotipo', 'compAI')}
    </div>
  </section>`;

const grace = `
  <section class="sec ap" id="grace">
    <canvas id="numeros" aria-hidden="true"></canvas>
    <div class="ancho">
      <p class="kick mono">${esc(S.grace.codigo)} — <b>${esc(S.grace.nombre)}</b></p>
      <h2 class="t">${esc(S.grace.titulo)}</h2>
      <p class="sub">${esc(S.grace.linea)}</p>
      <div class="gracelist">
        ${S.grace.imagenes.map(g => `<figure class="gfig">
          <canvas class="gcanvas" data-src="${esc(g.src)}" role="img" aria-label="${esc(g.alt)}"></canvas>
          <noscript><img src="${esc(g.src)}" alt="${esc(g.alt)}" class="gcanvas" loading="lazy" decoding="async"></noscript>
          <figcaption>${esc(g.leyenda.split(' · ')[0])} · <b>${esc(S.grace.pie)}</b></figcaption>
        </figure>`).join('\n        ')}
      </div>
    </div>
  </section>`;

const creative = `
  <section class="sec ap" id="creative">
    <div class="circuitos" aria-hidden="true"></div>
    <div class="ancho">
      <p class="kick mono">${esc(S.creative.codigo)} — <b>${esc(S.creative.nombre)}</b></p>
      <h2 class="t">${esc(S.creative.titulo)}</h2>
      <p class="sub">${esc(S.creative.bajada)}</p>
      <div class="servs">
        ${SERV.map(s => `<button class="serv" type="button" data-slug="${esc(s.slug)}" aria-haspopup="dialog">
          <span class="num">/ ${esc(s.codigo)}</span>
          <span><span class="tit">${esc(s.titulo)}</span><span class="baj">${esc(s.bajada)}</span></span>
          <span class="der"><span class="et">${esc(s.etiqueta)}</span><span class="fl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 11 11 3M5 3h6v6"/></svg></span></span>
        </button>`).join('\n        ')}
      </div>
      <p class="etiquetas">${S.creative.etiquetas.map(e => `<span>${esc(e)}</span>`).join('')}</p>
    </div>
  </section>`;

const inbox = `
  <section class="sec ap" id="inbox">
    <div class="ancho">
      <p class="kick mono">${esc(S.inbox.codigo)} — <b>${esc(S.inbox.nombre)}</b></p>
      <h2 class="t">${esc(S.inbox.titulo)}</h2>
      <p class="sub">${esc(S.inbox.bajada)}</p>
      <div class="caja">
        <form id="formLead" novalidate>
          <div class="campos">
            <p class="campo"><label for="f-nombre">${esc(S.inbox.campos.nombre)}</label><input id="f-nombre" name="nombre" type="text" autocomplete="name" required></p>
            <p class="campo"><label for="f-correo">${esc(S.inbox.campos.correo)}</label><input id="f-correo" name="correo" type="email" autocomplete="email" required></p>
            <p class="campo"><label for="f-telefono">${esc(S.inbox.campos.telefono)}</label><input id="f-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel"></p>
            <p class="campo"><label for="f-organismo">${esc(S.inbox.campos.organismo)}</label><input id="f-organismo" name="organismo" type="text" autocomplete="organization"></p>
            <p class="campo ancho2"><label for="f-mensaje">${esc(S.inbox.campos.mensaje)}</label><textarea id="f-mensaje" name="mensaje" rows="4"></textarea></p>
          </div>
          <p class="trampa" aria-hidden="true"><label for="f-sitioweb">No llenar</label><input id="f-sitioweb" name="sitioweb" type="text" tabindex="-1" autocomplete="off"></p>
          <div class="enviar">
            <button class="btn" id="formBtn" type="submit">${esc(S.inbox.boton)}</button>
            <span class="mono" style="color:var(--crema2);text-transform:none;letter-spacing:0">${esc(S.inbox.nota)}</span>
          </div>
          <p class="aviso" id="formAviso" role="status" aria-live="polite" hidden></p>
        </form>
      </div>
    </div>
  </section>`;

const contacto = `
  <section class="sec ap" id="contacto">
    <img class="colibries" src="media/picaflor.webp" alt="" width="900" height="900" loading="lazy" decoding="async">
    <div class="ancho">
      <p class="kick mono" style="justify-content:center">${esc(S.contacto_seccion.codigo)} — <b>${esc(S.contacto_seccion.nombre)}</b></p>
      <p class="scl">${esc(S.contacto.ciudad)}</p>
      <p class="lugar">${esc(S.contacto.lugar)}</p>
      <div class="contactos">
        <a class="cbtn" href="mailto:${esc(S.contacto.correo)}">${esc(S.contacto.correo)}</a>
        ${S.contacto.whatsapp ? `<a class="cbtn" href="${esc(S.contacto.whatsapp)}" target="_blank" rel="noopener">WhatsApp ${esc(S.contacto.whatsapp_texto)}</a>` : ''}
      </div>
      <a class="compuerta" href="${esc(S.contacto.intranet)}" target="_blank" rel="noopener"
         aria-label="${esc(S.contacto_seccion.intranet_texto)} — acceso del equipo">
        <img src="media/compuerta.webp" alt="" width="760" height="836" loading="lazy" decoding="async">
        <span class="luz" aria-hidden="true"></span>
        <span class="et mono">${esc(S.contacto_seccion.intranet_texto)}</span>
      </a>

      <div class="pie">
        <span>${esc(S.contacto.razon_social)} · RUT ${esc(S.contacto.rut)}</span>
        <span><a href="${esc(S.contacto.ficha)}" target="_blank" rel="noopener">Ficha proveedores del Estado</a> · <a href="/portafolio.html">Portafolio</a></span>
      </div>
    </div>
  </section>`;

/* ── el documento ────────────────────────────────────────────────────── */
const datos = {
  servicios: SERV,
  sitio: { formEndpoint: S.formEndpoint, inbox: { exito: S.inbox.exito, error: S.inbox.error, boton: S.inbox.boton } }
};

const html = `<!doctype html>
<!-- compai.cl · armado por sitio/compai/construir.mjs desde contenido/*.json.
     fuente-del-sitio: sitio/compai
     No editar este archivo a mano: el siguiente build lo pisa. -->
<html lang="${esc(S.meta.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(S.meta.title)}</title>
<meta name="description" content="${esc(S.meta.description)}">
<link rel="canonical" href="${esc(S.meta.url)}">
<meta name="theme-color" content="#0B0806">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CL">
<meta property="og:site_name" content="compAI">
<meta property="og:title" content="${esc(S.meta.title)}">
<meta property="og:description" content="${esc(S.meta.description)}">
<meta property="og:url" content="${esc(S.meta.url)}">
<meta property="og:image" content="${esc(S.meta.og_image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(S.meta.og_image_alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="preload" as="font" type="font/woff2" href="css/fuentes/archivo-var-latin.woff2" crossorigin>
<link rel="preload" as="image" href="media/hero-franjas.webp" fetchpriority="high">
<link rel="stylesheet" href="css/sitio.css">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ProfessionalService',
  name: 'compAI', legalName: S.contacto.razon_social, taxID: S.contacto.rut,
  url: S.meta.url, image: S.meta.og_image, email: S.contacto.correo,
  description: S.meta.description,
  address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
  areaServed: 'CL', sameAs: [S.contacto.ficha],
  makesOffer: SERV.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.titulo, description: s.bajada } }))
})}</script>
</head>
<body>
<a class="salto" href="#offenbar">Saltar al contenido</a>

<header class="bar">
  <a class="logo-link" href="#hero" aria-label="compAI, inicio">${LOGO}</a>
  <button class="nodo" id="nodoBtn" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu">
    <span class="lbl mono" id="nodoLbl">Menú</span>
    <canvas id="nodoCv" width="128" height="128" aria-hidden="true"></canvas>
  </button>
</header>
${menu}
<main>
${S.hero === 'nucleo' ? heroNucleo : heroFranjas}
${offenbar}
${ilCuore}
${grace}
${creative}
${inbox}
${contacto}
</main>

<div class="lamina" id="lamina" role="dialog" aria-modal="true" aria-labelledby="lamTit" aria-hidden="true">
  <div class="lam-top">
    <span id="lamCod"></span>
    <button class="lam-x" id="lamX" type="button" aria-label="Cerrar">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l10 10M13 3L3 13"/></svg>
    </button>
  </div>
  <div class="lam-cuerpo">
    <p class="lam-et" id="lamEt"></p>
    <h2 id="lamTit"></h2>
    <p class="lam-baj" id="lamBaj"></p>
    <div class="lam-grid">
      <div id="lamTexto"></div>
      <ul class="lam-vin" id="lamVin"></ul>
    </div>
    <figure class="lam-img" hidden><img id="lamImg" src="" alt="" loading="lazy" decoding="async"></figure>
    <a class="lam-cta" id="lamCta" href="#inbox" onclick="document.getElementById('lamX').click()">Cotizar</a>
    <p class="lam-pie">${S.creative.etiquetas.map(e => esc(e)).join(' &nbsp;·&nbsp; ')}</p>
  </div>
</div>

<script>window.COMPAI=${JSON.stringify(datos).replace(/</g, '\\u003c')};</script>
<script src="js/sitio.js" defer></script>
<script src="js/materializa.js" defer></script>
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
<meta name="theme-color" content="#0B0806">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/sitio.css">
<style>
body{display:grid;place-items:center;min-height:100svh;padding:clamp(24px,6vw,64px);text-align:center}
.e404 .cod{font-family:var(--mono);font-size:clamp(72px,20vw,180px);line-height:.9;color:var(--brasa);margin:0}
.e404 h1{font-family:var(--display);font-variation-settings:"wdth" 110;font-weight:700;
  font-size:clamp(24px,4.4vw,44px);margin:18px 0 0;letter-spacing:-.02em}
.e404 p{color:var(--crema2);margin:14px auto 0;max-width:46ch}
.e404 .vol{margin-top:34px}
.e404 .lg{width:min(220px,60vw);margin:0 auto 26px;display:block}
</style>
</head>
<body>
<main class="e404">
  <span class="lg">${LOGO.replace('class="logo-svg"', 'class="logo-svg" style="height:auto;width:100%;margin:0"')}</span>
  <p class="cod">404</p>
  <h1>Esta página no existe.</h1>
  <p>Puede que el enlace esté viejo. Lo que sí está: el sitio, el portafolio y una casilla que alguien lee.</p>
  <div class="contactos vol">
    <a class="cbtn" href="/">Volver al inicio</a>
    <a class="cbtn" href="/portafolio.html">Portafolio</a>
    <a class="cbtn" href="mailto:${esc(S.contacto.correo)}">${esc(S.contacto.correo)}</a>
  </div>
</main>
</body>
</html>
`;
writeFileSync(join(raiz, '404.html'), c404, 'utf8');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${S.meta.url}</loc><lastmod>${hoy}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>https://compai.cl/portafolio.html</loc><lastmod>${hoy}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
</urlset>
`;
writeFileSync(join(raiz, 'sitemap.xml'), sitemap, 'utf8');

writeFileSync(join(raiz, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /estado/\n\nSitemap: https://compai.cl/sitemap.xml\n`, 'utf8');

const kb = n => Math.round(n / 102.4) / 10;
console.log(`index.html  ${kb(Buffer.byteLength(html))} KB · ${SERV.length} servicios · hero "${S.hero}" · formEndpoint ${S.formEndpoint ? 'configurado' : 'VACÍO (mailto de respaldo)'}`);
if (!existsSync(join(raiz, 'media/og.jpg'))) console.warn('AVISO: falta media/og.jpg (Open Graph 1200×630)');
