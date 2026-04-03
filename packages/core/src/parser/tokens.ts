import type { SessionMeta, TokenAnalytics, DailyUsage, ModelBreakdown } from "../types.js";

export function computeTokenAnalytics(sessions: SessionMeta[], period: "day" | "week" | "month" = "day"): TokenAnalytics {
  const dailyMap = new Map<string, { input: number; output: number; cacheCreation: number; cacheRead: number; cost: number; sessions: number }>();
  const modelMap = new Map<string, { tokens: number; cost: number }>();
  const hourMap = new Map<number, { tokens: number; count: number }>();
  let totalTokens = 0;
  let totalCacheCreation = 0;
  let totalCacheRead = 0;

  for (const s of sessions) {
    const dateKey = s.startedAt ? s.startedAt.slice(0, 10) : "unknown";
    const existing = dailyMap.get(dateKey) || { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, cost: 0, sessions: 0 };
    existing.input += s.tokens.input;
    existing.output += s.tokens.output;
    existing.cacheCreation += s.tokens.cacheCreation;
    existing.cacheRead += s.tokens.cacheRead;
    existing.cost += s.cost;
    existing.sessions += 1;
    dailyMap.set(dateKey, existing);

    const modelKey = s.model.includes("opus") ? "Opus" : s.model.includes("haiku") ? "Haiku" : "Sonnet";
    const mExisting = modelMap.get(modelKey) || { tokens: 0, cost: 0 };
    mExisting.tokens += s.tokens.input + s.tokens.output;
    mExisting.cost += s.cost;
    modelMap.set(modelKey, mExisting);

    totalTokens += s.tokens.input + s.tokens.output;
    totalCacheCreation += s.tokens.cacheCreation;
    totalCacheRead += s.tokens.cacheRead;

    if (s.startedAt) {
      const hour = new Date(s.startedAt).getHours();
      const h = hourMap.get(hour) || { tokens: 0, count: 0 };
      h.tokens += s.tokens.input + s.tokens.output;
      h.count += 1;
      hourMap.set(hour, h);
    }
  }

  const timeSeries = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, tokens: d.input + d.output, ...d }));

  const modelBreakdown: ModelBreakdown[] = Array.from(modelMap.entries()).map(([model, d]) => ({
    model, tokens: d.tokens, cost: d.cost, percentage: totalTokens > 0 ? (d.tokens / totalTokens) * 100 : 0,
  }));

  const totalCache = totalCacheCreation + totalCacheRead;
  const cacheEfficiency = {
    hitRatio: totalCache > 0 ? (totalCacheRead / totalCache) * 100 : 0,
    creationTokens: totalCacheCreation,
    readTokens: totalCacheRead,
  };

  const peakHours = Array.from(hourMap.entries())
    .map(([hour, d]) => ({ hour, avgTokens: d.count > 0 ? Math.round(d.tokens / d.count) : 0 }))
    .sort((a, b) => a.hour - b.hour);

  const days = dailyMap.size || 1;
  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const dailyAvg = totalCost / days;

  return {
    timeSeries,
    modelBreakdown,
    cacheEfficiency,
    peakHours,
    projection: { monthlyEstimate: dailyAvg * 30, dailyAverage: dailyAvg },
  };
}
