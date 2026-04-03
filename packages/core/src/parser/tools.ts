import { readdirSync } from "fs";
import { join } from "path";
import type { ToolCount } from "../types.js";
import { parseJsonlFile } from "./jsonl.js";
import { getProjectDirs } from "../detector.js";

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

export function computeToolUsage(claudeDir: string, projectFilter?: string): { toolCounts: ToolCount[]; readEditRatio: number; avgToolCallsPerSession: number } {
  const projects = getProjectDirs(claudeDir);
  const toolMap = new Map<string, number>();
  let totalCalls = 0;
  let sessionCount = 0;
  let reads = 0;
  let edits = 0;

  for (const project of projects) {
    if (projectFilter && project.hash !== projectFilter) continue;
    const files = readdirSync(project.path).filter((f: string) => f.endsWith(".jsonl") && !f.endsWith(".wakatime"));

    for (const file of files) {
      const raw = parseJsonlFile<Record<string, unknown>>(join(project.path, file));
      let hasTools = false;

      for (const entry of raw) {
        // New format: tool_use blocks are inside entry.message.content array
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
            }
          }
        }

        // Old format fallback: top-level tool_use type
        if (!hasTools && entry.type === "tool_use") {
          const toolName = (entry.name || (entry as Record<string, unknown>).tool_name) as string | undefined;
          if (toolName) {
            hasTools = true;
            totalCalls++;
            toolMap.set(toolName, (toolMap.get(toolName) || 0) + 1);
            if (toolName === "Read") reads++;
            if (toolName === "Edit" || toolName === "Write" || toolName === "MultiEdit") edits++;
          }
        }
      }

      if (hasTools) sessionCount++;
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

  return {
    toolCounts,
    readEditRatio: edits > 0 ? reads / edits : reads,
    avgToolCallsPerSession: sessionCount > 0 ? totalCalls / sessionCount : 0,
  };
}
