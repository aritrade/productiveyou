import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, Sparkles, Flame, Trophy, BookOpen, CheckSquare, Camera } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { fetchEntriesRange, getISTDateString, type DailyEntry } from "@/lib/dailyEntries";
import html2canvas from "html2canvas";

type Period = "day" | "week" | "month";

const HABIT_LABELS: Record<string, string> = {
  "wake-up": "Wake Up on Time",
  "bed-time": "Bed Time on Schedule",
  water: "Water Intake (3L+)",
  exercise: "Exercise & Movement",
  diet: "Diet & Protein Intake",
  "deep-work": "Deep Work Time",
  journal: "Journal Time",
  reading: "Reading Time",
  music: "Music Practice",
  finance: "Financial & Business Literacy",
  meditation: "Meditation / Mindfulness",
  "cold-shower": "Cold Shower",
};

const NON_NEG_LABELS: Record<string, string> = {
  "no-smoking": "No Smoking",
  "no-drinking": "No Drinking",
  "no-addiction": "No Addiction",
  "no-social-media": "No Social Media",
};

const HABIT_EMOJIS: Record<string, string> = {
  "wake-up": "⏰", "bed-time": "🌙", water: "💧", exercise: "🏋️",
  diet: "🥗", "deep-work": "🎯", journal: "📝", reading: "📚",
  music: "🎵", finance: "📈", meditation: "🧘", "cold-shower": "🚿",
};

