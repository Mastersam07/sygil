import type { FastifyInstance } from "fastify";
import { loadAllSessions, computeActivity } from "@sygil/core";

export function registerActivityRoutes(app: FastifyInstance, claudeDir: string) {
  app.get("/api/activity", async () => {
    const sessions = loadAllSessions(claudeDir);
    return computeActivity(sessions);
  });
}
