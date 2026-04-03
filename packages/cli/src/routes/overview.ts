import type { FastifyInstance } from "fastify";
import { loadAllSessions, calculateCostWithoutCache } from "@sygil/core";
import type { TokenUsage, OverviewData } from "@sygil/core";

export function registerOverviewRoutes(app: FastifyInstance, claudeDir: string) {
  app.get("/api/overview", async (): Promise<OverviewData> => {
    const sessions = loadAllSessions(claudeDir);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const totalTokens: TokenUsage = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 };
    let estimatedCost = 0;
    let costWithoutCache = 0;
    const projectSet = new Set<string>();
    let sessionsToday = 0;
    let sessionsThisWeek = 0;
    let sessionsThisMonth = 0;
    const dailyMap = new Map<string, { tokens: number; cost: number; sessions: number }>();

    for (const s of sessions) {
      totalTokens.input += s.tokens.input;
      totalTokens.output += s.tokens.output;
      totalTokens.cacheCreation += s.tokens.cacheCreation;
      totalTokens.cacheRead += s.tokens.cacheRead;
      estimatedCost += s.cost;
      costWithoutCache += calculateCostWithoutCache(s.tokens, s.model);
      projectSet.add(s.projectPath);

      const d = new Date(s.startedAt);
      if (s.startedAt.slice(0, 10) === todayStr) sessionsToday++;
      if (d >= weekAgo) sessionsThisWeek++;
      if (d >= monthAgo) sessionsThisMonth++;

      const dateKey = s.startedAt.slice(0, 10);
      if (d >= monthAgo) {
        const existing = dailyMap.get(dateKey) || { tokens: 0, cost: 0, sessions: 0 };
        existing.tokens += s.tokens.input + s.tokens.output;
        existing.cost += s.cost;
        existing.sessions += 1;
        dailyMap.set(dateKey, existing);
      }
    }

    const projectCosts = new Map<string, number>();
    for (const s of sessions) {
      projectCosts.set(s.project, (projectCosts.get(s.project) || 0) + s.cost);
    }
    const mostActiveProject = Array.from(projectCosts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const cacheSavings = costWithoutCache - estimatedCost;

    return {
      totalTokens,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      costWithoutCache: Math.round(costWithoutCache * 100) / 100,
      cacheSavings: Math.round(cacheSavings * 100) / 100,
      sessionCount: sessions.length,
      projectCount: projectSet.size,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      avgTokensPerSession: sessions.length > 0 ? Math.round((totalTokens.input + totalTokens.output) / sessions.length) : 0,
      mostActiveProject,
      dailyUsage,
      recentSessions: sessions.slice(0, 10),
    };
  });
}
