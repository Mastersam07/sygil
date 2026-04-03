import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { ToolCount } from "../types.js";
import { parseJsonlFile } from "./jsonl.js";
import { getProjectDirs } from "../detector.js";
import { homedir } from "os";

const TOOL_CATEGORIES: Record<string, string> = {
  Read: "file-io", Edit: "file-io", Write: "file-io", MultiEdit: "file-io",
  Bash: "shell", NotebookEdit: "file-io",
  Grep: "search", Glob: "search",
  Agent: "agent", SubAgent: "agent",
  WebFetch: "web", WebSearch: "web",
  TodoRead: "planning", TodoWrite: "planning",
  Plan: "planning", Think: "planning",
  ToolSearch: "search", Task: "planning",
};

interface ToolAnalyticsResult {
  toolCounts: ToolCount[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  readEditRatio: number;
  avgToolCallsPerSession: number;
  bashCommands: { command: string; count: number }[];
  mcpServers: { server: string; tools: string[]; totalCalls: number }[];
  featureAdoption: { feature: string; sessionCount: number; percentage: number }[];
  ccVersions: { version: string; firstSeen: string; lastSeen: string }[];
}

export function computeToolAnalytics(claudeDir: string, projectFilter?: string): ToolAnalyticsResult {
  const projects = getProjectDirs(claudeDir);
  const toolMap = new Map<string, number>();
  const bashCmds = new Map<string, number>();
  const mcpMap = new Map<string, Set<string>>();
  const mcpCalls = new Map<string, number>();
  const versionMap = new Map<string, { first: string; last: string }>();
  let totalCalls = 0;
  let sessionCount = 0;
  let reads = 0;
  let edits = 0;

  let sessionsWithAgent = 0;
  let sessionsWithMcp = 0;
  let sessionsWithWeb = 0;
  let sessionsWithThinking = 0;
  let totalSessions = 0;

  for (const project of projects) {
    if (projectFilter && project.hash !== projectFilter) continue;
    const files = readdirSync(project.path).filter((f: string) => f.endsWith(".jsonl") && !f.endsWith(".wakatime"));

    for (const file of files) {
      const raw = parseJsonlFile<Record<string, unknown>>(join(project.path, file));
      let hasTools = false;
      let sessionHasAgent = false;
      let sessionHasMcp = false;
      let sessionHasWeb = false;
      let sessionHasThinking = false;
      totalSessions++;

      for (const entry of raw) {
        const version = entry.version as string | undefined;
        const ts = entry.timestamp as string | undefined;
        if (version && ts) {
          const existing = versionMap.get(version);
          if (!existing) {
            versionMap.set(version, { first: ts, last: ts });
          } else {
            if (ts < existing.first) existing.first = ts;
            if (ts > existing.last) existing.last = ts;
          }
        }

        const msg = (entry.message || entry) as Record<string, unknown>;
        const content = msg.content;

        if (Array.isArray(content)) {
          for (const block of content) {
            if (typeof block !== "object" || block === null) continue;
            const b = block as Record<string, unknown>;

            if (b.type === "tool_use" && b.name) {
              const toolName = b.name as string;
              hasTools = true;
              totalCalls++;
              toolMap.set(toolName, (toolMap.get(toolName) || 0) + 1);

              if (toolName === "Read") reads++;
              if (toolName === "Edit" || toolName === "Write" || toolName === "MultiEdit") edits++;
              if (toolName === "Agent" || toolName === "SubAgent") sessionHasAgent = true;
              if (toolName === "WebSearch" || toolName === "WebFetch") sessionHasWeb = true;

              if (toolName.startsWith("mcp__")) {
                sessionHasMcp = true;
                const parts = toolName.split("__");
                const server = parts[1] || "unknown";
                if (!mcpMap.has(server)) mcpMap.set(server, new Set());
                mcpMap.get(server)!.add(toolName);
                mcpCalls.set(server, (mcpCalls.get(server) || 0) + 1);
              }

              if (toolName === "Bash") {
                const inp = b.input as Record<string, unknown> | undefined;
                if (inp && typeof inp.command === "string") {
                  const first = inp.command.trim().split(/\s+/)[0];
                  if (first && !first.startsWith("#")) {
                    bashCmds.set(first, (bashCmds.get(first) || 0) + 1);
                  }
                }
              }
            }

            if (b.type === "thinking") sessionHasThinking = true;
          }
        }
      }

      if (hasTools) sessionCount++;
      if (sessionHasAgent) sessionsWithAgent++;
      if (sessionHasMcp) sessionsWithMcp++;
      if (sessionHasWeb) sessionsWithWeb++;
      if (sessionHasThinking) sessionsWithThinking++;
    }
  }

  const toolCounts: ToolCount[] = Array.from(toolMap.entries())
    .map(([tool, count]) => ({
      tool,
      category: TOOL_CATEGORIES[tool] || (tool.startsWith("mcp__") ? "mcp" : "other"),
      count,
      percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const catMap = new Map<string, number>();
  for (const tc of toolCounts) {
    catMap.set(tc.category, (catMap.get(tc.category) || 0) + tc.count);
  }
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count, percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);

  const bashCommands = Array.from(bashCmds.entries())
    .map(([command, count]) => ({ command, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const mcpServers = Array.from(mcpMap.entries())
    .map(([server, tools]) => ({ server, tools: Array.from(tools), totalCalls: mcpCalls.get(server) || 0 }))
    .sort((a, b) => b.totalCalls - a.totalCalls);

  const pct = (n: number) => totalSessions > 0 ? (n / totalSessions) * 100 : 0;
  const featureAdoption = [
    { feature: "Agents", sessionCount: sessionsWithAgent, percentage: pct(sessionsWithAgent) },
    { feature: "MCP Tools", sessionCount: sessionsWithMcp, percentage: pct(sessionsWithMcp) },
    { feature: "Web Search", sessionCount: sessionsWithWeb, percentage: pct(sessionsWithWeb) },
    { feature: "Thinking", sessionCount: sessionsWithThinking, percentage: pct(sessionsWithThinking) },
  ];

  const ccVersions = Array.from(versionMap.entries())
    .map(([version, { first, last }]) => ({ version, firstSeen: first, lastSeen: last }))
    .sort((a, b) => a.firstSeen.localeCompare(b.firstSeen));

  return {
    toolCounts,
    categoryBreakdown,
    readEditRatio: edits > 0 ? reads / edits : reads,
    avgToolCallsPerSession: sessionCount > 0 ? totalCalls / sessionCount : 0,
    bashCommands,
    mcpServers,
    featureAdoption,
    ccVersions,
  };
}

// Keep the simple version for backward compat with existing analytics route
export function computeToolUsage(claudeDir: string, projectFilter?: string): { toolCounts: ToolCount[]; readEditRatio: number; avgToolCallsPerSession: number } {
  const result = computeToolAnalytics(claudeDir, projectFilter);
  return { toolCounts: result.toolCounts, readEditRatio: result.readEditRatio, avgToolCallsPerSession: result.avgToolCallsPerSession };
}
