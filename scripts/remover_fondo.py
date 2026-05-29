"""
Procesa una imagen de personaje (JFIF, JPG o PNG) para servir como avatar:
  1. Si la entrada tiene fondo blanco (poca transparencia), lo elimina con
     flood-fill desde múltiples puntos del borde. Si ya viene con alpha
     significativo (PNG transparente), se salta este paso.
  2. Recorta al bounding box del contenido visible.
  3. Centra en lienzo cuadrado con padding.
  4. Reescala a TAMANO (720 por defecto) y guarda PNG-8 paletizado.

Uso:
  python scripts/remover_fondo.py <entrada> <salida>
  python scripts/remover_fondo.py <entrada> <salida> --tamano 720 --thresh 20

Procesar todo en bloque:
  python scripts/remover_fondo.py --batch
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from PIL import Image, ImageDraw


# Mapa fuente -> destino para el modo --batch.
# Tuplas: (origen, destino, forzar_remover_fondo, padding_ratio).
# Padding extra (15%) en los stickers de Redbubble (Flanders/Burns) porque la
# ilustración llega hasta el borde del lienzo y, recortada en círculo, se le
# perderían las puntas (cabello, mano del "OK", etc.).
BATCH = [
    ("personajes/apu.png",                                      "public/personajes/apu.png",      False, 0.06),
    ("personajes/bart.png",                                     "public/personajes/bart.png",     False, 0.06),
    ("personajes/homer.png",                                    "public/personajes/homero.png",   False, 0.06),
    ("personajes/krusty.png",                                   "public/personajes/krusty.png",   False, 0.06),
    ("personajes/lisa.png",                                     "public/personajes/lisa.png",     False, 0.06),
    ("personajes/maggie.png",                                   "public/personajes/maggie.png",   False, 0.06),
    ("personajes/marge.png",                                    "public/personajes/marge.png",    False, 0.06),
    ("personajes/milhouse.png",                                 "public/personajes/milhouse.png", False, 0.06),
    ("personajes/moe.png",                                      "public/personajes/moe.png",      False, 0.06),
    ("personajes/nelson.png",                                   "public/personajes/nelson.png",   False, 0.06),
    ("personajes/Ned Flanders_.jfif",                           "public/personajes/flanders.png", True,  0.14),
    ("personajes/pan berns.jfif",                               "public/personajes/burns.png",    True,  0.18),
]


def tiene_transparencia(img: Image.Image, umbral_pct: float = 5.0) -> bool:
    """True si más del umbral_pct de píxeles ya tienen alpha < 250."""
    if img.mode != "RGBA":
        return False
    alpha = img.split()[3]
    total = alpha.size[0] * alpha.size[1]
    transparentes = sum(1 for px in alpha.getdata() if px < 250)
    return (transparentes / total) * 100 > umbral_pct


def puntos_de_borde(w: int, h: int) -> list[tuple[int, int]]:
    """4 esquinas + 4 puntos medios de cada borde = 8 semillas para flood-fill."""
    return [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2),
    ]


def remover_fondo_blanco(img: Image.Image, thresh: int) -> Image.Image:
    out = img.copy()
    for pt in puntos_de_borde(*out.size):
        # Si el punto inicial ya es transparente o muy oscuro, floodfill no
        # hace nada útil — lo verificamos antes para no tirar errores.
        px = out.getpixel(pt)
        if len(px) == 4 and px[3] == 0:
            continue
        if sum(px[:3]) < 600:  # ese punto no parece fondo claro
            continue
        ImageDraw.floodfill(out, pt, (255, 255, 255, 0), thresh=thresh)
    return out


def procesar(
    entrada: Path,
    salida: Path,
    tamano: int = 720,
    thresh: int = 20,
    padding_ratio: float = 0.08,
    forzar_remover: bool = False,
) -> None:
    img = Image.open(entrada).convert("RGBA")

    if forzar_remover or not tiene_transparencia(img):
        img = remover_fondo_blanco(img, thresh)

    bbox = img.getbbox()
    if bbox is None:
        raise RuntimeError(f"{entrada}: la imagen quedó completamente transparente, sube --thresh")
    recortado = img.crop(bbox)

    cw, ch = recortado.size
    lado = max(cw, ch)
    pad = int(lado * padding_ratio)
    cuadrado_lado = lado + pad * 2
    cuadrado = Image.new("RGBA", (cuadrado_lado, cuadrado_lado), (0, 0, 0, 0))
    cuadrado.paste(recortado, ((cuadrado_lado - cw) // 2, (cuadrado_lado - ch) // 2), recortado)

    final = cuadrado.resize((tamano, tamano), Image.LANCZOS)

    # PNG-8 paletizado (96 colores) con preservación de transparencia.
    paleta = final.quantize(colors=96, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)

    salida.parent.mkdir(parents=True, exist_ok=True)
    paleta.save(salida, format="PNG", optimize=True)

    kb = salida.stat().st_size // 1024
    print(f"{entrada.name:55s} -> {salida.name:18s} ({final.size[0]}px, {kb}KB)")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("entrada", type=Path, nargs="?")
    p.add_argument("salida", type=Path, nargs="?")
    p.add_argument("--tamano", type=int, default=720)
    p.add_argument("--thresh", type=int, default=20)
    p.add_argument("--padding", type=float, default=0.08)
    p.add_argument("--forzar-remover", action="store_true")
    p.add_argument("--batch", action="store_true",
                   help="Procesa los 12 personajes desde la carpeta personajes/")
    args = p.parse_args()

    if args.batch:
        for src, dst, forzar, padding in BATCH:
            src_p, dst_p = Path(src), Path(dst)
            if not src_p.exists():
                print(f"omitido (no existe): {src}", file=sys.stderr)
                continue
            procesar(src_p, dst_p, tamano=args.tamano, thresh=args.thresh,
                     padding_ratio=padding, forzar_remover=forzar)
        return

    if not args.entrada or not args.salida:
        p.error("entrada y salida son obligatorios (o usa --batch)")
    procesar(args.entrada, args.salida, tamano=args.tamano, thresh=args.thresh,
             padding_ratio=args.padding, forzar_remover=args.forzar_remover)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
