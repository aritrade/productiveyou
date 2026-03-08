import { useState } from "react";
import { ListTodo, Plus, Trash2 } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface Props {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoList = ({ todos, onAdd, onToggle, onDelete }: Props) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput("");
  };

  const done = todos.filter((t) => t.done).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6 card-glow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <ListTodo className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-heading font-semibold tracking-wide uppercase text-gradient">
            Today's Tasks
          </h2>
        </div>
        {todos.length > 0 && (
          <span className="text-xs text-muted-foreground font-heading">
            {done}/{todos.length} done
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="rounded-lg bg-primary text-primary-foreground px-3 py-2.5 transition-all hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks yet. Add one above to get started.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all border ${
                todo.done
                  ? "border-transparent bg-muted/30"
                  : "border-transparent hover:border-border hover:bg-secondary/40"
              }`}
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => onToggle(todo.id)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    todo.done
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {todo.done && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-all ${
                    todo.done
                      ? "line-through-done text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {todo.text}
                </span>
              </label>
              <button
                onClick={() => onDelete(todo.id)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;
