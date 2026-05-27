#!/usr/bin/env bash
#
# build-apk.sh — fully non-interactive Android APK build for Monk Mode Activated.
#
# Wraps the live PWA at https://productiveyou.lovable.app inside an Android
# Trusted Web Activity package using Bubblewrap + Gradle. Output lands in
# marketing/downloads/monk-mode-activated.apk.
#
# Cross-platform: tested on macOS (arm64 + x86_64) and Linux. Windows
# requires WSL or Git Bash. Nothing OS-specific in the script itself —
# everything is driven via env vars + a vendored Node helper.
#
# Prereqs (one-time on the build machine, any OS):
#   - Node.js 18+
#   - Java JDK 17 (Temurin recommended — works on macOS, Linux, Windows)
#   - Android cmdline-tools  (run `sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"`)
#   - @bubblewrap/cli installed globally: `npm i -g @bubblewrap/cli`
#   - python3 (for the localhost manifest server; pre-installed on macOS + Linux)
#
# Required env (defaults in parens):
#   JAVA_HOME                          (must point at the JDK *root*. Per OS:
#                                         macOS:   ~/.local/jdk/jdk-17.x.y/
#                                                  (NOT the .../Contents/Home/ child —
#                                                  Bubblewrap appends Contents/Home itself
#                                                  when it detects darwin)
#                                         Linux:   ~/.local/jdk/jdk-17.x.y/
#                                         Windows: C:\jdk-17.x.y\
#                                       Bubblewrap reads this from ~/.bubblewrap/config.json
#                                       which this script writes for you below.)
#   ANDROID_HOME                       (Android SDK root, any OS)
#   BUBBLEWRAP_KEYSTORE_PASSWORD       (no default; required)
#   BUBBLEWRAP_KEY_PASSWORD            (no default; required)
#   KEYSTORE_PATH                      (default: ./.apk-build/twa/android.keystore;
#                                       set to an out-of-repo path to reuse the same
#                                       signing identity across rebuilds)
#   PACKAGE_ID                         (default: app.productiveyou.twa)
#
# Typical timings:
#   * First run: ~10 min (Gradle + dep cache download, ~700 MB)
#   * Subsequent runs: ~30 s
#
# Usage:
#   ./marketing/scripts/build-apk.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$REPO_ROOT/.apk-build}"
TWA_DIR="$BUILD_DIR/twa"
OUT_DIR="$REPO_ROOT/marketing/downloads"
PACKAGE_ID="${PACKAGE_ID:-app.productiveyou.twa}"
PWA_HOST="${PWA_HOST:-productiveyou.lovable.app}"
PWA_URL="https://$PWA_HOST"
PORT="${PORT:-8765}"

# Sanity check env
for var in JAVA_HOME ANDROID_HOME BUBBLEWRAP_KEYSTORE_PASSWORD BUBBLEWRAP_KEY_PASSWORD; do
  if [[ -z "${!var:-}" ]]; then
    echo "✗ $var is required but not set." >&2
    exit 1
  fi
done

echo "▶ Repo:        $REPO_ROOT"
echo "▶ Build dir:   $BUILD_DIR"
echo "▶ Package ID:  $PACKAGE_ID"
echo "▶ PWA URL:     $PWA_URL"
echo "▶ JAVA_HOME:   $JAVA_HOME"
echo "▶ ANDROID_HOME:$ANDROID_HOME"
echo

# Pre-populate Bubblewrap's config so it doesn't try to interactively set paths
mkdir -p "$HOME/.bubblewrap"
cat > "$HOME/.bubblewrap/config.json" <<EOF
{
  "jdkPath": "$JAVA_HOME",
  "androidSdkPath": "$ANDROID_HOME"
}
EOF

