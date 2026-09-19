# -*- coding: utf-8 -*-
"""Construye la propuesta de app Tripu.

Genera dos cosas a partir de este solo archivo:
  canvas/     los 9 artboards en formato .dc.html + canvas.json, tal como viven en el
              canvas de Claude (https://claude.ai/artifact/5EE7sUe3hPyKaojunKWTuA)
  pantallas/  la misma propuesta como HTML normal, para verla en compai.cl

Uso:  python3 _construir.py
"""
import json, os, re, datetime
AQUI = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(AQUI, "canvas")
HERO = "/_blob/45b497625aa12015b12414cd5af5507b"   # en el canvas; en pantallas/ se reemplaza por media/

# ---------- tokens ----------
INDIGO="#1B0088"; DEEP="#10004F"; NIGHT="#0B0038"; CORAL="#D6103F"; INK="#16123A"; MUTED="#5B5780"
GROUND="#F3F2F9"; LINE="#E3E1EE"; WHITE="#FFFFFF"; LAV="#ECE9F8"
CATS = {
 "seguridad":   ("Seguridad",            "#1B0088", "#ECE9F8"),
 "otp":         ("OTP",                  "#0A4FB5", "#E4EDFB"),
 "hbc":         ("Hospitalidad (HBC)",   "#B5103A", "#FBE4EA"),
 "pernocte":    ("Pernocte",             "#5A1FB8", "#EFE6FB"),
 "uniforme":    ("Uniforme",             "#0B6E63", "#E0F3F0"),
 "preparacion": ("Preparación de vuelo", "#1B6B32", "#E3F3E7"),
}
FONTS = '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&amp;family=Nunito+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet">'

# ---------- icons (stroke svg, currentColor) ----------
def ic(name, size=20, sw=1.8):
    P = {
     "home": '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
     "compass": '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
     "file": '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
     "bookmark": '<path d="M6 3h12v18l-6-4-6 4z"/>',
     "camera": '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
     "grid": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
     "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
     "bell": '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
     "search": '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
     "plus": '<path d="M12 5v14M5 12h14"/>',
     "thumb": '<path d="M7 10v11H3V10z"/><path d="M7 10l4-7c1.5 0 2.5 1 2.5 2.5V9h5.5a2 2 0 012 2.3l-1.2 7A2 2 0 0117.8 20H7"/>',
     "comment": '<path d="M4 5h16v11H9l-5 4z"/>',
     "share": '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
     "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
     "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
     "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M17.5 14a6 6 0 014 6"/>',
     "moon": '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
     "shirt": '<path d="M8 4l4 2 4-2 5 3-2 4-2-1v11H7V10l-2 1-2-4z"/>',
     "clipboard": '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M9 11h6M9 15h6"/>',
     "award": '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5"/>',
     "star": '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.5l-5.6 2.9 1.1-6.3L3 9.7l6.2-.9z"/>',
     "chev": '<path d="M6 9l6 6 6-6"/>',
     "image": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
     "check": '<path d="M5 12l5 5L20 7"/>',
     "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
     "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
     "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
     "heart": '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',
     "eye": '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
     "back": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
     "upload": '<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>',
     "trash": '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
     "drag": '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
     "plane": '<path d="M21 13l-8-3V4.5A1.5 1.5 0 0011.5 3 1.5 1.5 0 0010 4.5V10l-8 3v2l8-2v4l-2 1.5V20l3.5-1 3.5 1v-1.5L13 17v-4l8 2z"/>',
     "seat": '<path d="M7 4h6v9h6v7H5V4z"/><path d="M7 13h6"/>',
     "belt": '<path d="M4 8h16v8H4z"/><path d="M9 8v8M15 8v8"/>',
     "box": '<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>',
     "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
     "sparkle": '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
     "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
     "settings": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
     "logout": '<path d="M10 4H5v16h5M14 8l5 4-5 4M19 12H9"/>',
     "filter": '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
     "flag": '<path d="M5 21V4h12l-2 4 2 4H5"/>',
    }
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, sw, P[name]))

CAT_ICON = {"seguridad":"shield","otp":"clock","hbc":"users","pernocte":"moon","uniforme":"shirt","preparacion":"clipboard"}

# ---------- shared css ----------
CSS = """
body{margin:0;font-family:'Nunito Sans',system-ui,sans-serif;color:%(ink)s;background:%(ground)s;-webkit-font-smoothing:antialiased}
a{color:%(indigo)s;text-decoration:none}a:hover{color:%(coral)s}
h1,h2,h3,h4{font-family:'Plus Jakarta Sans','Nunito Sans',sans-serif;margin:0;letter-spacing:-0.01em}
button,input,textarea,select{font:inherit;color:inherit}
button{cursor:pointer;border:0;background:none;padding:0}
.nav a{display:flex;align-items:center;gap:14px;height:48px;padding:0 20px;border-radius:12px;color:#CFC9F0;font-weight:600;font-size:15px}
.nav a:hover{background:rgba(255,255,255,.08);color:#fff}
.nav a.on{background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 3px 0 0 %(coral)s}
.chip{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:12px;background:#fff;border:1px solid %(line)s;font-weight:700;font-size:14px;color:%(ink)s}
.chip.on{background:%(indigo)s;color:#fff;border-color:%(indigo)s}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 20px;border-radius:12px;font-weight:700;font-size:15px}
.btn.p{background:%(coral)s;color:#fff}.btn.p:hover{background:#B80D35;color:#fff}
.btn.s{background:#fff;color:%(indigo)s;border:1.5px solid %(indigo)s}.btn.s:hover{background:%(lav)s;color:%(indigo)s}
.btn.g{background:%(lav)s;color:%(indigo)s}.btn.g:hover{background:#DDD8F3;color:%(indigo)s}
.iconbtn{width:44px;height:44px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:%(muted)s;background:#fff;border:1px solid %(line)s}
.iconbtn:hover{color:%(indigo)s;background:%(lav)s}
.card{background:#fff;border-radius:18px;border:1px solid %(line)s;box-shadow:0 1px 2px rgba(22,18,58,.04)}
.tag{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px 0 6px;border-radius:999px;font-size:13px;font-weight:700}
.tag i{width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-style:normal}
.meta{font-size:13px;color:%(muted)s}
.av{width:36px;height:36px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0}
.input{display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-radius:12px;background:#fff;border:1.5px solid %(line)s;color:%(muted)s;font-size:15px}
.input:focus-within{border-color:%(indigo)s}
.input input,.input textarea{border:0;outline:0;background:transparent;flex-grow:1;color:%(ink)s;min-width:0}
.tab{height:44px;padding:0 4px;display:inline-flex;align-items:center;font-weight:700;color:%(muted)s;border-bottom:3px solid transparent}
.tab.on{color:%(indigo)s;border-bottom-color:%(coral)s}
""" % dict(ink=INK,ground=GROUND,indigo=INDIGO,coral=CORAL,line=LINE,lav=LAV,muted=MUTED)

AV_COLORS = ["#1B0088","#0A4FB5","#B5103A","#5A1FB8","#0B6E63","#1B6B32","#8A4B00","#4A4A7A"]
def av(initials, i=0, size=36):
    return '<span class="av" style="width:%dpx;height:%dpx;background:%s;font-size:%dpx">%s</span>' % (size,size,AV_COLORS[i%len(AV_COLORS)], max(11,size*0.36), initials)

def tag(cat):
    name,fg,bg = CATS[cat]
    return '<span class="tag" style="background:%s;color:%s"><i style="background:%s">%s</i>%s</span>' % (bg,fg,fg,ic(CAT_ICON[cat],13,2.2),name)

def page(title, body, w, h, lang="es", extra_css=""):
    return """<!doctype html>
<html lang="%s">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
%s
<style>%s%s</style>
</helmet>
%s
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
renderVals() { return {}; }
}
</script>
</body>
</html>
""" % (lang, title, FONTS, CSS, extra_css, body, w, h)

# ---------- shared pieces ----------
NAV = [("inicio","home","Inicio"),("explorar","compass","Explorar buenas prácticas"),("mias","file","Mis publicaciones"),
       ("guardadas","bookmark","Guardadas"),("momentos","camera","Momentos LATAM"),("categorias","grid","Categorías"),("acerca","info","Acerca de")]

