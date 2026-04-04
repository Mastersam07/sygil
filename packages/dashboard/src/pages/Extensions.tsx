import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { Puzzle, Server } from "lucide-react";

interface ExtensionsData { commands: { name: string; path: string; scope: string; description?: string }[]; skills: { name: string; path: string; scope: string; description?: string }[]; plugins: { id: string; scope: string; version: string }[]; mcpServers: { name: string; type: string; command?: string; url?: string; scope: string }[]; }

export default function Extensions() {
  const { data, isLoading } = useApi<ExtensionsData>("/extensions");
  if (isLoading || !data) return <PageSkeleton />;
  const total = data.commands.length + data.skills.length + data.plugins.length + data.mcpServers.length;
  if (total === 0) return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Extensions" />
      <EmptyState title="No extensions" message="Commands, skills, plugins, and MCP servers will appear here." icon={<Puzzle size={24} />} />
    </div>
  );

  return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Extensions" />
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Commands" value={data.commands.length.toString()} />
        <StatCard label="Skills" value={data.skills.length.toString()} />
        <StatCard label="Plugins" value={data.plugins.length.toString()} color="var(--accent-green)" />
        <StatCard label="MCP Servers" value={data.mcpServers.length.toString()} color="var(--accent)" />
      </div>

      {data.commands.length > 0 && <div className="card overflow-hidden"><div className="p-5"><h2 className="mb-0">Commands</h2></div><table className="table"><thead><tr><th>Name</th><th>Scope</th><th>Description</th></tr></thead><tbody>{data.commands.map(c => <tr key={c.path}><td style={{ color: "var(--text)" }}>{c.name}</td><td style={{ color: "var(--text-muted)" }}>{c.scope}</td><td style={{ color: "var(--text-secondary)" }}>{c.description || "—"}</td></tr>)}</tbody></table></div>}
      {data.skills.length > 0 && <div className="card overflow-hidden"><div className="p-5"><h2 className="mb-0">Skills</h2></div><table className="table"><thead><tr><th>Name</th><th>Scope</th><th>Description</th></tr></thead><tbody>{data.skills.map(s => <tr key={s.path}><td style={{ color: "var(--text)" }}>{s.name}</td><td style={{ color: "var(--text-muted)" }}>{s.scope}</td><td style={{ color: "var(--text-secondary)" }}>{s.description || "—"}</td></tr>)}</tbody></table></div>}
      {data.plugins.length > 0 && <div className="card overflow-hidden"><div className="p-5"><h2 className="mb-0">Plugins</h2></div><table className="table"><thead><tr><th>ID</th><th>Version</th><th>Scope</th></tr></thead><tbody>{data.plugins.map(p => <tr key={`${p.id}-${p.scope}`}><td style={{ color: "var(--text)" }}>{p.id}</td><td style={{ color: "var(--accent)" }}>{p.version}</td><td style={{ color: "var(--text-muted)" }}>{p.scope}</td></tr>)}</tbody></table></div>}
      {data.mcpServers.length > 0 && <div className="card overflow-hidden"><div className="p-5"><h2 className="mb-0">MCP Servers</h2></div><table className="table"><thead><tr><th>Name</th><th>Type</th><th>Command / URL</th><th>Scope</th></tr></thead><tbody>{data.mcpServers.map(s => <tr key={s.name}><td><div className="flex items-center gap-1.5"><Server size={11} style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text)" }}>{s.name}</span></div></td><td style={{ color: "var(--text-muted)" }}>{s.type}</td><td className="truncate max-w-48" style={{ color: "var(--text-secondary)" }}>{s.command || s.url || "—"}</td><td style={{ color: "var(--text-muted)" }}>{s.scope}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