# Bubblewrap's path validator expects $ANDROID_HOME/tools or /bin to exist;
# modern cmdline-tools layouts don't have either at the root, so symlink one.
if [[ ! -e "$ANDROID_HOME/tools" && -d "$ANDROID_HOME/cmdline-tools/latest" ]]; then
  ln -sf "$ANDROID_HOME/cmdline-tools/latest" "$ANDROID_HOME/tools"
  echo "✓ added $ANDROID_HOME/tools symlink for Bubblewrap path check"
fi

# 1) Stage manifest + icons for the local web-manifest server.
echo "→ staging manifest + icons at $BUILD_DIR/"
mkdir -p "$BUILD_DIR" "$OUT_DIR"
cat > "$BUILD_DIR/manifest.webmanifest" <<EOF
{
  "name": "Monk Mode Activated",
  "short_name": "Monk Mode",
  "description": "A discipline tracker built on behavioural science. Habits, non-negotiables, journal, streak, and a multi-year horizon.",
  "id": "$PWA_URL/?source=twa",
  "start_url": "$PWA_URL/?source=twa",
  "scope": "$PWA_URL/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0e",
  "theme_color": "#fcad29",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
EOF
rm -rf "$BUILD_DIR/icons"
cp -r "$REPO_ROOT/public/icons" "$BUILD_DIR/icons"

# 2) Start a local HTTP server so Bubblewrap can fetch manifest+icons
echo "→ serving manifest at http://localhost:$PORT …"
( cd "$BUILD_DIR" && python3 -m http.server "$PORT" > "$BUILD_DIR/http.log" 2>&1 ) &
HTTP_PID=$!
trap "kill $HTTP_PID 2>/dev/null || true" EXIT
sleep 1

# 3) Scaffold the TWA project (writes twa-manifest.json + Android sources + signing key)
rm -rf "$TWA_DIR"
mkdir -p "$TWA_DIR"
WEB_MANIFEST_URL="http://localhost:$PORT/manifest.webmanifest" \
TARGET_DIR="$TWA_DIR" \
PACKAGE_ID="$PACKAGE_ID" \
node "$REPO_ROOT/marketing/scripts/scaffold-twa.mjs"

# 4) Reuse an existing keystore if KEYSTORE_PATH is set (keeps the same app
#    identity across rebuilds — Android demands the cert match for upgrades).
if [[ -n "${KEYSTORE_PATH:-}" && -f "$KEYSTORE_PATH" && "$KEYSTORE_PATH" != "$TWA_DIR/android.keystore" ]]; then
  cp "$KEYSTORE_PATH" "$TWA_DIR/android.keystore"
  echo "✓ reused signing key from $KEYSTORE_PATH"
fi

# 5) Compute the sha1 checksum of twa-manifest.json (with no trailing newline)
#    so `bubblewrap build` doesn't prompt "manifest changed?"
node -e "
const c=require('crypto'),f=require('fs');
const sum=c.createHash('sha1').update(f.readFileSync('$TWA_DIR/twa-manifest.json')).digest('hex');
f.writeFileSync('$TWA_DIR/manifest-checksum.txt', sum);
"

# 6) Build (non-interactive thanks to BUBBLEWRAP_*_PASSWORD env vars)
echo "→ bubblewrap build (Gradle will download dependencies on first run; ~5-10 min) …"
( cd "$TWA_DIR" && bubblewrap build --skipPwaValidation </dev/null )

# 7) Stage the APK into marketing/downloads/
APK_SRC="$TWA_DIR/app-release-signed.apk"
APK_OUT="$OUT_DIR/monk-mode-activated.apk"
if [[ ! -f "$APK_SRC" ]]; then
  echo "✗ APK was not produced; inspect $TWA_DIR" >&2
  exit 1
fi
cp "$APK_SRC" "$APK_OUT"
echo
echo "✓ APK ready: $APK_OUT  ($(du -h "$APK_OUT" | cut -f1))"
echo
echo "Install on Android:"
echo "  1. Copy $APK_OUT to your device (AirDrop / Drive / email / USB)"
echo "  2. On the device, enable Settings » Apps » Install unknown apps for the file-manager"
echo "  3. Tap the .apk, tap Install. Done."