def sidebar(active, height):
    items = "".join('<a href="%s" class="%s">%s<span>%s</span></a>' % (
        {"inicio":"Main.dc.html","explorar":"Main.dc.html","mias":"Perfil.dc.html","guardadas":"Perfil.dc.html","momentos":"Momentos.dc.html","categorias":"Main.dc.html","acerca":"Main.dc.html"}[k],
        "on" if k==active else "", ic(icn,20), label) for k,icn,label in NAV)
    return """<aside style="width:240px;height:%dpx;flex-shrink:0;background:linear-gradient(180deg,%s 0%%,%s 100%%);color:#fff;display:flex;flex-direction:column;padding:28px 16px 24px;box-sizing:border-box;gap:28px">
  <div style="display:flex;align-items:center;gap:12px;padding:0 8px">
    <span style="width:40px;height:40px;border-radius:12px;background:%s;display:inline-flex;align-items:center;justify-content:center;color:#fff">%s</span>
    <div style="display:flex;flex-direction:column;line-height:1.1"><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px;letter-spacing:.06em">LATAM</span><span style="font-size:11px;letter-spacing:.18em;color:#CFC9F0">AIRLINES</span></div>
  </div>
  <nav class="nav" style="display:flex;flex-direction:column;gap:4px">%s</nav>
  <div style="flex-grow:1"></div>
  <a href="Publicar.dc.html" class="btn p" style="width:100%%;box-sizing:border-box">%s Compartir práctica</a>
  <div style="padding:16px 12px;border-radius:14px;background:rgba(255,255,255,.06);display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px"><span style="color:%s">%s</span><span>OTP<span style="color:%s">SYNC</span></span></div>
    <div style="font-size:12px;color:#CFC9F0">Juntos, cada vuelo cuenta.</div>
  </div>
</aside>""" % (height, INDIGO, NIGHT, CORAL, ic("plane",22,2), items, ic("plus",18,2.4), CORAL, ic("plane",20,2.2), CORAL)

def topbar(title, crumb=None):
    left = ('<a href="Main.dc.html" style="display:inline-flex;align-items:center;gap:8px;color:%s;font-weight:700;font-size:14px">%s %s</a>' % (MUTED, ic("back",18), crumb)) if crumb else ('<h1 style="font-size:24px;font-weight:800">%s</h1>' % title)
    return """<div style="display:flex;align-items:center;gap:16px;height:72px;padding:0 40px;background:#fff;border-bottom:1px solid %s;flex-shrink:0">
    %s
    <div style="flex-grow:1"></div>
    <label class="input" style="width:320px;height:44px"><span>%s</span><input type="search" placeholder="Buscar buenas prácticas…" aria-label="Buscar buenas prácticas"></label>
    <button class="iconbtn" aria-label="Notificaciones" style="position:relative">%s<span style="position:absolute;top:8px;right:8px;width:16px;height:16px;border-radius:999px;background:%s;color:#fff;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">3</span></button>
    <button style="display:flex;align-items:center;gap:10px;padding:4px 8px 4px 4px;border-radius:999px;border:1px solid %s;background:#fff" aria-label="Menú de cuenta">%s<span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.15"><span style="font-weight:800;font-size:14px">Rigo M.</span><span class="meta" style="font-size:12px">Jefe de Cabina · SCL</span></span>%s</button>
  </div>""" % (LINE, left, ic("search",18), ic("bell",20), CORAL, LINE, av("RM",0,36), ic("chev",16))

def likes(n, c):
    return '<span style="display:inline-flex;align-items:center;gap:14px;margin-left:auto"><span style="display:inline-flex;align-items:center;gap:6px;color:%s;font-weight:800;font-size:15px">%s %s</span><span style="display:inline-flex;align-items:center;gap:6px;color:%s;font-weight:700;font-size:14px">%s %s</span></span>' % (CORAL, ic("thumb",18,2), n, MUTED, ic("comment",18), c)

def practice_card(cat, title, desc, who, ini, ci, when, n, c, steps=None, badge=None):
    step_line = ('<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:%s">%s Paso a paso · %s pasos</div>' % (INDIGO, ic("image",16,2), steps)) if steps else ""
    badge_html = ('<span style="display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:#FFF1D6;color:#8A4B00;font-size:12px;font-weight:800">%s %s</span>' % (ic("sparkle",14,2.2), badge)) if badge else ""
    return """<article class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px;box-sizing:border-box">
    <div style="display:flex;align-items:center;gap:8px">%s%s<button class="iconbtn" style="margin-left:auto;width:36px;height:36px;border:0" aria-label="Guardar">%s</button></div>
    <h3 style="font-size:19px;font-weight:800;line-height:1.25"><a href="Detalle.dc.html" style="color:%s">%s</a></h3>
    <p style="margin:0;font-size:14px;line-height:1.5;color:%s;flex-grow:1">%s</p>
    %s
    <div style="display:flex;align-items:center;gap:10px;padding-top:12px;border-top:1px solid %s">%s<span style="display:flex;flex-direction:column;line-height:1.2"><span style="font-weight:800;font-size:13px">%s</span><span class="meta" style="font-size:12px">%s</span></span>%s</div>
  </article>""" % (tag(cat), badge_html, ic("bookmark",18), INK, title, MUTED, desc, step_line, LINE, av(ini,ci,34), who, when, likes(n,c))


_ic = ic
EXTRA = {
 "alert": '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17h.01"/>',
 "leaf": '<path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z"/><path d="M4 20l8-8"/>',
 "megaphone": '<path d="M3 10v4h3l8 5V5L6 10z"/><path d="M17 9a4 4 0 010 6"/>',
 "play": '<path d="M8 5l12 7-12 7z"/>',
 "video": '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
 "flame": '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 1-6 1-9z"/>',
 "smile": '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
 "meh": '<circle cx="12" cy="12" r="9"/><path d="M8 15h8M9 9h.01M15 9h.01"/>',
 "frown": '<circle cx="12" cy="12" r="9"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>',
}
def ic(name, size=20, sw=1.8):
    if name in EXTRA:
        return '<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, sw, EXTRA[name])
    return _ic(name, size, sw)
CATS.clear(); CATS.update({
 "seguridad":     ("Seguridad",               "#1B0088", "#ECE9F8"),
 "otp":           ("Puntualidad (OTP)",       "#0A4FB5", "#E4EDFB"),
 "hbc":           ("Hospitalidad (HBC)",      "#B5103A", "#FBE4EA"),
 "especiales":    ("Situaciones especiales",  "#9A3D00", "#FFE8D9"),
 "equipo":        ("Equipo y liderazgo",      "#5A1FB8", "#EFE6FB"),
 "bienestar":     ("Bienestar y pernocte",    "#0B6E63", "#E0F3F0"),
 "imagen":        ("Imagen y uniforme",       "#7A1F6E", "#F8E4F4"),
 "preparacion":   ("Preparación de vuelo",    "#1B6B32", "#E3F3E7"),
 "comunicacion":  ("Comunicación y anuncios", "#8A4B00", "#FFF1D6"),
 "sostenibilidad":("Sostenibilidad a bordo",  "#3C7A1E", "#E8F5DF"),
})
CAT_ICON.clear(); CAT_ICON.update({"seguridad":"shield","otp":"clock","hbc":"users","especiales":"alert","equipo":"award","bienestar":"moon","imagen":"shirt","preparacion":"clipboard","comunicacion":"megaphone","sostenibilidad":"leaf"})
APP = "Tripu"
W,H = 390,844

# ---------- mobile helpers ----------
def statusbar(dark=True):
    c = "#fff" if dark else INK
    return '<div style="height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;font-size:14px;font-weight:800;color:%s;flex-shrink:0"><span>9:41</span><span style="display:inline-flex;gap:6px;align-items:center">%s%s</span></div>' % (c, '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>', '<svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" aria-hidden="true"><rect x="0.5" y="0.5" width="22" height="11" rx="3"/><rect x="2.5" y="2.5" width="16" height="7" rx="1.5" fill="currentColor" stroke="none"/><path d="M24 4v4" stroke-width="1.5"/></svg>')

def tabbar(active):
    tabs = [("home","Inicio","Inicio.dc.html"),("compass","Explorar","Inicio.dc.html"),("plus","","Publicar.dc.html"),("camera","Momentos","Momentos.dc.html"),("award","Perfil","Perfil.dc.html")]
    out = []
    for i,t,href in tabs:
        if not t:
            out.append('<a href="%s" aria-label="Compartir buena práctica" style="width:56px;height:56px;border-radius:999px;background:%s;color:#fff;display:inline-flex;align-items:center;justify-content:center;margin-top:-28px;box-shadow:0 8px 20px rgba(214,16,63,.35)">%s</a>' % (href, CORAL, ic("plus",24,2.6)))
        else:
            on = (t==active)
            out.append('<a href="%s" style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:800;color:%s;width:64px;height:48px;justify-content:center">%s%s</a>' % (href, INDIGO if on else MUTED, ic(i,22,2.1 if on else 1.8), t))
    return '<nav style="position:absolute;left:0;right:0;bottom:0;height:84px;background:#fff;border-top:1px solid %s;display:flex;align-items:flex-start;justify-content:space-around;padding:8px 8px 0;box-sizing:border-box">%s<span style="position:absolute;bottom:8px;left:128px;width:134px;height:5px;border-radius:999px;background:%s"></span></nav>' % (LINE, "".join(out), INK)

