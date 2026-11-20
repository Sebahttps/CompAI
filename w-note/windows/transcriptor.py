"""
w-notes · proceso de transcripción (aislado, sin internet)
----------------------------------------------------------
Motor: faster-whisper (modelo Whisper de OpenAI, código abierto, corre en la CPU de este PC).

Dos pasadas:
  1. EN VIVO (vista previa): trozos de ~30 s mientras grabas, con el texto anterior como contexto.
  2. FINAL (la que queda en el acta): al cerrar, se transcribe el WAV completo con más precisión
     (beam 5 + contexto continuo) y reemplaza la vista previa.

Entrada:
  ("trozo", fuente, seg_inicio, bytes_float32_16k)   en vivo (desde grabador.py)
  ("final", [(ruta_wav, fuente), ...])               pasada final sobre los WAV completos
  ("cerrar",)                                        termina el proceso
Salida:
  ("listo", modelo) · ("seg", fuente, ini, fin, texto, fase) · ("final_ini",) · ("avance", texto)
  ("error", msg) · ("fin",)
`saltar` (Event): si está activo, se ignoran los trozos en vivo pendientes (ya viene la pasada final).
"""

from __future__ import annotations

import os
import queue
import wave


# ---- audio ------------------------------------------------------------------------------
def _pasa_bajos(x, rate: int, corte: float = 7600.0, taps: int = 129):
    """Filtro FIR (sinc con ventana) antes de bajar a 16 kHz: evita el «aliasing» que ensuciaba el audio."""
    import numpy as np
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * corte / rate * n) * np.hamming(taps)
    h /= h.sum()
    return np.convolve(x, h, mode="same").astype(np.float32)


def a_16k(x, rate: int):
    """float32 mono a cualquier tasa → float32 mono 16 kHz, con filtro anti-aliasing."""
    import numpy as np
    if rate == 16000 or not len(x):
        return x.astype(np.float32)
    x = _pasa_bajos(x, rate)
    n16 = int(len(x) * 16000 / rate)
    return np.interp(np.linspace(0, len(x) - 1, n16), np.arange(len(x)), x).astype(np.float32)


def pcm_a_mono(raw: bytes, ch: int, sampwidth: int = 2):
    import numpy as np
    dtype = {1: np.int8, 2: np.int16, 4: np.int32}[sampwidth]
    x = np.frombuffer(raw, dtype=dtype).astype(np.float32) / float(2 ** (8 * sampwidth - 1))
    if ch > 1:
        x = x[: len(x) // ch * ch].reshape(-1, ch).mean(axis=1)
    return x


def _a_16k(raw: bytes, ch: int, rate: int, sampwidth: int = 2):  # compatibilidad
    return a_16k(pcm_a_mono(raw, ch, sampwidth), rate)


# ---- filtro de alucinaciones ---------------------------------------------------------------
FRASES_FANTASMA = {"y", "...", "mejor", "gracias", "gracias.", "subtítulos realizados por la comunidad de amara.org",
                   "¡gracias por ver!", "suscríbete", "música"}


def _valido(s, previo: str) -> bool:
    t = s.text.strip()
    if not t or t.lower().strip(" .¡!¿?") in FRASES_FANTASMA or t.lower() in FRASES_FANTASMA:
        return False
    if getattr(s, "no_speech_prob", 0) > 0.6 and getattr(s, "avg_logprob", 0) < -0.6:
        return False
    if getattr(s, "avg_logprob", 0) < -1.1 or getattr(s, "compression_ratio", 1) > 2.4:
        return False
    if t == previo:  # repeticiones calcadas
        return False
    return True


def transcribir(modelo: str, entrada, salida, saltar=None):
    try:
        import numpy as np
        from faster_whisper import WhisperModel
        m = WhisperModel(modelo, device="cpu", compute_type="int8", cpu_threads=max(2, (os.cpu_count() or 4) - 1))
    except Exception as e:
        salida.put(("error", f"no se pudo cargar la transcripción ({modelo}): {e}"))
        salida.put(("fin",))
        return
    salida.put(("listo", modelo))
    contexto = {}  # último texto por fuente (ayuda a mantener el hilo entre trozos)
    VAD = {"threshold": 0.5, "min_silence_duration_ms": 600, "speech_pad_ms": 300}

    def correr(x, fuente: str, t0: float, fase: str):
        if len(x) < 16000 * 0.6 or float(np.abs(x).max()) < 0.01:
            return
        final = fase == "final"
        segs, _ = m.transcribe(
            x, language="es", beam_size=5 if final else 2, vad_filter=True, vad_parameters=VAD,
            condition_on_previous_text=final, initial_prompt=(contexto.get(fuente) or None) if not final else None,
            no_speech_threshold=0.6, compression_ratio_threshold=2.4, log_prob_threshold=-1.0, temperature=[0.0, 0.2, 0.4])
        previo = ""
        for s in segs:
            if not _valido(s, previo):
                continue
            previo = s.text.strip()
            salida.put(("seg", fuente, round(t0 + s.start, 1), round(t0 + s.end, 1), previo, fase))
            contexto[fuente] = (contexto.get(fuente, "") + " " + previo)[-220:]

    while True:
        try:
            msg = entrada.get(timeout=900)
        except queue.Empty:
            break
        try:
            if msg[0] == "cerrar":
                break
            if msg[0] == "trozo":
                if saltar is not None and saltar.is_set():
                    continue
                _, fuente, t0, raw = msg
                correr(np.frombuffer(raw, dtype=np.float32), fuente, float(t0), "vivo")
                salida.put(("avance", "al día" if entrada.qsize() == 0 else f"{entrada.qsize()} trozos pendientes"))
            elif msg[0] == "final":
                salida.put(("final_ini",))
                contexto.clear()
                for ruta, fuente in msg[1]:
                    with wave.open(ruta, "rb") as wf:
                        ch, rate, sw, n = wf.getnchannels(), wf.getframerate(), wf.getsampwidth(), wf.getnframes()
                        total = n / rate
                        bloque = rate * 300  # 5 min por vez: memoria acotada, avance visible
                        t = 0.0
                        while True:
                            raw = wf.readframes(bloque)
                            if not raw:
                                break
                            salida.put(("avance", f"versión final: {fuente} {int(t // 60)}/{int(total // 60) + 1} min"))
                            correr(a_16k(pcm_a_mono(raw, ch, sw), rate), fuente, t, "final")
                            t += len(raw) / (ch * sw * rate)
            # compatibilidad con la versión anterior
            elif msg[0] == "archivo":
                entrada.put(("final", [(msg[1], msg[2])]))
            elif msg[0] == "fin_audio":
                pass
        except Exception as e:
            salida.put(("error", f"transcripción: {e}"))
    salida.put(("fin",))
