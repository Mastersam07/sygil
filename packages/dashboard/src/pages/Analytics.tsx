import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS, TOKEN_COLORS } from "../lib/colors";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Analytics { timeSeries: { date: string; input: number; output: number; cost: number }[]; modelBreakdown: { model: string; tokens: number; cost: number; percentage: number }[]; cacheEfficiency: { hitRatio: number; creationTokens: number; readTokens: number }; peakHours: { hour: number; avgTokens: number }[]; projection: { monthlyEstimate: number; dailyAverage: number }; }

const PIE_COLORS = [CHART_COLORS.amber, CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.purple];

export default function Analytics() {
  const { data, isLoading, mutate } = useApi<Analytics>("/analytics/tokens");
  if (isLoading || !data) return <PageSkeleton />;

  return (
    <div className="page-enter space-y-8">
      <PageHeader 
        pageName="analytics" 
        subtitle="token usage and costs" 
        onRefresh={() => mutate()} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Daily Average" value={fmtCost(data.projection.dailyAverage)} />
        <StatCard label="Monthly Projection" value={fmtCost(data.projection.monthlyEstimate)} color="var(--accent-amber)" />
        <StatCard label="Cache Hit Ratio" value={`${data.cacheEfficiency.hitRatio.toFixed(1)}%`} color="var(--accent-green)" />
        <StatCard label="Cache Tokens" value={fmtTokens(data.cacheEfficiency.creationTokens + data.cacheEfficiency.readTokens)} sub={`${fmtTokens(data.cacheEfficiency.readTokens)} reads`} />
      </div>

      <div className="card p-6">
        <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Token Usage Over Time</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data.timeSeries}>
            <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={d => d.slice(5)} />
            <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{v}</span>} wrapperStyle={{ paddingTop: "20px" }} />
            <Area type="monotone" dataKey="input" stackId="1" stroke={TOKEN_COLORS.input} fill={TOKEN_COLORS.input} fillOpacity={0.15} name="Input" strokeWidth={2} />
            <Area type="monotone" dataKey="output" stackId="1" stroke={TOKEN_COLORS.output} fill={TOKEN_COLORS.output} fillOpacity={0.15} name="Output" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Model Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.modelBreakdown} dataKey="tokens" nameKey="model" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {data.modelBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtTokens(v)} />
              <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Peak Hours</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.peakHours}>
              <XAxis dataKey="hour" {...AXIS_STYLE} tickFormatter={h => `${h}:00`} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
