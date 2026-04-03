import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS, TOKEN_COLORS } from "../lib/colors";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Target, Database, Clock, Sparkles, Cpu, Coins, Gauge } from "lucide-react";

interface Analytics {
  timeSeries: { date: string; input: number; output: number; cacheCreation: number; cacheRead: number; cost: number }[];
  modelBreakdown: { model: string; tokens: number; cost: number; percentage: number }[];
  cacheEfficiency: { hitRatio: number; creationTokens: number; readTokens: number };
  peakHours: { hour: number; avgTokens: number }[];
  projection: { monthlyEstimate: number; dailyAverage: number };
}

const PIE_COLORS = [CHART_COLORS.cyan, CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.purple];

export default function Analytics() {
  const { data, isLoading } = useApi<Analytics>("/analytics/tokens");
  if (isLoading || !data) return <PageSkeleton />;

  const dominantModel = data.modelBreakdown.reduce((best, current) => {
    if (!best || current.tokens > best.tokens) return current;
    return best;
  }, data.modelBreakdown[0]);
  const busiestHour = data.peakHours.reduce((best, current) => {
    if (!best || current.avgTokens > best.avgTokens) return current;
    return best;
  }, data.peakHours[0]);
  const cacheTotal = data.cacheEfficiency.creationTokens + data.cacheEfficiency.readTokens;

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Token Intelligence</p>
            <h2 className="page-hero-title mt-3">Cost behavior, cache leverage, and model mix in one decision surface.</h2>
            <p className="page-hero-copy">
              Track how token volume is compounding over time, which models are absorbing spend, and where cache behavior is creating real efficiency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Daily Average"
                value={fmtCost(data.projection.dailyAverage)}
                sub="Average daily spend across observed usage"
                icon={<TrendingUp size={16} />}
              />
              <StatCard
                label="Monthly Projection"
                value={fmtCost(data.projection.monthlyEstimate)}
                sub="Projected spend if current pace holds"
                color="var(--accent-amber)"
                icon={<Target size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Dominant Model</p>
              {dominantModel ? (
                <>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[28px] font-bold tracking-[-0.05em]" style={{ color: "var(--text-primary)" }}>
                        {dominantModel.model}
                      </p>
                      <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                        {fmtTokens(dominantModel.tokens)} tokens · {fmtCost(dominantModel.cost)}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(122, 166, 255, 0.12)", color: "var(--accent-blue)" }}
                    >
                      <Cpu size={18} />
                    </div>
                  </div>
                  <div className="mt-5 badge">
                    <Sparkles size={11} />
                    {dominantModel.percentage.toFixed(1)}% of modeled token load
                  </div>
                </>
              ) : (
                <p className="text-[13px] mt-4" style={{ color: "var(--text-muted)" }}>No model breakdown available yet.</p>
              )}
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Cache Leverage</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-green)" }}>
                {data.cacheEfficiency.hitRatio.toFixed(1)}%
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {fmtTokens(data.cacheEfficiency.readTokens)} read tokens are offsetting {fmtTokens(data.cacheEfficiency.creationTokens)} cache creations.
              </p>
              {busiestHour && (
                <div className="mt-4 badge">
                  <Gauge size={11} />
                  Peak rhythm around {String(busiestHour.hour).padStart(2, "0")}:00
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Daily Average" value={fmtCost(data.projection.dailyAverage)} icon={<TrendingUp size={14} />} />
        <StatCard label="Monthly Projection" value={fmtCost(data.projection.monthlyEstimate)} color="var(--accent-amber)" icon={<Target size={14} />} />
        <StatCard label="Cache Hit Ratio" value={`${data.cacheEfficiency.hitRatio.toFixed(1)}%`} color="var(--accent-green)" icon={<Database size={14} />} />
        <StatCard
          label="Cache Tokens"
          value={fmtTokens(cacheTotal)}
          sub={`${fmtTokens(data.cacheEfficiency.readTokens)} reads`}
          icon={<Clock size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_380px] gap-4 items-start">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <p className="section-label">Usage Over Time</p>
              <h3 className="text-xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text-primary)" }}>
                Input and output flow across the observed period
              </h3>
            </div>
            <div className="badge">
              <Coins size={11} />
              {fmtCost(data.projection.monthlyEstimate)} projected month
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.timeSeries}>
              <defs>
                <linearGradient id="analyticsInput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TOKEN_COLORS.input} stopOpacity={0.24} />
                  <stop offset="95%" stopColor={TOKEN_COLORS.input} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="analyticsOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TOKEN_COLORS.output} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={TOKEN_COLORS.output} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={d => d.slice(5)} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{value}</span>}
              />
              <Area type="monotone" dataKey="input" stroke={TOKEN_COLORS.input} fill="url(#analyticsInput)" name="Input" strokeWidth={2} />
              <Area type="monotone" dataKey="output" stroke={TOKEN_COLORS.output} fill="url(#analyticsOutput)" name="Output" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="section-label">Model Distribution</p>
          {data.modelBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={data.modelBreakdown} dataKey="tokens" nameKey="model" cx="50%" cy="50%" innerRadius={54} outerRadius={84} paddingAngle={3}>
                    {data.modelBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtTokens(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.modelBreakdown.map((item, index) => (
                  <div key={item.model} className="surface-muted px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{item.model}</p>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{fmtCost(item.cost)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] mono font-semibold" style={{ color: "var(--text-primary)" }}>{fmtTokens(item.tokens)}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No model activity has been recorded yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Peak Hours</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Average token pressure by hour of day.
              </p>
            </div>
            {busiestHour && <span className="badge">{String(busiestHour.hour).padStart(2, "0")}:00 peak</span>}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.peakHours}>
              <XAxis dataKey="hour" {...AXIS_STYLE} tickFormatter={h => `${h}:00`} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.cyan} radius={[8, 8, 0, 0]} opacity={0.82} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="section-label">Operational Readout</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="surface-muted p-4">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Cache creation</p>
              <p className="text-[24px] mt-2 font-bold tracking-[-0.05em] mono" style={{ color: "var(--text-primary)" }}>
                {fmtTokens(data.cacheEfficiency.creationTokens)}
              </p>
              <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Tokens spent establishing reusable context.
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Cache reads</p>
              <p className="text-[24px] mt-2 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-green)" }}>
                {fmtTokens(data.cacheEfficiency.readTokens)}
              </p>
              <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Tokens reused instead of recomputed.
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Best-fit pacing</p>
              <p className="text-[24px] mt-2 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-amber)" }}>
                {fmtCost(data.projection.dailyAverage * 7)}
              </p>
              <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Approximate weekly spend at the current run rate.
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Model coverage</p>
              <p className="text-[24px] mt-2 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-blue)" }}>
                {data.modelBreakdown.length}
              </p>
              <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Distinct models participating in observed traffic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
