import { existsSync, readdirSync, readFileSync } from "fs";
import { basename } from "path";
import { getProjectDirs } from "./detector.js";
import { loadHistory } from "./parser/history.js";

export interface ProjectRootInfo {
  hash: string;
  storagePath: string;
  name: string;
  rootPath: string | null;
}

export function extractProjectName(hash: string): string {
  const parts = hash.replace(/^-+/, "").split("-");
  const desktopIdx = parts.indexOf("Desktop");
  if (desktopIdx >= 0 && desktopIdx < parts.length - 1) {
    return parts.slice(desktopIdx + 1).join("-");
  }
  return parts.slice(-2).join("/") || hash.slice(0, 12);
}

export function getProjectDisplayName(hash: string, rootPath?: string | null): string {
  if (rootPath) {
    const name = basename(normalizePath(rootPath));
    if (name) return name;
  }
  return extractProjectName(hash);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
}

function encodeProjectPath(path: string): string {
  return normalizePath(path).replace(/\//g, "-");
}

function decodeProjectHash(hash: string): string | null {
  if (!hash.startsWith("-")) return null;
  const candidate = hash.replace(/-/g, "/");
  return candidate.startsWith("/") ? candidate : `/${candidate}`;
}

function inferProjectPathFromStorage(storagePath: string): string | null {
  const indexPath = `${storagePath}/sessions-index.json`;
  if (existsSync(indexPath)) {
    try {
      const data = JSON.parse(readFileSync(indexPath, "utf-8"));
      const entries = Array.isArray(data?.entries) ? data.entries : Array.isArray(data) ? data : [];
      for (const entry of entries) {
        const candidate = typeof entry?.projectPath === "string" ? normalizePath(entry.projectPath) : null;
        if (candidate) return candidate;
      }
    } catch {
      /* skip malformed index */
    }
  }

  try {
    const jsonl = readdirSync(storagePath).find(file => file.endsWith(".jsonl") && !file.endsWith(".wakatime"));
    if (!jsonl) return null;
    const content = readFileSync(`${storagePath}/${jsonl}`, "utf-8");
    const lines = content.split(/\r?\n/).filter(Boolean).slice(0, 20);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as Record<string, unknown>;
        const candidate =
          typeof entry.cwd === "string" ? normalizePath(entry.cwd) :
          typeof entry.projectPath === "string" ? normalizePath(entry.projectPath) :
          typeof entry.project === "string" ? normalizePath(entry.project) :
          typeof (entry.message as Record<string, unknown> | undefined)?.cwd === "string" ? normalizePath((entry.message as Record<string, unknown>).cwd as string) :
          typeof (entry.message as Record<string, unknown> | undefined)?.projectPath === "string" ? normalizePath((entry.message as Record<string, unknown>).projectPath as string) :
          null;
        if (candidate) return candidate;
      } catch {
        continue;
      }
    }
  } catch {
    /* skip unreadable storage */
  }

  return null;
}

export function resolveProjectRoots(claudeDir: string): ProjectRootInfo[] {
  const historyPaths = new Map<string, string>();

  for (const entry of loadHistory(claudeDir)) {
    if (!entry.projectPath) continue;
    const normalized = normalizePath(entry.projectPath);
    if (!existsSync(normalized)) continue;
    historyPaths.set(encodeProjectPath(normalized), normalized);
  }

  return getProjectDirs(claudeDir).map(project => {
    const recordedPath = historyPaths.get(project.hash) || inferProjectPathFromStorage(project.path) || null;
    let rootPath = recordedPath && existsSync(recordedPath) ? recordedPath : null;

    if (!rootPath) {
      const decoded = decodeProjectHash(project.hash);
      if (decoded && existsSync(decoded)) {
        rootPath = decoded;
      }
    }

    return {
      hash: project.hash,
      storagePath: project.path,
      name: getProjectDisplayName(project.hash, rootPath || recordedPath),
      rootPath,
    };
  });
}
