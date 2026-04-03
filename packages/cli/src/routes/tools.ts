import type { FastifyInstance } from "fastify";
import { computeToolAnalytics } from "@sygil/core";

export function registerToolRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { project?: string } }>("/api/tools", async (req) => {
    return computeToolAnalytics(claudeDir, req.query.project);
  });
}