def mheader(title, back_href="Inicio.dc.html", back_label="Volver", right=""):
    return """<header style="background:#fff;border-bottom:1px solid %s;flex-shrink:0;display:flex;flex-direction:column">%s
    <div style="height:52px;display:flex;align-items:center;gap:10px;padding:0 12px 0 8px"><a href="%s" aria-label="%s" class="iconbtn" style="border:0;color:%s">%s</a><h1 style="font-size:18px;font-weight:800;flex-grow:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</h1>%s</div>
  </header>""" % (LINE, statusbar(False), back_href, back_label, INK, ic("back",22,2.2), title, right)

def mroot(inner, bg=GROUND):
    return '<div style="width:%dpx;height:%dpx;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;background:%s;position:relative">%s</div>' % (W,H,bg,inner)

def mcard(cat,t,d,who,ini,ci,when,n,c,steps=None,badge=None):
    badge_html = ('<span style="display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;background:#FFF1D6;color:#8A4B00;font-size:11px;font-weight:800">%s %s</span>' % (ic("sparkle",12,2.2), badge)) if badge else ""
    return """<article class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">%s%s<button class="iconbtn" style="margin-left:auto;width:36px;height:36px;border:0" aria-label="Guardar">%s</button></div>
        <h3 style="font-size:17px;font-weight:800;line-height:1.25"><a href="Detalle.dc.html" style="color:%s">%s</a></h3>
        <p style="margin:0;font-size:13px;line-height:1.45;color:%s">%s</p>%s
        <div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid %s">%s<span style="display:flex;flex-direction:column;line-height:1.2"><span style="font-weight:800;font-size:12px">%s</span><span class="meta" style="font-size:11px">%s</span></span>%s</div>
      </article>""" % (tag(cat), badge_html, ic("bookmark",18), INK, t, MUTED, d, ('<div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:%s">%s Paso a paso · %d pasos</div>' % (INDIGO, ic("image",14,2), steps)) if steps else "", LINE, av(ini,ci,30), who, when, likes(n,c))

# ============ 1 ACCESO ============
def acceso():
    inner = """<section style="position:relative;height:400px;flex-shrink:0;background:linear-gradient(160deg,%s,%s);color:#fff;overflow:hidden;display:flex;flex-direction:column">
    <img src="%s" alt="" style="position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover;object-position:center;opacity:.6;-webkit-mask-image:linear-gradient(180deg,#000 30%%,transparent 100%%);mask-image:linear-gradient(180deg,#000 30%%,transparent 100%%)">
    <div style="position:relative">%s</div>
    <div style="position:relative;display:flex;align-items:center;gap:10px;padding:8px 24px"><span style="width:38px;height:38px;border-radius:11px;background:%s;display:inline-flex;align-items:center;justify-content:center">%s</span><div style="display:flex;flex-direction:column;line-height:1.1"><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px;letter-spacing:.06em">LATAM</span><span style="font-size:10px;letter-spacing:.18em;color:#CFC9F0">AIRLINES</span></div></div>
    <div style="position:relative;margin-top:auto;padding:0 24px 28px;display:flex;flex-direction:column;gap:8px"><span style="font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#FFB3C4">Buenas prácticas de la tripulación</span><h1 style="font-size:44px;font-weight:800;line-height:1">Tripu</h1><p style="margin:0;font-size:15px;line-height:1.45;color:#E7E3FF">Lo que nos hace volar más alto. De tripulantes, para tripulantes.</p></div>
  </section>
  <form style="display:flex;flex-direction:column;gap:14px;padding:24px 24px 0">
    <div style="display:flex;flex-direction:column;gap:6px"><label for="correo" style="font-weight:800;font-size:14px">Ingresa con tu correo LATAM</label><label class="input" style="height:52px"><span>%s</span><input id="correo" type="email" value="rigo.m" aria-label="Correo corporativo"><span style="font-weight:700;color:%s;font-size:14px">@latam.com</span></label></div>
    <a href="Inicio.dc.html" class="btn p" style="height:52px;font-size:16px">Continuar %s</a>
    <div style="display:flex;align-items:center;gap:12px;color:%s;font-size:12px"><span style="flex-grow:1;height:1px;background:%s"></span>o<span style="flex-grow:1;height:1px;background:%s"></span></div>
    <a href="Inicio.dc.html" class="btn s" style="height:48px;font-size:14px">%s Acceso único corporativo (SSO)</a>
    <p class="meta" style="margin:6px 0 0;font-size:12px;line-height:1.5;text-align:center">Espacio interno. Solo tripulantes con cuenta LATAM. Tu nombre y base acompañan cada aporte.</p>
  </form>
  <div style="margin-top:auto;padding:0 24px 24px;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px;color:%s"><span style="color:%s">%s</span><span>OTP<span style="color:%s">SYNC</span></span><span style="font-family:'Nunito Sans',sans-serif;font-weight:600;font-size:12px;color:%s;margin-left:4px">Juntos, cada vuelo cuenta.</span></div>""" % (INDIGO, NIGHT, HERO, statusbar(True), CORAL, ic("plane",20,2.2), ic("mail",18), INDIGO, ic("arrow",18,2.2), MUTED, LINE, LINE, ic("lock",18,2), INK, CORAL, ic("plane",18,2.2), CORAL, MUTED)
    return page("Acceso · Tripu", mroot(inner, "#fff"), W, H)

# ============ 2 INICIO ============
def inicio():
    def story(label, inner, ring, href="Momentos.dc.html"):
        return '<a href="%s" style="display:flex;flex-direction:column;align-items:center;gap:5px;width:60px;flex-shrink:0;color:%s"><span style="width:58px;height:58px;border-radius:999px;padding:3px;box-sizing:border-box;background:%s;display:inline-flex"><span style="width:100%%;height:100%%;border-radius:999px;background:#fff;display:inline-flex;align-items:center;justify-content:center;border:2px solid #fff;box-sizing:border-box;overflow:hidden">%s</span></span><span style="font-size:11px;font-weight:800;white-space:nowrap">%s</span></a>' % (href, INK, ring, inner, label)
    stories = story("Tu historia", '<span style="color:%s">%s</span>' % (INDIGO, ic("plus",22,2.6)), "repeating-linear-gradient(45deg,#B9B3DD 0 4px,transparent 4px 8px)", "Publicar.dc.html") + \
              story("Reto", '<span style="color:%s">%s</span>' % (CORAL, ic("flag",22,2.2)), "linear-gradient(135deg,#D6103F,#FF8FA8)", "Detalle.dc.html") + \
              story("Cultura", '<span style="color:%s">%s</span>' % (INDIGO, ic("video",22,2.2)), "linear-gradient(135deg,#1B0088,#6B4BFF)") + \
              story("Base SCL", av("SCL",1,50), "linear-gradient(135deg,#0A4FB5,#5FA3FF)") + \
              story("Valentina", av("VS",3,50), "linear-gradient(135deg,#D6103F,#FF8FA8)") + \
              story("Javier", av("JP",6,50), "linear-gradient(135deg,#0B6E63,#4FD1BF)")
    mensaje = '<a href="Momentos.dc.html" class="card" style="padding:10px;display:flex;gap:12px;align-items:center;color:%s"><span style="width:96px;height:64px;border-radius:10px;background:linear-gradient(135deg,%s,%s);display:inline-flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;position:relative">%s<span style="position:absolute;right:6px;bottom:4px;font-size:10px;font-weight:800;background:rgba(0,0,0,.4);padding:1px 6px;border-radius:999px">0:48</span></span><span style="display:flex;flex-direction:column;gap:3px;line-height:1.3;min-width:0"><span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:%s">Mensaje de la semana · Video</span><span style="font-weight:800;font-size:13px">“Por qué el chequeo cruzado nos une”</span><span class="meta" style="font-size:11px">Rigo M. · Cultura Organizacional</span></span></a>' % (INK, INDIGO, NIGHT, ic("play",26,2.2), CORAL)
    cards = mensaje + mcard("seguridad","Chequeo de 4 minutos antes del despegue","Un recorrido con orden fijo para que nada se escape. Con fotos de cada paso.","Rigo M.","RM",0,"Hace 2 días",201,32,5,"Reto de la semana") + mcard("hbc","Detalles que marcan la diferencia","Recordar el nombre y las preferencias de nuestros HBC crea conexiones que se recuerdan.","Valentina S.","VS",3,"Hace 6 horas",154,21) + mcard("otp","Comunicación efectiva con puertas","Avisar a tierra en cuanto la cabina está lista acorta minutos que se notan.","Carlos M.","CM",1,"Hace 4 horas",96,9)
    inner = """<header style="background:linear-gradient(120deg,%s,%s);color:#fff;padding:0 20px 18px;display:flex;flex-direction:column;gap:12px;flex-shrink:0">%s
    <div style="display:flex;align-items:center;gap:10px"><span style="width:34px;height:34px;border-radius:10px;background:%s;display:inline-flex;align-items:center;justify-content:center">%s</span><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:16px;letter-spacing:.06em">LATAM</span><a href="Notificaciones.dc.html" class="iconbtn" aria-label="Notificaciones" style="margin-left:auto;width:40px;height:40px;position:relative;background:rgba(255,255,255,.12);border-color:transparent;color:#fff">%s<span style="position:absolute;top:6px;right:6px;width:14px;height:14px;border-radius:999px;background:%s;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center">3</span></a><a href="Perfil.dc.html" aria-label="Mi perfil">%s</a></div>
    <div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:12px;color:#FFB3C4;font-weight:800;letter-spacing:.1em;text-transform:uppercase">Hola, Rigo</span><h1 style="font-size:30px;font-weight:800;line-height:1">Tripu</h1><span style="font-size:13px;color:#E7E3FF;font-weight:700">Lo que nos hace volar más alto.</span></div>
    <label class="input" style="height:44px;border-color:transparent"><span>%s</span><input type="search" placeholder="Buscar una práctica, un tema, un compañero…" aria-label="Buscar buenas prácticas"></label>
  </header>
  <div style="display:flex;gap:14px;padding:12px 20px 0;overflow:hidden;flex-shrink:0">%s</div>
  <div style="display:flex;gap:8px;padding:12px 20px 4px;overflow:hidden;flex-shrink:0"><button class="chip on" style="height:36px;font-size:12px;flex-shrink:0">Todas</button><button class="chip" style="height:36px;font-size:12px;flex-shrink:0">%s Seguridad</button><button class="chip" style="height:36px;font-size:12px;flex-shrink:0">%s OTP</button><button class="chip" style="height:36px;font-size:12px;flex-shrink:0">%s HBC</button><button class="chip" style="height:36px;font-size:12px;flex-shrink:0">%s Especiales</button></div>
  <div style="display:flex;flex-direction:column;gap:10px;padding:8px 20px 100px;flex-grow:1;overflow:hidden">
    <a href="Detalle.dc.html" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(90deg,#FFF1D6,#FFE3EC);border:1px solid #FFD3A6;font-size:12px;line-height:1.35;color:%s"><span style="color:%s;flex-shrink:0">%s</span><span><b>Reto de la semana:</b> ¿cómo haces el chequeo de 4 minutos? 18 versiones publicadas.</span><span style="color:%s;flex-shrink:0">%s</span></a>
    <div class="card" style="padding:12px;display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;gap:8px"><span style="color:%s">%s</span><span style="font-weight:800;font-size:13px">Pulso rápido</span><span class="meta" style="font-size:11px;margin-left:auto">Anónimo · 1 toque</span></div><span style="font-size:13px;font-weight:700">¿Cómo estuvo tu último vuelo?</span><div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:6px"><button class="chip" style="height:40px;font-size:12px;justify-content:center;color:#1B6B32">%s Volamos alto</button><button class="chip" style="height:40px;font-size:12px;justify-content:center">%s Normal</button><button class="chip" style="height:40px;font-size:12px;justify-content:center;color:#9A3D00">%s Pesado</button></div></div>
    %s
  </div>
  %s""" % (INDIGO, NIGHT, statusbar(True), CORAL, ic("plane",18,2.2), ic("bell",18), CORAL, av("RM",0,40), ic("search",18), stories, ic("shield",14,2.2), ic("clock",14,2.2), ic("users",14,2.2), ic("alert",14,2.2), INK, CORAL, ic("flag",18,2.2), MUTED, ic("arrow",16,2.2), INDIGO, ic("chart",16,2.2), ic("smile",16,2.2), ic("meh",16,2.2), ic("frown",16,2.2), cards, tabbar("Inicio"))
    return page("Inicio · Tripu", mroot(inner), W, H)