const Wrapped = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const wrappedRef = useRef<HTMLDivElement>(null);

  const dateRange = useMemo(() => {
    const today = getISTDateString();
    const todayDate = new Date(today + "T00:00:00");
    if (period === "day") return { from: today, to: today, label: format(todayDate, "MMM d, yyyy") };
    if (period === "week") {
      const start = startOfWeek(todayDate, { weekStartsOn: 1 });
      const end = endOfWeek(todayDate, { weekStartsOn: 1 });
      return { from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd"), label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}` };
    }
    const start = startOfMonth(todayDate);
    const end = endOfMonth(todayDate);
    return { from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd"), label: format(todayDate, "MMMM yyyy") };
  }, [period]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchEntriesRange(dateRange.from, dateRange.to, user.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [dateRange, user]);

  // Stats
  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const avgPercentage = Math.round(entries.reduce((s, e) => s + e.percentage, 0) / entries.length);
    const perfectDays = entries.filter((e) => e.percentage >= 90).length;
    const totalJournals = entries.reduce((s, e) => s + (e.journal_entries?.length || 0), 0);
    const totalTodos = entries.reduce((s, e) => s + (e.todos?.length || 0), 0);
    const completedTodos = entries.reduce((s, e) => s + (e.todos?.filter((t: any) => t.done)?.length || 0), 0);

    // Best & worst habits
    const habitCounts: Record<string, number> = {};
    const habitTotals: Record<string, number> = {};
    entries.forEach((e) => {
      Object.entries(e.habits).forEach(([k, v]) => {
        habitTotals[k] = (habitTotals[k] || 0) + 1;
        if (v) habitCounts[k] = (habitCounts[k] || 0) + 1;
      });
    });

    const habitRates = Object.entries(habitTotals).map(([k, total]) => ({
      id: k,
      rate: ((habitCounts[k] || 0) / total) * 100,
      label: HABIT_LABELS[k] || k,
      emoji: HABIT_EMOJIS[k] || "✅",
    })).sort((a, b) => b.rate - a.rate);

    const bestHabit = habitRates[0];
    const worstHabit = habitRates[habitRates.length - 1];

    // Non-negotiable adherence
    let nnKept = 0, nnTotal = 0;
    entries.forEach((e) => {
      Object.values(e.non_negotiables).forEach((v) => {
        nnTotal++;
        if (v) nnKept++;
      });
    });
    const nnRate = nnTotal > 0 ? Math.round((nnKept / nnTotal) * 100) : 0;

    // All photos from journal entries
    const allPhotos: { url: string; caption: string; date: string }[] = [];
    entries.forEach((e) => {
      (e.journal_entries || []).forEach((j: any) => {
        (j.photos || []).forEach((p: any) => {
          allPhotos.push({ url: p.url, caption: p.caption, date: e.entry_date });
        });
      });
    });

    return { avgPercentage, perfectDays, totalJournals, totalTodos, completedTodos, habitRates, bestHabit, worstHabit, nnRate, allPhotos, daysTracked: entries.length };
  }, [entries]);

  const slides = useMemo(() => {
    if (!stats) return [];
    const s: { id: string; gradient: string }[] = [
      { id: "overview", gradient: "from-primary/20 via-background to-accent/10" },
      { id: "habits", gradient: "from-success/15 via-background to-focus/10" },
      { id: "discipline", gradient: "from-destructive/10 via-background to-primary/15" },
      { id: "journal", gradient: "from-focus/15 via-background to-wisdom/10" },
    ];
    if (stats.allPhotos.length > 0) s.push({ id: "memories", gradient: "from-wisdom/15 via-background to-primary/10" });
    s.push({ id: "summary", gradient: "from-primary/20 via-accent/10 to-success/10" });
    return s;
  }, [stats]);

  const handleShare = async () => {
    if (!wrappedRef.current) return;
    try {
      const canvas = await html2canvas(wrappedRef.current, {
        backgroundColor: "#0a0a0f",
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], "wrapped.png")] })) {
          await navigator.share({
            title: "My Monk Mode Wrapped",
            files: [new File([blob], "monk-mode-wrapped.png", { type: "image/png" })],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "monk-mode-wrapped.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const nextSlide = () => setCurrentSlide((p) => Math.min(p + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((p) => Math.max(p - 1, 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-heading text-sm tracking-widest uppercase">Loading your wrapped...</div>
      </div>
    );
  }

  if (!stats || entries.length === 0) {
    return (
      <div className="min-h-screen bg-background bg-noise flex flex-col items-center justify-center gap-4 p-4">
        <Sparkles className="h-12 w-12 text-primary/40" />
        <p className="text-muted-foreground font-heading text-sm tracking-wider text-center">No data for this period yet. Start tracking to generate your Wrapped!</p>
        <button onClick={() => navigate("/")} className="btn-primary text-xs">Go to Dashboard</button>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-heading tracking-wider uppercase">Back</span>
          </button>
          <h1 className="text-sm font-heading font-bold tracking-widest uppercase text-gradient-amber">
            Monk Mode Wrapped
          </h1>
          <div className="flex gap-2">
            <button onClick={handleShare} className="btn-secondary flex items-center gap-1.5 text-[10px] px-2.5 py-1.5">
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Period selector */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1 border border-border">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setCurrentSlide(0); }}
              className={`flex-1 rounded-md py-2 text-[11px] font-heading tracking-wider uppercase transition-all ${
                period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "day" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground font-heading tracking-wider text-center mt-2">{dateRange.label}</p>
      </div>

      {/* Wrapped card */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div
          ref={wrappedRef}
          className={`relative rounded-2xl border border-border overflow-hidden bg-gradient-to-br ${slide.gradient} min-h-[480px] flex flex-col`}
          style={{ background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--background)))` }}
        >
          {/* Slide content */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            {slide.id === "overview" && (
              <div className="space-y-6 text-center">
                <Sparkles className="h-10 w-10 text-primary mx-auto" />
                <div>
                  <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground mb-2">Your {period === "day" ? "day" : period === "week" ? "week" : "month"} in review</p>
                  <p className="text-6xl font-heading font-bold text-gradient-amber">{stats.avgPercentage}%</p>
                  <p className="text-xs text-muted-foreground mt-2 font-heading tracking-wider">average completion</p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                    <p className="text-2xl font-heading font-bold text-foreground">{stats.daysTracked}</p>
                    <p className="text-[9px] text-muted-foreground font-heading tracking-wider uppercase">days tracked</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                    <p className="text-2xl font-heading font-bold text-success">{stats.perfectDays}</p>
                    <p className="text-[9px] text-muted-foreground font-heading tracking-wider uppercase">perfect days</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                    <p className="text-2xl font-heading font-bold text-focus">{stats.totalJournals}</p>
                    <p className="text-[9px] text-muted-foreground font-heading tracking-wider uppercase">journal entries</p>
                  </div>
                </div>
              </div>
            )}

            {slide.id === "habits" && (
              <div className="space-y-5">
                <div className="text-center">
                  <CheckSquare className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">Habit breakdown</p>
                </div>
                {stats.bestHabit && (
                  <div className="rounded-xl bg-success/8 border border-success/20 p-4">
                    <p className="text-[9px] font-heading tracking-widest uppercase text-success/70 mb-1">🏆 Strongest Habit</p>
                    <p className="text-sm font-heading font-semibold text-foreground">{stats.bestHabit.emoji} {stats.bestHabit.label}</p>
                    <p className="text-2xl font-heading font-bold text-success mt-1">{Math.round(stats.bestHabit.rate)}%</p>
                  </div>
                )}
                {stats.worstHabit && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-4">
                    <p className="text-[9px] font-heading tracking-widest uppercase text-destructive/70 mb-1">⚠️ Needs Attention</p>
                    <p className="text-sm font-heading font-semibold text-foreground">{stats.worstHabit.emoji} {stats.worstHabit.label}</p>
                    <p className="text-2xl font-heading font-bold text-destructive mt-1">{Math.round(stats.worstHabit.rate)}%</p>
                  </div>
                )}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {stats.habitRates.slice(0, 6).map((h) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <span className="text-sm">{h.emoji}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${h.rate}%` }} />
                      </div>
                      <span className="text-[10px] font-heading text-muted-foreground w-8 text-right">{Math.round(h.rate)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.id === "discipline" && (
              <div className="space-y-6 text-center">
                <Flame className="h-10 w-10 text-primary mx-auto" />
                <div>
                  <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground mb-2">Non-negotiable adherence</p>
                  <p className="text-6xl font-heading font-bold" style={{
                    background: `linear-gradient(135deg, ${stats.nnRate >= 90 ? "hsl(152 60% 42%), hsl(142 55% 50%)" : stats.nnRate >= 50 ? "hsl(38 95% 52%), hsl(28 85% 58%)" : "hsl(0 78% 55%), hsl(10 70% 50%)"})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>{stats.nnRate}%</p>
                  <p className="text-xs text-muted-foreground mt-2 font-heading tracking-wider">commitments kept</p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-2xl font-heading font-bold text-foreground">{stats.totalTodos}</p>
                      <p className="text-[9px] text-muted-foreground font-heading tracking-wider uppercase">tasks created</p>
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold text-success">{stats.completedTodos}</p>
                      <p className="text-[9px] text-muted-foreground font-heading tracking-wider uppercase">tasks done</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.id === "journal" && (
              <div className="space-y-5 text-center">
                <BookOpen className="h-8 w-8 text-focus mx-auto" />
                <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">Reflections</p>
                <p className="text-4xl font-heading font-bold text-gradient-blue">{stats.totalJournals}</p>
                <p className="text-xs text-muted-foreground font-heading tracking-wider">journal entries written</p>
                {entries[0]?.journal_entries?.[0] && (
                  <div className="rounded-xl bg-focus/5 border border-focus/15 p-4 text-left mt-4">
                    <p className="text-[9px] font-heading tracking-widest uppercase text-focus/60 mb-2">Latest thought</p>
                    <p className="text-sm text-foreground/80 leading-relaxed italic line-clamp-4">
                      "{(entries[0].journal_entries[0] as any).text}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {slide.id === "memories" && stats.allPhotos.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <Camera className="h-8 w-8 text-wisdom mx-auto mb-2" />
                  <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">Photo Memories</p>
                  <p className="text-2xl font-heading font-bold text-gradient-wisdom mt-1">{stats.allPhotos.length} photos</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {stats.allPhotos.slice(0, 6).map((p, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-border/50">
                      <img src={p.url} alt={p.caption} className="w-full h-28 object-cover" crossOrigin="anonymous" />
                      {p.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-background/70 backdrop-blur-sm px-2 py-1">
                          <p className="text-[9px] text-foreground/80 truncate">{p.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.id === "summary" && (
              <div className="space-y-5 text-center">
                <Trophy className="h-10 w-10 text-primary mx-auto" />
                <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">Your verdict</p>
                <p className="text-3xl font-heading font-bold text-gradient-amber">
                  {stats.avgPercentage >= 90 ? "Legendary" : stats.avgPercentage >= 75 ? "Strong" : stats.avgPercentage >= 50 ? "Growing" : "Keep Pushing"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {stats.avgPercentage >= 90
                    ? "You're in the top tier. Your discipline is inspiring."
                    : stats.avgPercentage >= 75
                    ? "Solid consistency. A few tweaks and you'll be unstoppable."
                    : stats.avgPercentage >= 50
                    ? "You're building momentum. Stay the course."
                    : "Every master was once a beginner. Keep showing up."}
                </p>
                <div className="pt-2">
                  <p className="text-[9px] font-heading tracking-widest uppercase text-muted-foreground/60">MONK MODE</p>
                </div>
              </div>
            )}
          </div>

          {/* Slide indicators */}
          <div className="p-4 flex items-center justify-between">
            <button onClick={prevSlide} disabled={currentSlide === 0} className="text-xs font-heading text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors tracking-wider uppercase">
              ← Prev
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-primary w-6" : "bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="text-xs font-heading text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors tracking-wider uppercase">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wrapped;
