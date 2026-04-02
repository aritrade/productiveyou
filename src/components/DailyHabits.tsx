import { useState } from "react";
import { CheckSquare, Pencil, Lock, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Habit {
  id: string;
  label: string;
  emoji: string;
}

interface Props {
  habits: Habit[];
  checked: Record<string, boolean>;
  onChange: (id: string) => void;
  onHabitsUpdate?: (habits: Habit[]) => void;
}

const DailyHabits = ({ habits, checked, onChange, onHabitsUpdate }: Props) => {
  const { user, refreshProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");

  const completed = habits.filter((h) => checked[h.id]).length;
  const percentage = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;

  const saveHabits = async (updated: Habit[]) => {
    if (!user) return;
    onHabitsUpdate?.(updated);
    await supabase
      .from("profiles")
      .update({ custom_habits: updated as any })
      .eq("user_id", user.id);
    await refreshProfile();
  };

  const addHabit = () => {
    if (!newLabel.trim()) return;
    const id = newLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const updated = [...habits, { id, label: newLabel.trim(), emoji: newEmoji }];
    saveHabits(updated);
    setNewLabel("");
    setNewEmoji("✅");
  };

  const removeHabit = (id: string) => {
    saveHabits(habits.filter((h) => h.id !== id));
  };

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
            {completed}/{habits.length}
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
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-heading tracking-wider uppercase transition-colors ${
              editMode
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            title={editMode ? "Lock" : "Edit"}
          >
            {editMode ? <Lock className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            <span className="hidden sm:inline">{editMode ? "Lock" : "Edit"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {habits.map((habit) => {
          const isChecked = !!checked[habit.id];
          return (
            <div key={habit.id} className="relative">
              <label
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 border ${
                  editMode
                    ? "border-border bg-muted/30 cursor-default"
                    : isChecked
                    ? "border-primary/20 bg-primary/5 cursor-pointer"
                    : "border-transparent hover:border-border/50 hover:bg-muted/50 cursor-pointer"
                }`}
              >
                {!editMode && (
                  <>
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
                  </>
                )}
                <span className="text-base">{habit.emoji}</span>
                <span className={`text-[13px] font-medium transition-colors ${isChecked && !editMode ? "text-foreground" : "text-secondary-foreground"}`}>
                  {habit.label}
                </span>
              </label>
              {editMode && (
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editMode && (
        <div className="flex gap-2 mt-4">
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            className="input-field w-14 text-center text-lg"
            maxLength={2}
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
            placeholder="Add a daily habit..."
            className="input-field flex-1"
          />
          <button onClick={addHabit} className="btn-secondary flex items-center gap-1 text-xs">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyHabits;
