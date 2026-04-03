import { useApi } from "../hooks/useApi";
import StatCard from "../components/StatCard";
import { PageSkeleton } from "../components/Skeleton";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "../lib/colors";
import { Link } from "react-router-dom";

interface OverviewData {
  totalTokens: { input: number; output: number; cacheCreation: number; cacheRead: number };
  estimatedCost: number;
  costWithoutCache: number;
  cacheSavings: number;
  sessionCount: number;
  projectCount: number;
  sessionsToday: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  avgTokensPerSession: number;
  mostActiveProject: string;
  dailyUsage: { date: string; tokens: number; cost: number }[];
  recentSessions: { id: string; title: string; project: string; startedAt: string; tokens: { input: number; output: number } }[];
}

export default function Overview() {
  const { data, isLoading } = useApi<OverviewData>("/overview");
  if (isLoading || !data) return <PageSkeleton />;

  const t = data.totalTokens;
  const totalTok = t.input + t.output + t.cacheCreation + t.cacheRead;
  const cachePercent = data.costWithoutCache > 0 ? Math.round((data.cacheSavings / data.costWithoutCache) * 100) : 0;

  return (
    <div className="page-enter space-y-4">
      <div className="flex flex-wrap gap-x-8 gap-y-2 items-baseline">
        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          tokens: <span className="text-lg font-bold" style={{ color: "var(--accent-amber)" }}>{fmtTokens(totalTok)}</span>
        </span>
        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          cost: <span className="text-lg font-bold" style={{ color: "var(--accent-green)" }}>{fmtCost(data.estimatedCost)}</span>
        </span>
        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          sessions: <span className="text-lg font-bold" style={{ color: "var(--text)" }}>{data.sessionCount}</span>
          <span className="ml-1 text-xs">this week: {data.sessionsThisWeek} · this month: {data.sessionsThisMonth}</span>
        </span>
        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          projects: <span className="text-lg font-bold" style={{ color: "var(--text)" }}>{data.projectCount}</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Estimated Cost" value={fmtCost(data.estimatedCost)} sub={`${fmtCost(data.costWithoutCache)} without cache`} color="var(--accent-green)" />
        <StatCard label="Cache Savings" value={fmtCost(data.cacheSavings)} sub={`${cachePercent}% saved`} color="var(--accent-green)" />
        <StatCard label="Avg Tokens/Session" value={fmtTokens(data.avgTokensPerSession)} />
        <StatCard label="Most Active" value={data.mostActiveProject || "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <div className="card p-4">
          <p className="section-label">usage over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyUsage}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={d => d.slice(5)} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="tokens" stroke={CHART_COLORS.cyan} fill="url(#tg)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">recent sessions</p>
            <Link to="/sessions" className="text-[11px]" style={{ color: "var(--accent)" }}>all →</Link>
          </div>
          <div className="space-y-1">
            {data.recentSessions.slice(0, 10).map(s => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="block px-2 py-1.5 rounded hover:bg-(--bg-hover) transition-colors"
              >
                <p className="text-[13px] truncate" style={{ color: "var(--text)" }}>{s.title}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {s.project} · {timeAgo(s.startedAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
