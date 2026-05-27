"""Cross-platform text-to-speech for the marketing build scripts.

Tries providers in this order — first one available wins:

  1. `edge-tts` (preferred)   neural quality, free, no API key, cross-platform.
  2. `pyttsx3`                offline, uses native OS TTS (NSSpeech on macOS,
                              SAPI5 on Windows, espeak-ng on Linux).
  3. macOS `say` binary       last-resort fallback so Mac users without any
                              Python TTS deps still get a working pipeline.

Public API:
    synthesize(text, out_path, *, voice=None, rate=None) -> Path
        Produces an MP3 (preferred) or WAV at `out_path` (extension respected).

Voice IDs vary per backend. Reasonable defaults are chosen automatically.

Set `PRODUCTIVEYOU_TTS_BACKEND` to force a specific backend:
    edge | pyttsx3 | mac_say
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional


# ---- Capability detection --------------------------------------------------
def _has_edge() -> bool:
    try:
        import edge_tts  # noqa: F401
        return True
    except ImportError:
        return False


def _has_pyttsx3() -> bool:
    try:
        import pyttsx3  # noqa: F401
        return True
    except ImportError:
        return False


def _has_mac_say() -> bool:
    return sys.platform == "darwin" and shutil.which("say") is not None


def _resolve_backend() -> str:
    forced = os.environ.get("PRODUCTIVEYOU_TTS_BACKEND", "").strip().lower()
    if forced:
        return forced
    if _has_edge():
        return "edge"
    if _has_pyttsx3():
        return "pyttsx3"
    if _has_mac_say():
        return "mac_say"
    raise RuntimeError(
        "No TTS backend available. Install one of:\n"
        "  pip install edge-tts        # recommended (neural, free, no API key)\n"
        "  pip install pyttsx3         # offline native OS TTS\n"
        "Or run on macOS where the built-in `say` command is available."
    )


# ---- Default voices per backend --------------------------------------------
EDGE_DEFAULT_VOICE = "en-US-AriaNeural"      # warm, modern, neutral US English
PYTTSX3_DEFAULT_VOICE: Optional[str] = None  # use OS default
MAC_SAY_DEFAULT_VOICE = "Samantha"


# ---- Synthesis backends ----------------------------------------------------
def _synth_edge(text: str, out_path: Path, voice: Optional[str], rate: Optional[int]) -> None:
    import asyncio
    import edge_tts

    if out_path.suffix.lower() != ".mp3":
        # edge-tts only emits mp3; downstream ffmpeg can transcode if needed.
        raise ValueError("edge-tts produces MP3; pass an .mp3 out_path")

    voice = voice or EDGE_DEFAULT_VOICE
    # Convert WPM-ish hint to edge-tts +/-X% rate. Default 175 WPM ≈ 0%.
    rate_param = "+0%"
    if rate is not None:
        delta = round((rate - 175) / 175 * 100)
        rate_param = f"{'+' if delta >= 0 else ''}{delta}%"

    async def _run() -> None:
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_param)
        await communicate.save(str(out_path))

    asyncio.run(_run())


def _synth_pyttsx3(text: str, out_path: Path, voice: Optional[str], rate: Optional[int]) -> None:
    import pyttsx3

    if out_path.suffix.lower() != ".wav":
        raise ValueError("pyttsx3 writes WAV; pass a .wav out_path")

    engine = pyttsx3.init()
    if voice:
        engine.setProperty("voice", voice)
    if rate is not None:
        engine.setProperty("rate", rate)
    engine.save_to_file(text, str(out_path))
    engine.runAndWait()


def _synth_mac_say(text: str, out_path: Path, voice: Optional[str], rate: Optional[int]) -> None:
    if out_path.suffix.lower() not in {".aiff", ".aif", ".m4a", ".caf", ".wav"}:
        raise ValueError("macOS `say` writes aiff/m4a/caf/wav; pass one of those")
    cmd = ["say", "-v", voice or MAC_SAY_DEFAULT_VOICE]
    if rate is not None:
        cmd += ["-r", str(rate)]
    cmd += ["-o", str(out_path), text]
    subprocess.run(cmd, check=True)


# ---- Public entry ----------------------------------------------------------
_BACKEND_SUFFIX = {"edge": ".mp3", "pyttsx3": ".wav", "mac_say": ".aiff"}


def preferred_suffix() -> str:
    """Return the audio file extension the currently-active backend produces."""
    return _BACKEND_SUFFIX[_resolve_backend()]


def synthesize(
    text: str,
    out_path: str | os.PathLike,
    *,
    voice: Optional[str] = None,
    rate: Optional[int] = None,
) -> Path:
    """Synthesize ``text`` into ``out_path``. Returns the resolved Path.

    The out_path's extension determines (and is validated against) the active
    backend. To always write the right extension regardless of backend, use:

        out = base.with_suffix(tts.preferred_suffix())
        tts.synthesize(text, out, ...)
    """
    backend = _resolve_backend()
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    if backend == "edge":
        _synth_edge(text, out, voice, rate)
    elif backend == "pyttsx3":
        _synth_pyttsx3(text, out, voice, rate)
    elif backend == "mac_say":
        _synth_mac_say(text, out, voice, rate)
    else:
        raise RuntimeError(f"Unknown backend: {backend}")
    return out


def info() -> str:
    return f"tts backend: {_resolve_backend()}"


if __name__ == "__main__":
    print(info())
    base = Path("/tmp/tts_test")
    out = base.with_suffix(preferred_suffix())
    synthesize("Cross platform text to speech test for ProductiveYou.", out)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
