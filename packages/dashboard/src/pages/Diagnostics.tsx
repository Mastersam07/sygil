import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertCircle, Zap, Heart, Search } from "lucide-react";

interface DiagnosticsData {
  entries: { timestamp: string; level: string; message: string; sessionId: string }[];
  slowOps: { operation: string; durationMs: number; detail: string; sessionId: string; timestamp: string }[];
  errorsByCategory: { category: string; count: number }[];
  sessionHealth: { sessionId: string; errorCount: number; slowOpCount: number; lspEventCount: number; score: number }[];
  totalErrors: number;
  totalSlowOps: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--accent-green)";
  if (score >= 50) return "var(--accent-amber)";
  return "var(--accent-red)";
}

export default function Diagnostics() {
  const [severity, setSeverity] = useState("");
  const [logQuery, setLogQuery] = useState("");

  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);

  const { data, isLoading } = useApi<DiagnosticsData>(`/diagnostics?${params}`);

  if (isLoading && !data) return <PageSkeleton />;
  if (!data) return <EmptyState title="No debug data" message="Debug logs will appear here." icon={<Activity size={28} />} />;

  const filteredEntries = logQuery
    ? data.entries.filter(e => e.message.toLowerCase().includes(logQuery.toLowerCase()))
    : data.entries;

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Diagnostics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Debug Sessions" value={data.sessionHealth.length.toString()} icon={<Activity size={14} />} />
        <StatCard label="Total Errors" value={data.totalErrors.toString()} color="var(--accent-red)" icon={<AlertCircle size={14} />} />
        <StatCard label="Slow Operations" value={data.totalSlowOps.toString()} color="var(--accent-amber)" icon={<Zap size={14} />} />
        <StatCard label="Log Entries" value={data.entries.length.toLocaleString()} icon={<Activity size={14} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.errorsByCategory.length > 0 && (
          <div className="card p-5">
            <p className="section-label">Errors by Category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.errorsByCategory}>
                <XAxis dataKey="category" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card p-5">
          <p className="section-label">Session Health Scores</p>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {data.sessionHealth.map(s => (
              <div key={s.sessionId} className="flex items-center gap-3">
                <Heart size={12} style={{ color: scoreColor(s.score) }} />
                <span className="text-[12px] mono flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                  {s.sessionId.slice(0, 8)}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {s.errorCount}err · {s.slowOpCount}slow
                </span>
                <span className="text-[12px] mono font-medium" style={{ color: scoreColor(s.score) }}>
                  {s.score}
                </span>
              </div>
            ))}
            {data.sessionHealth.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No sessions with debug data.</p>
            )}
          </div>
        </div>
      </div>

      {data.slowOps.length > 0 && (
        <div className="card p-5">
          <p className="section-label">Slow Operations</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.slowOps.slice(0, 20).map((op, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <Zap size={11} style={{ color: "var(--accent-amber)" }} />
                <span className="text-[12px] mono" style={{ color: "var(--text-primary)" }}>{op.operation}</span>
                <span className="text-[11px] mono font-medium" style={{ color: "var(--accent-amber)" }}>{op.durationMs.toFixed(1)}ms</span>
                <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>{op.sessionId.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <p className="section-label mb-0">Debug Log</p>
          <div className="flex gap-2">
            {["", "error", "slow"].map(s => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className="btn text-[10px] py-0.5 px-2"
                style={severity === s ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" } : undefined}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Filter logs..."
              value={logQuery}
              onChange={e => setLogQuery(e.target.value)}
              className="input w-full pl-7 pr-2 py-1 text-[11px]"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto mono text-[11px] leading-5">
          {filteredEntries.slice(0, 200).map((e, i) => {
            const color = e.level === "ERROR" ? "var(--accent-red)"
              : e.message.includes("SLOW") ? "var(--accent-amber)"
              : e.message.includes("LSP") ? "var(--accent-purple)"
              : "var(--text-muted)";
            return (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="shrink-0 w-44" style={{ color: "var(--text-muted)" }}>{e.timestamp}</span>
                <span className="shrink-0 w-12" style={{ color }}>[{e.level}]</span>
                <span className="whitespace-pre-wrap wrap-break-word" style={{ color }}>{e.message}</span>
              </div>
            );
          })}
          {filteredEntries.length > 200 && (
            <p className="py-2" style={{ color: "var(--text-muted)" }}>... {filteredEntries.length - 200} more entries</p>
          )}
        </div>
      </div>
    </div>
  );
}
