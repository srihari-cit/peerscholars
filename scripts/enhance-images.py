"""Sharpen and clarify site photos for a more professional look."""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

IMAGES_DIR = Path(__file__).resolve().parents[1] / "images"
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def unsharp_mask(img: Image.Image, radius=1.6, percent=175, threshold=2) -> Image.Image:
    return img.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=threshold))


def enhance(path: Path) -> None:
    img = Image.open(path).convert("RGB")

    # Reduce washed-out haze and improve tonal range.
    img = ImageOps.autocontrast(img, cutoff=1)
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.08)
    img = ImageEnhance.Brightness(img).enhance(1.03)
    img = ImageEnhance.Sharpness(img).enhance(1.35)
    img = unsharp_mask(img)

    save_kwargs = {"optimize": True}
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        save_kwargs["quality"] = 92
        save_kwargs["progressive"] = True
    else:
        save_kwargs["compress_level"] = 6

    img.save(path, **save_kwargs)
    print(f"Enhanced {path.name}")


def main() -> None:
    for path in sorted(IMAGES_DIR.iterdir()):
        if path.suffix.lower() in EXTENSIONS:
            enhance(path)


if __name__ == "__main__":
    main()
