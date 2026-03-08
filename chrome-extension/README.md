# Monk Mode Activated — Chrome Extension

A companion Chrome extension for the Monk Mode Activated productivity tracker.

## Features

- **Quick Popup** — Toggle habits and non-negotiables directly from your toolbar
- **New Tab Dashboard** — See your streak, today's progress, and a motivational quote every time you open a new tab
- **Smart Notifications** — Morning, midday, and evening reminders + focus nudges every 2 hours
- **Auto Daily Reset** — Checkboxes reset at midnight for a fresh start

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder from this project
5. The ⚡ Monk Mode icon will appear in your toolbar!

## Icons

Before loading, add icon files to the `icons/` folder:
- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

You can generate these from any ⚡ emoji or use the app's logo.

## Notes

- Data is stored in `chrome.storage.local` (separate from the web app's localStorage)
- The "Open Full Dashboard" button links to your published app
