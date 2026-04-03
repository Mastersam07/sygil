import type { FastifyInstance } from "fastify";
import { loadAllSessions, computeTokenAnalytics, computeToolAnalytics, computeActivity, computeGitStats, loadHistory } from "@sygil/core";

export function registerExportRoutes(app: FastifyInstance, claudeDir: string) {
  app.get<{ Querystring: { format?: string; scope?: string } }>("/api/export", async (req, reply) => {
    const format = req.query.format || "json";
    const sessions = loadAllSessions(claudeDir);

    if (format === "csv") {
      const lines = ["session_id,project,branch,started_at,duration_ms,messages,input_tokens,output_tokens,cache_creation,cache_read,cost,model"];
      for (const s of sessions) {
        lines.push([
          s.id, `"${s.project}"`, s.branch || "", s.startedAt, s.duration,
          s.messageCount, s.tokens.input, s.tokens.output,
          s.tokens.cacheCreation, s.tokens.cacheRead,
          s.cost.toFixed(4), s.model,
        ].join(","));
      }
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", "attachment; filename=sygil-export.csv");
      return lines.join("\n");
    }

    const analytics = computeTokenAnalytics(sessions);
    const tools = computeToolAnalytics(claudeDir);
    const activity = computeActivity(sessions);
    const git = computeGitStats(sessions);
    const history = loadHistory(claudeDir);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: "0.3.0",
      sessions,
      analytics,
      tools,
      activity,
      git,
      history,
    };

    reply.header("Content-Type", "application/json");
    reply.header("Content-Disposition", "attachment; filename=sygil-export.json");
    return payload;
  });

  app.get<{ Params: { id: string } }>("/api/export/session/:id/markdown", async (req, reply) => {
    const { loadSessionDetail } = await import("@sygil/core");
    const detail = loadSessionDetail(claudeDir, req.params.id);
    if (!detail) { reply.code(404); return { error: "Session not found" }; }

    const lines: string[] = [];
    lines.push(`# ${detail.metadata.title}`);
    lines.push(`**Project:** ${detail.metadata.project}  `);
    lines.push(`**Branch:** ${detail.metadata.branch || "—"}  `);
    lines.push(`**Date:** ${detail.metadata.startedAt}  `);
    lines.push(`**Model:** ${detail.metadata.model}  `);
    lines.push(`**Cost:** $${detail.totalCost.toFixed(2)}  `);
    lines.push("");
    lines.push("---");
    lines.push("");

    for (const msg of detail.messages) {
      if (msg.isCompaction) {
        lines.push("*— context compacted —*\n");
        continue;
      }
      if (msg.toolName) {
        lines.push(`> **Tool:** \`${msg.toolName}\``);
        if (msg.toolInput) lines.push(`> \`\`\`\n> ${msg.toolInput.slice(0, 500)}\n> \`\`\``);
        lines.push("");
        continue;
      }
      if (msg.toolResult) {
        lines.push(`> **Result:**\n> \`\`\`\n> ${msg.toolResult.slice(0, 500)}\n> \`\`\`\n`);
        continue;
      }
      const label = msg.role === "user" ? "**You**" : "**Claude**";
      lines.push(`${label}:\n\n${msg.content}\n`);
    }

    reply.header("Content-Type", "text/markdown");
    reply.header("Content-Disposition", `attachment; filename=session-${req.params.id.slice(0, 8)}.md`);
    return lines.join("\n");
  });

  app.post("/api/import", async (req) => {
    const body = req.body as Record<string, unknown>;
    if (!body || !body.version) {
      return { error: "Invalid import format. Expected a Sygil JSON export." };
    }
    const sessions = (body.sessions || []) as Array<{ id: string }>;
    const existingSessions = loadAllSessions(claudeDir);
    const existingIds = new Set(existingSessions.map(s => s.id));
    const newSessions = sessions.filter(s => !existingIds.has(s.id));

    return {
      preview: true,
      totalInFile: sessions.length,
      alreadyExists: sessions.length - newSessions.length,
      willImport: newSessions.length,
      newSessionIds: newSessions.map(s => s.id),
    };
  });
}
