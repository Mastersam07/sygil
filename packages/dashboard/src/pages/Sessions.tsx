import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, MessageSquare, ArrowRight, GitBranch, Layers3, TimerReset } from "lucide-react";

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
  compacted: "⚡",
  agent: "🤖",
  mcp: "🔌",
  web: "🔍",
  thinking: "🧠",
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
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <p className="eyebrow">Session Explorer</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mt-3">
          <div>
            <h2 className="page-hero-title">Search, sort, and compare the sessions that shape your spend.</h2>
            <p className="page-hero-copy">
              Move from raw transcripts to a portfolio view of models, branches, tools, and token intensity.
            </p>
          </div>
          <div className="surface-muted px-4 py-4 min-w-[220px]">
            <p className="text-[11px] uppercase tracking-[0.16em] font-bold" style={{ color: "var(--text-muted)" }}>Visible sessions</p>
            <p className="text-[36px] font-bold mono tracking-[-0.06em] mt-2" style={{ color: "var(--text-primary)" }}>{total}</p>
          </div>
        </div>
      </section>

      <div className="card p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search session title or project..."
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              className="input w-full pl-9 pr-3 py-3 text-[13px]"
            />
          </div>
          <div className="flex gap-3 lg:justify-end">
            <div className="surface-muted px-3 py-2 flex items-center gap-2">
              <TimerReset size={13} style={{ color: "var(--text-muted)" }} />
              <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Sort by</span>
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="input px-3 py-3 text-[13px] min-w-40"
            >
              <option value="date">Date</option>
              <option value="tokens">Tokens</option>
              <option value="cost">Cost</option>
              <option value="messages">Messages</option>
            </select>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title={query ? "No sessions match" : "No sessions found"}
          message={query ? "Try a different search term or clear the current filter." : "Start using Claude Code to see sessions here."}
          icon={<MessageSquare size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link key={s.id} to={`/sessions/${s.id}`} className="card card-glow block p-5 lg:p-6">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="badge">{s.project}</span>
                    {s.branch && (
                      <span className="badge">
                        <GitBranch size={11} />
                        {s.branch}
                      </span>
                    )}
                    <span className="badge mono">{s.model}</span>
                    {s.badges.map(b => (
                      <span key={b} className="badge">{BADGE_MAP[b] || b}</span>
                    ))}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-[20px] font-semibold tracking-[-0.04em] truncate" style={{ color: "var(--text-primary)" }}>
                        {s.title}
                      </h3>
                      <p className="text-[13px] mt-2" style={{ color: "var(--text-muted)" }}>
                        Last active {timeAgo(s.startedAt)}
                      </p>
                    </div>
                    <div className="hidden xl:flex items-center gap-2 badge" style={{ color: "var(--accent-cyan)" }}>
                      Open session <ArrowRight size={12} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:min-w-[520px]">
                  <div className="surface-muted p-3">
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Tokens</p>
                    <p className="text-[16px] mt-2 font-semibold mono" style={{ color: "var(--accent-cyan)" }}>
                      {fmtTokens(s.tokens.input + s.tokens.output)}
                    </p>
                  </div>
                  <div className="surface-muted p-3">
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Messages</p>
                    <p className="text-[16px] mt-2 font-semibold mono" style={{ color: "var(--text-primary)" }}>
                      {s.messageCount}
                    </p>
                  </div>
                  <div className="surface-muted p-3">
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Cost</p>
                    <p className="text-[16px] mt-2 font-semibold mono" style={{ color: "var(--accent-green)" }}>
                      {fmtCost(s.cost)}
                    </p>
                  </div>
                  <div className="surface-muted p-3">
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Signals</p>
                    <p className="text-[16px] mt-2 font-semibold" style={{ color: "var(--text-primary)" }}>
                      {s.badges.length > 0 ? s.badges.length : 1}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
            <div className="flex items-center gap-2">
              <Layers3 size={14} />
              <span>{total} sessions indexed</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn p-2.5">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-2 rounded-full border mono text-[12px]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Page {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn p-2.5">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
