import { CheckSquare } from "lucide-react";

const HABITS = [
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

interface Props {
  checked: Record<string, boolean>;
  onChange: (id: string) => void;
}

const DailyHabits = ({ checked, onChange }: Props) => {
  const completed = HABITS.filter((h) => checked[h.id]).length;
  const percentage = Math.round((completed / HABITS.length) * 100);

  return (
    <div className="card-section p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber">
            Daily Habits
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-heading">
            {completed}/{HABITS.length}
          </span>
          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                percentage === 100 ? "progress-bar-glow" : ""
              }`}
              style={{
                width: `${percentage}%`,
                background: percentage === 100
                  ? "linear-gradient(90deg, hsl(152 60% 42%), hsl(142 55% 50%))"
                  : "linear-gradient(90deg, hsl(38 95% 52%), hsl(28 85% 58%))",
              }}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {HABITS.map((habit) => {
          const isChecked = !!checked[habit.id];
          return (
            <label
              key={habit.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 border ${
                isChecked
                  ? "border-primary/20 bg-primary/5"
                  : "border-transparent hover:border-border/50 hover:bg-muted/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(habit.id)}
                className="sr-only"
              />
              <div
                className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  isChecked
                    ? "border-primary bg-primary shadow-[0_0_6px_-1px_hsl(38_95%_52%/0.4)]"
                    : "border-muted-foreground/30"
                }`}
              >
                {isChecked && (
                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-base">{habit.emoji}</span>
              <span className={`text-[13px] font-medium transition-colors ${isChecked ? "text-foreground" : "text-secondary-foreground"}`}>
                {habit.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default DailyHabits;
