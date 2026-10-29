#!/usr/bin/env python3
"""Generate Android launcher icons + splash screens from logo.png (1024x1024) into the
Capacitor android project. Run after `npx cap add android` (or whenever the logo changes):
    ../lighthouse/.venv/bin/python scripts/android_assets.py"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android/app/src/main/res"
BG = (237, 233, 254)  # --bg1 #ede9fe
logo = Image.open(ROOT / "logo.png").convert("RGBA")

DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def rounded(img: Image.Image, radius_frac: float) -> Image.Image:
    m = Image.new("L", img.size, 0)
    r = int(img.size[0] * radius_frac)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius=r, fill=255)
    out = Image.new("RGBA", img.size, BG + (255,))
    out.paste(img, (0, 0), img)
    out.putalpha(m)
    return out


def circle(img: Image.Image) -> Image.Image:
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, img.size[0] - 1, img.size[1] - 1], fill=255)
    out = Image.new("RGBA", img.size, BG + (255,))
    out.paste(img, (0, 0), img)
    out.putalpha(m)
    return out


for d, s in DENS.items():
    size = int(48 * s)
    base = logo.resize((size, size), Image.LANCZOS)
    (RES / f"mipmap-{d}").mkdir(parents=True, exist_ok=True)
    rounded(base, 0.2).save(RES / f"mipmap-{d}/ic_launcher.png")
    circle(base).save(RES / f"mipmap-{d}/ic_launcher_round.png")
    # adaptive foreground: 108dp canvas, logo in the 72dp safe zone
    fg_size = int(108 * s)
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    inner = logo.resize((int(72 * s), int(72 * s)), Image.LANCZOS)
    fg.paste(inner, ((fg_size - inner.size[0]) // 2,) * 2, inner)
    fg.save(RES / f"mipmap-{d}/ic_launcher_foreground.png")

(RES / "values/ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#EDE9FE</color>\n</resources>\n')

# splash: centred logo on the app background, for every drawable-(port|land)-<dpi> the template ships
SPLASH = {"port": (480, 800), "land": (800, 480)}
for folder in RES.glob("drawable*"):
    if not (folder / "splash.png").exists():
        continue
    name = folder.name
    orient = "port" if "port" in name else "land" if "land" in name else "port"
    dens = name.split("-")[-1] if name.split("-")[-1] in DENS else "xhdpi"
    s = DENS[dens]
    w, h = (int(x * s) for x in SPLASH[orient])
    img = Image.new("RGBA", (w, h), BG + (255,))
    side = int(min(w, h) * 0.42)
    lg = logo.resize((side, side), Image.LANCZOS)
    img.paste(lg, ((w - side) // 2, (h - side) // 2), lg)
    img.convert("RGB").save(folder / "splash.png")
print("icons + splash written to", RES)
