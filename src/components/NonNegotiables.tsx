import { ShieldCheck, ShieldX } from "lucide-react";

const RULES = [
  { id: "no-smoking", label: "No Smoking", icon: "🚭" },
  { id: "no-drinking", label: "No Drinking", icon: "🚫" },
  { id: "no-addiction", label: "No Addiction", icon: "🧠" },
  { id: "no-social-media", label: "No Social Media Screen Time", icon: "📵" },
];

interface Props {
  checked: Record<string, boolean>;
  onChange: (id: string) => void;
}

const NonNegotiables = ({ checked, onChange }: Props) => {
  const allGood = RULES.every((r) => checked[r.id]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 card-glow">
      <div className="flex items-center gap-3 mb-5">
        {allGood ? (
          <ShieldCheck className="h-6 w-6 text-success" />
        ) : (
          <ShieldX className="h-6 w-6 text-destructive" />
        )}
        <h2 className="text-lg font-heading font-semibold tracking-wide uppercase text-gradient">
          Non-Negotiables
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RULES.map((rule) => {
          const isChecked = !!checked[rule.id];
          return (
            <button
              key={rule.id}
              onClick={() => onChange(rule.id)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isChecked
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}
            >
              <span className="text-lg">{rule.icon}</span>
              <span>{rule.label}</span>
              <span className="ml-auto text-xs opacity-70">
                {isChecked ? "✓ Kept" : "✗ Break"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NonNegotiables;