# ============ 3 DETALLE ============
def detalle():
    steps = [("seat","Asientos y cinturones","Respaldos verticales, mesas plegadas y cinturones abrochados. Empiezo por la fila 1 sin saltar filas.","0:00"),
             ("box","Compartimentos superiores","Cierro y verifico con la mano cada compartimento. Si algo cruje, lo abro y reacomodo.","0:50"),
             ("belt","Pasillo y salidas","Pasillo libre, equipaje bajo el asiento delantero, filas de salida con pasajeros informados.","1:40"),
             ("clipboard","Galley asegurado","Carros frenados y trabados, cafeteras aseguradas, cortinas abiertas.","2:30"),
             ("check","Reporte y asiento","Chequeo cruzado con mi compañero, reporto cabina lista y me siento con el arnés.","3:20")]
    steps_html = "".join("""<li style="display:flex;gap:12px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:32px;flex-shrink:0"><span style="width:32px;height:32px;border-radius:999px;background:%s;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px">%d</span><span style="flex-grow:1;width:2px;background:%s"></span></div>
        <div class="card" style="flex-grow:1;padding:12px;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;min-width:0">
          <div style="height:120px;border-radius:10px;background:linear-gradient(135deg,#E9E5F8,#D9D2F1);display:flex;align-items:center;justify-content:center;gap:6px;color:%s;font-weight:700;font-size:12px">%s Foto del paso %d</div>
          <div style="display:flex;align-items:center;gap:8px"><span style="color:%s">%s</span><h3 style="font-size:15px;font-weight:800;flex-grow:1">%s</h3><span style="font-size:11px;font-weight:800;color:%s;background:%s;padding:3px 8px;border-radius:999px">%s</span></div>
          <p style="margin:0;font-size:13px;line-height:1.45;color:%s">%s</p>
        </div></li>""" % (INDIGO, i+1, LINE, INDIGO, ic("image",16), i+1, INDIGO, ic(icn,18,2), t, INDIGO, LAV, when, MUTED, d) for i,(icn,t,d,when) in enumerate(steps[:2]))
    more = '<li style="display:flex;gap:12px"><div style="width:32px;display:flex;justify-content:center"><span style="width:32px;height:32px;border-radius:999px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">3</span></div><a href="Detalle.dc.html" class="card" style="flex-grow:1;padding:12px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:%s">%s Ver los 3 pasos restantes (2:20 más)</a></li>' % (LAV, INDIGO, INDIGO, ic("chev",16,2.4))
    versions = "".join('<a href="Detalle.dc.html" class="card" style="flex-shrink:0;width:200px;padding:12px;display:flex;flex-direction:column;gap:6px;color:%s"><div style="display:flex;align-items:center;gap:8px">%s<span style="font-weight:800;font-size:13px">%s</span><span style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;color:%s;font-weight:800;font-size:12px">%s %s</span></div><span style="font-size:12px;line-height:1.4;color:%s">“%s”</span></a>' % (INK, av(ini,ci,28), who, CORAL, ic("thumb",13,2.2), n, MUTED, q) for who,ini,ci,q,n in [("Camila T.","CT",3,"Empiezo por el galley y termino en fila 1.","64"),("Javier P.","JP",6,"En pareja: uno asientos, otro compartimentos.","41"),("Diego A.","DA",4,"Agrego una pasada a los baños antes del galley.","27")])
    right = '<button class="iconbtn" style="border:0" aria-label="Guardar">%s</button><button class="iconbtn" style="border:0" aria-label="Compartir">%s</button>' % (ic("bookmark",20), ic("share",20))
    inner = mheader("Seguridad", "Inicio.dc.html", "Volver al inicio", right) + """
  <div style="display:flex;flex-direction:column;gap:14px;padding:16px 20px 120px;flex-grow:1;overflow:hidden">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">%s<span style="display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;background:#E3F3E7;color:#1B6B32;font-size:11px;font-weight:800">%s Revisada por Seguridad</span></div>
    <h2 style="font-size:24px;font-weight:800;line-height:1.15">Chequeo de 4 minutos antes del despegue</h2>
    <div style="display:flex;align-items:center;gap:10px">%s<span style="display:flex;flex-direction:column;line-height:1.2"><span style="font-weight:800;font-size:13px">Rigo M. · Jefe de Cabina</span><span class="meta" style="font-size:12px">Base SCL · Hace 2 días · 1.240 vistas</span></span></div>
    <p style="margin:0;font-size:14px;line-height:1.5;color:%s">Mi forma de revisar la cabina en 4 minutos: un recorrido con orden fijo, siempre igual. El objetivo es el mismo para todos; esta es solo una manera de llegar.</p>
    <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column">%s%s</ol>
    <div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;align-items:center;gap:8px"><h3 style="font-size:15px;font-weight:800;display:flex;align-items:center;gap:6px">%s Así lo hago yo</h3><span class="meta" style="font-size:12px">18 versiones</span></div><div style="display:flex;gap:10px;overflow:hidden">%s</div></div>
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid %s;padding:12px 16px 28px;display:flex;align-items:center;gap:8px"><button class="btn g" style="height:46px;padding:0 14px;font-size:14px">%s 201</button><a href="Detalle.dc.html" class="btn g" style="height:46px;padding:0 14px;font-size:14px;color:%s">%s 32</a><a href="Publicar.dc.html" class="btn p" style="height:46px;flex-grow:1;font-size:14px">%s Subir mi versión</a></div>""" % (tag("seguridad"), ic("shield",12,2.4), av("RM",0,40), MUTED, steps_html, more, ic("users",18,2), versions, LINE, ic("thumb",18,2.2), INDIGO, ic("comment",18,2), ic("upload",18,2.2))
    return page("Práctica · Chequeo de 4 minutos", mroot(inner), W, H)

