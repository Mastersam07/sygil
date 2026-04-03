import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename } from "path";
import { getProjectDirs } from "../detector.js";

type MemoryType = "user" | "feedback" | "project" | "reference" | "index" | "unknown";

interface MemoryFile {
  path: string;
  name: string;
  projectSlug: string;
  type: MemoryType;
  description: string;
  content: string;
  modifiedAt: string;
  isStale: boolean;
  staleReason?: "age" | "missing_session";
  missingSessionId?: string;
  isIndex: boolean;
}

interface MemoryResult {
  files: MemoryFile[];
  countByProject: { project: string; count: number }[];
  countByType: { type: string; count: number }[];
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }
  return { meta, body: match[2].trim() };
}

function detectType(filename: string, meta: Record<string, string>): MemoryType {
  if (meta.type) {
    const t = meta.type.toLowerCase();
    if (["user", "feedback", "project", "reference", "index"].includes(t)) return t as MemoryType;
  }
  if (filename === "MEMORY.md") return "index";
  const lower = filename.toLowerCase();
  if (lower.includes("user")) return "user";
  if (lower.includes("feedback")) return "feedback";
  if (lower.includes("project")) return "project";
  if (lower.includes("reference")) return "reference";
  return "unknown";
}

function collectSessionIds(claudeDir: string): Set<string> {
  const sessionIds = new Set<string>();

  for (const project of getProjectDirs(claudeDir)) {
    try {
      const files = readdirSync(project.path).filter(file => file.endsWith(".jsonl") && !file.endsWith(".wakatime"));
      for (const file of files) {
        sessionIds.add(basename(file, ".jsonl"));
      }
    } catch {
      continue;
    }
  }

  return sessionIds;
}

function findMissingSessionReference(content: string, sessionIds: Set<string>): string | undefined {
  const matches = content.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi) || [];
  return matches.find(match => !sessionIds.has(match));
}

export function loadMemory(claudeDir: string): MemoryResult {
  const files: MemoryFile[] = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const projects = getProjectDirs(claudeDir);
  const sessionIds = collectSessionIds(claudeDir);

  for (const project of projects) {
    const memDir = join(project.path, "memory");
    if (!existsSync(memDir)) continue;

    try {
      const mdFiles = readdirSync(memDir).filter(f => f.endsWith(".md"));
      for (const file of mdFiles) {
        try {
          const fullPath = join(memDir, file);
          const raw = readFileSync(fullPath, "utf-8");
          const stat = statSync(fullPath);
          const { meta, body } = parseFrontmatter(raw);
          const isIndex = file === "MEMORY.md";
          const type = detectType(file, meta);
          const missingSessionId = findMissingSessionReference(raw, sessionIds);
          const staleReason = missingSessionId ? "missing_session" : stat.mtime.getTime() < thirtyDaysAgo ? "age" : undefined;

          files.push({
            path: fullPath,
            name: meta.name || (isIndex ? "Memory Index" : basename(file, ".md")),
            projectSlug: project.hash,
            type,
            description: meta.description || "",
            content: isIndex ? raw : body,
            modifiedAt: stat.mtime.toISOString(),
            isStale: Boolean(staleReason),
            staleReason,
            missingSessionId,
            isIndex,
          });
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  // Also check global memory
  const globalMem = join(claudeDir, "memory");
  if (existsSync(globalMem)) {
    try {
      const mdFiles = readdirSync(globalMem).filter(f => f.endsWith(".md"));
      for (const file of mdFiles) {
        try {
          const fullPath = join(globalMem, file);
          const raw = readFileSync(fullPath, "utf-8");
          const stat = statSync(fullPath);
          const { meta, body } = parseFrontmatter(raw);
          const missingSessionId = findMissingSessionReference(raw, sessionIds);
          const staleReason = missingSessionId ? "missing_session" : stat.mtime.getTime() < thirtyDaysAgo ? "age" : undefined;

          files.push({
            path: fullPath,
            name: meta.name || basename(file, ".md"),
            projectSlug: "(global)",
            type: detectType(file, meta),
            description: meta.description || "",
            content: file === "MEMORY.md" ? raw : body,
            modifiedAt: stat.mtime.toISOString(),
            isStale: Boolean(staleReason),
            staleReason,
            missingSessionId,
            isIndex: file === "MEMORY.md",
          });
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  const projectMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  for (const f of files) {
    projectMap.set(f.projectSlug, (projectMap.get(f.projectSlug) || 0) + 1);
    typeMap.set(f.type, (typeMap.get(f.type) || 0) + 1);
  }

  return {
    files,
    countByProject: Array.from(projectMap.entries()).map(([project, count]) => ({ project, count })).sort((a, b) => b.count - a.count),
    countByType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  };
}
