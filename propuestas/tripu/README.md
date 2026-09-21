# Tripu · Propuesta de app para la tripulación LATAM

Propuesta para Rigo M. (Jefe de Cabina, Cultura Organizacional): un espacio en el
celular donde los tripulantes comparten buenas prácticas, se reconocen entre ellos y
viven la cultura LATAM sin formalidades.

**Ver en el sitio:** https://compai.cl/propuestas/tripu/
**Canvas editable (Claude Design):** https://claude.ai/artifact/5EE7sUe3hPyKaojunKWTuA

## Qué hay aquí

| Carpeta / archivo | Qué es |
|---|---|
| `index.html` | Página que muestra las 8 pantallas, la lámina de propuesta, el nombre y las categorías |
| `pantallas/` | Cada pantalla como HTML normal. Se navegan entre sí con sus botones |
| `canvas/` | Los mismos 9 artboards en formato `.dc.html` + `canvas.json`, tal como viven en el canvas de Claude |
| `media/hero-tripulacion.jpg` | Foto de tripulantes recortada del mockup original |
| `_construir.py` | Genera `canvas/` y `pantallas/` desde un solo archivo: `python3 _construir.py` |

## Pantallas

| # | Pantalla | Qué resuelve |
|---|---|---|
| 1 | Acceso | Solo con correo @latam.com o acceso único corporativo |
| 2 | Inicio | Historias de 24 h, reto de la semana, pulso anónimo, mensaje en video de Cultura, feed |
| 3 | Práctica paso a paso | Chequeo de 4 minutos en pasos con foto; "Así lo hago yo" con versiones de otros |
| 4 | Compartir | Pasos con foto o video desde el celular, categoría, relato en audio opcional |
| 5 | Notificaciones | Comentarios, reconocimientos, versiones nuevas, retos |
| 6 | Momentos LATAM | Muro de fotos, tripulante del mes, ranking de bases |
| 7 | Reconocer | Reconocimiento entre compañeros en 30 segundos |
| 8 | Perfil | Racha, insignias, mis prácticas, guardadas |
| 9 | Propuesta (lámina) | Nombre, mecanismos de cultura, módulos, categorías, recorrido, construcción, fases, indicadores |

## Decisiones

- **Nombre:** Tripu (alternativas: Cabina Abierta, Volamos Juntos).
- **Categorías:** 10. Seguridad, Puntualidad (OTP), Hospitalidad (HBC), Preparación de vuelo,
  Bienestar y pernocte, Imagen y uniforme, Situaciones especiales, Equipo y liderazgo,
  Comunicación y anuncios, Sostenibilidad a bordo.
- **Cultura:** reconocimiento entre pares, historias y video corto, gamificación (insignias,
  rachas, ranking de bases), retos semanales, pulso anónimo, contenido hecho por la tripulación.
- **Cuidado:** las prácticas de Seguridad pasan por una revisión breve de Cultura antes de publicarse.
- **Colores y tipografías:** índigo LATAM para navegación, coral para la acción principal;
  Plus Jakarta Sans (títulos) y Nunito Sans (texto).

Nombres, cifras y pasos son de ejemplo, no datos reales de LATAM.