# ============ 4 PUBLICAR ============
def publicar():
    def step(n,title,text,filled):
        photo = ('<div style="height:96px;border-radius:10px;background:linear-gradient(135deg,#E9E5F8,#D9D2F1);display:flex;align-items:center;justify-content:center;gap:6px;color:%s;font-weight:700;font-size:12px">%s Foto cargada · tocar para cambiar</div>' % (INDIGO, ic("check",16,2.4))) if filled else ('<button type="button" style="height:96px;border-radius:10px;border:2px dashed #B9B3DD;background:#FAFAFE;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:%s;font-weight:700;font-size:12px;width:100%%">%s Tomar foto o grabar video</button>' % (INDIGO, ic("camera",20,2)))
        return """<div class="card" style="padding:12px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:8px"><span style="color:%s">%s</span><span style="width:28px;height:28px;border-radius:999px;background:%s;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">%d</span><span style="font-weight:800;font-size:13px">Paso %d</span><button type="button" class="iconbtn" style="border:0;margin-left:auto;width:36px;height:36px" aria-label="Eliminar paso">%s</button></div>
          %s
          <label class="input" style="height:42px;font-size:14px"><input type="text" value="%s" placeholder="Título del paso" aria-label="Título del paso %d"></label>
          <label class="input" style="height:auto;align-items:flex-start;padding:8px 14px;font-size:14px"><textarea rows="2" placeholder="¿Qué haces y por qué?" aria-label="Descripción del paso %d" style="resize:none;line-height:1.4">%s</textarea></label>
        </div>""" % (MUTED, ic("drag",18), INDIGO, n, n, ic("trash",16), photo, title, n, n, text)
    cat_chips = "".join('<button type="button" class="chip%s" style="height:36px;font-size:12px;flex-shrink:0">%s %s</button>' % (" on" if k=="seguridad" else "", ic(CAT_ICON[k],14), CATS[k][0].replace(" (HBC)","")) for k in CATS)
    inner = mheader("Compartir buena práctica", "Inicio.dc.html", "Cancelar", '<button type="button" style="font-weight:800;font-size:14px;color:%s;padding:0 4px">Guardar</button>' % INDIGO) + """
  <form style="display:flex;flex-direction:column;gap:14px;padding:16px 20px 110px;flex-grow:1;overflow:hidden">
    <p class="meta" style="margin:0;font-size:13px;line-height:1.45">Cuéntalo como a un compañero nuevo. Corto, claro y con fotos.</p>
    <label class="input" style="height:50px"><input type="text" value="Chequeo de 4 minutos antes del despegue" aria-label="Título"></label>
    <div style="display:flex;flex-direction:column;gap:6px"><span style="font-weight:800;font-size:13px">Categoría</span><div style="display:flex;gap:6px;overflow:hidden">%s</div></div>
    <label class="input" style="height:auto;align-items:flex-start;padding:10px 14px;font-size:14px"><textarea rows="2" style="resize:none;line-height:1.4" aria-label="Resumen">Mi forma de revisar la cabina en 4 minutos: un recorrido con orden fijo.</textarea></label>
    <div style="display:flex;align-items:center;gap:8px"><span style="font-weight:800;font-size:13px">Paso a paso</span><button type="button" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:%s">%s Relatar en audio</button></div>
    %s%s
    <button type="button" class="btn g" style="height:44px">%s Agregar paso</button>
  </form>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid %s;padding:12px 20px 28px;display:flex;flex-direction:column;gap:6px"><a href="Detalle.dc.html" class="btn p" style="height:50px;font-size:15px">%s Publicar</a><span class="meta" style="font-size:11px;text-align:center;line-height:1.4">Seguridad pasa por una revisión rápida de Cultura antes de aparecer.</span></div>""" % (cat_chips, INDIGO, ic("mic",14,2.2), step(1,"Asientos y cinturones","Respaldos verticales, mesas plegadas, cinturones abrochados.",True), step(2,"","",False), ic("plus",16,2.4), LINE, ic("upload",18,2.2))
    return page("Compartir buena práctica", mroot(inner), W, H)

# ============ 5 MOMENTOS ============
def momentos():
    bases = "".join('<span style="display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border-radius:999px;background:%s;color:%s;font-size:11px;font-weight:800;flex-shrink:0"><span style="opacity:.7">%d</span>%s<span style="font-weight:700">%s</span></span>' % (LAV if i==0 else "#fff", INDIGO if i==0 else INK, i+1, b, n) for i,(b,n) in enumerate([("SCL","1.204"),("LIM","980"),("GRU","875"),("BOG","610")]))
    tiles = [("Equipo SCL–LIM, vuelo 2417","Valentina S.","VS",3,"#2B1A7A","#5A1FB8",190),("Cumpleaños a 11.000 m","Diego A.","DA",4,"#0B6E63","#1FA394",150),
             ("Primer vuelo como Jefa de Cabina","Camila T.","CT",3,"#0A4FB5","#3B82F6",150),("Pernocte en GRU","Javier P.","JP",6,"#8A4B00","#E0892A",190)]
    def tile(i,t,who,ini,ci,c1,c2,h):
        return """<figure style="margin:0;height:%dpx;border-radius:14px;overflow:hidden;position:relative;background:linear-gradient(160deg,%s,%s);display:flex;flex-direction:column;justify-content:flex-end;padding:10px;box-sizing:border-box;color:#fff">
          <span style="position:absolute;left:10px;top:10px;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;background:rgba(0,0,0,.28);padding:3px 8px;border-radius:999px">%s Foto</span>
          <span style="position:absolute;right:10px;top:10px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;background:rgba(0,0,0,.28);padding:3px 8px;border-radius:999px">%s %d</span>
          <figcaption style="display:flex;flex-direction:column;gap:2px;line-height:1.2"><span style="font-weight:800;font-size:13px">%s</span><span style="font-size:11px;color:#E7E3FF">%s</span></figcaption></figure>""" % (h, c1, c2, ic("image",12,2.2), ic("heart",13,2.2), 40+i*17, t, who)
    col1 = tile(0,*tiles[0]) + tile(1,*tiles[1]); col2 = tile(2,*tiles[2]) + tile(3,*tiles[3])
    inner = mheader("Momentos LATAM", "Inicio.dc.html", "Volver", '<a href="Reconocer.dc.html" class="btn s" style="height:38px;padding:0 12px;font-size:13px">%s Reconocer</a>' % ic("award",16,2.2)) + """
  <div style="display:flex;flex-direction:column;gap:14px;padding:14px 20px 100px;flex-grow:1;overflow:hidden">
    <div class="card" style="padding:14px;display:flex;align-items:center;gap:12px;background:linear-gradient(160deg,%s,%s);color:#fff;border:0">%s<div style="display:flex;flex-direction:column;gap:2px;line-height:1.2;min-width:0"><span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#FFB3C4">Tripulante del mes</span><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:17px">Valentina S.</span><span style="font-size:12px;color:#E7E3FF">SCL · 154 “me sirve” y 9 reconocimientos</span></div><span style="margin-left:auto;color:#FFB3C4">%s</span></div>
    <div style="display:flex;align-items:center;gap:6px;overflow:hidden"><span style="font-size:11px;font-weight:800;color:%s;flex-shrink:0;display:inline-flex;align-items:center;gap:4px">%s Bases</span>%s</div>
    <div style="display:flex;gap:8px;overflow:hidden"><button class="chip on" style="height:36px;font-size:12px">Recientes</button><button class="chip" style="height:36px;font-size:12px">Más queridos</button><button class="chip" style="height:36px;font-size:12px">Mi base</button><button class="chip" style="height:36px;font-size:12px">Celebraciones</button></div>
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px"><div style="display:flex;flex-direction:column;gap:10px">%s</div><div style="display:flex;flex-direction:column;gap:10px">%s</div></div>
    <div class="card" style="padding:12px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;align-items:center;gap:8px">%s<span style="display:flex;flex-direction:column;line-height:1.2"><span style="font-weight:800;font-size:13px">Camila T.</span><span class="meta" style="font-size:11px">Reconocida en Seguridad por María José R.</span></span><span style="margin-left:auto;color:#E0892A">%s</span></div><p style="margin:0;font-size:12px;line-height:1.4;color:%s">“Se dio cuenta de una tapa mal cerrada que dos revisiones habían pasado.”</p></div>
  </div>
  <a href="Publicar.dc.html" aria-label="Subir un momento" style="position:absolute;right:20px;bottom:100px;height:48px;padding:0 18px;border-radius:999px;background:%s;color:#fff;display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:14px;box-shadow:0 8px 20px rgba(27,0,136,.35)">%s Subir momento</a>
  %s""" % (INDIGO, NIGHT, av("VS",3,48), ic("star",22,2.2), MUTED, ic("chart",13,2.4), bases, col1, col2, av("CT",3,32), ic("award",20,2), INK, INDIGO, ic("camera",18,2.2), tabbar("Momentos"))
    return page("Momentos LATAM", mroot(inner), W, H)

