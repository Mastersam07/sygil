import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ToolData { toolCounts: { tool: string; category: string; count: number; percentage: number }[]; categoryBreakdown: { category: string; count: number; percentage: number }[]; readEditRatio: number; avgToolCallsPerSession: number; bashCommands: { command: string; count: number }[]; mcpServers: { server: string; tools: string[]; totalCalls: number }[]; featureAdoption: { feature: string; sessionCount: number; percentage: number }[]; ccVersions: { version: string; firstSeen: string; lastSeen: string }[]; }

const CAT_COLORS: Record<string, string> = { "file-io": CHART_COLORS.cyan, "shell": CHART_COLORS.amber, "search": CHART_COLORS.green, "agent": CHART_COLORS.purple, "web": CHART_COLORS.blue, "planning": CHART_COLORS.red, "mcp": "#f472b6", "other": "#6b7280" };

export default function ToolAnalytics() {
  const { data, isLoading } = useApi<ToolData>("/tools");
  if (isLoading || !data) return <PageSkeleton />;
  const totalCalls = data.toolCounts.reduce((a, t) => a + t.count, 0);

  return (
    <div className="page-enter space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Calls" value={totalCalls.toLocaleString()} />
        <StatCard label="Avg/Session" value={Math.round(data.avgToolCallsPerSession).toString()} />
        <StatCard label="Read:Edit" value={data.readEditRatio.toFixed(1) + ":1"} color="var(--accent-green)" />
        <StatCard label="Unique Tools" value={data.toolCounts.length.toString()} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="section-label">by category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.categoryBreakdown} layout="vertical">
              <XAxis type="number" {...AXIS_STYLE} /><YAxis type="category" dataKey="category" {...AXIS_STYLE} width={65} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} fill={CHART_COLORS.amber} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <p className="section-label">top tools</p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {data.toolCounts.slice(0, 15).map(t => (
              <div key={t.tool} className="flex items-center gap-2">
                <span className="text-[12px] flex-1 truncate" style={{ color: "var(--text)" }}>{t.tool}</span>
                <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>{t.count} ({t.percentage.toFixed(1)}%)</span>
                <div className="w-20 h-1 rounded-full shrink-0" style={{ background: "var(--bg-hover)" }}>
                  <div className="h-full rounded-full" style={{ width: `${t.percentage}%`, background: CAT_COLORS[t.category] || "var(--accent)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="section-label">bash commands</p>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {data.bashCommands.map(c => (
              <div key={c.command} className="flex items-center justify-between py-0.5">
                <span className="text-[12px]" style={{ color: "var(--text)" }}>{c.command}</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{c.count}</span>
              </div>
            ))}
            {data.bashCommands.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>No bash commands found.</p>}
          </div>
        </div>
        <div className="card p-4">
          <p className="section-label">feature adoption</p>
          <div className="space-y-2">
            {data.featureAdoption.map(f => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px]" style={{ color: "var(--text)" }}>{f.feature}</span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{f.sessionCount} ({f.percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "var(--bg-hover)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(f.percentage, 100)}%`, background: "var(--accent)" }} />
                </div>
              </div>
            ))}
          </div>
          {data.mcpServers.length > 0 && (
            <>
              <p className="section-label mt-4">mcp servers</p>
              {data.mcpServers.map(s => (
                <div key={s.server} className="flex items-center justify-between text-[12px]">
                  <span style={{ color: "var(--text)" }}>{s.server}</span>
                  <span style={{ color: "var(--text-muted)" }}>{s.tools.length} tools · {s.totalCalls} calls</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {data.ccVersions.length > 0 && (
        <div className="card p-4">
          <p className="section-label">claude code versions</p>
          <div className="flex flex-wrap gap-1.5">{data.ccVersions.map(v => <span key={v.version} className="badge">{v.version}</span>)}</div>
        </div>
      )}
    </div>
  );
}
