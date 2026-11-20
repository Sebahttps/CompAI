"""
w-notes · proceso de transcripción (aislado, sin internet)
----------------------------------------------------------
Usa faster-whisper en la CPU. Recibe por `entrada`:
  ("trozo", fuente, segundo_inicio, bytes_float32_16k)   ← en vivo, desde grabador.py
  ("archivo", ruta_wav, fuente)                            ← para transcribir una grabación ya hecha
  ("fin_audio",)                                           ← no llega más audio
Entrega por `salida`:
  ("listo", modelo) · ("seg", fuente, ini, fin, texto) · ("avance", pendientes) · ("error", msg) · ("fin",)
"""

from __future__ import annotations

import os
import queue
import wave


def _a_16k(raw: bytes, ch: int, rate: int, sampwidth: int = 2):
    import numpy as np
    dtype = {1: np.int8, 2: np.int16, 4: np.int32}[sampwidth]
    x = np.frombuffer(raw, dtype=dtype).astype(np.float32) / float(2 ** (8 * sampwidth - 1))
    if ch > 1:
        x = x[: len(x) // ch * ch].reshape(-1, ch).mean(axis=1)
    if rate != 16000 and len(x):
        n = int(len(x) * 16000 / rate)
        x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)
    return x


def transcribir(modelo: str, entrada, salida):
    try:
        import numpy as np
        from faster_whisper import WhisperModel
        m = WhisperModel(modelo, device="cpu", compute_type="int8", cpu_threads=max(2, (os.cpu_count() or 4) - 1))
    except Exception as e:
        salida.put(("error", f"no se pudo cargar la transcripción ({modelo}): {e}"))
        salida.put(("fin",))
        return
    salida.put(("listo", modelo))

    def correr(x, fuente: str, t0: float):
        if len(x) < 16000 * 0.5 or float(np.abs(x).max()) < 0.004:  # silencio: no gasta CPU
            return
        segs, _ = m.transcribe(x, language="es", beam_size=1, vad_filter=True,
                               condition_on_previous_text=False,
                               vad_parameters={"min_silence_duration_ms": 500})
        for s in segs:
            t = s.text.strip()
            if t:
                salida.put(("seg", fuente, round(t0 + s.start, 1), round(t0 + s.end, 1), t))

    while True:
        try:
            msg = entrada.get(timeout=600)
        except queue.Empty:
            break
        try:
            if msg[0] == "fin_audio":
                break
            if msg[0] == "trozo":
                _, fuente, t0, raw = msg
                correr(np.frombuffer(raw, dtype=np.float32), fuente, float(t0))
            elif msg[0] == "archivo":
                _, ruta, fuente = msg
                with wave.open(ruta, "rb") as wf:
                    ch, rate, sw = wf.getnchannels(), wf.getframerate(), wf.getsampwidth()
                    paso = rate * 60  # por minutos, para ir mostrando avance y no llenar la memoria
                    t = 0.0
                    while True:
                        raw = wf.readframes(paso)
                        if not raw:
                            break
                        correr(_a_16k(raw, ch, rate, sw), fuente, t)
                        t += len(raw) / (ch * sw * rate)
            try:
                salida.put(("avance", entrada.qsize()))
            except Exception:
                pass
        except Exception as e:
            salida.put(("error", f"transcripción: {e}"))
    salida.put(("fin",))
