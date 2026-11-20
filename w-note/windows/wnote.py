"""
w-note de compAI — Widget de escritorio, cápsula flotante, notas de vidrio,
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

APP_NAME = "w-note"
APP_VERSION = "1.0.0"
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
    """Dibuja el isotipo oficial (versión chica bajo 40 px, como pide el manual)."""
    painter.save()
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    _renderer(rect.width() < 40).render(painter, rect)
    painter.restore()


def logo_pixmap(size: int) -> QPixmap:
    pix = QPixmap(size, size)
    pix.fill(Qt.GlobalColor.transparent)
    p = QPainter(pix)
    paint_wnote_logo(p, QRectF(0, 0, size, size))
    p.end()
    return pix


def logo_icon() -> QIcon:
    ico = APP_DIR.parent / "marca" / "wnote.ico"
    if ico.exists():
        return QIcon(str(ico))
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
            "location_label": "Viña del Mar",
            "location_lat": -33.0245,
            "location_lon": -71.5518,
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
        if self.config_file.exists():
            try:
                cfg.update(json.loads(self.config_file.read_text(encoding="utf-8")))
            except Exception:
                pass
        # La versión anterior traía un endpoint de ejemplo que no existe (compai.cl es estático).
        if cfg.get("cloud_sync_url", "").rstrip("/") == "https://compai.cl/api/wnote":
            cfg["cloud_sync_url"] = ""
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
            "Content-Type": "text/plain; charset=utf-8", "User-Agent": f"w-note-windows/{APP_VERSION}"})
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
Generado por w-note {APP_VERSION} · compAI
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
        self.setToolTip("Abrir w-note")
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

    def __init__(self, storage: StorageManager, popup: FloatingGlassNotePopup, cloud: CloudSyncClient):
        super().__init__()
        self.storage, self.popup, self.cloud = storage, popup, cloud
        self._drag_offset = None
        self.event_idx = 0
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Tool)
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

        self.lbl_loc = QLabel()
        self.lbl_loc.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.lbl_loc.setStyleSheet("color: rgba(255,255,255,0.95); font-size: 11px; font-weight: 700;"
                                   " letter-spacing: 1px;" + shadow)
        root.addWidget(self.lbl_loc)

        clock_row = QHBoxLayout()
        clock_row.addStretch()
        self.lbl_time = QLabel()
        self.lbl_time.setStyleSheet("color: #ffffff; font-size: 52px; font-weight: 300;" + shadow)
        clock_row.addWidget(self.lbl_time)
        meta_col = QVBoxLayout()
        self.lbl_temp = QLabel("–°")
        self.lbl_temp.setStyleSheet("color: #ffffff; font-size: 15px; font-weight: 600;" + shadow)
        self.lbl_ampm = QLabel()
        self.lbl_ampm.setStyleSheet("color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 700;" + shadow)
        meta_col.addWidget(self.lbl_temp)
        meta_col.addWidget(self.lbl_ampm)
        meta_col.addStretch()
        clock_row.addLayout(meta_col)
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
        self.lbl_time.setText(f"{now.hour % 12 or 12}:{now.minute:02d}")
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
            self._drag_offset = event.globalPosition().toPoint() - self.frameGeometry().topLeft()

    def mouseMoveEvent(self, event):
        if self._drag_offset is not None and event.buttons() & Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_offset)

    def mouseReleaseEvent(self, event):
        if self._drag_offset is not None:
            self._drag_offset = None
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
        self.setWindowTitle("Vincular celular — w-note")
        self.setStyleSheet(f"background: {CREAM}; color: {INK};")
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
        btn.setStyleSheet(f"background: {PETROL}; color: #fff; padding: 6px 12px; border-radius: 8px; font-weight: 600;")
        btn.clicked.connect(lambda: (QApplication.clipboard().setText(url), btn.setText("✓ Copiado")))
        v.addWidget(btn)
        box.setFixedWidth(270)
        return box


# =============================================================================
# 13. VENTANA PRINCIPAL (CONFIGURACIÓN, NOTAS, GRABADOR Y ARCHIVADOR)
# =============================================================================
BTN = "font-weight: 700; padding: 7px 14px; border-radius: 9px;"
FIELD = "padding: 6px 10px; border: 1px solid #cfc8b8; border-radius: 8px; background: #ffffff;"
CARD = "QFrame#card { background: #ffffff; border: 1px solid #e2dccd; border-radius: 14px; }"


class NoteCard(QFrame):
    def __init__(self, note: dict, on_open):
        super().__init__()
        th = get_theme(note["theme_key"])
        fg = "#ffffff" if th["text_light"] else INK
        self.setObjectName("note")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setStyleSheet(f"QFrame#note {{ background: {th['hex']}; border-radius: 14px; }}"
                           f" QLabel {{ color: {fg}; background: transparent; }}")
        self.setFixedHeight(104)
        v = QVBoxLayout(self)
        v.setContentsMargins(12, 10, 12, 10)
        top = QLabel(f"{th['label'].upper()} · {note_time_label(note)}")
        top.setStyleSheet("font-size: 10px; font-weight: 700;")
        txt = QLabel(note["text"] if len(note["text"]) < 150 else note["text"][:147] + "…")
        txt.setTextFormat(Qt.TextFormat.PlainText)
        txt.setWordWrap(True)
        txt.setStyleSheet("font-size: 12px;")
        v.addWidget(top)
        v.addWidget(txt, 1)
        self._on_open, self._note = on_open, note

    def mouseReleaseEvent(self, event):
        self._on_open(self._note, event.globalPosition().toPoint())


class MainWNoteWindow(QMainWindow):
    settings_updated = Signal()
    hotkey_pressed = Signal(int)

    def __init__(self, storage, recorder, mobile_server, cloud_sync, popup, bus: Bus):
        super().__init__()
        self.storage, self.recorder = storage, recorder
        self.mobile_server, self.cloud_sync, self.popup, self.bus = mobile_server, cloud_sync, popup, bus
        self.setWindowTitle("w-note — Notas, grabador y archivador de actas")
        self.setWindowIcon(logo_icon())
        self.resize(1160, 780)
        self._build_ui()
        self.refresh_notes()
        self.refresh_actas_table()
        self.bus.sync_status.connect(self.lbl_cloud_status.setText)
        self.rec_timer = QTimer(self)
        self.rec_timer.timeout.connect(self._update_recording_ui)
        self.rec_timer.start(1000)

    # ---- atajos globales (WM_HOTKEY) ----------------------------------------------
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
        # La X solo oculta (w-note sigue en la bandeja). En Qt 6, app.quit() también envía
        # closeEvent y si se ignora cancela la salida: por eso se distingue con spontaneous().
        if event.spontaneous():
            event.ignore()
            self.hide()
        else:
            event.accept()

    # ---- interfaz ---------------------------------------------------------------------
    def _build_ui(self):
        central = QWidget()
        central.setObjectName("central")
        central.setStyleSheet(f"QWidget#central {{ background-color: {CREAM}; }} QWidget {{ color: {INK}; }}"
                              " QLabel, QCheckBox { background: transparent; }")
        self.setCentralWidget(central)
        main = QVBoxLayout(central)
        main.setContentsMargins(16, 14, 16, 14)
        main.setSpacing(12)

        # 1. Encabezado + cápsula
        header = QFrame()
        header.setObjectName("hdr")
        header.setStyleSheet(f"QFrame#hdr {{ background: {INK}; border-radius: 16px; }}"
                             " QLabel, QCheckBox { color: #ffffff; background: transparent; }")
        h = QHBoxLayout(header)
        h.setContentsMargins(16, 12, 16, 12)
        logo = QLabel()
        logo.setPixmap(logo_pixmap(44))
        h.addWidget(logo)
        title_col = QVBoxLayout()
        brand = QLabel("w-note <span style='color:#9fb8c2;font-size:12px;font-weight:500'>de compA\\</span>")
        brand.setStyleSheet("font-size: 19px; font-weight: 700;")
        self.lbl_lan = QLabel()
        self.lbl_lan.setStyleSheet("font-size: 11px; color: #9be3b0; font-weight: 600;")
        title_col.addWidget(brand)
        title_col.addWidget(self.lbl_lan)
        h.addLayout(title_col, 1)

        h.addWidget(QLabel("Cápsula:"))
        self.combo_pos = QComboBox()
        self.combo_pos.addItem("Izquierda", "left")
        self.combo_pos.addItem("Derecha", "right")
        self.combo_pos.setCurrentIndex(0 if self.storage.config.get("capsule_position", "left") == "left" else 1)
        self.combo_pos.setStyleSheet("background: #2a2a2a; color: #fff; padding: 5px 10px; border-radius: 8px;")
        self.combo_pos.currentIndexChanged.connect(self._on_cfg_changed)
        h.addWidget(self.combo_pos)
        self.chk_top = QCheckBox("Siempre visible")
        self.chk_top.setChecked(self.storage.config.get("capsule_always_on_top", True))
        self.chk_top.stateChanged.connect(self._on_cfg_changed)
        h.addWidget(self.chk_top)
        self.chk_auto_dock = QCheckBox("Replegar al abrir otra app")
        self.chk_auto_dock.setChecked(self.storage.config.get("auto_dock_on_other_app", True))
        self.chk_auto_dock.stateChanged.connect(self._on_cfg_changed)
        h.addWidget(self.chk_auto_dock)
        btn_phone = QPushButton("📱 Vincular celular")
        btn_phone.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_phone.setStyleSheet(f"background: #2a2a2a; color: #fff; {BTN}")
        btn_phone.clicked.connect(self._link_phone)
        h.addWidget(btn_phone)
        btn_new = QPushButton("+ Nota rápida")
        btn_new.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_new.setStyleSheet(f"background: {PETROL}; color: #fff; {BTN}")
        btn_new.clicked.connect(lambda: self.popup.show_quick_creator(QPoint(self.x() + 80, self.y() + 110)))
        h.addWidget(btn_new)
        main.addWidget(header)

        # 1B. Nube
        cloud = QFrame()
        cloud.setObjectName("card")
        cloud.setStyleSheet(CARD)
        c = QHBoxLayout(cloud)
        c.setContentsMargins(14, 8, 14, 8)
        self.chk_cloud = QCheckBox("Nube iPhone (4G/5G)")
        self.chk_cloud.setChecked(self.storage.config.get("cloud_sync_enabled", True))
        self.chk_cloud.setStyleSheet("font-weight: 600; font-size: 12px;")
        self.chk_cloud.stateChanged.connect(self._on_cloud_cfg_changed)
        self.inp_cloud_url = QLineEdit(self.storage.config.get("cloud_sync_url", ""))
        self.inp_cloud_url.setPlaceholderText("URL /exec de tu Apps Script (README → Nube)")
        self.inp_cloud_url.setStyleSheet(FIELD + "font-size: 11px;")
        self.inp_cloud_url.editingFinished.connect(self._on_cloud_cfg_changed)
        self.inp_cloud_token = QLineEdit(self.storage.config.get("cloud_api_key", ""))
        self.inp_cloud_token.setEchoMode(QLineEdit.EchoMode.Password)
        self.inp_cloud_token.setPlaceholderText("Token (función configurar)")
        self.inp_cloud_token.setStyleSheet(FIELD + "font-size: 11px;")
        self.inp_cloud_token.editingFinished.connect(self._on_cloud_cfg_changed)
        btn_test = QPushButton("Probar")
        btn_test.setStyleSheet(f"background: #e9e3d6; color: {INK}; {BTN} font-size: 11px;")
        btn_test.clicked.connect(self._test_cloud)
        btn_sync = QPushButton("↻ Sincronizar")
        btn_sync.setStyleSheet(f"background: {PETROL}; color: #fff; {BTN} font-size: 11px;")
        btn_sync.clicked.connect(self._sync_cloud_now)
        self.lbl_cloud_status = QLabel(self.cloud_sync.last_status)
        self.lbl_cloud_status.setStyleSheet("font-size: 11px; color: #555;")
        for w, s in ((self.chk_cloud, 0), (self.inp_cloud_url, 3), (self.inp_cloud_token, 2), (btn_test, 0),
                     (btn_sync, 0), (self.lbl_cloud_status, 0)):
            c.addWidget(w, s)
        main.addWidget(cloud)

        # 1C. Notas de vidrio
        notes_box = QFrame()
        notes_box.setObjectName("card")
        notes_box.setStyleSheet(CARD)
        nb = QVBoxLayout(notes_box)
        nb.setContentsMargins(12, 10, 12, 10)
        self.lbl_notes_title = QLabel()
        self.lbl_notes_title.setStyleSheet("font-weight: 700; font-size: 13px;")
        nb.addWidget(self.lbl_notes_title)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setFixedHeight(124)
        scroll.setStyleSheet("background: transparent;")
        holder = QWidget()
        self.notes_row = QHBoxLayout(holder)
        self.notes_row.setContentsMargins(0, 0, 0, 0)
        self.notes_row.setSpacing(10)
        scroll.setWidget(holder)
        nb.addWidget(scroll)
        main.addWidget(notes_box)

        # 2. Grabación
        rec = QFrame()
        rec.setObjectName("card")
        rec.setStyleSheet(CARD)
        rv = QVBoxLayout(rec)
        rv.setContentsMargins(14, 10, 14, 10)
        r = QHBoxLayout()
        self.inp_org = QLineEdit()
        self.inp_org.setPlaceholderText("Organización (ej. Banco_Andes)")
        self.inp_org.setStyleSheet(FIELD)
        self.inp_topic = QLineEdit()
        self.inp_topic.setPlaceholderText("Tema (ej. Cierre_Q4)")
        self.inp_topic.setStyleSheet(FIELD)
        self.combo_platform = QComboBox()
        self.combo_platform.addItems(["Google Meet", "MS Teams", "Zoom", "Otra Videollamada"])
        self.combo_platform.setStyleSheet(FIELD)
        self.btn_record_toggle = QPushButton("● Grabar reunión")
        self.btn_record_toggle.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_record_toggle.clicked.connect(self._toggle_recording)
        self.btn_screenshot = QPushButton("📷 Print clave (0)")
        self.btn_screenshot.setEnabled(False)
        self.btn_screenshot.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_screenshot.setStyleSheet(f"background: #F0B400; color: {INK}; {BTN}")
        self.btn_screenshot.clicked.connect(self._take_screenshot)
        self.lbl_rec_status = QLabel("Listo")
        self.lbl_rec_status.setStyleSheet("font-family: Consolas, monospace; font-weight: 700; color: #555;")
        for w, s in ((self.inp_org, 2), (self.inp_topic, 2), (self.combo_platform, 1), (self.btn_record_toggle, 0),
                     (self.btn_screenshot, 0), (self.lbl_rec_status, 0)):
            r.addWidget(w, s)
        rv.addLayout(r)
        self.inp_live = QLineEdit()
        self.inp_live.setPlaceholderText("Nota en vivo con marca de tiempo… (Enter)")
        self.inp_live.setStyleSheet(FIELD)
        self.inp_live.setEnabled(False)
        self.inp_live.returnPressed.connect(self._add_live_note)
        rv.addWidget(self.inp_live)
        main.addWidget(rec)
        self._style_record_button(False)

        # 3. Archivador + vista previa
        splitter = QSplitter(Qt.Orientation.Horizontal)
        left = QFrame()
        left.setObjectName("card")
        left.setStyleSheet(CARD)
        lv = QVBoxLayout(left)
        lv.setContentsMargins(12, 10, 12, 12)
        top = QHBoxLayout()
        btn_folder = QPushButton(f"📁 {self.storage.actas_dir}")
        btn_folder.setStyleSheet("font-family: Consolas, monospace; font-size: 11px; color: #555; border: none;"
                                 " background: transparent; text-align: left;")
        btn_folder.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_folder.clicked.connect(lambda: QDesktopServices.openUrl(QUrl.fromLocalFile(str(self.storage.actas_dir))))
        self.combo_naming = QComboBox()
        for label, key in (("AAAA-MM-DD_Org_Tema", "DATE_ORG_TOPIC"), ("Org_AAAA-MM-DD_Tema", "ORG_DATE_TOPIC"),
                           ("AAAA-MM-DD_Tema_Org", "DATE_TOPIC_ORG")):
            self.combo_naming.addItem(label, key)
        self.combo_naming.setCurrentIndex(max(0, self.combo_naming.findData(self.storage.config.get("naming_format"))))
        self.combo_naming.currentIndexChanged.connect(self._on_naming_changed)
        top.addWidget(btn_folder, 1)
        top.addWidget(QLabel("Nomenclatura:"))
        top.addWidget(self.combo_naming)
        lv.addLayout(top)
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Nombre estándar", "Fecha", "Organización", "Sistema", "Prints"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.verticalHeader().setVisible(False)
        self.table.setStyleSheet("QTableWidget { border: none; background: #fff; } QHeaderView::section {"
                                 f" background: {CREAM}; border: none; padding: 5px; font-weight: 700; }}")
        self.table.itemSelectionChanged.connect(self._on_row_selected)
        self.table.doubleClicked.connect(self._open_selected_acta)
        lv.addWidget(self.table)

        right = QFrame()
        right.setObjectName("card")
        right.setStyleSheet(CARD)
        rp = QVBoxLayout(right)
        rp.setContentsMargins(12, 10, 12, 12)
        ph = QHBoxLayout()
        ph.addWidget(QLabel("<b>Acta para el equipo</b>"))
        ph.addStretch()
        btn_copy = QPushButton("Copiar")
        btn_copy.setStyleSheet(f"background: {INK}; color: #fff; padding: 5px 10px; border-radius: 8px; font-size: 11px;")
        btn_copy.clicked.connect(lambda: QApplication.clipboard().setText(self.preview_text.toPlainText()))
        btn_open = QPushButton("Abrir")
        btn_open.setStyleSheet(f"background: {PETROL}; color: #fff; padding: 5px 10px; border-radius: 8px; font-size: 11px;")
        btn_open.clicked.connect(self._open_selected_acta)
        ph.addWidget(btn_copy)
        ph.addWidget(btn_open)
        rp.addLayout(ph)
        self.preview_text = QTextEdit()
        self.preview_text.setReadOnly(True)
        self.preview_text.setStyleSheet("border: 1px solid #ece6d8; border-radius: 10px; padding: 8px; font-size: 12px;"
                                        " background: #fff;")
        rp.addWidget(self.preview_text)
        splitter.addWidget(left)
        splitter.addWidget(right)
        splitter.setSizes([660, 460])
        main.addWidget(splitter, 1)

    def set_lan_label(self):
        if self.mobile_server.running:
            self.lbl_lan.setText(f"📶 Wi-Fi local: http://{self.mobile_server.local_ip}:{self.mobile_server.port}"
                                 "  ·  Atajos: Ctrl+Alt+N nota · Ctrl+Alt+R grabar · Ctrl+Alt+P print")
        else:
            self.lbl_lan.setText("Atajos: Ctrl+Alt+N nota · Ctrl+Alt+R grabar · Ctrl+Alt+P print")

    @Slot()
    def refresh_notes(self):
        while self.notes_row.count():
            item = self.notes_row.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        notes = self.storage.visible_notes()
        self.lbl_notes_title.setText(f"Notas de vidrio ({len(notes)}) — sincronizadas con el celular")
        if not notes:
            empty = QLabel("Aún no hay notas. Usa «+ Nota rápida» o Ctrl+Alt+N desde cualquier app.")
            empty.setStyleSheet("color: #777; font-size: 12px;")
            self.notes_row.addWidget(empty)
        for note in notes[:40]:
            card = NoteCard(note, lambda n, pos: self.popup.show_registered_note(n, pos))
            card.setFixedWidth(220)
            self.notes_row.addWidget(card)
        self.notes_row.addStretch()

    def _style_record_button(self, recording: bool):
        if recording:
            self.btn_record_toggle.setText("■ Finalizar y archivar")
            self.btn_record_toggle.setStyleSheet(f"background: #2E7D4F; color: #fff; {BTN}")
        else:
            self.btn_record_toggle.setText("● Grabar reunión")
            self.btn_record_toggle.setStyleSheet(f"background: #B2261E; color: #fff; {BTN}")

    def _on_cfg_changed(self):
        self.storage.config["capsule_position"] = self.combo_pos.currentData()
        self.storage.config["capsule_always_on_top"] = self.chk_top.isChecked()
        self.storage.config["auto_dock_on_other_app"] = self.chk_auto_dock.isChecked()
        self.storage.save_config()
        self.settings_updated.emit()

    def _on_cloud_cfg_changed(self):
        self.storage.config["cloud_sync_enabled"] = self.chk_cloud.isChecked()
        self.storage.config["cloud_sync_url"] = self.inp_cloud_url.text().strip()
        self.storage.config["cloud_api_key"] = self.inp_cloud_token.text().strip()
        self.storage.save_config()

    def _test_cloud(self):
        self._on_cloud_cfg_changed()
        if not self.cloud_sync.configured():
            self.lbl_cloud_status.setText("Falta URL o token")
            return
        QApplication.setOverrideCursor(Qt.CursorShape.WaitCursor)
        try:
            self.lbl_cloud_status.setText(self.cloud_sync.test_connection())
        finally:
            QApplication.restoreOverrideCursor()
        self._sync_cloud_now()

    def _sync_cloud_now(self):
        self._on_cloud_cfg_changed()
        self.cloud_sync.sync_async()
        self.cloud_sync.fetch_agenda_async()

    def _link_phone(self):
        self._on_cloud_cfg_changed()
        LinkPhoneDialog(self, self.storage, self.mobile_server, self.cloud_sync).exec()

    def _on_naming_changed(self):
        self.storage.config["naming_format"] = self.combo_naming.currentData()
        self.storage.save_config()

    # ---- grabación ------------------------------------------------------------------
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
            self.btn_screenshot.setText("📷 Print clave (0)")
            self.inp_live.setEnabled(True)
        else:
            md_path = self.recorder.stop_and_archive()
            self._style_record_button(False)
            self.btn_screenshot.setEnabled(False)
            self.inp_live.setEnabled(False)
            self.lbl_rec_status.setText("Archivado")
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
            self.btn_screenshot.setText(f"📷 Print clave ({len(self.recorder.screenshots)})")

    def _add_live_note(self):
        if self.recorder.is_recording and self.inp_live.text().strip():
            self.recorder.add_live_note(self.inp_live.text())
            self.inp_live.clear()

    def _update_recording_ui(self):
        if self.recorder.is_recording:
            self.lbl_rec_status.setText(f"REC {self.recorder.elapsed_str()}")

    # ---- archivador -------------------------------------------------------------------
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

        self.mobile_server = MobileSyncServer(self.storage)
        if self.storage.config.get("mobile_server_enabled", True):
            self.mobile_server.start()

        self.recorder = MeetingRecorderEngine(self.storage)
        self.popup = FloatingGlassNotePopup(self.storage)
        self.desktop_widget = DesktopWidgetWindow(self.storage, self.popup, self.cloud_sync)
        self.side_capsule = FloatingSideCapsuleWindow(self.storage, self.popup)
        self.main_window = MainWNoteWindow(self.storage, self.recorder, self.mobile_server, self.cloud_sync,
                                           self.popup, self.bus)

        # Señales
        for slot in (self.desktop_widget.rebuild_capsules, self.side_capsule.rebuild_capsules,
                     self.main_window.refresh_notes):
            self.bus.notes_changed.connect(slot)
        self.bus.agenda_changed.connect(self.desktop_widget.refresh_agenda)
        self.bus.weather_changed.connect(self.desktop_widget.refresh_weather)
        self.bus.local_mutation.connect(self._schedule_sync, Qt.ConnectionType.QueuedConnection)
        self.side_capsule.open_main_requested.connect(self.open_main_window)
        self.desktop_widget.record_meeting_requested.connect(self.main_window.start_external_recording)
        self.main_window.settings_updated.connect(self._apply_settings)
        self.main_window.hotkey_pressed.connect(self._on_hotkey)

        # Sincronía: al cambiar algo (1,5 s después), cada 20 s, agenda cada 5 min, clima cada 15 min
        self._sync_debounce = QTimer(self)
        self._sync_debounce.setSingleShot(True)
        self._sync_debounce.timeout.connect(self.cloud_sync.sync_async)
        self._timers = []
        for ms, fn in ((20_000, self.cloud_sync.sync_async), (300_000, self.cloud_sync.fetch_agenda_async),
                       (900_000, self.weather.fetch_async)):
            t = QTimer(self)
            t.timeout.connect(fn)
            t.start(ms)
            self._timers.append(t)
        self.cloud_sync.sync_async()
        self.cloud_sync.fetch_agenda_async()
        self.weather.fetch_async()
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
        self.tray.setToolTip("w-note")
        menu = QMenu()
        for text, fn in (("Abrir w-note", self.open_main_window), ("+ Nota rápida  (Ctrl+Alt+N)", self.quick_note),
                         ("● Grabar / detener  (Ctrl+Alt+R)", self.toggle_record),
                         ("Mostrar widget", self.desktop_widget.show),
                         ("📱 Vincular celular", self.main_window._link_phone)):
            act = QAction(text, menu)
            act.triggered.connect(fn)
            menu.addAction(act)
        menu.addSeparator()
        quit_act = QAction("Salir de w-note", menu)
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
            self.tray.showMessage("w-note", f"Print clave {len(self.recorder.screenshots)} guardado",
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
        self.main_window.showNormal()
        self.main_window.raise_()
        self.main_window.activateWindow()

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
        QMessageBox.information(None, "w-note", "w-note ya está abierto: búscalo en la bandeja junto al reloj.")
        return
    controller = WNoteController(app)  # noqa: F841 (debe vivir mientras corre la app)
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
