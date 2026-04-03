import type { FastifyInstance } from "fastify";
import { loadHistory, searchHistory } from "@sygil/core";

export function registerHistoryRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { q?: string; project?: string; page?: string; limit?: string } }>("/api/history", async (req) => {
    let entries = loadHistory(claudeDir);
    const { q, project, page = "1", limit = "100" } = req.query;
    if (q) entries = searchHistory(entries, q);
    if (project) entries = entries.filter(e => e.projectPath.includes(project));
    const total = entries.length;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    return { entries: entries.slice((p - 1) * l, p * l), total };
  });
}
