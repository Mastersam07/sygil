import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Wrench, Terminal, GitBranch, Cpu, Sparkles, Boxes, Hammer, RadioTower } from "lucide-react";
import { fmtDate } from "../lib/format";

interface ToolData {
  toolCounts: { tool: string; category: string; count: number; percentage: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  readEditRatio: number;
  avgToolCallsPerSession: number;
  bashCommands: { command: string; count: number }[];
  mcpServers: { server: string; tools: string[]; totalCalls: number }[];
  featureAdoption: { feature: string; sessionCount: number; percentage: number }[];
  ccVersions: { version: string; firstSeen: string; lastSeen: string }[];
}

const CAT_COLORS: Record<string, string> = {
  "file-io": CHART_COLORS.cyan,
  "shell": CHART_COLORS.amber,
  "search": CHART_COLORS.green,
  "agent": CHART_COLORS.purple,
  "web": CHART_COLORS.blue,
  "planning": CHART_COLORS.red,
  "mcp": "#f472b6",
  "other": "#6b7280",
};

export default function ToolAnalytics() {
  const { data, isLoading } = useApi<ToolData>("/tools");
  if (isLoading || !data) return <PageSkeleton />;

  const totalCalls = data.toolCounts.reduce((a, t) => a + t.count, 0);
  const dominantCategory = data.categoryBreakdown.reduce((best, current) => {
    if (!best || current.count > best.count) return current;
    return best;
  }, data.categoryBreakdown[0]);
  const topTool = data.toolCounts[0];
  const topBash = data.bashCommands[0];

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Tool Intelligence</p>
            <h2 className="page-hero-title mt-3">How Claude is actually operating inside the workspace, from shell habits to MCP reach.</h2>
            <p className="page-hero-copy">
              Inspect the tool stack behind sessions, understand which categories dominate usage, and spot where bash, file I/O, search, or MCP surfaces are doing most of the work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Total Tool Calls"
                value={totalCalls.toLocaleString()}
                sub={`${data.toolCounts.length} distinct tools observed`}
                icon={<Wrench size={16} />}
              />
              <StatCard
                label="Avg Calls / Session"
                value={Math.round(data.avgToolCallsPerSession).toString()}
                sub="Mean tool density across sessions"
                color="var(--accent-green)"
                icon={<Cpu size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Dominant Category</p>
              {dominantCategory ? (
                <>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[30px] font-bold tracking-[-0.05em]" style={{ color: "var(--text-primary)" }}>
                        {dominantCategory.category}
                      </p>
                      <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                        {dominantCategory.count.toLocaleString()} calls · {dominantCategory.percentage.toFixed(1)}% of category traffic
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(88, 214, 255, 0.12)", color: CAT_COLORS[dominantCategory.category] || "var(--accent-cyan)" }}
                    >
                      <Boxes size={18} />
                    </div>
                  </div>
                  <div className="mt-5 badge">
                    <Sparkles size={11} />
                    Top tool: {topTool?.tool || "—"}
                  </div>
                </>
              ) : (
                <p className="text-[13px] mt-4" style={{ color: "var(--text-muted)" }}>No category distribution available yet.</p>
              )}
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Shell Signal</p>
              <p className="text-[30px] mt-3 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-amber)" }}>
                {data.readEditRatio.toFixed(1)}:1
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Read-to-edit ratio across observed tool behavior.
              </p>
              {topBash && (
                <div className="mt-4 badge mono">
                  <Hammer size={11} />
                  {topBash.command}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Tool Calls" value={totalCalls.toLocaleString()} icon={<Wrench size={14} />} />
        <StatCard label="Avg Calls/Session" value={Math.round(data.avgToolCallsPerSession).toString()} icon={<Cpu size={14} />} />
        <StatCard label="Read:Edit Ratio" value={data.readEditRatio.toFixed(1) + ":1"} color="var(--accent-green)" icon={<GitBranch size={14} />} />
        <StatCard label="Unique Tools" value={data.toolCounts.length.toString()} icon={<Terminal size={14} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_420px] gap-4 items-start">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Tool Usage by Category</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Category-level demand across the tool surface.
              </p>
            </div>
            {dominantCategory && <span className="badge">{dominantCategory.category} leads</span>}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.categoryBreakdown} layout="vertical">
              <XAxis type="number" {...AXIS_STYLE} />
              <YAxis type="category" dataKey="category" {...AXIS_STYLE} width={70} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.categoryBreakdown.map((entry) => (
                  <Cell key={entry.category} fill={CAT_COLORS[entry.category] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Top Tools</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Highest-frequency tools across the workspace.
              </p>
            </div>
            <span className="badge">{data.toolCounts.length} tools</span>
          </div>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {data.toolCounts.slice(0, 15).map(t => (
              <div key={t.tool} className="surface-muted px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[13px] mono truncate" style={{ color: "var(--text-primary)" }}>{t.tool}</span>
                  <span className="badge">{t.category}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
                  <span style={{ color: "var(--text-muted)" }}>{t.count.toLocaleString()} calls</span>
                  <span className="mono" style={{ color: "var(--text-primary)" }}>{t.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(t.percentage, 4)}%`,
                      background: CAT_COLORS[t.category] || "var(--accent-cyan)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Top Bash Commands</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Repeated shell commands surfaced from tool activity.
              </p>
            </div>
            <span className="badge">{data.bashCommands.length}</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.bashCommands.map(c => (
              <div key={c.command} className="surface-muted px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[13px] mono truncate" style={{ color: "var(--text-primary)" }}>{c.command}</span>
                <span className="text-[11px] mono shrink-0" style={{ color: "var(--text-muted)" }}>{c.count}</span>
              </div>
            ))}
            {data.bashCommands.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No bash commands found.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="section-label">Feature Adoption</p>
          <div className="space-y-3">
            {data.featureAdoption.map(f => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{f.feature}</span>
                  <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>
                    {f.sessionCount} sessions ({f.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--bg-hover)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(f.percentage, 100)}%`, background: "var(--accent-cyan)" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {data.mcpServers.length > 0 && (
            <>
              <p className="section-label mt-5">MCP Servers</p>
              <div className="space-y-2">
                {data.mcpServers.map(s => (
                  <div key={s.server} className="surface-muted px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{s.server}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {s.tools.length} tools · {s.totalCalls} calls
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {data.ccVersions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Claude Code Version History</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Versions encountered across the recorded session history.
              </p>
            </div>
            <div className="badge">
              <RadioTower size={11} />
              {data.ccVersions.length} versions
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.ccVersions.map(v => (
              <div key={v.version} className="surface-muted px-4 py-3">
                <p className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{v.version}</p>
                <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                  First seen {fmtDate(v.firstSeen)} · Last seen {fmtDate(v.lastSeen)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
