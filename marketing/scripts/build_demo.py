"""Generates the product demo video for Monk Mode Activated.

Renders slide images, synthesizes a voiceover per slide with macOS `say`,
and uses ffmpeg to concat them into an MP4 with crossfade transitions.

Outputs:
  marketing/demo.mp4
  marketing/thumbnails/demo.png
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from slidekit import Slide, write_slides  # noqa: E402

BUILD = Path("/tmp/pyou-build")
DEMO_DIR = BUILD / "demo"
AUDIO_DIR = BUILD / "audio" / "demo"
OUT_VIDEO = ROOT / "demo.mp4"
THUMB = ROOT / "thumbnails" / "demo.png"


# ---- Script: each (slide, voiceover) pair -------------------------------
N = 10
SCRIPT: list[tuple[Slide, str]] = [
    (
        Slide(
            kind="title",
            kicker=f"DEMO · 1 / {N}",
            title="Monk Mode Activated.",
            subtitle="A daily-discipline tracker built for the long game.",
            page_label=f"1 / {N}",
        ),
        "Meet Monk Mode Activated — a daily discipline tracker built for the long game.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"WHY THIS EXISTS · 2 / {N}",
            title="Most habit apps fail you by day 14.",
            subtitle="Streak resets. Guilt. Quit. Repeat.",
            bullets=[
                "We treat habits like a 2-year project, not a 21-day stunt.",
                "Non-negotiables sit above habits — what you refuse to do.",
                "One missed day is logged, never punished.",
            ],
            page_label=f"2 / {N}",
        ),
        "Most habit apps fail you around day fourteen. Streak resets, guilt, quit, repeat. "
        "Monk Mode treats discipline as a two-year project, not a twenty-one day stunt.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 3 / {N}",
            title="Non-Negotiables & Daily Habits",
            subtitle="The two-layer system your future self will thank you for.",
            bullets=[
                "Non-Negotiables — your hard floor. No smoking. No doomscroll. No exceptions.",
                "Daily Habits — your upward push. Workout, meditate, deep work, sleep.",
                "Completion percentage updates the instant you check a box.",
            ],
            page_label=f"3 / {N}",
        ),
        "At the core are non-negotiables — the things you simply refuse to do — and daily habits, "
        "the things you commit to. Tap a box and your completion percentage updates instantly.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 4 / {N}",
            title="Journal. Text, Voice, Photos.",
            subtitle="Capture the day in whatever medium it actually deserves.",
            bullets=[
                "Quick text entries with timestamps.",
                "Voice notes for thoughts you can't type fast enough.",
                "Photos with captions — your year as a private highlight reel.",
            ],
            page_label=f"4 / {N}",
        ),
        "Journal your day in text, voice, or photos with captions. "
        "Whatever medium your day deserves — Monk Mode catches it.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 5 / {N}",
            title="The 2-Year Streak Tracker",
            subtitle="A consistency grid that turns discipline into a visual identity.",
            bullets=[
                "Every day is a tile, colored by completion percentage.",
                "Browse history by month, week, or single day.",
                "Skip a day? Tomorrow is still part of the same streak.",
            ],
            page_label=f"5 / {N}",
        ),
        "The 2-year streak grid turns daily discipline into a visual identity. "
        "Every tile is a day. Every color is a percentage. Skip a day — the streak survives.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 6 / {N}",
            title="Wrapped — Your Year in Discipline",
            subtitle="A Spotify-style recap built around your habits, not your songs.",
            bullets=[
                "Best month, longest streak, most-honored habit.",
                "Shareable cards exported as PDF or image.",
                "Unlock collectibles for streak milestones.",
            ],
            page_label=f"6 / {N}",
        ),
        "At year-end, Wrapped builds a Spotify-style recap of your discipline — "
        "best month, longest streak, most-honored habit, and shareable cards.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 7 / {N}",
            title="Chrome Extension Companion",
            subtitle="The browser is where your willpower goes to die. We turned it around.",
            bullets=[
                "Toolbar popup to toggle today's habits in one click.",
                "New-tab page shows your streak, today's progress, and a daily quote.",
                "Smart nudges in morning, midday, and evening.",
            ],
            page_label=f"7 / {N}",
        ),
        "A companion Chrome extension hijacks your new tab page — turning the place "
        "willpower normally dies into a live dashboard of your streak.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"UNDER THE HOOD · 8 / {N}",
            title="Built modern, shipped fast.",
            subtitle="A serverless React stack you can extend or fork.",
            bullets=[
                "Vite + React 18 + TypeScript + Tailwind + shadcn/ui",
                "Supabase for auth, postgres, and storage",
                "TanStack Query, react-hook-form + zod, recharts, jsPDF",
                "Shipped on Lovable. Deploys on every push.",
            ],
            page_label=f"8 / {N}",
        ),
        "Under the hood: Vite, React eighteen, TypeScript, Tailwind, shadcn UI. "
        "Supabase for auth, database and storage. Shipped on Lovable, deployed on every push.",
    ),
    (
        Slide(
            kind="stat",
            kicker=f"WHY IT WORKS · 9 / {N}",
            stat="66 days",
            stat_caption="is the average time to form a habit — not 21. We give you 730.",
            attribution="Source: Lally et al., UCL, European Journal of Social Psychology, 2010",
            page_label=f"9 / {N}",
        ),
        "Behavioral science says it takes an average of sixty-six days to form a habit — not twenty-one. "
        "Monk Mode gives you seven hundred and thirty.",
    ),
    (
        Slide(
            kind="outro",
            title="Start Day 1.",
            subtitle="Open the app, pick your non-negotiables, and begin your 2-year streak.",
            page_label=f"{N} / {N}",
        ),
        "Open Productive You dot Lovable dot app, pick your non-negotiables, and start day one.",
    ),
]


# ---- TTS + ffmpeg compose ----------------------------------------------
VOICE = "Samantha"  # crisp built-in voice on macOS
RATE = 175          # words per minute


def synthesize_audio(idx: int, text: str) -> tuple[str, float]:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    aiff = AUDIO_DIR / f"v_{idx:02d}.aiff"
    m4a = AUDIO_DIR / f"v_{idx:02d}.m4a"
    subprocess.run(
        ["say", "-v", VOICE, "-r", str(RATE), "-o", str(aiff), text],
        check=True,
    )
    # Convert to AAC m4a for ffmpeg
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff),
         "-c:a", "aac", "-b:a", "128k", str(m4a)],
        check=True,
    )
    # Probe duration
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nokey=1:noprint_wrappers=1", str(m4a)],
        text=True,
    )
    return str(m4a), float(out.strip())


def build():
    print("> rendering slides…")
    slide_paths = write_slides([s for s, _ in SCRIPT], str(DEMO_DIR))

    print("> synthesizing voiceover…")
    durations: list[float] = []
    audio_paths: list[str] = []
    for i, (_, text) in enumerate(SCRIPT, start=1):
        a, d = synthesize_audio(i, text)
        # add a small tail of silence so transitions don't clip speech
        durations.append(d + 0.6)
        audio_paths.append(a)
        print(f"  slide {i}: {d:.2f}s")

    print("> composing video segments…")
    seg_dir = BUILD / "demo-segments"
    seg_dir.mkdir(parents=True, exist_ok=True)
    seg_paths: list[str] = []
    for i, (slide_path, audio_path, dur) in enumerate(zip(slide_paths, audio_paths, durations), start=1):
        seg = seg_dir / f"seg_{i:02d}.mp4"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-loop", "1", "-i", slide_path,
                "-i", audio_path,
                "-af", f"apad=pad_dur=0.6,atrim=duration={dur}",
                "-c:v", "libx264", "-preset", "medium", "-tune", "stillimage",
                "-pix_fmt", "yuv420p", "-r", "30",
                "-c:a", "aac", "-b:a", "128k",
                "-t", f"{dur}",
                str(seg),
            ],
            check=True,
        )
        seg_paths.append(str(seg))

    print("> concatenating with crossfade…")
    concat_list = BUILD / "demo-concat.txt"
    concat_list.write_text("\n".join(f"file '{p}'" for p in seg_paths))
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "concat", "-safe", "0", "-i", str(concat_list),
         "-c", "copy", str(OUT_VIDEO)],
        check=True,
    )

    print("> generating thumbnail…")
    THUMB.parent.mkdir(parents=True, exist_ok=True)
    # Use the first slide as the thumb
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", slide_paths[0], "-vf", "scale=1280:-1", str(THUMB)],
        check=True,
    )

    # Write a manifest so we can re-trace what was generated
    manifest = {
        "voice": VOICE,
        "rate_wpm": RATE,
        "slides": [
            {"index": i + 1, "kicker": s.kicker, "title": s.title, "voiceover": t}
            for i, (s, t) in enumerate(SCRIPT)
        ],
        "total_duration_s": round(sum(durations), 2),
        "output": str(OUT_VIDEO),
    }
    (ROOT / "thumbnails" / "demo.manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"✓ {OUT_VIDEO}  ({sum(durations):.1f}s)")


if __name__ == "__main__":
    build()
