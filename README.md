# Voz Clara: grabación y transcripción

## Carpetas

```text
frontend/   Aplicación React móvil: grabación, Web Speech API e historial.
backend/    Scripts Python para grabar WAV, transcribir con Gemini y calcular WER.
docs/       Prototipos HTML anteriores, útiles como referencia.
audios/     Audios de prueba dentro de backend/.
```

La API key está en `backend/.env` y no debe compartirse. El entorno Python `.venv/` permanece en la raíz para que VS Code lo encuentre fácilmente.

## Aplicación React

```powershell
cd frontend
npm install
npm run dev
```

Abre la URL que muestra Vite, normalmente `http://localhost:5173/`. La aplicación React permite grabar desde el micrófono, transcribir en vivo, guardar sesiones en el navegador y exportarlas a JSON.

## Comparación de transcripción en español

Este ejercicio compara dos métodos:

- **Web Speech API**: reconoce la voz en tiempo real dentro del navegador; es sencilla y no necesita una API key, pero depende del navegador, la conexión y su implementación.
- **Gemini**: recibe un archivo WAV/MP3 y lo procesa por lotes; permite conservar el audio, repetir el análisis y suele ofrecer mejor comprensión contextual, a cambio de latencia, coste y una clave de API.

## Preparación

En PowerShell, desde la raíz del proyecto:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Tu `GEMINI_API_KEY` ya está en `backend\.env`. Si defines `GEMINI_MODEL`, usa un modelo disponible en tu cuenta; si no, el script usa `gemini-3.8-flash`.

## 1. Grabar tres audios

```powershell
cd backend
python record_audio.py
```

Lee las tres frases que muestra el programa. Se crearán `backend\audios\audio_1.wav`, `audio_2.wav` y `audio_3.wav`.

## 2. Transcribir con Gemini

```powershell
python transcribe_gemini.py audios\audio_1.wav audios\audio_2.wav audios\audio_3.wav
```

El resultado queda en `backend\gemini_results.json`. El script elimina los archivos temporales subidos a Gemini al terminar cada transcripción.

## 3. Probar Web Speech API

Abre `docs\web_speech.html` en Chrome o Edge. Permite el micrófono y pulsa **Iniciar** para cada frase. La versión móvil completa está en `frontend/`; esta demo HTML queda como referencia simple.

Para calcular una comparación objetiva, crea `comparison.json` copiando esta estructura y reemplazando los valores `web_speech` y `gemini` por los textos obtenidos:

```json
[
  {
    "archivo": "audio_1.wav",
    "referencia": "La tecnología puede hacer más accesible la educación.",
    "web_speech": "",
    "gemini": ""
  },
  {
    "archivo": "audio_2.wav",
    "referencia": "Mañana vamos a comparar dos métodos de transcripción de audio.",
    "web_speech": "",
    "gemini": ""
  },
  {
    "archivo": "audio_3.wav",
    "referencia": "Una buena aplicación debe ser precisa, rápida y fácil de usar.",
    "web_speech": "",
    "gemini": ""
  }
]
```

Después ejecuta:

```powershell
python compare_transcriptions.py comparison.json
```

**WER** (Word Error Rate) es el porcentaje de errores de palabras: cuanto menor sea, mejor. Además del WER, anota latencia, facilidad de uso, dependencia de conexión y coste para completar la conclusión.

## Conclusión esperada

Web Speech API es la mejor opción cuando se necesita respuesta inmediata y una solución solo de navegador. Gemini es más adecuado para archivos guardados, análisis repetible y transcripciones con mayor contexto; requiere procesamiento por lotes, credenciales y conexión a la API.
