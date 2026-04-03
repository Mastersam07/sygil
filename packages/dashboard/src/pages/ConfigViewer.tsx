import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import MarkdownBlock from "../components/MarkdownBlock";
import { Settings, Shield, ShieldOff, Server, ChevronDown, ChevronRight } from "lucide-react";

interface ConfigData { globalClaudeMd: string | null; globalSettings: Record<string, unknown> | null; claudeJson: Record<string, unknown> | null; mcpServers: { name: string; type: string; command?: string; url?: string; scope: string }[]; permissions: { type: "allow" | "deny"; rule: string }[]; installedSkills: { name: string; path: string; scope: string; description?: string }[]; installedPlugins: { id: string; scope: string; version: string }[]; projectConfigs: { project: string; projectPath: string | null; claudeMd: string | null; settings: Record<string, unknown> | null }[]; }

function JsonBlock({ data }: { data: unknown }) {
  return <pre className="text-[11px] whitespace-pre-wrap max-h-72 overflow-y-auto p-3 rounded" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>{JSON.stringify(data, null, 2)}</pre>;
}

export default function ConfigViewer() {
  const { data, isLoading } = useApi<ConfigData>("/config");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  if (isLoading || !data) return <PageSkeleton />;

  const empty = !data.globalClaudeMd && !data.globalSettings && data.mcpServers.length === 0 && data.permissions.length === 0;
  if (empty) return <EmptyState title="No config found" message="Your Claude Code config will appear here." icon={<Settings size={24} />} />;

  return (
    <div className="page-enter space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.globalClaudeMd && (
          <div className="card p-4"><p className="section-label">CLAUDE.md</p><div className="max-h-72 overflow-y-auto"><MarkdownBlock content={data.globalClaudeMd} /></div></div>
        )}
        {data.globalSettings && (
          <div className="card p-4"><p className="section-label">settings.json</p><JsonBlock data={data.globalSettings} /></div>
        )}
      </div>

      {data.claudeJson && (
        <div className="card p-4">
          <p className="section-label">.claude.json</p>
          <JsonBlock data={data.claudeJson} />
        </div>
      )}

      {data.permissions.length > 0 && (
        <div className="card p-4">
          <p className="section-label">permissions</p>
          <div className="space-y-1">
            {data.permissions.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px]">
                {p.type === "allow" ? <Shield size={12} style={{ color: "var(--accent-green)" }} /> : <ShieldOff size={12} style={{ color: "var(--accent-red)" }} />}
                <span className="badge" style={{ color: p.type === "allow" ? "var(--accent-green)" : "var(--accent-red)" }}>{p.type}</span>
                <span style={{ color: "var(--text-primary)" }}>{p.rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.mcpServers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-3"><p className="section-label mb-0">mcp servers</p></div>
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Command / URL</th><th>Scope</th></tr></thead>
            <tbody>{data.mcpServers.map(s => (
              <tr key={s.name}><td><div className="flex items-center gap-1.5"><Server size={11} style={{ color: "var(--accent-cyan)" }} /><span style={{ color: "var(--text-primary)" }}>{s.name}</span></div></td><td style={{ color: "var(--text-muted)" }}>{s.type}</td><td className="truncate max-w-48" style={{ color: "var(--text-secondary)" }}>{s.command || s.url || "—"}</td><td style={{ color: "var(--text-muted)" }}>{s.scope}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {(data.installedSkills.length > 0 || data.installedPlugins.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4"><p className="section-label">skills</p>
            {data.installedSkills.length === 0 ? <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>None</p> : data.installedSkills.map(s => <div key={s.path} className="mb-1"><p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{s.name}</p><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.description || s.path}</p></div>)}
          </div>
          <div className="card p-4"><p className="section-label">plugins</p>
            {data.installedPlugins.length === 0 ? <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>None</p> : data.installedPlugins.map(p => <div key={`${p.id}-${p.scope}`} className="mb-1"><p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{p.id}</p><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.version} · {p.scope}</p></div>)}
          </div>
        </div>
      )}

      {data.projectConfigs.length > 0 && (
        <div className="space-y-1">
          <p className="section-label">per-project</p>
          {data.projectConfigs.map(pc => (
            <div key={pc.project} className="card">
              <button onClick={() => setExpandedProject(expandedProject === pc.project ? null : pc.project)} className="w-full flex items-center gap-2 p-3 text-left text-[13px]">
                {expandedProject === pc.project ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <span style={{ color: "var(--text-primary)" }}>{pc.project}</span>
                {pc.projectPath && <span className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{pc.projectPath}</span>}
              </button>
              {expandedProject === pc.project && (
                <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
                  {pc.claudeMd && <><p className="text-[11px] font-bold mt-2" style={{ color: "var(--text-muted)" }}>CLAUDE.md</p><div className="max-h-36 overflow-y-auto"><MarkdownBlock content={pc.claudeMd} /></div></>}
                  {pc.settings && <><p className="text-[11px] font-bold mt-2" style={{ color: "var(--text-muted)" }}>settings.json</p><JsonBlock data={pc.settings} /></>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
