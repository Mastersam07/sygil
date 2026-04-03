import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS, TOKEN_COLORS } from "../lib/colors";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Analytics { timeSeries: { date: string; input: number; output: number; cost: number }[]; modelBreakdown: { model: string; tokens: number; cost: number; percentage: number }[]; cacheEfficiency: { hitRatio: number; creationTokens: number; readTokens: number }; peakHours: { hour: number; avgTokens: number }[]; projection: { monthlyEstimate: number; dailyAverage: number }; }

const PIE_COLORS = [CHART_COLORS.amber, CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.purple];

export default function Analytics() {
  const { data, isLoading } = useApi<Analytics>("/analytics/tokens");
  if (isLoading || !data) return <PageSkeleton />;

  return (
    <div className="page-enter space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Daily Average" value={fmtCost(data.projection.dailyAverage)} />
        <StatCard label="Monthly Projection" value={fmtCost(data.projection.monthlyEstimate)} color="var(--accent-amber)" />
        <StatCard label="Cache Hit Ratio" value={`${data.cacheEfficiency.hitRatio.toFixed(1)}%`} color="var(--accent-green)" />
        <StatCard label="Cache Tokens" value={fmtTokens(data.cacheEfficiency.creationTokens + data.cacheEfficiency.readTokens)} sub={`${fmtTokens(data.cacheEfficiency.readTokens)} reads`} />
      </div>

      <div className="card p-4">
        <p className="section-label">usage over time</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.timeSeries}>
            <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={d => d.slice(5)} />
            <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{v}</span>} />
            <Area type="monotone" dataKey="input" stackId="1" stroke={TOKEN_COLORS.input} fill={TOKEN_COLORS.input} fillOpacity={0.15} name="Input" strokeWidth={1.5} />
            <Area type="monotone" dataKey="output" stackId="1" stroke={TOKEN_COLORS.output} fill={TOKEN_COLORS.output} fillOpacity={0.15} name="Output" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="section-label">model breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.modelBreakdown} dataKey="tokens" nameKey="model" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {data.modelBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtTokens(v)} />
              <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <p className="section-label">peak hours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.peakHours}>
              <XAxis dataKey="hour" {...AXIS_STYLE} tickFormatter={h => `${h}:00`} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.amber} radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
