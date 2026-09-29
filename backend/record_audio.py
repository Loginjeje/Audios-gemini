"""Graba tres audios WAV en español desde el micrófono."""

from pathlib import Path

import sounddevice as sd
from scipy.io.wavfile import write

PHRASES = [
    "La tecnología puede hacer más accesible la educación.",
    "Mañana vamos a comparar dos métodos de transcripción de audio.",
    "Una buena aplicación debe ser precisa, rápida y fácil de usar.",
]
SAMPLE_RATE = 16_000
OUTPUT_DIR = Path("audios")


def record_phrase(index: int, phrase: str) -> None:
    duration = float(input(f"Duración para el audio {index} en segundos [6]: ") or "6")
    print(f"Lee esta frase cuando empiece la grabación:\n  {phrase}")
    input("Pulsa Enter para grabar...")
    print("Grabando...")
    recording = sd.rec(int(duration * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype="int16")
    sd.wait()
    output_file = OUTPUT_DIR / f"audio_{index}.wav"
    write(output_file, SAMPLE_RATE, recording)
    print(f"Guardado: {output_file}\n")


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    print("Grabador de pruebas en español. Usa un lugar silencioso.\n")
    for index, phrase in enumerate(PHRASES, start=1):
        record_phrase(index, phrase)
    print("Los tres audios están listos en la carpeta audios/.")


if __name__ == "__main__":
    main()
