import { readFileSync, existsSync } from "fs";
import { join } from "path";

export function loadConfig(claudeDir: string) {
  const readFile = (p: string) => { try { return existsSync(p) ? readFileSync(p, "utf-8") : null; } catch { return null; } };
  const readJson = (p: string) => { try { const c = readFile(p); return c ? JSON.parse(c) : null; } catch { return null; } };

  return {
    globalClaudeMd: readFile(join(claudeDir, "CLAUDE.md")),
    globalSettings: readJson(join(claudeDir, "settings.json")),
    claudeJson: readJson(join(claudeDir, "..", ".claude.json")),
    projectConfigs: [],
    permissions: { allow: [] as string[], deny: [] as string[] },
  };
}
