"""Bootstrap fonts used by the slide kit.

Downloads Inter (variable) and JetBrains Mono into `marketing/scripts/fonts/`
if they are not already present. Cross-platform — uses only stdlib `urllib`,
no curl/wget/sh needed.

Usage:
    python3 marketing/scripts/fetch_fonts.py            # download if missing
    python3 marketing/scripts/fetch_fonts.py --force    # always re-download

Fonts:
  - Inter — © Rasmus Andersson, SIL Open Font License 1.1
  - JetBrains Mono — © JetBrains, SIL Open Font License 1.1

License text saved alongside the fonts as OFL.txt.
"""
from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

FONT_DIR = Path(__file__).resolve().parent / "fonts"

# (relative output filename, source URL)
ASSETS: list[tuple[str, str]] = [
    ("Inter.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"),
    ("Inter-Italic.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Italic%5Bopsz,wght%5D.ttf"),
    ("JetBrainsMono-Regular.ttf", "https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Regular.ttf"),
    ("JetBrainsMono-Bold.ttf", "https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Bold.ttf"),
    ("OFL.txt", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/OFL.txt"),
]

MIN_BYTES = 2048  # any "font" smaller than this is almost certainly an error page


def _download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "ProductiveYou-fetch-fonts/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())


def fetch(force: bool = False) -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in ASSETS:
        out = FONT_DIR / name
        if out.exists() and not force and out.stat().st_size >= MIN_BYTES:
            print(f"  ✓ {name} (cached, {out.stat().st_size // 1024} KB)")
            continue
        print(f"  ↓ {name}  <- {url}")
        try:
            _download(url, out)
        except Exception as e:
            print(f"    ! failed: {e}", file=sys.stderr)
            sys.exit(1)
        sz = out.stat().st_size
        if sz < MIN_BYTES:
            out.unlink()
            print(f"    ! suspiciously small ({sz} bytes), removed", file=sys.stderr)
            sys.exit(1)
        print(f"    saved {sz // 1024} KB")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--force", action="store_true", help="re-download even if files exist")
    args = p.parse_args()
    print(f"fetching fonts into {FONT_DIR} …")
    fetch(force=args.force)
    print("done.")
