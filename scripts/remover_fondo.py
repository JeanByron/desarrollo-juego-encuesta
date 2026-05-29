"""
Convierte una imagen con fondo blanco (JFIF/JPG) en un PNG con fondo transparente,
recortado y reescalado para servir como avatar del juego.

Pasos:
  1. Carga la imagen como RGBA.
  2. Flood-fill desde las 4 esquinas con tolerancia → el fondo blanco contiguo
     se vuelve alpha=0. Esto conserva blancos internos (ojos, dientes, etc.).
  3. Recorta al bounding box del contenido visible.
  4. Centra en un lienzo cuadrado con padding mínimo → el círculo del avatar
     queda simétrico.
  5. Reescala a TAMANO (por defecto 512) preservando proporciones y guarda PNG
     optimizado.

Uso:
  python scripts/remover_fondo.py <entrada> <salida> [--tamano 512] [--thresh 30]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from PIL import Image, ImageDraw


def remover_fondo(
    entrada: Path,
    salida: Path,
    tamano: int = 512,
    thresh: int = 30,
    padding_ratio: float = 0.06,
) -> None:
    img = Image.open(entrada).convert("RGBA")
    w, h = img.size

    # Flood-fill desde las 4 esquinas con (R,G,B,0). thresh controla cuánta
    # diferencia de color admite respecto al píxel inicial.
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(img, corner, (255, 255, 255, 0), thresh=thresh)

    # Recortar al contenido visible (ignora alpha=0).
    bbox = img.getbbox()
    if bbox is None:
        raise RuntimeError("La imagen quedó completamente transparente — sube el --thresh")
    recortado = img.crop(bbox)

    # Centrar en lienzo cuadrado con un pequeño padding para que el círculo
    # del avatar no recorte cabezas/manos.
    cw, ch = recortado.size
    lado = max(cw, ch)
    pad = int(lado * padding_ratio)
    cuadrado_lado = lado + pad * 2
    cuadrado = Image.new("RGBA", (cuadrado_lado, cuadrado_lado), (0, 0, 0, 0))
    cuadrado.paste(recortado, ((cuadrado_lado - cw) // 2, (cuadrado_lado - ch) // 2), recortado)

    # Reescalar a la resolución de avatar.
    final = cuadrado.resize((tamano, tamano), Image.LANCZOS)

    # Paletizar a 96 colores conservando transparencia → PNG-8, ~3-5x más liviano
    # que PNG-24. Para ilustraciones tipo cartoon la diferencia visual es nula.
    # Image.FASTOCTREE soporta RGBA y mantiene un índice transparente.
    paleta = final.quantize(colors=96, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)

    salida.parent.mkdir(parents=True, exist_ok=True)
    paleta.save(salida, format="PNG", optimize=True)
    # Evitamos caracteres unicode en el print para no chocar con cp1252 (Windows).
    print(f"{entrada.name} -> {salida}  ({final.size[0]}x{final.size[1]}, {salida.stat().st_size // 1024} KB)")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("entrada", type=Path)
    p.add_argument("salida", type=Path)
    p.add_argument("--tamano", type=int, default=512)
    p.add_argument("--thresh", type=int, default=30)
    args = p.parse_args()
    remover_fondo(args.entrada, args.salida, tamano=args.tamano, thresh=args.thresh)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
