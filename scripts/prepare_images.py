#!/usr/bin/env python3

from __future__ import annotations

import argparse
import io
import subprocess
import sys
import tempfile
from pathlib import Path


DEFAULT_INPUT_DIR = Path("src/assets/raw")
LEGACY_INPUT_DIR = Path("src/asset/raw")
TARGET_WIDTH = 600
TARGET_HEIGHT = 400
TARGET_OBJECT_HEIGHT = 320
SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".heic"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Convert images to PNG, (optionally) remove the background with rembg, "
            "trim transparent pixels, then center the result in a 600x400 canvas."
        )
    )
    parser.add_argument(
        "-i",
        "--input",
        dest="input_path",
        help="Input image file or input directory. Defaults to src/assets/raw when omitted.",
    )
    parser.add_argument(
        "-o",
        "--output",
        dest="output_dir",
        help="Output directory for generated PNG files.",
    )
    parser.add_argument(
        "--skip-remove-background",
        action="store_true",
        dest="skip_remove_background",
        help="Skip background removal (do not call rembg).",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        help="Backwards-compatible positional form: output_dir or input_path output_dir.",
    )
    return parser.parse_args()


def resolve_input_dir() -> Path:
    if DEFAULT_INPUT_DIR.is_dir():
        return DEFAULT_INPUT_DIR
    if LEGACY_INPUT_DIR.is_dir():
        return LEGACY_INPUT_DIR
    return DEFAULT_INPUT_DIR


def parse_paths(args: argparse.Namespace) -> tuple[Path, Path]:
    if args.input_path and args.output_dir:
        return Path(args.input_path), Path(args.output_dir)

    if args.paths:
        if len(args.paths) == 1:
            return resolve_input_dir(), Path(args.paths[0])
        if len(args.paths) == 2:
            return Path(args.paths[0]), Path(args.paths[1])

    raise SystemExit(
        "Usage: scripts/prepare_images.py --output <output_dir> [--input <input_path>] | "
        "scripts/prepare_images.py <output_dir> | scripts/prepare_images.py <input_path> <output_dir>"
    )


def ensure_dependencies() -> None:
    if not shutil_which("convert"):
        raise SystemExit("Error: ImageMagick 'convert' command not found.")


def shutil_which(binary: str) -> str | None:
    from shutil import which

    return which(binary)


def load_runtime_dependencies(require_rembg: bool) -> tuple[object, object | None, object | None]:
    try:
        from PIL import Image
    except ImportError as exc:
        missing_dependency = "Pillow" if exc.name == "PIL" else exc.name
        raise SystemExit(
            "Error: missing Python dependency "
            f"'{missing_dependency}'. Install it with: "
            "python3 -m pip install --user --break-system-packages Pillow"
        ) from exc

    if not require_rembg:
        return Image, None, None

    try:
        from rembg import new_session, remove
    except ImportError as exc:
        missing_dependency = exc.name or "rembg"
        raise SystemExit(
            "Error: missing Python dependency "
            f"'{missing_dependency}'. Install it with: "
            "python3 -m pip install --user --break-system-packages 'rembg[cpu]'"
        ) from exc

    return Image, new_session, remove


def list_input_files(input_path: Path) -> list[Path]:
    if input_path.is_file():
        if input_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            raise SystemExit(f"Error: unsupported input file format '{input_path.suffix}'.")
        return [input_path]

    return sorted(
        path
        for path in input_path.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def decode_to_png(input_path: Path, output_path: Path) -> None:
    subprocess.run(
        ["convert", str(input_path), f"PNG32:{output_path}"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def trim_transparent_pixels(image: object) -> object | None:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return None
    return image.crop(bbox)


def resize_object(image: object, image_module: object) -> object:
    width, height = image.size
    if width == 0 or height == 0:
        return image

    scale = TARGET_OBJECT_HEIGHT / height
    scaled_width = max(1, round(width * scale))
    scaled_height = max(1, round(height * scale))

    if scaled_width > TARGET_WIDTH or scaled_height > TARGET_HEIGHT:
        fit_scale = min(TARGET_WIDTH / width, TARGET_HEIGHT / height)
        scaled_width = max(1, round(width * fit_scale))
        scaled_height = max(1, round(height * fit_scale))

    return image.resize((scaled_width, scaled_height), image_module.Resampling.LANCZOS)


def center_on_canvas(image: object, image_module: object) -> object:
    canvas = image_module.new("RGBA", (TARGET_WIDTH, TARGET_HEIGHT), (0, 0, 0, 0))
    offset = ((TARGET_WIDTH - image.width) // 2, (TARGET_HEIGHT - image.height) // 2)
    canvas.paste(image, offset, image)
    return canvas


def remove_background(png_bytes: bytes, session: object, remove_fn: object, image_module: object) -> object:
    result_bytes = remove_fn(png_bytes, session=session)
    return image_module.open(io.BytesIO(result_bytes)).convert("RGBA")


def process_image(
    input_path: Path,
    output_dir: Path,
    session: object,
    temp_dir: Path,
    image_module: object,
    remove_fn: object,
) -> bool:
    print(f"Processing {input_path}")
    converted_path = temp_dir / f"{input_path.stem}-converted.png"
    decode_to_png(input_path, converted_path)

    if remove_fn is None:
        subject = image_module.open(converted_path).convert("RGBA")
    else:
        with converted_path.open("rb") as handle:
            subject = remove_background(handle.read(), session, remove_fn, image_module)

    trimmed = trim_transparent_pixels(subject)
    if trimmed is None:
        print("  Skipped: fully transparent result", file=sys.stderr)
        return False

    prepared = center_on_canvas(resize_object(trimmed, image_module), image_module)
    output_path = output_dir / f"{input_path.stem}.png"
    prepared.save(output_path, format="PNG")
    return True


def main() -> int:
    args = parse_args()
    input_path, output_dir = parse_paths(args)

    ensure_dependencies()
    image_module, new_session, remove_fn = load_runtime_dependencies(require_rembg=not args.skip_remove_background)

    if not input_path.exists():
        raise SystemExit(f"Error: input path '{input_path}' does not exist.")

    output_dir.mkdir(parents=True, exist_ok=True)

    session = None
    if new_session is not None:
        try:
            session = new_session()
        except Exception as exc:
            raise SystemExit(
                "Error: rembg requires an ONNX runtime backend. Install it with: "
                "python3 -m pip install --user --break-system-packages 'rembg[cpu]'"
            ) from exc

    input_files = list_input_files(input_path)

    processed_count = 0
    skipped_count = 0

    with tempfile.TemporaryDirectory() as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        for input_path in input_files:
            try:
                if process_image(input_path, output_dir, session, temp_dir, image_module, remove_fn):
                    processed_count += 1
                else:
                    skipped_count += 1
            except subprocess.CalledProcessError:
                print(f"  Skipped: failed to convert {input_path}", file=sys.stderr)
                skipped_count += 1
            except Exception as exc:
                print(f"  Skipped: {input_path} ({exc})", file=sys.stderr)
                skipped_count += 1

    print()
    print(f"Done: {processed_count} image(s) processed, {skipped_count} skipped.")
    print(f"Output: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())