"""
w-notes de compAI — Widget de escritorio, cápsula flotante, notas de vidrio,
grabador de reuniones y sincronización con iPhone para Windows 10/11.

Qué hace
  1. Widget transparente (arrastrable): ubicación + clima real, reloj, fecha,
     próxima reunión de Google Calendar con botón ● Grabar y ↗ Unirse,
     cápsulas de notas y botón "+".
  2. Cápsula lateral semitransparente: aparece al pasar a otra app
     (Teams, Meet, Chrome, Excel…) con el logo, "+" y tus notas.
  3. Notas de vidrio en la paleta compAI: el tema se detecta por palabras
     clave o se elige a mano.
  4. Grabador de reuniones: audio del sistema (WASAPI loopback) + micrófono,
     prints de pantalla clave y acta AAAA-MM-DD_Organizacion_Tema.md en
     Documentos/w-note/Actas_Reuniones.
  5. Sincronización:
       · Nube (Apps Script + Google Sheet) → iPhone por 4G/5G en compai.cl/w-note
       · Wi-Fi local (http://IP:8765/?k=…) → mismo panel, sin internet
  6. Bandeja del sistema (Salir, Nueva nota, Grabar) y atajos globales:
       Ctrl+Alt+N nota rápida · Ctrl+Alt+R grabar/detener · Ctrl+Alt+P print clave

Instalación: doble clic en instalar.bat (ver README.md).
Dependencias: pip install -r requirements.txt
"""

from __future__ import annotations

import ctypes
import http.server
import json
import os
import re
import secrets
import socket
import socketserver
import sys
import threading
import time
import unicodedata
import urllib.parse
import urllib.request
import wave
from datetime import datetime
from pathlib import Path

from PySide6.QtCore import (
    QByteArray,
    QObject,
    QPoint,
    QRectF,
    QSize,
    Qt,
    QTimer,
    QUrl,
    Signal,
    Slot,
)
from PySide6.QtGui import (
    QAction,
    QBrush,
    QColor,
    QDesktopServices,
    QGuiApplication,
    QIcon,
    QImage,
    QPainter,
    QPen,
    QPixmap,
)
from PySide6.QtSvg import QSvgRenderer
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDialog,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMenu,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QSplitter,
    QSystemTrayIcon,
    QTableWidget,
    QTableWidgetItem,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

# Dependencias opcionales ------------------------------------------------------
try:
    from PIL import ImageGrab  # print de todas las pantallas
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import pyaudiowpatch as pyaudio  # WASAPI loopback (audio del sistema)
    HAS_WASAPI = True
except ImportError:
    HAS_WASAPI = False

try:
    import qrcode  # QR para vincular el celular
    HAS_QR = True
except ImportError:
    HAS_QR = False

APP_NAME = "w-notes"
APP_VERSION = "1.1.0"
APP_DIR = Path(__file__).resolve().parent
WEB_DIR = APP_DIR.parent  # carpeta w-note/ con index.html (panel del celular)

INK = "#141414"
PETROL = "#0F5C7A"
CREAM = "#F4F0E6"
SAND = "#D0C6B0"


# =============================================================================
# 0. LOGO OFICIAL (mismo dibujo que marca/wnote-logo.svg)
# =============================================================================
LOGO_SVG = b"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="#0F5C7A"/>
<rect x="76" y="152" width="190" height="236" rx="26" fill="#F0B400" transform="rotate(-8 76 152)"/>
<rect x="242" y="134" width="190" height="236" rx="26" fill="#37B35A" transform="rotate(8 432 134)"/>
<path d="M152 104H312L392 184V377A31 31 0 0 1 361 408H152A31 31 0 0 1 121 377V135A31 31 0 0 1 152 104Z" fill="#F4F0E6"/>
<path d="M312 104V153A31 31 0 0 0 343 184H392Z" fill="#D0C6B0"/>
<path d="M159 248 209 360 256 280 302 360 353 248" fill="none" stroke="#0F5C7A" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>
</svg>"""

LOGO_SMALL_SVG = b"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="#0F5C7A"/>
<path d="M138 80H318L414 176V392A40 40 0 0 1 374 432H138A40 40 0 0 1 98 392V120A40 40 0 0 1 138 80Z" fill="#F4F0E6"/>
<path d="M318 80V136A40 40 0 0 0 358 176H414Z" fill="#D0C6B0"/>
<path d="M152 236 206 362 256 280 306 362 360 236" fill="none" stroke="#0F5C7A" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
</svg>"""

_renderers: dict = {}


def _renderer(small: bool) -> QSvgRenderer:
    key = "s" if small else "l"
    if key not in _renderers:
        _renderers[key] = QSvgRenderer(QByteArray(LOGO_SMALL_SVG if small else LOGO_SVG))
    return _renderers[key]


def paint_wnote_logo(painter: QPainter, rect: QRectF):
    """Dibuja el isotipo oficial. Mismo dibujo en todos los tamaños (manda el del encabezado)."""
    painter.save()
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    _renderer(False).render(painter, rect)
    painter.restore()


def logo_pixmap(size: int) -> QPixmap:
    pix = QPixmap(size, size)
    pix.fill(Qt.GlobalColor.transparent)
    p = QPainter(pix)
    paint_wnote_logo(p, QRectF(0, 0, size, size))
    p.end()
    return pix


