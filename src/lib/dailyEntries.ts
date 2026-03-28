import { supabase } from "@/integrations/supabase/client";

export interface DailyEntry {
  id?: string;
  entry_date: string;
  non_negotiables: Record<string, boolean>;
  habits: Record<string, boolean>;
  journal_entries: Array<{ id: string; text: string; audioUrl?: string; timestamp: string }>;
  todos: Array<{ id: string; text: string; done: boolean }>;
  percentage: number;
  created_at?: string;
  updated_at?: string;
}

/** Get IST date string (YYYY-MM-DD) for the current moment */
export const getISTDateString = (): string => {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  return istTime.toISOString().split("T")[0];
};

/** Milliseconds until next midnight IST */
export const msUntilMidnightIST = (): number => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  const nextMidnight = new Date(istNow);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  return nextMidnight.getTime() - istNow.getTime();
};

/** Upsert today's entry */
export const upsertDailyEntry = async (entry: Omit<DailyEntry, "id" | "created_at" | "updated_at">): Promise<void> => {
  const { error } = await supabase
    .from("daily_entries")
    .upsert(
      {
        entry_date: entry.entry_date,
        non_negotiables: entry.non_negotiables as any,
        habits: entry.habits as any,
        journal_entries: entry.journal_entries as any,
        todos: entry.todos as any,
        percentage: entry.percentage,
      },
      { onConflict: "entry_date" }
    );
  if (error) console.error("Failed to upsert daily entry:", error);
};

/** Fetch a single day's entry */
export const fetchDailyEntry = async (date: string): Promise<DailyEntry | null> => {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("entry_date", date)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch daily entry:", error);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id,
    entry_date: data.entry_date,
    non_negotiables: (data.non_negotiables ?? {}) as Record<string, boolean>,
    habits: (data.habits ?? {}) as Record<string, boolean>,
    journal_entries: (data.journal_entries ?? []) as DailyEntry["journal_entries"],
    todos: (data.todos ?? []) as DailyEntry["todos"],
    percentage: data.percentage ?? 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/** Fetch entries for a date range */
export const fetchEntriesRange = async (from: string, to: string): Promise<DailyEntry[]> => {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false });
  if (error) {
    console.error("Failed to fetch entries range:", error);
    return [];
  }
  return (data ?? []).map((d) => ({
    id: d.id,
    entry_date: d.entry_date,
    non_negotiables: (d.non_negotiables ?? {}) as Record<string, boolean>,
    habits: (d.habits ?? {}) as Record<string, boolean>,
    journal_entries: (d.journal_entries ?? []) as DailyEntry["journal_entries"],
    todos: (d.todos ?? []) as DailyEntry["todos"],
    percentage: d.percentage ?? 0,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
};

/** Fetch all entries */
export const fetchAllEntries = async (): Promise<DailyEntry[]> => {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) {
    console.error("Failed to fetch all entries:", error);
    return [];
  }
  return (data ?? []).map((d) => ({
    id: d.id,
    entry_date: d.entry_date,
    non_negotiables: (d.non_negotiables ?? {}) as Record<string, boolean>,
    habits: (d.habits ?? {}) as Record<string, boolean>,
    journal_entries: (d.journal_entries ?? []) as DailyEntry["journal_entries"],
    todos: (d.todos ?? []) as DailyEntry["todos"],
    percentage: d.percentage ?? 0,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
};

/** Delete all entries (for reset) */
export const deleteAllEntries = async (): Promise<void> => {
  const { error } = await supabase
    .from("daily_entries")
    .delete()
    .gte("entry_date", "2000-01-01");
  if (error) console.error("Failed to delete all entries:", error);
};
