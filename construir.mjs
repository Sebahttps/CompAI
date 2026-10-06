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
/* El barrido de RAIdar, si esta. `contenido/barrido.json` lo deja
   `traer_barrido.py` desde `radar/vitrina/ultimo.json`. Sin el archivo el
   panel cae a las filas de EJEMPLO de sitio.json: la pagina no se cae por
   un barrido que no corrio, pero tampoco finge que el dato es de hoy. */
const BARRIDO = existsSync(join(raiz, 'contenido/barrido.json'))
  ? lee('contenido/barrido.json') : null;
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

/* ── la traza de circuito: el mismo cobre de la piel de Grace ───────
   Dos copias del patron, una detras de otra, y el grupo se corre un patron
   completo en bucle: el paneo lento que pidio Sebastian el 04-10-2026 sin un
   solo fotograma de video. El patron mide 300 de ancho en su propio viewBox. */
const PATRON_TRAZA = `
        <circle cx="4" cy="12" r="3"/>
        <path d="M7 12h26l8-7h34l8 7h22"/>
        <path d="M105 12h18l7 6h40l7-6h20"/>
        <circle cx="197" cy="12" r="2.4"/>
        <path d="M200 12h22l9-8h30"/>
        <path d="M261 4h16"/>
        <path d="M231 12h28l8 8h26"/>`;