CAMERA_SVG = b"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4
a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>"""


def svg_icon(data: bytes, size: int = 18) -> QIcon:
    pix = QPixmap(size * 2, size * 2)
    pix.fill(Qt.GlobalColor.transparent)
    p = QPainter(pix)
    QSvgRenderer(QByteArray(data)).render(p, QRectF(0, 0, size * 2, size * 2))
    p.end()
    return QIcon(pix)


def compai_logo_pixmap(height: int) -> QPixmap | None:
    path = APP_DIR.parent / "marca" / "compai-logotipo-dia.svg"
    if not path.exists():
        return None
    r = QSvgRenderer(str(path))
    r.setViewBox(QRectF(2, 20, 294, 54))  # recorte al dibujo (el SVG trae margen de respiro)
    vb = r.viewBoxF()
    w = int(height * vb.width() / vb.height())
    pix = QPixmap(w * 2, height * 2)
    pix.fill(Qt.GlobalColor.transparent)
    p = QPainter(pix)
    p.setRenderHint(QPainter.RenderHint.Antialiasing)
    r.render(p, QRectF(0, 0, w * 2, height * 2))
    p.end()
    pix.setDevicePixelRatio(2)
    return pix


def logo_icon() -> QIcon:
    icon = QIcon()
    for s in (16, 24, 32, 48, 64, 128, 256):
        icon.addPixmap(logo_pixmap(s))
    return icon


# =============================================================================
# 1. PALETA OFICIAL DE VIDRIO POR TEMA (w-note / compAI)
# =============================================================================
POSTIT_THEMES = [
    {"key": "gerencia", "label": "Gerencia", "hex": "#682FA8", "rgba": (104, 47, 168, 222), "text_light": True,
     "keywords": ["gerencia", "directorio", "estrategia", "kpi", "meta", "metas"]},
    {"key": "comercial", "label": "Comercial", "hex": "#0F5C7A", "rgba": (15, 92, 122, 225), "text_light": True,
     "keywords": ["comercial", "venta", "cliente", "propuesta", "cotizacion", "banco", "licitacion"]},
    {"key": "finanzas", "label": "Finanzas", "hex": "#2E7D4F", "rgba": (46, 125, 79, 225), "text_light": True,
     "keywords": ["finanzas", "presupuesto", "factura", "pago", "costo", "monto", "usd", "clp"]},
    {"key": "ti", "label": "TI", "hex": "#162943", "rgba": (22, 41, 67, 232), "text_light": True,
     "keywords": ["ti", "servidor", "api", "sistema", "codigo", "cloud", "repo", "deploy"]},
    {"key": "ciberseguridad", "label": "Ciberseguridad", "hex": "#0000CD", "rgba": (0, 0, 205, 212), "text_light": True,
     "keywords": ["seguridad", "ciberseguridad", "firewall", "clave", "acceso", "vpn"]},
    {"key": "administracion", "label": "Administración", "hex": "#ECE8DF", "rgba": (236, 232, 223, 238),
     "text_light": False, "keywords": ["administracion", "rrhh", "oficina", "compra", "proveedor"]},
    {"key": "juridico", "label": "Jurídico", "hex": "#B2261E", "rgba": (178, 38, 30, 225), "text_light": True,
     "keywords": ["juridico", "contrato", "legal", "firma", "nda"]},
    {"key": "artes", "label": "Artes", "hex": "#D2287E", "rgba": (210, 40, 126, 225), "text_light": True,
     "keywords": ["artes", "diseno", "marca", "video", "pieza", "logo"]},
    {"key": "operaciones", "label": "Operaciones", "hex": "#F0B400", "rgba": (240, 180, 0, 235), "text_light": False,
     "keywords": ["operaciones", "entrega", "logistica", "soporte", "plazo", "despacho"]},
    {"key": "sebastian", "label": "Sebastián", "hex": "#141414", "rgba": (20, 20, 20, 232), "text_light": True,
     "keywords": ["personal", "recordatorio", "llamar", "seba", "sebastian", "pendiente"]},
]
DEFAULT_THEME = "comercial"


def get_theme(key: str) -> dict:
    for theme in POSTIT_THEMES:
        if theme["key"] == key:
            return theme
    return get_theme(DEFAULT_THEME) if key != DEFAULT_THEME else POSTIT_THEMES[1]


def _plain(text: str) -> str:
    """minúsculas y sin tildes, para comparar palabras."""
    nfkd = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def detect_theme_from_text(text: str) -> str:
    """Palabra completa para claves cortas ("ti" no calza con "tiempo"); prefijo para las largas
    ("venta" calza con "ventas")."""
    words = re.findall(r"[a-z0-9ñ]+", _plain(text))
    for theme in POSTIT_THEMES:
        for kw in theme["keywords"]:
            if any(w == kw or (len(kw) > 3 and w.startswith(kw)) for w in words):
                return theme["key"]
    return DEFAULT_THEME


# =============================================================================
# 2. MODELO DE NOTA Y FUSIÓN (igual que nube/Codigo.gs e index.html)
# =============================================================================
TOMBSTONE_DAYS = 30


def now_ms() -> int:
    return int(time.time() * 1000)


def new_note_id() -> str:
    return f"{now_ms():x}-{secrets.token_hex(3)}"


def normalize_note(raw: dict, fallback_ms: int | None = None) -> dict | None:
    """Acepta notas del formato antiguo ({id:int, time:'..'}) y las lleva al actual."""
    if not isinstance(raw, dict) or raw.get("id") in (None, ""):
        return None
    base = fallback_ms or now_ms()
    created = int(raw.get("created_at") or 0) or base
    return {
        "id": str(raw["id"])[:64],
        "theme_key": str(raw.get("theme_key") or DEFAULT_THEME)[:32],
        "text": str(raw.get("text") or "")[:5000],
        "created_at": created,
        "updated_at": int(raw.get("updated_at") or 0) or created,
        "deleted": bool(raw.get("deleted", False)),
        "source": str(raw.get("source") or "windows")[:24],
    }


def merge_notes(local: list, incoming: list) -> tuple[list, bool]:
    """Fusiona por id: gana el updated_at mayor; en empate gana la lápida. Devuelve (lista, cambió)."""
    by_id: dict = {}
    for raw in list(local) + list(incoming):
        n = normalize_note(raw)
        if not n:
            continue
        cur = by_id.get(n["id"])
        if (cur is None or n["updated_at"] > cur["updated_at"]
                or (n["updated_at"] == cur["updated_at"] and n["deleted"] and not cur["deleted"])):
            by_id[n["id"]] = n
    limit = now_ms() - TOMBSTONE_DAYS * 86_400_000
    merged = [n for n in by_id.values() if not (n["deleted"] and n["updated_at"] < limit)]
    merged.sort(key=lambda n: n["created_at"], reverse=True)

    def sig(items):
        return sorted((n["id"], n["updated_at"], n["deleted"], n["text"], n["theme_key"]) for n in items)

    old = [normalize_note(n) for n in local]
    return merged, sig([n for n in old if n]) != sig(merged)


def note_time_label(note: dict) -> str:
    try:
        return datetime.fromtimestamp(note["created_at"] / 1000).strftime("%d-%m %H:%M")
    except Exception:
        return ""


# =============================================================================
# 3. BUS DE SEÑALES (cruza hilos de forma segura hacia la interfaz)
# =============================================================================
class Bus(QObject):
    notes_changed = Signal()        # refrescar vistas
    local_mutation = Signal()       # el usuario cambió algo → sincronizar
    agenda_changed = Signal()
    weather_changed = Signal()
    sync_status = Signal(str)


# =============================================================================
# 4. ALMACENAMIENTO LOCAL Y NOMENCLATURA ESTÁNDAR
# =============================================================================
class StorageManager:
    """Notas, configuración y archivador de actas en Documentos/w-note."""

    def __init__(self, bus: Bus):
        self.bus = bus
        self.lock = threading.RLock()
        self.base_dir = Path.home() / "Documents" / "w-note"
        self.actas_dir = self.base_dir / "Actas_Reuniones"
        self.captures_dir = self.actas_dir / "Capturas_Clave"
        self.notes_file = self.base_dir / "notes.json"
        self.config_file = self.base_dir / "config.json"
        for d in (self.base_dir, self.actas_dir, self.captures_dir):
            d.mkdir(parents=True, exist_ok=True)

        self.config = self._load_config()
        self.notes: list = self._load_notes()
        self.agenda: list = []
        self.weather: dict = {}

    # ---- configuración -------------------------------------------------------
    def _load_config(self) -> dict:
        cfg = {
            "capsule_position": "left",       # "left" | "right"
            "capsule_always_on_top": True,
            "auto_dock_on_other_app": True,
            "naming_format": "DATE_ORG_TOPIC",
            "widget_x": None,
            "widget_y": 60,
            "location_mode": "auto",          # "auto" (como la intranet) | "fija"
            "location_label": "Santiago",
            "location_lat": -33.4489,
            "location_lon": -70.6693,
            "mobile_server_enabled": True,
            "mobile_port": 8765,
            "lan_token": "",
            "cloud_sync_url": "",              # URL /exec del Apps Script (ver README)
            "cloud_api_key": "",               # token que entrega configurar()
            "cloud_sync_enabled": True,
            "pwa_url": "https://compai.cl/w-note/",
            "record_mic": True,
            "hotkeys_enabled": True,
        }
        loaded_keys: set = set()
        if self.config_file.exists():
            try:
                loaded = json.loads(self.config_file.read_text(encoding="utf-8"))
                loaded_keys = set(loaded)
                cfg.update(loaded)
            except Exception:
                pass
        # La versión anterior traía un endpoint de ejemplo que no existe (compai.cl es estático).
        if cfg.get("cloud_sync_url", "").rstrip("/") == "https://compai.cl/api/wnote":
            cfg["cloud_sync_url"] = ""
        if "location_mode" not in loaded_keys:
            cfg["location_mode"] = "auto"  # instalaciones anteriores: pasan a ubicación automática
        if not cfg.get("lan_token"):
            cfg["lan_token"] = secrets.token_urlsafe(9)
        self.config = cfg
        self.save_config()
        return cfg

    def save_config(self):
        try:
            self.config_file.write_text(json.dumps(self.config, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"[w-note] Error guardando configuración: {e}")

    # ---- notas ---------------------------------------------------------------
    def _load_notes(self) -> list:
        if not self.notes_file.exists():
            return []
        try:
            raw = json.loads(self.notes_file.read_text(encoding="utf-8"))
            mtime = int(self.notes_file.stat().st_mtime * 1000)
            notes = [n for n in (normalize_note(x, mtime) for x in raw) if n]
            notes.sort(key=lambda n: n["created_at"], reverse=True)
            return notes
        except Exception:
            return []

    def save_notes(self):
        with self.lock:
            data = json.dumps(self.notes, indent=2, ensure_ascii=False)
        try:
            tmp = self.notes_file.with_suffix(".tmp")
            tmp.write_text(data, encoding="utf-8")
            os.replace(tmp, self.notes_file)
        except Exception as e:
            print(f"[w-note] Error guardando notas: {e}")

    def visible_notes(self) -> list:
        with self.lock:
            return [dict(n) for n in self.notes if not n["deleted"]]

    def all_notes(self) -> list:
        with self.lock:
            return [dict(n) for n in self.notes]

    def add_note(self, theme_key: str, text: str, source: str = "windows") -> dict:
        ts = now_ms()
        note = {"id": new_note_id(), "theme_key": theme_key, "text": text.strip()[:5000],
                "created_at": ts, "updated_at": ts, "deleted": False, "source": source}
        with self.lock:
            self.notes.insert(0, note)
        self._after_local_change()
        return dict(note)

    def delete_note(self, note_id: str):
        with self.lock:
            for n in self.notes:
                if n["id"] == note_id:
                    n["deleted"] = True
                    n["updated_at"] = now_ms()
        self._after_local_change()

    def merge_remote(self, remote: list) -> bool:
        with self.lock:
            merged, changed = merge_notes(self.notes, remote)
            self.notes = merged
        if changed:
            self.save_notes()
            self.bus.notes_changed.emit()
        return changed

    def _after_local_change(self):
        self.save_notes()
        self.bus.notes_changed.emit()
        self.bus.local_mutation.emit()

    # ---- actas -----------------------------------------------------------------
    def build_standard_name(self, date_str: str, org: str, topic: str) -> str:
        clean_org = re.sub(r"[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ_-]", "_", org.strip()).strip("_") or "Organizacion"
        clean_topic = re.sub(r"[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ_-]", "_", topic.strip()).strip("_") or "Reunion"
        clean_org, clean_topic = clean_org[:40], clean_topic[:60]
        fmt = self.config.get("naming_format", "DATE_ORG_TOPIC")
        if fmt == "ORG_DATE_TOPIC":
            return f"{clean_org}_{date_str}_{clean_topic}"
        if fmt == "DATE_TOPIC_ORG":
            return f"{date_str}_{clean_topic}_{clean_org}"
        return f"{date_str}_{clean_org}_{clean_topic}"

    def unique_base(self, std_name: str) -> str:
        """Si ya hay un acta con ese nombre el mismo día, agrega _2, _3…"""
        name, i = std_name, 2
        while (self.actas_dir / f"{name}.md").exists():
            name = f"{std_name}_{i}"
            i += 1
        return name

    def list_actas(self) -> list:
        records = []
        for md_file in sorted(self.actas_dir.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                content = md_file.read_text(encoding="utf-8")
            except Exception:
                continue
            meta = {"filename": md_file.name, "path": str(md_file), "date": "", "organization": "",
                    "topic": "", "platform": "Videollamada", "screenshots_count": 0, "content": content}
            for line in content.splitlines():
                for prefix, key in (("- **Fecha:**", "date"), ("- **Organización:**", "organization"),
                                    ("- **Tema:**", "topic"), ("- **Sistema:**", "platform")):
                    if line.startswith(prefix):
                        meta[key] = line.split(":**", 1)[1].strip()
                if line.startswith("- **Capturas clave:**"):
                    val = line.split(":**", 1)[1].strip()
                    meta["screenshots_count"] = int(val) if val.isdigit() else 0
            records.append(meta)
        return records


# =============================================================================
# 5. NUBE (Apps Script) — notas y agenda para el iPhone por 4G/5G
# =============================================================================
class CloudSyncClient:
    def __init__(self, storage: StorageManager, bus: Bus):
        self.storage = storage
        self.bus = bus
        self.last_status = "Nube sin configurar"
        self._busy = threading.Lock()

    def configured(self) -> bool:
        cfg = self.storage.config
        return bool(cfg.get("cloud_sync_enabled", True) and cfg.get("cloud_sync_url", "").strip()
                    and cfg.get("cloud_api_key", "").strip())

    def _url(self, **params) -> str:
        url = self.storage.config["cloud_sync_url"].strip()
        params["k"] = self.storage.config["cloud_api_key"].strip()
        return url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params)

    def _request(self, url: str, payload: dict | None = None) -> dict:
        data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST" if data else "GET", headers={
            "Content-Type": "text/plain; charset=utf-8", "User-Agent": f"w-notes-windows/{APP_VERSION}"})
        # Apps Script responde 302 → googleusercontent; urllib lo sigue con GET (lo correcto).
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", "replace")
        try:
            out = json.loads(body)
        except json.JSONDecodeError:
            raise RuntimeError("La URL no responde JSON: ¿implementaste como «Aplicación web» y acceso «Cualquiera»?")
        if not out.get("ok"):
            raise RuntimeError("Token rechazado" if out.get("error") == "token" else f"Error nube: {out.get('error')}")
        return out

    def _status(self, text: str):
        self.last_status = text
        self.bus.sync_status.emit(text)

    def sync_async(self):
        if not self.configured():
            self._status("Nube sin configurar")
            return
        if not self._busy.acquire(blocking=False):
            return

        def worker():
            try:
                out = self._request(self._url(), {"k": self.storage.config["cloud_api_key"].strip(),
                                                  "notes": self.storage.all_notes()})
                self.storage.merge_remote(out.get("notes", []))
                self._status(f"Nube OK · {datetime.now().strftime('%H:%M')}")
            except Exception as exc:
                self._status(f"Nube sin conexión · {str(exc)[:60] or type(exc).__name__}")
            finally:
                self._busy.release()

        threading.Thread(target=worker, daemon=True).start()

    def fetch_agenda_async(self):
        if not self.configured():
            return

        def worker():
            try:
                out = self._request(self._url(action="agenda"))
                self.storage.agenda = [e for e in out.get("events", []) if isinstance(e, dict)]
                self.bus.agenda_changed.emit()
            except Exception as exc:
                print(f"[w-note] Agenda no disponible: {exc}")

        threading.Thread(target=worker, daemon=True).start()

    def test_connection(self) -> str:
        """Bloqueante: para el botón «Probar»."""
        try:
            self._request(self._url(action="ping"))
            return "✓ Conexión correcta"
        except Exception as exc:
            return f"✕ {exc}"


class WeatherClient:
    """Temperatura actual desde Open-Meteo (gratis, sin clave)."""

    ICONS = [((0,), "☀"), ((1, 2), "🌤"), ((3,), "☁"), ((45, 48), "🌫"), (tuple(range(51, 68)), "🌧"),
             (tuple(range(71, 78)), "❄"), ((80, 81, 82), "🌦"), ((95, 96, 99), "⛈")]

    def __init__(self, storage: StorageManager, bus: Bus):
        self.storage, self.bus = storage, bus

    def fetch_async(self):
        def worker():
            try:
                cfg = self.storage.config
                url = ("https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode({
                    "latitude": cfg.get("location_lat"), "longitude": cfg.get("location_lon"),
                    "current": "temperature_2m,weather_code", "timezone": "auto"}))
                with urllib.request.urlopen(url, timeout=10) as resp:
                    cur = json.loads(resp.read().decode("utf-8")).get("current", {})
                code = int(cur.get("weather_code", -1))
                icon = next((ic for codes, ic in self.ICONS if code in codes), "☁")
                self.storage.weather = {"temp": round(float(cur["temperature_2m"])), "icon": icon}
                self.bus.weather_changed.emit()
            except Exception:
                pass

        threading.Thread(target=worker, daemon=True).start()



class LocationClient:
    """Ubicación actual, igual que la intranet: posición del equipo → si no hay, por IP → si no, Santiago.
    El nombre de la ciudad sale de BigDataCloud y, de respaldo, Nominatim. Nunca se inventa un nombre."""

    SANTIAGO = (-33.4489, -70.6693, "Santiago")
    PS_SCRIPT = (
        "Add-Type -AssemblyName System.Device;"
        "$w=New-Object System.Device.Location.GeoCoordinateWatcher('High');"
        "if($w.TryStart($true,[TimeSpan]::FromSeconds(8))){"
        "$i=0;while($w.Position.Location.IsUnknown -and $i -lt 40){Start-Sleep -Milliseconds 200;$i++};"
        "$c=$w.Position.Location;if(-not $c.IsUnknown){"
        "Write-Output ($c.Latitude.ToString([Globalization.CultureInfo]::InvariantCulture)+','"
        "+$c.Longitude.ToString([Globalization.CultureInfo]::InvariantCulture))}}")

    def __init__(self, storage: StorageManager, bus: Bus, on_done=None):
        self.storage, self.bus, self.on_done = storage, bus, on_done
        self.source = ""

    @staticmethod
    def _get_json(url: str, timeout: int = 8):
        req = urllib.request.Request(url, headers={"User-Agent": f"w-notes/{APP_VERSION} (compai.cl)",
                                                   "Accept-Language": "es"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _windows_position(self):
        if sys.platform != "win32":
            return None
        try:
            import subprocess
            out = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", self.PS_SCRIPT],
                                 capture_output=True, text=True, timeout=15,
                                 creationflags=0x08000000).stdout.strip()  # sin ventana
            lat, lon = (float(x) for x in out.split(","))
            return lat, lon
        except Exception:
            return None

    def _ip_position(self):
        for url, keys in (("https://ipapi.co/json/", ("latitude", "longitude", "city")),
                          ("https://ipwho.is/?lang=es", ("latitude", "longitude", "city"))):
            try:
                j = self._get_json(url)
                lat, lon = float(j[keys[0]]), float(j[keys[1]])
                return lat, lon, j.get(keys[2]) or None
            except Exception:
                continue
        return None

    def _city(self, lat: float, lon: float):
        try:
            j = self._get_json("https://api.bigdatacloud.net/data/reverse-geocode-client?"
                               + urllib.parse.urlencode({"latitude": lat, "longitude": lon, "localityLanguage": "es"}))
            if j.get("city") or j.get("locality"):
                return j.get("city") or j.get("locality")
        except Exception:
            pass
        try:
            j = self._get_json("https://nominatim.openstreetmap.org/reverse?"
                               + urllib.parse.urlencode({"format": "jsonv2", "lat": lat, "lon": lon,
                                                         "accept-language": "es"}))
            a = j.get("address", {})
            return a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or a.get("county")
        except Exception:
            return None

    def refresh_async(self):
        if self.storage.config.get("location_mode", "auto") != "auto":
            if self.on_done:
                self.on_done()
            return

        def worker():
            cfg = self.storage.config
            pos, city, src = self._windows_position(), None, "equipo"
            if not pos:
                ip = self._ip_position()
                if ip:
                    pos, city, src = (ip[0], ip[1]), ip[2], "red"
            if not pos:
                pos, city, src = self.SANTIAGO[:2], self.SANTIAGO[2], "respaldo"
            name = self._city(*pos) or city
            if not name:  # sin nombre confiable: conserva el último si está cerca (±5 km)
                near = abs(cfg.get("location_lat", 0) - pos[0]) < 0.05 and abs(cfg.get("location_lon", 0) - pos[1]) < 0.05
                name = cfg.get("location_label") if near else ""
            cfg["location_lat"], cfg["location_lon"] = round(pos[0], 4), round(pos[1], 4)
            cfg["location_label"] = name or ""
            self.source = src
            self.storage.save_config()
            self.bus.weather_changed.emit()
            if self.on_done:
                self.on_done()

        threading.Thread(target=worker, daemon=True).start()

# =============================================================================
# 6. SERVIDOR WI-FI LOCAL — mismo panel del celular, sin internet
# =============================================================================
class MobileSyncServer:
    """Sirve el panel web (index.html) y la API /api/notes en tu red local, protegido con token."""

    STATIC = {"index.html", "manifest.webmanifest", "sw.js"}

    def __init__(self, storage: StorageManager):
        self.storage = storage
        self.port = int(storage.config.get("mobile_port", 8765))
        self.local_ip = self._detect_local_ip()
        self.running = False
        self._httpd = None

    @staticmethod
    def _detect_local_ip() -> str:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
            sock.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def get_url(self) -> str:
        return f"http://{self.local_ip}:{self.port}/?k={self.storage.config['lan_token']}"

    def start(self):
        storage = self.storage
        web_root = WEB_DIR.resolve()

        class Handler(http.server.BaseHTTPRequestHandler):
            def log_message(self, *args):
                return

            def _json(self, code: int, obj):
                body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
                self.send_response(code)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def _token_ok(self, parsed, body: dict | None = None) -> bool:
                q = urllib.parse.parse_qs(parsed.query)
                given = (q.get("k") or [""])[0] or (body or {}).get("k", "")
                return secrets.compare_digest(str(given), storage.config["lan_token"])

            def do_GET(self):
                parsed = urllib.parse.urlparse(self.path)
                if parsed.path == "/api/notes":
                    if not self._token_ok(parsed):
                        return self._json(403, {"ok": False, "error": "token"})
                    q = urllib.parse.parse_qs(parsed.query)
                    if (q.get("action") or [""])[0] == "agenda":
                        return self._json(200, {"ok": True, "events": storage.agenda})
                    return self._json(200, {"ok": True, "notes": storage.all_notes(), "server_time": now_ms()})
                # Archivos del panel (solo los públicos de w-note/)
                rel = parsed.path.lstrip("/") or "index.html"
                target = (web_root / rel).resolve()
                allowed = target.is_file() and (
                    (rel in self.STATIC_FILES and target.parent == web_root)
                    or target.parent == web_root / "marca")
                if not allowed:
                    self.send_response(404)
                    self.end_headers()
                    return
                ctype = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                         ".webmanifest": "application/manifest+json", ".png": "image/png",
                         ".svg": "image/svg+xml", ".ico": "image/x-icon"}.get(target.suffix, "application/octet-stream")
                data = target.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def do_POST(self):
                parsed = urllib.parse.urlparse(self.path)
                if parsed.path != "/api/notes":
                    return self._json(404, {"ok": False})
                length = min(int(self.headers.get("Content-Length", 0) or 0), 2_000_000)
                try:
                    body = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
                except Exception:
                    return self._json(400, {"ok": False, "error": "json"})
                if not self._token_ok(parsed, body):
                    return self._json(403, {"ok": False, "error": "token"})
                incoming = body.get("notes") if isinstance(body.get("notes"), list) else []
                if storage.merge_remote(incoming):
                    storage.bus.local_mutation.emit()  # que también suba a la nube
                return self._json(200, {"ok": True, "notes": storage.all_notes(), "server_time": now_ms()})

        Handler.STATIC_FILES = self.STATIC

        class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
            daemon_threads = True
            allow_reuse_address = True

        def run():
            try:
                self._httpd = Server(("0.0.0.0", self.port), Handler)
                self.running = True
                self._httpd.serve_forever()
            except Exception as e:
                self.running = False
                print(f"[w-note] Servidor Wi-Fi no disponible en puerto {self.port}: {e}")

        threading.Thread(target=run, daemon=True).start()

    def stop(self):
        if self._httpd:
            self._httpd.shutdown()


# =============================================================================
# 7. GRABADOR DE REUNIONES (WASAPI LOOPBACK + MICRÓFONO) Y PRINTS CLAVE
# =============================================================================
class _WavStream:
    """Escribe audio a disco mientras se graba (no acumula horas de audio en RAM)."""

    def __init__(self, path: Path, channels: int, rate: int):
        self.path, self.channels, self.rate = path, channels, rate
        self.frame_bytes = channels * 2
        self.frames_written = 0
        self._wf = wave.open(str(path), "wb")
        self._wf.setnchannels(channels)
        self._wf.setsampwidth(2)
        self._wf.setframerate(rate)

    def write(self, data: bytes):
        self._wf.writeframes(data)
        self.frames_written += len(data) // self.frame_bytes

    def pad_to(self, seconds: float):
        """WASAPI loopback no entrega datos en silencio: rellena para no perder la línea de tiempo."""
        missing = int(seconds * self.rate) - self.frames_written
        if missing > self.rate * 0.25:
            self.write(b"\x00" * missing * self.frame_bytes)

    def close(self):
        try:
            self._wf.close()
        except Exception:
            pass


class MeetingRecorderEngine:
    def __init__(self, storage: StorageManager):
        self.storage = storage
        self.is_recording = False
        self.start_time = 0.0
        self.org, self.topic, self.platform, self.link = "Organizacion", "Reunion", "Videollamada", ""
        self.base_name = ""
        self.screenshots: list = []
        self.live_notes: list = []
        self.audio_files: list = []
        self.audio_errors: list = []
        self._threads: list = []

    def start(self, org: str, topic: str, platform: str, link: str = ""):
        self.org = org.strip() or "Organizacion"
        self.topic = topic.strip() or "Reunion"
        self.platform = platform.strip() or "Videollamada"
        self.link = link
        date_str = datetime.now().strftime("%Y-%m-%d")
        self.base_name = self.storage.unique_base(self.storage.build_standard_name(date_str, self.org, self.topic))
        self.screenshots, self.live_notes, self.audio_files, self.audio_errors = [], [], [], []
        self.start_time = time.time()
        self.is_recording = True
        self._threads = []
        if HAS_WASAPI:
            self._spawn(self._record_loopback)
            if self.storage.config.get("record_mic", True):
                self._spawn(self._record_mic)
        else:
            self.audio_errors.append("instala pyaudiowpatch para grabar audio (pip install pyaudiowpatch)")

    def _spawn(self, fn):
        t = threading.Thread(target=fn, daemon=True)
        self._threads.append(t)
        t.start()

    def _loop(self, p, device: dict, suffix: str, pad_silence: bool):
        channels = max(1, min(2, int(device["maxInputChannels"])))
        rate = int(device["defaultSampleRate"])
        path = self.storage.actas_dir / f"{self.base_name}{suffix}.wav"
        stream = p.open(format=pyaudio.paInt16, channels=channels, rate=rate, input=True,
                        frames_per_buffer=1024, input_device_index=device["index"])
        wav = _WavStream(path, channels, rate)
        try:
            while self.is_recording:
                avail = stream.get_read_available()
                if avail <= 0:
                    time.sleep(0.01)
                    continue
                data = stream.read(min(avail, 4096), exception_on_overflow=False)
                if pad_silence:
                    wav.pad_to(time.time() - self.start_time - (len(data) // wav.frame_bytes) / rate)
                wav.write(data)
            if pad_silence:
                wav.pad_to(time.time() - self.start_time)
        finally:
            stream.stop_stream()
            stream.close()
            wav.close()
        if wav.frames_written:
            self.audio_files.append(path.name)
        else:
            path.unlink(missing_ok=True)

    def _record_loopback(self):
        try:
            with pyaudio.PyAudio() as p:
                try:
                    dev = p.get_default_wasapi_loopback()
                except Exception:
                    wasapi = p.get_host_api_info_by_type(pyaudio.paWASAPI)
                    dev = p.get_device_info_by_index(wasapi["defaultOutputDevice"])
                    if not dev.get("isLoopbackDevice"):
                        for lb in p.get_loopback_device_info_generator():
                            if dev["name"] in lb["name"]:
                                dev = lb
                                break
                self._loop(p, dev, "", pad_silence=True)
        except Exception as e:
            self.audio_errors.append(f"audio del sistema: {e}")

    def _record_mic(self):
        try:
            with pyaudio.PyAudio() as p:
                self._loop(p, p.get_default_input_device_info(), "_microfono", pad_silence=False)
        except Exception as e:
            self.audio_errors.append(f"micrófono: {e}")

    def elapsed_str(self) -> str:
        if not self.is_recording:
            return "00:00"
        secs = int(time.time() - self.start_time)
        h, rem = divmod(secs, 3600)
        return f"{h}:{rem // 60:02d}:{rem % 60:02d}" if h else f"{rem // 60:02d}:{rem % 60:02d}"

    def capture_key_screenshot(self) -> str:
        """Se llama desde el hilo de la interfaz."""
        ts = self.elapsed_str()
        img_name = f"{self.base_name}_{ts.replace(':', '-')}.png"
        img_path = self.storage.captures_dir / img_name
        ok = False
        if HAS_PIL:
            try:
                ImageGrab.grab(all_screens=True).save(img_path, "PNG")
                ok = True
            except Exception as e:
                print(f"[w-note] Pillow no pudo capturar: {e}")
        if not ok:
            screen = QGuiApplication.primaryScreen()
            ok = bool(screen) and screen.grabWindow(0).save(str(img_path), "PNG")
        if ok:
            self.screenshots.append({"timestamp": ts, "filename": img_name})
        return ts

    def add_live_note(self, text: str):
        if text.strip():
            self.live_notes.append({"timestamp": self.elapsed_str(), "text": text.strip()})

    def stop_and_archive(self) -> Path:
        duration = self.elapsed_str()
        self.is_recording = False
        for t in self._threads:
            t.join(timeout=5)
        date_str = datetime.now().strftime("%Y-%m-%d")
        md_path = self.storage.actas_dir / f"{self.base_name}.md"

        audio_md = ", ".join(f"`{a}`" for a in self.audio_files) or "No capturado"
        if self.audio_errors:
            audio_md += " — " + "; ".join(self.audio_errors)
        notes_md = ("\n".join(f"- `[{n['timestamp']}]` {n['text']}" for n in self.live_notes)
                    or "- (sin notas en vivo)")
        shots_md = ("\n\n".join(
            f"**[{s['timestamp']}]** `{s['filename']}`\n\n![{s['timestamp']}](Capturas_Clave/{s['filename']})"
            for s in self.screenshots) or "- Sin capturas de pantalla.")
        link_md = f"\n- **Enlace:** {self.link}" if self.link else ""

        document = f"""# Acta de Reunión — {self.base_name}

