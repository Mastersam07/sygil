import type { FastifyInstance } from "fastify";
import { loadAllSessions } from "@sygil/core";
import type { ProjectStats, TokenUsage } from "@sygil/core";

export function registerProjectRoutes(app: FastifyInstance, claudeDir: string) {
  app.get("/api/projects", async (): Promise<{ projects: ProjectStats[] }> => {
    const sessions = loadAllSessions(claudeDir);
    const projectMap = new Map<string, ProjectStats>();

    for (const s of sessions) {
      const existing = projectMap.get(s.projectPath) || {
        path: s.projectPath, name: s.project, hash: s.projectPath,
        messageCount: 0, duration: 0,
        sessionCount: 0, tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 } as TokenUsage,
        cost: 0, branches: [], lastActiveAt: "",
      };
      existing.sessionCount += 1;
      existing.messageCount += s.messageCount;
      existing.duration += s.duration;
      existing.tokens.input += s.tokens.input;
      existing.tokens.output += s.tokens.output;
      existing.tokens.cacheCreation += s.tokens.cacheCreation;
      existing.tokens.cacheRead += s.tokens.cacheRead;
      existing.cost += s.cost;
      if (s.branch && !existing.branches.includes(s.branch)) existing.branches.push(s.branch);
      if (s.startedAt > existing.lastActiveAt) existing.lastActiveAt = s.startedAt;
      projectMap.set(s.projectPath, existing);
    }

    const projects = Array.from(projectMap.values()).sort((a, b) => b.cost - a.cost);
    return { projects };
  });
}
