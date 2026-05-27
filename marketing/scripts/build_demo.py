"""Generates the product demo video for Monk Mode Activated.

Cross-platform: runs on macOS, Linux and Windows. Voiceover is delegated
to ``tts.py``, which tries edge-tts → pyttsx3 → macOS ``say`` in order
(first one available wins). Image rendering uses Pillow with bundled
OFL-licensed fonts from ``marketing/scripts/fonts/``, so there's no
dependency on system font directories. ffmpeg is the only non-Python
prerequisite — install via Homebrew (macOS), apt/dnf (Linux), or
Chocolatey/winget (Windows).

Outputs:
  marketing/demo.mp4
  marketing/thumbnails/demo.png
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import tts  # noqa: E402
from slidekit import Slide, write_slides  # noqa: E402

BUILD = Path("/tmp/pyou-build")
DEMO_DIR = BUILD / "demo"
AUDIO_DIR = BUILD / "audio" / "demo"
OUT_VIDEO = ROOT / "demo.mp4"
THUMB = ROOT / "thumbnails" / "demo.png"


# ---- Script: each (slide, voiceover) pair -------------------------------
N = 16
SCRIPT: list[tuple[Slide, str]] = [
    (
        Slide(
            kind="title",
            kicker=f"DEMO · 1 / {N}",
            title="Monk Mode Activated.",
            subtitle="A discipline tracker built around behavioral science — not the 21-day myth.",
            page_label=f"1 / {N}",
        ),
        "Meet Monk Mode Activated — a discipline tracker built around behavioral science, "
        "not the twenty-one day myth.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"WHY THIS EXISTS · 2 / {N}",
            title="Most habit apps fail you by day 14.",
            subtitle="Streak resets. Guilt. Quit. Repeat.",
            bullets=[
                "We treat habits as a multi-year project, not a 21-day stunt.",
                "Non-negotiables sit above habits — your hard floor.",
                "One missed day is logged, never punished.",
            ],
            page_label=f"2 / {N}",
        ),
        "Most habit apps fail you around day fourteen. Streak resets, guilt, quit, repeat. "
        "Monk Mode treats discipline as a multi-year project, not a twenty-one day stunt.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 3 / {N}",
            title="Pick Your Non-Negotiables.",
            subtitle="Your rules. Your hard floor. Nobody else's template.",
            bullets=[
                "Fully customizable — no smoking, no doomscroll, no skipping workouts, no booze.",
                "Sits above habits all day. The first thing you see, the last thing you check.",
                "Every user picks their own list at onboarding — and edits it any time.",
            ],
            page_label=f"3 / {N}",
        ),
        "Pick your own non-negotiables. The rules you refuse to break — fully customizable per user. "
        "No smoking, no doomscroll, no booze. Whatever your hard floor is, you define it.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 4 / {N}",
            title="Build Your Habit Stack.",
            subtitle="Your upward push. The things you commit to, every single day.",
            bullets=[
                "Workout, meditate, deep work, cold shower, read 30 minutes — or anything you choose.",
                "Each habit is one tap. Completion percentage updates instantly.",
                "Stack changes? Edit anytime. The streak doesn't care, only the consistency does.",
            ],
            page_label=f"4 / {N}",
        ),
        "Build your own habit stack. Workout, meditate, deep work, cold shower — or whatever moves you "
        "forward. One tap per habit. Completion percentage updates instantly.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 5 / {N}",
            title="Choose Your Horizon.",
            subtitle="From a 1-month sprint to a 2-year monk-mode mastery — your call.",
            bullets=[
                "1 month — quick sprint.    3 months — quarter challenge.",
                "6 months — half-year commitment.    1 year — full transformation.",
                "2 years — monk-mode mastery (default).",
            ],
            page_label=f"5 / {N}",
        ),
        "Choose how long you commit. One month sprint, three month challenge, six month commitment, "
        "one year transformation, or two year monk-mode mastery. Your horizon, your call.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 6 / {N}",
            title="Daily Todo & Task Tracker.",
            subtitle="A clean list to attack the day — and a clean slate every midnight.",
            bullets=[
                "Add tasks in one keystroke. Check them off as you go.",
                "Auto-resets at midnight IST so tomorrow is genuinely a new start.",
                "Stays in sync across web and the Chrome extension.",
            ],
            page_label=f"6 / {N}",
        ),
        "A built-in todo list and task tracker for the day. Add fast, check off fast, "
        "resets cleanly at midnight so tomorrow is a fresh start.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 7 / {N}",
            title="Journal. Text, Voice, Photos.",
            subtitle="Capture the day in whatever medium it actually deserves.",
            bullets=[
                "Quick text entries with timestamps.",
                "Voice notes for thoughts you can't type fast enough.",
                "Photos with captions — your year as a private highlight reel.",
            ],
            page_label=f"7 / {N}",
        ),
        "Journal your day in text, voice, or photos with captions. "
        "Whatever medium your day deserves — Monk Mode catches it.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 8 / {N}",
            title="The Multi-Year Streak Grid.",
            subtitle="A consistency grid that turns discipline into a visual identity.",
            bullets=[
                "Every day is a tile, colored by completion percentage.",
                "Watch your full horizon fill in, day by day.",
                "Skip a day? Tomorrow is still part of the same streak.",
            ],
            page_label=f"8 / {N}",
        ),
        "The streak grid turns daily discipline into a visual identity. Every tile is a day. "
        "Every color is a percentage. Skip a day — the streak survives.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 9 / {N}",
            title="History + Downloadable PDF Reports.",
            subtitle="Browse the past. Find the pattern. Act on it.",
            bullets=[
                "Open any past day and see exactly what you did and didn't.",
                "Pick a date range — week, month, quarter, custom.",
                "Export as a Summary or Detailed PDF report. Read it, share it, learn from it.",
            ],
            page_label=f"9 / {N}",
        ),
        "Open the History view to browse any past day in detail. Pick a date range. "
        "Download a Summary or Detailed PDF report to analyze the patterns and act on them.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 10 / {N}",
            title="Collectibles. Rewards For Every Step.",
            subtitle="A reward layer that compounds with consistency.",
            bullets=[
                "Unlockable badges for streak milestones — day 7, day 30, day 66, day 100, day 365.",
                "Quiet, classy rewards. No confetti spam. No dark patterns.",
                "Shows up in Wrapped at year-end as your trophy case.",
            ],
            page_label=f"10 / {N}",
        ),
        "Collectibles reward you for every step you take. Unlockable badges at day seven, thirty, "
        "sixty-six, one hundred, and three hundred sixty-five. Classy rewards. No confetti spam.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 11 / {N}",
            title="Wrapped — Your Year In Discipline.",
            subtitle="A Spotify-style recap built around your habits, not your songs.",
            bullets=[
                "Best month, longest streak, most-honored habit.",
                "Shareable cards exported as PDF or image.",
                "Your collectibles surface here as a year-end trophy case.",
            ],
            page_label=f"11 / {N}",
        ),
        "At year-end, Wrapped builds a Spotify-style recap of your discipline. "
        "Best month, longest streak, most-honored habit, and shareable cards.",
    ),
    (
        Slide(
            kind="compare",
            kicker=f"FEATURE · 12 / {N}",
            title="Light Mode. Dark Mode. Smooth Switch.",
            columns=[
                ("DARK", "The default. Warm-orange accents on near-black canvas. Calm at 5 AM, calm at midnight."),
                ("LIGHT", "One tap to switch. Paper-warm background, same orange accents, same hierarchy."),
                ("TRANSITION", "Smooth animated handover — no jarring flash. Theme preference syncs with your account."),
            ],
            page_label=f"12 / {N}",
        ),
        "Light mode and dark mode, both first-class. Smooth animated switch — no jarring flash. "
        "Your theme preference travels with your account.",
    ),
    (
        Slide(
            kind="stat",
            kicker=f"YOUR DATA · 13 / {N}",
            stat="AES-256",
            stat_caption="at rest. TLS in transit. Row-level security per user. Your discipline, encrypted end-to-database.",
            attribution="Postgres + Supabase Auth + Storage. See README » Data & Security for the full schema.",
            page_label=f"13 / {N}",
        ),
        "Log in with your account and everything syncs to an encrypted database. "
        "AES two fifty six at rest. T L S in transit. Row level security so only you can read your rows. "
        "Your discipline, encrypted end to database.",
    ),
    (
        Slide(
            kind="feature",
            kicker=f"FEATURE · 14 / {N}",
            title="Chrome Extension Companion.",
            subtitle="The browser is where willpower goes to die. We turned it around.",
            bullets=[
                "Toolbar popup to toggle today's habits in one click.",
                "New-tab page shows your streak, today's progress, and a daily quote.",
                "Smart nudges in morning, midday, and evening.",
            ],
            page_label=f"14 / {N}",
        ),
        "A companion Chrome extension hijacks your new-tab page — turning the place willpower normally "
        "dies into a live dashboard of your streak.",
    ),
    (
        Slide(
            kind="stat",
            kicker=f"WHY IT WORKS · 15 / {N}",
            stat="66 days",
            stat_caption="is the average time to form a habit — not 21. We give you up to 730.",
            attribution="Source: Lally et al., UCL, European Journal of Social Psychology, 2010",
            page_label=f"15 / {N}",
        ),
        "Behavioral science says it takes an average of sixty-six days to form a habit — not twenty-one. "
        "Monk Mode gives you up to seven hundred and thirty.",
    ),
    (
        Slide(
            kind="outro",
            title="Start Day 1.",
            subtitle="Open the app, pick your non-negotiables, and begin your monk-mode streak.",
            page_label=f"{N} / {N}",
        ),
        "Open Productive You dot Lovable dot app, pick your non-negotiables, and start day one.",
    ),
]


# ---- TTS + ffmpeg compose ----------------------------------------------
# Voice is backend-specific; None lets each backend pick its sensible default
# (edge-tts: en-US-AriaNeural · macOS say: Samantha · pyttsx3: OS default).
VOICE: str | None = None
RATE = 175  # words per minute (translated per-backend in tts.py)


def synthesize_audio(idx: int, text: str) -> tuple[str, float]:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    raw = (AUDIO_DIR / f"v_{idx:02d}").with_suffix(tts.preferred_suffix())
    tts.synthesize(text, raw, voice=VOICE, rate=RATE)
    # Normalize to AAC m4a so ffmpeg concat sees identical streams
    m4a = AUDIO_DIR / f"v_{idx:02d}.m4a"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
         "-c:a", "aac", "-b:a", "128k", str(m4a)],
        check=True,
    )
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nokey=1:noprint_wrappers=1", str(m4a)],
        text=True,
    )
    return str(m4a), float(out.strip())


def build():
    print(f"> {tts.info()}")
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
        "backend": tts._resolve_backend(),  # noqa: SLF001 — internal but useful for repro
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