- **Fecha:** {date_str}
- **Organización:** {self.org}
- **Tema:** {self.topic}
- **Sistema:** {self.platform}{link_md}
- **Duración:** {duration}
- **Audio:** {audio_md}
- **Capturas clave:** {len(self.screenshots)}

## 1. Notas y puntos clave en vivo
{notes_md}

## 2. Momentos importantes (prints de pantalla)
{shots_md}

## 3. Acuerdos y próximos pasos
- [ ]

---
Generado por w-notes {APP_VERSION} · compAI
"""
        md_path.write_text(document, encoding="utf-8")
        return md_path


# =============================================================================
# 8. BOTONES: CÁPSULA DE VIDRIO Y LOGO
# =============================================================================
class GlassNoteCapsuleButton(QPushButton):
    def __init__(self, note: dict, size: int = 32, parent=None):
        super().__init__(parent)
        self.note = note
        self.theme = get_theme(note.get("theme_key", DEFAULT_THEME))
        self.setFixedSize(size, size)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setToolTip(f"{self.theme['label']}: {note.get('text', '')[:140]}")

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        r = QRectF(1.5, 1.5, self.width() - 3.0, self.height() - 3.0)
        bg = QColor(*self.theme["rgba"])
        if self.underMouse():
            bg = bg.lighter(115)
        painter.setBrush(QBrush(bg))
        painter.setPen(QPen(QColor(255, 255, 255, 175), 1.3))
        painter.drawEllipse(r)
        fg = QColor("#ffffff") if self.theme["text_light"] else QColor(INK)
        painter.setPen(QPen(fg, 1.4, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        m = self.width() * 0.31
        painter.drawRoundedRect(QRectF(m, m, self.width() - 2 * m, self.height() - 2 * m), 2.0, 2.0)


class LogoButton(QPushButton):
    def __init__(self, size: int = 36, parent=None):
        super().__init__(parent)
        self.setFixedSize(size, size)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setToolTip("Abrir w-notes")
        self.setStyleSheet("border: none; background: transparent;")

    def paintEvent(self, event):
        painter = QPainter(self)
        paint_wnote_logo(painter, QRectF(1, 1, self.width() - 2.0, self.height() - 2.0))


def _plus_button(size: int, tooltip: str = "Crear nota rápida (Ctrl+Alt+N)") -> QPushButton:
    b = QPushButton("+")
    b.setFixedSize(size, size)
    b.setCursor(Qt.CursorShape.PointingHandCursor)
    b.setToolTip(tooltip)
    b.setStyleSheet(
        f"QPushButton {{ background: rgba(255,255,255,0.22); color: #ffffff; border: 1px solid rgba(255,255,255,0.45);"
        f" border-radius: {size // 2}px; font-size: {size // 2 + 2}px; }}"
        "QPushButton:hover { background: rgba(255,255,255,0.36); }")
    return b


# =============================================================================
# 9. VENTANA FLOTANTE: VER NOTA / CREAR NOTA RÁPIDA SOBRE CUALQUIER APP
# =============================================================================
class FloatingGlassNotePopup(QWidget):
    def __init__(self, storage: StorageManager):
        super().__init__()
        self.storage = storage
        self.selected_theme_key = DEFAULT_THEME
        self.manual_override = False
        self._bg_color = QColor(20, 20, 20, 232)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint
                            | Qt.WindowType.Tool)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedWidth(340)
        self.root_layout = QVBoxLayout(self)
        self.root_layout.setContentsMargins(16, 14, 16, 14)
        self.root_layout.setSpacing(10)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setBrush(QBrush(self._bg_color))
        painter.setPen(QPen(QColor(255, 255, 255, 135), 1.3))
        painter.drawRoundedRect(QRectF(1, 1, self.width() - 2, self.height() - 2), 18.0, 18.0)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Escape:
            self.hide()
        elif (event.key() in (Qt.Key.Key_Return, Qt.Key.Key_Enter)
              and event.modifiers() & Qt.KeyboardModifier.ControlModifier and hasattr(self, "editor")):
            self._save_note()
        else:
            super().keyPressEvent(event)

    def _clear_layout(self, layout=None):
        layout = layout or self.root_layout
        while layout.count():
            item = layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
            elif item.layout():
                self._clear_layout(item.layout())
        if layout is self.root_layout and hasattr(self, "editor"):
            del self.editor

    def _close_btn(self, fg: str) -> QPushButton:
        b = QPushButton("✕")
        b.setFixedSize(24, 24)
        b.setCursor(Qt.CursorShape.PointingHandCursor)
        b.setStyleSheet(f"color: {fg}; background: rgba(0,0,0,0.18); border-radius: 12px; border: none;")
        b.clicked.connect(self.hide)
        return b

    def show_registered_note(self, note: dict, anchor_pos: QPoint):
        self._clear_layout()
        theme = get_theme(note["theme_key"])
        self._bg_color = QColor(*theme["rgba"])
        fg = "#ffffff" if theme["text_light"] else INK

        top = QHBoxLayout()
        lbl = QLabel(f"{theme['label'].upper()}  •  {note_time_label(note)}")
        lbl.setStyleSheet(f"color: {fg}; font-weight: 700; font-size: 11px;")
        top.addWidget(lbl)
        top.addStretch()
        top.addWidget(self._close_btn(fg))
        self.root_layout.addLayout(top)

        body = QLabel(note["text"])
        body.setWordWrap(True)
        body.setTextFormat(Qt.TextFormat.PlainText)
        body.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        body.setStyleSheet(f"color: {fg}; font-size: 13px; font-weight: 500; padding: 4px 0;")
        self.root_layout.addWidget(body)

        bottom = QHBoxLayout()
        btn_copy = QPushButton("Copiar texto")
        btn_copy.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_copy.setStyleSheet(f"color: {fg}; background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.35);"
                               " border-radius: 10px; padding: 5px 10px; font-size: 11px; font-weight: 600;")
        btn_copy.clicked.connect(lambda: (QApplication.clipboard().setText(note["text"]), btn_copy.setText("✓ Copiado")))
        btn_del = QPushButton("Archivar")
        btn_del.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_del.setStyleSheet(f"color: {fg}; background: rgba(0,0,0,0.14); border-radius: 10px; padding: 5px 10px;"
                              " font-size: 11px;")
        btn_del.clicked.connect(lambda: self._archive_note(note["id"]))
        bottom.addWidget(btn_copy)
        bottom.addStretch()
        bottom.addWidget(btn_del)
        self.root_layout.addLayout(bottom)

        self.adjustSize()
        self._move_safely(anchor_pos)
        self.show()
        self.raise_()

    def show_quick_creator(self, anchor_pos: QPoint, prefill: str = ""):
        self._clear_layout()
        self.manual_override = False
        self.selected_theme_key = DEFAULT_THEME
        self._bg_color = QColor(20, 20, 20, 235)

        header = QHBoxLayout()
        title = QLabel("+ Nota rápida")
        title.setStyleSheet("color: #ffffff; font-weight: 700; font-size: 12px;")
        header.addWidget(title)
        header.addStretch()
        header.addWidget(self._close_btn("#ffffff"))
        self.root_layout.addLayout(header)

        self.theme_lbl = QLabel()
        self.theme_lbl.setStyleSheet("color: #F0B400; font-size: 11px; font-weight: 600;")
        self.root_layout.addWidget(self.theme_lbl)

        grid = QGridLayout()
        grid.setSpacing(6)
        self._dots = {}
        for idx, th in enumerate(POSTIT_THEMES):
            dot = QPushButton()
            dot.setFixedSize(24, 24)
            dot.setToolTip(th["label"])
            dot.setCursor(Qt.CursorShape.PointingHandCursor)
            dot.clicked.connect(lambda _=False, k=th["key"]: self._select_theme(k, True))
            self._dots[th["key"]] = dot
            grid.addWidget(dot, idx // 5, idx % 5)
        self.root_layout.addLayout(grid)

        self.editor = QTextEdit()
        self.editor.setAcceptRichText(False)
        self.editor.setPlaceholderText("Escribe tu nota… (Ctrl+Enter guarda)")
        self.editor.setFixedHeight(90)
        self.editor.setStyleSheet("background: rgba(0,0,0,0.55); color: #ffffff; border: 1px solid rgba(255,255,255,0.28);"
                                  " border-radius: 12px; padding: 8px; font-size: 12px;")
        self.editor.textChanged.connect(self._on_text_changed)
        self.root_layout.addWidget(self.editor)

        btn_save = QPushButton("Guardar y sincronizar con el celular")
        btn_save.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_save.setStyleSheet(f"background: {CREAM}; color: {INK}; font-weight: 700; font-size: 12px;"
                               " border-radius: 11px; padding: 7px 12px;")
        btn_save.clicked.connect(self._save_note)
        self.root_layout.addWidget(btn_save)

        self._select_theme(DEFAULT_THEME, False)
        if prefill:
            self.editor.setPlainText(prefill)
        self.adjustSize()
        self._move_safely(anchor_pos)
        self.show()
        self.raise_()
        self.activateWindow()
        self.editor.setFocus()

    def _select_theme(self, key: str, manual: bool):
        self.selected_theme_key = key
        if manual:
            self.manual_override = True
        th = get_theme(key)
        self.theme_lbl.setText(f"Tema {'elegido' if self.manual_override else 'detectado'}: {th['label']}")
        for k, dot in self._dots.items():
            border = "3px solid #ffffff" if k == key else "2px solid rgba(255,255,255,0.45)"
            dot.setStyleSheet(f"background-color: {get_theme(k)['hex']}; border-radius: 12px; border: {border};")

    def _on_text_changed(self):
        if not self.manual_override:
            self._select_theme(detect_theme_from_text(self.editor.toPlainText()), False)

    def _save_note(self):
        text = self.editor.toPlainText().strip()
        if not text:
            return
        note = self.storage.add_note(self.selected_theme_key, text)
        self.show_registered_note(note, self.pos())

    def _archive_note(self, note_id: str):
        self.storage.delete_note(note_id)
        self.hide()

    def _move_safely(self, anchor: QPoint):
        screen = (QGuiApplication.screenAt(anchor) or QGuiApplication.primaryScreen()).availableGeometry()
        x = max(screen.left() + 12, min(screen.right() - self.width() - 12, anchor.x()))
        y = max(screen.top() + 12, min(screen.bottom() - self.height() - 12, anchor.y()))
        self.move(x, y)


# =============================================================================
# 10. CÁPSULA LATERAL FLOTANTE (SIEMPRE VISIBLE)
# =============================================================================
class FloatingSideCapsuleWindow(QWidget):
    open_main_requested = Signal()

    def __init__(self, storage: StorageManager, popup: FloatingGlassNotePopup):
        super().__init__()
        self.storage = storage
        self.popup = popup
        self._apply_window_flags()
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.layout_box = QVBoxLayout(self)
        self.layout_box.setContentsMargins(7, 10, 7, 10)
        self.layout_box.setSpacing(8)
        self.layout_box.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        self.rebuild_capsules()

    def _apply_window_flags(self):
        flags = Qt.WindowType.FramelessWindowHint | Qt.WindowType.Tool
        if self.storage.config.get("capsule_always_on_top", True):
            flags |= Qt.WindowType.WindowStaysOnTopHint
        self.setWindowFlags(flags)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = QRectF(1, 1, self.width() - 2, self.height() - 2)
        painter.setBrush(QBrush(QColor(20, 20, 20, 120)))
        painter.setPen(QPen(QColor(255, 255, 255, 115), 1.2))
        painter.drawRoundedRect(rect, rect.width() / 2.0, rect.width() / 2.0)

    @Slot()
    def rebuild_capsules(self):
        while self.layout_box.count():
            item = self.layout_box.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        btn_logo = LogoButton(38)
        btn_logo.clicked.connect(self.open_main_requested.emit)
        self.layout_box.addWidget(btn_logo, 0, Qt.AlignmentFlag.AlignHCenter)
        btn_plus = _plus_button(32)
        btn_plus.clicked.connect(self._open_creator)
        self.layout_box.addWidget(btn_plus, 0, Qt.AlignmentFlag.AlignHCenter)
        for note in self.storage.visible_notes()[:8]:
            cap = GlassNoteCapsuleButton(note, size=32)
            cap.clicked.connect(lambda _=False, n=note: self.popup.show_registered_note(n, self._popup_anchor()))
            self.layout_box.addWidget(cap, 0, Qt.AlignmentFlag.AlignHCenter)
        self.adjustSize()
        self.reposition()

    def reposition(self):
        screen = QApplication.primaryScreen().availableGeometry()
        left = self.storage.config.get("capsule_position", "left") == "left"
        x = screen.left() + 12 if left else screen.right() - self.width() - 12
        y = max(screen.top() + 40, screen.top() + (screen.height() - self.height()) // 2)
        self.move(x, y)

    def refresh_settings(self):
        was_visible = self.isVisible()
        self._apply_window_flags()
        self.reposition()
        if was_visible:
            self.show()

    def _popup_anchor(self) -> QPoint:
        if self.storage.config.get("capsule_position", "left") == "left":
            return QPoint(self.x() + self.width() + 12, self.y())
        return QPoint(self.x() - 352, self.y())

    def _open_creator(self):
        self.popup.show_quick_creator(self._popup_anchor())


# =============================================================================
# 11. WIDGET TRANSPARENTE DE ESCRITORIO (MOVIBLE)
# =============================================================================
DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
          "octubre", "noviembre", "diciembre"]


def countdown_label(start_ms: int, end_ms: int) -> str:
    now = now_ms()
    if start_ms <= now < end_ms:
        return "EN CURSO"
    mins = int((start_ms - now) / 60000)
    if mins < 1:
        return "Ahora"
    if mins < 60:
        return f"En {mins} min"
    when = datetime.fromtimestamp(start_ms / 1000)
    return f"{'Mañana ' if when.date() != datetime.now().date() else ''}{when.strftime('%H:%M')} hrs"


class DesktopWidgetWindow(QWidget):
    record_meeting_requested = Signal(str, str, str, str)  # org, tema, plataforma, link
    open_main_requested = Signal()

    def __init__(self, storage: StorageManager, popup: FloatingGlassNotePopup, cloud: CloudSyncClient):
        super().__init__()
        self.storage, self.popup, self.cloud = storage, popup, cloud
        self._drag_offset = None
        self._press_pos = None
        self.event_idx = 0
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Tool)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setToolTip("Clic: abrir w-notes · Arrastrar: mover")
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedWidth(360)
        self._build_ui()
        self.rebuild_capsules()
        self.refresh_weather()
        self.refresh_agenda()

        screen = QApplication.primaryScreen().availableGeometry()
        x = self.storage.config.get("widget_x")
        y = self.storage.config.get("widget_y", 60)
        self.move(x if x is not None else screen.right() - self.width() - 40, y)

        self.clock_timer = QTimer(self)
        self.clock_timer.timeout.connect(self._tick)
        self.clock_timer.start(1000)
        self._tick()

    def _build_ui(self):
        shadow = "background: transparent; border: none;"
        root = QVBoxLayout(self)
        root.setContentsMargins(14, 12, 14, 12)
        root.setSpacing(4)

        top_row = QHBoxLayout()
        top_row.addStretch()
        self.lbl_loc = QLabel()
        self.lbl_loc.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        self.lbl_loc.setStyleSheet("color: rgba(255,255,255,0.95); font-size: 11px; font-weight: 700;"
                                   " letter-spacing: 1px;" + shadow)
        top_row.addWidget(self.lbl_loc)
        root.addLayout(top_row)

        clock_row = QHBoxLayout()
        clock_row.setSpacing(4)
        clock_row.addStretch()
        self.lbl_time = QLabel()
        self.lbl_time.setStyleSheet("color: #ffffff; font-size: 52px; font-weight: 300;" + shadow)
        self.lbl_time.setAlignment(Qt.AlignmentFlag.AlignTop)
        clock_row.addWidget(self.lbl_time, 0, Qt.AlignmentFlag.AlignTop)
        meta_col = QVBoxLayout()
        meta_col.setSpacing(0)
        # el alto de línea deja aire sobre las cifras: se baja la temperatura a la altura del borde superior
        fm = self.lbl_time.fontMetrics()
        meta_col.setContentsMargins(0, max(0, fm.ascent() - fm.capHeight() - 2), 0, 0)
        self.lbl_temp = QLabel("–°")
        self.lbl_temp.setStyleSheet("color: #78C5E3; font-size: 17px; font-weight: 400;" + shadow)
        self.lbl_ampm = QLabel()
        self.lbl_ampm.setStyleSheet("color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 700;" + shadow)
        meta_col.addWidget(self.lbl_temp)
        meta_col.addWidget(self.lbl_ampm)
        meta_col.addStretch()
        clock_row.addLayout(meta_col)
        clock_row.setAlignment(meta_col, Qt.AlignmentFlag.AlignTop)
        root.addLayout(clock_row)

        self.lbl_date = QLabel()
        self.lbl_date.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.lbl_date.setStyleSheet("color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500;"
                                    " margin-bottom: 6px;" + shadow)
        root.addWidget(self.lbl_date)

        gcal = QFrame()
        gcal.setObjectName("gcal")
        gcal.setStyleSheet("QFrame#gcal { background: rgba(20, 20, 20, 0.45); border: 1px solid rgba(255,255,255,0.32);"
                           " border-radius: 16px; } QLabel { background: transparent; border: none; }")
        g = QHBoxLayout(gcal)
        g.setContentsMargins(12, 8, 10, 8)
        g.setSpacing(6)
        info = QVBoxLayout()
        info.setSpacing(1)
        self.lbl_gcal_sub = QLabel()
        self.lbl_gcal_sub.setStyleSheet("color: #F0B400; font-size: 10px; font-weight: 700;")
        self.lbl_gcal_title = QLabel()
        self.lbl_gcal_title.setStyleSheet("color: #ffffff; font-size: 12px; font-weight: 600;")
        info.addWidget(self.lbl_gcal_sub)
        info.addWidget(self.lbl_gcal_title)
        g.addLayout(info, 1)

        self.btn_join = QPushButton("↗")
        self.btn_join.setFixedSize(26, 26)
        self.btn_join.setToolTip("Unirse a la reunión")
        self.btn_join.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_join.setStyleSheet("QPushButton { background: rgba(255,255,255,0.18); color: #fff; border: none;"
                                    " border-radius: 13px; font-weight: 700; } QPushButton:hover { background: rgba(255,255,255,0.32); }")
        self.btn_join.clicked.connect(self._join)
        g.addWidget(self.btn_join)

        btn_rec = QPushButton("●")
        btn_rec.setFixedSize(28, 28)
        btn_rec.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_rec.setToolTip("Grabar esta reunión ahora (Ctrl+Alt+R)")
        btn_rec.setStyleSheet("QPushButton { background: #B2261E; color: #ffffff; border: 1px solid rgba(255,255,255,0.5);"
                              " border-radius: 14px; font-size: 11px; } QPushButton:hover { background: #d0342b; }")
        btn_rec.clicked.connect(self._trigger_record)
        g.addWidget(btn_rec)

        btn_next = QPushButton("›")
        btn_next.setFixedSize(24, 24)
        btn_next.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_next.setToolTip("Siguiente evento")
        btn_next.setStyleSheet("QPushButton { background: transparent; color: #ffffff; border: none; font-size: 16px;"
                               " font-weight: 700; } QPushButton:hover { background: rgba(255,255,255,0.15); border-radius: 12px; }")
        btn_next.clicked.connect(self._next_event)
        g.addWidget(btn_next)
        root.addWidget(gcal)

        self.capsules_row = QHBoxLayout()
        self.capsules_row.setContentsMargins(0, 6, 0, 0)
        self.capsules_row.setSpacing(6)
        root.addLayout(self.capsules_row)

    @Slot()
    def rebuild_capsules(self):
        while self.capsules_row.count():
            item = self.capsules_row.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self.capsules_row.addStretch()
        for note in self.storage.visible_notes()[:6]:
            cap = GlassNoteCapsuleButton(note, size=30)
            cap.clicked.connect(lambda _=False, n=note: self.popup.show_registered_note(n, self._below()))
            self.capsules_row.addWidget(cap)
        btn_quick = _plus_button(30)
        btn_quick.clicked.connect(lambda: self.popup.show_quick_creator(self._below()))
        self.capsules_row.addWidget(btn_quick)
        btn_logo = LogoButton(32)
        btn_logo.setToolTip("Abrir w-notes")
        btn_logo.clicked.connect(self.open_main_requested.emit)
        self.capsules_row.addWidget(btn_logo)
        self.adjustSize()

    def _below(self) -> QPoint:
        return QPoint(self.x(), self.y() + self.height() + 8)

    @Slot()
    def refresh_weather(self):
        w = self.storage.weather
        icon = w.get("icon", "☁")
        self.lbl_loc.setText(f"{icon} {self.storage.config.get('location_label', '').upper()}")
        self.lbl_temp.setText(f"{w['temp']}°" if "temp" in w else "–°")

    def _current_event(self) -> dict | None:
        events = [e for e in self.storage.agenda if e.get("end", 0) > now_ms()]
        if not events:
            return None
        return events[self.event_idx % len(events)]

    @Slot()
    def refresh_agenda(self):
        ev = self._current_event()
        if ev:
            start = datetime.fromtimestamp(ev["start"] / 1000).strftime("%H:%M")
            self.lbl_gcal_sub.setText(f"GOOGLE CALENDAR • {countdown_label(ev['start'], ev['end'])}")
            title = f"{start} • {ev.get('title', '')}"
            self.lbl_gcal_title.setText(title if len(title) <= 38 else title[:37] + "…")
            self.lbl_gcal_title.setToolTip(ev.get("title", ""))
            self.btn_join.setVisible(bool(ev.get("link")))
        else:
            self.lbl_gcal_sub.setText("GOOGLE CALENDAR")
            self.lbl_gcal_title.setText("Sin reuniones próximas" if self.cloud.configured()
                                        else "Conecta la nube para ver tu agenda")
            self.btn_join.setVisible(False)

    def _tick(self):
        now = datetime.now()
        self.lbl_time.setText(f"{now.hour % 12 or 12:02d}:{now.minute:02d}")
        self.lbl_ampm.setText("PM" if now.hour >= 12 else "AM")
        self.lbl_date.setText(f"{DAYS[now.weekday()]}, {now.day} de {MONTHS[now.month - 1]}")
        if now.second == 0:
            self.refresh_agenda()

    def _next_event(self):
        self.event_idx += 1
        self.refresh_agenda()

    def _join(self):
        ev = self._current_event()
        if ev and ev.get("link"):
            QDesktopServices.openUrl(QUrl(ev["link"]))

    def _trigger_record(self):
        ev = self._current_event()
        if ev:
            self.record_meeting_requested.emit(ev.get("org", "compAI_Interno"), ev.get("title", "Reunion"),
                                               ev.get("platform", "Otra Videollamada"), ev.get("link", ""))
        else:
            self.record_meeting_requested.emit("", "", "Google Meet", "")

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self._press_pos = event.globalPosition().toPoint()
            self._drag_offset = self._press_pos - self.frameGeometry().topLeft()

    def mouseMoveEvent(self, event):
        if self._drag_offset is not None and event.buttons() & Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_offset)

    def mouseReleaseEvent(self, event):
        if self._drag_offset is None:
            return
        moved = (event.globalPosition().toPoint() - self._press_pos).manhattanLength()
        self._drag_offset = None
        if moved < 5:  # clic sin arrastrar → abre la app
            self.open_main_requested.emit()
            return
        self.storage.config["widget_x"] = self.x()
        self.storage.config["widget_y"] = self.y()
        self.storage.save_config()


# =============================================================================
# 12. VINCULAR CELULAR (QR)
# =============================================================================
def qr_pixmap(text: str, size: int = 220) -> QPixmap | None:
    if not HAS_QR:
        return None
    try:
        qr = qrcode.QRCode(border=2, box_size=8)
        qr.add_data(text)
        qr.make(fit=True)
        matrix = qr.get_matrix()
        n = len(matrix)
        img = QImage(n, n, QImage.Format.Format_RGB32)
        for y, row in enumerate(matrix):
            for x, on in enumerate(row):
                img.setPixel(x, y, 0xFF141414 if on else 0xFFFFFFFF)
        return QPixmap.fromImage(img.scaled(size, size, Qt.AspectRatioMode.KeepAspectRatio,
                                            Qt.TransformationMode.FastTransformation))
    except Exception:
        return None


class LinkPhoneDialog(QDialog):
    def __init__(self, parent, storage: StorageManager, server: MobileSyncServer, cloud: CloudSyncClient):
        super().__init__(parent)
        self.setWindowTitle("Vincular celular — w-notes")
        self.setStyleSheet(QSS + f"QDialog {{ background: {V_CREMA}; }}")
        lay = QHBoxLayout(self)
        cfg = storage.config
        if cloud.configured():
            url = (cfg.get("pwa_url", "https://compai.cl/w-note/") + "#u="
                   + urllib.parse.quote(cfg["cloud_sync_url"].strip(), safe="") + "&k="
                   + urllib.parse.quote(cfg["cloud_api_key"].strip(), safe=""))
            lay.addWidget(self._block("iPhone por 4G/5G (nube)", url,
                                      "Escanéalo con la cámara, ábrelo en Safari y toca Compartir → «Agregar a inicio»."))
        if server.running:
            lay.addWidget(self._block("Misma red Wi-Fi (sin internet)", server.get_url(),
                                      "Solo funciona con el celular en la misma red que este PC."))
        if not cloud.configured() and not server.running:
            lay.addWidget(QLabel("Configura la nube o activa el servidor Wi-Fi primero."))

    def _block(self, title: str, url: str, hint: str) -> QWidget:
        box = QFrame()
        box.setStyleSheet("QFrame { background: #ffffff; border-radius: 14px; }")
        v = QVBoxLayout(box)
        t = QLabel(title)
        t.setStyleSheet("font-weight: 700; font-size: 13px;")
        v.addWidget(t)
        pix = qr_pixmap(url)
        if pix:
            img = QLabel()
            img.setPixmap(pix)
            img.setAlignment(Qt.AlignmentFlag.AlignCenter)
            v.addWidget(img)
        else:
            v.addWidget(QLabel("(instala «qrcode» para ver el QR: pip install qrcode)"))
        h = QLabel(hint)
        h.setWordWrap(True)
        h.setStyleSheet("font-size: 11px; color: #555;")
        v.addWidget(h)
        btn = QPushButton("Copiar enlace")
        btn.setObjectName("primary")
        btn.clicked.connect(lambda: (QApplication.clipboard().setText(url), btn.setText("✓ Copiado")))
        v.addWidget(btn)
        box.setFixedWidth(270)
        return box


# =============================================================================
# 13. VENTANA PRINCIPAL — diseño de la intranet compAI, modo día (fondo crema)
# =============================================================================
# Tokens del «Manual de botones, fuentes y colores» de la intranet (estado/index.html, 11-11-2026)
V_CREMA, V_SOLIDO = "#F5F0E4", "#FFFFFF"
V_INK, V_INK2, V_INK3 = "#13202E", "#34424F", "#44515F"
V_ACC, V_ACC_H, V_ACC_T = "#A85E28", "#B86A32", "#7A4A12"
V_OK, V_BAD = "#0F5C7A", "#9E2A1C"
V_VERDE, V_VERDE_H = "#37B35A", "#2FA04F"   # verde del logo w-notes
V_GRIS, V_GRIS_H = "#5E6670", "#4C535C"
V_LINE, V_LINE2 = "rgba(8,30,56,0.14)", "rgba(8,30,56,0.30)"
F_DISP = "'Space Grotesk','Segoe UI Variable Display','Segoe UI',sans-serif"
F_MONO = "Consolas,'Cascadia Mono','Segoe UI Mono',monospace"

QSS = f"""
QWidget#central {{ background: {V_CREMA}; }}
QWidget {{ color: {V_INK}; font-family: 'Segoe UI', sans-serif; font-size: 13px; }}
QLabel, QCheckBox {{ background: transparent; }}
QFrame#card {{ background: rgba(255,255,255,0.72); border: 1px solid {V_LINE}; border-radius: 10px; }}
QFrame#hdr {{ background: rgba(255,255,255,0.80); border: 1px solid {V_LINE}; border-radius: 12px; }}
QLabel#title {{ font-family: {F_DISP}; font-size: 22px; font-weight: 600; color: {V_INK}; }}
QLabel#hero {{ font-family: 'Segoe UI Variable Display','Segoe UI',sans-serif; font-size: 40px; font-weight: 400; color: {V_INK}; }}
QLabel#eyebrow, QLabel#rotulo {{ font-family: {F_MONO}; font-size: 11px; letter-spacing: 1.2px; color: {V_INK3}; }}
QLabel#sec {{ font-family: {F_DISP}; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: {V_ACC_T}; }}
QLabel#chip {{ font-family: {F_MONO}; font-size: 11px; color: {V_OK}; background: rgba(15,92,122,0.12);
  border: 1px solid {V_OK}; border-radius: 6px; padding: 3px 8px; }}
