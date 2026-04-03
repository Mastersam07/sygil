import type { FastifyInstance } from "fastify";
import { loadTodos, loadPlans } from "@sygil/core";

export function registerTodoRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { status?: string; project?: string } }>("/api/todos", async (req) => {
    const result = loadTodos(claudeDir);
    const { status, project } = req.query;
    let todos = result.todos;
    if (status) todos = todos.filter(t => t.status === status);
    if (project) {
      todos = todos.filter(t => t.projectHash === project || t.projectName === project);
    }

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
    };
  });

  app.get("/api/plans", async () => {
    return { plans: loadPlans(claudeDir) };
  });
}
