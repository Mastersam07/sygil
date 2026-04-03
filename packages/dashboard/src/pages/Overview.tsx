import { useApi } from "../hooks/useApi";
import StatCard from "../components/StatCard";
import { PageSkeleton } from "../components/Skeleton";
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tokens" value={fmtTokens(totalTok)} sub={`${fmtTokens(t.input)} in / ${fmtTokens(t.output)} out / ${fmtTokens(t.cacheRead)} cache`} />
        <StatCard label="Estimated Cost" value={fmtCost(data.estimatedCost)} sub={`${fmtCost(data.costWithoutCache)} without cache`} color="var(--accent-green)" />
        <StatCard label="Sessions" value={data.sessionCount.toLocaleString()} sub={`${data.sessionsToday} today · ${data.sessionsThisWeek} this week`} color="var(--accent-amber)" />
        <StatCard label="Projects" value={data.projectCount.toString()} sub={data.mostActiveProject ? `Most active: ${data.mostActiveProject}` : undefined} color="var(--accent-purple, #a78bfa)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Usage (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyUsage}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#555568", fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: "#555568", fontSize: 11 }} tickFormatter={fmtTokens} />
              <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8888a0" }} />
              <Area type="monotone" dataKey="tokens" stroke={CHART_COLORS.cyan} fill="url(#tokenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Recent Sessions</h3>
          <div className="space-y-2">
            {data.recentSessions.slice(0, 8).map(s => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="block p-2 rounded hover:bg-white/5 transition-colors"
              >
                <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {s.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.project} · {timeAgo(s.startedAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Cache Savings" value={fmtCost(data.cacheSavings)} sub={`${data.costWithoutCache > 0 ? Math.round((data.cacheSavings / data.costWithoutCache) * 100) : 0}% saved`} color="var(--accent-green)" />
        <StatCard label="Avg Tokens/Session" value={fmtTokens(data.avgTokensPerSession)} />
        <StatCard label="This Week" value={data.sessionsThisWeek.toString()} sub="sessions" />
        <StatCard label="This Month" value={data.sessionsThisMonth.toString()} sub="sessions" />
      </div>
    </div>
  );
}
