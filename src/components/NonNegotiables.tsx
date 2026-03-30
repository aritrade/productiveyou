import { ShieldCheck, ShieldX } from "lucide-react";

interface Rule {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  rules: Rule[];
  checked: Record<string, boolean>;
  onChange: (id: string) => void;
}

const NonNegotiables = ({ rules, checked, onChange }: Props) => {
  const allGood = rules.every((r) => checked[r.id]);
  const keptCount = rules.filter((r) => checked[r.id]).length;

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
        <span className={`text-xs font-heading font-bold ${allGood ? "text-success" : "text-destructive"}`}>
          {keptCount}/{rules.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rules.map((rule) => {
          const isChecked = !!checked[rule.id];
          return (
            <button
              key={rule.id}
              onClick={() => onChange(rule.id)}
              className={`group flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                isChecked
                  ? "border-success/30 bg-success/8 text-success shadow-[inset_0_1px_0_0_hsla(152,60%,42%,0.1)]"
                  : "border-destructive/20 bg-destructive/5 text-destructive/80 shadow-[inset_0_1px_0_0_hsla(0,78%,55%,0.05)]"
              }`}
            >
              <span className="text-lg">{rule.icon}</span>
              <span className="flex-1 text-left">{rule.label}</span>
              <span className={`text-[10px] font-heading tracking-wider uppercase ${
                isChecked ? "text-success/70" : "text-destructive/50"
              }`}>
                {isChecked ? "✓ kept" : "✗ break"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NonNegotiables;
