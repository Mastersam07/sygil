import type { FastifyInstance } from "fastify";
import { loadMemory } from "@sygil/core";

export function registerMemoryRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { type?: string; project?: string; q?: string } }>("/api/memory", async (req) => {
    const result = loadMemory(claudeDir);
    let files = result.files;
    const { type, project, q } = req.query;

    if (type) files = files.filter(f => f.type === type);
    if (project) files = files.filter(f => f.projectSlug === project);
    if (q) {
      const lower = q.toLowerCase();
      files = files.filter(f => f.content.toLowerCase().includes(lower) || f.name.toLowerCase().includes(lower));
    }

    return { files, countByProject: result.countByProject, countByType: result.countByType };
  });
}