# ============ 6 RECONOCER ============
def reconocer():
    people = [("Camila T.","CT",3,"Tripulante · SCL",True),("Javier P.","JP",6,"Tripulante · SCL",False),("Valentina S.","VS",3,"Tripulante · LIM",False)]
    people_html = "".join('<button type="button" style="display:flex;align-items:center;gap:10px;height:52px;padding:0 12px;border-radius:12px;background:%s;border:1.5px solid %s;text-align:left">%s<span style="display:flex;flex-direction:column;line-height:1.2"><span style="font-weight:800;font-size:14px">%s</span><span class="meta" style="font-size:12px">%s</span></span>%s</button>' % (LAV if on else "#fff", INDIGO if on else LINE, av(ini,ci,34), who, role, ('<span style="margin-left:auto;color:%s">%s</span>' % (INDIGO, ic("check",18,2.6))) if on else "") for who,ini,ci,role,on in people)
    reasons = [("shield","Cuidó la seguridad",True),("users","Atención HBC",False),("clock","Puntualidad",False),("heart","Apoyó al equipo",False),("sparkle","Actitud LATAM",False)]
    reasons_html = "".join('<button type="button" class="chip%s" style="height:38px;font-size:12px">%s %s</button>' % (" on" if on else "", ic(i,14,2.2), t) for i,t,on in reasons)
    inner = mheader("Reconocer a un compañero", "Momentos.dc.html", "Volver") + """
  <form style="display:flex;flex-direction:column;gap:14px;padding:16px 20px 110px;flex-grow:1;overflow:hidden">
    <p class="meta" style="margin:0;font-size:13px;line-height:1.45">Un reconocimiento se publica en Momentos y llega al perfil de la persona. Cuesta 30 segundos y se recuerda semanas.</p>
    <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:800;font-size:13px">¿A quién?</span><label class="input" style="height:44px"><span>%s</span><input type="search" value="Cam" aria-label="Buscar compañero"></label><div style="display:flex;flex-direction:column;gap:6px">%s</div></div>
    <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:800;font-size:13px">¿Por qué?</span><div style="display:flex;gap:6px;flex-wrap:wrap">%s</div></div>
    <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:800;font-size:13px">Cuéntalo en una frase</span><label class="input" style="height:auto;align-items:flex-start;padding:10px 14px;font-size:14px"><textarea rows="3" style="resize:none;line-height:1.4" aria-label="Mensaje">Se dio cuenta de una tapa de compartimento mal cerrada que dos revisiones habían pasado. Ese ojo nos cuida a todos.</textarea></label></div>
    <label style="display:flex;align-items:center;gap:10px;font-size:13px"><input type="checkbox" checked style="width:20px;height:20px;accent-color:%s"> Mostrar en Momentos para toda la tripulación</label>
  </form>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:1px solid %s;padding:12px 20px 28px"><a href="Momentos.dc.html" class="btn p" style="height:50px;font-size:15px">%s Enviar reconocimiento</a></div>""" % (ic("search",18), people_html, reasons_html, INDIGO, LINE, ic("award",18,2.2))
    return page("Reconocer a un compañero", mroot(inner), W, H)

# ============ 7 PERFIL ============
def perfil():
    stats = [("14","Prácticas"),("1.312","Me sirve"),("9","Reconoc."),("5","Insignias")]
    stats_html = "".join('<div style="display:flex;flex-direction:column;align-items:center;line-height:1.1;flex-grow:1"><span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:20px">%s</span><span style="font-size:11px;color:#CFC9F0">%s</span></div>' % s for s in stats)
    badges = [("shield","Mentor de seguridad","#1B0088","#ECE9F8",False),("users","Anfitrión HBC","#B5103A","#FBE4EA",False),("clock","Puntual OTP","#0A4FB5","#E4EDFB",False),("star","Voz del equipo","#8A4B00","#FFF1D6",False),("camera","Cronista","#0B6E63","#E0F3F0",False),("lock","Instructor · 2/5","#5B5780","#EEEDF4",True)]
    badges_html = "".join('<div style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;%s"><span style="width:56px;height:56px;border-radius:18px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center">%s</span><span style="font-size:11px;font-weight:800;line-height:1.2">%s</span></div>' % ("opacity:.5" if lk else "", bg, fg, ic(i,26,2), t) for i,t,fg,bg,lk in badges)
    rows = [("seguridad","Chequeo de 4 minutos antes del despegue","201","32","Revisada"),("preparacion","Briefing con roles claros en 5 minutos","139","17","Revisada"),("seguridad","Recorrido con turbulencia anunciada","","","Borrador")]
    rows_html = "".join('<li style="display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid %s">%s<span style="display:flex;flex-direction:column;gap:3px;flex-grow:1;min-width:0"><a href="Detalle.dc.html" style="font-weight:800;font-size:13px;color:%s;line-height:1.25">%s</a><span style="display:flex;align-items:center;gap:8px">%s<span style="font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:%s;color:%s">%s</span></span></span>%s</li>' % (LINE, '<span style="width:36px;height:36px;border-radius:10px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">%s</span>' % (CATS[cat][2], CATS[cat][1], ic(CAT_ICON[cat],18,2)), INK, t, ('<span style="display:inline-flex;align-items:center;gap:4px;color:%s;font-weight:800;font-size:12px">%s %s</span><span style="display:inline-flex;align-items:center;gap:4px;color:%s;font-weight:700;font-size:12px">%s %s</span>' % (CORAL, ic("thumb",13,2.2), n, MUTED, ic("comment",13), c)) if n else "", "#E3F3E7" if st=="Revisada" else "#EEEDF4", "#1B6B32" if st=="Revisada" else MUTED, st, '<span style="color:%s">%s</span>' % (MUTED, ic("chev",16,2.2))) for cat,t,n,c,st in rows)
    inner = """<header style="background:linear-gradient(120deg,%s,%s);color:#fff;padding:0 20px 18px;display:flex;flex-direction:column;gap:14px;flex-shrink:0">%s
    <div style="display:flex;align-items:center;gap:12px">%s<div style="display:flex;flex-direction:column;gap:3px;line-height:1.15;min-width:0"><h1 style="font-size:22px;font-weight:800">Rigo M.</h1><span style="font-size:12px;color:#E7E3FF">Jefe de Cabina · Base SCL · desde 2014</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#FFB3C4">%s Cultura Organizacional</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#FFD3A6">%s Racha: 6 semanas seguidas aportando</span></div><a href="Perfil.dc.html" class="iconbtn" aria-label="Ajustes" style="margin-left:auto;background:rgba(255,255,255,.12);border-color:transparent;color:#fff">%s</a></div>
    <div style="display:flex;padding:10px 0;border-radius:12px;background:rgba(255,255,255,.08)">%s</div>
  </header>
  <div style="display:flex;flex-direction:column;gap:12px;padding:14px 20px 100px;flex-grow:1;overflow:hidden">
    <div style="display:flex;align-items:center"><h2 style="font-size:15px;font-weight:800;display:flex;align-items:center;gap:6px">%s Insignias</h2><span class="meta" style="margin-left:auto;font-size:12px">5 de 12</span></div>
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:12px 8px">%s</div>
    <div style="display:flex;gap:18px;border-bottom:1px solid %s;margin-top:4px"><button class="tab on" style="font-size:13px;height:40px">Mis prácticas · 14</button><button class="tab" style="font-size:13px;height:40px">Guardadas · 23</button><button class="tab" style="font-size:13px;height:40px">Versiones · 6</button></div>
    <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column">%s</ul>
  </div>
  %s""" % (INDIGO, NIGHT, statusbar(True), av("RM",0,64), ic("sparkle",12,2.2), ic("flame",12,2.2), ic("settings",20), stats_html, ic("award",18,2), badges_html, LINE, rows_html, tabbar("Perfil"))
    return page("Mi perfil", mroot(inner), W, H)

