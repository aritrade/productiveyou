import { useState, useCallback, useMemo, useEffect } from "react";
import { format } from "date-fns";
import NonNegotiables from "@/components/NonNegotiables";
import DailyHabits from "@/components/DailyHabits";
import JournalSection from "@/components/JournalSection";
import TodoList from "@/components/TodoList";
import DailyQuote from "@/components/DailyQuote";
import StreakTracker from "@/components/StreakTracker";
import { Zap } from "lucide-react";

interface JournalEntry {
  id: string;
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface DayRecord {
  date: string;
  percentage: number;
}

const NON_NEG_COUNT = 4;
const HABIT_COUNT = 12;
const TOTAL_ITEMS = NON_NEG_COUNT + HABIT_COUNT; // 16 trackable items

const todayStr = () => new Date().toISOString().split("T")[0];

const loadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const Index = () => {
  const [nonNegotiables, setNonNegotiables] = useState<Record<string, boolean>>(
    () => loadJSON("lockdown-nonneg", {})
  );
  const [habits, setHabits] = useState<Record<string, boolean>>(
    () => loadJSON("lockdown-habits", {})
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = loadJSON<Array<JournalEntry & { timestamp: string }>>("lockdown-journal", []);
    return saved.map((e) => ({ ...e, timestamp: new Date(e.timestamp) }));
  });
  const [todos, setTodos] = useState<Todo[]>(() => loadJSON("lockdown-todos", []));
  const [history, setHistory] = useState<DayRecord[]>(
    () => loadJSON("lockdown-history", [])
  );

  // Persist state
  useEffect(() => { localStorage.setItem("lockdown-nonneg", JSON.stringify(nonNegotiables)); }, [nonNegotiables]);
  useEffect(() => { localStorage.setItem("lockdown-habits", JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem("lockdown-journal", JSON.stringify(journalEntries)); }, [journalEntries]);
  useEffect(() => { localStorage.setItem("lockdown-todos", JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem("lockdown-history", JSON.stringify(history)); }, [history]);

  // Calculate today's completion and sync to history
  const todayPercentage = useMemo(() => {
    const nonNegCount = Object.values(nonNegotiables).filter(Boolean).length;
    const habitCount = Object.values(habits).filter(Boolean).length;
    return Math.round(((nonNegCount + habitCount) / TOTAL_ITEMS) * 100);
  }, [nonNegotiables, habits]);

  useEffect(() => {
    const today = todayStr();
    setHistory((prev) => {
      const existing = prev.findIndex((d) => d.date === today);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: today, percentage: todayPercentage };
        return updated;
      }
      return [...prev, { date: today, percentage: todayPercentage }];
    });
  }, [todayPercentage]);

  // Streak calculations
  const { currentStreak, longestStreak, totalPoints } = useMemo(() => {
    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Current streak: count consecutive days ≥90% from today backwards
    const today = new Date();
    for (let i = 0; i < 730; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const record = sorted.find((r) => r.date === dateStr);
      if (record && record.percentage >= 90) {
        current++;
      } else if (i === 0) {
        // today hasn't hit 90% yet, that's ok, don't break
        continue;
      } else {
        break;
      }
    }

    // Longest streak
    const allSorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < allSorted.length; i++) {
      if (allSorted[i].percentage >= 90) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Points: 100 per every 15 consecutive days in longest continuous streaks
    // We sum all complete 15-day blocks from all streaks
    let points = 0;
    let runningStreak = 0;
    for (let i = 0; i < allSorted.length; i++) {
      if (allSorted[i].percentage >= 90) {
        runningStreak++;
        if (runningStreak > 0 && runningStreak % 15 === 0) {
          points += 100;
        }
      } else {
        runningStreak = 0;
      }
    }

    return { currentStreak: current, longestStreak: longest, totalPoints: points };
  }, [history]);

  const toggleNonNeg = useCallback((id: string) =>
    setNonNegotiables((prev) => ({ ...prev, [id]: !prev[id] })), []);
  const toggleHabit = useCallback((id: string) =>
    setHabits((prev) => ({ ...prev, [id]: !prev[id] })), []);
  const saveJournal = useCallback((entry: { text: string; audioUrl?: string }) =>
    setJournalEntries((prev) => [
      { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
      ...prev,
    ]), []);
  const addTodo = useCallback((text: string) =>
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]), []);
  const toggleTodo = useCallback((id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))), []);
  const deleteTodo = useCallback((id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id)), []);

  return (
    <div className="min-h-screen bg-background bg-noise">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: "linear-gradient(135deg, hsl(38 95% 52%), hsl(32 80% 42%))"
            }}>
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold tracking-tight text-gradient-amber">
                MONK MODE
              </h1>
              <p className="text-[10px] text-muted-foreground font-heading tracking-widest uppercase">
                Activated
                Productivity Tracker
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
              <span className="text-[10px] font-heading text-muted-foreground tracking-wider uppercase">Today</span>
              <span className={`text-sm font-heading font-bold ${todayPercentage >= 90 ? "text-success" : "text-primary"}`}>
                {todayPercentage}%
              </span>
            </div>
            <div>
              <p className="text-sm font-heading font-semibold text-foreground">
                {format(new Date(), "EEEE")}
              </p>
              <p className="text-[11px] text-muted-foreground font-heading">
                {format(new Date(), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <DailyQuote />
        <StreakTracker
          history={history}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          totalPoints={totalPoints}
        />
        <NonNegotiables checked={nonNegotiables} onChange={toggleNonNeg} />
        <DailyHabits checked={habits} onChange={toggleHabit} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JournalSection entries={journalEntries} onSave={saveJournal} />
          <TodoList todos={todos} onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} />
        </div>
      </main>
    </div>
  );
};

export default Index;
