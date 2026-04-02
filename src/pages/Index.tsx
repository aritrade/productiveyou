import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import NonNegotiables from "@/components/NonNegotiables";
import DailyHabits from "@/components/DailyHabits";
import JournalSection from "@/components/JournalSection";
import TodoList from "@/components/TodoList";
import DailyQuote from "@/components/DailyQuote";
import StreakTracker from "@/components/StreakTracker";
import { Zap, History, Sparkles, LogOut, Settings } from "lucide-react";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import {
  getISTDateString,
  upsertDailyEntry,
  fetchDailyEntry,
  fetchAllEntries,
  deleteAllEntries,
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

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [nonNegotiables, setNonNegotiables] = useState<Record<string, boolean>>({});
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [todayDate, setTodayDate] = useState(getISTDateString());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  const userRules = useMemo(() => profile?.custom_non_negotiables ?? [], [profile]);
  const userHabits = useMemo(() => profile?.custom_habits ?? [], [profile]);
  const totalItems = userRules.length + userHabits.length;
  const streakStartDate = profile?.streak_start_date ?? getISTDateString();
  const consistencyDurationMonths = profile?.consistency_duration_months ?? 24;

  // Load today's data from DB on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = getISTDateString();
      setTodayDate(today);

      const entry = await fetchDailyEntry(today, user.id);
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

      const allEntries = await fetchAllEntries(user.id);
      setHistory(
        allEntries
          .filter((e) => e.entry_date >= streakStartDate)
          .map((e) => ({ date: e.entry_date, percentage: e.percentage }))
      );

      isInitialLoad.current = false;
    };
    load();
  }, [user, streakStartDate]);

  // Calculate today's completion
  const todayPercentage = useMemo(() => {
    if (totalItems === 0) return 0;
    const nonNegCount = Object.values(nonNegotiables).filter(Boolean).length;
    const habitCount = Object.values(habits).filter(Boolean).length;
    return Math.round(((nonNegCount + habitCount) / totalItems) * 100);
  }, [nonNegotiables, habits, totalItems]);

  // Debounced save
  useEffect(() => {
    if (isInitialLoad.current || !user) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      upsertDailyEntry(
        {
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
        },
        user.id
      );

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
  }, [nonNegotiables, habits, journalEntries, todos, todayPercentage, todayDate, user]);

  // Midnight IST reset
  useMidnightReset(
    useCallback((newDate: string) => {
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

    let longest = 0;
    let tempStreak = 0;
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
    if (!user) return;
    await deleteAllEntries(user.id);
    setHistory([]);
    setNonNegotiables({});
    setHabits({});
    setJournalEntries([]);
    setTodos([]);
  }, [user]);

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
                {profile?.display_name || "Activated Productivity Tracker"}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate("/wrapped")}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-heading tracking-wider uppercase text-primary hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Wrapped</span>
            </button>
            <button
              onClick={() => navigate("/history")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-[10px] font-heading tracking-wider uppercase text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={() => navigate("/onboarding")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2 py-1.5 text-[10px] font-heading tracking-wider uppercase text-secondary-foreground hover:bg-secondary/80 transition-colors"
              title="Settings"
            >
              <Settings className="h-3 w-3" />
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
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-1.5 text-[10px] font-heading text-secondary-foreground hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3 w-3" />
            </button>
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
        <NonNegotiables rules={userRules} checked={nonNegotiables} onChange={toggleNonNeg} />
        <DailyHabits habits={userHabits} checked={habits} onChange={toggleHabit} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JournalSection entries={journalEntries} onSave={saveJournal} />
          <TodoList todos={todos} onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} />
        </div>
      </main>
    </div>
  );
};

export default Index;
