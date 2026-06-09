// Demo mode — a no-signup, client-side simulated account.
//
// When enabled, the app runs against a seeded in-browser dataset instead of
// Supabase, so any visitor can explore every feature with realistic data.
// Interactions persist to localStorage for the session and are wiped on exit,
// so the demo never touches real user data or a shared backend.

import type { DailyEntry } from "@/lib/dailyEntries";

export const DEMO_EMAIL = "demo@productiveyou.app";
export const DEMO_PASSWORD = "monkmode";

const FLAG_KEY = "pyou_demo_mode";
const PROFILE_KEY = "pyou_demo_profile";
const ENTRIES_KEY = "pyou_demo_entries";

export const DEMO_USER = {
  id: "demo-user-monkmode",
  email: DEMO_EMAIL,
  user_metadata: { display_name: "Demo Explorer" },
  app_metadata: { provider: "demo" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as any;

export const DEMO_SESSION = {
  user: DEMO_USER,
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
} as any;

const DEMO_NON_NEGOTIABLES = [
  { id: "no-smoking", label: "No Smoking", icon: "🚭" },
  { id: "no-drinking", label: "No Drinking", icon: "🚫" },
  { id: "no-addiction", label: "No Addiction", icon: "🧠" },
  { id: "no-social-media", label: "No Social Media Screen Time", icon: "📵" },
];

const DEMO_HABITS = [
  { id: "wake-up", label: "Wake Up on Time", emoji: "⏰" },
  { id: "bed-time", label: "Bed Time on Schedule", emoji: "🌙" },
  { id: "water", label: "Water Intake (3L+)", emoji: "💧" },
  { id: "exercise", label: "Exercise & Movement", emoji: "🏋️" },
  { id: "diet", label: "Diet & Protein Intake", emoji: "🥗" },
  { id: "deep-work", label: "Deep Work Time", emoji: "🎯" },
  { id: "journal", label: "Journal Time", emoji: "📝" },
  { id: "reading", label: "Reading Time", emoji: "📚" },
  { id: "music", label: "Music Practice", emoji: "🎵" },
  { id: "finance", label: "Financial & Business Literacy", emoji: "📈" },
  { id: "meditation", label: "Meditation / Mindfulness", emoji: "🧘" },
  { id: "cold-shower", label: "Cold Shower", emoji: "🚿" },
];

const STREAK_DAYS = 248;

const istToday = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  return ist.toISOString().split("T")[0];
};

// UTC-safe date math anchored at noon UTC so toISOString() keeps the calendar day.
const dateMinusDays = (base: string, days: number): string => {
  const d = new Date(base + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
};

const DEMO_PROFILE = {
  id: "demo-profile-monkmode",
  user_id: DEMO_USER.id,
  display_name: "Demo Explorer",
  custom_non_negotiables: DEMO_NON_NEGOTIABLES,
  custom_habits: DEMO_HABITS,
  consistency_duration_months: 24,
  streak_start_date: dateMinusDays(istToday(), STREAK_DAYS),
  onboarding_completed: true,
};

const photoSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#f59e0b'/><stop offset='1' stop-color='#7c2d12'/>
      </linearGradient></defs>
      <rect width='640' height='360' fill='url(#g)'/>
      <text x='50%' y='46%' font-family='Inter,Arial' font-size='40' font-weight='700' fill='#1a120b' text-anchor='middle'>5:12 AM · Day 248</text>
      <text x='50%' y='62%' font-family='Inter,Arial' font-size='22' fill='#2a1c0e' text-anchor='middle'>Cold shower done before sunrise.</text>
    </svg>`
  );

type EntryMap = Record<string, DailyEntry>;

const buildDemoEntries = (): EntryMap => {
  const today = istToday();
  const map: EntryMap = {};
  for (let i = 0; i <= STREAK_DAYS; i++) {
    const dateStr = dateMinusDays(today, i);
    const dip = i % 23 === 7 || i % 31 === 13;
    const pct = dip ? 60 + ((i * 7) % 20) : 90 + ((i * 13) % 11);
    map[dateStr] = {
      entry_date: dateStr,
      non_negotiables: { "no-smoking": true, "no-drinking": true, "no-addiction": true, "no-social-media": !dip },
      habits: DEMO_HABITS.reduce((acc, h, idx) => {
        acc[h.id] = dip ? idx % 2 === 0 : idx !== 8;
        return acc;
      }, {} as Record<string, boolean>),
      journal_entries: [],
      todos: [],
      percentage: pct,
    };
  }
  // Rich "today" entry so every section is populated on first load.
  map[today] = {
    entry_date: today,
    non_negotiables: { "no-smoking": true, "no-drinking": true, "no-addiction": true, "no-social-media": true },
    habits: DEMO_HABITS.reduce((acc, h) => {
      acc[h.id] = h.id !== "music";
      return acc;
    }, {} as Record<string, boolean>),
    journal_entries: [
      {
        id: "demo-j1",
        text:
          "Woke at 5 AM, cold shower, two hours of deep work before the world woke up. Day 248 of the arc — I don't recognize the person from day one anymore.",
        photos: [{ url: photoSvg, caption: "Sunrise after the cold shower — earned it." }],
        timestamp: new Date().toISOString(),
      },
      {
        id: "demo-j2",
        text: "Reflection: the streak isn't the point. Becoming someone is. Read 30 pages, journaled, stayed off the feed all day.",
        timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      },
    ],
    todos: [
      { id: "demo-t1", text: "90 min deep work block", done: true },
      { id: "demo-t2", text: "Evening run — 5k", done: false },
      { id: "demo-t3", text: "Read 30 pages", done: true },
      { id: "demo-t4", text: "Plan tomorrow's non-negotiables", done: false },
    ],
    percentage: 94,
  };
  return map;
};

export const isDemoMode = (): boolean => {
  try {
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
};

export const enableDemo = (): void => {
  localStorage.setItem(FLAG_KEY, "1");
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEMO_PROFILE));
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(buildDemoEntries()));
};

export const disableDemo = (): void => {
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ENTRIES_KEY);
};

export const isDemoCredentials = (email: string, password: string): boolean =>
  email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

export const getDemoProfile = (): any => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : DEMO_PROFILE;
  } catch {
    return DEMO_PROFILE;
  }
};

export const setDemoProfile = (patch: Record<string, any>): any => {
  const next = { ...getDemoProfile(), ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
};

const readEntries = (): EntryMap => {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? (JSON.parse(raw) as EntryMap) : buildDemoEntries();
  } catch {
    return buildDemoEntries();
  }
};

const writeEntries = (map: EntryMap): void => {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(map));
};

export const demoGetEntry = (date: string): DailyEntry | null => readEntries()[date] ?? null;

export const demoAllEntries = (): DailyEntry[] =>
  Object.values(readEntries()).sort((a, b) => b.entry_date.localeCompare(a.entry_date));

export const demoEntriesRange = (from: string, to: string): DailyEntry[] =>
  demoAllEntries().filter((e) => e.entry_date >= from && e.entry_date <= to);

export const demoUpsertEntry = (entry: Omit<DailyEntry, "id" | "created_at" | "updated_at">): void => {
  const map = readEntries();
  map[entry.entry_date] = { ...map[entry.entry_date], ...entry };
  writeEntries(map);
};

export const demoDeleteAllEntries = (): void => writeEntries({});
