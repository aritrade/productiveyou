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
    <div className="card-section p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
            <ListTodo className="h-5 w-5 text-success" />
          </div>
          <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-green">
            Today's Tasks
          </h2>
        </div>
        {todos.length > 0 && (
          <span className="text-xs text-muted-foreground font-heading">
            {done}/{todos.length}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task..."
          className="input-field flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="btn-primary !px-3"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks yet. Add one above to get started.
        </p>
      ) : (
        <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 group ${
                todo.done ? "bg-muted/20" : "hover:bg-muted/40"
              }`}
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} className="sr-only" />
                <div
                  className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    todo.done
                      ? "border-success bg-success shadow-[0_0_6px_-1px_hsl(152_60%_42%/0.4)]"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {todo.done && (
                    <svg className="w-2.5 h-2.5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium transition-all ${
                  todo.done ? "line-through-done text-muted-foreground" : "text-foreground"
                }`}>
                  {todo.text}
                </span>
              </label>
              <button
                onClick={() => onDelete(todo.id)}
                className="text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;
