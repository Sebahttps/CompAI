# -*- coding: utf-8 -*-
"""SOUL · prepara la carpeta de fotos de una persona (soul/fotos/<slug>/) para la portada del sitio (PAIton, 24-11-2026).

La regla de la portada (Visu, PORTADA.md §4 y su _zona.py) corre AQUI, una vez, al preparar las fotos. El sitio publico
solo lee lo que esta herramienta escribe en fotos.json: donde va el titular, de que color es la letra, cuanto velo
lleva la imagen y donde va el sello. Nada se mide en el navegador de quien visita el sitio.

Uso (desde cualquier carpeta; necesita Pillow y numpy, que trae `py`):
  py soul/preparar_fotos.py waldo-castor                         mide las imagenes de portada que ya declara fotos.json
  py soul/preparar_fotos.py waldo-castor --ancha A.jpg --vertical V.jpg
                                                                 ademas exporta las imagenes de Gemini a los tamanos
                                                                 del sitio (PORTADA.md §5) y las declara en fotos.json
  py soul/preparar_fotos.py waldo-castor --ver                   solo muestra la medida, no escribe nada

Entrega en fotos.json, por imagen (ancha y vertical), `medida`:
  zona (izq|der|arriba), calma de cada candidata, recorte (object-position), sello (izq|der), y por direccion de marca
  (obra, taller, escenario): letra (oscura|clara), velo (0 a 1), p05 (contraste del 95 % de la zona) y modo (imagen|caja).
"""
import sys, os, json
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
# Los colores de cada direccion, los mismos de marca.js (DIRS): letra oscura = cla.ink, velo oscuro = osc.bg,
# letra clara = osc.ink, velo claro = cla.bg. Son los que pinta el sitio: se mide con lo que se va a ver.
DIRS = {
    'obra':      {'letra_osc': '#0B1E30', 'velo_osc': '#0B1E30', 'letra_cla': '#EAF2F8', 'velo_cla': '#EEF2F5'},
    'taller':    {'letra_osc': '#2A1C10', 'velo_osc': '#2B1D12', 'letra_cla': '#F7EDDA', 'velo_cla': '#F2E3C6'},
    'escenario': {'letra_osc': '#0B0A0D', 'velo_osc': '#0B0A0D', 'letra_cla': '#F4F1EC', 'velo_cla': '#F4F1EC'},
}
PISO = 6.0        # contraste pedido al 95 % de la ZONA (mas que 4,5 a proposito: una palabra cae sobre algo mas oscuro que el promedio)
CALMA_MAX = 0.28  # sobre esto la zona esta ocupada: modo CAJA
VELO_MAX = 0.78   # un velo mas fuerte que esto ya no deja ver la imagen: modo CAJA
# Tamanos y calidad del sitio (PORTADA.md §5): sin tratamiento, solo escala y WebP
# 24-11-2026: la vertical a calidad 60 se veia pixelada y lavada en la cara (Sebastian). Un celular de 390 px con
# pantalla x3 pide ~1170 px de ancho: va una de 1080 (calidad 72, ~345 KB, bajo el tope de 350 de probar_sitio) y otra
# de 1536 (el original de Gemini) para pantallas x3. Lo que lavaba la cara era sobre todo el velo largo (sitio.css).
EXPORTA = {'ancha': [('portada-ancha-1920.webp', 1920, 70), ('portada-ancha-2560.webp', 2560, 64)],
           'vertical': [('portada-vertical-1080.webp', 1080, 72), ('portada-vertical-1536.webp', 1536, 68)]}


def rgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
def lin(v): v = v / 255.0; return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
def lum(a): l = lin(a); return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]
def cr(a, b): hi, lo = np.maximum(a, b), np.minimum(a, b); return (hi + 0.05) / (lo + 0.05)


def velo_necesario(zona, letra, velo):
    """Velo mas bajo (pasos de 0,02) con que el 95 % de la zona, mezclada con el velo como lo hace CSS, da PISO contra la letra."""
    lt = lum(letra)
    for a in np.arange(0, 1.0001, 0.02):
        c = cr(lum(zona * (1 - a) + velo * a), lt)
        if np.percentile(c, 5) >= PISO:
            return round(float(a), 2), round(float(np.percentile(c, 5)), 2)
    return 1.0, 0.0


