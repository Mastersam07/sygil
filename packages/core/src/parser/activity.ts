import type { SessionMeta, ActivityData } from "../types.js";

export function computeActivity(sessions: SessionMeta[]): ActivityData {
  const dailyMap = new Map<string, { count: number; tokens: number }>();
  const dowMap = new Map<number, { sessions: number; tokens: number; days: number }>();
  const hourMap = new Map<number, { sessions: number; tokens: number; days: number }>();

  for (const s of sessions) {
    if (!s.startedAt) continue;
    const d = new Date(s.startedAt);
    const dateKey = s.startedAt.slice(0, 10);
    const totalTok = s.tokens.input + s.tokens.output;

    const existing = dailyMap.get(dateKey) || { count: 0, tokens: 0 };
    existing.count += 1;
    existing.tokens += totalTok;
    dailyMap.set(dateKey, existing);

    const dow = d.getDay();
    const dExisting = dowMap.get(dow) || { sessions: 0, tokens: 0, days: 0 };
    dExisting.sessions += 1;
    dExisting.tokens += totalTok;
    dowMap.set(dow, dExisting);

    const hour = d.getHours();
    const hExisting = hourMap.get(hour) || { sessions: 0, tokens: 0, days: 0 };
    hExisting.sessions += 1;
    hExisting.tokens += totalTok;
    hourMap.set(hour, hExisting);
  }

  const sortedDates = Array.from(dailyMap.keys()).sort();
  const activeDays = new Set(sortedDates);

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (activeDays.has(key)) {
      streak++;
      if (i === 0 || streak > 1) currentStreak = Math.max(currentStreak, streak);
      longestStreak = Math.max(longestStreak, streak);
    } else {
      if (i === 0) currentStreak = 0;
      streak = 0;
    }
  }

  const heatmap = Array.from(dailyMap.entries())
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weeks = Math.max(1, dailyMap.size / 7);
  const dayOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = dowMap.get(i) || { sessions: 0, tokens: 0 };
    return { day: i, avgSessions: d.sessions / weeks, avgTokens: d.tokens / weeks };
  });

  const hourOfDay = Array.from({ length: 24 }, (_, i) => {
    const h = hourMap.get(i) || { sessions: 0, tokens: 0 };
    return { hour: i, avgSessions: h.sessions / weeks, avgTokens: h.tokens / weeks };
  });

  return { heatmap, currentStreak, longestStreak, dayOfWeek, hourOfDay };
}
