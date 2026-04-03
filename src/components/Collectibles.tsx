import { useState } from "react";
import { Lock, Trophy } from "lucide-react";

interface CollectibleCharacter {
  id: string;
  name: string;
  emoji: string;
  description: string;
  pointsRequired: number;
  tier: "bronze" | "silver" | "gold" | "diamond" | "legendary";
}

const CHARACTERS: CollectibleCharacter[] = [
  { id: "seedling", name: "Seedling", emoji: "🌱", description: "Every journey begins with a single step.", pointsRequired: 0, tier: "bronze" },
  { id: "flame-starter", name: "Flame Starter", emoji: "🔥", description: "The fire within you is ignited.", pointsRequired: 100, tier: "bronze" },
  { id: "shield-bearer", name: "Shield Bearer", emoji: "🛡️", description: "You've built your first line of defense.", pointsRequired: 200, tier: "bronze" },
  { id: "iron-wolf", name: "Iron Wolf", emoji: "🐺", description: "Relentless. Unstoppable. Hungry.", pointsRequired: 400, tier: "silver" },
  { id: "thunder-hawk", name: "Thunder Hawk", emoji: "🦅", description: "You see further than most dare to look.", pointsRequired: 600, tier: "silver" },
  { id: "shadow-fox", name: "Shadow Fox", emoji: "🦊", description: "Silent discipline. Deadly consistency.", pointsRequired: 900, tier: "silver" },
  { id: "golden-lion", name: "Golden Lion", emoji: "🦁", description: "You lead by example. Royalty earned.", pointsRequired: 1200, tier: "gold" },
  { id: "storm-dragon", name: "Storm Dragon", emoji: "🐉", description: "Chaos bows before your discipline.", pointsRequired: 1800, tier: "gold" },
  { id: "phoenix-rise", name: "Phoenix Rising", emoji: "🔱", description: "Reborn stronger every single day.", pointsRequired: 2500, tier: "diamond" },
  { id: "titan", name: "Titan", emoji: "⚡", description: "Mountains move when you decide to walk.", pointsRequired: 3500, tier: "diamond" },
  { id: "monk-master", name: "Monk Master", emoji: "🧘", description: "True mastery. Mind, body, and soul aligned.", pointsRequired: 5000, tier: "legendary" },
  { id: "eternal-sage", name: "Eternal Sage", emoji: "👁️", description: "You have transcended. Legend status unlocked.", pointsRequired: 7500, tier: "legendary" },
];

const TIER_STYLES: Record<string, { border: string; bg: string; glow: string; label: string }> = {
  bronze: { border: "border-orange-700/40", bg: "bg-orange-900/20", glow: "", label: "Bronze" },
  silver: { border: "border-slate-400/40", bg: "bg-slate-500/15", glow: "", label: "Silver" },
  gold: { border: "border-primary/50", bg: "bg-primary/10", glow: "shadow-[0_0_15px_-3px_hsl(38_95%_52%/0.2)]", label: "Gold" },
  diamond: { border: "border-sky-400/50", bg: "bg-sky-500/10", glow: "shadow-[0_0_20px_-3px_hsl(200_80%_55%/0.25)]", label: "Diamond" },
  legendary: { border: "border-purple-400/50", bg: "bg-purple-500/10", glow: "shadow-[0_0_25px_-3px_hsl(270_70%_55%/0.3)]", label: "Legendary" },
};

interface Props {
  totalPoints: number;
}

const Collectibles = ({ totalPoints }: Props) => {
  const [selectedChar, setSelectedChar] = useState<CollectibleCharacter | null>(null);
  const unlockedCount = CHARACTERS.filter((c) => totalPoints >= c.pointsRequired).length;

  return (
    <div className="card-section p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-amber">
              Collectibles
            </h2>
            <p className="text-[10px] text-muted-foreground font-heading tracking-wider">
              {unlockedCount}/{CHARACTERS.length} unlocked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
          <span className="text-[10px] font-heading text-muted-foreground tracking-wider uppercase">Points</span>
          <span className="text-sm font-heading font-bold text-gradient-amber">{totalPoints}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {CHARACTERS.map((char) => {
          const unlocked = totalPoints >= char.pointsRequired;
          const style = TIER_STYLES[char.tier];
          return (
            <button
              key={char.id}
              onClick={() => setSelectedChar(char)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                unlocked
                  ? `${style.border} ${style.bg} ${style.glow} hover:scale-105 cursor-pointer`
                  : "border-border bg-muted/20 opacity-50 cursor-pointer"
              }`}
            >
              <span className={`text-2xl ${unlocked ? "" : "grayscale blur-[2px]"}`}>
                {char.emoji}
              </span>
              <span className={`text-[10px] font-heading font-semibold tracking-wider text-center leading-tight ${
                unlocked ? "text-foreground" : "text-muted-foreground"
              }`}>
                {unlocked ? char.name : "???"}
              </span>
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {unlocked && (
                <span className={`text-[8px] font-heading tracking-wider uppercase ${
                  char.tier === "legendary" ? "text-purple-400" :
                  char.tier === "diamond" ? "text-sky-400" :
                  char.tier === "gold" ? "text-primary" :
                  char.tier === "silver" ? "text-slate-400" : "text-orange-600"
                }`}>
                  {style.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected character detail */}
      {selectedChar && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 transition-all ${
          totalPoints >= selectedChar.pointsRequired
            ? `${TIER_STYLES[selectedChar.tier].border} ${TIER_STYLES[selectedChar.tier].bg}`
            : "border-border bg-muted/20"
        }`}>
          <span className={`text-4xl ${totalPoints >= selectedChar.pointsRequired ? "" : "grayscale blur-[2px]"}`}>
            {selectedChar.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-foreground">
              {totalPoints >= selectedChar.pointsRequired ? selectedChar.name : "???"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalPoints >= selectedChar.pointsRequired
                ? selectedChar.description
                : `Unlock at ${selectedChar.pointsRequired} points (${selectedChar.pointsRequired - totalPoints} more needed)`}
            </p>
            <p className={`text-[10px] font-heading tracking-wider uppercase mt-1 ${
              selectedChar.tier === "legendary" ? "text-purple-400" :
              selectedChar.tier === "diamond" ? "text-sky-400" :
              selectedChar.tier === "gold" ? "text-primary" :
              selectedChar.tier === "silver" ? "text-slate-400" : "text-orange-600"
            }`}>
              {TIER_STYLES[selectedChar.tier].label} Tier · {selectedChar.pointsRequired} pts
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Earn 100 points every 15 days of ≥90% consistency to unlock new characters
      </p>
    </div>
  );
};

export default Collectibles;
