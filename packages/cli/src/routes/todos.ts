import type { FastifyInstance } from "fastify";
import { loadTodos, loadPlans } from "@sygil/core";

export function registerTodoRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { status?: string; project?: string; priority?: string } }>("/api/todos", async (req) => {
    const result = loadTodos(claudeDir);
    const { status, project, priority } = req.query;
    let todos = result.todos;
    if (status) todos = todos.filter(t => t.status === status);
    if (project) {
      todos = todos.filter(t => t.projectHash === project || t.projectName === project);
    }
    if (priority) todos = todos.filter(t => t.priority === priority);

    const completed = todos.filter(t => t.status === "completed").length;
    const pending = todos.filter(t => t.status === "pending").length;
    const inProgress = todos.filter(t => t.status === "in_progress").length;

    return {
      todos,
      stats: {
        total: todos.length,
        completed,
        pending,
        inProgress,
        completionRate: todos.length > 0 ? (completed / todos.length) * 100 : 0,
      },
      availableProjects: Array.from(
        new Map(
          result.todos
            .filter(todo => todo.projectName)
            .map(todo => [
              todo.projectHash || todo.projectName,
              { id: todo.projectHash || todo.projectName, name: todo.projectName },
            ])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name)),
      availablePriorities: Array.from(
        new Set(result.todos.map(todo => todo.priority).filter((value): value is string => Boolean(value)))
      ).sort(),
    };
  });

  app.get("/api/plans", async () => {
    return { plans: loadPlans(claudeDir) };
  });
}
