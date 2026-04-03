import type { ReactNode } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { Puzzle, Terminal, Sparkles, Package, Server, Boxes, Wrench, ArrowRight } from "lucide-react";

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

function InventorySection({
  title,
  subtitle,
  icon,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="section-label mb-0">{title}</p>
          <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>
        <div className="badge">
          {icon}
          {count}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Extensions() {
  const { data, isLoading } = useApi<ExtensionsData>("/extensions");
  if (isLoading || !data) return <PageSkeleton />;

  const total = data.commands.length + data.skills.length + data.plugins.length + data.mcpServers.length;
  const topSurface = [
    { label: "Commands", count: data.commands.length },
    { label: "Skills", count: data.skills.length },
    { label: "Plugins", count: data.plugins.length },
    { label: "MCP Servers", count: data.mcpServers.length },
  ].sort((a, b) => b.count - a.count)[0];
  const scopes = new Set(
    [...data.commands, ...data.skills, ...data.plugins, ...data.mcpServers].map(item => item.scope).filter(Boolean),
  ).size;

  if (total === 0) {
    return (
      <div className="page-enter space-y-5">
        <section className="card p-6 lg:p-8">
          <p className="eyebrow">Extension Inventory</p>
          <h2 className="page-hero-title mt-3">Commands, skills, plugins, and MCP servers will appear here once they’re installed.</h2>
          <p className="page-hero-copy">
            This inventory unifies every extension surface the dashboard can detect, from lightweight commands to external MCP integrations.
          </p>
        </section>
        <EmptyState title="No extensions found" message="Commands, skills, plugins, and MCP servers will appear here." icon={<Puzzle size={28} />} />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Extension Inventory</p>
            <h2 className="page-hero-title mt-3">A unified view of the custom surfaces extending Claude in this workspace.</h2>
            <p className="page-hero-copy">
              Audit commands, skills, plugins, and MCP servers together so it’s clear which capabilities are installed globally and which ones are scoped to specific projects.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Installed Surfaces"
                value={total.toString()}
                sub={`${scopes} distinct scopes detected`}
                icon={<Boxes size={16} />}
              />
              <StatCard
                label="Top Surface"
                value={topSurface?.count.toString() || "0"}
                sub={topSurface ? `${topSurface.label} lead the inventory` : "No extension data"}
                color="var(--accent-green)"
                icon={<Sparkles size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Commands + Skills</p>
              <p className="text-[30px] mt-3 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-cyan)" }}>
                {data.commands.length + data.skills.length}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Prompt-facing extensions available directly inside Claude’s working surface.
              </p>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Integration Reach</p>
              <p className="text-[30px] mt-3 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-green)" }}>
                {data.plugins.length + data.mcpServers.length}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Runtime integrations spanning plugins and MCP servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Commands" value={data.commands.length.toString()} icon={<Terminal size={14} />} />
        <StatCard label="Skills" value={data.skills.length.toString()} icon={<Sparkles size={14} />} />
        <StatCard label="Plugins" value={data.plugins.length.toString()} color="var(--accent-green)" icon={<Package size={14} />} />
        <StatCard label="MCP Servers" value={data.mcpServers.length.toString()} color="var(--accent-cyan)" icon={<Server size={14} />} />
      </div>

      {data.commands.length > 0 && (
        <InventorySection title="Commands" subtitle="Reusable prompt-side commands discovered by the parser." icon={<Terminal size={11} />} count={data.commands.length}>
          <div className="space-y-2">
            {data.commands.map(c => (
              <div key={c.path} className="surface-muted px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                  <span className="badge">{c.scope}</span>
                </div>
                <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>{c.description || "No command description available."}</p>
              </div>
            ))}
          </div>
        </InventorySection>
      )}

      {data.skills.length > 0 && (
        <InventorySection title="Skills" subtitle="Installed skills discovered across global and project scopes." icon={<Wrench size={11} />} count={data.skills.length}>
          <div className="space-y-2">
            {data.skills.map(s => (
              <div key={s.path} className="surface-muted px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  <span className="badge">{s.scope}</span>
                </div>
                <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>{s.description || "No skill description available."}</p>
              </div>
            ))}
          </div>
        </InventorySection>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.plugins.length > 0 && (
          <InventorySection title="Plugins" subtitle="Plugins registered in the Claude environment." icon={<Package size={11} />} count={data.plugins.length}>
            <div className="space-y-2">
              {data.plugins.map(p => (
                <div key={`${p.id}-${p.scope}`} className="surface-muted px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="mono text-[13px]" style={{ color: "var(--text-primary)" }}>{p.id}</p>
                    <span className="badge">{p.scope}</span>
                  </div>
                  <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                    Version {p.version}{p.installedAt ? ` · installed ${p.installedAt}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </InventorySection>
        )}

        {data.mcpServers.length > 0 && (
          <InventorySection title="MCP Servers" subtitle="External servers and local commands exposed through MCP." icon={<Server size={11} />} count={data.mcpServers.length}>
            <div className="space-y-2">
              {data.mcpServers.map(s => (
                <div key={s.name} className="surface-muted px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Server size={12} style={{ color: "var(--accent-cyan)" }} />
                      <p className="mono text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                    </div>
                    <span className="badge">{s.scope}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[12px]">
                    <span style={{ color: "var(--text-muted)" }}>{s.type}</span>
                    <span className="badge mono">{s.command || s.url || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </InventorySection>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label mb-0">Inventory Notes</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Commands and skills are prompt-facing assets, while plugins and MCP servers extend runtime capabilities more deeply.
            </p>
          </div>
          <span className="badge" style={{ color: "var(--accent-cyan)" }}>
            Surfaces mapped <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}
