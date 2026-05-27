#!/usr/bin/env bash
#
# build-apk.sh — generate a Trusted-Web-Activity .apk for Monk Mode Activated
#
# Wraps the live PWA at https://productiveyou.lovable.app inside a thin Android
# package using Google's Bubblewrap CLI. Output lands in marketing/downloads/.
#
# Prereqs (one-time on the build machine):
#   - macOS or Linux
#   - Node.js 18+
#   - Java JDK 17  (macOS: `brew install openjdk@17`)
#   - Android cmdline-tools (Bubblewrap can auto-install on first run)
#
# Typical first-run time: ~10 min (downloads JDK + Android SDK).
# Subsequent runs: ~30 s.
#
# Usage:
#   ./marketing/scripts/build-apk.sh                    # release-debug APK
#   ./marketing/scripts/build-apk.sh --release          # signed release APK (prompts for keystore)
#
# The output APK is sideloadable on any Android device with "Install unknown
# apps" enabled — no Play Store required.

set -euo pipefail

PWA_URL="${PWA_URL:-https://productiveyou.lovable.app}"
PWA_MANIFEST="${PWA_MANIFEST:-$PWA_URL/manifest.webmanifest}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$REPO_ROOT/.apk-build}"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/marketing/downloads}"
PACKAGE_ID="${PACKAGE_ID:-app.productiveyou.twa}"

mode="debug"
if [[ "${1:-}" == "--release" ]]; then
  mode="release"
fi

echo "▶ Build mode:   $mode"
echo "▶ PWA URL:      $PWA_URL"
echo "▶ Manifest:     $PWA_MANIFEST"
echo "▶ Build dir:    $BUILD_DIR"
echo "▶ Output dir:   $OUT_DIR"
echo "▶ Package id:   $PACKAGE_ID"
echo

mkdir -p "$BUILD_DIR" "$OUT_DIR"

# 1) Ensure Bubblewrap is installed globally
if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "→ Installing @bubblewrap/cli globally …"
  npm install -g @bubblewrap/cli
fi

# 2) Initialise the TWA project the first time
if [[ ! -f "$BUILD_DIR/twa-manifest.json" ]]; then
  echo "→ bubblewrap init (this downloads JDK + Android SDK on first run; ~10 min) …"
  ( cd "$BUILD_DIR" && bubblewrap init --manifest="$PWA_MANIFEST" )
else
  echo "→ Existing TWA project found, skipping init."
fi

# 3) Build
echo "→ bubblewrap build ($mode) …"
( cd "$BUILD_DIR" && bubblewrap build )

# 4) Copy the resulting APK to marketing/downloads/
APK_SRC="$(find "$BUILD_DIR" -name '*.apk' -type f | head -1)"
if [[ -z "$APK_SRC" ]]; then
  echo "✗ Build produced no APK; inspect $BUILD_DIR" >&2
  exit 1
fi
APK_OUT="$OUT_DIR/monk-mode-activated-${mode}.apk"
cp "$APK_SRC" "$APK_OUT"
echo
echo "✓ APK ready: $APK_OUT  ($(du -h "$APK_OUT" | cut -f1))"
echo "  Sideload on any Android device:"
echo "  1. Enable Settings » Apps » Special access » Install unknown apps for your file-manager / Chrome"
echo "  2. Open the .apk on the device, tap Install."
