import { join } from "path";
import type { HistoryEntry } from "../types.js";
import { parseJsonlFile } from "./jsonl.js";

interface RawHistoryEntry {
  display?: string;
  query?: string;
  prompt?: string;
  timestamp?: string | number;
  project?: string;
  cwd?: string;
  projectPath?: string;
  sessionId?: string;
  session_id?: string;
}

export function loadHistory(claudeDir: string): HistoryEntry[] {
  const filePath = join(claudeDir, "history.jsonl");
  const raw = parseJsonlFile<RawHistoryEntry>(filePath);

  return raw
    .map(entry => {
      // Timestamp can be numeric (ms) or ISO string
      let ts = "";
      if (typeof entry.timestamp === "number") {
        ts = new Date(entry.timestamp).toISOString();
      } else if (typeof entry.timestamp === "string") {
        ts = entry.timestamp;
      }

      return {
        prompt: entry.display || entry.query || entry.prompt || "",
        timestamp: ts,
        projectPath: entry.project || entry.cwd || entry.projectPath || "",
        sessionId: entry.sessionId || entry.session_id || "",
      };
    })
    .filter(e => e.prompt)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function searchHistory(entries: HistoryEntry[], query: string): HistoryEntry[] {
  const lower = query.toLowerCase();
  return entries.filter(e => e.prompt.toLowerCase().includes(lower));
}
