# Monk Mode Activated — Chrome Extension

A companion Chrome / Edge / Brave / Arc extension for the Monk Mode Activated
productivity tracker. Acts as an at-a-glance habit checker in your toolbar
plus a motivational new-tab dashboard.

> Manifest V3. No external network calls. All data lives in
> `chrome.storage.local` and never leaves your device.

---

## What it does

| Surface | Purpose |
|---|---|
| **Toolbar popup** (`popup.html`) | Toggle the 4 non-negotiables + 12 daily habits in one click; live completion % badge; current streak |
| **New-tab override** (`newtab.html`) | Clock + date + today's completion % + day streak + total points + a rotating Stoic / discipline quote |
| **Background service worker** (`background.js`) | 6 AM / 12 PM / 8 PM nudges, focus-nudge every 2 h during work hours, midnight reset that snapshots yesterday into history |

---

## Install (3 ways, pick one)

### Option A — One-zip download _(easiest, no git needed)_

1. Download [`monk-mode-chrome-extension.zip`](../marketing/downloads/monk-mode-chrome-extension.zip).
2. Unzip it anywhere.
3. Open `chrome://extensions/` in Chrome / Edge / Brave / Arc.
4. Toggle **Developer mode** (top-right).
5. Click **Load unpacked** » pick the unzipped folder.
6. The ⚡ icon appears in your toolbar. Pin it for quick access.

### Option B — From this repo

```bash
git clone https://github.com/productdecoded/productiveyou.git
# In Chrome:
#   chrome://extensions  »  Developer mode ON  »  Load unpacked
#   » select the productiveyou/chrome-extension/ folder
```

### Option C — Package locally yourself

```bash
cd chrome-extension
zip -r ../monk-mode-chrome-extension.zip . -x "icons/icon_master.png" "README.md"
# Then "Load unpacked" the folder, or drag-drop the .zip onto chrome://extensions
```

---

## First-use checklist

After installing:

1. **Pin the extension** to the toolbar — click the puzzle-piece icon in the
   Chrome toolbar and pin **Monk Mode Activated**.
2. **Allow notifications** — when Chrome prompts you, accept. This unlocks the
   morning / midday / evening / focus-nudge reminders.
3. **Open a new tab** — the new-tab page is replaced with the dashboard.
   If you don't want this, disable the extension and use Option C above with
   `chrome_url_overrides` removed from `manifest.json`.
4. **Open the popup once** — clicking any habit triggers a write to
   `chrome.storage.local`, which seeds your local streak history.

---

## How the extension and the web app relate

The extension and the [web app](https://productiveyou.lovable.app) are
**independent storage layers today**. The extension uses Chrome's local
storage, the web app uses Supabase (when signed in) or `localStorage`
(when not).

Why split? Because the extension is meant to be _zero-friction_ — it works
offline, requires no sign-in, and never sends a network request. If you want
your phone, your laptop's browser, and the web dashboard to all share the
same source of truth, sign in to the web app (it syncs to Supabase) and use
the **"Open Full Dashboard »"** link from the popup.

A future version may share state with the web app via a content script + a
short-lived JWT; tracking that as a known limitation rather than a bug.

---

## Notifications schedule

| Alarm | Time | Notes |
|---|---|---|
| `morning-reminder` | 06:00 daily | Wake-and-grind nudge |
| `midday-reminder`  | 12:00 daily | Halfway check-in |
| `evening-reminder` | 20:00 daily | End-of-day review |
| `focus-nudge` | every 2 h, 06:00–22:00 only | Suppressed outside work hours |
| `daily-reset` | 00:01 daily | Snapshots yesterday's % into history, clears today's checkboxes |

Each notification surfaces today's completion % so you know exactly where you
stand without opening the popup.

---

## Permissions used (and why)

| Permission | Why |
|---|---|
| `storage` | Persist checkboxes + history in `chrome.storage.local` |
| `alarms`  | Daily reset + scheduled reminders |
| `notifications` | Surface the reminders as system notifications |

No host permissions are requested. The extension does **not** read or modify
any web page you visit.

---

## Files

```
chrome-extension/
├── manifest.json        # MV3 manifest (icons, permissions, popup, newtab override, background worker)
├── popup.html / .js     # Toolbar popup UI
├── newtab.html          # New-tab dashboard (self-contained — inline CSS + JS)
├── background.js        # Alarms + notifications + midnight reset
├── styles.css           # Popup styling (dark theme, matches the web app)
└── icons/
    ├── icon16.png  / icon32.png  / icon48.png  / icon128.png  (real PNGs at exact sizes)
    └── icon_master.png  (1024×1024 source — not loaded by Chrome, kept for regeneration)
```

To regenerate icons at the correct sizes from the master:

```bash
cd chrome-extension/icons
python3 -c "
from PIL import Image
src = Image.open('icon_master.png').convert('RGBA')
for s in (16, 32, 48, 128):
    src.resize((s, s), Image.LANCZOS).save(f'icon{s}.png', 'PNG', optimize=True)
"
```

---

## Troubleshooting

- **"Manifest file is missing or unreadable"** — make sure you selected the
  `chrome-extension/` folder, not a parent or child folder.
- **Icon shows up blank in the toolbar** — verify icons are real PNGs at the
  exact sizes listed above (the icons in this repo already are).
- **No notifications** — open `chrome://settings/content/notifications`,
  confirm the extension is allowed. macOS users: also check
  System Settings » Notifications » Google Chrome.
- **New tab still shows Google** — another extension is overriding the new
  tab page; disable it or pick your priority in
  `chrome://extensions/?id=<id>`.
