import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename } from "path";

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
  sessionId: string;
  fileName: string;
}

interface PlanFile {
  name: string;
  content: string;
  createdAt: string;
  modifiedAt: string;
}

interface TodosResult {
  todos: TodoItem[];
  stats: { total: number; completed: number; pending: number; inProgress: number; completionRate: number };
  plans: PlanFile[];
}

export function loadTodos(claudeDir: string): TodosResult {
  const todosDir = join(claudeDir, "todos");
  const todos: TodoItem[] = [];

  if (existsSync(todosDir)) {
    try {
      const files = readdirSync(todosDir).filter(f => f.endsWith(".json"));
      for (const file of files) {
        try {
          const content = readFileSync(join(todosDir, file), "utf-8");
          const items = JSON.parse(content);
          if (!Array.isArray(items)) continue;
          const sessionId = basename(file, ".json").split("-agent-")[0];
          for (const item of items) {
            if (!item.content) continue;
            todos.push({
              content: item.content,
              status: item.status || "pending",
              activeForm: item.activeForm,
              sessionId,
              fileName: file,
            });
          }
        } catch { /* skip malformed */ }
      }
    } catch { /* skip */ }
  }

  const completed = todos.filter(t => t.status === "completed").length;
  const pending = todos.filter(t => t.status === "pending").length;
  const inProgress = todos.filter(t => t.status === "in_progress").length;

  const plans = loadPlans(claudeDir);

  return {
    todos,
    stats: {
      total: todos.length,
      completed,
      pending,
      inProgress,
      completionRate: todos.length > 0 ? (completed / todos.length) * 100 : 0,
    },
    plans,
  };
}

export function loadPlans(claudeDir: string): PlanFile[] {
  const plansDir = join(claudeDir, "plans");
  if (!existsSync(plansDir)) return [];

  try {
    return readdirSync(plansDir)
      .filter(f => f.endsWith(".md"))
      .map(f => {
        const fullPath = join(plansDir, f);
        const stat = statSync(fullPath);
        return {
          name: basename(f, ".md"),
          content: readFileSync(fullPath, "utf-8"),
          createdAt: stat.birthtime.toISOString(),
          modifiedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  } catch {
    return [];
  }
}
