import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { parseJsonlFile } from "./jsonl.js";
import { getProjectDirs } from "../detector.js";

interface FileChange {
  filePath: string;
  sessionId: string;
  project: string;
  timestamp: string;
  extension: string;
  hasSnapshot: boolean;
}

interface FileChangesResult {
  changes: FileChange[];
  mostTouched: { filePath: string; count: number }[];
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalFiles: number;
}

export function loadFileChanges(claudeDir: string, projectFilter?: string): FileChangesResult {
  const changes: FileChange[] = [];
  const touchMap = new Map<string, number>();
  let totalLinesAdded = 0;
  let totalLinesRemoved = 0;

  const fileHistoryDir = join(claudeDir, "file-history");
  const hasFileHistory = existsSync(fileHistoryDir);

  if (hasFileHistory) {
    try {
      const sessionDirs = readdirSync(fileHistoryDir, { withFileTypes: true })
        .filter(d => d.isDirectory());

      for (const dir of sessionDirs) {
        const sessionPath = join(fileHistoryDir, dir.name);
        const files = readdirSync(sessionPath).filter(f => !f.startsWith("."));
        for (const file of files) {
          const fullPath = join(sessionPath, file);
          const stat = statSync(fullPath);
          changes.push({
            filePath: file.replace(/@v\d+$/, ""),
            sessionId: dir.name,
            project: "",
            timestamp: stat.mtime.toISOString(),
            extension: extname(file).replace(/@v\d+$/, ""),
            hasSnapshot: true,
          });
          touchMap.set(file.replace(/@v\d+$/, ""), (touchMap.get(file.replace(/@v\d+$/, "")) || 0) + 1);
        }
      }
    } catch { /* skip */ }
  }

  // Also parse Edit/Write tool calls from session JSONL for file paths and line counts
  const projects = getProjectDirs(claudeDir);
  for (const project of projects) {
    if (projectFilter && project.hash !== projectFilter) continue;
    try {
      const files = readdirSync(project.path)
        .filter((f: string) => f.endsWith(".jsonl") && !f.endsWith(".wakatime"));

      for (const file of files) {
        const sessionId = basename(file, ".jsonl");
        const raw = parseJsonlFile<Record<string, unknown>>(join(project.path, file));

        for (const entry of raw) {
          if (entry.type !== "assistant") continue;
          const msg = (entry.message || entry) as Record<string, unknown>;
          const content = msg.content;
          if (!Array.isArray(content)) continue;

          for (const block of content) {
            if (typeof block !== "object" || block === null) continue;
            const b = block as Record<string, unknown>;
            if (b.type !== "tool_use") continue;
            const name = b.name as string;
            if (name !== "Edit" && name !== "Write" && name !== "MultiEdit") continue;

            const inp = b.input as Record<string, unknown> | undefined;
            if (!inp) continue;
            const fp = (inp.file_path || inp.filePath || "") as string;
            if (!fp) continue;

            const ext = extname(fp);
            touchMap.set(fp, (touchMap.get(fp) || 0) + 1);

            if (name === "Write") {
              const newContent = (inp.content || "") as string;
              totalLinesAdded += newContent.split("\n").length;
            } else if (name === "Edit" || name === "MultiEdit") {
              const oldStr = (inp.old_string || inp.oldString || "") as string;
              const newStr = (inp.new_string || inp.newString || "") as string;
              const oldLines = oldStr ? oldStr.split("\n").length : 0;
              const newLines = newStr ? newStr.split("\n").length : 0;
              totalLinesAdded += Math.max(0, newLines - oldLines);
              totalLinesRemoved += Math.max(0, oldLines - newLines);
            }

            if (!changes.find(c => c.filePath === fp && c.sessionId === sessionId)) {
              changes.push({
                filePath: fp,
                sessionId,
                project: project.hash,
                timestamp: (entry.timestamp as string) || "",
                extension: ext,
                hasSnapshot: false,
              });
            }
          }
        }
      }
    } catch { /* skip */ }
  }

  changes.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

  const mostTouched = Array.from(touchMap.entries())
    .map(([filePath, count]) => ({ filePath, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    changes,
    mostTouched,
    totalLinesAdded,
    totalLinesRemoved,
    totalFiles: touchMap.size,
  };
}
