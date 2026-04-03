import { useApi } from "../hooks/useApi";
import StatCard from "../components/StatCard";
import { PageSkeleton } from "../components/Skeleton";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "../lib/colors";
import { Link } from "react-router-dom";
import { Coins, Zap, Hash, FolderOpen, ArrowRight, ShieldCheck } from "lucide-react";

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

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Overview</h2>
        <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>
          {data.sessionsToday} sessions today
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Tokens"
          value={fmtTokens(totalTok)}
          sub={`${fmtTokens(t.input)} in · ${fmtTokens(t.output)} out`}
          icon={<Zap size={14} />}
        />
        <StatCard
          label="Estimated Cost"
          value={fmtCost(data.estimatedCost)}
          sub={`${fmtCost(data.costWithoutCache)} without cache`}
          color="var(--accent-green)"
          icon={<Coins size={14} />}
        />
        <StatCard
          label="Sessions"
          value={data.sessionCount.toLocaleString()}
          sub={`${data.sessionsThisWeek} this week · ${data.sessionsThisMonth} this month`}
          color="var(--accent-amber)"
          icon={<Hash size={14} />}
        />
        <StatCard
          label="Cache Savings"
          value={fmtCost(data.cacheSavings)}
          sub={`${data.costWithoutCache > 0 ? Math.round((data.cacheSavings / data.costWithoutCache) * 100) : 0}% saved by caching`}
          color="var(--accent-green)"
          icon={<ShieldCheck size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 card p-5">
          <p className="section-label">Usage — Last 30 Days</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyUsage}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={d => d.slice(5)} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="tokens" stroke={CHART_COLORS.cyan} fill="url(#tokenGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">Recent Sessions</p>
            <Link to="/sessions" className="text-[11px] flex items-center gap-1" style={{ color: "var(--accent-cyan)" }}>
              View all <ArrowRight size={10} />
            </Link>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {data.recentSessions.slice(0, 8).map(s => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="block px-3 py-2 rounded-lg transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>
                  {s.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.project} · {timeAgo(s.startedAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Tokens/Session" value={fmtTokens(data.avgTokensPerSession)} />
        <StatCard
          label="Projects"
          value={data.projectCount.toString()}
          sub={data.mostActiveProject ? `Most active: ${data.mostActiveProject}` : undefined}
          icon={<FolderOpen size={14} />}
        />
        <StatCard label="This Month" value={data.sessionsThisMonth.toString()} sub="sessions" />
      </div>
    </div>
  );
}
