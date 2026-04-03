import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import { TOOLTIP_STYLE, AXIS_STYLE } from "../components/ChartTooltip";
import { fmtTokens } from "../lib/format";
import { CHART_COLORS } from "../lib/colors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame, Trophy, CalendarDays, Sparkles, Clock3, Activity as ActivityIcon } from "lucide-react";

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
  const entries = new Map(data.map(item => [item.date, item.count]));

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const col = Math.floor((364 - i) / 7);
    const row = d.getDay();
    cells.push({ date: key, count: entries.get(key) || 0, col, row });
  }

  return (
    <div className="overflow-x-auto pb-1">
      <svg width={cells.reduce((max, c) => Math.max(max, c.col), 0) * 13 + 20} height={7 * 13 + 6} className="block">
        {cells.map((cell, i) => {
          const intensity = cell.count > 0 ? Math.min(cell.count / maxCount, 1) : 0;
          const fill = intensity === 0
            ? "rgba(255, 255, 255, 0.05)"
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
  const busiestDay = dowData.reduce((best, current) => {
    if (!best || current.avgSessions > best.avgSessions) return current;
    return best;
  }, dowData[0]);
  const busiestHour = data.hourOfDay.reduce((best, current) => {
    if (!best || current.avgTokens > best.avgTokens) return current;
    return best;
  }, data.hourOfDay[0]);

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] items-start">
          <div>
            <p className="eyebrow">Activity Rhythm</p>
            <h2 className="page-hero-title mt-3">A clear read on consistency, streaks, and when the workspace actually comes alive.</h2>
            <p className="page-hero-copy">
              See your contribution cadence over the past year, identify the strongest usage windows, and understand how session activity clusters across days and hours.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Current Streak"
                value={`${data.currentStreak} days`}
                sub="Consecutive active days right now"
                color="var(--accent-amber)"
                icon={<Flame size={16} />}
              />
              <StatCard
                label="Longest Streak"
                value={`${data.longestStreak} days`}
                sub="Best run captured in the last year"
                color="var(--accent-green)"
                icon={<Trophy size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Most Active Window</p>
              {busiestHour ? (
                <>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[30px] font-bold mono tracking-[-0.05em]" style={{ color: "var(--text-primary)" }}>
                        {String(busiestHour.hour).padStart(2, "0")}:00
                      </p>
                      <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                        {fmtTokens(busiestHour.avgTokens)} average tokens in the busiest hour
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(88, 214, 255, 0.12)", color: "var(--accent-cyan)" }}
                    >
                      <Clock3 size={18} />
                    </div>
                  </div>
                  <div className="mt-5 badge">
                    <Sparkles size={11} />
                    Strongest weekday: {busiestDay?.name || "—"}
                  </div>
                </>
              ) : (
                <p className="text-[13px] mt-4" style={{ color: "var(--text-muted)" }}>No hourly activity pattern yet.</p>
              )}
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Active Days</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-blue)" }}>
                {activeDays}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Distinct days with recorded Claude session activity across the last 365 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Current Streak" value={`${data.currentStreak} days`} color="var(--accent-amber)" icon={<Flame size={14} />} />
        <StatCard label="Longest Streak" value={`${data.longestStreak} days`} color="var(--accent-green)" icon={<Trophy size={14} />} />
        <StatCard label="Active Days" value={activeDays.toString()} sub="in the last year" icon={<CalendarDays size={14} />} />
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <p className="section-label mb-0">Contribution Heatmap</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              A year-long view of how frequently Claude-assisted work shows up in your flow.
            </p>
          </div>
          <div className="badge">
            <ActivityIcon size={11} />
            {activeDays} active days
          </div>
        </div>
        <HeatmapGrid data={data.heatmap} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_420px] gap-4 items-start">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Day of Week</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Average session count by weekday.
              </p>
            </div>
            {busiestDay && <span className="badge">{busiestDay.name} leads</span>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dowData}>
              <XAxis dataKey="name" {...AXIS_STYLE} />
              <YAxis {...AXIS_STYLE} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgSessions" fill={CHART_COLORS.cyan} radius={[8, 8, 0, 0]} opacity={0.82} name="Avg Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Peak Hours</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Average token activity by hour of day.
              </p>
            </div>
            {busiestHour && <span className="badge mono">{String(busiestHour.hour).padStart(2, "0")}:00</span>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.hourOfDay}>
              <XAxis dataKey="hour" {...AXIS_STYLE} tickFormatter={h => `${h}h`} />
              <YAxis {...AXIS_STYLE} tickFormatter={fmtTokens} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avgTokens" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} opacity={0.82} name="Avg Tokens" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="surface-muted p-3">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Best weekday</p>
              <p className="text-[18px] mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>{busiestDay?.name || "—"}</p>
            </div>
            <div className="surface-muted p-3">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Peak token hour</p>
              <p className="text-[18px] mt-2 font-semibold mono" style={{ color: "var(--accent-cyan)" }}>
                {busiestHour ? `${String(busiestHour.hour).padStart(2, "0")}:00` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
