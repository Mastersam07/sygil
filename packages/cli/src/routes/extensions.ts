import type { FastifyInstance } from "fastify";
import { loadExtensions } from "@sygil/core";

export function registerExtensionRoutes(app: FastifyInstance, claudeDir: string) {
  app.get("/api/extensions", async () => {
    return loadExtensions(claudeDir);
  });
}
