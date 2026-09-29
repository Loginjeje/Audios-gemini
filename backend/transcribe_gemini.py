"""Transcribe archivos WAV o MP3 con Gemini y guarda resultados en JSON."""

import argparse
import json
import mimetypes
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

PROMPT = """Transcribe exactamente el audio en español.
Devuelve únicamente la transcripción, sin etiquetas, comentarios ni traducción.
Conserva números y nombres propios cuando sean audibles."""


def transcribe_file(client: genai.Client, audio_path: Path, model: str) -> str:
    mime_type = mimetypes.guess_type(audio_path.name)[0] or "audio/wav"
    uploaded = client.files.upload(file=str(audio_path), config={"mime_type": mime_type})
    try:
        response = client.models.generate_content(model=model, contents=[uploaded, PROMPT])
        return response.text.strip()
    finally:
        client.files.delete(name=uploaded.name)


def save_results(output: Path, results: list[dict[str, str]]) -> None:
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Transcribe audio con Gemini.")
    parser.add_argument("files", nargs="+", type=Path, help="Archivos .wav o .mp3")
    parser.add_argument("--output", type=Path, default=Path("gemini_results.json"))
    args = parser.parse_args()
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("Falta GEMINI_API_KEY. Cópiala desde .env.example a .env.")
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    client = genai.Client(api_key=api_key)
    results: list[dict[str, str]] = []
    if args.output.exists():
        results = json.loads(args.output.read_text(encoding="utf-8-sig"))
    completed = {item["archivo"] for item in results}
    for audio_path in args.files:
        if not audio_path.exists():
            raise SystemExit(f"No existe el archivo: {audio_path}")
        if str(audio_path) in completed:
            print(f"Ya existe resultado para {audio_path}; se omite.")
            continue
        print(f"Transcribiendo {audio_path}...")
        try:
            transcription = transcribe_file(client, audio_path, model)
        except Exception as error:
            save_results(args.output, results)
            raise SystemExit(f"No se pudo procesar {audio_path}: {error}") from error
        results.append({"archivo": str(audio_path), "modelo": model, "transcripcion_gemini": transcription})
        save_results(args.output, results)
    print(f"Resultados guardados en {args.output}")


if __name__ == "__main__":
    main()
