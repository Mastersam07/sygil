import type { FastifyInstance } from "fastify";
import { loadAllSessions, computeTokenAnalytics, computeToolUsage, computeGitStats } from "@sygil/core";

export function registerAnalyticsRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { period?: string; from?: string; to?: string } }>("/api/analytics/tokens", async (req) => {
    let sessions = loadAllSessions(claudeDir);
    const { from, to, period } = req.query;
    if (from) sessions = sessions.filter(s => s.startedAt >= from);
    if (to) sessions = sessions.filter(s => s.startedAt <= to);
    return computeTokenAnalytics(sessions, (period as "day" | "week" | "month") || "day");
  });

  app.get<{ Querystring: { project?: string } }>("/api/analytics/tools", async (req) => {
    return computeToolUsage(claudeDir, req.query.project);
  });

  app.get<{ Querystring: { from?: string; to?: string } }>("/api/analytics/git", async (req) => {
    let sessions = loadAllSessions(claudeDir);
    const { from, to } = req.query;
    if (from) sessions = sessions.filter(s => s.startedAt >= from);
    if (to) sessions = sessions.filter(s => s.startedAt <= to);
    return { branches: computeGitStats(sessions) };
  });
}
