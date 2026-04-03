import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { Settings, Shield, ShieldOff, Server, ChevronDown, ChevronRight } from "lucide-react";
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
    <pre className="text-[11px] mono leading-5 whitespace-pre-wrap max-h-80 overflow-y-auto p-3 rounded-lg" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function ConfigViewer() {
  const { data, isLoading } = useApi<ConfigData>("/config");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  if (isLoading || !data) return <PageSkeleton />;

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Configuration</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.globalClaudeMd && (
          <div className="card p-5">
            <p className="section-label">CLAUDE.md</p>
            <div className="max-h-80 overflow-y-auto">
              <MarkdownBlock content={data.globalClaudeMd} />
            </div>
          </div>
        )}

        {data.globalSettings && (
          <div className="card p-5">
            <p className="section-label">settings.json</p>
            <JsonBlock data={data.globalSettings} />
          </div>
        )}
      </div>

      {data.permissions.length > 0 && (
        <div className="card p-5">
          <p className="section-label">Permissions</p>
          <div className="space-y-1.5">
            {data.permissions.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                {p.type === "allow"
                  ? <Shield size={12} style={{ color: "var(--accent-green)" }} />
                  : <ShieldOff size={12} style={{ color: "var(--accent-red)" }} />
                }
                <span
                  className="badge"
                  style={{ color: p.type === "allow" ? "var(--accent-green)" : "var(--accent-red)" }}
                >
                  {p.type}
                </span>
                <span className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{p.rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.mcpServers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4">
            <p className="section-label mb-0">MCP Servers</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="card p-5">
            <p className="section-label">Installed Skills</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.installedSkills.map(skill => (
                <div key={skill.path}>
                  <p className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{skill.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{skill.description || skill.path}</p>
                </div>
              ))}
              {data.installedSkills.length === 0 && (
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No skills found.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <p className="section-label">Installed Plugins</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.installedPlugins.map(plugin => (
                <div key={`${plugin.id}-${plugin.scope}`}>
                  <p className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{plugin.id}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {plugin.version} · {plugin.scope}
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
        <div className="space-y-2">
          <p className="section-label">Per-Project Configs</p>
          {data.projectConfigs.map(pc => (
            <div key={pc.project} className="card">
              <button
                onClick={() => setExpandedProject(expandedProject === pc.project ? null : pc.project)}
                className="w-full flex items-center gap-2 p-3 text-left"
              >
                {expandedProject === pc.project ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <div className="min-w-0">
                  <span className="text-[13px] mono block" style={{ color: "var(--text-primary)" }}>{pc.project}</span>
                  {pc.projectPath && (
                    <span className="text-[10px] block truncate" style={{ color: "var(--text-muted)" }}>{pc.projectPath}</span>
                  )}
                </div>
              </button>
              {expandedProject === pc.project && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
                  {pc.claudeMd && (
                    <div className="mt-3">
                      <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>CLAUDE.md</p>
                      <div className="max-h-40 overflow-y-auto">
                        <MarkdownBlock content={pc.claudeMd} />
                      </div>
                    </div>
                  )}
                  {pc.settings && (
                    <div>
                      <p className="text-[11px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>settings.json</p>
                      <JsonBlock data={pc.settings} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!data.globalClaudeMd && !data.globalSettings && data.mcpServers.length === 0 && data.permissions.length === 0 && data.installedSkills.length === 0 && data.installedPlugins.length === 0 && (
        <EmptyState title="No configuration found" message="Your Claude Code configuration files will appear here." icon={<Settings size={28} />} />
      )}
    </div>
  );
}
