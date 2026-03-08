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
    <div className="rounded-xl border border-border bg-card p-6 card-glow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-heading font-semibold tracking-wide uppercase text-gradient">
            Daily Habits
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completed}/{HABITS.length}
          </span>
          <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {HABITS.map((habit) => {
          const isChecked = !!checked[habit.id];
          return (
            <label
              key={habit.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 border ${
                isChecked
                  ? "border-primary/30 bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-secondary/50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(habit.id)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  isChecked
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-lg">{habit.emoji}</span>
              <span className={`text-sm font-medium ${isChecked ? "text-foreground" : "text-secondary-foreground"}`}>
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
