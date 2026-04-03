import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

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
    <div className="page-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Sessions</h2>
        <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>{total} total</span>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="input w-full pl-9 pr-3 py-2 text-[13px]"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="input px-3 py-2 text-[13px]"
        >
          <option value="date">Date</option>
          <option value="tokens">Tokens</option>
          <option value="cost">Cost</option>
          <option value="messages">Messages</option>
        </select>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title={query ? "No sessions match" : "No sessions found"}
          message={query ? "Try a different search term." : "Start using Claude Code to see sessions here."}
          icon={<MessageSquare size={28} />}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Project</th>
                <th className="text-right">Tokens</th>
                <th className="text-right">Cost</th>
                <th className="text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="cursor-pointer">
                  <td>
                    <Link to={`/sessions/${s.id}`} className="block">
                      <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{s.title}</span>
                      {s.badges.length > 0 && (
                        <span className="ml-2 text-[11px]">
                          {s.badges.map(b => BADGE_MAP[b] || b).join(" ")}
                        </span>
                      )}
                      {s.branch && (
                        <span className="badge ml-2">{s.branch}</span>
                      )}
                    </Link>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.project}</td>
                  <td className="text-right mono text-xs" style={{ color: "var(--accent-cyan)" }}>
                    {fmtTokens(s.tokens.input + s.tokens.output)}
                  </td>
                  <td className="text-right mono text-xs" style={{ color: "var(--accent-green)" }}>
                    {fmtCost(s.cost)}
                  </td>
                  <td className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(s.startedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{total} sessions</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn p-1.5">
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 mono">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn p-1.5">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