QLabel#chipwarn {{ font-family: {F_MONO}; font-size: 11px; color: {V_ACC_T}; background: #FFF0D2;
  border: 1px solid #C57B45; border-radius: 6px; padding: 3px 8px; }}
QLabel#hint {{ color: {V_INK2}; font-size: 12px; }}
QPushButton {{ font-family: {F_DISP}; font-weight: 600; border-radius: 8px; padding: 7px 14px; }}
QPushButton#primary {{ background: {V_ACC}; color: #FFFFFF; border: 1px solid {V_ACC}; }}
QPushButton#primary:hover {{ background: {V_ACC_H}; border-color: {V_ACC_H}; }}
QPushButton#secondary {{ background: rgba(255,255,255,0.72); color: {V_INK}; border: 1px solid {V_LINE2}; border-radius: 6px; }}
QPushButton#secondary:hover {{ border-color: {V_ACC}; }}
QPushButton#icon {{ background: rgba(255,255,255,0.72); color: {V_INK}; border: 1px solid {V_LINE2}; border-radius: 6px;
  padding: 4px; font-size: 16px; min-width: 32px; min-height: 30px; }}
QPushButton#icon:hover {{ border-color: {V_ACC}; }}
QPushButton#nueva {{ background: {V_VERDE}; color: #FFFFFF; border: 1px solid {V_VERDE}; }}
QPushButton#nueva:hover {{ background: {V_VERDE_H}; border-color: {V_VERDE_H}; }}
QPushButton#print {{ background: {V_GRIS}; color: #FFFFFF; border: 1px solid {V_GRIS}; }}
QPushButton#print:hover {{ background: {V_GRIS_H}; }}
QPushButton#print:disabled {{ background: #A9AEB4; color: #FFFFFF; border: 1px solid #A9AEB4; }}
QPushButton#rec {{ background: {V_BAD}; color: #FFFFFF; border: 1px solid {V_BAD}; }}
QPushButton#recon {{ background: {V_OK}; color: #FFFFFF; border: 1px solid {V_OK}; }}
QPushButton:disabled {{ background: #E9E4D8; color: #9A9A94; border: 1px solid {V_LINE}; }}
QPushButton#link {{ background: transparent; border: none; color: {V_INK2}; font-family: {F_MONO};
  font-weight: 400; font-size: 11px; text-align: left; padding: 2px; }}