# ============ 8 NOTIFICACIONES ============
def notificaciones():
    items = [("comment","Valentina S. comentó tu práctica","“Yo agrego una pasada rápida a los baños antes del galley.”","Hace 1 hora",CORAL,"#FBE4EA",True,"Detalle.dc.html"),
             ("award","Recibiste un reconocimiento","María José R. te reconoció en Seguridad: “Ese ojo nos cuida a todos.”","Hace 3 horas","#8A4B00","#FFF1D6",True,"Perfil.dc.html"),
             ("users","Camila T. subió su versión","“Así lo hago yo” en Chequeo de 4 minutos. Ya son 18 versiones.","Ayer",INDIGO,LAV,True,"Detalle.dc.html"),
             ("shield","Tu práctica fue revisada","“Recorrido con turbulencia anunciada” ya está visible para toda la tripulación.","Ayer","#1B6B32","#E3F3E7",False,"Detalle.dc.html"),
             ("flag","Nuevo reto de la semana","Cultura propone: ¿cómo recibes a un HBC que llega tarde y apurado?","Hace 2 días",CORAL,"#FBE4EA",False,"Inicio.dc.html"),
             ("star","Eres top 3 de septiembre","612 “me sirve” recibidos. Sigue así.","Hace 3 días","#8A4B00","#FFF1D6",False,"Momentos.dc.html")]
    items_html = "".join('<a href="%s" style="display:flex;gap:12px;padding:14px 20px;background:%s;border-bottom:1px solid %s;color:%s"><span style="width:40px;height:40px;border-radius:12px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">%s</span><span style="display:flex;flex-direction:column;gap:3px;line-height:1.3;min-width:0"><span style="font-weight:800;font-size:14px">%s</span><span style="font-size:13px;color:%s">%s</span><span class="meta" style="font-size:11px">%s</span></span>%s</a>' % (href, "#fff" if new else GROUND, LINE, INK, bg, fg, ic(i,20,2), t, MUTED, d, when, ('<span style="width:8px;height:8px;border-radius:999px;background:%s;flex-shrink:0;margin-top:6px"></span>' % CORAL) if new else "") for i,t,d,when,fg,bg,new,href in items)
    inner = mheader("Notificaciones", "Inicio.dc.html", "Volver", '<button style="font-weight:800;font-size:13px;color:%s;padding:0 4px">Marcar leídas</button>' % INDIGO) + '<div style="display:flex;flex-direction:column;flex-grow:1;overflow:hidden;padding-bottom:84px">%s</div>%s' % (items_html, tabbar(""))
    return page("Notificaciones", mroot(inner), W, H)

# ============ 9 PROPUESTA (lámina con diagrama) ============
def propuesta():
    PW,PH = 1440,1360
    def box(title, items, fg, bg, icn):
        li = "".join('<li style="display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4"><span style="color:%s;flex-shrink:0;margin-top:2px">%s</span><span>%s</span></li>' % (fg, ic("check",14,2.6), it) for it in items)
        return '<div class="card" style="padding:16px 18px;display:flex;flex-direction:column;gap:10px;border-top:4px solid %s"><div style="display:flex;align-items:center;gap:10px"><span style="width:36px;height:36px;border-radius:10px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center">%s</span><h3 style="font-size:16px;font-weight:800">%s</h3></div><ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px">%s</ul></div>' % (fg, bg, fg, ic(icn,20,2), title, li)
    modules = [
      box("1 · Acceso", ["Correo @latam.com o acceso único (SSO)","Sin registro ni contraseñas nuevas","Nombre y base visibles en cada aporte"], "#0A4FB5","#E4EDFB","lock"),
      box("2 · Buenas prácticas", ["Paso a paso con foto o video desde el celular","10 categorías (ver lista abajo)","Relato en audio opcional para grabar en pernocte"], INDIGO, LAV, "clipboard"),
      box("3 · Participación", ["“Me sirve” y comentarios con respuestas","“Así lo hago yo”: versiones del mismo procedimiento","Reto de la semana propuesto por Cultura"], CORAL, "#FBE4EA", "comment"),
      box("4 · Cultura LATAM", ["Momentos: fotos de equipo y celebraciones","Reconocimientos entre compañeros en 30 segundos","Tripulante del mes e insignias por aportar"], "#0B6E63","#E0F3F0","heart"),
      box("5 · Cuidado del contenido", ["Seguridad se revisa antes de publicarse","Sin datos de pasajeros ni documentos","Reportar en un toque; Cultura modera"], "#8A4B00","#FFF1D6","shield"),
    ]
    flow = [("Entra con su correo","Acceso.dc.html","lock"),("Explora el inicio","Inicio.dc.html","home"),("Abre un paso a paso","Detalle.dc.html","image"),("Sube su versión","Publicar.dc.html","upload"),("Reconoce a alguien","Reconocer.dc.html","award"),("Suma insignias","Perfil.dc.html","star")]
    flow_html = "".join(('<a href="%s" class="card" style="padding:12px 14px;display:flex;align-items:center;gap:10px;flex-grow:1;color:%s;font-weight:800;font-size:13px;line-height:1.3"><span style="width:30px;height:30px;border-radius:999px;background:%s;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">%s</span>%s</a>' % (href, INK, INDIGO, ic(icn,15,2.2), t)) + (('<span style="color:%s;flex-shrink:0">%s</span>' % (MUTED, ic("arrow",20,2.2))) if i < len(flow)-1 else "") for i,(t,href,icn) in enumerate(flow))
    build = [("Tipo de app","App web instalable (PWA). Se abre desde un link y se agrega a la pantalla de inicio. Funciona en iPhone y Android sin pasar por las tiendas. Si LATAM lo pide, se empaqueta después para App Store y Play.", "plane"),
             ("Acceso","Con la cuenta corporativa que ya existe (SSO). El equipo de TI de LATAM solo autoriza la app; no se crean usuarios nuevos.", "lock"),
             ("Panel para Cultura","Vista web para Rigo y su equipo: revisar Seguridad, elegir tripulante del mes, lanzar retos y ver participación por base.", "chart"),
             ("Notificaciones","Avisos al celular cuando comentan tu práctica, te reconocen o hay un reto nuevo.", "bell")]
    build_html = "".join('<div class="card" style="padding:14px 16px;display:flex;gap:12px;align-items:flex-start"><span style="width:36px;height:36px;border-radius:10px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">%s</span><span style="display:flex;flex-direction:column;gap:3px;line-height:1.4"><span style="font-weight:800;font-size:14px">%s</span><span class="meta" style="font-size:13px">%s</span></span></div>' % (LAV, INDIGO, ic(i,18,2), t, d) for t,d,i in build)
    phases = [("Fase 1 · Piloto","4 a 6 semanas · base SCL","Acceso, inicio, publicar paso a paso, comentarios y “me sirve”. Meta: 50 prácticas y 200 tripulantes activos.", INDIGO),
              ("Fase 2 · Cultura","Después del piloto","Momentos, reconocimientos, tripulante del mes, insignias y reto de la semana.", CORAL),
              ("Fase 3 · Escala","Todas las bases","Notificaciones, panel de métricas por base, versiones en audio y publicación en tiendas si se requiere.", "#0B6E63")]
    phases_html = "".join('<div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:4px;flex-grow:1;border-left:4px solid %s"><span style="font-weight:800;font-size:14px">%s</span><span style="font-size:12px;font-weight:800;color:%s">%s</span><span class="meta" style="font-size:13px;line-height:1.4">%s</span></div>' % (c, t, c, w, d) for t,w,d,c in phases)
    metrics = [("Prácticas publicadas","por mes"),("Tripulantes activos","que entran cada semana"),("Versiones por práctica","cuántas formas de hacer lo mismo"),("Reconocimientos","enviados entre compañeros")]
    metrics_html = "".join('<div style="display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:12px;background:%s;line-height:1.25"><span style="font-weight:800;font-size:13px;color:%s">%s</span><span class="meta" style="font-size:12px">%s</span></div>' % (LAV, INDIGO, t, d) for t,d in metrics)
    names = [("Tripu","Recomendado","Así se llaman entre ellos. Corto, cercano, se dice en un segundo. Tagline: “Lo que nos hace volar más alto”.",True),("Cabina Abierta","Alternativa","Dice lo que es: un espacio abierto para hablar de la cabina sin formalidad.",False),("Volamos Juntos","Alternativa","Más institucional. Sirve si Cultura quiere un nombre que suene a campaña.",False)]
    names_html = "".join('<div class="card" style="padding:16px 18px;display:flex;flex-direction:column;gap:6px;%s"><div style="display:flex;align-items:center;gap:8px"><span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:24px;color:%s">%s</span><span style="margin-left:auto;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;background:%s;color:%s">%s</span></div><span class="meta" style="font-size:13px;line-height:1.4">%s</span></div>' % ("border:2px solid %s" % INDIGO if rec else "", INDIGO if rec else INK, n, CORAL if rec else "#EEEDF4", "#fff" if rec else MUTED, t, d) for n,t,d,rec in names)
    cats_html = "".join('<span class="tag" style="background:%s;color:%s;height:32px"><i style="background:%s">%s</i>%s</span>' % (bg,fg,fg,ic(CAT_ICON[k],13,2.2),name) for k,(name,fg,bg) in CATS.items())
    mech = [("award","Reconocimiento entre pares","Cualquiera reconoce a cualquiera en 30 segundos. Se publica en Momentos y queda en el perfil.","Pantalla 7"),
            ("video","Historias y video corto","Historias de 24 h y mensajes en video de un minuto desde Cultura. Formato que la gente ya usa a diario.","Pantalla 2"),
            ("flame","Gamificación con sentido","Insignias, rachas y ranking de bases. Se gana por aportar, no por mirar.","Pantallas 6 y 8"),
            ("flag","Retos semanales","Cultura lanza un reto; la tripulación responde con sus versiones. Mismo objetivo, distintas formas.","Pantallas 2 y 3"),
            ("chart","Pulso anónimo","Una pregunta, un toque. Cultura ve el ánimo por base sin encuestas largas.","Pantalla 2"),
            ("users","Contenido hecho por la tripulación","Todo lo publica la gente, no comunicaciones. Cultura cura y destaca, no redacta.","Todas")]
    mech_html = "".join('<div class="card" style="padding:14px 16px;display:flex;gap:12px;align-items:flex-start"><span style="width:36px;height:36px;border-radius:10px;background:%s;color:%s;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">%s</span><span style="display:flex;flex-direction:column;gap:3px;line-height:1.4;min-width:0"><span style="display:flex;align-items:center;gap:8px"><span style="font-weight:800;font-size:14px">%s</span><span style="margin-left:auto;font-size:11px;font-weight:800;color:%s;white-space:nowrap">%s</span></span><span class="meta" style="font-size:13px">%s</span></span></div>' % ("#FBE4EA", CORAL, ic(i,18,2), t, INDIGO, w, d) for i,t,d,w in mech)
    body = """<div style="width:%dpx;height:%dpx;box-sizing:border-box;overflow:hidden;background:%s;padding:36px 40px;display:flex;flex-direction:column;gap:20px">
  <div style="display:flex;align-items:flex-end;gap:16px">
    <div style="display:flex;flex-direction:column;gap:6px"><span style="display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:%s">%s Propuesta de app · Mapa del proyecto</span><h1 style="font-size:32px;font-weight:800">Tripu: la app de buenas prácticas de la tripulación LATAM</h1><p class="meta" style="margin:0;font-size:15px">Una app en el celular, cinco módulos, diez categorías, tres roles. Cada pantalla del canvas responde a una parte de este mapa.</p></div>
    <div style="margin-left:auto;display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:%s;color:#fff"><span style="width:40px;height:40px;border-radius:12px;background:%s;display:inline-flex;align-items:center;justify-content:center">%s</span><span style="display:flex;flex-direction:column;line-height:1.2"><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:16px">Tripu</span><span style="font-size:12px;color:#CFC9F0">Impulsa: Rigo M. · Cultura Organizacional</span></span></div>
  </div>
  <div style="display:grid;grid-template-columns:minmax(0, 1fr) minmax(0, 1.4fr);gap:24px">
    <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Nombre propuesto</h2><div style="display:flex;flex-direction:column;gap:10px">%s</div></div>
    <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Lo que hoy funciona para transmitir cultura (y dónde vive en la app)</h2><div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px">%s</div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(5, minmax(0, 1fr));gap:16px">%s</div>
  <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Diez categorías</h2><div style="display:flex;gap:8px;flex-wrap:wrap">%s</div></div>
  <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Recorrido del tripulante en la app</h2><div style="display:flex;align-items:center;gap:10px">%s</div></div>
  <div style="display:grid;grid-template-columns:minmax(0, 1.15fr) minmax(0, 1fr);gap:24px">
    <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Cómo se construye</h2><div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px">%s</div></div>
    <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Fases</h2><div style="display:flex;flex-direction:column;gap:10px">%s</div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px">%s Cómo sabremos que funciona</h2><div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:10px">%s</div></div>
</div>""" % (PW,PH,GROUND, CORAL, ic("compass",14,2.2), INDIGO, CORAL, ic("plane",22,2), ic("sparkle",18,2), names_html, ic("heart",18,2), mech_html, "".join(modules), ic("grid",18,2), cats_html, ic("arrow",18,2.2), flow_html, ic("settings",18,2), build_html, ic("chart",18,2), phases_html, ic("sparkle",18,2), metrics_html)
    return page("Propuesta de app · Mapa del proyecto", body, PW, PH), PW, PH

