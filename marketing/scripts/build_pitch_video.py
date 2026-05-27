"""Generates the investor/marketing pitch video for Monk Mode Activated.

A ~2.5-minute walkthrough designed for VCs, angels, and partner intros.
Renders slides, synthesizes narration, and composes an MP4.

Outputs:
  marketing/investor-pitch.mp4
  marketing/thumbnails/investor-pitch.png
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from slidekit import Slide, write_slides  # noqa: E402

BUILD = Path("/tmp/pyou-build")
SLIDE_DIR = BUILD / "pitch-video"
AUDIO_DIR = BUILD / "audio" / "pitch"
OUT_VIDEO = ROOT / "investor-pitch.mp4"
THUMB = ROOT / "thumbnails" / "investor-pitch.png"


N = 12
SCRIPT: list[tuple[Slide, str]] = [
    (
        Slide(
            kind="title",
            kicker=f"INVESTOR PITCH · 1 / {N}",
            title="ProductiveYou",
            subtitle="The discipline OS for the next billion knowledge workers.",
            page_label=f"1 / {N}",
        ),
        "ProductiveYou — the discipline operating system for the next billion knowledge workers.",
    ),
    (
        Slide(
            kind="stat",
            kicker=f"THE PROBLEM · 2 / {N}",
            stat="$1T",
            stat_caption="lost in productivity each year to depression and anxiety.",
            attribution="World Health Organization, 2022 (estimate)",
            page_label=f"2 / {N}",
        ),
        "The World Health Organization estimates depression and anxiety cost the global economy "
        "one trillion dollars in lost productivity each year.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"WHY HABIT APPS FAIL · 3 / {N}",
            title="The 21-day myth has bankrupted a generation.",
            subtitle="Streaks reset. Guilt accumulates. Users churn at day 14.",
            bullets=[
                "Median time to form a habit is 66 days, not 21 (Lally et al., UCL 2010).",
                "Top habit apps report 4-week retention below 10 percent.",
                "Existing tools punish missed days — the opposite of behavior change.",
            ],
            page_label=f"3 / {N}",
        ),
        "The twenty-one day myth has bankrupted a generation of habit apps. "
        "Science says sixty-six days. Most apps lose ninety percent of users in four weeks. "
        "They punish missed days — the opposite of how behavior actually changes.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"OUR SOLUTION · 4 / {N}",
            title="A 2-year monk-mode operating system.",
            subtitle="Built around what behavioral science actually says.",
            bullets=[
                "Non-negotiables + habits — the same dual-system used by elite performers.",
                "Streaks survive a missed day. Consistency, not perfection.",
                "Journal, todo, wrapped — one app for daily ritual and yearly reflection.",
                "Chrome companion converts every new tab into a discipline checkpoint.",
            ],
            page_label=f"4 / {N}",
        ),
        "Our solution is a two-year monk-mode operating system. Non-negotiables paired with daily habits. "
        "Streaks survive a missed day. Journal, todo, and wrapped recap in one product. "
        "Plus a Chrome companion that turns every new tab into a discipline checkpoint.",
    ),
    (
        Slide(
            kind="compare",
            kicker=f"MARKET SIZE · 5 / {N}",
            title="Two adjacent markets, one product.",
            columns=[
                ("PRODUCTIVITY", "$14.5B TAM in 2026, growing 9.9% CAGR to $30.9B by 2034. (Fortune Business Insights)"),
                ("MENTAL HEALTH", "$8.6B TAM in 2026, growing 19.2% CAGR to $35.3B by 2034. (Fortune Business Insights)"),
                ("DIGITAL HEALTH", "$16.3B TAM in 2026, projected to $58.4B by 2036. (Meticulous Research)"),
            ],
            page_label=f"5 / {N}",
        ),
        "We sit at the intersection of two compounding markets — productivity apps at fourteen point five billion, "
        "and mental health apps at eight point six billion, both growing double digits.",
    ),
    (
        Slide(
            kind="stat",
            kicker=f"OUR WEDGE · 6 / {N}",
            stat="730 days",
            stat_caption="is the consistency window we sell. Atomic Habits sold 20M copies. We sell the system.",
            attribution="Source: app design, Atomic Habits (Penguin, 2018)",
            page_label=f"6 / {N}",
        ),
        "We are not selling a habit. We are selling seven hundred and thirty days. "
        "James Clear sold twenty million copies telling people to build small habits. "
        "We sell the operating system that runs them.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"BUSINESS MODEL · 7 / {N}",
            title="Freemium » Pro » Coach.",
            subtitle="Predictable consumer SaaS with B2B expansion.",
            bullets=[
                "Free: 5 habits, 3 non-negotiables, 7-day history.",
                "Pro ($6/mo or $48/yr): unlimited habits, full history, voice journal, Wrapped, exports.",
                "Coach ($24/mo per seat): cohort dashboards for coaches, therapists, and corporate wellness.",
                "Chrome extension is a top-of-funnel growth loop into the web app.",
            ],
            page_label=f"7 / {N}",
        ),
        "Business model is freemium consumer SaaS. Pro at six dollars a month. "
        "Coach tier at twenty-four dollars per seat for therapists, coaches, and corporate wellness. "
        "The Chrome extension is a no-friction growth loop into the web app.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"UNIT ECONOMICS · 8 / {N}",
            title="The math investors actually care about.",
            subtitle="Modelled on benchmarks from Calm, Headspace, and Notion.",
            bullets=[
                "ARPU (blended): $42/year — Pro mix at 8% paid conversion.",
                "CAC: $9 via content + referrals (Chrome extension lowers it 30%).",
                "Gross margin: ~88% — Supabase + Cloudflare scale linearly.",
                "Payback period: under 4 months. LTV/CAC modelled at 11x at scale.",
            ],
            page_label=f"8 / {N}",
        ),
        "Blended ARPU around forty-two dollars. CAC nine dollars driven by content and the extension referral loop. "
        "Eighty-eight percent gross margins. Payback under four months. LTV to CAC of eleven at scale.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"WHY NOW · 9 / {N}",
            title="Three tailwinds, one window.",
            subtitle="The attention crisis is monetizable for the first time.",
            bullets=[
                "Post-pandemic mental health spend up 54% (McKinsey, 2024).",
                "Gen Z spending on self-improvement apps up 4x since 2020.",
                "AI-generated stacks (Lovable, Supabase, Cursor) cut build cost 10x.",
            ],
            page_label=f"9 / {N}",
        ),
        "Three tailwinds. Mental health spend is up fifty-four percent post-pandemic. "
        "Gen Z spending on self-improvement apps quadrupled since twenty-twenty. "
        "And AI tooling cut our build cost ten-x.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"COMPETITION · 10 / {N}",
            title="Where existing players leave a gap.",
            subtitle="None of them combine ritual + reflection + 2-year horizon.",
            bullets=[
                "Streaks / Habitica — gamified, single-habit, fragile streaks.",
                "Calm / Headspace — content libraries, no behavior tracking.",
                "Notion / Todoist — flexible but require setup tax.",
                "Productive You wins on dual-system + journaling + Wrapped + browser surface.",
            ],
            page_label=f"10 / {N}",
        ),
        "Streaks and Habitica are gamified and fragile. Calm and Headspace are content with no tracking. "
        "Notion and Todoist demand a setup tax. We win on dual-system, journaling, Wrapped, and browser surface area.",
    ),
    (
        Slide(
            kind="bullets",
            kicker=f"ROADMAP · 11 / {N}",
            title="From v1 to platform.",
            subtitle="Twelve-month build sequenced for retention compounding.",
            bullets=[
                "Q1 — iOS + Android wrappers (Expo), push notifications, Apple Health integration.",
                "Q2 — Coach mode, cohort streaks, B2B wellness pilots.",
                "Q3 — AI nudges trained on user journal sentiment (consented, on-device).",
                "Q4 — Wrapped 2.0 with social sharing — viral year-end loop.",
            ],
            page_label=f"11 / {N}",
        ),
        "Roadmap: native mobile in Q one. Coach mode and B two B pilots in Q two. "
        "AI nudges trained on consented journal sentiment in Q three. "
        "And a viral Wrapped two point oh in Q four.",
    ),
    (
        Slide(
            kind="outro",
            title="Raise: $1.2M Seed",
            subtitle="18-month runway » 250k users, $1.4M ARR, Coach pilot live.",
            page_label=f"{N} / {N}",
        ),
        "We are raising one point two million seed. Eighteen month runway to two hundred fifty thousand users, "
        "one point four million in A R R, and live coach-tier pilots. "
        "Visit productive you dot lovable dot app.",
    ),
]


VOICE = "Samantha"
RATE = 170


def synthesize_audio(idx: int, text: str) -> tuple[str, float]:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    aiff = AUDIO_DIR / f"v_{idx:02d}.aiff"
    m4a = AUDIO_DIR / f"v_{idx:02d}.m4a"
    subprocess.run(["say", "-v", VOICE, "-r", str(RATE), "-o", str(aiff), text], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff),
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
    print("> rendering pitch-video slides…")
    slide_paths = write_slides([s for s, _ in SCRIPT], str(SLIDE_DIR))

    print("> synthesizing narration…")
    durations: list[float] = []
    audio_paths: list[str] = []
    for i, (_, text) in enumerate(SCRIPT, start=1):
        a, d = synthesize_audio(i, text)
        durations.append(d + 0.7)
        audio_paths.append(a)
        print(f"  slide {i}: {d:.2f}s")

    print("> composing segments…")
    seg_dir = BUILD / "pitch-segments"
    seg_dir.mkdir(parents=True, exist_ok=True)
    seg_paths: list[str] = []
    for i, (slide_path, audio_path, dur) in enumerate(zip(slide_paths, audio_paths, durations), start=1):
        seg = seg_dir / f"seg_{i:02d}.mp4"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-loop", "1", "-i", slide_path,
                "-i", audio_path,
                "-af", f"apad=pad_dur=0.7,atrim=duration={dur}",
                "-c:v", "libx264", "-preset", "medium", "-tune", "stillimage",
                "-pix_fmt", "yuv420p", "-r", "30",
                "-c:a", "aac", "-b:a", "128k",
                "-t", f"{dur}",
                str(seg),
            ],
            check=True,
        )
        seg_paths.append(str(seg))

    print("> concatenating…")
    concat_list = BUILD / "pitch-concat.txt"
    concat_list.write_text("\n".join(f"file '{p}'" for p in seg_paths))
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "concat", "-safe", "0", "-i", str(concat_list),
         "-c", "copy", str(OUT_VIDEO)],
        check=True,
    )

    print("> thumbnail…")
    THUMB.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", slide_paths[0], "-vf", "scale=1280:-1", str(THUMB)],
        check=True,
    )

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
    (ROOT / "thumbnails" / "investor-pitch.manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"✓ {OUT_VIDEO}  ({sum(durations):.1f}s)")


if __name__ == "__main__":
    build()
