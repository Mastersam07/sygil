import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { Puzzle, Terminal, Sparkles, Package, Server } from "lucide-react";

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

interface ExtensionsData {
  commands: ExtensionItem[];
  skills: ExtensionItem[];
  plugins: PluginItem[];
  mcpServers: McpServerItem[];
}

export default function Extensions() {
  const { data, isLoading } = useApi<ExtensionsData>("/extensions");
  if (isLoading || !data) return <PageSkeleton />;

  const total = data.commands.length + data.skills.length + data.plugins.length + data.mcpServers.length;

  if (total === 0) {
    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Extensions</h2>
        <EmptyState title="No extensions found" message="Commands, skills, plugins, and MCP servers will appear here." icon={<Puzzle size={28} />} />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Extensions</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Commands" value={data.commands.length.toString()} icon={<Terminal size={14} />} />
        <StatCard label="Skills" value={data.skills.length.toString()} icon={<Sparkles size={14} />} />
        <StatCard label="Plugins" value={data.plugins.length.toString()} color="var(--accent-green)" icon={<Package size={14} />} />
        <StatCard label="MCP Servers" value={data.mcpServers.length.toString()} color="var(--accent-cyan)" icon={<Server size={14} />} />
      </div>

      {data.commands.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4"><p className="section-label mb-0">Commands</p></div>
          <table className="table">
            <thead><tr><th>Name</th><th>Scope</th><th>Description</th></tr></thead>
            <tbody>
              {data.commands.map(c => (
                <tr key={c.path}>
                  <td className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{c.name}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{c.scope}</td>
                  <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.skills.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4"><p className="section-label mb-0">Skills</p></div>
          <table className="table">
            <thead><tr><th>Name</th><th>Scope</th><th>Description</th></tr></thead>
            <tbody>
              {data.skills.map(s => (
                <tr key={s.path}>
                  <td className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{s.name}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.scope}</td>
                  <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.plugins.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4"><p className="section-label mb-0">Plugins</p></div>
          <table className="table">
            <thead><tr><th>Plugin ID</th><th>Version</th><th>Scope</th></tr></thead>
            <tbody>
              {data.plugins.map(p => (
                <tr key={`${p.id}-${p.scope}`}>
                  <td className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{p.id}</td>
                  <td className="mono text-xs" style={{ color: "var(--accent-cyan)" }}>{p.version}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{p.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.mcpServers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4"><p className="section-label mb-0">MCP Servers</p></div>
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Command / URL</th><th>Scope</th></tr></thead>
            <tbody>
              {data.mcpServers.map(s => (
                <tr key={s.name}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Server size={12} style={{ color: "var(--accent-cyan)" }} />
                      <span className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.type}</td>
                  <td className="text-xs mono truncate max-w-48" style={{ color: "var(--text-secondary)" }}>{s.command || s.url || "—"}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
