import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Session {
  id: string;
  title: string;
  project: string;
  branch: string | null;
  startedAt: string;
  messageCount: number;
  tokens: { input: number; output: number; cacheCreation: number; cacheRead: number };
  cost: number;
  model: string;
  badges: string[];
}

const BADGE_MAP: Record<string, string> = {
  compacted: "⚡", agent: "🤖", mcp: "🔌", web: "🔍", thinking: "🧠",
};

export default function Sessions() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");
  const limit = 30;

  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, order: "desc" });
  if (query) params.set("q", query);

  const { data, isLoading } = useApi<{ sessions: Session[]; total: number }>(`/sessions?${params}`);

  if (isLoading && !data) return <PageSkeleton />;

  const sessions = data?.sessions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>Sessions</h2>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <option value="date">Date</option>
          <option value="tokens">Tokens</option>
          <option value="cost">Cost</option>
          <option value="messages">Messages</option>
        </select>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Session</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Project</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Tokens</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>Cost</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-muted)" }}>When</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr
                key={s.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td className="px-4 py-3">
                  <Link to={`/sessions/${s.id}`} className="block">
                    <span style={{ color: "var(--text-primary)" }}>{s.title}</span>
                    {s.badges.length > 0 && (
                      <span className="ml-2 text-xs">
                        {s.badges.map(b => BADGE_MAP[b] || b).join(" ")}
                      </span>
                    )}
                    {s.branch && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                        {s.branch}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{s.project}</td>
                <td className="px-4 py-3 text-right mono text-xs" style={{ color: "var(--accent-cyan)" }}>
                  {fmtTokens(s.tokens.input + s.tokens.output)}
                </td>
                <td className="px-4 py-3 text-right mono text-xs" style={{ color: "var(--accent-green)" }}>
                  {fmtCost(s.cost)}
                </td>
                <td className="px-4 py-3 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(s.startedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>{total} sessions</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1 rounded hover:bg-white/10 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
