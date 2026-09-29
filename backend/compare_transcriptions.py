"""Calcula WER comparando frases de referencia y resultados de Gemini/Web Speech."""

import argparse
import json
import re
import unicodedata
from pathlib import Path


def normalize(text: str) -> list[str]:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.findall(r"[a-z0-9]+", text)


def wer(reference: list[str], hypothesis: list[str]) -> float:
    previous = list(range(len(hypothesis) + 1))
    for row, reference_word in enumerate(reference, start=1):
        current = [row]
        for column, hypothesis_word in enumerate(hypothesis, start=1):
            substitution = previous[column - 1] + (reference_word != hypothesis_word)
            insertion = current[column - 1] + 1
            deletion = previous[column] + 1
            current.append(min(substitution, insertion, deletion))
        previous = current
    return previous[-1] / max(len(reference), 1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Compara transcripciones con WER.")
    parser.add_argument("results", type=Path, help="JSON de comparación")
    args = parser.parse_args()
    data = json.loads(args.results.read_text(encoding="utf-8-sig"))
    print("Archivo | Método | WER | Transcripción")
    print("--- | --- | ---: | ---")
    for item in data:
        reference = normalize(item["referencia"])
        for method in ("web_speech", "gemini"):
            transcript = item.get(method, "")
            score = wer(reference, normalize(transcript)) * 100
            print(f"{item['archivo']} | {method} | {score:.1f}% | {transcript}")


if __name__ == "__main__":
    main()
