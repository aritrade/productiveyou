"""Slide rendering toolkit for ProductiveYou marketing assets.

Renders 1920x1080 PNG slides in the dark + warm-orange aesthetic of the
Monk Mode Activated app. Used by `build_demo.py`, `build_pitch_video.py`
and `build_deck.py`.

Cross-platform (macOS / Linux / Windows). Requires Pillow only — fonts
are bundled in `marketing/scripts/fonts/` (Inter + JetBrains Mono, both
SIL OFL 1.1, see fonts/OFL.txt).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080

# ---- Design tokens (mirroring the app's tailwind palette) -------------------
BG = (10, 10, 14)              # hsl(240 10% 4%)
FG = (230, 226, 215)           # hsl(45 15% 90%)
MUTED = (105, 110, 122)        # hsl(220 8% 42%)
DIM = (60, 62, 70)
ACCENT = (252, 173, 41)        # hsl(38 95% 52%)
ACCENT_DEEP = (191, 124, 28)   # hsl(32 80% 42%)
PANEL = (20, 20, 26)
PANEL_HI = (30, 30, 38)
DANGER = (228, 90, 90)
GOOD = (108, 198, 138)


# ---- Font helpers -----------------------------------------------------------
FONT_DIR = Path(__file__).resolve().parent / "fonts"

INTER_VAR = FONT_DIR / "Inter.ttf"               # variable font, weight axis 100..900
INTER_ITALIC_VAR = FONT_DIR / "Inter-Italic.ttf"
JBM_REGULAR = FONT_DIR / "JetBrainsMono-Regular.ttf"
JBM_BOLD = FONT_DIR / "JetBrainsMono-Bold.ttf"

# Map our semantic "weight" tokens to Inter named instances
_WEIGHT_INSTANCE = {
    "ultralight": "Thin",
    "light": "Light",
    "regular": "Regular",
    "medium": "Medium",
    "semibold": "SemiBold",
    "bold": "Bold",
    "extrabold": "ExtraBold",
    "black": "Black",
}


def _check_fonts() -> None:
    missing = [str(p) for p in (INTER_VAR, INTER_ITALIC_VAR, JBM_REGULAR, JBM_BOLD) if not p.exists()]
    if missing:
        raise FileNotFoundError(
            "Bundled fonts not found:\n  - "
            + "\n  - ".join(missing)
            + "\nRun: python3 marketing/scripts/fetch_fonts.py"
        )


def font(size: int, *, weight: str = "regular", italic: bool = False) -> ImageFont.FreeTypeFont:
    """Inter at the given size + weight. Works identically on macOS/Linux/Windows."""
    _check_fonts()
    src = INTER_ITALIC_VAR if italic else INTER_VAR
    f = ImageFont.truetype(str(src), size)
    inst = _WEIGHT_INSTANCE.get(weight, "Regular")
    try:
        f.set_variation_by_name(inst)
    except Exception:
        # Fallback for older Pillow: leave default weight
        pass
    return f


def mono(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    """JetBrains Mono regular/bold."""
    _check_fonts()
    src = JBM_BOLD if bold else JBM_REGULAR
    return ImageFont.truetype(str(src), size)


# ---- Drawing helpers --------------------------------------------------------
def _lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * max(0.0, min(1.0, t)))


def _gradient_fill(img: Image.Image, top: tuple, bottom: tuple) -> None:
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        draw.line(
            [(0, y), (W, y)],
            fill=(_lerp(top[0], bottom[0], t), _lerp(top[1], bottom[1], t), _lerp(top[2], bottom[2], t)),
        )


def _radial_glow(center: tuple, radius: int, color: tuple, intensity: float = 0.35) -> Image.Image:
    """Produce a radial glow as an RGBA layer ready to be alpha-composited."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    steps = 40
    for i in range(steps, 0, -1):
        r = int(radius * (i / steps))
        a = int(255 * intensity * (1 - i / steps) ** 2)
        draw.ellipse(
            [center[0] - r, center[1] - r, center[0] + r, center[1] + r],
            fill=(color[0], color[1], color[2], a),
        )
    return layer.filter(ImageFilter.GaussianBlur(radius=40))


