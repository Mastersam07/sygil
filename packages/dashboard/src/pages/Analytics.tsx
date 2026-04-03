import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { fmtTokens, fmtCost } from "../lib/format";
import { CHART_COLORS, TOKEN_COLORS } from "../lib/colors";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Analytics {
  timeSeries: { date: string; input: number; output: number; cacheCreation: number; cacheRead: number; cost: number }[];
  modelBreakdown: { model: string; tokens: number; cost: number; percentage: number }[];
  cacheEfficiency: { hitRatio: number; creationTokens: number; readTokens: number };
  peakHours: { hour: number; avgTokens: number }[];
  projection: { monthlyEstimate: number; dailyAverage: number };
}

const PIE_COLORS = [CHART_COLORS.cyan, CHART_COLORS.green, CHART_COLORS.amber];

export default function Analytics() {
  const { data, isLoading } = useApi<Analytics>("/analytics/tokens");
  if (isLoading || !data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>Token Analytics</h2>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Daily Average" value={fmtCost(data.projection.dailyAverage)} />
        <StatCard label="Monthly Projection" value={fmtCost(data.projection.monthlyEstimate)} color="var(--accent-amber)" />
        <StatCard label="Cache Hit Ratio" value={`${data.cacheEfficiency.hitRatio.toFixed(1)}%`} color="var(--accent-green)" />
        <StatCard label="Cache Tokens" value={fmtTokens(data.cacheEfficiency.creationTokens + data.cacheEfficiency.readTokens)} sub={`${fmtTokens(data.cacheEfficiency.readTokens)} reads`} />
      </div>

      <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Usage Over Time</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.timeSeries}>
            <XAxis dataKey="date" tick={{ fill: "#555568", fontSize: 11 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fill: "#555568", fontSize: 11 }} tickFormatter={fmtTokens} />
            <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
            <Legend />
            <Area type="monotone" dataKey="input" stackId="1" stroke={TOKEN_COLORS.input} fill={TOKEN_COLORS.input} fillOpacity={0.3} name="Input" />
            <Area type="monotone" dataKey="output" stackId="1" stroke={TOKEN_COLORS.output} fill={TOKEN_COLORS.output} fillOpacity={0.3} name="Output" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Model Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.modelBreakdown} dataKey="tokens" nameKey="model" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.modelBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtTokens(v)} />
              <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Peak Hours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.peakHours}>
              <XAxis dataKey="hour" tick={{ fill: "#555568", fontSize: 10 }} tickFormatter={h => `${h}:00`} />
              <YAxis tick={{ fill: "#555568", fontSize: 10 }} tickFormatter={fmtTokens} />
              <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.cyan} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
