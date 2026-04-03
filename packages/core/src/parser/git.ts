import type { SessionMeta, GitBranchStats } from "../types.js";

export function computeGitStats(sessions: SessionMeta[]): GitBranchStats[] {
  const branchMap = new Map<string, { sessions: number; tokens: number; cost: number; firstSeen: string; lastSeen: string }>();

  for (const s of sessions) {
    const branch = s.branch || "(no branch)";
    const existing = branchMap.get(branch) || { sessions: 0, tokens: 0, cost: 0, firstSeen: s.startedAt, lastSeen: s.startedAt };
    existing.sessions += 1;
    existing.tokens += s.tokens.input + s.tokens.output;
    existing.cost += s.cost;
    if (s.startedAt < existing.firstSeen) existing.firstSeen = s.startedAt;
    if (s.startedAt > existing.lastSeen) existing.lastSeen = s.startedAt;
    branchMap.set(branch, existing);
  }

  return Array.from(branchMap.entries())
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.cost - a.cost);
}
