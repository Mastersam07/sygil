import type { FastifyInstance } from "fastify";
import { loadDiagnostics } from "@sygil/core";

export function registerDiagnosticRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { sessionId?: string; severity?: string } }>("/api/diagnostics", async (req) => {
    const result = loadDiagnostics(claudeDir, req.query.sessionId);
    if (req.query.severity) {
      const sev = req.query.severity;
      result.entries = result.entries.filter(e => {
        if (sev === "slow") return e.message.includes("SLOW");
        if (sev === "error") return e.level === "ERROR" || e.message.toLowerCase().includes("error");
        return true;
      });
    }
    return result;
  });
}
