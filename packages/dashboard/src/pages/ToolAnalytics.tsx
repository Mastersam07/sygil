import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wrench, Terminal, GitBranch, Cpu } from "lucide-react";

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

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Tool Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Tool Calls" value={totalCalls.toLocaleString()} icon={<Wrench size={14} />} />
        <StatCard label="Avg Calls/Session" value={Math.round(data.avgToolCallsPerSession).toString()} icon={<Cpu size={14} />} />
        <StatCard label="Read:Edit Ratio" value={data.readEditRatio.toFixed(1) + ":1"} color="var(--accent-green)" icon={<GitBranch size={14} />} />
        <StatCard label="Unique Tools" value={data.toolCounts.length.toString()} icon={<Terminal size={14} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card p-5">
          <p className="section-label">Tool Usage by Category</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.categoryBreakdown} layout="vertical">
              <XAxis type="number" {...AXIS_STYLE} />
              <YAxis type="category" dataKey="category" {...AXIS_STYLE} width={70} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.categoryBreakdown.map((entry, i) => (
                  <rect key={i} fill={CAT_COLORS[entry.category] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="section-label">Top Tools</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.toolCounts.slice(0, 15).map(t => (
              <div key={t.tool} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] mono truncate" style={{ color: "var(--text-primary)" }}>{t.tool}</span>
                    <span className="text-[11px] mono shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                      {t.count.toLocaleString()} ({t.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--bg-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${t.percentage}%`,
                        background: CAT_COLORS[t.category] || "var(--accent-cyan)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card p-5">
          <p className="section-label">Top Bash Commands</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {data.bashCommands.map(c => (
              <div key={c.command} className="flex items-center justify-between py-1">
                <span className="text-[13px] mono" style={{ color: "var(--text-primary)" }}>{c.command}</span>
                <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>{c.count}</span>
              </div>
            ))}
            {data.bashCommands.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No bash commands found.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
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
                  <div key={s.server} className="flex items-center justify-between">
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
        <div className="card p-5">
          <p className="section-label">Claude Code Version History</p>
          <div className="flex flex-wrap gap-2">
            {data.ccVersions.map(v => (
              <div key={v.version} className="badge mono">
                {v.version}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
