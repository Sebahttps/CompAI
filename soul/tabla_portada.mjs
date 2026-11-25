// Escribe la tabla legible de la portada por oficio y de los estilos con su prompt para computador y celular.
// Lee las MISMAS fuentes que usa SOUL (datos.js y apps-script/Code.gs): la tabla no se edita a mano, se vuelve a correr.
//   node soul/tabla_portada.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const aqui = dirname(fileURLToPath(import.meta.url));
const W = { window: {} }; W.window = W; vm.createContext(W);
vm.runInContext(readFileSync(join(aqui, 'datos.js'), 'utf8'), W);
const D = W.SOUL_DATA;
const G = {}; vm.createContext(G);
vm.runInContext(readFileSync(join(aqui, '..', 'apps-script', 'Code.gs'), 'utf8'), G);
const salida = join(aqui, '..', '..', '..', 'CompAI', 'Dir. Arte, Comunicacion & Prod. Audiovisual', '2026-11-24-soul-portada-por-oficio.md');

const ESTILOS = [
  ['fresh', 'Realista', 'Luz de mañana, foto documental'],
  ['sun', 'Realista', 'Héroe al atardecer'],
  ['aerea', 'Realista', 'Vista aérea con herramientas ordenadas (la de Waldo)'],
  ['calida', 'Realista', 'Luz cálida'],
  ['cine', 'Realista', 'Cuadro de película'],
  ['gradacion', 'Realista', 'Gradación de color'],
  ['estudio', 'Realista', 'Estudio suave'],
  ['ochenta', 'Realista', 'Década de 1980'],
  ['clones', 'Realista', 'Clones'],
  ['anime', 'Dibujo', 'Anime'],
  ['arcilla', 'Dibujo', 'Plasticina'],
  ['facetado', 'Dibujo', 'Póster facetado'],
  ['vibe', 'Dibujo / pintura', 'Escena legendaria (obra famosa con su cara)']
];
const ej = D.OFICIOS.findIndex((o) => o.label === 'Maestro chasquilla');
const P = D.OFICIOS_PORTADA[ej];
const entorno = 'Ropa: ' + P.ropa + '. Herramientas y objetos: ' + P.elementos + '. Lugar: ' + P.fondo + '.';
const esc = (t) => String(t).replace(/\|/g, '\\|');

let md = `# SOUL · portada por oficio y estilos de portada

Generado el ${new Date().toISOString().slice(0, 10)} por \`sitio/compai/soul/tabla_portada.mjs\` desde \`soul/datos.js\` (OFICIOS_PORTADA)
y \`apps-script/Code.gs\` (RETRATO_ESTILOS, RETRATO_FORMATOS). **No se edita a mano**: se cambia la fuente y se vuelve a correr.

## Estructura del sitio (Sebastián, 24-11-2026)

| N.º | Sección | De dónde sale |
|---|---|---|
| 1 | Portada (hero) | Imagen publicitaria: la persona posa o trabaja con lo de su oficio, realista o dibujada, con efecto. Una ancha (computador) y una vertical (celular) |
| 2 | Mi límite | La respuesta a «¿Qué no harías nunca, aunque te paguen?» |
| 3 | Lo que hago por ti | Los servicios con precio «desde» |
| 4 | Galería | Fotos de los trabajos; el título sale del oficio (columna «Galería» abajo) |
| 5 | Cuéntame qué necesitas | Formulario sobre papel: **plano** (oficios de obra) o **cuaderno** a cuadros (el resto) |

## Tabla 1 · Oficio → vestimenta, elementos, fondo, papel y 5 títulos de galería

Los 5 títulos son **PROPUESTOS**: esperan tu visto. El sitio usa el 1.º si la persona no elige otro.

| Oficio | Vestimenta | Elementos | Fondo | Papel | Galería (5 opciones) |
|---|---|---|---|---|---|
`;
D.OFICIOS.forEach((o, i) => {
  const x = D.OFICIOS_PORTADA[i];
  md += `| ${esc(o.label)} | ${esc(x.ropa)} | ${esc(x.elementos)} | ${esc(x.fondo)} | ${x.hoja} | ${x.galeria.map((g, k) => (k + 1) + '. ' + esc(g)).join('<br>')} |\n`;
});

md += `
## Tabla 2 · Estilos de portada con su prompt para computador y celular

Cómo se arma el prompt que va a Gemini (siempre con la foto de la persona):
**estilo** + **identidad** (la misma cara, sin texto) + **oficio** + **entorno del oficio** (tabla 1) + **formato**.

| Formato | Proporción | Instrucción de encuadre |
|---|---|---|
| Computador | ${G.RETRATO_FORMATOS.ancha.ratio} | ${esc(G.RETRATO_FORMATOS.ancha.texto)} |
| Celular | ${G.RETRATO_FORMATOS.vertical.ratio} | ${esc(G.RETRATO_FORMATOS.vertical.texto)} |

| Clave | Tipo | Nombre en SOUL | Estilo (texto que va a Gemini) |
|---|---|---|---|
`;
for (const [k, tipo, nom] of ESTILOS) {
  const t = k === 'vibe' ? G.textoEstilo('vibe', { escena: 'atlas' }, 'Maestro chasquilla') : G.RETRATO_ESTILOS[k];
  md += `| \`${k}\` | ${tipo} | ${esc(nom)} | ${esc(t)} |\n`;
}

const armar = (k, fmt) => {
  const t = G.RETRATO_ESTILOS[k];
  return t + ' ' + G.RETRATO_COMUN + ' The person works as: Maestro chasquilla. Show the real tools and gestures of that trade clearly.' +
    ' Trade details (in Spanish, follow them literally): ' + entorno + ' The person interacts with or poses with these tools and materials. ' + G.RETRATO_FORMATOS[fmt].texto;
};
md += `
## Ejemplo completo · Waldo Castor (Maestro chasquilla), estilo «Vista aérea»

### Computador (${G.RETRATO_FORMATOS.ancha.ratio})

\`\`\`
${armar('aerea', 'ancha')}
\`\`\`

### Celular (${G.RETRATO_FORMATOS.vertical.ratio})

\`\`\`
${armar('aerea', 'vertical')}
\`\`\`
`;
writeFileSync(salida, md);
console.log('Escrito', salida, md.length, 'letras');
