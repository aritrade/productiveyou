import { useState, useMemo } from "react";
import { Trophy, Flame, Star, TrendingUp, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DayRecord {
  date: string; // YYYY-MM-DD
  percentage: number;
}

interface Props {
  history: DayRecord[];
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  consistencyDurationMonths?: number;
  onReset?: () => void;
}

const COLS = 52; // weeks per row roughly

const StreakTracker = ({ history, currentStreak, longestStreak, totalPoints, consistencyDurationMonths = 24, onReset }: Props) => {
  const TOTAL_DAYS = Math.round(consistencyDurationMonths * 30.44); // dynamic based on user selection
  const [hoveredDay, setHoveredDay] = useState<DayRecord | null>(null);

  const grid = useMemo(() => {
    const today = new Date();
    const days: { date: string; percentage: number; isFuture: boolean }[] = [];

    for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const record = history.find((h) => h.date === dateStr);
      const isFuture = d > today;
      days.push({
        date: dateStr,
        percentage: record?.percentage ?? 0,
        isFuture,
      });
    }
    return days;
  }, [history]);

  const getColor = (pct: number, isFuture: boolean) => {
    if (isFuture) return "bg-muted/20";
    if (pct === 0) return "bg-muted/40";
    if (pct < 50) return "bg-destructive/30";
    if (pct < 75) return "bg-primary/25";
    if (pct < 90) return "bg-primary/50";
    return "bg-success/70";
  };

  // milestone markers
  const milestones = [15, 30, 60, 90, 120, 180, 365, 730];
  const nextMilestone = milestones.find((m) => m > currentStreak) ?? 730;
  const progressToNext = Math.min((currentStreak / nextMilestone) * 100, 100);

  // Points earned from 15-day streaks
  const streakBonuses = Math.floor(currentStreak / 15);

  return (
    <div className="card-section p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber">
            {consistencyDurationMonths >= 24 ? "2-Year" : `${consistencyDurationMonths}-Month`} Consistency
          </h2>
        </div>
        {onReset && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[10px] font-heading tracking-wider uppercase text-destructive hover:bg-destructive/20 transition-colors">
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently erase your entire 2-year streak history, points, and milestones. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted/50 border border-border p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">
              Current
            </span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">
            {currentStreak}
          </p>
          <p className="text-[10px] text-muted-foreground">days</p>
        </div>

        <div className="rounded-lg bg-muted/50 border border-border p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">
              Longest
            </span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">
            {longestStreak}
          </p>
          <p className="text-[10px] text-muted-foreground">days</p>
        </div>

        <div className="rounded-lg bg-muted/50 border border-border p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">
              Points
            </span>
          </div>
          <p className="text-xl font-heading font-bold text-gradient-amber">
            {totalPoints}
          </p>
          <p className="text-[10px] text-muted-foreground">earned</p>
        </div>

        <div className="rounded-lg bg-muted/50 border border-border p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="h-3.5 w-3.5 text-wisdom" />
            <span className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground">
              Bonuses
            </span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">
            {streakBonuses}
          </p>
          <p className="text-[10px] text-muted-foreground">×100 pts</p>
        </div>
      </div>

      {/* Next milestone progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-heading text-muted-foreground tracking-wider">
            Next milestone: {nextMilestone} days
          </span>
          <span className="text-[11px] font-heading text-primary">
            {currentStreak}/{nextMilestone}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressToNext}%`,
              background: "linear-gradient(90deg, hsl(38 95% 52%), hsl(28 85% 58%))",
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          +100 reward points every 15 consistent days of ≥90% completion
        </p>
      </div>

      {/* Heatmap grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-heading text-muted-foreground tracking-wider uppercase">
            730-Day Heatmap
          </span>
          {hoveredDay && (
            <span className="text-[10px] font-heading text-foreground/70">
              {hoveredDay.date} — {hoveredDay.percentage}%
            </span>
          )}
        </div>
        <div className="overflow-x-auto pb-2">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(TOTAL_DAYS / COLS)}, 1fr)`,
              gridAutoFlow: "column",
              minWidth: "600px",
            }}
          >
            {grid.map((day, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-[2px] transition-all duration-150 cursor-pointer hover:scale-150 hover:z-10 ${getColor(
                  day.percentage,
                  day.isFuture
                )}`}
                onMouseEnter={() =>
                  setHoveredDay({ date: day.date, percentage: day.percentage })
                }
                onMouseLeave={() => setHoveredDay(null)}
                title={`${day.date}: ${day.percentage}%`}
              />
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 justify-end">
          <span className="text-[9px] text-muted-foreground">Less</span>
          <div className="flex gap-[2px]">
            <div className="w-3 h-3 rounded-[2px] bg-muted/40" />
            <div className="w-3 h-3 rounded-[2px] bg-destructive/30" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/25" />
            <div className="w-3 h-3 rounded-[2px] bg-primary/50" />
            <div className="w-3 h-3 rounded-[2px] bg-success/70" />
          </div>
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;
