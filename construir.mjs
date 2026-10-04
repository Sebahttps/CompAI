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

/* ── las secciones · maqueta exacta del Canva (kit-canva/PLANO-CANVA.md) ──
   Lienzo 1366 px. Cada elemento lleva --x/--y/--w/--hh en px del lienzo y la
   hoja css/canva.css los convierte con --u. No se interpreta ninguna medida. */

const heroFranjas = `
  <section class="hero cv" id="hero" aria-label="compAI">
    <div class="pg" style="--h:1256">
      <div class="b fh hfranjas" style="--x:0;--y:0;--w:1366;--hh:627">
        <video id="heroVideo" src="media/hero-franjas.mp4" poster="media/hero-franjas.webp"
               muted loop playsinline autoplay preload="metadata"
               disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
      </div>
      <div class="b fh harco" style="--x:-139;--y:549;--w:1633;--hh:158" aria-hidden="true"></div>
      <div class="b hsello" style="--x:518;--y:524;--w:330">
        <img src="${esc(S.hero_sello)}" alt="compAI" width="512" height="512">
      </div>
      <a class="baja mono" href="#offenbar"><span>Bajar</span><i aria-hidden="true"></i></a>
    </div>
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

const fondoVid = (src, poster) => `<video src="${src}" poster="${poster}"
               muted loop playsinline autoplay preload="none"
               disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
      <span class="velo-vid" aria-hidden="true"></span>`;

/* rótulo de sección: «/ 0X — NOMBRE», IBM Plex Mono 24 extralight */
const rot = (o, x, y) => `<p class="b rot" style="--x:${x};--y:${y};--w:420">${esc(o.codigo)} — ${esc(o.nombre)}</p>`;

const offenbar = `
  <section class="sec cv" id="offenbar">
    <div class="pg" style="--h:1114">
      <div class="b fh ofondo" style="--x:0;--y:0;--w:1366;--hh:1114" aria-hidden="true">${fondoVid('media/circuitos.mp4', 'media/circuitos.webp')}</div>
      <img class="b fh ocod" style="--x:829;--y:-4;--w:816;--hh:164" src="media/codigo-detalle.webp" alt="" width="1366" height="274" loading="lazy" decoding="async">
      <img class="b fh ocod" style="--x:805;--y:159;--w:816;--hh:164" src="media/codigo-detalle.webp" alt="" width="1366" height="274" loading="lazy" decoding="async">
      ${rot(S.offenbar, 48, 38)}
      <h1 class="b t otit" style="--x:279;--y:174;--w:816;--fs:57.3;--lh:1.19;--tr:0.038">${esc(S.offenbar.titulo_1)}</h1>
      <p class="b t osub" style="--x:346;--y:256;--w:683;--fs:49.3;--lh:1.19;--tr:0.021">ejecutada por <b>IA</b>.</p>
      <a class="b t oenl" style="--x:667;--y:372;--w:420;--fs:20.7;--lh:1.12"
         href="${esc(S.contacto.ficha)}" target="_blank" rel="noopener">${esc(S.offenbar.enlace_texto)}</a>
    </div>
  </section>`;

const ilCuore = `
  <section class="sec cv ap" id="il-cuore">
    <div class="pg" style="--h:2112">
      <div class="b fh ccirc" style="--x:0;--y:1000;--w:1366;--hh:1112" aria-hidden="true">${fondoVid('media/circuitos.mp4', 'media/circuitos.webp')}</div>
      <div class="b fh cuore-fondo" style="--x:0;--y:0;--w:1366;--hh:960" aria-hidden="true"></div>
      <div class="b fh cuore" style="--x:0;--y:96;--w:1366;--hh:768">
        <video src="${esc(S.il_cuore.video)}" poster="${esc(S.il_cuore.video_poster)}"
               muted loop playsinline autoplay preload="none"
               disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
      </div>
      ${rot(S.il_cuore, 48, 222)}
      <h2 class="b t ctit" style="--x:178;--y:930;--w:1034;--fs:41;--lh:1.32;--tr:0.158"><span>${esc(S.il_cuore.ia.titulo[0])}</span><span>${esc(S.il_cuore.ia.titulo[1])}</span><span><i class="amp">&amp;</i> ${esc(S.il_cuore.ia.titulo[2].replace(/^&\s*/, ''))}</span></h2>
      <p class="b t cpar" style="--x:248;--y:1120;--w:914;--fs:24.1;--lh:1.3">${esc(S.il_cuore.ia.parrafo).replace(/\n/g, '<br>')}</p>
      <div class="b ciso" style="--x:970;--y:1330;--w:150">${TICKS('iso-svg', 'compAI')}</div>
      <a class="b cacc" style="--x:269;--y:1548;--w:330;--fs:15;--tr:0.14;font-size:calc(15*var(--u))" href="${esc(S.il_cuore.accesos[0].ancla)}"><span>/</span><span class="ic" aria-hidden="true"><svg viewBox="0 0 16 13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 3.2V11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4.4a1 1 0 0 0-1-1H8L6.4 1.4A1 1 0 0 0 5.7 1H2a1 1 0 0 0-1 1z"/></svg></span><span>— ${esc(S.il_cuore.accesos[0].texto)}</span></a>
      <a class="b cacc" style="--x:766;--y:1543;--w:330;--fs:15;--tr:0.14;font-size:calc(15*var(--u))" href="${esc(S.il_cuore.accesos[1].ancla)}"><span>/</span><span class="ic red" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="5.6" r="2.7"/><path d="M2.6 14c.5-3 2.7-4.6 5.4-4.6S12.9 11 13.4 14"/></svg></span><span>— ${esc(S.il_cuore.accesos[1].texto)}</span></a>
    </div>
  </section>`;

const grace = (() => {
  const im = S.grace.imagenes;
  const fila = f => `<li>
            <span class="mkr${/^NO/.test(f.marca) ? ' no' : ''}">${esc(f.marca)}</span>
            <span class="dt"><b>${esc(f.id)}</b><em>${esc(f.titulo)}</em></span>
            <span class="ci">${esc(f.cierre)}</span>
          </li>`;
  return `
  <section class="sec cv ap" id="grace">
    <div class="pg gcab" style="--h:587">
      <div class="b fh" style="--x:0;--y:0;--w:1366;--hh:587">
        <video id="graceFondo" src="${esc(S.grace.fondo)}" poster="${esc(S.grace.fondo_poster)}"
               data-velocidad="${S.grace.fondo_velocidad}"
               muted loop playsinline autoplay preload="none"
               disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
      </div>
      <div class="b fh" style="--x:844;--y:-24;--w:366;--hh:611">
        <img src="${esc(im[0].src)}" alt="${esc(im[0].alt)}" loading="lazy" decoding="async">
      </div>
      ${rot(S.grace, 59, 0)}
    </div>

    <div class="pg" style="--h:932">
      <div class="b fh" style="--x:0;--y:0;--w:1366;--hh:932" aria-hidden="true">
        <img class="gcampo" src="${esc(S.grace.fondo_poster)}" alt="" loading="lazy" decoding="async">
      </div>
      <div class="b fh gvelo" style="--x:178;--y:0;--w:1033;--hh:932" aria-hidden="true"></div>
      <div class="b fh gpanel" style="--x:415;--y:258;--w:786;--hh:478" aria-hidden="true"></div>
      <h2 class="b t gtit" style="--x:44;--y:20;--w:800;--fs:38;--lh:1.45">${S.grace.titulo_lineas.map(l => `<span>${esc(l)}</span>`).join('')}</h2>
      <p class="b t gsub" style="--x:44;--y:150;--w:760;--fs:17;--lh:1.7">${esc(S.grace.linea).replace(/\n/g, '<br>')}</p>
      <figure class="b fh" style="--x:40;--y:190;--w:470;--hh:742;margin:0">
        <canvas class="gcanvas" data-src="${esc(im[1].src)}" data-anclaje="cubrir" data-revelado="0.68" role="img" aria-label="${esc(im[1].alt)}"></canvas>
      </figure>
      <img class="b fh gemblema" style="--x:405;--y:234;--w:40;--hh:40" src="media/grace-logo.webp" alt="" width="512" height="512" loading="lazy" decoding="async">
      <p class="b t gmarca" style="--x:455;--y:238;--w:300;--fs:26;--lh:1.1">${esc(S.grace.envivo.titulo)}</p>
      <p class="b t gvivo fh" style="--x:712;--y:240;--w:112;--hh:30;--fs:12">(( ${esc(S.grace.envivo.estado)} ))</p>
      <ul class="b glista" style="--x:432;--y:286;--w:752">
        ${S.grace.envivo.filas.map(fila).join('\n        ')}
      </ul>
      <p class="b gpie" style="--x:432;--y:688;--w:752">${esc(S.grace.envivo.barrido)}</p>
      <a class="b gcta" style="--x:432;--y:752;--w:560" href="#creative">${esc(S.grace.cta)}</a>
    </div>

    <div class="pg" style="--h:1115">
      <div class="b gcifras fh" style="--x:45;--y:57;--w:1275;--hh:152">
        ${S.grace.franja.map(f => `<div><b>${esc(f.cifra)}</b><span>${esc(f.glosa)}</span></div>`).join('')}
      </div>
      <figure class="b fh" style="--x:0;--y:258;--w:1366;--hh:772;margin:0">
        <canvas class="gcanvas" data-src="${esc(im[2].src)}" data-anclaje="cubrir" data-revelado="0.74" role="img" aria-label="${esc(im[2].alt)}"></canvas>
      </figure>
    </div>
  </section>`;
})();

/* Los cuatro servicios del Canva: texto a la izquierda, mockup a la derecha.
   La línea de las viñetas alterna azul y ámbar, igual que la referencia. */
const servTexto = (s, x, y) => `<button class="b servblock" type="button" data-slug="${esc(s.slug)}" aria-haspopup="dialog"
        style="--x:${x};--y:${y};--w:583;text-align:left;display:block">
        <span class="serv-tit">${esc(s.titulo)}</span>
        <span class="serv-par">${esc(s.bajada)}</span>
        <ul class="serv-vin${(s.codigo === '02' || s.codigo === '03') ? ' ambar' : ''}">${s.vinetas.map(v => `<li>${esc(v)}</li>`).join('')}</ul>
      </button>`;

const mkTel = (x, y, n) => `<div class="mk tel p${n}" style="--x:${x};--y:${y};--w:289;--hh:572" aria-hidden="true"><span class="muesca"></span><span class="pantalla"></span></div>`;
const mkMon = (x, y, n) => `<div class="mk mon p${n}" style="--x:${x};--y:${y};--w:458;--hh:368;--mh:300" aria-hidden="true"><span class="marco"><span class="pantalla"></span></span><span class="cuello"></span><span class="base"></span></div>`;
const mkLap = (x, y, n) => `<div class="mk lap p${n}" style="--x:${x};--y:${y};--w:463;--hh:265;--mh:248" aria-hidden="true"><span class="marco"><span class="pantalla"></span></span><span class="base"></span></div>`;

const creative = `
  <section class="sec cv ap" id="creative">
    <div class="pg cvfondo" style="--h:2380">
      <div class="b fh ccirc" style="--x:704;--y:0;--w:662;--hh:2380" aria-hidden="true">${fondoVid('media/circuitos.mp4', 'media/circuitos.webp')}</div>
      <div class="b fh cline" style="--x:657;--y:0;--w:7;--hh:2380" aria-hidden="true"></div>
      ${rot(S.creative, 62, 38)}
      ${servTexto(SERV[0], 79, 192)}
      ${mkTel(902, 104, 1)}
      ${servTexto(SERV[1], 75, 1000)}
      ${mkMon(817, 912, 2)}
      ${servTexto(SERV[2], 75, 1790)}
      ${mkLap(804, 1690, 3)}
    </div>

    <div class="pg cvfondo" style="--h:2110">
      <div class="b fh ccirc" style="--x:704;--y:0;--w:662;--hh:896" aria-hidden="true">${fondoVid('media/circuitos.mp4', 'media/circuitos.webp')}</div>
      <div class="b fh cline" style="--x:659;--y:0;--w:9;--hh:902" aria-hidden="true"></div>
      ${servTexto(SERV[3], 79, 203)}
      ${mkTel(902, 104, 4)}
      ${['pista', 'nodo', 'nucleo'].map((n, i) => {
        const y = [896, 1278, 1704][i], h = [382, 426, 406][i], ty = [1040, 1420, 1850][i];
        return `<div class="b fh ccirc" style="--x:0;--y:${y};--w:1366;--hh:${h}" aria-hidden="true">${fondoVid(`media/banda-${n}.mp4`, `media/banda-${n}.webp`)}</div>
      <div class="b fh banda-velo" style="--x:0;--y:${y};--w:1366;--hh:${h}" aria-hidden="true"></div>
      <p class="b t banda-tx" style="--x:137;--y:${ty};--w:500;--fs:81.1;--lh:1.1;--tr:0.054">/${n}</p>`;
      }).join('\n      ')}
    </div>
  </section>`;

const inbox = `
  <section class="sec cv ap" id="inbox">
    <div class="pg" style="--h:1491">
      ${rot(S.inbox, 62, 82)}
      <div class="b fh icaja" style="--x:189;--y:193;--w:988;--hh:1106">
        <form id="formLead" novalidate>
          <p class="ikick">${esc(S.inbox.antetitulo)}</p>
          <h2 class="ititulo">${esc(S.inbox.titulo_1)} <em>${esc(S.inbox.titulo_2)}</em></h2>
          <div class="campos">
            <p class="campo ancho2"><label for="f-nombre">${esc(S.inbox.campos.nombre)}</label><input id="f-nombre" name="nombre" type="text" autocomplete="name" placeholder="${esc(S.inbox.placeholders.nombre)}" required></p>
            <p class="campo"><label for="f-correo">${esc(S.inbox.campos.correo)}</label><input id="f-correo" name="correo" type="email" autocomplete="email" placeholder="${esc(S.inbox.placeholders.correo)}" required></p>
            <p class="campo"><label for="f-telefono">${esc(S.inbox.campos.telefono)}</label><input id="f-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder="${esc(S.inbox.placeholders.telefono)}" required></p>
            <p class="campo ancho2"><label for="f-mensaje">${esc(S.inbox.campos.mensaje)}</label><textarea id="f-mensaje" name="mensaje" rows="4" placeholder="${esc(S.inbox.placeholders.mensaje)}" required></textarea></p>
            <p class="campo ancho2 mono"><label for="f-idmp">${esc(S.inbox.campos.idmp)}</label><input id="f-idmp" name="idmp" type="text" placeholder="${esc(S.inbox.placeholders.idmp)}"></p>
            <div class="iadjunta">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M13.5 6.5 7.9 12a2.1 2.1 0 0 0 3 3l5.6-5.6a4 4 0 1 0-5.7-5.7L5 9.6a5.9 5.9 0 0 0 8.4 8.4l4.3-4.3"/></svg>
              <span><b>${esc(S.inbox.adjunta.titulo)}</b><span>${esc(S.inbox.adjunta.nota)}</span></span>
            </div>
          </div>
          <p class="trampa" aria-hidden="true"><label for="f-sitioweb">No llenar</label><input id="f-sitioweb" name="sitioweb" type="text" tabindex="-1" autocomplete="off"></p>
          <div class="enviar">
            <button class="btn" id="formBtn" type="submit">${esc(S.inbox.boton)}</button>
            <span class="nota">${esc(S.inbox.nota)}</span>
          </div>
          <p class="aviso" id="formAviso" role="status" aria-live="polite" hidden></p>
        </form>
      </div>
    </div>
  </section>`;

const contacto = `
  <section class="sec cv ap" id="contacto">
    <div class="pg" style="--h:525">
      <div class="b fh korbe" style="--x:1121;--y:0;--w:385;--hh:527" aria-hidden="true"></div>
      ${rot(S.contacto_seccion, 41, 96)}
      <p class="b t kpreg" style="--x:171;--y:250;--w:1024;--fs:25.7;--lh:1.45">${S.contacto_seccion.pregunta_lineas.map(l => esc(l)).join('<br>')}</p>
      <a class="b t kcorreo" style="--x:171;--y:348;--w:1024;--fs:32.3;--lh:1.21" href="mailto:${esc(S.contacto.correo)}">${esc(S.contacto.correo)}</a>
    </div>

    <div class="pg" style="--h:1006">
      <div class="b fh kpicaflor" style="--x:0;--y:320;--w:493;--hh:493" aria-hidden="true">
        <img src="media/picaflor.webp" alt="" width="900" height="900" loading="lazy" decoding="async">
      </div>
      <p class="b t kscl" style="--x:425;--y:215;--w:515;--fs:236;--lh:1.21;--tr:-0.031">${esc(S.contacto.ciudad)}</p>
      <p class="b t klugar" style="--x:555;--y:499;--w:256;--fs:26.7;--lh:1.21;--tr:-0.031">${esc(S.contacto.lugar)}</p>
      <a class="b fh kcomp" style="--x:1078;--y:820;--w:205;--hh:115" href="${esc(S.contacto.intranet)}" target="_blank" rel="noopener"
         aria-label="${esc(S.contacto_seccion.intranet_texto)} — acceso del equipo">
        <img src="media/compuerta.webp" alt="" width="760" height="836" loading="lazy" decoding="async">
      </a>
      <a class="b t kintranet" style="--x:1124;--y:852;--w:124;--fs:26.7;--lh:1.21;--tr:-0.031"
         href="${esc(S.contacto.intranet)}" target="_blank" rel="noopener">${esc(S.contacto_seccion.intranet_texto)}</a>
      <p class="b kpie" style="--x:41;--y:960;--w:1284">
        <span>${esc(S.contacto.razon_social)} · RUT ${esc(S.contacto.rut)}</span>
        <span><a href="${esc(S.contacto.ficha)}" target="_blank" rel="noopener">Ficha proveedores del Estado</a> · <a href="/portafolio.html">Portafolio</a></span>
      </p>
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
<link rel="stylesheet" href="css/canva.css">
<link rel="preload" as="font" type="font/woff2" href="css/fuentes/plexmono-700-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="css/fuentes/plexmono-200-latin.woff2" crossorigin>
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
    <!-- sin atributo src: vacio resuelve a la propia pagina y dispara un error de
       recurso en la consola. La ruta la pone el JS al abrir cada lamina. -->
    <figure class="lam-img" hidden><img id="lamImg" alt="" loading="lazy" decoding="async"></figure>
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
