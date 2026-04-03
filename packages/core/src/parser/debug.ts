import { existsSync, readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

interface DebugEntry {
  timestamp: string;
  level: string;
  message: string;
  sessionId: string;
}

interface SlowOp {
  operation: string;
  durationMs: number;
  detail: string;
  sessionId: string;
  timestamp: string;
}

interface SessionHealth {
  sessionId: string;
  errorCount: number;
  slowOpCount: number;
  lspEventCount: number;
  score: number;
}

interface DiagnosticsResult {
  entries: DebugEntry[];
  slowOps: SlowOp[];
  errorsByCategory: { category: string; count: number }[];
  sessionHealth: SessionHealth[];
  totalErrors: number;
  totalSlowOps: number;
}

export function loadDiagnostics(claudeDir: string, sessionFilter?: string): DiagnosticsResult {
  const debugDir = join(claudeDir, "debug");
  if (!existsSync(debugDir)) return { entries: [], slowOps: [], errorsByCategory: [], sessionHealth: [], totalErrors: 0, totalSlowOps: 0 };

  const entries: DebugEntry[] = [];
  const slowOps: SlowOp[] = [];
  const errorCats = new Map<string, number>();
  const healthMap = new Map<string, { errors: number; slow: number; lsp: number }>();

  try {
    const files = readdirSync(debugDir).filter(f => f.endsWith(".txt"));

    for (const file of files) {
      const sessionId = basename(file, ".txt");
      if (sessionFilter && sessionId !== sessionFilter) continue;

      const health = { errors: 0, slow: 0, lsp: 0 };

      try {
        const content = readFileSync(join(debugDir, file), "utf-8");
        const lines = content.split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;

          const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[(\w+)\]\s+(.*)/);
          if (!tsMatch) continue;

          const [, timestamp, level, message] = tsMatch;

          entries.push({ timestamp, level, message, sessionId });

          if (message.includes("SLOW OPERATION") || message.includes("SLOW")) {
            health.slow++;
            const durationMatch = message.match(/\(([0-9.]+)ms\)/);
            const opMatch = message.match(/SLOW[^)]*\]\s*(\S+)/);
            slowOps.push({
              operation: opMatch?.[1] || "unknown",
              durationMs: durationMatch ? parseFloat(durationMatch[1]) : 0,
              detail: message,
              sessionId,
              timestamp,
            });
          }

          if (level === "ERROR" || message.toLowerCase().includes("error")) {
            health.errors++;
            const cat = message.includes("LSP") ? "LSP"
              : message.includes("auth") ? "Auth"
              : message.includes("network") ? "Network"
              : message.includes("timeout") ? "Timeout"
              : message.includes("ENOENT") ? "File Not Found"
              : "Other";
            errorCats.set(cat, (errorCats.get(cat) || 0) + 1);
          }

          if (message.includes("LSP")) {
            health.lsp++;
          }
        }
      } catch { /* skip */ }

      healthMap.set(sessionId, health);
    }
  } catch { /* skip */ }

  slowOps.sort((a, b) => b.durationMs - a.durationMs);

  const sessionHealth: SessionHealth[] = Array.from(healthMap.entries()).map(([sessionId, h]) => ({
    sessionId,
    errorCount: h.errors,
    slowOpCount: h.slow,
    lspEventCount: h.lsp,
    score: Math.max(0, Math.min(100, 100 - h.errors * 10 - h.slow * 2)),
  })).sort((a, b) => a.score - b.score);

  return {
    entries,
    slowOps,
    errorsByCategory: Array.from(errorCats.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    sessionHealth,
    totalErrors: entries.filter(e => e.level === "ERROR").length,
    totalSlowOps: slowOps.length,
  };
}
