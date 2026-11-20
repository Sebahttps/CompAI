"""
w-notes · proceso de grabación (aislado)
----------------------------------------
Corre en un proceso aparte (multiprocessing): si el controlador de audio de Windows o PortAudio
se cae, se cae solo este proceso y w-notes sigue abierto y avisa.

- Una sola instancia de PortAudio para audio del sistema (WASAPI loopback) y micrófono.
  (Dos instancias simultáneas hacían caer _portaudiowpatch.pyd con 0xc0000005.)
- Escribe los WAV directo a disco.
- Si recibe `cola_texto`, también envía trozos de audio a 16 kHz mono para transcribir.
"""

from __future__ import annotations

import time
import wave
from pathlib import Path

TROZO_SEG = 30  # segundos por trozo en vivo (la ventana nativa de Whisper)


class _Wav:
    def __init__(self, path: Path, channels: int, rate: int):
        self.path, self.channels, self.rate = path, channels, rate
        self.frame_bytes = channels * 2
        self.frames = 0
        self._wf = wave.open(str(path), "wb")
        self._wf.setnchannels(channels)
        self._wf.setsampwidth(2)
        self._wf.setframerate(rate)

    def write(self, data: bytes):
        self._wf.writeframes(data)
        self.frames += len(data) // self.frame_bytes

    def pad_to(self, seconds: float):
        missing = int(seconds * self.rate) - self.frames
        if missing > self.rate * 0.25:
            self.write(b"\x00" * missing * self.frame_bytes)

    def close(self):
        try:
            self._wf.close()
        except Exception:
            pass


class _Trozos:
    """Junta audio de una fuente y entrega trozos de TROZO_SEG s a 16 kHz mono (float32) para Whisper."""

    def __init__(self, fuente: str, channels: int, rate: int, cola):
        import numpy as np
        self.np, self.fuente, self.ch, self.rate, self.cola = np, fuente, channels, rate, cola
        self.buf: list = []
        self.n = 0
        self.inicio = 0.0  # segundo de la grabación en que empieza el trozo actual

    def add(self, data: bytes, t_inicio: float):
        if not self.buf:
            self.inicio = t_inicio
        self.buf.append(data)
        self.n += len(data) // (2 * self.ch)
        if self.n >= TROZO_SEG * self.rate:
            self.flush()

    def flush(self):
        if not self.buf:
            return
        import transcriptor  # mismo remuestreo con filtro anti-aliasing que la pasada final
        x = transcriptor.a_16k(transcriptor.pcm_a_mono(b"".join(self.buf), self.ch), self.rate)
        try:
            self.cola.put(("trozo", self.fuente, round(self.inicio, 2), x.tobytes()))
        except Exception:
            pass
        self.buf, self.n = [], 0


def grabar(carpeta: str, base: str, con_mic: bool, detener, avisos, cola_texto=None):
    """Punto de entrada del proceso. `detener`: multiprocessing.Event. `avisos`: Queue hacia w-notes."""
    carpeta_p = Path(carpeta)
    archivos, errores = [], []
    try:
        import pyaudiowpatch as pyaudio
    except Exception as e:
        avisos.put(("fin", [], [f"falta pyaudiowpatch: {e}"]))
        return
    p = pyaudio.PyAudio()
    fuentes = []  # (nombre, stream, wav, trozos, rellenar_silencio)
    try:
        try:
            lb = p.get_default_wasapi_loopback()
        except Exception as e:
            lb = None
            errores.append(f"audio del sistema: {e}")
        mic = None
        if con_mic:
            try:
                mic = p.get_default_input_device_info()
            except Exception as e:
                errores.append(f"micrófono: {e}")
        for nombre, dev, sufijo, rellenar in (("sistema", lb, "", True), ("microfono", mic, "_microfono", False)):
            if not dev:
                continue
            ch = max(1, min(2, int(dev["maxInputChannels"])))
            rate = int(dev["defaultSampleRate"])
            try:
                st = p.open(format=pyaudio.paInt16, channels=ch, rate=rate, input=True,
                            frames_per_buffer=1024, input_device_index=dev["index"])
            except Exception as e:
                errores.append(f"{nombre}: {e}")
                continue
            wav = _Wav(carpeta_p / f"{base}{sufijo}.wav", ch, rate)
            trozos = _Trozos(nombre, ch, rate, cola_texto) if cola_texto is not None else None
            fuentes.append([nombre, st, wav, trozos, rellenar])
        avisos.put(("inicio", [f[0] for f in fuentes], errores))
        t0 = time.time()
        while not detener.is_set():
            leyo = False
            for f in fuentes:
                nombre, st, wav, trozos, rellenar = f
                n = st.get_read_available()
                if n <= 0:
                    continue
                data = st.read(min(n, 8192), exception_on_overflow=False)
                ahora = time.time() - t0
                dur = (len(data) // wav.frame_bytes) / wav.rate
                if rellenar:
                    antes = wav.frames
                    wav.pad_to(ahora - dur)
                    if trozos is not None and wav.frames > antes:  # silencio también al transcriptor
                        trozos.add(b"\x00" * (wav.frames - antes) * wav.frame_bytes, (antes / wav.rate))
                if trozos is not None:
                    trozos.add(data, wav.frames / wav.rate)
                wav.write(data)
                leyo = True
            if not leyo:
                time.sleep(0.015)
        fin = time.time() - t0
        for nombre, st, wav, trozos, rellenar in fuentes:
            if rellenar:
                wav.pad_to(fin)
            if trozos is not None:
                trozos.flush()
    except Exception as e:
        errores.append(f"grabación: {e}")
    finally:
        for nombre, st, wav, trozos, rellenar in fuentes:
            try:
                st.stop_stream()
                st.close()
            except Exception:
                pass
            wav.close()
            if wav.frames:
                archivos.append(wav.path.name)
            else:
                wav.path.unlink(missing_ok=True)
        try:
            p.terminate()
        except Exception:
            pass
        avisos.put(("fin", archivos, errores))
