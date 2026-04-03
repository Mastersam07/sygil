import { useApi } from "../hooks/useApi";
import StatCard from "../components/StatCard";
import { PageSkeleton } from "../components/Skeleton";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "../lib/colors";
import { Link } from "react-router-dom";
import { Coins, Zap, Hash, FolderOpen, ArrowRight, ShieldCheck, Activity, Sparkles } from "lucide-react";

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
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Command Center</p>
            <h2 className="page-hero-title mt-3">Your Claude workspace, expressed as a real operating console.</h2>
            <p className="page-hero-copy">
              Watch token velocity, cost efficiency, project concentration, and current session momentum from a single system view.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Total Tokens"
                value={fmtTokens(totalTok)}
                sub={`${fmtTokens(t.input)} input · ${fmtTokens(t.output)} output`}
                icon={<Zap size={16} />}
              />
              <StatCard
                label="Estimated Cost"
                value={fmtCost(data.estimatedCost)}
                sub={`${fmtCost(data.costWithoutCache)} uncached equivalent`}
                color="var(--accent-green)"
                icon={<Coins size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Today</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[34px] font-bold tracking-[-0.06em] mono" style={{ color: "var(--text-primary)" }}>
                    {data.sessionsToday}
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>sessions started today</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(88, 214, 255, 0.12)", color: "var(--accent-cyan)" }}>
                  <Activity size={18} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 text-[12px]">
                <div>
                  <p style={{ color: "var(--text-muted)" }}>This week</p>
                  <p className="mt-1 font-semibold mono" style={{ color: "var(--text-primary)" }}>{data.sessionsThisWeek}</p>
                </div>
                <div>
                  <p style={{ color: "var(--text-muted)" }}>This month</p>
                  <p className="mt-1 font-semibold mono" style={{ color: "var(--text-primary)" }}>{data.sessionsThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Efficiency</p>
              <p className="text-[28px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-green)" }}>
                {fmtCost(data.cacheSavings)}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Cache behavior is preventing roughly {cachePercent}% of equivalent cost across the observed workspace.
              </p>
              {data.mostActiveProject && (
                <div className="mt-4 badge">
                  <Sparkles size={11} />
                  Most active project: {data.mostActiveProject}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Sessions"
          value={data.sessionCount.toLocaleString()}
          sub={`${data.sessionsThisWeek} this week · ${data.sessionsThisMonth} this month`}
          color="var(--accent-amber)"
          icon={<Hash size={16} />}
        />
        <StatCard
          label="Projects"
          value={data.projectCount.toString()}
          sub={data.mostActiveProject ? `Leading project: ${data.mostActiveProject}` : "No dominant project yet"}
          icon={<FolderOpen size={16} />}
        />
        <StatCard
          label="Average Session"
          value={fmtTokens(data.avgTokensPerSession)}
          sub="Mean tokens per session"
          icon={<Activity size={16} />}
        />
        <StatCard
          label="Cache Savings"
          value={`${cachePercent}%`}
          sub={`${fmtCost(data.cacheSavings)} preserved through cache reads`}
          color="var(--accent-green)"
          icon={<ShieldCheck size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.95fr] gap-4">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="section-label">Usage Trajectory</p>
              <h3 className="text-xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text-primary)" }}>
                Thirty-day token volume and cost direction
              </h3>
            </div>
            <div className="badge">
              {fmtTokens(totalTok)} total tokens
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyUsage}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={d => d.slice(5)} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="tokens" stroke={CHART_COLORS.cyan} fill="url(#tokenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Recent Sessions</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                The latest conversations worth reviewing.
              </p>
            </div>
            <Link to="/sessions" className="badge" style={{ color: "var(--accent-cyan)" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {data.recentSessions.slice(0, 8).map(s => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="surface-muted block px-4 py-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {s.title}
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                      {s.project} · {timeAgo(s.startedAt)}
                    </p>
                  </div>
                  <span className="text-[11px] mono shrink-0" style={{ color: "var(--accent-cyan)" }}>
                    {fmtTokens(s.tokens.input + s.tokens.output)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
