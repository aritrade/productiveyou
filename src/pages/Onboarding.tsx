import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap, ChevronRight, ChevronLeft, Plus, X, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_NON_NEGOTIABLES = [
  { id: "no-smoking", label: "No Smoking", icon: "🚭" },
  { id: "no-drinking", label: "No Drinking", icon: "🚫" },
  { id: "no-addiction", label: "No Addiction", icon: "🧠" },
  { id: "no-social-media", label: "No Social Media Screen Time", icon: "📵" },
];

const DEFAULT_HABITS = [
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

const DURATION_OPTIONS = [
  { months: 1, label: "1 Month", desc: "Quick sprint" },
  { months: 3, label: "3 Months", desc: "Quarter challenge" },
  { months: 6, label: "6 Months", desc: "Half-year commitment" },
  { months: 12, label: "1 Year", desc: "Full transformation" },
  { months: 24, label: "2 Years", desc: "Monk mode mastery" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const isEditing = profile?.onboarding_completed ?? false;
  const cameFromDashboard = location.state?.from === "dashboard";

  // Step 0: Preferred name
  const [preferredName, setPreferredName] = useState(
    profile?.display_name || user?.user_metadata?.display_name || ""
  );

  // Step 1: Non-negotiables
  const [nonNegs, setNonNegs] = useState(
    isEditing && profile?.custom_non_negotiables?.length ? profile.custom_non_negotiables : DEFAULT_NON_NEGOTIABLES
  );
  const [newNonNegLabel, setNewNonNegLabel] = useState("");
  const [newNonNegIcon, setNewNonNegIcon] = useState("🚫");

  // Step 2: Habits
  const [habits, setHabits] = useState(
    isEditing && profile?.custom_habits?.length ? profile.custom_habits : DEFAULT_HABITS
  );
  const [newHabitLabel, setNewHabitLabel] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("✅");

  // Step 3: Duration
  const [duration, setDuration] = useState(profile?.consistency_duration_months ?? 24);


  const addNonNeg = () => {
    if (!newNonNegLabel.trim()) return;
    const id = newNonNegLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setNonNegs((prev) => [...prev, { id, label: newNonNegLabel.trim(), icon: newNonNegIcon }]);
    setNewNonNegLabel("");
    setNewNonNegIcon("🚫");
  };

  const removeNonNeg = (id: string) => {
    setNonNegs((prev) => prev.filter((n) => n.id !== id));
  };

  const addHabit = () => {
    if (!newHabitLabel.trim()) return;
    const id = newHabitLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setHabits((prev) => [...prev, { id, label: newHabitLabel.trim(), emoji: newHabitEmoji }]);
    setNewHabitLabel("");
    setNewHabitEmoji("✅");
  };

  const removeHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          custom_non_negotiables: nonNegs as any,
          custom_habits: habits as any,
          consistency_duration_months: duration,
          streak_start_date: new Date().toISOString().split("T")[0],
          onboarding_completed: true,
          display_name: preferredName.trim() || user.user_metadata?.display_name || user.email?.split("@")[0] || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const steps = ["Your Name", "Non-Negotiables", "Daily Habits", "Duration"];

  return (
    <div className="min-h-screen bg-background bg-noise flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{
            background: "linear-gradient(135deg, hsl(38 95% 52%), hsl(32 80% 42%))"
          }}>
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-heading font-bold text-gradient-amber">SET UP YOUR MONK MODE</h1>
          <p className="text-xs text-muted-foreground mt-1 font-heading tracking-wider">Customize your journey</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-heading tracking-wider uppercase hidden sm:inline ${
                i <= step ? "text-foreground" : "text-muted-foreground"
              }`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 rounded ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="card-section p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber mb-1">
                  How should we address you?
                </h2>
                <p className="text-xs text-muted-foreground">Enter the name you'd like to see when you log in.</p>
              </div>
              <input
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. Neel, Captain, Warrior..."
                className="input-field w-full text-base"
                autoFocus
              />
              {preferredName.trim() && (
                <p className="text-sm text-muted-foreground">
                  You'll be greeted as: <span className="text-primary font-semibold">{preferredName.trim()}</span>
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber mb-1">
                  Your Non-Negotiables
                </h2>
                <p className="text-xs text-muted-foreground">Rules you commit to never break. Remove or add your own.</p>
              </div>
              <div className="space-y-2">
                {nonNegs.map((nn) => (
                  <div key={nn.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <span className="text-lg">{nn.icon}</span>
                    <span className="flex-1 text-sm font-medium text-foreground">{nn.label}</span>
                    <button onClick={() => removeNonNeg(nn.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newNonNegIcon}
                  onChange={(e) => setNewNonNegIcon(e.target.value)}
                  className="input-field w-14 text-center text-lg"
                  maxLength={2}
                />
                <input
                  value={newNonNegLabel}
                  onChange={(e) => setNewNonNegLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNonNeg()}
                  placeholder="Add a non-negotiable..."
                  className="input-field flex-1"
                />
                <button onClick={addNonNeg} className="btn-secondary flex items-center gap-1 text-xs">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber mb-1">
                  Your Daily Habits
                </h2>
                <p className="text-xs text-muted-foreground">Habits you want to track every day. Customize freely.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {habits.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <span className="text-base">{h.emoji}</span>
                    <span className="flex-1 text-[13px] font-medium text-foreground">{h.label}</span>
                    <button onClick={() => removeHabit(h.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newHabitEmoji}
                  onChange={(e) => setNewHabitEmoji(e.target.value)}
                  className="input-field w-14 text-center text-lg"
                  maxLength={2}
                />
                <input
                  value={newHabitLabel}
                  onChange={(e) => setNewHabitLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  placeholder="Add a daily habit..."
                  className="input-field flex-1"
                />
                <button onClick={addHabit} className="btn-secondary flex items-center gap-1 text-xs">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber mb-1">
                  Consistency Duration
                </h2>
                <p className="text-xs text-muted-foreground">How long do you want to commit to Monk Mode?</p>
              </div>
              <div className="space-y-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.months}
                    onClick={() => setDuration(opt.months)}
                    className={`w-full flex items-center justify-between rounded-lg border px-5 py-4 transition-all ${
                      duration === opt.months
                        ? "border-primary/40 bg-primary/8 shadow-[0_0_20px_-6px_hsl(38_95%_52%/0.15)]"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-heading font-semibold ${duration === opt.months ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                    </div>
                    {duration === opt.months && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="btn-secondary flex items-center gap-1 text-xs disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !preferredName.trim()}
                className="btn-primary flex items-center gap-1 text-xs disabled:opacity-30"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || nonNegs.length === 0 || habits.length === 0}
                className="btn-primary flex items-center gap-1 text-xs"
              >
                {saving ? "Saving..." : "Start Monk Mode"} <Zap className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
