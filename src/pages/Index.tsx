import { useState } from "react";
import { format } from "date-fns";
import NonNegotiables from "@/components/NonNegotiables";
import DailyHabits from "@/components/DailyHabits";
import JournalSection from "@/components/JournalSection";
import TodoList from "@/components/TodoList";
import DailyQuote from "@/components/DailyQuote";
import { Zap } from "lucide-react";

interface JournalEntry {
  id: string;
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const Index = () => {
  const [nonNegotiables, setNonNegotiables] = useState<Record<string, boolean>>({});
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);

  const toggleNonNeg = (id: string) =>
    setNonNegotiables((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleHabit = (id: string) =>
    setHabits((prev) => ({ ...prev, [id]: !prev[id] }));

  const saveJournal = (entry: { text: string; audioUrl?: string }) =>
    setJournalEntries((prev) => [
      { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
      ...prev,
    ]);

  const addTodo = (text: string) =>
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false },
    ]);

  const toggleTodo = (id: string) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const deleteTodo = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold tracking-tight text-foreground">
                LOCKDOWN
              </h1>
              <p className="text-xs text-muted-foreground font-heading">
                Productivity Tracker
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-heading font-semibold text-foreground">
              {format(new Date(), "EEEE")}
            </p>
            <p className="text-xs text-muted-foreground font-heading">
              {format(new Date(), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <DailyQuote />
        <NonNegotiables checked={nonNegotiables} onChange={toggleNonNeg} />
        <DailyHabits checked={habits} onChange={toggleHabit} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JournalSection entries={journalEntries} onSave={saveJournal} />
          <TodoList
            todos={todos}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
