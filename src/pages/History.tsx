import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, FileText, BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchAllEntries, fetchEntriesRange, type DailyEntry } from "@/lib/dailyEntries";
import { generateProgressPDF } from "@/lib/generatePDF";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const HABIT_LABELS: Record<string, string> = {
  "wake-early": "Wake by 5:30 AM",
  "bed-early": "Bed by 10:30 PM",
  water: "3L+ Water",
  workout: "Workout 45min",
  meditate: "Meditate 15min",
  read: "Read 30min",
  journal: "Journal",
  "cold-shower": "Cold Shower",
  "healthy-food": "Clean Diet",
  "deep-work": "Deep Work 3h+",
  "learn-skill": "Learn New Skill",
  gratitude: "Gratitude Practice",
};

const NON_NEG_LABELS: Record<string, string> = {
  "no-smoking": "No Smoking",
  "no-drinking": "No Drinking",
  "no-addiction": "No Addictions",
  "no-scroll": "Screen Time < 1h",
};

const History = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // PDF date range
  const [pdfFrom, setPdfFrom] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [pdfTo, setPdfTo] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState<"summary" | "detailed">("summary");

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchAllEntries(user.id);
      setEntries(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const entryMap = useMemo(() => {
    const map: Record<string, DailyEntry> = {};
    entries.forEach((e) => (map[e.entry_date] = e));
    return map;
  }, [entries]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedEntry = selectedDate
    ? entryMap[format(selectedDate, "yyyy-MM-dd")]
    : null;

  const getColorForPct = (pct: number) => {
    if (pct === 0) return "bg-muted/40";
    if (pct < 50) return "bg-destructive/30";
    if (pct < 75) return "bg-primary/25";
    if (pct < 90) return "bg-primary/50";
    return "bg-success/70";
  };

  const handleDownloadPDF = async () => {
    if (!pdfFrom || !pdfTo) return;
    const from = format(pdfFrom, "yyyy-MM-dd");
    const to = format(pdfTo, "yyyy-MM-dd");
    const rangeEntries = await fetchEntriesRange(from, to);
    generateProgressPDF(rangeEntries, from, to, reportType);
  };

  return (
    <div className="min-h-screen bg-background bg-noise">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-heading font-bold tracking-tight text-gradient-amber">
                HISTORY & INSIGHTS
              </h1>
              <p className="text-[10px] text-muted-foreground font-heading tracking-widest uppercase">
                Reflect on your journey
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-heading">Loading history...</div>
        ) : (
          <>
            {/* Calendar Navigation */}
            <div className="card-section p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber">
                    Calendar
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="btn-secondary p-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-heading font-semibold text-foreground min-w-[140px] text-center">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="btn-secondary p-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-heading text-muted-foreground tracking-wider uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const entry = entryMap[dateStr];
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center transition-all text-xs",
                        entry ? getColorForPct(entry.percentage) : "bg-muted/20",
                        isSelected && "ring-2 ring-primary",
                        isToday && "ring-1 ring-foreground/30",
                        "hover:scale-105"
                      )}
                    >
                      <span className={cn("font-heading text-xs", isToday ? "font-bold text-foreground" : "text-foreground/70")}>
                        {format(day, "d")}
                      </span>
                      {entry && (
                        <span className="text-[8px] font-heading text-foreground/50">
                          {entry.percentage}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 justify-end mt-3">
                <span className="text-[9px] text-muted-foreground">0%</span>
                <div className="flex gap-[2px]">
                  <div className="w-3 h-3 rounded-[2px] bg-muted/40" />
                  <div className="w-3 h-3 rounded-[2px] bg-destructive/30" />
                  <div className="w-3 h-3 rounded-[2px] bg-primary/25" />
                  <div className="w-3 h-3 rounded-[2px] bg-primary/50" />
                  <div className="w-3 h-3 rounded-[2px] bg-success/70" />
                </div>
                <span className="text-[9px] text-muted-foreground">100%</span>
              </div>
            </div>

            {/* Selected Day Detail */}
            {selectedEntry && selectedDate && (
              <div className="card-section p-6 space-y-4">
                <h3 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} — {selectedEntry.percentage}%
                </h3>

                {/* Non-Negotiables */}
                <div>
                  <h4 className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-2">Non-Negotiables</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(NON_NEG_LABELS).map(([id, label]) => (
                      <div key={id} className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-heading",
                        selectedEntry.non_negotiables[id]
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-destructive/20 bg-destructive/5 text-destructive/60"
                      )}>
                        {selectedEntry.non_negotiables[id] ? "✓" : "✗"} {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Habits */}
                <div>
                  <h4 className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-2">Daily Habits</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(HABIT_LABELS).map(([id, label]) => (
                      <div key={id} className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-heading",
                        selectedEntry.habits[id]
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border bg-muted/20 text-muted-foreground"
                      )}>
                        {selectedEntry.habits[id] ? "✓" : "○"} {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Journal Entries */}
                {selectedEntry.journal_entries.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-2">Journal</h4>
                    <div className="space-y-2">
                      {selectedEntry.journal_entries.map((j) => (
                        <div key={j.id} className="rounded-lg border border-border bg-muted/40 p-3">
                          <p className="text-[10px] text-muted-foreground mb-1 font-heading tracking-wider">
                            {new Date(j.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {j.text && <p className="text-sm text-foreground/85 leading-relaxed">{j.text}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Todos */}
                {selectedEntry.todos.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-2">Tasks</h4>
                    <div className="space-y-1">
                      {selectedEntry.todos.map((t) => (
                        <div key={t.id} className={cn(
                          "text-sm font-heading px-3 py-1.5 rounded",
                          t.done ? "text-success/70 line-through-done" : "text-foreground/60"
                        )}>
                          {t.done ? "☑" : "☐"} {t.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline View */}
            <div className="card-section p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-focus/15 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-focus" />
                </div>
                <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-blue">
                  Timeline
                </h2>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No entries yet. Start tracking!</p>
                ) : (
                  entries.map((entry) => (
                    <button
                      key={entry.entry_date}
                      onClick={() => setExpandedDate(expandedDate === entry.entry_date ? null : entry.entry_date)}
                      className="w-full text-left rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-all"
                    >
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", getColorForPct(entry.percentage))} />
                          <span className="text-sm font-heading text-foreground">
                            {format(new Date(entry.entry_date + "T00:00:00"), "EEE, MMM d")}
                          </span>
                        </div>
                        <span className={cn(
                          "text-sm font-heading font-bold",
                          entry.percentage >= 90 ? "text-success" : "text-primary"
                        )}>
                          {entry.percentage}%
                        </span>
                      </div>

                      {expandedDate === entry.entry_date && (
                        <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(NON_NEG_LABELS).map(([id, label]) => (
                              <span key={id} className={cn(
                                "text-[10px] font-heading px-2 py-0.5 rounded-full",
                                entry.non_negotiables[id]
                                  ? "bg-success/15 text-success"
                                  : "bg-destructive/10 text-destructive/60"
                              )}>
                                {label}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(HABIT_LABELS).map(([id, label]) => (
                              <span key={id} className={cn(
                                "text-[10px] font-heading px-2 py-0.5 rounded-full",
                                entry.habits[id]
                                  ? "bg-success/15 text-success"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {label}
                              </span>
                            ))}
                          </div>
                          {entry.journal_entries.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              📝 {entry.journal_entries.length} journal {entry.journal_entries.length === 1 ? "entry" : "entries"}
                            </p>
                          )}
                          {entry.todos.length > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              ✅ {entry.todos.filter((t) => t.done).length}/{entry.todos.length} tasks done
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* PDF Download Section */}
            <div className="card-section p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-wisdom/15 flex items-center justify-center">
                  <Download className="h-5 w-5 text-wisdom" />
                </div>
                <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-wisdom">
                  Download Report
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-1 block">
                      From
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="input-field text-left flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {pdfFrom ? format(pdfFrom, "MMM d, yyyy") : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={pdfFrom}
                          onSelect={setPdfFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-1 block">
                      To
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="input-field text-left flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {pdfTo ? format(pdfTo, "MMM d, yyyy") : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={pdfTo}
                          onSelect={setPdfTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground mb-2 block">
                    Report Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReportType("summary")}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-heading transition-all",
                        reportType === "summary"
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Summary
                    </button>
                    <button
                      onClick={() => setReportType("detailed")}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-heading transition-all",
                        reportType === "detailed"
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      Detailed
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {reportType === "summary"
                      ? "Stats, streaks, habit rates, and daily completion overview."
                      : "Everything in summary + all journal entries and tasks."}
                  </p>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  disabled={!pdfFrom || !pdfTo}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Generate & Download PDF
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default History;
