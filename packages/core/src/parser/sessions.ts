import { readFileSync, existsSync, readdirSync } from "fs";
import { join, basename } from "path";
import type { SessionMeta, SessionMessage, SessionDetail, TokenUsage } from "../types.js";
import { parseJsonlFile } from "./jsonl.js";
import { calculateCost } from "../pricing.js";
import { getProjectDirs } from "../detector.js";

interface RawIndexEntry {
  sessionId?: string;
  id?: string;
  firstPrompt?: string;
  summary?: string;
  messageCount?: number;
  gitBranch?: string;
  created?: string;
  modified?: string;
  createdAt?: string;
  lastModified?: string;
  model?: string;
}

function extractProjectName(hash: string): string {
  const parts = hash.replace(/^-+/, "").split("-");
  const desktopIdx = parts.indexOf("Desktop");
  if (desktopIdx >= 0 && desktopIdx < parts.length - 1) {
    return parts.slice(desktopIdx + 1).join("-");
  }
  return parts.slice(-2).join("/") || hash.slice(0, 12);
}

const SKIP_TYPES = new Set(["queue-operation", "file-history-snapshot", "progress", "last-prompt", "attachment"]);

function detectBadges(raw: Record<string, unknown>[]): string[] {
  const badges: string[] = [];
  let hasAgent = false;
  let hasMcp = false;
  let hasWeb = false;
  let hasThinking = false;
  let hasCompaction = false;

  for (const entry of raw) {
    if (SKIP_TYPES.has(entry.type as string)) continue;
    const msg = entry.message as Record<string, unknown> | undefined;
    if (!msg) continue;
    const content = msg.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (typeof block !== "object" || block === null) continue;
      const b = block as Record<string, unknown>;
      if (b.type === "tool_use") {
        const name = b.name as string;
        if (name === "Agent" || name === "SubAgent") hasAgent = true;
        if (name?.startsWith("mcp__")) hasMcp = true;
        if (name === "WebSearch" || name === "WebFetch") hasWeb = true;
      }
      if (b.type === "thinking") hasThinking = true;
    }

    if (entry.type === "system" && msg.content) {
      const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      if (text.includes("compaction") || text.includes("auto_compact")) hasCompaction = true;
    }
  }

  if (hasCompaction) badges.push("compacted");
  if (hasAgent) badges.push("agent");
  if (hasMcp) badges.push("mcp");
  if (hasWeb) badges.push("web");
  if (hasThinking) badges.push("thinking");
  return badges;
}

export function loadSessionIndex(projectDir: string): RawIndexEntry[] {
  const indexPath = join(projectDir, "sessions-index.json");
  if (!existsSync(indexPath)) return [];
  try {
    const data = JSON.parse(readFileSync(indexPath, "utf-8"));
    if (data && Array.isArray(data.entries)) return data.entries;
    return Array.isArray(data) ? data : Object.values(data);
  } catch {
    return [];
  }
}

export function getSessionFiles(projectDir: string): string[] {
  try {
    return readdirSync(projectDir)
      .filter((f: string) => f.endsWith(".jsonl") && !f.endsWith(".wakatime"))
      .map((f: string) => join(projectDir, f));
  } catch {
    return [];
  }
}

function parseRawMessages(raw: Record<string, unknown>[]): { messages: SessionMessage[]; tokens: TokenUsage; cost: number; model: string; badges: string[] } {
  const messages: SessionMessage[] = [];
  const tokens: TokenUsage = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 };
  let cost = 0;
  let model = "claude-sonnet-4";
  const badges = detectBadges(raw);

  for (const entry of raw) {
    const entryType = entry.type as string;
    if (SKIP_TYPES.has(entryType)) continue;

    const msg = (entry.message || entry) as Record<string, unknown>;
    const role = entryType === "user" ? "user"
      : entryType === "assistant" ? "assistant"
      : (msg.role as string) === "user" ? "user"
      : (msg.role as string) === "assistant" ? "assistant"
      : "system";

    const usage = (msg.usage || entry.usage) as Record<string, number> | undefined;
    const msgTokens = {
      input: usage?.input_tokens || 0,
      output: usage?.output_tokens || 0,
    };
    const cacheCreate = usage?.cache_creation_input_tokens || 0;
    const cacheRead = usage?.cache_read_input_tokens || 0;

    tokens.input += msgTokens.input;
    tokens.output += msgTokens.output;
    tokens.cacheCreation += cacheCreate;
    tokens.cacheRead += cacheRead;

    const entryModel = (msg.model || entry.model) as string | undefined;
    if (entryModel && entryModel !== "<synthetic>") model = entryModel;

    const msgCost = calculateCost({ ...msgTokens, cacheCreation: cacheCreate, cacheRead }, model);
    cost += msgCost;

    let content = "";
    let toolName: string | undefined;
    let toolInput: string | undefined;
    let toolResult: string | undefined;
    const isCompaction = entryType === "system" && (
      JSON.stringify(msg.content || "").includes("compaction") ||
      JSON.stringify(msg.content || "").includes("auto_compact")
    );

    const rawContent = msg.content;
    if (typeof rawContent === "string") {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      const textParts: string[] = [];
      for (const block of rawContent) {
        if (typeof block === "string") {
          textParts.push(block);
        } else if (typeof block === "object" && block !== null) {
          const b = block as Record<string, unknown>;
          if (b.type === "text" && typeof b.text === "string") {
            textParts.push(b.text);
          } else if (b.type === "tool_use") {
            toolName = b.name as string;
            toolInput = typeof b.input === "object" ? JSON.stringify(b.input) : undefined;
          } else if (b.type === "tool_result") {
            toolResult = typeof b.content === "string" ? b.content : JSON.stringify(b.content);
          } else if (b.type === "thinking" && typeof b.thinking === "string") {
            textParts.push(b.thinking);
          }
        }
      }
      content = textParts.join("\n");
    }

    if (!toolName && (entry.name || (entry as Record<string, unknown>).tool_name)) {
      toolName = (entry.name || (entry as Record<string, unknown>).tool_name) as string;
      toolInput = typeof entry.input === "object" ? JSON.stringify(entry.input) : undefined;
    }

    const timestamp = (entry.timestamp as string) || (msg.timestamp as string) || "";

    if (content || toolName || toolResult || isCompaction) {
      messages.push({
        role: role as SessionMessage["role"],
        type: entryType || "text",
        content,
        tokens: msgTokens,
        cost: msgCost,
        timestamp,
        toolName,
        toolInput,
        toolResult,
        isCompaction: isCompaction || undefined,
      });
    }
  }

  return { messages, tokens, cost, model, badges };
}

