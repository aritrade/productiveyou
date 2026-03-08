import { Flame } from "lucide-react";

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "The pain of discipline is nothing like the pain of disappointment.",
  "We are what we repeatedly do. Excellence is not an act, but a habit.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't count the days. Make the days count.",
  "The secret of getting ahead is getting started.",
  "Hard choices, easy life. Easy choices, hard life.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
];

const DailyQuote = () => {
  const today = new Date();
  const index = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % QUOTES.length;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-wisdom/15 bg-wisdom/5 px-6 py-4">
      <div className="w-8 h-8 rounded-full bg-wisdom/15 flex items-center justify-center shrink-0">
        <Flame className="h-4 w-4 text-wisdom" />
      </div>
      <p className="text-sm text-foreground/70 italic leading-relaxed">"{QUOTES[index]}"</p>
    </div>
  );
};

export default DailyQuote;
