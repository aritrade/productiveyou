import { useState } from "react";
import { ShieldCheck, ShieldX, Pencil, Lock, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isDemoMode, setDemoProfile } from "@/lib/demo";

interface Rule {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  rules: Rule[];
  checked: Record<string, boolean>;
  onChange: (id: string) => void;
  onRulesUpdate?: (rules: Rule[]) => void;
}

const NonNegotiables = ({ rules, checked, onChange, onRulesUpdate }: Props) => {
  const { user, refreshProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("🚫");

  const allGood = rules.every((r) => checked[r.id]);
  const keptCount = rules.filter((r) => checked[r.id]).length;

  const saveRules = async (updated: Rule[]) => {
    if (!user) return;
    onRulesUpdate?.(updated);
    if (isDemoMode()) {
      setDemoProfile({ custom_non_negotiables: updated });
      await refreshProfile();
      return;
    }
    await supabase
      .from("profiles")
      .update({ custom_non_negotiables: updated as any })
      .eq("user_id", user.id);
    await refreshProfile();
  };

  const addRule = () => {
    if (!newLabel.trim()) return;
    const id = newLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const updated = [...rules, { id, label: newLabel.trim(), icon: newIcon }];
    saveRules(updated);
    setNewLabel("");
    setNewIcon("🚫");
  };

  const removeRule = (id: string) => {
    saveRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div className={`card-section p-6 ${allGood ? "card-success-glow" : "card-danger-glow"}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {allGood ? (
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
              <ShieldX className="h-5 w-5 text-destructive" />
            </div>
          )}
          <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber">
            Non-Negotiables
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-heading font-bold ${allGood ? "text-success" : "text-destructive"}`}>
            {keptCount}/{rules.length}
          </span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rules.map((rule) => {
          const isChecked = !!checked[rule.id];
          return (
            <div key={rule.id} className="relative">
              <button
                onClick={() => !editMode && onChange(rule.id)}
                disabled={editMode}
                className={`w-full group flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                  editMode
                    ? "border-border bg-muted/30 text-foreground cursor-default"
                    : isChecked
                    ? "border-success/30 bg-success/8 text-success shadow-[inset_0_1px_0_0_hsla(152,60%,42%,0.1)]"
                    : "border-destructive/20 bg-destructive/5 text-destructive/80 shadow-[inset_0_1px_0_0_hsla(0,78%,55%,0.05)]"
                }`}
              >
                <span className="text-lg">{rule.icon}</span>
                <span className="flex-1 text-left">{rule.label}</span>
                {!editMode && (
                  <span className={`text-[10px] font-heading tracking-wider uppercase ${
                    isChecked ? "text-success/70" : "text-destructive/50"
                  }`}>
                    {isChecked ? "✓ kept" : "✗ break"}
                  </span>
                )}
              </button>
              {editMode && (
                <button
                  onClick={() => removeRule(rule.id)}
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
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="input-field w-14 text-center text-lg"
            maxLength={2}
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRule()}
            placeholder="Add a non-negotiable..."
            className="input-field flex-1"
          />
          <button onClick={addRule} className="btn-secondary flex items-center gap-1 text-xs">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
};

export default NonNegotiables;