const TRAZA = (clase, x, y, w) => `<span class="${clase} traza" style="--x:${x};--y:${y};--w:${w}" aria-hidden="true">
        <svg viewBox="0 0 600 24" preserveAspectRatio="none" focusable="false">
          <g class="t1">${PATRON_TRAZA}</g>
          <g class="t1" transform="translate(300 0)">${PATRON_TRAZA}</g>
        </svg>
      </span>`;

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
  /* ENCUADRE CORREGIDO POR VISU, 04-10-2026. Medido por CDP a 1440x900 sobre
     el index.html construido. Solo se movieron cajas; ni un texto ni un color.
       · rot / 03: 59,0 -> 62,38. A y=0 el rotulo salia cortado contra el borde
         superior de la seccion; /04 y /05 ya estaban a x=62 y=38.
       · gpanel 258/478 -> 222/578. El borde superior del panel pasaba por la
         mitad del lockup GRACE SYSTEM (emblema 234..274 contra panel 258) y su
         borde inferior (736) dejaba el boton AFUERA (752..801).
       · emblema/gmarca/gvivo +6 y glista 286 -> 300: el lockup queda dentro del
         panel con 18 px de aire y la lista arranca 20 px bajo el.
       · gpie 688 -> 658 y gcta 752 -> 730: el hueco entre la lista y el pie era
         de 88 px del lienzo, el doble que cualquier otro aire del panel.
       · gcta w 560 -> 752: su borde derecho quedaba 192 px del lienzo mas corto
         que el de la lista y el del pie. Ahora los tres cierran en 1184.
       · gtit/gsub x 44 -> 62: alineados con el rotulo de la seccion.
     ARRASTRE DEL CUERPO DE LETRA, 04-10-2026: la lista pasa de 8-10 px a
     11-14 px (css/canva.css, bloque .glista) y crece 68 px de lienzo. Lo
     acompanan gpanel 578->646, gpie 658->726, gcta 730->798 y la pagina
     932->1000; si no, el pie se mete dentro de la ultima fila.
       · gcifras 45/1275 -> 62/1242: el cuarto margen izquierdo distinto
         dentro de 19 px. Ahora los cuatro cierran en 62. */
  const im = S.grace.imagenes;
  const L = S.grace.lamina;
  const vivo = BARRIDO && Array.isArray(BARRIDO.filas) && BARRIDO.filas.length
    ? BARRIDO : null;
  const filas = vivo ? vivo.filas : S.grace.envivo.filas;
  const sello = vivo ? `BARRIDO DEL ${vivo.fecha}` : S.grace.envivo.estado;
  const pie = vivo
    ? `${vivo.barridas.toLocaleString('es-CL')} licitaciones activas barridas · ${vivo.fuente}. Clasificadas por rubro; se desplaza para verlas todas.`
    : S.grace.envivo.pie;
  const fila = f => `<li>
            <span class="mkr${/^NO/.test(f.marca) ? ' no' : ''}">${esc(f.marca)}</span>
            <span class="dt"><b>${esc(f.rubro)}</b><em>${esc(f.id)}</em><i>${esc(f.titulo)}</i></span>
            <span class="ci">${esc(f.cierre)}</span>
          </li>`;
  return `
  <section class="sec cv ap" id="grace">
    <div class="pg glam" style="--h:840">
      <div class="b fh gvideo" style="--x:439;--y:0;--w:488;--hh:840">
        <video id="graceFondo" src="${esc(L.video)}" poster="${esc(L.video_poster)}"
               muted loop playsinline autoplay preload="none"
               disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
      </div>
      ${rot(S.grace, 62, 44)}
      <h2 class="b t gltit" style="--x:64;--y:160;--w:300;--fs:26;--lh:1.26">${L.titulo.map(l => `<span>${esc(l)}</span>`).join('')}</h2>
      <p class="b t glpar" style="--x:64;--y:296;--w:268;--fs:14.5;--lh:1.62">${esc(L.izquierda)}</p>
      ${TRAZA('b glzurda', 228, 452, 150)}
      ${TRAZA('b gldiestra', 904, 528, 150)}
      <ul class="b gldcha" style="--x:904;--y:584;--w:400;--fs:14.5;--lh:1.62">
        ${L.derecha.map(d => `<li><b class="${/^NO/.test(d.marca) ? 'no' : ''}">${esc(d.marca)}</b> ${esc(d.texto)}</li>`).join('')}
      </ul>
      <p class="b t glcierre" style="--x:904;--y:730;--w:400;--fs:14.5;--lh:1.62">${esc(L.cierre)}</p>
      <p class="b gllock" style="--x:483;--y:772;--w:400"><img src="media/grace-logo.webp" alt="" width="512" height="512" loading="lazy" decoding="async"><span>${esc(L.lockup)}</span></p>
    </div>

    <div class="pg gviva" style="--h:800">
      <div class="b fh gvfilm" style="--x:62;--y:62;--w:380;--hh:676">
        <video src="${esc(S.grace.envivo.video)}" poster="${esc(S.grace.envivo.video_poster)}"
               muted loop playsinline autoplay preload="none"
               disablepictureinpicture controlslist="nodownload noplaybackrate" aria-hidden="true"></video>
      </div>
      <img class="b fh gemblema" style="--x:500;--y:118;--w:40;--hh:40" src="media/grace-logo.webp" alt="" width="512" height="512" loading="lazy" decoding="async">
      <p class="b t gmarca" style="--x:552;--y:122;--w:360;--fs:26;--lh:1.1">${esc(S.grace.envivo.titulo)}</p>
      <p class="b t gvivo fh" style="--x:940;--y:124;--w:124;--hh:30;--fs:12">(( ${esc(sello)} ))</p>
      <div class="b fh gcaja" style="--x:500;--y:186;--w:804;--hh:428">
        <ul class="glista">
          ${filas.map(fila).join('')}
        </ul>
      </div>
      <p class="b gpie" style="--x:500;--y:642;--w:804">${esc(pie)}</p>
    </div>

    <div class="pg" style="--h:1115">
      <div class="b gcifras fh" style="--x:62;--y:57;--w:1242;--hh:152">
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
/* ── La ficha de servicio de / 04, segun Visu (05-10-2026) ─────────────
   Encabezado 44 px, bajada 24, TRES checks de los cinco y un llamado. Lo que
   sostiene la columna derecha no es el icono sino la PLACA: 400x400, marco de
   1 px azul al 28 %, el icono de 168 dentro, y el doble check mordiendo la
   esquina, que es la firma. Las otras dos vinetas no se pierden: estan en la
   lamina que abre al tocar la ficha. */
const ICONO = {
  automatizacion: '<rect x="2.5" y="7" width="7" height="7" rx="1"/><rect x="14.5" y="7" width="7" height="7" rx="1"/><path d="M9.5 10.5h5"/><path d="M12.5 8.5 14.5 10.5 12.5 12.5"/>',
  especificacion: '<path d="M5.5 2.5h8l5 5v14h-13z"/><path d="M13.5 2.5v5h5"/><path d="M8.5 12.5h7"/><path d="M8.5 16.5h4.5"/>',
  continuidad: '<circle cx="7" cy="12" r="4"/><path d="M11 12h10"/><path d="M17.5 12v3.5"/><path d="M20.5 12v2.5"/>',
  catalogo: '<path d="M12.5 2.5H21v8.5l-9.5 9.5a1.6 1.6 0 0 1-2.3 0l-6.2-6.2a1.6 1.6 0 0 1 0-2.3z"/><circle cx="17" cy="7" r="1.6"/><path d="M8 13.5l3 3"/>',
};
const ROT_LINEA = { automatizacion: 'L1', especificacion: 'L2', continuidad: 'L3', catalogo: 'CATÁLOGO' };

const servTexto = (s, x, y) => `<button class="b servblock" type="button" data-slug="${esc(s.slug)}" aria-haspopup="dialog"
        style="--x:${x};--y:${y};--w:583;text-align:left;display:block">
        <span class="serv-rot">${esc(s.codigo)} / ${esc(ROT_LINEA[s.slug] || '')}</span>
        <span class="serv-tit">${esc(s.titulo)}</span>
        <span class="serv-par">${esc(s.bajada)}</span>
        <ul class="serv-vin">${s.vinetas.slice(0, 3).map(v => `<li>${esc(v)}</li>`).join('')}</ul>
        <span class="serv-acc">Ver precio &rarr;</span>
      </button>`;

/* La placa reemplaza al mockup de telefono, monitor y notebook. */
const placa = (s, x, y) => `<div class="b fh placa" style="--x:${x};--y:${y};--w:400;--hh:400" aria-hidden="true">
        <svg class="placa-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONO[s.slug] || ''}</svg>
        <span class="placa-cod">${esc(s.codigo)}</span>
        <span class="placa-lin">${esc(ROT_LINEA[s.slug] || '')}</span>
        ${TICKS('placa-tick', '')}
      </div>`;

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
      ${placa(SERV[0], 836, 152)}
      ${servTexto(SERV[1], 79, 1000)}
      ${placa(SERV[1], 836, 960)}
      ${servTexto(SERV[2], 79, 1790)}
      ${placa(SERV[2], 836, 1750)}
    </div>

    <div class="pg cvfondo" style="--h:2240">
      <div class="b fh ccirc" style="--x:704;--y:0;--w:662;--hh:896" aria-hidden="true">${fondoVid('media/circuitos.mp4', 'media/circuitos.webp')}</div>
      <div class="b fh cline" style="--x:659;--y:0;--w:9;--hh:902" aria-hidden="true"></div>
      ${servTexto(SERV[3], 79, 203)}
      ${placa(SERV[3], 836, 163)}
      ${/* Las tres bandas abren con un DIBUJO, no con una ficha de texto:
            la ficha repetia el servicio de arriba. Un solo dibujo en tres
            estados —la diferencia entre los paquetes es acumulativa—, y lo
            que entra nuevo en cada uno va en ambar. Visu, 05-10-2026. */
        S.creative.paquetes.map((pq, i) => {
        const y = [896, 1278, 1704][i], h = [382, 426, 406][i];
        const n = ['pista', 'nodo', 'nucleo'][i];
        const e = pq.estado;
        return `<details class="b fh banda banda-${n}" style="--x:0;--y:${y};--w:1366;--hh:${h}">
        <summary>
          <span class="ccirc" aria-hidden="true">${fondoVid(`media/banda-${n}.mp4`, `media/banda-${n}.webp`)}</span>
          <span class="banda-velo" aria-hidden="true"></span>
          <span class="banda-tx">${esc(pq.etiqueta)}</span>
          <span class="banda-sub">${esc(pq.verbo)}</span>
          <span class="banda-mas" aria-hidden="true"></span>
        </summary>
        <div class="banda-ficha">
          <svg class="esq" viewBox="0 0 300 150" fill="none" aria-hidden="true"
               stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <g class="traza">
              <rect x="18" y="26" width="104" height="78" rx="3"/>
              <path d="M18 44h104"/><path d="M34 62h52"/><path d="M34 76h72"/>
            </g>
            <g class="traza"><path d="M130 50h58"/><path d="M178 42 190 50 178 58"/></g>
            ${e >= 2 ? `<g class="accion">
              <rect x="196" y="30" width="86" height="20" rx="3"/>
              <rect x="196" y="58" width="86" height="20" rx="3" fill="currentColor" stroke="none" opacity=".9"/>
              <path d="M188 92h-58"/><path d="M140 84 128 92 140 100"/>
            </g>` : ''}
            ${e >= 3 ? `<g class="accion">
              <ellipse cx="239" cy="104" rx="30" ry="9"/>
              <path d="M209 104v22c0 5 13.4 9 30 9s30-4 30-9v-22"/>
              <path d="M209 118c0 5 13.4 9 30 9s30-4 30-9"/>
            </g>` : ''}
          </svg>
          <p class="esq-pie"><b>${esc(pq.verbo)}</b> ${esc(pq.linea)}</p>
        </div>
      </details>`;
      }).join('')}
      ${S.creative.llamado ? `<p class="b banda-llamado" style="--x:137;--y:2146;--w:1092;--hh:60">${esc(S.creative.llamado.antes)} <a href="${esc(S.creative.llamado.url)}">${esc(S.creative.llamado.enlace)}</a> ${esc(S.creative.llamado.despues)}</p>` : ''}
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

/* ── portafolio.html: las escenas ─────────────────────────────────────────
   05-10-2026. Escena = video + lo que se pide debajo. La fuente es
   `contenido/escenas.json` (copy de Visu) y se reescribe SOLO lo que hay
   entre las marcas ESCENAS:INICIO / ESCENAS:FIN; el resto del portafolio
   sigue a mano. Las licencias van SIN precio: se cotizan. */
{
  const PORT = join(raiz, 'portafolio.html');
  const E = lee('contenido/escenas.json');
  const F = E.formulario;
  const precio = it => {
    const s = E.servicios[it.sp]; if (!s) return '';
    const base = s.cond === 'desde' ? `desde ${s.bruto} con IVA` : `${s.bruto} con IVA · ${s.cond}`;
    return it.precio_sufijo ? `${base}, ${it.precio_sufijo}` : base;
  };
  const item = (e, it) => {
    const idc = `i${e.id}-${it.id}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const px = it.sp ? `<span class="px">${esc(precio(it))}</span>` : '';
    const cant = it.cantidad
      ? `<input class="cant" type="number" name="cant-${esc(it.id)}" min="1" step="1" inputmode="numeric" placeholder="${esc(it.unidad || 'cant.')}" data-unidad="${esc(it.unidad || '')}" aria-label="Cantidad de ${esc(it.unidad || 'unidades')} · ${esc(it.nombre)}">`
      : '';
    const cual = it.campo_texto
      ? `<input class="cual" type="text" name="cual-${esc(it.id)}" maxlength="80" placeholder="${esc(it.campo_texto)}" aria-label="${esc(it.campo_texto)} · ${esc(it.nombre)}">`
      : '';
    return `          <li><div class="it"><input type="checkbox" id="${idc}" name="item" value="${esc(it.id)}" data-nombre="${esc(it.nombre)}"${it.sp ? ` data-sp="${esc(it.sp)}"` : ''}${it.vigencia ? ' data-vigencia="1"' : ''}>
            <label class="tx" for="${idc}"><span class="nm">${esc(it.nombre)}</span><span class="dt">${esc(it.detalle)}</span>${px}</label>${cant}${cual}</div></li>`;
  };
  const grupo = (e, g) => `        <fieldset>
          <legend>${esc(g.pregunta)}</legend>
          <ul class="items">
${g.items.map(it => item(e, it)).join('\n')}
          </ul>
        </fieldset>`;
  const vig = e => e.vigencia ? `
        <label class="vig">${esc(e.vigencia.etiqueta)}<select name="vigencia">${e.vigencia.opciones.map(o => `<option${o === e.vigencia.defecto ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>` : '';
  const pieza = (e, i) => `    <!-- ---------- ${e.id} ---------- -->
    <div class="pieza" data-p="${i + 1}">
      <figure class="marco"><video muted loop playsinline ${i === 0 ? 'autoplay preload="metadata"' : 'preload="none"'} poster="${esc(e.poster)}" aria-label="${esc(e.alt)}"><source src="${esc(e.video)}" type="video/mp4"></video></figure>
      <div class="pieplaca">
        <p class="linea">${esc(e.linea)}</p>
        <h2>${esc(e.titulo)}</h2>
        <p>${esc(e.bajada)}</p>
      </div>
      <form class="pide" data-titulo="${esc(e.carrete)}" data-asunto="${esc(e.asunto)}" action="mailto:hola@compai.cl" method="post" enctype="text/plain">
${e.grupos.map((g, k) => grupo(e, g) + (k === 0 ? vig(e) : '')).join('\n')}
        <div class="quien">
          <p class="tq">${esc(F.titulo_quien)}</p>
          <label>${esc(F.institucion.etiqueta)}<input name="organismo" autocomplete="organization" required maxlength="120" placeholder="${esc(F.institucion.placeholder)}"></label>
          <label>Nombre<input name="nombre" autocomplete="name" required maxlength="80"></label>
          <label>Correo<input name="correo" type="email" autocomplete="email" required maxlength="120"></label>
          <label>Teléfono<input name="telefono" type="tel" autocomplete="tel" maxlength="30"></label>
          <label>${esc(F.plazo.etiqueta)}<input name="plazo" maxlength="60" placeholder="${esc(F.plazo.placeholder)}"></label>
          <label>${esc(F.codigo.etiqueta)}<input name="codigo" maxlength="40" placeholder="${esc(F.codigo.placeholder)}"></label>
          <span class="trampa" aria-hidden="true"><input name="sitioweb" tabindex="-1" autocomplete="off"></span>
        </div>
        <div class="envia">
          <button type="submit">${esc(F.cta)}</button><span class="cuenta" aria-live="polite"></span>
          <p class="nota">${esc(F.nota)}</p>
        </div>
        <p class="aviso" role="status" hidden></p>
        <p class="respaldo" hidden>${esc(F.respaldo.linea)} <button type="button" class="copia">${esc(F.respaldo.boton_copiar)}</button></p>
      </form>
    </div>`;
  const conf = c => `<p class="confianza${c ? ' ' + c : ''}">${esc(E.confianza.texto)} <a href="${esc(E.confianza.url)}" target="_blank" rel="noopener">${esc(E.confianza.enlace)}</a></p>`;
  const bloque = `<!-- ESCENAS:INICIO · lo arma construir.mjs desde contenido/escenas.json — NO SE EDITA A MANO -->
${E.escenas.map((e, i) => `<input type="radio" name="pieza" id="p${i + 1}" class="sel"${i === 0 ? ' checked' : ''}>`).join('\n')}

<main class="sala" id="servicios">

  <!-- ================= EL CARRETE ================= -->
  <div>
    <div class="carrete">
      <p class="promesa">${esc(E.promesa)}</p>
      <div class="tope">${esc(E.tope)}</div>
      <ul>
${E.escenas.map((e, i) => `        <li><label for="p${i + 1}"><span class="n">${esc(e.id)}</span><span class="tt">${esc(e.carrete)}</span></label></li>`).join('\n')}
      </ul>
      ${conf('')}
    </div>
  </div>

  <!-- ================= EL ESCENARIO ================= -->
  <div class="escenario">
${E.escenas.map(pieza).join('\n\n')}
    ${conf('abajo')}
  </div>
</main>
<script>window.ESCENAS=${JSON.stringify({ formulario: F, endpoint: S.formEndpoint || '' }).replace(/</g, '\\u003c')};</script>
<!-- ESCENAS:FIN -->`;
  const t = readFileSync(PORT, 'utf8');
  const re = /<!-- ESCENAS:INICIO[\s\S]*?<!-- ESCENAS:FIN -->/;
  if (re.test(t)) {
    writeFileSync(PORT, t.replace(re, () => bloque), 'utf8');
    const n = E.escenas.reduce((a, e) => a + e.grupos.reduce((b, g) => b + g.items.length, 0), 0);
    console.log(`portafolio.html · ${E.escenas.length} escenas · ${n} cosas para pedir`);
  } else console.warn('AVISO: portafolio.html no tiene las marcas ESCENAS:INICIO/FIN — no se tocaron las escenas');
}
