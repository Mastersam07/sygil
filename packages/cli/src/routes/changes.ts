import type { FastifyInstance } from "fastify";
import { loadFileChanges } from "@sygil/core";

export function registerChangeRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { project?: string; ext?: string; page?: string; limit?: string } }>("/api/changes", async (req) => {
    const result = loadFileChanges(claudeDir, req.query.project);
    let changes = result.changes;
    const { ext, page = "1", limit = "50" } = req.query;

    if (ext) changes = changes.filter(c => c.extension === ext);

    const total = changes.length;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    const paginated = changes.slice((p - 1) * l, p * l);

    return {
      changes: paginated,
      total,
      mostTouched: result.mostTouched,
      totalLinesAdded: result.totalLinesAdded,
      totalLinesRemoved: result.totalLinesRemoved,
      totalFiles: result.totalFiles,
    };
  });
}
