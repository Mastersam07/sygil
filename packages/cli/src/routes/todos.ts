import type { FastifyInstance } from "fastify";
import { loadTodos, loadPlans } from "@sygil/core";

export function registerTodoRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { status?: string } }>("/api/todos", async (req) => {
    const result = loadTodos(claudeDir);
    const { status } = req.query;
    let todos = result.todos;
    if (status) todos = todos.filter(t => t.status === status);
    return { todos, stats: result.stats };
  });

  app.get("/api/plans", async () => {
    return { plans: loadPlans(claudeDir) };
  });
}
