import { existsSync } from "fs";
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

export function resolveProjectRoots(claudeDir: string): ProjectRootInfo[] {
  const historyPaths = new Map<string, string>();

  for (const entry of loadHistory(claudeDir)) {
    if (!entry.projectPath) continue;
    const normalized = normalizePath(entry.projectPath);
    if (!existsSync(normalized)) continue;
    historyPaths.set(encodeProjectPath(normalized), normalized);
  }

  return getProjectDirs(claudeDir).map(project => {
    let rootPath = historyPaths.get(project.hash) || null;

    if (!rootPath) {
      const decoded = decodeProjectHash(project.hash);
      if (decoded && existsSync(decoded)) {
        rootPath = decoded;
      }
    }

    return {
      hash: project.hash,
      storagePath: project.path,
      name: extractProjectName(project.hash),
      rootPath,
    };
  });
}