def _round_rect(draw: ImageDraw.ImageDraw, xy, radius: int, *, fill=None, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def _measure(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def _wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines, line = [], words[0]
    for w in words[1:]:
        cand = line + " " + w
        if _measure(draw, cand, fnt)[0] <= max_w:
            line = cand
        else:
            lines.append(line)
            line = w
    lines.append(line)
    return lines


# ---- High-level slide API ---------------------------------------------------
@dataclass
class Slide:
    kind: str                                # "title" | "feature" | "bullets" | "stat" | "quote" | "outro" | "compare"
    title: str = ""
    subtitle: str = ""
    kicker: str = ""                          # small label above title
    body: str = ""
    bullets: list[str] = field(default_factory=list)
    stat: str = ""                            # big number / phrase
    stat_caption: str = ""
    quote: str = ""
    attribution: str = ""
    accent: str = "orange"                   # currently only orange
    page_label: str = ""                      # e.g. "3 / 12"
    columns: list[tuple[str, str]] = field(default_factory=list)  # (heading, body) pairs
    footer: str = "productiveyou.lovable.app"
    wordmark: str = "MONK MODE ACTIVATED"


def _draw_chrome(img: Image.Image, slide: Slide) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(img)
    # Top-left logo: rounded square with vector lightning bolt
    bolt_box = (72, 60, 132, 120)
    _round_rect(draw, bolt_box, 14, fill=ACCENT)
    # Vector lightning bolt centered in the rounded square
    cx, cy = (bolt_box[0] + bolt_box[2]) / 2, (bolt_box[1] + bolt_box[3]) / 2
    bolt_pts = [
        (cx + 4, cy - 24),
        (cx - 14, cy + 4),
        (cx - 1, cy + 4),
        (cx - 8, cy + 24),
        (cx + 14, cy - 6),
        (cx + 1, cy - 6),
    ]
    draw.polygon(bolt_pts, fill=(15, 10, 2))
    draw.line([bolt_pts[i] for i in range(len(bolt_pts))] + [bolt_pts[0]], fill=(15, 10, 2), width=2)
    wm = font(20, weight="bold")
    draw.text((150, 70), slide.wordmark, font=wm, fill=FG)
    sub = font(14, weight="regular")
    draw.text((150, 100), "Productivity Tracker", font=sub, fill=MUTED)

    # Top-right URL
    url_font = mono(20, bold=False)
    uw, uh = _measure(draw, slide.footer.upper(), url_font)
    draw.text((W - 72 - uw, 78), slide.footer.upper(), font=url_font, fill=MUTED)

    # Bottom-left page label
    if slide.page_label:
        pl = mono(20)
        draw.text((72, H - 80), slide.page_label, font=pl, fill=MUTED)

    # Bottom-right tagline
    tag = font(16)
    tw, th = _measure(draw, "STAY DISCIPLINED.", tag)
    draw.text((W - 72 - tw, H - 76), "STAY DISCIPLINED.", font=tag, fill=DIM)

    return draw


def _composite_background(slide: Slide) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    _gradient_fill(img, (14, 14, 20), (8, 8, 12))
    glow = _radial_glow((W * 0.78, H * 0.18), int(W * 0.55), ACCENT, intensity=0.18)
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    glow2 = _radial_glow((W * 0.08, H * 0.92), int(W * 0.45), (50, 60, 120), intensity=0.1)
    img = Image.alpha_composite(img, glow2)
    return img.convert("RGB")


def render_slide(slide: Slide) -> Image.Image:
    img = _composite_background(slide)
    draw = _draw_chrome(img, slide)

    if slide.kind == "title":
        _render_title(img, draw, slide)
    elif slide.kind == "feature":
        _render_feature(img, draw, slide)
    elif slide.kind == "bullets":
        _render_bullets(img, draw, slide)
    elif slide.kind == "stat":
        _render_stat(img, draw, slide)
    elif slide.kind == "quote":
        _render_quote(img, draw, slide)
    elif slide.kind == "compare":
        _render_compare(img, draw, slide)
    elif slide.kind == "outro":
        _render_outro(img, draw, slide)
    else:
        raise ValueError(f"Unknown slide kind: {slide.kind}")
    return img


def _render_title(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    x = 140
    y = 360
    if s.kicker:
        k = mono(26)
        draw.text((x, y - 80), s.kicker.upper(), font=k, fill=ACCENT)
    title_font = font(150, weight="bold")
    for line in _wrap(draw, s.title, title_font, W - 280):
        draw.text((x, y), line, font=title_font, fill=FG)
        y += int(title_font.size * 1.05)
    if s.subtitle:
        sub = font(46, weight="light")
        y += 16
        for line in _wrap(draw, s.subtitle, sub, W - 280):
            draw.text((x, y), line, font=sub, fill=MUTED)
            y += int(sub.size * 1.2)


def _render_feature(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    x = 140
    y = 220
    # Kicker
    k = mono(24)
    draw.text((x, y), (s.kicker or "FEATURE").upper(), font=k, fill=ACCENT)
    y += 60
    title_font = font(96, weight="bold")
    for line in _wrap(draw, s.title, title_font, W - 280):
        draw.text((x, y), line, font=title_font, fill=FG)
        y += int(title_font.size * 1.0)
    y += 20
    if s.subtitle:
        sub = font(36, weight="light")
        for line in _wrap(draw, s.subtitle, sub, W - 280):
            draw.text((x, y), line, font=sub, fill=MUTED)
            y += int(sub.size * 1.25)
        y += 10
    if s.bullets:
        bf = font(34)
        for b in s.bullets:
            # bullet dot
            cy = y + bf.size // 2
            draw.ellipse([x + 6, cy - 7, x + 22, cy + 7], fill=ACCENT)
            for i, line in enumerate(_wrap(draw, b, bf, W - 360)):
                draw.text((x + 50, y), line, font=bf, fill=FG)
                y += int(bf.size * 1.25)
            y += 8


def _render_bullets(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    _render_feature(img, draw, s)


def _render_stat(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    x = 140
    if s.kicker:
        k = mono(26)
        draw.text((x, 240), s.kicker.upper(), font=k, fill=ACCENT)
    big = font(280, weight="bold")
    bw, bh = _measure(draw, s.stat, big)
    draw.text((x, 320), s.stat, font=big, fill=ACCENT)
    cap = font(46, weight="light")
    y = 320 + bh + 30
    for line in _wrap(draw, s.stat_caption, cap, W - 280):
        draw.text((x, y), line, font=cap, fill=FG)
        y += int(cap.size * 1.2)
    if s.attribution:
        a = font(22)
        draw.text((x, y + 20), s.attribution, font=a, fill=MUTED)


def _render_quote(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    qf = font(72, weight="light")
    qx = 200
    qy = 320
    big_q = font(220, weight="bold")
    draw.text((120, 200), "\u201c", font=big_q, fill=ACCENT)
    lines = _wrap(draw, s.quote, qf, W - 400)
    y = qy
    for line in lines:
        draw.text((qx, y), line, font=qf, fill=FG)
        y += int(qf.size * 1.2)
    if s.attribution:
        a = font(30, weight="light")
        draw.text((qx, y + 30), "— " + s.attribution, font=a, fill=MUTED)


def _render_compare(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    # Title
    x = 140
    if s.kicker:
        draw.text((x, 200), s.kicker.upper(), font=mono(26), fill=ACCENT)
    tf = font(72, weight="bold")
    draw.text((x, 240), s.title, font=tf, fill=FG)

    # Columns laid out as cards
    cols = s.columns
    n = max(1, len(cols))
    gap = 32
    margin = 140
    total_w = W - margin * 2 - gap * (n - 1)
    card_w = total_w // n
    card_h = 540
    cy = 410
    cx = margin
    for i, (heading, body) in enumerate(cols):
        _round_rect(draw, [cx, cy, cx + card_w, cy + card_h], 28, fill=PANEL, outline=PANEL_HI, width=2)
        # heading
        hf = font(42, weight="bold")
        draw.text((cx + 36, cy + 32), heading, font=hf, fill=ACCENT)
        # body
        bf = font(28, weight="light")
        y = cy + 110
        for line in _wrap(draw, body, bf, card_w - 72):
            draw.text((cx + 36, y), line, font=bf, fill=FG)
            y += int(bf.size * 1.3)
        cx += card_w + gap


def _render_outro(img: Image.Image, draw: ImageDraw.ImageDraw, s: Slide) -> None:
    title_font = font(140, weight="bold")
    sub = font(48, weight="light")
    url = mono(56, bold=True)

    tw, th = _measure(draw, s.title, title_font)
    draw.text(((W - tw) // 2, 340), s.title, font=title_font, fill=FG)

    if s.subtitle:
        for i, line in enumerate(_wrap(draw, s.subtitle, sub, W - 400)):
            lw, lh = _measure(draw, line, sub)
            draw.text(((W - lw) // 2, 520 + i * int(sub.size * 1.2)), line, font=sub, fill=MUTED)

    # CTA pill
    cta_text = "PRODUCTIVEYOU.LOVABLE.APP"
    pad_x, pad_y = 60, 28
    tw, th = _measure(draw, cta_text, url)
    pill_w = tw + pad_x * 2
    pill_h = th + pad_y * 2
    px = (W - pill_w) // 2
    py = 760
    _round_rect(draw, [px, py, px + pill_w, py + pill_h], pill_h // 2, fill=ACCENT)
    draw.text((px + pad_x, py + pad_y - 4), cta_text, font=url, fill=(20, 14, 4))


# ---- Convenience: write a slide deck to disk -------------------------------
def write_slides(slides: Iterable[Slide], out_dir: str) -> list[str]:
    os.makedirs(out_dir, exist_ok=True)
    paths: list[str] = []
    for i, s in enumerate(slides, start=1):
        img = render_slide(s)
        p = os.path.join(out_dir, f"slide_{i:02d}.png")
        img.save(p, "PNG", optimize=True)
        paths.append(p)
    return paths


if __name__ == "__main__":
    demo = [
        Slide(kind="title", kicker="DEMO", title="Monk Mode Activated", subtitle="A tracker for the disciplined."),
        Slide(kind="outro", title="Build Your Streak", subtitle="Open the app and start day 1 — your 2-year journey begins."),
    ]
    paths = write_slides(demo, "/tmp/pyou-build/demo-test")
    print("Wrote:", paths)
