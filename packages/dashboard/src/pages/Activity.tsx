import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Trophy, CalendarDays } from "lucide-react";

interface ActivityData {
  heatmap: { date: string; count: number; tokens: number }[];
  currentStreak: number;
  longestStreak: number;
  dayOfWeek: { day: number; avgSessions: number; avgTokens: number }[];
  hourOfDay: { hour: number; avgSessions: number; avgTokens: number }[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HeatmapGrid({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const today = new Date();
  const cells: { date: string; count: number; col: number; row: number }[] = [];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = data.find(e => e.date === key);
    const col = Math.floor((364 - i) / 7);
    const row = d.getDay();
    cells.push({ date: key, count: entry?.count || 0, col, row });
  }

  return (
    <div className="overflow-x-auto pb-1">
      <svg width={cells.reduce((max, c) => Math.max(max, c.col), 0) * 13 + 20} height={7 * 13 + 6} className="block">
        {cells.map((cell, i) => {
          const intensity = cell.count > 0 ? Math.min(cell.count / maxCount, 1) : 0;
          const fill = intensity === 0
            ? "var(--bg-hover)"
            : `rgba(0, 200, 255, ${0.12 + intensity * 0.7})`;
          return (
            <rect
              key={i}
              x={cell.col * 13}
              y={cell.row * 13}
              width={10}
              height={10}
              rx={2}
              fill={fill}
            >
              <title>{cell.date}: {cell.count} sessions</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export default function Activity() {
  const { data, isLoading } = useApi<ActivityData>("/activity");
  if (isLoading || !data) return <PageSkeleton />;

  const dowData = data.dayOfWeek.map(d => ({ ...d, name: DAY_LABELS[d.day] }));
  const activeDays = data.heatmap.filter(d => d.count > 0).length;

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Activity</h2>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Current Streak" value={`${data.currentStreak} days`} color="var(--accent-amber)" icon={<Flame size={14} />} />
        <StatCard label="Longest Streak" value={`${data.longestStreak} days`} color="var(--accent-green)" icon={<Trophy size={14} />} />
        <StatCard label="Active Days" value={activeDays.toString()} sub="in the last year" icon={<CalendarDays size={14} />} />
      </div>

      <div className="card p-5">
        <p className="section-label">Contribution Heatmap</p>
        <HeatmapGrid data={data.heatmap} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card p-5">
          <p className="section-label">Day of Week</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dowData}>
              <XAxis dataKey="name" {...AXIS_STYLE} />
              <YAxis {...AXIS_STYLE} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgSessions" fill={CHART_COLORS.cyan} radius={[3, 3, 0, 0]} opacity={0.8} name="Avg Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="section-label">Peak Hours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.hourOfDay}>
              <XAxis dataKey="hour" {...AXIS_STYLE} tickFormatter={h => `${h}h`} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.green} radius={[3, 3, 0, 0]} opacity={0.8} name="Avg Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
