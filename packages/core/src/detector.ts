import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CANDIDATES = [
  join(homedir(), ".claude"),
  join(homedir(), ".config", "claude"),
];

export function detectClaudeDir(override?: string): string | null {
  if (override) {
    return existsSync(override) ? override : null;
  }
  for (const dir of CANDIDATES) {
    if (existsSync(join(dir, "projects"))) return dir;
  }
  for (const dir of CANDIDATES) {
    if (existsSync(dir)) return dir;
  }
  return null;
}

export function getProjectDirs(claudeDir: string): { hash: string; path: string }[] {
  const projectsDir = join(claudeDir, "projects");
  if (!existsSync(projectsDir)) return [];
  try {
    return readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({ hash: d.name, path: join(projectsDir, d.name) }));
  } catch {
    return [];
  }
}
