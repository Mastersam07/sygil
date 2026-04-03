import { existsSync, readdirSync } from "fs";
import { join } from "path";

export function loadExtensions(claudeDir: string) {
  const scan = (dir: string, scope: string) => {
    const p = join(claudeDir, dir);
    if (!existsSync(p)) return [];
    try {
      return readdirSync(p).map(f => ({ name: f, path: join(p, f), scope }));
    } catch { return []; }
  };

  return {
    commands: scan("commands", "global"),
    skills: scan("skills", "global"),
    plugins: scan("plugins", "global"),
    mcpServers: [],
  };
}