def medir(ruta):
    """La regla de PORTADA.md §4 (a), igual a _zona.py de Visu, para las tres direcciones de una vez."""
    im = Image.open(ruta).convert('RGB'); W, H = im.size
    ancha = W >= H
    k = 192 / max(W, H); im = im.resize((max(1, round(W * k)), max(1, round(H * k))), Image.LANCZOS)
    a = np.asarray(im, float); h, w = a.shape[:2]
    Y = lum(a)
    # el detalle se mide en grueso (64 px de lado mayor): el grano de la tierra o de un muro no cuenta; un objeto o una cara si
    g = lum(np.asarray(im.resize((max(1, round(w / 3)), max(1, round(h / 3))), Image.LANCZOS), float))
    dg = np.zeros_like(g); dg[:, 1:] += np.abs(np.diff(g, axis=1)); dg[1:, :] += np.abs(np.diff(g, axis=0))
    det = np.asarray(Image.fromarray((dg * 1000).astype('float32')).resize((w, h), Image.BILINEAR), float) / 1000
    cand = ({'izq': (0.04, 0.48, 0.20, 0.90), 'der': (0.52, 0.96, 0.20, 0.90)} if ancha else {'arriba': (0.05, 0.95, 0.09, 0.40)})
    box = lambda z: (slice(round(z[2] * h), round(z[3] * h)), slice(round(z[0] * w), round(z[1] * w)))
    base = float(np.median(Y)) + 0.05          # en una imagen oscura los mismos objetos dan saltos de luz mas chicos
    calma = {n: float(det[box(z)].mean()) / base for n, z in cand.items()}
    zona_n = min(calma, key=calma.get); zb = box(cand[zona_n]); zona = a[zb].reshape(-1, 3)
    dirs = {}
    for dn, c in DIRS.items():
        aO, cO = velo_necesario(zona, rgb(c['letra_cla']), rgb(c['velo_osc']))   # letra clara, velo oscuro
        aC, cC = velo_necesario(zona, rgb(c['letra_osc']), rgb(c['velo_cla']))   # letra oscura, velo claro
        letra, alfa, con = ('clara', aO, cO) if aO <= aC else ('oscura', aC, cC)   # se toca la imagen lo menos posible; empate: clara
        dirs[dn] = {'letra': letra, 'velo': alfa, 'p05': con, 'modo': 'caja' if calma[zona_n] > CALMA_MAX or alfa > VELO_MAX else 'imagen'}
    fuera = det.copy(); fuera[zb] = 0; s = fuera.sum() or 1
    fx = float((fuera.sum(axis=0) * np.arange(w)).sum() / s / (w - 1)); fy = float((fuera.sum(axis=1) * np.arange(h)).sum() / s / (h - 1))
    # recorte: en ancha se ancla al lado vertical donde esta la persona (no se le corta la cabeza); en vertical, arriba (el titular no se mueve)
    recorte = f'{round(fx * 100)}% {"100%" if fy >= 0.5 else "0%"}' if ancha else '50% 0%'
    # sello: en ancha, abajo en el borde interior de la zona (el lado lo da la zona); en vertical, la esquina de abajo con menos detalle
    q = lambda x0, x1: float(det[round(0.84 * h):, round(x0 * w):round(x1 * w)].mean())
    sello = zona_n if ancha else ('der' if q(0.70, 1) <= q(0, 0.30) else 'izq')
    return {'formato': 'ancha' if ancha else 'vertical', 'zona': zona_n, 'calma': {n: round(v, 2) for n, v in calma.items()},
            'foco': f'{round(fx * 100)}% {round(fy * 100)}%', 'recorte': recorte, 'sello': sello, 'dirs': dirs}


def exportar(origen, carpeta, formato):
    im = Image.open(origen).convert('RGB'); W, H = im.size; out = []
    for nombre, ancho, q in EXPORTA[formato]:
        if ancho > W and out: continue     # no se agranda: si el original no alcanza, queda solo el tamano menor
        a = min(ancho, W); r = im.resize((a, round(H * a / W)), Image.LANCZOS)
        ruta = os.path.join(carpeta, nombre); r.save(ruta, quality=q, method=6)
        print(f'  {nombre} {r.size[0]}x{r.size[1]} {round(os.path.getsize(ruta) / 1024)} KB')
        out.append((nombre, r.size[0], r.size[1]))
    return out


def main(argv):
    if not argv or argv[0].startswith('-'):
        print(__doc__); return 2
    slug = argv[0]; arg = argv[1:]
    op = lambda k: arg[arg.index(k) + 1] if k in arg else None
    carpeta = os.path.join(AQUI, 'fotos', slug); fj = os.path.join(carpeta, 'fotos.json')
    if not os.path.isdir(carpeta): print('No existe la carpeta', carpeta); return 1
    F = json.load(open(fj, encoding='utf-8')) if os.path.exists(fj) else {'version': 1}
    P = F.get('portada') if isinstance(F.get('portada'), dict) else {}
    for formato in ('ancha', 'vertical'):
        o = op('--' + formato)
        if o:
            hechos = exportar(o, carpeta, formato)
            P[formato] = {'src': hechos[0][0], 'w': hechos[0][1], 'h': hechos[0][2]}
            if len(hechos) > 1: P[formato]['srcset'] = [[n, ww] for n, ww, _ in hechos]
    if 'src' in P and ('ancha' in P or 'vertical' in P):   # la portada de una sola imagen (formato viejo) queda reemplazada
        for k in ('src', 'w', 'h'): P.pop(k, None)
    medidas = {}
    for formato in ('ancha', 'vertical'):
        x = P.get(formato)
        if not x or not x.get('src'): continue
        ruta = os.path.join(carpeta, x['src'])
        if not os.path.exists(ruta): print('Falta la imagen', ruta); return 1
        m = medir(ruta)
        if m['formato'] != formato: print(f'Ojo: {x["src"]} se declaró {formato} pero es {m["formato"]}')
        m.pop('formato'); x['medida'] = m; medidas[formato] = m
        print(f'{formato}: {x["src"]} · zona {m["zona"]} · calma {m["calma"]} · recorte {m["recorte"]} · sello {m["sello"]}')
        for dn, d in m['dirs'].items(): print(f'   {dn:9} letra {d["letra"]:6} velo {d["velo"]:.2f}  p05 {d["p05"]:.2f}  {d["modo"]}')
    if '--ver' in arg: return 0
    if not medidas and not P: print('fotos.json no declara imagen de portada: el sitio sale con la ilustración del oficio.')
    if P: F['portada'] = P
    with open(fj, 'w', encoding='utf-8', newline='\n') as f: f.write(json.dumps(F, ensure_ascii=False, indent=1) + '\n')
    ix = os.path.join(AQUI, 'fotos', 'index.json')
    I = json.load(open(ix, encoding='utf-8')) if os.path.exists(ix) else {}
    if slug not in I:
        I[slug] = 1
        with open(ix, 'w', encoding='utf-8', newline='\n') as f: f.write(json.dumps(I, ensure_ascii=False, indent=1) + '\n')
    print('Escrito', fj)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
