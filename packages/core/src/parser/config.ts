import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { getProjectDirs } from "../detector.js";

interface McpServer {
  name: string;
  type: string;
  command?: string;
  args?: string[];
  url?: string;
  scope: string;
}

interface PermissionRule {
  type: "allow" | "deny";
  rule: string;
}

interface ConfigResult {
  globalClaudeMd: string | null;
  globalSettings: Record<string, unknown> | null;
  claudeJson: Record<string, unknown> | null;
  mcpServers: McpServer[];
  permissions: PermissionRule[];
  projectConfigs: { project: string; claudeMd: string | null; settings: Record<string, unknown> | null }[];
}

function readFileSafe(p: string): string | null {
  try { return existsSync(p) ? readFileSync(p, "utf-8") : null; } catch { return null; }
}

function readJsonSafe(p: string): Record<string, unknown> | null {
  try { const c = readFileSafe(p); return c ? JSON.parse(c) : null; } catch { return null; }
}

export function loadConfig(claudeDir: string): ConfigResult {
  const globalClaudeMd = readFileSafe(join(claudeDir, "CLAUDE.md"));
  const globalSettings = readJsonSafe(join(claudeDir, "settings.json"));
  const claudeJson = readJsonSafe(join(homedir(), ".claude.json"));

  const mcpServers: McpServer[] = [];

  // Extract MCP servers from .claude.json
  if (claudeJson) {
    const servers = (claudeJson.mcpServers || claudeJson.mcp_servers) as Record<string, Record<string, unknown>> | undefined;
    if (servers && typeof servers === "object") {
      for (const [name, cfg] of Object.entries(servers)) {
        mcpServers.push({
          name,
          type: cfg.url ? "sse" : "stdio",
          command: cfg.command as string | undefined,
          args: cfg.args as string[] | undefined,
          url: cfg.url as string | undefined,
          scope: "global",
        });
      }
    }
  }

  // Check .mcp.json in home dir
  const mcpJson = readJsonSafe(join(homedir(), ".mcp.json"));
  if (mcpJson) {
    const servers = (mcpJson.mcpServers || mcpJson) as Record<string, Record<string, unknown>>;
    if (servers && typeof servers === "object") {
      for (const [name, cfg] of Object.entries(servers)) {
        if (name === "mcpServers") continue;
        if (!cfg || typeof cfg !== "object") continue;
        mcpServers.push({
          name,
          type: cfg.url ? "sse" : "stdio",
          command: cfg.command as string | undefined,
          args: cfg.args as string[] | undefined,
          url: cfg.url as string | undefined,
          scope: "global (.mcp.json)",
        });
      }
    }
  }

  // Extract permissions from settings
  const permissions: PermissionRule[] = [];
  if (globalSettings) {
    const allow = globalSettings.allow as string[] | undefined;
    const deny = globalSettings.deny as string[] | undefined;
    if (Array.isArray(allow)) {
      for (const rule of allow) permissions.push({ type: "allow", rule });
    }
    if (Array.isArray(deny)) {
      for (const rule of deny) permissions.push({ type: "deny", rule });
    }
  }

  // Per-project configs
  const projectConfigs: ConfigResult["projectConfigs"] = [];
  const projects = getProjectDirs(claudeDir);
  for (const project of projects) {
    const pClaudeMd = readFileSafe(join(project.path, "CLAUDE.md"));
    const pSettings = readJsonSafe(join(project.path, "settings.json"));
    if (pClaudeMd || pSettings) {
      projectConfigs.push({ project: project.hash, claudeMd: pClaudeMd, settings: pSettings });
    }
  }

  return { globalClaudeMd, globalSettings, claudeJson, mcpServers, permissions, projectConfigs };
}
