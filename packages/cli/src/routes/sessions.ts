import type { FastifyInstance } from "fastify";
import { loadAllSessions, loadSessionDetail } from "@sygil/core";

export function registerSessionRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { project?: string; branch?: string; from?: string; to?: string; q?: string; sort?: string; order?: string; page?: string; limit?: string } }>(
    "/api/sessions", async (req) => {
      let sessions = loadAllSessions(claudeDir);
      const { project, branch, from, to, q, sort, order, page = "1", limit = "50" } = req.query;

      if (project) sessions = sessions.filter(s => s.projectPath === project || s.project === project);
      if (branch) sessions = sessions.filter(s => s.branch === branch);
      if (from) sessions = sessions.filter(s => s.startedAt >= from);
      if (to) sessions = sessions.filter(s => s.startedAt <= to);
      if (q) {
        const lower = q.toLowerCase();
        sessions = sessions.filter(s => s.title.toLowerCase().includes(lower) || s.project.toLowerCase().includes(lower));
      }

      if (sort) {
        const dir = order === "asc" ? 1 : -1;
        sessions.sort((a, b) => {
          switch (sort) {
            case "tokens": return dir * ((a.tokens.input + a.tokens.output) - (b.tokens.input + b.tokens.output));
            case "cost": return dir * (a.cost - b.cost);
            case "duration": return dir * (a.duration - b.duration);
            case "messages": return dir * (a.messageCount - b.messageCount);
            default: return dir * (new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
          }
        });
      }

      const total = sessions.length;
      const p = parseInt(page, 10);
      const l = parseInt(limit, 10);
      const paginated = sessions.slice((p - 1) * l, p * l);

      return { sessions: paginated, total };
    }
  );

  app.get<{ Params: { id: string } }>("/api/sessions/:id", async (req, reply) => {
    const detail = loadSessionDetail(claudeDir, req.params.id);
    if (!detail) { reply.code(404); return { error: "Session not found" }; }
    return detail;
  });
}
