import type { FastifyInstance } from "fastify";
import { loadClaudeConfig } from "@sygil/core";

export function registerConfigRoutes(app: FastifyInstance, claudeDir: string) {
  app.get("/api/config", async () => {
    return loadClaudeConfig(claudeDir);
  });
}