# ---------- write ----------
os.makedirs(ROOT, exist_ok=True)
boards = {}; order = []
def add(name, html, x, y, w, h, title, interactive=True):
    with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f: f.write(html)
    e = {"x":x,"y":y,"w":w,"h":h,"title":title}
    if interactive: e["is_interactive"] = True
    boards[name] = e; order.append(name)

G = 80; SX = W+G
row1 = [("Acceso.dc.html",acceso,"1 · Acceso con correo LATAM"),("Inicio.dc.html",inicio,"2 · Inicio"),("Detalle.dc.html",detalle,"3 · Práctica paso a paso"),("Publicar.dc.html",publicar,"4 · Compartir buena práctica"),("Notificaciones.dc.html",notificaciones,"5 · Notificaciones")]
for i,(n,fn,t) in enumerate(row1): add(n, fn(), i*SX, 0, W, H, t)
Y2 = H+320
row2 = [("Momentos.dc.html",momentos,"6 · Momentos LATAM"),("Reconocer.dc.html",reconocer,"7 · Reconocer a un compañero"),("Perfil.dc.html",perfil,"8 · Perfil e insignias")]
for i,(n,fn,t) in enumerate(row2): add(n, fn(), i*SX, Y2, W, H, t)
ph, pw, phh = propuesta()
add("Propuesta.dc.html", ph, 3*SX, Y2, pw, phh, "9 · Propuesta: nombre, categorías, cultura y mapa", False)


idx = {"v":3,"createdOnFiles":{"v":1,"at":datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")},"launch":{"view":"canvas"},"pages":[],"designSystems":[]}
idx["title"] = "Tripu · App de buenas prácticas LATAM"
idx["boards"] = boards; idx["order"] = order
idx["launch"] = {"view":"canvas"}
idx["notes"] = {
  "fila1":{"x":0,"y":-300,"text":"App · Recorrido principal: entrar, explorar, ver un paso a paso, publicar, avisos","kind":"title1","maxW":5*SX-G},
  "fila2":{"x":0,"y":Y2-300,"text":"App · Cultura LATAM: momentos, reconocer, perfil · y la propuesta completa con el mapa","kind":"title1","maxW":3*SX+pw},
  "nota1":{"x":5*SX+40,"y":0,"w":360,"text":"Cómo leer este canvas\n\n• Nombre propuesto: Tripu (alternativas en la lámina 9).\n• Es una app para el celular: todas las pantallas son de 390 px.\n• Con Play (▶) se navega entre pantallas: cada botón lleva a la siguiente.\n• Nombres, cifras y pasos son de ejemplo, no datos reales de LATAM.\n• Los bloques “Foto” son espacios para fotos reales de la tripulación.","color":"orange"},
  "nota2":{"x":5*SX+40,"y":Y2,"w":360,"text":"Decisiones de diseño\n\n• Índigo LATAM para navegación; coral solo para la acción principal y los “me sirve”.\n• Botón central “+” siempre a mano: publicar es lo más importante.\n• “Así lo hago yo”: mismo objetivo, distintas formas. Responde al caso del chequeo de 4 minutos.\n• Seguridad pasa por revisión antes de publicarse: protege el espacio informal sin quitarle libertad.","color":"purple"},
}
with open(os.path.join(ROOT,"canvas.json"),"w",encoding="utf-8") as f: json.dump(idx,f,ensure_ascii=False,indent=1)
print("written", order)

# ---------- pantallas/ : versión HTML normal, sin el runtime del canvas ----------
PANT = os.path.join(AQUI, "pantallas")
os.makedirs(PANT, exist_ok=True)
def normal(html, phone):
    html = html.replace('<script src="./support.js"></script>\n', '<meta name="viewport" content="width=%d, initial-scale=1">\n' % (390 if phone else 1440))
    html = html.replace("<x-dc>\n", "").replace("\n</x-dc>", "")
    html = html.replace("<helmet>\n", "").replace("\n</helmet>", "")
    html = re.sub(r'<script type="text/x-dc" data-dc-script[\s\S]*?</script>\n', "", html)
    html = html.replace(HERO, "../media/hero-tripulacion.jpg")
    html = re.sub(r'href="([A-Za-z]+)\.dc\.html"', r'href="\1.html"', html)
    html = html.replace("<style>", "<style>html{background:#E6E3F0;display:flex;justify-content:center;min-height:100%}", 1)
    if phone:  # en el navegador la pantalla crece y se desplaza; en el canvas queda fija en 844
        html = html.replace("width:390px;height:844px;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;", "width:390px;min-height:844px;display:flex;flex-direction:column;box-sizing:border-box;", 1)
    return html
for name in order:
    src = open(os.path.join(ROOT, name), encoding="utf-8").read()
    with open(os.path.join(PANT, name.replace(".dc.html", ".html")), "w", encoding="utf-8") as f:
        f.write(normal(src, boards[name]["w"] == 390))
print("pantallas listas")
