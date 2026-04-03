import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { resolveProjectRoots } from "../project-roots.js";

interface ExtensionItem {
  name: string;
  path: string;
  scope: string;
  description?: string;
}

interface PluginItem {
  id: string;
  scope: string;
  version: string;
  installedAt?: string;
}

interface McpServerItem {
  name: string;
  type: string;
  command?: string;
  url?: string;
  scope: string;
}

interface ExtensionsResult {
  commands: ExtensionItem[];
  skills: ExtensionItem[];
  plugins: PluginItem[];
  mcpServers: McpServerItem[];
}

export function scanDir(dir: string, scope: string): ExtensionItem[] {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter(e => !e.name.startsWith("."))
      .map(e => {
        const fullPath = join(dir, e.name);
        let description = "";
        if (e.isDirectory()) {
          const skillMd = join(fullPath, "SKILL.md");
          if (existsSync(skillMd)) {
            try {
              const content = readFileSync(skillMd, "utf-8");
              const match = content.match(/^#\s+(.+)$/m);
              if (match) description = match[1].trim();
            } catch { /* skip */ }
          }
        } else if (e.isFile()) {
          try {
            const content = readFileSync(fullPath, "utf-8").slice(0, 200);
            const match = content.match(/^#\s+(.+)$/m) || content.match(/^\/\/\s*(.+)$/m);
            if (match) description = match[1].trim();
          } catch { /* skip */ }
        }
        return { name: e.name, path: fullPath, scope, description };
      });
  } catch { return []; }
}

export function readPlugins(claudeDir: string): PluginItem[] {
  const pluginsFile = join(claudeDir, "plugins", "installed_plugins.json");
  if (!existsSync(pluginsFile)) return [];
  try {
    const data = JSON.parse(readFileSync(pluginsFile, "utf-8"));
    const plugins = data.plugins as Record<string, Array<{ scope: string; version: string; installedAt?: string }>> | undefined;
    if (!plugins) return [];
    return Object.entries(plugins).flatMap(([id, installs]) =>
      installs.map(inst => ({ id, scope: inst.scope, version: inst.version, installedAt: inst.installedAt }))
    );
  } catch { return []; }
}

function readMcpServers(): McpServerItem[] {
  const servers: McpServerItem[] = [];

  const claudeJson = join(homedir(), ".claude.json");
  if (existsSync(claudeJson)) {
    try {
      const data = JSON.parse(readFileSync(claudeJson, "utf-8"));
      const mcpServers = data.mcpServers as Record<string, Record<string, unknown>> | undefined;
      if (mcpServers) {
        for (const [name, cfg] of Object.entries(mcpServers)) {
          servers.push({ name, type: cfg.url ? "sse" : "stdio", command: cfg.command as string | undefined, url: cfg.url as string | undefined, scope: "global" });
        }
      }
    } catch { /* skip */ }
  }

  const mcpJson = join(homedir(), ".mcp.json");
  if (existsSync(mcpJson)) {
    try {
      const data = JSON.parse(readFileSync(mcpJson, "utf-8"));
      const mcpServers = (data.mcpServers || data) as Record<string, Record<string, unknown>>;
      for (const [name, cfg] of Object.entries(mcpServers)) {
        if (name === "mcpServers" || !cfg || typeof cfg !== "object") continue;
        servers.push({ name, type: cfg.url ? "sse" : "stdio", command: cfg.command as string | undefined, url: cfg.url as string | undefined, scope: ".mcp.json" });
      }
    } catch { /* skip */ }
  }

  return servers;
}

export function loadExtensions(claudeDir: string): ExtensionsResult {
  const commands = scanDir(join(claudeDir, "commands"), "global");
  const skills = scanDir(join(claudeDir, "skills"), "global");

  for (const project of resolveProjectRoots(claudeDir)) {
    if (!project.rootPath) continue;
    const scope = `project: ${project.name}`;
    commands.push(...scanDir(join(project.rootPath, ".claude", "commands"), scope));
    skills.push(...scanDir(join(project.rootPath, ".claude", "skills"), scope));
  }

  return {
    commands,
    skills,
    plugins: readPlugins(claudeDir),
    mcpServers: readMcpServers(),
  };
}
