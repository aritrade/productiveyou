# Monk Mode Activated — Productivity Tracker

> Stay disciplined. Track habits, hold yourself to non-negotiables, journal daily, and build a multi-year consistency streak.

A minimalist, dark-themed productivity tracker built with React + Vite + Supabase and shipped via [Lovable](https://lovable.dev). Comes with a companion Chrome extension for at-a-glance progress on every new tab.

---

## Live links

| What | URL |
| --- | --- |
| **Production app** | https://productiveyou.lovable.app |
| **Preview build** | https://preview--productiveyou.lovable.app |
| **Lovable editor** | https://lovable.dev/projects/a21fcc10-3f98-4280-840a-6903d9629a14 |
| **GitHub repo** | https://github.com/productdecoded/productiveyou |

> Open the production link above to start using the tracker, or open the Lovable editor to keep building with AI prompts.

---

## Features

- **Daily Habits & Non-Negotiables** — Customize the rules you live by and the habits you’re building.
- **Journal** — Quick text, voice notes, and photo entries with captions.
- **Todo list** — Lightweight daily tasks that reset at midnight (IST).
- **Streak tracker** — Visualize a 2-year consistency journey day-by-day.
- **History view** — Browse every past day’s completion percentage.
- **Wrapped** — A Spotify-Wrapped-style year-end recap of your discipline.
- **Auth + cloud sync** — Email / OAuth via Supabase, data persisted per-user.
- **Dark / light theme** with smooth transitions.
- **Companion Chrome extension** — Toggle habits from the toolbar, see your streak on every new tab, and get smart morning / midday / evening nudges.

## Tech stack

- **Frontend:** Vite, React 18, TypeScript, React Router, TanStack Query
- **UI:** Tailwind CSS, shadcn/ui (Radix Primitives), lucide-react, recharts
- **Forms & validation:** react-hook-form + zod
- **Backend:** Supabase (Auth, Postgres, Storage)
- **PDF / export:** jsPDF, html2canvas
- **Tooling:** ESLint, Vitest, Testing Library
- **Built with:** [Lovable](https://lovable.dev)

---

## Project structure

```
.
├── chrome-extension/    # Companion MV3 extension (popup + new-tab dashboard)
├── public/              # Static assets
├── src/
│   ├── components/      # Habits, journal, streak, collectibles, UI primitives
│   ├── hooks/           # useAuth, useMidnightReset, etc.
│   ├── integrations/    # Supabase client
│   ├── lib/             # Daily-entry helpers, utils
│   ├── pages/           # Auth, Onboarding, Index, History, Wrapped, NotFound
│   └── main.tsx
├── supabase/            # config.toml + SQL migrations
├── index.html
└── package.json
```

---

## Local development

You need Node.js 18+ and either `bun` or `npm`. Install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if you don’t have Node.

```sh
# 1. Clone
git clone https://github.com/productdecoded/productiveyou.git
cd productiveyou

# 2. Install deps
npm install            # or: bun install

# 3. Configure env
cp .env.example .env   # then fill in the Supabase values below

# 4. Run dev server
npm run dev            # http://localhost:8080
```

### Environment variables

Create a `.env` file in the repo root with:

```env
VITE_SUPABASE_PROJECT_ID="<your-supabase-project-id>"
VITE_SUPABASE_URL="https://<your-supabase-project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-supabase-anon-key>"
```

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Editing the app

There are several supported workflows:

### 1. Edit in Lovable (recommended for AI-assisted changes)

Open the [Lovable project](https://lovable.dev/projects/a21fcc10-3f98-4280-840a-6903d9629a14) and prompt. Every change is committed back to this repo automatically.

### 2. Edit locally in your IDE

Clone the repo, edit, commit and push to `main`. Pushes are mirrored back into Lovable.

### 3. Edit directly on GitHub

Use the pencil icon on any file, commit on the same branch.

### 4. GitHub Codespaces

`Code → Codespaces → New codespace` to get an in-browser dev environment.

---

## Chrome extension

A Manifest V3 companion extension lives in [`chrome-extension/`](./chrome-extension). It mirrors today’s habits & non-negotiables into a popup, overrides the new-tab page with your streak/quote, and surfaces smart reminders.

```sh
# Load it unpacked:
# 1. Open chrome://extensions
# 2. Toggle "Developer mode" on
# 3. Click "Load unpacked"
# 4. Select the chrome-extension/ folder
```

See [`chrome-extension/README.md`](./chrome-extension/README.md) for full details (including required icons).

---

## Deployment

The app auto-deploys via Lovable. To publish a new version:

1. Open the [Lovable editor](https://lovable.dev/projects/a21fcc10-3f98-4280-840a-6903d9629a14)
2. Click **Share → Publish**
3. The latest commit goes live at https://productiveyou.lovable.app

### Custom domain

In Lovable: **Project → Settings → Domains → Connect Domain**. Docs: https://docs.lovable.dev/features/custom-domain#custom-domain

---

## License

Private project — all rights reserved unless a `LICENSE` file is added.
