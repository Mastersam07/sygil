import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { parseJsonlFile } from "./jsonl.js";
import { getProjectDirs } from "../detector.js";

export interface DiffLine {
  type: "add" | "remove" | "context";
  lineNumber: number;
  content: string;
}

export interface FileDiff {
  fileHash: string;
  filePath: string;
  sessionId: string;
  versionBefore: number;
  versionAfter: number;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

function computeSimpleDiff(before: string, after: string): { lines: DiffLine[]; additions: number; deletions: number } {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const result: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;

  const maxLen = Math.max(oldLines.length, newLines.length);
  let oi = 0;
  let ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: "context", lineNumber: ni + 1, content: newLines[ni] });
      oi++;
      ni++;
    } else {
      let found = false;
      for (let look = 1; look < 6 && !found; look++) {
        if (ni + look < newLines.length && oi < oldLines.length && oldLines[oi] === newLines[ni + look]) {
          for (let j = 0; j < look; j++) {
            result.push({ type: "add", lineNumber: ni + j + 1, content: newLines[ni + j] });
            additions++;
          }
          ni += look;
          found = true;
        }
        if (oi + look < oldLines.length && ni < newLines.length && oldLines[oi + look] === newLines[ni]) {
          for (let j = 0; j < look; j++) {
            result.push({ type: "remove", lineNumber: oi + j + 1, content: oldLines[oi + j] });
            deletions++;
          }
          oi += look;
          found = true;
        }
      }
      if (!found) {
        if (oi < oldLines.length) {
          result.push({ type: "remove", lineNumber: oi + 1, content: oldLines[oi] });
          deletions++;
          oi++;
        }
        if (ni < newLines.length) {
          result.push({ type: "add", lineNumber: ni + 1, content: newLines[ni] });
          additions++;
          ni++;
        }
      }
    }

    if (result.length > maxLen + 500) break;
  }

  return { lines: result, additions, deletions };
}

export function getFileVersions(claudeDir: string, sessionId: string, fileHash: string): FileDiff | null {
  const dir = join(claudeDir, "file-history", sessionId);
  if (!existsSync(dir)) return null;

  try {
    const files = readdirSync(dir)
      .filter(f => f.startsWith(fileHash + "@v"))
      .sort((a, b) => {
        const va = parseInt(a.split("@v")[1]);
        const vb = parseInt(b.split("@v")[1]);
        return va - vb;
      });

    if (files.length < 2) return null;

    const beforeFile = files[files.length - 2];
    const afterFile = files[files.length - 1];
    const before = readFileSync(join(dir, beforeFile), "utf-8");
    const after = readFileSync(join(dir, afterFile), "utf-8");

    const vBefore = parseInt(beforeFile.split("@v")[1]);
    const vAfter = parseInt(afterFile.split("@v")[1]);

    const { lines, additions, deletions } = computeSimpleDiff(before, after);

    return {
      fileHash,
      filePath: fileHash,
      sessionId,
      versionBefore: vBefore,
      versionAfter: vAfter,
      lines,
      additions,
      deletions,
    };
  } catch {
    return null;
  }
}

export function getSessionDiffs(claudeDir: string, sessionId: string): FileDiff[] {
  const dir = join(claudeDir, "file-history", sessionId);
  if (!existsSync(dir)) return [];

  try {
    const allFiles = readdirSync(dir).filter(f => !f.startsWith("."));
    const hashes = [...new Set(allFiles.map(f => f.split("@v")[0]))];

    const diffs: FileDiff[] = [];
    for (const hash of hashes) {
      const diff = getFileVersions(claudeDir, sessionId, hash);
      if (diff) diffs.push(diff);
    }
    return diffs;
  } catch {
    return [];
  }
}

export function resolveFileHash(claudeDir: string, sessionId: string): Map<string, string> {
  const mapping = new Map<string, string>();
  const projects = getProjectDirs(claudeDir);

  for (const project of projects) {
    const sessionFile = join(project.path, `${sessionId}.jsonl`);
    if (!existsSync(sessionFile)) continue;

    const raw = parseJsonlFile<Record<string, unknown>>(sessionFile);
    for (const entry of raw) {
      if (entry.type !== "file-history-snapshot") continue;
      const snap = entry.snapshot as Record<string, unknown> | undefined;
      if (!snap) continue;
      const backups = snap.trackedFileBackups as Record<string, Record<string, unknown>> | undefined;
      if (!backups) continue;
      for (const [path, info] of Object.entries(backups)) {
        const backupName = info?.backupFileName as string | undefined;
        if (backupName) {
          const hash = backupName.split("@v")[0];
          mapping.set(hash, path);
        }
      }
    }
    break;
  }

  return mapping;
}

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
