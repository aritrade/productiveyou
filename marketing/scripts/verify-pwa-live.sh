#!/usr/bin/env bash
# Verify the production PWA is ready for PWA Builder to consume.
# Run after clicking Publish in Lovable.
#
# Exit code 0 = PWA Builder will accept the URL.
# Exit code 1 = at least one check failed; output explains what.

set -u
URL="${PWA_URL:-https://productiveyou.lovable.app}"
UA="-H User-Agent:Mozilla/5.0"
GOOD="\033[32m✓\033[0m"
BAD="\033[31m✗\033[0m"
INFO="\033[34mi\033[0m"
fail=0

say() { printf "%b %s\n" "$1" "$2"; }
fail_check() { say "$BAD" "$1"; fail=1; }

echo "Checking PWA at: $URL"
echo

# 1. Manifest reachable
status=$(curl -sIL $UA -o /dev/null -w '%{http_code}' "$URL/manifest.webmanifest")
if [[ "$status" == "200" ]]; then
  say "$GOOD" "manifest.webmanifest reachable (HTTP $status)"
else
  fail_check "manifest.webmanifest not reachable (HTTP $status)"
fi

# 2. Manifest is valid JSON with required PWA fields
if [[ "$status" == "200" ]]; then
  body=$(curl -sL $UA "$URL/manifest.webmanifest")
  echo "$body" | python3 - <<'PY' && say "$GOOD" "manifest.webmanifest is valid JSON with required PWA fields" || { fail_check "manifest.webmanifest is missing required PWA fields"; }
import sys, json
try:
    m = json.loads(sys.stdin.read())
except Exception as e:
    print("  parse error:", e); sys.exit(1)
required = ["name", "short_name", "start_url", "display", "icons", "theme_color", "background_color"]
missing = [k for k in required if k not in m]
if missing:
    print("  missing keys:", missing); sys.exit(1)
icons = m.get("icons", [])
have_192 = any("192x192" in i.get("sizes", "") for i in icons)
have_512 = any("512x512" in i.get("sizes", "") for i in icons)
have_maskable = any("maskable" in i.get("purpose", "") for i in icons)
if not (have_192 and have_512):
    print("  PWA Builder requires both 192x192 and 512x512 icons"); sys.exit(1)
if not have_maskable:
    print("  warning: no maskable icon (PWA Builder will still accept this)")
PY
fi

# 3. Service worker reachable
status=$(curl -sIL $UA -o /dev/null -w '%{http_code}' "$URL/sw.js")
if [[ "$status" == "200" ]]; then
  say "$GOOD" "sw.js reachable (HTTP $status)"
else
  fail_check "sw.js not reachable (HTTP $status)"
fi

# 4. index.html includes the manifest link + theme-color + apple-touch
html=$(curl -sL $UA "$URL/")
for needle in 'rel="manifest"' 'theme-color' 'apple-touch-icon' 'apple-mobile-web-app-capable'; do
  if grep -q "$needle" <<<"$html"; then
    say "$GOOD" "index.html contains: $needle"
  else
    fail_check "index.html missing: $needle (Lovable probably hasn't republished)"
  fi
done

# 5. Required icons reachable
for f in icon-192.png icon-512.png icon-maskable-192.png icon-maskable-512.png apple-touch-icon.png; do
  status=$(curl -sIL $UA -o /dev/null -w '%{http_code}' "$URL/icons/$f")
  if [[ "$status" == "200" ]]; then
    say "$GOOD" "icons/$f reachable"
  else
    fail_check "icons/$f not reachable (HTTP $status)"
  fi
done

# 6. HTTPS check
if [[ "$URL" == https://* ]]; then
  say "$GOOD" "served over HTTPS (PWA Builder requires this)"
else
  fail_check "PWA Builder requires HTTPS"
fi

echo
if [[ $fail -eq 0 ]]; then
  say "$GOOD" "ALL CHECKS PASSED — paste $URL into https://www.pwabuilder.com"
else
  say "$BAD" "Some checks failed — wait ~30 s and re-run, or click Publish again in Lovable"
  exit 1
fi
