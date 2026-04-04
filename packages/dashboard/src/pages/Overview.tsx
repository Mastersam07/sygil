import { useApi } from "../hooks/useApi";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
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
    <div className="page-enter space-y-8">
      <div className="flex flex-col gap-6">
        <PageHeader pageName="Overview" />
        <div className="flex flex-wrap gap-x-12 gap-y-4 items-baseline pb-4 border-b border-white/5">
          <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
            tokens <span className="text-[22px] font-bold ml-2" style={{ color: "var(--accent-amber)", letterSpacing: "-0.5px" }}>{fmtTokens(totalTok)}</span>
          </span>
          <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
            cost <span className="text-[22px] font-bold ml-2" style={{ color: "var(--accent-green)", letterSpacing: "-0.5px" }}>{fmtCost(data.estimatedCost)}</span>
          </span>
          <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
            sessions <span className="text-[22px] font-bold ml-2" style={{ color: "var(--text)", letterSpacing: "-0.5px" }}>{data.sessionCount}</span>
            <span className="ml-3 text-[12px] opacity-70 normal-case tracking-normal font-normal">this week: {data.sessionsThisWeek} · this month: {data.sessionsThisMonth}</span>
          </span>
          <span className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
            projects <span className="text-[22px] font-bold ml-2" style={{ color: "var(--text)", letterSpacing: "-0.5px" }}>{data.projectCount}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Estimated Cost" value={fmtCost(data.estimatedCost)} sub={`${fmtCost(data.costWithoutCache)} without cache`} color="var(--accent-green)" />
        <StatCard label="Cache Savings" value={fmtCost(data.cacheSavings)} sub={`${cachePercent}% saved`} color="var(--accent-green)" />
        <StatCard label="Avg Tokens/Session" value={fmtTokens(data.avgTokensPerSession)} />
        <StatCard label="Most Active" value={data.mostActiveProject || "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="card p-8 flex flex-col shadow-sm">
          <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Usage Over Time</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
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
                <Area type="monotone" dataKey="tokens" stroke={CHART_COLORS.cyan} fill="url(#tg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="mb-0 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Recent Sessions</h2>
            <Link to="/sessions" className="text-[13px] hover:underline" style={{ color: "var(--accent)" }}>all →</Link>
          </div>
          <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: "300px" }}>
            {data.recentSessions.slice(0, 10).map(s => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="block px-4 py-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
              >
                <p className="text-[12px] font-medium truncate mb-1" style={{ color: "var(--text)" }}>{s.title}</p>
                <p className="text-[12px] opacity-70 flex justify-between" style={{ color: "var(--text-muted)" }}>
                  <span className="truncate">{s.project}</span>
                  <span className="shrink-0 ml-4">{timeAgo(s.startedAt)}</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
