import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ActivityData { heatmap: { date: string; count: number; tokens: number }[]; currentStreak: number; longestStreak: number; dayOfWeek: { day: number; avgSessions: number; avgTokens: number }[]; hourOfDay: { hour: number; avgSessions: number; avgTokens: number }[]; }
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HeatmapGrid({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const today = new Date();
  const cells: { date: string; count: number; col: number; row: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = data.find(e => e.date === key);
    cells.push({ date: key, count: entry?.count || 0, col: Math.floor((364 - i) / 7), row: d.getDay() });
  }
  return (
    <div className="overflow-x-auto">
      <svg width={cells.reduce((max, c) => Math.max(max, c.col), 0) * 13 + 20} height={7 * 13 + 6}>
        {cells.map((cell, i) => {
          const intensity = cell.count > 0 ? Math.min(cell.count / maxCount, 1) : 0;
          return <rect key={i} x={cell.col * 13} y={cell.row * 13} width={10} height={10} rx={2}
            fill={intensity === 0 ? "var(--bg-hover)" : `rgba(217, 119, 6, ${0.15 + intensity * 0.7})`}>
            <title>{cell.date}: {cell.count} sessions</title>
          </rect>;
        })}
      </svg>
    </div>
  );
}

export default function Activity() {
  const { data, isLoading } = useApi<ActivityData>("/activity");
  if (isLoading || !data) return <PageSkeleton />;

  return (
    <div className="page-enter space-y-8">
      <PageHeader pageName="Activity" />
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Current Streak" value={`${data.currentStreak} days`} color="var(--accent-amber)" />
        <StatCard label="Longest Streak" value={`${data.longestStreak} days`} color="var(--accent-green)" />
        <StatCard label="Active Days" value={data.heatmap.filter(d => d.count > 0).length.toString()} sub="in the last year" />
      </div>
      <div className="card p-6">
        <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Contribution Heatmap</h2>
        <HeatmapGrid data={data.heatmap} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Day of Week</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dayOfWeek.map(d => ({ ...d, name: DAY_LABELS[d.day] }))}>
              <XAxis dataKey="name" {...AXIS_STYLE} /><YAxis {...AXIS_STYLE} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgSessions" fill={CHART_COLORS.amber} radius={[2, 2, 0, 0]} opacity={0.8} name="Avg Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h2 className="mb-8 text-[12px] font-bold tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Peak Hours</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.hourOfDay}>
              <XAxis dataKey="hour" {...AXIS_STYLE} tickFormatter={h => `${h}h`} /><YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.green} radius={[2, 2, 0, 0]} opacity={0.8} name="Avg Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