QPushButton#link:hover {{ color: {V_ACC_T}; }}
QLineEdit, QComboBox, QTextEdit {{ background: {V_SOLIDO}; color: {V_INK}; border: 1px solid {V_LINE2};
  border-radius: 6px; padding: 6px 9px; selection-background-color: {V_OK}; }}
QLineEdit:focus, QComboBox:focus, QTextEdit:focus {{ border: 1px solid {V_OK}; }}
QLineEdit:disabled {{ background: #EFEBE2; color: #8a8a86; }}
QTableWidget {{ background: transparent; border: none; gridline-color: {V_LINE}; alternate-background-color: rgba(255,255,255,0.45); }}
QTableWidget::item:selected {{ background: rgba(15,92,122,0.14); color: {V_INK}; }}
QHeaderView::section {{ background: transparent; border: none; border-bottom: 1px solid {V_LINE2}; padding: 6px 4px;
  font-family: {F_MONO}; font-size: 11px; letter-spacing: 1px; color: {V_INK3}; }}
QScrollArea {{ background: transparent; border: none; }}
QSplitter::handle {{ background: transparent; width: 10px; }}
QHeaderView {{ background: transparent; border: none; }}
QTableCornerButton::section {{ background: transparent; border: none; }}
QScrollBar:vertical {{ background: transparent; width: 10px; margin: 2px; }}
QScrollBar:horizontal {{ background: transparent; height: 10px; margin: 2px; }}
QScrollBar::handle:vertical {{ background: rgba(8,30,56,0.25); border-radius: 3px; min-height: 30px; }}
QScrollBar::handle:horizontal {{ background: rgba(8,30,56,0.25); border-radius: 3px; min-width: 30px; }}
QScrollBar::handle:hover {{ background: rgba(8,30,56,0.40); }}
QScrollBar::add-line, QScrollBar::sub-line {{ width: 0; height: 0; }}
QScrollBar::add-page, QScrollBar::sub-page {{ background: transparent; }}
QCheckBox::indicator {{ width: 16px; height: 16px; }}
"""


def _label(text: str, name: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setObjectName(name)
    return lbl


def _btn(text: str, name: str, slot=None, tip: str = "") -> QPushButton:
    b = QPushButton(text)
    b.setObjectName(name)
    b.setCursor(Qt.CursorShape.PointingHandCursor)
    if tip:
        b.setToolTip(tip)
    if slot:
        b.clicked.connect(slot)
    return b


def _card() -> tuple[QFrame, QVBoxLayout]:
    f = QFrame()
    f.setObjectName("card")
    v = QVBoxLayout(f)
    v.setContentsMargins(16, 12, 16, 14)
    v.setSpacing(8)
    return f, v


class NoteCard(QFrame):
    def __init__(self, note: dict, on_open):
        super().__init__()
        th = get_theme(note["theme_key"])
        fg = "#ffffff" if th["text_light"] else INK
        self.setObjectName("note")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setStyleSheet(f"QFrame#note {{ background: {th['hex']}; border-radius: 10px; border: 1px solid rgba(8,30,56,0.10); }}"
                           f" QLabel {{ color: {fg}; background: transparent; }}")
        self.setFixedSize(220, 104)
        v = QVBoxLayout(self)
        v.setContentsMargins(12, 10, 12, 10)
        top = QLabel(f"{th['label'].upper()} · {note_time_label(note)}")
        top.setStyleSheet(f"font-family: {F_MONO}; font-size: 10px; letter-spacing: 1px;")
        txt = QLabel(note["text"] if len(note["text"]) < 150 else note["text"][:147] + "…")
        txt.setTextFormat(Qt.TextFormat.PlainText)
        txt.setWordWrap(True)
        txt.setStyleSheet("font-size: 12px;")
        v.addWidget(top)
        v.addWidget(txt, 1)
        self._on_open, self._note = on_open, note

    def mouseReleaseEvent(self, event):
        self._on_open(self._note, event.globalPosition().toPoint())


class SettingsDialog(QDialog):
    """Toda la configuración de w-notes en un solo lugar (ícono ⚙)."""

    def __init__(self, win: "MainWNoteWindow"):
        super().__init__(win)
        self.win, self.storage, self.cloud = win, win.storage, win.cloud_sync
        self.setWindowTitle("Configuración — w-notes")
        self.setWindowIcon(logo_icon())
        self.setStyleSheet(QSS + f"QDialog {{ background: {V_CREMA}; }}")
        self.resize(680, 640)
        cfg = self.storage.config

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        body = QWidget()
        body.setObjectName("central")
        lay = QVBoxLayout(body)
        lay.setContentsMargins(18, 16, 18, 16)
        lay.setSpacing(12)
        scroll.setWidget(body)
        outer.addWidget(scroll)

        head = QHBoxLayout()
        logo = QLabel()
        logo.setPixmap(logo_pixmap(36))
        head.addWidget(logo)
        col = QVBoxLayout()
        col.setSpacing(0)
        col.addWidget(_label("W-NOTES · CONFIGURACIÓN", "eyebrow"))
        col.addWidget(_label("Ajustes", "title"))
        head.addLayout(col, 1)
        lay.addLayout(head)

        # Cápsula
        c, v = _card()
        v.addWidget(_label("CÁPSULA LATERAL", "sec"))
        row = QHBoxLayout()
        row.addWidget(_label("POSICIÓN", "rotulo"))
        self.combo_pos = QComboBox()
        self.combo_pos.addItem("Izquierda", "left")
        self.combo_pos.addItem("Derecha", "right")
        self.combo_pos.setCurrentIndex(0 if cfg.get("capsule_position", "left") == "left" else 1)
        row.addWidget(self.combo_pos)
        row.addStretch()
        v.addLayout(row)
        self.chk_top = QCheckBox("Siempre visible sobre otras apps")
        self.chk_top.setChecked(cfg.get("capsule_always_on_top", True))
        self.chk_auto = QCheckBox("Replegar el widget a la cápsula al abrir otra app")
        self.chk_auto.setChecked(cfg.get("auto_dock_on_other_app", True))
        v.addWidget(self.chk_top)
        v.addWidget(self.chk_auto)
        for w in (self.combo_pos,):
            w.currentIndexChanged.connect(self._save_capsule)
        for w in (self.chk_top, self.chk_auto):
            w.stateChanged.connect(self._save_capsule)
        lay.addWidget(c)

        # Ubicación
        c, v = _card()
        v.addWidget(_label("UBICACIÓN Y CLIMA", "sec"))
        row = QHBoxLayout()
        self.combo_loc = QComboBox()
        self.combo_loc.addItem("Automática (como la intranet)", "auto")
        self.combo_loc.addItem("Fija", "fija")
        self.combo_loc.setCurrentIndex(0 if cfg.get("location_mode", "auto") == "auto" else 1)
        row.addWidget(self.combo_loc, 1)
        self.btn_loc = _btn("Actualizar ahora", "secondary", self._refresh_location)
        row.addWidget(self.btn_loc)
        v.addLayout(row)
        row = QHBoxLayout()
        self.inp_city = QLineEdit(cfg.get("location_label", ""))
        self.inp_city.setPlaceholderText("Ciudad")
        self.inp_lat = QLineEdit(str(cfg.get("location_lat", "")))
        self.inp_lon = QLineEdit(str(cfg.get("location_lon", "")))
        self.inp_lat.setPlaceholderText("Latitud")
        self.inp_lon.setPlaceholderText("Longitud")
        row.addWidget(self.inp_city, 2)
        row.addWidget(self.inp_lat, 1)
        row.addWidget(self.inp_lon, 1)
        v.addLayout(row)
        self.lbl_loc = _label("", "hint")
        v.addWidget(self.lbl_loc)
        self.combo_loc.currentIndexChanged.connect(self._loc_mode_changed)
        for w in (self.inp_city, self.inp_lat, self.inp_lon):
            w.editingFinished.connect(self._save_fixed_location)
        self.win.bus.weather_changed.connect(self._show_location)
        self._loc_mode_changed(save=False)
        lay.addWidget(c)

        # Nube
        c, v = _card()
        v.addWidget(_label("NUBE · IPHONE POR 4G/5G", "sec"))
        self.chk_cloud = QCheckBox("Sincronizar con la nube (Apps Script en tu cuenta compai.cl)")
        self.chk_cloud.setChecked(cfg.get("cloud_sync_enabled", True))
        v.addWidget(self.chk_cloud)
        v.addWidget(_label("URL /EXEC", "rotulo"))
        self.inp_url = QLineEdit(cfg.get("cloud_sync_url", ""))
        self.inp_url.setPlaceholderText("https://script.google.com/macros/s/…/exec")
        v.addWidget(self.inp_url)
        v.addWidget(_label("TOKEN", "rotulo"))
        self.inp_token = QLineEdit(cfg.get("cloud_api_key", ""))
        self.inp_token.setEchoMode(QLineEdit.EchoMode.Password)
        v.addWidget(self.inp_token)
        row = QHBoxLayout()
        row.addWidget(_btn("Probar", "secondary", self._test))
        row.addWidget(_btn("↻ Sincronizar", "secondary", self.win.sync_now))
        row.addWidget(_btn("📱 Vincular celular", "secondary", self.win.link_phone))
        row.addStretch()
        v.addLayout(row)
        self.lbl_cloud = _label(self.cloud.last_status, "hint")
        v.addWidget(self.lbl_cloud)
        self.win.bus.sync_status.connect(self.lbl_cloud.setText)
        self.chk_cloud.stateChanged.connect(self._save_cloud)
        self.inp_url.editingFinished.connect(self._save_cloud)
        self.inp_token.editingFinished.connect(self._save_cloud)
        lay.addWidget(c)

        # Wi-Fi local
        c, v = _card()
        v.addWidget(_label("WI-FI LOCAL (SIN INTERNET)", "sec"))
        srv = self.win.mobile_server
        v.addWidget(_label(f"http://{srv.local_ip}:{srv.port}  ·  {'activo' if srv.running else 'apagado'}", "rotulo"))
        v.addWidget(_label("Mismo panel del celular cuando está en tu red. El QR está en «Vincular celular».", "hint"))
        lay.addWidget(c)

        # Grabación
        c, v = _card()
        v.addWidget(_label("GRABACIÓN Y ACTAS", "sec"))
        self.chk_mic = QCheckBox("Grabar también el micrófono (archivo aparte)")
        self.chk_mic.setChecked(cfg.get("record_mic", True))
        self.chk_mic.stateChanged.connect(lambda: self._set("record_mic", self.chk_mic.isChecked()))
        v.addWidget(self.chk_mic)
        row = QHBoxLayout()
        row.addWidget(_label("NOMENCLATURA", "rotulo"))
        self.combo_naming = QComboBox()
        for label, key in (("AAAA-MM-DD_Org_Tema", "DATE_ORG_TOPIC"), ("Org_AAAA-MM-DD_Tema", "ORG_DATE_TOPIC"),
                           ("AAAA-MM-DD_Tema_Org", "DATE_TOPIC_ORG")):
            self.combo_naming.addItem(label, key)
        self.combo_naming.setCurrentIndex(max(0, self.combo_naming.findData(cfg.get("naming_format"))))
        self.combo_naming.currentIndexChanged.connect(lambda: self._set("naming_format", self.combo_naming.currentData()))
        row.addWidget(self.combo_naming)
        row.addStretch()
        v.addLayout(row)
        folder = _btn(f"📁 {self.storage.actas_dir}", "link",
                      lambda: QDesktopServices.openUrl(QUrl.fromLocalFile(str(self.storage.actas_dir))))
        v.addWidget(folder)
        lay.addWidget(c)

        # Atajos
        c, v = _card()
        v.addWidget(_label("ATAJOS GLOBALES", "sec"))
        v.addWidget(_label("Ctrl+Alt+N  nota rápida   ·   Ctrl+Alt+R  grabar / detener   ·   Ctrl+Alt+P  print clave",
                           "rotulo"))
        lay.addWidget(c)
        lay.addStretch()

        foot = QHBoxLayout()
        foot.setContentsMargins(18, 8, 18, 14)
        foot.addWidget(_label(f"w-notes {APP_VERSION} · compAI", "rotulo"))
        foot.addStretch()
        foot.addWidget(_btn("Listo", "primary", self.accept))
        outer.addLayout(foot)

    def _set(self, key, value):
        self.storage.config[key] = value
        self.storage.save_config()

    def _save_capsule(self):
        cfg = self.storage.config
        cfg["capsule_position"] = self.combo_pos.currentData()
        cfg["capsule_always_on_top"] = self.chk_top.isChecked()
        cfg["auto_dock_on_other_app"] = self.chk_auto.isChecked()
        self.storage.save_config()
        self.win.settings_updated.emit()

    def _save_cloud(self):
        cfg = self.storage.config
        cfg["cloud_sync_enabled"] = self.chk_cloud.isChecked()
        cfg["cloud_sync_url"] = self.inp_url.text().strip()
        cfg["cloud_api_key"] = self.inp_token.text().strip()
        self.storage.save_config()
        self.win.refresh_status()

    def _test(self):
        self._save_cloud()
        if not self.cloud.configured():
            self.lbl_cloud.setText("Falta URL o token")
            return
        QApplication.setOverrideCursor(Qt.CursorShape.WaitCursor)
        try:
            self.lbl_cloud.setText(self.cloud.test_connection())
        finally:
            QApplication.restoreOverrideCursor()
        self.win.sync_now()

    def _loc_mode_changed(self, *_, save: bool = True):
        auto = self.combo_loc.currentData() == "auto"
        for w in (self.inp_city, self.inp_lat, self.inp_lon):
            w.setEnabled(not auto)
        self.btn_loc.setVisible(auto)
        if save:
            self._set("location_mode", self.combo_loc.currentData())
            if auto:
                self._refresh_location()
            else:
                self._save_fixed_location()
        self._show_location()

    def _save_fixed_location(self):
        if self.combo_loc.currentData() != "fija":
            return
        cfg = self.storage.config
        try:
            cfg["location_lat"] = float(self.inp_lat.text().replace(",", "."))
            cfg["location_lon"] = float(self.inp_lon.text().replace(",", "."))
        except ValueError:
            self.lbl_loc.setText("Latitud y longitud deben ser números (ej. -33.4489, -70.6693)")
            return
        cfg["location_label"] = self.inp_city.text().strip()
        self.storage.save_config()
        self.win.weather.fetch_async()
        self._show_location()

    def _refresh_location(self):
        self.lbl_loc.setText("Buscando ubicación…")
        self.win.location.refresh_async()

    @Slot()
    def _show_location(self):
        cfg = self.storage.config
        src = {"equipo": "ubicación del equipo", "red": "ubicación por red (IP)",
               "respaldo": "respaldo fijo: no se pudo ubicar"}.get(self.win.location.source, "")
        self.inp_city.setText(cfg.get("location_label", ""))
        self.inp_lat.setText(str(cfg.get("location_lat", "")))
        self.inp_lon.setText(str(cfg.get("location_lon", "")))
        w = self.storage.weather
        temp = f" · {w['temp']}°" if "temp" in w else ""
        self.lbl_loc.setText(f"{cfg.get('location_label') or 'Sin nombre'}{temp}" + (f" · {src}" if src else ""))


class MainWNoteWindow(QMainWindow):
    settings_updated = Signal()
    hotkey_pressed = Signal(int)

    def __init__(self, storage, recorder, mobile_server, cloud_sync, popup, bus: Bus, location=None, weather=None):
        super().__init__()
        self.storage, self.recorder = storage, recorder
        self.mobile_server, self.cloud_sync, self.popup, self.bus = mobile_server, cloud_sync, popup, bus
        self.location, self.weather = location, weather
        self._fitted = False
        self.setWindowTitle("w-notes — notas, grabador y actas")
        self.setWindowIcon(logo_icon())
        self.setWindowFlags(Qt.WindowType.Window | Qt.WindowType.WindowMinMaxButtonsHint
                            | Qt.WindowType.WindowCloseButtonHint | Qt.WindowType.WindowTitleHint
                            | Qt.WindowType.WindowSystemMenuHint)
        self.setMinimumSize(720, 460)
        self._build_ui()
        self.refresh_notes()
        self.refresh_actas_table()
        self.bus.sync_status.connect(lambda _t: self.refresh_status())
        self.rec_timer = QTimer(self)
        self.rec_timer.timeout.connect(self._update_recording_ui)
        self.rec_timer.start(1000)

    # ---- ventana: cabe en pantallas chicas, se puede maximizar y minimizar ---------------
    def showEvent(self, event):
        if not self._fitted:
            self._fitted = True
            avail = (self.screen() or QGuiApplication.primaryScreen()).availableGeometry()
            w, h = min(1180, avail.width() - 40), min(800, avail.height() - 40)
            self.resize(w, h)
            self.move(avail.left() + (avail.width() - w) // 2, avail.top() + (avail.height() - h) // 2)
        super().showEvent(event)

    def nativeEvent(self, event_type, message):
        if sys.platform == "win32" and bytes(event_type) == b"windows_generic_MSG":
            try:
                from ctypes import wintypes
                msg = wintypes.MSG.from_address(int(message))
                if msg.message == 0x0312:  # WM_HOTKEY
                    self.hotkey_pressed.emit(int(msg.wParam))
                    return True, 0
            except Exception:
                pass
        return False, 0

    def closeEvent(self, event):
        # La X oculta (sigue en la bandeja). app.quit() también manda closeEvent y si se ignora
        # cancela la salida (Qt 6): por eso se distingue con spontaneous().
        if event.spontaneous():
            event.ignore()
            self.hide()
        else:
            event.accept()

    # ---- interfaz -------------------------------------------------------------------------
    def _build_ui(self):
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        central = QWidget()
        central.setObjectName("central")
        central.setStyleSheet(QSS)
        scroll.setWidget(central)
        scroll.setStyleSheet(f"QScrollArea {{ background: {V_CREMA}; border: none; }}")
        self.setCentralWidget(scroll)
        main = QVBoxLayout(central)
        main.setContentsMargins(18, 16, 18, 16)
        main.setSpacing(14)

        # Encabezado
        header = QFrame()
        header.setObjectName("hdr")
        hv = QVBoxLayout(header)
        hv.setContentsMargins(20, 14, 20, 16)
        hv.setSpacing(6)
        marcas = QHBoxLayout()
        compai = QLabel()
        pix = compai_logo_pixmap(28)
        if pix:
            compai.setPixmap(pix)
        else:
            compai.setText("compAI")
            compai.setObjectName("title")
        compai.setToolTip("compAI")
        marcas.addWidget(compai, 0, Qt.AlignmentFlag.AlignVCenter)
        marcas.addStretch()
        wlogo = QLabel()
        wlogo.setPixmap(logo_pixmap(48))
        wlogo.setToolTip("w-notes")
        marcas.addWidget(wlogo)
        hv.addLayout(marcas)
        h = QHBoxLayout()
        h.setSpacing(10)
        col = QVBoxLayout()
        col.setSpacing(0)
        col.addWidget(_label("w-notes", "hero"))
        col.addWidget(_label("de compA\\", "eyebrow"))
        h.addLayout(col, 1)
        self.lbl_status = _label("", "chip")
        h.addWidget(self.lbl_status, 0, Qt.AlignmentFlag.AlignBottom)
        h.addWidget(_btn("📱", "icon", self.link_phone, "Vincular celular (QR)"), 0, Qt.AlignmentFlag.AlignBottom)
        h.addWidget(_btn("⚙", "icon", self.open_settings, "Configuración"), 0, Qt.AlignmentFlag.AlignBottom)
        h.addWidget(_btn("+ Nueva nota", "nueva",
                         lambda: self.popup.show_quick_creator(QPoint(self.x() + 80, self.y() + 110)),
                         "Ctrl+Alt+N desde cualquier app"), 0, Qt.AlignmentFlag.AlignBottom)
        hv.addLayout(h)
        main.addWidget(header)

        # Notas de vidrio
        notes_box, nb = _card()
        top = QHBoxLayout()
        self.lbl_notes_title = _label("NOTAS DE VIDRIO", "sec")
        top.addWidget(self.lbl_notes_title)
        top.addStretch()
        top.addWidget(_label("SINCRONIZADAS CON EL CELULAR", "rotulo"))
        nb.addLayout(top)
        notes_scroll = QScrollArea()
        notes_scroll.setWidgetResizable(True)
        notes_scroll.setFrameShape(QFrame.Shape.NoFrame)
        notes_scroll.setFixedHeight(126)
        notes_scroll.setStyleSheet("QScrollArea, QScrollArea > QWidget > QWidget { background: transparent; }")
        holder = QWidget()
        self.notes_row = QHBoxLayout(holder)
        self.notes_row.setContentsMargins(0, 0, 0, 0)
        self.notes_row.setSpacing(10)
        notes_scroll.setWidget(holder)
        nb.addWidget(notes_scroll)
        main.addWidget(notes_box)

        # Grabación
        rec, rv = _card()
        top = QHBoxLayout()
        top.addWidget(_label("GRABAR REUNIÓN", "sec"))
        top.addStretch()
        self.lbl_rec_status = _label("LISTO", "rotulo")
        top.addWidget(self.lbl_rec_status)
        rv.addLayout(top)
        r = QHBoxLayout()
        self.inp_org = QLineEdit()
        self.inp_org.setPlaceholderText("Organización (ej. Banco_Andes)")
        self.inp_topic = QLineEdit()
        self.inp_topic.setPlaceholderText("Tema (ej. Cierre_Q4)")
        self.combo_platform = QComboBox()
        self.combo_platform.addItems(["Google Meet", "MS Teams", "Zoom", "Otra Videollamada"])
        self.btn_record_toggle = _btn("● Grabar", "rec", self._toggle_recording, "Ctrl+Alt+R")
        self.btn_screenshot = _btn("Print", "print", self._take_screenshot, "Print de pantalla clave (Ctrl+Alt+P)")
        self.btn_screenshot.setIcon(svg_icon(CAMERA_SVG))
        self.btn_screenshot.setIconSize(QSize(18, 18))
        self.btn_screenshot.setEnabled(False)
        r.addWidget(self.inp_org, 2)
        r.addWidget(self.inp_topic, 2)
        r.addWidget(self.combo_platform, 1)
        r.addWidget(self.btn_record_toggle)
        r.addWidget(self.btn_screenshot)
        rv.addLayout(r)
        self.inp_live = QLineEdit()
        self.inp_live.setPlaceholderText("Nota en vivo con marca de tiempo… (Enter)")
        self.inp_live.setEnabled(False)
        self.inp_live.returnPressed.connect(self._add_live_note)
        rv.addWidget(self.inp_live)
        main.addWidget(rec)

        # Actas
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setChildrenCollapsible(False)
        left, lv = _card()
        top = QHBoxLayout()
        top.addWidget(_label("ACTAS DE REUNIÓN", "sec"))
        top.addStretch()
        top.addWidget(_btn("📁 Abrir carpeta", "secondary",
                           lambda: QDesktopServices.openUrl(QUrl.fromLocalFile(str(self.storage.actas_dir)))))
        lv.addLayout(top)
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["NOMBRE ESTÁNDAR", "FECHA", "ORGANIZACIÓN", "SISTEMA", "PRINTS"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        for col in range(1, 5):
            self.table.horizontalHeader().setSectionResizeMode(col, QHeaderView.ResizeMode.ResizeToContents)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        self.table.verticalHeader().setVisible(False)
        self.table.setShowGrid(False)
        self.table.setMinimumHeight(220)
        self.table.itemSelectionChanged.connect(self._on_row_selected)
        self.table.doubleClicked.connect(self._open_selected_acta)
        lv.addWidget(self.table)

        right, rp = _card()
        ph = QHBoxLayout()
        ph.addWidget(_label("ACTA PARA EL EQUIPO", "sec"))
        ph.addStretch()
        ph.addWidget(_btn("Copiar", "secondary", lambda: QApplication.clipboard().setText(self.preview_text.toPlainText())))
        ph.addWidget(_btn("Abrir", "secondary", self._open_selected_acta))
        rp.addLayout(ph)
        self.preview_text = QTextEdit()
        self.preview_text.setReadOnly(True)
        self.preview_text.setMinimumHeight(220)
        rp.addWidget(self.preview_text)
        splitter.addWidget(left)
        splitter.addWidget(right)
        splitter.setSizes([640, 460])
        main.addWidget(splitter, 1)
        self.refresh_status()

    # ---- estado y acciones ---------------------------------------------------------------------
    def refresh_status(self):
        st = self.cloud_sync.last_status if self.cloud_sync.configured() else "Nube sin configurar"
        ok = st.startswith("Nube OK")
        self.lbl_status.setObjectName("chip" if ok else "chipwarn")
        self.lbl_status.setText(("● " if ok else "○ ") + st.upper())
        self.lbl_status.style().unpolish(self.lbl_status)
        self.lbl_status.style().polish(self.lbl_status)

    def set_lan_label(self):
        self.refresh_status()

    def open_settings(self):
        SettingsDialog(self).exec()

    def sync_now(self):
        self.cloud_sync.sync_async()
        self.cloud_sync.fetch_agenda_async()

    def link_phone(self):
        LinkPhoneDialog(self, self.storage, self.mobile_server, self.cloud_sync).exec()

    _link_phone = link_phone  # compatibilidad con la bandeja

    @Slot()
    def refresh_notes(self):
        while self.notes_row.count():
            item = self.notes_row.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        notes = self.storage.visible_notes()
        self.lbl_notes_title.setText(f"NOTAS DE VIDRIO · {len(notes)}")
        if not notes:
            self.notes_row.addWidget(_label("Aún no hay notas. Usa «+ Nota rápida» o Ctrl+Alt+N desde cualquier app.", "hint"))
        for note in notes[:40]:
            self.notes_row.addWidget(NoteCard(note, lambda n, pos: self.popup.show_registered_note(n, pos)))
        self.notes_row.addStretch()

    def _style_record_button(self, recording: bool):
        self.btn_record_toggle.setText("■ Finalizar y archivar" if recording else "● Grabar")
        self.btn_record_toggle.setObjectName("recon" if recording else "rec")
        self.btn_record_toggle.style().unpolish(self.btn_record_toggle)
        self.btn_record_toggle.style().polish(self.btn_record_toggle)

    def start_external_recording(self, org: str, topic: str, platform: str, link: str = ""):
        if org:
            self.inp_org.setText(org)
        if topic:
            self.inp_topic.setText(topic)
        idx = self.combo_platform.findText(platform)
        if idx >= 0:
            self.combo_platform.setCurrentIndex(idx)
        self._pending_link = link
        if not self.recorder.is_recording:
            self._toggle_recording()
        self.showNormal()
        self.raise_()
        self.activateWindow()

    def _toggle_recording(self):
        if not self.recorder.is_recording:
            self.recorder.start(self.inp_org.text() or "Organizacion", self.inp_topic.text() or "Reunion",
                                self.combo_platform.currentText(), getattr(self, "_pending_link", ""))
            self._pending_link = ""
            self._style_record_button(True)
            self.btn_screenshot.setEnabled(True)
            self.inp_live.setEnabled(True)
        else:
            md_path = self.recorder.stop_and_archive()
            self._style_record_button(False)
            self.btn_screenshot.setEnabled(False)
            self.inp_live.setEnabled(False)
            self.lbl_rec_status.setText("ARCHIVADO")
            self.refresh_actas_table()
            msg = f"Acta guardada en:\n{md_path}"
            if self.recorder.audio_errors:
                msg += "\n\nAudio: " + "; ".join(self.recorder.audio_errors)
            QMessageBox.information(self, "Acta guardada", msg)

    def is_recording(self) -> bool:
        return self.recorder.is_recording

    def _take_screenshot(self):
        if self.recorder.is_recording:
            self.recorder.capture_key_screenshot()
            self._update_recording_ui()

    def _add_live_note(self):
        if self.recorder.is_recording and self.inp_live.text().strip():
            self.recorder.add_live_note(self.inp_live.text())
            self.inp_live.clear()

    def _update_recording_ui(self):
        if self.recorder.is_recording:
            n = len(self.recorder.screenshots)
            self.lbl_rec_status.setText(f"● REC {self.recorder.elapsed_str()}" + (f" · {n} PRINT{'S' if n != 1 else ''}" if n else ""))

    def refresh_actas_table(self):
        self._records = self.storage.list_actas()
        self.table.setRowCount(len(self._records))
        for row, rec in enumerate(self._records):
            for col, key in enumerate(("filename", "date", "organization", "platform", "screenshots_count")):
                self.table.setItem(row, col, QTableWidgetItem(str(rec[key])))
        if self._records:
            self.table.selectRow(0)
        else:
            self.preview_text.setPlainText("Aún no hay actas. Graba una reunión con ● o Ctrl+Alt+R.")

    def _selected(self) -> dict | None:
        rows = self.table.selectionModel().selectedRows()
        if rows and 0 <= rows[0].row() < len(self._records):
            return self._records[rows[0].row()]
        return None

    def _on_row_selected(self):
        rec = self._selected()
        if rec:
            self.preview_text.setMarkdown(rec["content"])

    def _open_selected_acta(self, *_):
        rec = self._selected()
        if rec:
            QDesktopServices.openUrl(QUrl.fromLocalFile(rec["path"]))


# =============================================================================
# 14. CONTROLADOR: BANDEJA, ATAJOS, SINCRONÍA Y DETECCIÓN DE VENTANA ACTIVA
# =============================================================================
HOTKEY_NOTE, HOTKEY_REC, HOTKEY_PRINT = 1, 2, 3


class WNoteController(QObject):
    def __init__(self, app: QApplication):
        super().__init__()
        self.app = app
        self.bus = Bus()
        self.storage = StorageManager(self.bus)
        self.cloud_sync = CloudSyncClient(self.storage, self.bus)
        self.weather = WeatherClient(self.storage, self.bus)
        self.location = LocationClient(self.storage, self.bus, on_done=self.weather.fetch_async)

        self.mobile_server = MobileSyncServer(self.storage)
        if self.storage.config.get("mobile_server_enabled", True):
            self.mobile_server.start()

        self.recorder = MeetingRecorderEngine(self.storage)
        self.popup = FloatingGlassNotePopup(self.storage)
        self.desktop_widget = DesktopWidgetWindow(self.storage, self.popup, self.cloud_sync)
        self.side_capsule = FloatingSideCapsuleWindow(self.storage, self.popup)
        self.main_window = MainWNoteWindow(self.storage, self.recorder, self.mobile_server, self.cloud_sync,
                                           self.popup, self.bus, self.location, self.weather)

        # Señales
        for slot in (self.desktop_widget.rebuild_capsules, self.side_capsule.rebuild_capsules,
                     self.main_window.refresh_notes):
            self.bus.notes_changed.connect(slot)
        self.bus.agenda_changed.connect(self.desktop_widget.refresh_agenda)
        self.bus.weather_changed.connect(self.desktop_widget.refresh_weather)
        self.bus.local_mutation.connect(self._schedule_sync, Qt.ConnectionType.QueuedConnection)
        self.side_capsule.open_main_requested.connect(self.open_main_window)
        self.desktop_widget.open_main_requested.connect(self.open_main_window)
        self.desktop_widget.record_meeting_requested.connect(self.main_window.start_external_recording)
        self.main_window.settings_updated.connect(self._apply_settings)
        self.main_window.hotkey_pressed.connect(self._on_hotkey)

        # Sincronía: al cambiar algo (1,5 s después), cada 20 s, agenda cada 5 min, clima cada 15 min
        self._sync_debounce = QTimer(self)
        self._sync_debounce.setSingleShot(True)
        self._sync_debounce.timeout.connect(self.cloud_sync.sync_async)
        self._timers = []
        for ms, fn in ((20_000, self.cloud_sync.sync_async), (300_000, self.cloud_sync.fetch_agenda_async),
                       (900_000, self.weather.fetch_async), (1_800_000, self.location.refresh_async)):
            t = QTimer(self)
            t.timeout.connect(fn)
            t.start(ms)
            self._timers.append(t)
        self.cloud_sync.sync_async()
        self.cloud_sync.fetch_agenda_async()
        self.weather.fetch_async()            # clima con la última ubicación conocida…
        self.location.refresh_async()         # …y luego con la ubicación actual
        QTimer.singleShot(1500, self.main_window.set_lan_label)

        self._build_tray()
        self._register_hotkeys()

        self.desktop_widget.show()
        if self.storage.config.get("capsule_always_on_top", True):
            self.side_capsule.show()

        self.focus_timer = QTimer(self)
        self.focus_timer.timeout.connect(self._check_windows_foreground_app)
        self.focus_timer.start(700)
        app.aboutToQuit.connect(self._on_quit)

    # ---- bandeja --------------------------------------------------------------------
    def _build_tray(self):
        self.tray = QSystemTrayIcon(logo_icon(), self)
        self.tray.setToolTip("w-notes")
        menu = QMenu()
        for text, fn in (("Abrir w-notes", self.open_main_window), ("+ Nota rápida  (Ctrl+Alt+N)", self.quick_note),
                         ("● Grabar / detener  (Ctrl+Alt+R)", self.toggle_record),
                         ("Mostrar widget", self.desktop_widget.show),
                         ("📱 Vincular celular", self.main_window.link_phone)):
            act = QAction(text, menu)
            act.triggered.connect(fn)
            menu.addAction(act)
        menu.addSeparator()
        quit_act = QAction("Salir de w-notes", menu)
        quit_act.triggered.connect(self.app.quit)
        menu.addAction(quit_act)
        self._tray_menu = menu
        self.tray.setContextMenu(menu)
        self.tray.activated.connect(
            lambda reason: self.open_main_window() if reason == QSystemTrayIcon.ActivationReason.Trigger else None)
        self.tray.show()

    # ---- atajos globales --------------------------------------------------------------
    def _register_hotkeys(self):
        self._hotkeys_ok = False
        if sys.platform != "win32" or not self.storage.config.get("hotkeys_enabled", True):
            return
        try:
            user32 = ctypes.windll.user32
            hwnd = int(self.main_window.winId())
            mods = 0x0001 | 0x0002 | 0x4000  # ALT | CONTROL | NOREPEAT
            for hid, key in ((HOTKEY_NOTE, "N"), (HOTKEY_REC, "R"), (HOTKEY_PRINT, "P")):
                if not user32.RegisterHotKey(hwnd, hid, mods, ord(key)):
                    print(f"[w-note] Ctrl+Alt+{key} ya lo usa otra app")
            self._hotkeys_ok = True
        except Exception as e:
            print(f"[w-note] Atajos no disponibles: {e}")

    @Slot(int)
    def _on_hotkey(self, hid: int):
        if hid == HOTKEY_NOTE:
            self.quick_note()
        elif hid == HOTKEY_REC:
            self.toggle_record()
        elif hid == HOTKEY_PRINT and self.recorder.is_recording:
            self.main_window._take_screenshot()
            self.tray.showMessage("w-notes", f"Print clave {len(self.recorder.screenshots)} guardado",
                                  QSystemTrayIcon.MessageIcon.Information, 1500)

    def quick_note(self):
        pos = QCursor_pos()
        self.popup.show_quick_creator(QPoint(pos.x() + 12, pos.y() + 12))

    def toggle_record(self):
        if self.recorder.is_recording:
            self.main_window._toggle_recording()
        else:
            self.desktop_widget._trigger_record()

    def open_main_window(self):
        w = self.main_window
        if w.isMinimized():
            w.setWindowState(w.windowState() & ~Qt.WindowState.WindowMinimized)
        if w.isMaximized():
            w.showMaximized()
        else:
            w.showNormal()
        w.raise_()
        w.activateWindow()

    @Slot()
    def _schedule_sync(self):
        self._sync_debounce.start(1500)

    def _apply_settings(self):
        self.side_capsule.refresh_settings()
        if self.storage.config.get("capsule_always_on_top", True):
            self.side_capsule.show()

    def _on_quit(self):
        if self.recorder.is_recording:
            self.recorder.stop_and_archive()
        if self._hotkeys_ok:
            try:
                hwnd = int(self.main_window.winId())
                for hid in (HOTKEY_NOTE, HOTKEY_REC, HOTKEY_PRINT):
                    ctypes.windll.user32.UnregisterHotKey(hwnd, hid)
            except Exception:
                pass
        self.mobile_server.stop()
        self.tray.hide()

    # ---- repliegue automático -----------------------------------------------------------
    def _own_handles(self) -> set:
        return {int(w.winId()) for w in (self.desktop_widget, self.side_capsule, self.popup, self.main_window)}

    def _check_windows_foreground_app(self):
        if sys.platform != "win32":
            return
        auto = self.storage.config.get("auto_dock_on_other_app", True)
        always = self.storage.config.get("capsule_always_on_top", True)
        if not auto:
            if not self.desktop_widget.isVisible():
                self.desktop_widget.show()
            return
        try:
            user32 = ctypes.windll.user32
            hwnd = user32.GetForegroundWindow()
            if not hwnd or hwnd in self._own_handles():
                return
            length = user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            title = buf.value.strip()
            on_desktop = not title or title in ("Program Manager", "Windows Shell Experience Host")
            if on_desktop:
                if not self.desktop_widget.isVisible():
                    self.desktop_widget.show()
                if not always and self.side_capsule.isVisible():
                    self.side_capsule.hide()
            else:
                if self.desktop_widget.isVisible():
                    self.desktop_widget.hide()
                if not self.side_capsule.isVisible():
                    self.side_capsule.show()
        except Exception:
            pass


def QCursor_pos() -> QPoint:
    from PySide6.QtGui import QCursor
    return QCursor.pos()


def _single_instance() -> bool:
    """Evita dos w-note a la vez (mutex con nombre en Windows)."""
    if sys.platform != "win32":
        return True
    try:
        ctypes.windll.kernel32.CreateMutexW(None, False, "compAI.wnote.singleton")
        return ctypes.windll.kernel32.GetLastError() != 183  # ERROR_ALREADY_EXISTS
    except Exception:
        return True


def main():
    if sys.platform == "win32":
        try:
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("compAI.wnote")
        except Exception:
            pass
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setQuitOnLastWindowClosed(False)
    app.setWindowIcon(logo_icon())
    if not _single_instance():
        QMessageBox.information(None, "w-notes", "w-notes ya está abierto: búscalo en la bandeja junto al reloj.")
        return
    controller = WNoteController(app)  # noqa: F841 (debe vivir mientras corre la app)
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
