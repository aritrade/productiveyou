"""Generates the ProductiveYou pitch deck as PDF.

Produces a 16:9 deck with cover, problem, solution, product, market,
behavioral-science moat, business model, unit economics, GTM, competition,
roadmap, team, ask, and an appendix with citations.

Output:
  marketing/pitch-deck.pdf
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from slidekit import Slide, write_slides, render_slide  # noqa: E402

BUILD = Path("/tmp/pyou-build")
DECK_DIR = BUILD / "deck"
OUT_PDF = ROOT / "pitch-deck.pdf"


N = 15
SLIDES: list[Slide] = [
    Slide(
        kind="title",
        kicker="SEED ROUND · 2026",
        title="ProductiveYou",
        subtitle="The discipline operating system. Monk Mode Activated.",
        page_label=f"1 / {N}",
    ),
    Slide(
        kind="stat",
        kicker=f"PROBLEM · 2 / {N}",
        stat="$1T",
        stat_caption="lost in productivity each year to depression and anxiety. The attention economy is the cause — and we live inside it.",
        attribution="World Health Organization, 2022 (estimate)",
        page_label=f"2 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"WHY EXISTING APPS FAIL · 3 / {N}",
        title="The 21-day myth has bankrupted a generation of habit apps.",
        subtitle="They optimise for streak vanity, not lasting change.",
        bullets=[
            "Median time to form a habit is 66 days, not 21 (Lally et al., UCL, 2010).",
            "Top habit apps see 4-week retention below 10 percent.",
            "Streak resets punish missed days — the opposite of behaviour-change science.",
            "40 percent of daily behaviour is habitual (Wood & Neal, Duke, 2006). Yet no consumer app treats habits as a 2-year arc.",
        ],
        page_label=f"3 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"SOLUTION · 4 / {N}",
        title="A 2-year monk-mode OS built on behavioural science.",
        subtitle="Non-negotiables + habits + journal + Wrapped + browser surface.",
        bullets=[
            "Dual-system: rules you refuse to break, paired with habits you build.",
            "Forgiving streaks — one missed day is logged, never punished.",
            "Daily ritual: habit checklist, journal, todo, daily quote.",
            "Yearly reflection: Wrapped — your discipline as a shareable recap.",
            "Chrome extension converts every new tab into a discipline checkpoint.",
        ],
        page_label=f"4 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"PRODUCT · 5 / {N}",
        title="Shipped. Live at productiveyou.lovable.app.",
        subtitle="React + Supabase. PWA today, native mobile next quarter.",
        bullets=[
            "Auth, sync, history, journal, todo, Wrapped — all in v1.",
            "Manifest-V3 Chrome extension with toolbar popup + new-tab dashboard.",
            "PDF / image export for shareable streak cards.",
            "Built end-to-end on Lovable + Cursor — 10x build-cost reduction.",
        ],
        page_label=f"5 / {N}",
    ),
    Slide(
        kind="compare",
        kicker=f"MARKET · 6 / {N}",
        title="Two adjacent markets, one product.",
        columns=[
            ("PRODUCTIVITY", "TAM $14.5B in 2026 » $30.9B by 2034 at 9.9% CAGR. (Fortune Business Insights)"),
            ("MENTAL HEALTH", "TAM $8.6B in 2026 » $35.3B by 2034 at 19.2% CAGR. (Fortune Business Insights)"),
            ("DIGITAL HEALTH", "TAM $16.3B in 2026 » $58.4B by 2036 at 13.6% CAGR. (Meticulous Research)"),
        ],
        page_label=f"6 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"SAM & SOM · 7 / {N}",
        title="A defensible 18-month SOM of $42M.",
        subtitle="English-speaking knowledge workers actively buying self-improvement.",
        bullets=[
            "TAM (combined): $23B in 2026.",
            "SAM: 280M English-speaking knowledge workers — $4.8B at $17 ARPU.",
            "SOM (year 3): 1% of SAM = 2.8M users » $42M ARR at $15 blended ARPU.",
            "Beachhead: Gen-Z and millennial readers of Atomic Habits / Huberman audience.",
        ],
        page_label=f"7 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"BEHAVIOURAL SCIENCE MOAT · 8 / {N}",
        title="What we ship is what the research says.",
        subtitle="Three peer-reviewed primitives baked into the product surface.",
        bullets=[
            "66-day window (Lally 2010) » onboarding sets a 730-day arc, not 21 days.",
            "Forgiving streak (Lally 2010, supplementary) » missed days don't reset progress.",
            "Cue-routine-reward (Duhigg / Wood) » every habit pinned to a contextual cue.",
            "Implementation intentions (Gollwitzer 1999) » user-defined trigger phrases per habit.",
        ],
        page_label=f"8 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"BUSINESS MODEL · 9 / {N}",
        title="Freemium » Pro » Coach.",
        subtitle="Consumer SaaS with B2B expansion through coaches and HR teams.",
        bullets=[
            "Free: 5 habits, 3 non-negotiables, 7-day history.",
            "Pro $6/mo or $48/yr: unlimited habits, full history, voice journal, Wrapped, exports.",
            "Coach $24/mo per seat: cohort dashboards for coaches, therapists, corporate wellness.",
            "Chrome extension lowers CAC ~30% by acting as a top-of-funnel install loop.",
        ],
        page_label=f"9 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"UNIT ECONOMICS · 10 / {N}",
        title="Math investors actually care about.",
        subtitle="Modelled on benchmarks from Calm, Headspace, Notion, and Streaks.",
        bullets=[
            "Blended ARPU: $42 / year (8% paid conversion, mix of monthly + annual).",
            "CAC: $9 via content + referral + Chrome-store install (-30% vs paid social).",
            "Gross margin: ~88% (Supabase + Cloudflare scale linearly).",
            "Payback: < 4 months. LTV / CAC: ~11x at scale (24-month avg lifetime).",
            "Contribution margin per Pro user: $32 / year after infra + payments.",
        ],
        page_label=f"10 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"WHY NOW · 11 / {N}",
        title="Three tailwinds, one window.",
        subtitle="The attention crisis is finally monetisable.",
        bullets=[
            "Mental-health spend up 54% post-pandemic (McKinsey Consumer Health, 2024).",
            "Gen-Z spend on self-improvement apps up 4x since 2020 (Sensor Tower, 2025).",
            "AI tooling (Lovable, Cursor, Supabase) reduces build cost ~10x — solo founders can now compete with Series-B teams.",
            "Apple intelligence + Android focus-mode primitives validate the discipline category.",
        ],
        page_label=f"11 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"COMPETITION · 12 / {N}",
        title="Existing players leave a gap we own end-to-end.",
        subtitle="None combine ritual + reflection + 2-year horizon + browser surface.",
        bullets=[
            "Streaks / Habitica — gamified, single-habit, fragile streaks.",
            "Calm / Headspace — content libraries, no behaviour tracking, no commitment loop.",
            "Notion / Todoist — flexible but require setup tax users abandon in week 1.",
            "Our wedge: dual-system + journaling + Wrapped + Chrome surface in one product.",
        ],
        page_label=f"12 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"ROADMAP · 13 / {N}",
        title="From v1 to platform in 12 months.",
        subtitle="Sequenced for retention compounding, not feature sprawl.",
        bullets=[
            "Q1 — iOS + Android via Expo, push notifications, Apple Health integration.",
            "Q2 — Coach mode + cohort dashboards. First 5 B2B wellness pilots.",
            "Q3 — On-device AI nudges from consented journal sentiment.",
            "Q4 — Wrapped 2.0 with social sharing — viral year-end loop.",
        ],
        page_label=f"13 / {N}",
    ),
    Slide(
        kind="bullets",
        kicker=f"TEAM · 14 / {N}",
        title="Operator-led, customer-funded so far.",
        subtitle="Founder built v1 solo on Lovable in 6 weeks. 100% open to lead hires.",
        bullets=[
            "Founder / CEO — product lead. Previously shipped consumer SaaS to 200k users.",
            "Founding engineer — full-stack TS, Supabase, mobile. Open hire from seed.",
            "Founding designer — brand + UX systems. Open hire from seed.",
            "Advisors — behavioural-science PhD (TBD), B2B wellness GTM (TBD).",
        ],
        page_label=f"14 / {N}",
    ),
    Slide(
        kind="outro",
        title="Raise: $1.2M Seed",
        subtitle="18-month runway » 250k users · $1.4M ARR · Coach pilot live · iOS + Android live.",
        page_label=f"15 / {N}",
    ),
]


def build():
    print("> rendering deck slides…")
    write_slides(SLIDES, str(DECK_DIR))

    print("> compiling PDF…")
    # PIL can save a multi-page PDF natively
    pages = [render_slide(s).convert("RGB") for s in SLIDES]
    pages[0].save(
        OUT_PDF,
        save_all=True,
        append_images=pages[1:],
        resolution=144.0,
        title="ProductiveYou — Pitch Deck",
        author="ProductiveYou",
        subject="Seed round 2026 — discipline OS for the next billion knowledge workers",
    )

    # Also emit a single thumbnail
    thumb = ROOT / "thumbnails" / "pitch-deck.png"
    thumb.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(DECK_DIR / "slide_01.png"), "-vf", "scale=1280:-1", str(thumb)],
        check=True,
    )

    print(f"✓ {OUT_PDF}")


if __name__ == "__main__":
    build()
