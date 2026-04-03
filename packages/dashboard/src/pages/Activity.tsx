import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { fmtTokens } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
    <div className="overflow-x-auto">
      <svg width={cells.reduce((max, c) => Math.max(max, c.col), 0) * 14 + 30} height={7 * 14 + 10} className="block">
        {cells.map((cell, i) => {
          const intensity = cell.count > 0 ? Math.min(cell.count / maxCount, 1) : 0;
          const fill = intensity === 0
            ? "var(--bg-hover)"
            : `rgba(0, 212, 255, ${0.15 + intensity * 0.75})`;
          return (
            <rect
              key={i}
              x={cell.col * 14}
              y={cell.row * 14}
              width={11}
              height={11}
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
  const hourData = data.hourOfDay;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>Activity</h2>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Current Streak" value={`${data.currentStreak} days`} color="var(--accent-amber)" />
        <StatCard label="Longest Streak" value={`${data.longestStreak} days`} color="var(--accent-green)" />
        <StatCard label="Active Days" value={data.heatmap.filter(d => d.count > 0).length.toString()} sub="in the last year" />
      </div>

      <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Contribution Heatmap</h3>
        <HeatmapGrid data={data.heatmap} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Day of Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dowData}>
              <XAxis dataKey="name" tick={{ fill: "#555568", fontSize: 11 }} />
              <YAxis tick={{ fill: "#555568", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avgSessions" fill={CHART_COLORS.cyan} radius={[3, 3, 0, 0]} name="Avg Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>Peak Hours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourData}>
              <XAxis dataKey="hour" tick={{ fill: "#555568", fontSize: 10 }} tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fill: "#555568", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.green} radius={[3, 3, 0, 0]} name="Avg Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
