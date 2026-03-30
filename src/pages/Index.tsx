import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import NonNegotiables from "@/components/NonNegotiables";
import DailyHabits from "@/components/DailyHabits";
import JournalSection from "@/components/JournalSection";
import TodoList from "@/components/TodoList";
import DailyQuote from "@/components/DailyQuote";
import StreakTracker from "@/components/StreakTracker";
import { Zap, History, Sparkles } from "lucide-react";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import {
  getISTDateString,
  upsertDailyEntry,
  fetchDailyEntry,
  fetchAllEntries,
  deleteAllEntries,
  type DailyEntry,
} from "@/lib/dailyEntries";

interface JournalEntry {
  id: string;
  text: string;
  audioUrl?: string;
  photos?: { url: string; caption: string }[];
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
const TOTAL_ITEMS = NON_NEG_COUNT + HABIT_COUNT;
const STREAK_START_DATE = "2025-03-16";

const Index = () => {
  const navigate = useNavigate();
  const [nonNegotiables, setNonNegotiables] = useState<Record<string, boolean>>({});
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [todayDate, setTodayDate] = useState(getISTDateString());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  // Load today's data from DB on mount
  useEffect(() => {
    const load = async () => {
      const today = getISTDateString();
      setTodayDate(today);

      // Load today's entry
      const entry = await fetchDailyEntry(today);
      if (entry) {
        setNonNegotiables(entry.non_negotiables);
        setHabits(entry.habits);
        setJournalEntries(
          entry.journal_entries.map((j: any) => ({
            ...j,
            photos: j.photos || [],
            timestamp: new Date(j.timestamp),
          }))
        );
        setTodos(entry.todos);
      }

      // Load all history for streak
      const allEntries = await fetchAllEntries();
      setHistory(
        allEntries
          .filter((e) => e.entry_date >= STREAK_START_DATE)
          .map((e) => ({ date: e.entry_date, percentage: e.percentage }))
      );

      isInitialLoad.current = false;
    };
    load();
  }, []);

  // Calculate today's completion
  const todayPercentage = useMemo(() => {
    const nonNegCount = Object.values(nonNegotiables).filter(Boolean).length;
    const habitCount = Object.values(habits).filter(Boolean).length;
    return Math.round(((nonNegCount + habitCount) / TOTAL_ITEMS) * 100);
  }, [nonNegotiables, habits]);

  // Debounced save to Supabase
  useEffect(() => {
    if (isInitialLoad.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      upsertDailyEntry({
        entry_date: todayDate,
        non_negotiables: nonNegotiables,
        habits,
        journal_entries: journalEntries.map((j) => ({
          id: j.id,
          text: j.text,
          audioUrl: j.audioUrl,
          photos: j.photos,
          timestamp: j.timestamp.toISOString(),
        })),
        todos,
        percentage: todayPercentage,
      });

      // Update history for today
      setHistory((prev) => {
        const existing = prev.findIndex((d) => d.date === todayDate);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { date: todayDate, percentage: todayPercentage };
          return updated;
        }
        return [...prev, { date: todayDate, percentage: todayPercentage }];
      });
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [nonNegotiables, habits, journalEntries, todos, todayPercentage, todayDate]);

  // Midnight IST reset
  useMidnightReset(
    useCallback((newDate: string) => {
      // Reset state for the new day
      setNonNegotiables({});
      setHabits({});
      setJournalEntries([]);
      setTodos([]);
      setTodayDate(newDate);
    }, [])
  );

  // Streak calculations
  const { currentStreak, longestStreak, totalPoints } = useMemo(() => {
    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    const today = new Date();
    for (let i = 0; i < 730; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const record = sorted.find((r) => r.date === dateStr);
      if (record && record.percentage >= 90) {
        current++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    const allSorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    for (const entry of allSorted) {
      if (entry.percentage >= 90) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    let points = 0;
    let runningStreak = 0;
    for (const entry of allSorted) {
      if (entry.percentage >= 90) {
        runningStreak++;
        if (runningStreak % 15 === 0) points += 100;
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
  const saveJournal = useCallback((entry: { text: string; audioUrl?: string; photos?: { url: string; caption: string }[] }) =>
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

  const resetStreak = useCallback(async () => {
    await deleteAllEntries();
    setHistory([]);
    setNonNegotiables({});
    setHabits({});
    setJournalEntries([]);
    setTodos([]);
  }, []);

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
                Activated Productivity Tracker
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <button
              onClick={() => navigate("/history")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-[10px] font-heading tracking-wider uppercase text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <History className="h-3 w-3" />
              History
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
              <span className="text-[10px] font-heading text-muted-foreground tracking-wider uppercase">Today</span>
              <span className={`text-sm font-heading font-bold ${todayPercentage >= 90 ? "text-success" : "text-primary"}`}>
                {todayPercentage}%
              </span>
            </div>
            <div className="hidden sm:block">
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
          onReset={resetStreak}
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