export function loadAllSessions(claudeDir: string): SessionMeta[] {
  const projects = getProjectDirs(claudeDir);
  const sessions: SessionMeta[] = [];

  for (const project of projects) {
    const indexEntries = loadSessionIndex(project.path);
    const sessionFiles = getSessionFiles(project.path);
    const projectName = extractProjectName(project.hash);

    const indexMap = new Map<string, RawIndexEntry>();
    for (const entry of indexEntries) {
      const id = entry.sessionId || entry.id;
      if (id) indexMap.set(id, entry);
    }

    for (const file of sessionFiles) {
      const id = basename(file, ".jsonl");
      const indexEntry = indexMap.get(id);
      const raw = parseJsonlFile<Record<string, unknown>>(file);
      if (raw.length === 0) continue;

      const { tokens, cost, model, badges } = parseRawMessages(raw);
      const totalTokens = tokens.input + tokens.output + tokens.cacheCreation + tokens.cacheRead;
      if (totalTokens === 0 && raw.length < 2) continue;

      const startedAt = indexEntry?.created || indexEntry?.createdAt
        || (raw[0] as Record<string, unknown>)?.timestamp as string
        || "";
      const lastActiveAt = indexEntry?.modified || indexEntry?.lastModified
        || (raw[raw.length - 1] as Record<string, unknown>)?.timestamp as string
        || "";

      const start = new Date(startedAt).getTime();
      const end = new Date(lastActiveAt).getTime();
      const duration = (start && end && !isNaN(start) && !isNaN(end)) ? Math.max(0, end - start) : 0;

      let title = indexEntry?.summary || indexEntry?.firstPrompt || `Session ${id.slice(0, 8)}`;
      if (title.length > 120) title = title.slice(0, 117) + "...";
      title = title.replace(/<[^>]+>/g, "").trim() || `Session ${id.slice(0, 8)}`;

      sessions.push({
        id,
        title,
        project: projectName,
        projectPath: project.hash,
        branch: indexEntry?.gitBranch || (raw[0] as Record<string, unknown>)?.gitBranch as string || null,
        startedAt,
        lastActiveAt,
        duration,
        messageCount: indexEntry?.messageCount || raw.filter((e: Record<string, unknown>) => !SKIP_TYPES.has(e.type as string)).length,
        tokens,
        cost,
        model,
        badges,
      });
    }
  }

  return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function loadSessionDetail(claudeDir: string, sessionId: string): SessionDetail | null {
  const projects = getProjectDirs(claudeDir);

  for (const project of projects) {
    const filePath = join(project.path, `${sessionId}.jsonl`);
    if (!existsSync(filePath)) continue;

    const raw = parseJsonlFile<Record<string, unknown>>(filePath);
    const { messages, tokens, cost, model, badges } = parseRawMessages(raw);
    const projectName = extractProjectName(project.hash);

    const indexEntries = loadSessionIndex(project.path);
    const indexEntry = indexEntries.find(e => (e.sessionId || e.id) === sessionId);

    let cumTokens = 0;
    let cumCost = 0;
    const tokenTimeline = messages.map((m, i) => {
      cumTokens += m.tokens.input + m.tokens.output;
      cumCost += m.cost;
      return { messageIndex: i, cumulativeTokens: cumTokens, cumulativeCost: cumCost };
    });

    const startedAt = indexEntry?.created || indexEntry?.createdAt || messages[0]?.timestamp || "";
    const lastActiveAt = indexEntry?.modified || indexEntry?.lastModified || messages[messages.length - 1]?.timestamp || "";

    return {
      metadata: {
        id: sessionId,
        title: indexEntry?.summary || indexEntry?.firstPrompt?.slice(0, 120) || `Session ${sessionId.slice(0, 8)}`,
        project: projectName,
        projectPath: project.hash,
        branch: indexEntry?.gitBranch || null,
        startedAt,
        lastActiveAt,
        duration: 0,
        messageCount: messages.length,
        tokens,
        cost,
        model,
        badges,
      },
      messages,
      totalTokens: tokens,
      totalCost: cost,
      tokenTimeline,
    };
  }

  return null;
}
