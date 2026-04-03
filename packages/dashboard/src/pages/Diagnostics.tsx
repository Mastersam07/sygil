import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertCircle, Zap, Heart, Search, ArrowRight, ShieldAlert, Binary } from "lucide-react";
import { Link } from "react-router-dom";
import { timeAgo } from "../lib/format";

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

  const query = params.toString();
  const { data, isLoading } = useApi<DiagnosticsData>(`/diagnostics${query ? `?${query}` : ""}`);

  if (isLoading && !data) return <PageSkeleton />;
  if (!data) return <EmptyState title="No debug data" message="Debug logs will appear here." icon={<Activity size={28} />} />;

  const filteredEntries = logQuery
    ? data.entries.filter(e => e.message.toLowerCase().includes(logQuery.toLowerCase()))
    : data.entries;
  const weakestSession = data.sessionHealth.reduce((weakest, current) => {
    if (!weakest || current.score < weakest.score) return current;
    return weakest;
  }, data.sessionHealth[0]);
  const noisiestCategory = data.errorsByCategory.reduce((largest, current) => {
    if (!largest || current.count > largest.count) return current;
    return largest;
  }, data.errorsByCategory[0]);

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] items-start">
          <div>
            <p className="eyebrow">Diagnostics Console</p>
            <h2 className="page-hero-title mt-3">Operational health for debug traces, slow paths, and error-heavy sessions.</h2>
            <p className="page-hero-copy">
              Use this view to isolate unstable sessions, inspect noisy categories, and search the raw debug stream without leaving the dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Total Errors"
                value={data.totalErrors.toString()}
                sub={noisiestCategory ? `${noisiestCategory.category} is the loudest category` : "No dominant error category"}
                color="var(--accent-red)"
                icon={<AlertCircle size={16} />}
              />
              <StatCard
                label="Slow Operations"
                value={data.totalSlowOps.toString()}
                sub={`${data.slowOps.length} captured trace entries`}
                color="var(--accent-amber)"
                icon={<Zap size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Lowest Health Session</p>
              {weakestSession ? (
                <>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[30px] font-bold mono tracking-[-0.05em]" style={{ color: scoreColor(weakestSession.score) }}>
                        {weakestSession.score}
                      </p>
                      <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                        {weakestSession.errorCount} errors · {weakestSession.slowOpCount} slow ops
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(243, 133, 141, 0.12)", color: "var(--accent-red)" }}
                    >
                      <ShieldAlert size={18} />
                    </div>
                  </div>
                  <div className="mt-5 badge mono">{weakestSession.sessionId.slice(0, 8)}</div>
                </>
              ) : (
                <p className="text-[13px] mt-4" style={{ color: "var(--text-muted)" }}>No session health scores yet.</p>
              )}
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Log Coverage</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-blue)" }}>
                {data.entries.length.toLocaleString()}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Trace lines indexed across {data.sessionHealth.length} sessions with debug evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Debug Sessions" value={data.sessionHealth.length.toString()} icon={<Activity size={14} />} />
        <StatCard label="Total Errors" value={data.totalErrors.toString()} color="var(--accent-red)" icon={<AlertCircle size={14} />} />
        <StatCard label="Slow Operations" value={data.totalSlowOps.toString()} color="var(--accent-amber)" icon={<Zap size={14} />} />
        <StatCard label="Log Entries" value={data.entries.length.toLocaleString()} icon={<Activity size={14} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_420px] gap-4 items-start">
        {data.errorsByCategory.length > 0 && (
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <p className="section-label mb-0">Errors by Category</p>
                <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  The error families creating the most operational drag.
                </p>
              </div>
              {noisiestCategory && <span className="badge">{noisiestCategory.category} leads</span>}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.errorsByCategory}>
                <XAxis dataKey="category" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill={CHART_COLORS.red} radius={[8, 8, 0, 0]} opacity={0.82} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Session Health Scores</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Weak sessions surface quickly here.
              </p>
            </div>
            <span className="badge">{data.sessionHealth.length} scored</span>
          </div>
          <div className="space-y-2 max-h-[26rem] overflow-y-auto">
            {data.sessionHealth.map(s => (
              <Link key={s.sessionId} to={`/sessions/${s.sessionId}`} className="surface-muted px-4 py-3 flex items-center gap-3">
                <Heart size={13} style={{ color: scoreColor(s.score) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] mono truncate" style={{ color: "var(--text-primary)" }}>
                    {s.sessionId}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {s.errorCount} errors · {s.slowOpCount} slow ops · {s.lspEventCount} LSP events
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] mono font-semibold" style={{ color: scoreColor(s.score) }}>
                    {s.score}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>health</p>
                </div>
              </Link>
            ))}
            {data.sessionHealth.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No sessions with debug data.</p>
            )}
          </div>
        </div>
      </div>

      {data.slowOps.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Slow Operations</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                The heaviest operations captured in trace output.
              </p>
            </div>
            <span className="badge">{data.slowOps.length} total slow traces</span>
          </div>
          <div className="space-y-2 max-h-[26rem] overflow-y-auto">
            {data.slowOps.slice(0, 24).map((op, i) => (
              <div key={i} className="surface-muted px-4 py-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(246, 199, 104, 0.12)", color: "var(--accent-amber)" }}
                >
                  <Zap size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] mono truncate" style={{ color: "var(--text-primary)" }}>{op.operation}</p>
                  <p className="text-[11px] mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                    {op.detail || "No additional operation detail"} · {timeAgo(op.timestamp)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] mono font-semibold" style={{ color: "var(--accent-amber)" }}>{op.durationMs.toFixed(1)}ms</p>
                  <Link to={`/sessions/${op.sessionId}`} className="text-[11px]" style={{ color: "var(--accent-cyan)" }}>
                    {op.sessionId.slice(0, 8)} <ArrowRight size={11} className="inline" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="flex-1">
            <p className="section-label mb-0">Debug Log</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Search and filter the raw event stream driving the diagnostics view.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["", "error", "slow"].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className="btn text-[11px] py-2 px-3"
                style={severity === s ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)", background: "rgba(88, 214, 255, 0.08)" } : undefined}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Filter logs..."
              value={logQuery}
              onChange={e => setLogQuery(e.target.value)}
              className="input w-full pl-7 pr-3 py-2 text-[12px]"
            />
          </div>
        </div>
        <div className="surface-muted px-4 py-3 flex items-center justify-between gap-3 text-[12px] mb-4">
          <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Binary size={13} />
            <span>{filteredEntries.length.toLocaleString()} matching log entries</span>
          </div>
          <span className="mono" style={{ color: "var(--text-muted)" }}>
            {severity || "all"} severity
          </span>
        </div>
        <div className="max-h-[30rem] overflow-y-auto mono text-[11px] leading-6 rounded-[18px] border p-4" style={{ borderColor: "var(--border)", background: "rgba(5, 14, 24, 0.76)" }}>
          {filteredEntries.slice(0, 200).map((e, i) => {
            const color = e.level === "ERROR" ? "var(--accent-red)"
              : e.message.includes("SLOW") ? "var(--accent-amber)"
              : e.message.includes("LSP") ? "var(--accent-purple)"
              : "var(--text-muted)";
            return (
              <div key={i} className="grid grid-cols-[minmax(0,180px)_70px_minmax(0,1fr)] gap-3 py-1 border-b last:border-b-0" style={{ borderColor: "rgba(132, 162, 202, 0.06)" }}>
                <span className="shrink-0" style={{ color: "var(--text-muted)" }}>{e.timestamp}</span>
                <span className="shrink-0" style={{ color }}>[{e.level}]</span>
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
