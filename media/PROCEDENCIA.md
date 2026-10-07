# De dónde sale cada archivo que compai.cl publica

Medido el 01-10-2026 leyendo XMP y el manifiesto C2PA de cada máster, no
preguntando. Se escribe acá para que nadie lo vuelva a discutir de memoria.

| Publicado | Máster | Qué dicen sus metadatos |
|---|---|---|
| `hero-franjas.mp4` · `.webp` | `Orden Hero LAB. kri-eit (2).mp4` 3820×1754 | XMP `CreatorTool: Canva` — render del diseño de Sebastián |
| `hero-nucleo.mp4` · `.webp` | `sol.mp4` 1920×1080 | XMP `CreatorTool: Canva`, `brand=Sebastián Tapia Mena's team` |
| `circuitos.webp` | `FONDO 2.mp4` 1920×1080 | sin marcas |
| `picaflor.webp` | `picaflor.jfif` 2048×2048 | **SynthID (Google)** — lo generó él con Gemini |
| `grace-perfil.webp` | `Grace sentada de perfil.jfif` 1876×2272 | **SynthID (Google)** |
| `grace-retrato.webp` | `grace_retrato_petroleo.jpg` 1856×2304 | sin marcas |
| `grace-lavanda.webp` | `Grace Campo Lavanda Horizontal.png` 4320×2430 | **C2PA `softwareAgent: Canva AI`**, `compositeWithTrainedAlgorithmicMedia`, `doc=DAHWDKP2jvo` |
| `compuerta.webp` | fotograma incrustado en `compai.cl.svg` | la puerta que generó con IA; el .mp4 no está en el repo |
| `captura-portafolio.webp` | captura de `CompAI/portafolio.html` | propia |
| `logo-compai.svg` | `marca/canva-sitio/prototipo-hero/` | vector de marca, en curvas |
| `og.jpg` | compuesta acá con los de arriba | — |
| `escena-01..04.mp4` · `.webp` (desde el 06-10-2026) | `CompAI/Dir. Arte, Comunicacion & Prod. Audiovisual/2026-10-06-comic-escena-01..04/` | Estilo cómic aprobado por Sebastián el 06-10-2026 («MUY BUENO»). 12 ilustraciones **generadas en Canva** (3 por escena, sin texto; las de 02-04 bajadas de su Drive «Canva-sitio»), sin XMP ni C2PA. Texto, globos, onomatopeyas, marcos, trama y movimiento propios de Cínema; render HyperFrames 0.8.134. Bangers y Comic Neue, OFL-1.1, vendorizadas. Reemplazan a la versión plana del 05-10 (SVG+GSAP), que queda en `2026-10-05-videos-escenas/` y en la historia de git |
| `banda-nodo.mp4` · `.webp` (desde el 07-10-2026) | `CompAI/Dir. Arte, Comunicacion & Prod. Audiovisual/2026-10-06-comic-bandas/vinetas/nodo.jpg` 1776×896 | Viñeta **generada en Canva**, diseño `MAHXSs547Gw`, aprobada por Sebastián el 07-10-2026 (panadera con atril de pedidos; celular con chats desenfocado). Sin texto. Movimiento propio de Cínema: atril con las tarjetas vaciadas en el asset (`vaciar-nodo.py`) y reescritas una a una, burbujas de chat que se alejan; render HyperFrames 0.8.134. La viñeta anterior queda como `vinetas/nodo-v1.jpg` |
| `escena-05.mp4` · `.webp` (desde el 07-10-2026) | `CompAI/Dir. Arte, Comunicacion & Prod. Audiovisual/2026-10-07-comic-escena-05/` | La panadera de barrio. Reusa las 4 viñetas **generadas en Canva** de las bandas (`2026-10-06-comic-bandas/vinetas/pista.jpg`, `nodo-v1.jpg`, `nodo.jpg`, `nucleo.jpg`) y los recortes de `vaciar-nodo.py`; sin texto de origen. Pantalla «sin resultados», audios de chat, globos, onomatopeyas, cartela, marcos, trama y movimiento propios de Cínema; render HyperFrames 0.8.134. Bangers y Comic Neue, OFL-1.1, vendorizadas |

## La regla que importa, y es de futuro

**Nada de esta carpeta puede entrar al logotipo ni a una pieza que vaya a
INAPI.** Los términos de Canva —tanto para su contenido de biblioteca como
para lo que produce Canva AI— permiten publicar la pieza y prohíben usarla
dentro de una marca registrada. Hoy no hay problema: el logotipo compAI es
vector propio, dibujado desde la huella del fundador, sin un solo píxel de
Canva. El riesgo es la próxima pieza, no esta.

El caso concreto a tener presente es **`grace-lavanda.webp`**: su máster
declara `Canva AI` en el manifiesto C2PA. Publicarla en una sección del sitio
está permitido; llevarla a un logo, a un timbre o al registro, no.

## Lo que NO se usó, y por qué

La mariposa del diseño en Canva es una **captura de pantalla de conqr.mx**
—se ve el navegador y la URL en el PNG incrustado del SVG—. conqr es la
referencia de ESTRUCTURA del sitio; su mariposa es de ellos. La de compai.cl
es un SVG dibujado acá, en azul petróleo, y vive en `construir.mjs`.

Expediente legal completo:
`CompAI/Dir. Juridica/2026-10-01-licencias-canva-wix.md`.
