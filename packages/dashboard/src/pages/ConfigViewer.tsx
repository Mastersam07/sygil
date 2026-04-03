import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import { Settings, Shield, ShieldOff, Server, ChevronDown, ChevronRight, Sparkles, Blocks, FolderOpen, Wrench } from "lucide-react";
import MarkdownBlock from "../components/MarkdownBlock";

interface McpServer {
  name: string;
  type: string;
  command?: string;
  args?: string[];
  url?: string;
  scope: string;
}

interface ConfigData {
  globalClaudeMd: string | null;
  globalSettings: Record<string, unknown> | null;
  claudeJson: Record<string, unknown> | null;
  mcpServers: McpServer[];
  permissions: { type: "allow" | "deny"; rule: string }[];
  installedSkills: { name: string; path: string; scope: string; description?: string }[];
  installedPlugins: { id: string; scope: string; version: string; installedAt?: string }[];
  projectConfigs: { project: string; projectPath: string | null; claudeMd: string | null; settings: Record<string, unknown> | null }[];
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="text-[11px] mono leading-6 whitespace-pre-wrap max-h-80 overflow-y-auto p-4 rounded-[18px] border" style={{ background: "rgba(5, 14, 24, 0.76)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function ConfigViewer() {
  const { data, isLoading } = useApi<ConfigData>("/config");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  if (isLoading || !data) return <PageSkeleton />;

  const totalConfigSurfaces =
    (data.globalClaudeMd ? 1 : 0) +
    (data.globalSettings ? 1 : 0) +
    (data.claudeJson ? 1 : 0) +
    data.projectConfigs.length;

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Configuration Intelligence</p>
            <h2 className="page-hero-title mt-3">Global rules, per-project overrides, and installed runtime surfaces in one place.</h2>
            <p className="page-hero-copy">
              Audit how Claude is configured across your machine, see which integrations are installed, and inspect the project-level guidance shaping agent behavior.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Config Surfaces"
                value={totalConfigSurfaces.toString()}
                sub={`${data.projectConfigs.length} project-level overrides discovered`}
                icon={<Settings size={16} />}
              />
              <StatCard
                label="Installed Integrations"
                value={(data.installedSkills.length + data.installedPlugins.length + data.mcpServers.length).toString()}
                sub={`${data.mcpServers.length} MCP servers, ${data.installedPlugins.length} plugins`}
                color="var(--accent-green)"
                icon={<Blocks size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Permissions Posture</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--text-primary)" }}>
                {data.permissions.length}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {data.permissions.filter(permission => permission.type === "allow").length} allow rules and {data.permissions.filter(permission => permission.type === "deny").length} deny rules are currently visible.
              </p>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Project Coverage</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-cyan)" }}>
                {data.projectConfigs.length}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Project-specific config bundles with CLAUDE guidance or settings overrides.
              </p>
              {data.projectConfigs[0] && (
                <div className="mt-4 badge">
                  <Sparkles size={11} />
                  Latest config scope: {data.projectConfigs[0].project}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Permissions"
          value={data.permissions.length.toString()}
          sub="Explicit allow and deny rules"
          color="var(--accent-amber)"
          icon={<Shield size={14} />}
        />
        <StatCard
          label="MCP Servers"
          value={data.mcpServers.length.toString()}
          sub="Configured runtime endpoints"
          icon={<Server size={14} />}
        />
        <StatCard
          label="Installed Skills"
          value={data.installedSkills.length.toString()}
          sub="Local and project skill surfaces"
          color="var(--accent-blue)"
          icon={<Wrench size={14} />}
        />
        <StatCard
          label="Installed Plugins"
          value={data.installedPlugins.length.toString()}
          sub="Registered plugin installations"
          color="var(--accent-green)"
          icon={<Blocks size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.globalClaudeMd && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="section-label mb-0">Global CLAUDE.md</p>
                <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Shared operating guidance applied across Claude sessions.
                </p>
              </div>
              <span className="badge">Global</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <MarkdownBlock content={data.globalClaudeMd} />
            </div>
          </div>
        )}

        {data.globalSettings && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="section-label mb-0">Global settings.json</p>
                <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Machine-level settings currently shaping behavior.
                </p>
              </div>
              <span className="badge">Settings</span>
            </div>
            <JsonBlock data={data.globalSettings} />
          </div>
        )}

        {data.claudeJson && (
          <div className="card p-6 xl:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="section-label mb-0">claude.json</p>
                <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Additional Claude-level JSON configuration exposed by the parser.
                </p>
              </div>
              <span className="badge">Runtime JSON</span>
            </div>
            <JsonBlock data={data.claudeJson} />
          </div>
        )}
      </div>

      {data.permissions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Permissions</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Explicit rules currently visible in the Claude configuration surface.
              </p>
            </div>
            <span className="badge">{data.permissions.length} rules</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.permissions.map((p, i) => (
              <div key={i} className="surface-muted px-4 py-3 flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: p.type === "allow" ? "rgba(110, 231, 183, 0.12)" : "rgba(243, 133, 141, 0.12)" }}
                >
                  {p.type === "allow"
                    ? <Shield size={14} style={{ color: "var(--accent-green)" }} />
                    : <ShieldOff size={14} style={{ color: "var(--accent-red)" }} />
                  }
                </div>
                <div className="min-w-0">
                  <span
                    className="badge"
                    style={{ color: p.type === "allow" ? "var(--accent-green)" : "var(--accent-red)" }}
                  >
                    {p.type}
                  </span>
                  <p className="text-[13px] mono mt-2 break-all" style={{ color: "var(--text-primary)" }}>{p.rule}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.mcpServers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-6">
            <p className="section-label mb-0">MCP Servers</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              External services and commands wired into Claude through MCP.
            </p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Command / URL</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {data.mcpServers.map(s => (
                <tr key={s.name}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Server size={12} style={{ color: "var(--accent-cyan)" }} />
                      <span className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.type}</td>
                  <td className="text-xs mono truncate max-w-48" style={{ color: "var(--text-secondary)" }}>
                    {s.command || s.url || "—"}
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data.installedSkills.length > 0 || data.installedPlugins.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="section-label mb-0">Installed Skills</p>
                <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Skills surfaced from local and project configuration roots.
                </p>
              </div>
              <span className="badge">{data.installedSkills.length}</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.installedSkills.map(skill => (
                <div key={skill.path} className="surface-muted px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{skill.name}</p>
                    <span className="badge">{skill.scope}</span>
                  </div>
                  <p className="text-[11px] mt-2 break-all" style={{ color: "var(--text-muted)" }}>{skill.description || skill.path}</p>
                </div>
              ))}
              {data.installedSkills.length === 0 && (
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No skills found.</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="section-label mb-0">Installed Plugins</p>
                <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Registered plugins currently visible to the dashboard.
                </p>
              </div>
              <span className="badge">{data.installedPlugins.length}</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.installedPlugins.map(plugin => (
                <div key={`${plugin.id}-${plugin.scope}`} className="surface-muted px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{plugin.id}</p>
                    <span className="badge">{plugin.scope}</span>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                    {plugin.version}{plugin.installedAt ? ` · installed ${plugin.installedAt}` : ""}
                  </p>
                </div>
              ))}
              {data.installedPlugins.length === 0 && (
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No plugins found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {data.projectConfigs.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="section-label mb-0">Per-Project Configs</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Project-scoped guidance and overrides discovered across the workspace.
            </p>
          </div>
          {data.projectConfigs.map(pc => (
            <div key={pc.project} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedProject(expandedProject === pc.project ? null : pc.project)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(88, 214, 255, 0.1)", color: "var(--accent-cyan)" }}
                >
                  <FolderOpen size={14} />
                </div>
                {expandedProject === pc.project ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold block" style={{ color: "var(--text-primary)" }}>{pc.project}</span>
                  {pc.projectPath && (
                    <span className="text-[11px] block truncate mt-1" style={{ color: "var(--text-muted)" }}>{pc.projectPath}</span>
                  )}
                </div>
              </button>
              {expandedProject === pc.project && (
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "var(--border)" }}>
                  {pc.claudeMd && (
                    <div className="mt-3">
                      <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>CLAUDE.md</p>
                      <div className="max-h-48 overflow-y-auto surface-muted p-4">
                        <MarkdownBlock content={pc.claudeMd} />
                      </div>
                    </div>
                  )}
                  {pc.settings && (
                    <div>
                      <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>settings.json</p>
                      <JsonBlock data={pc.settings} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!data.globalClaudeMd && !data.globalSettings && !data.claudeJson && data.mcpServers.length === 0 && data.permissions.length === 0 && data.installedSkills.length === 0 && data.installedPlugins.length === 0 && (
        <EmptyState title="No configuration found" message="Your Claude Code configuration files will appear here." icon={<Settings size={28} />} />
      )}
    </div>
  );
}
