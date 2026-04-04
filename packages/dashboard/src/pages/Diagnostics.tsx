import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Search } from "lucide-react";

interface DiagnosticsData { entries: { timestamp: string; level: string; message: string; sessionId: string }[]; slowOps: { operation: string; durationMs: number; detail: string; sessionId: string; timestamp: string }[]; errorsByCategory: { category: string; count: number }[]; sessionHealth: { sessionId: string; errorCount: number; slowOpCount: number; score: number }[]; totalErrors: number; totalSlowOps: number; }

export default function Diagnostics() {
  const [severity, setSeverity] = useState("");
  const [logQuery, setLogQuery] = useState("");
  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);

  const { data, isLoading } = useApi<DiagnosticsData>(`/diagnostics?${params}`);
  if (isLoading && !data) return <PageSkeleton />;
  if (!data) return null;

  const filtered = logQuery ? data.entries.filter(e => e.message.toLowerCase().includes(logQuery.toLowerCase())) : data.entries;

  return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Diagnostics" />
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Debug Sessions" value={data.sessionHealth.length.toString()} />
        <StatCard label="Errors" value={data.totalErrors.toString()} color="var(--accent-red)" />
        <StatCard label="Slow Ops" value={data.totalSlowOps.toString()} color="var(--accent-amber)" />
        <StatCard label="Log Entries" value={data.entries.length.toLocaleString()} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {data.errorsByCategory.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Errors by Category</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.errorsByCategory}>
                <XAxis dataKey="category" {...AXIS_STYLE} /><YAxis {...AXIS_STYLE} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill={CHART_COLORS.red} radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="card p-6">
          <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Session Health</h2>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {data.sessionHealth.map(s => (
              <div key={s.sessionId} className="flex items-center gap-2 text-[12px]">
                <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{s.sessionId.slice(0, 8)}</span>
                <span style={{ color: "var(--text-muted)" }}>{s.errorCount}err {s.slowOpCount}slow</span>
                <span className="font-bold" style={{ color: s.score >= 80 ? "var(--accent-green)" : s.score >= 50 ? "var(--accent-amber)" : "var(--accent-red)" }}>{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="mb-0">Debug Log</h2>
          {["", "error", "slow"].map(s => (
            <button key={s} onClick={() => setSeverity(s)} className="btn text-[10px] py-0.5 px-2"
              style={severity === s ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>{s || "all"}</button>
          ))}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="filter..." value={logQuery} onChange={e => setLogQuery(e.target.value)} className="input w-full pl-6 pr-2 py-1 text-[11px]" />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto text-[11px] leading-5">
          {filtered.slice(0, 200).map((e, i) => {
            const c = e.level === "ERROR" ? "var(--accent-red)" : e.message.includes("SLOW") ? "var(--accent-amber)" : "var(--text-muted)";
            return <div key={i} className="flex gap-2 py-0.5"><span className="shrink-0 w-40" style={{ color: "var(--text-muted)" }}>{e.timestamp}</span><span className="shrink-0 w-10" style={{ color: c }}>[{e.level}]</span><span className="whitespace-pre-wrap wrap-break-word" style={{ color: c }}>{e.message}</span></div>;
          })}
          {filtered.length > 200 && <p className="py-1" style={{ color: "var(--text-muted)" }}>... {filtered.length - 200} more</p>}
        </div>
      </div>
    </div>
  );
}
