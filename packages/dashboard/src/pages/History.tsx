import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { fmtDate, fmtTime } from "../lib/format";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Clock, Sparkles, ArrowRight, FolderOpen, MessageSquareText } from "lucide-react";

interface Entry {
  prompt: string;
  timestamp: string;
  projectPath: string;
  sessionId: string;
}

export default function History() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (query) params.set("q", query);

  const { data, isLoading } = useApi<{ entries: Entry[]; total: number }>(`/history?${params}`);

  if (isLoading && !data) return <PageSkeleton />;

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const uniqueProjects = new Set(entries.map(entry => entry.projectPath).filter(Boolean)).size;
  const latestEntry = entries[0];

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] items-start">
          <div>
            <p className="eyebrow">Prompt History</p>
            <h2 className="page-hero-title mt-3">Search, skim, and reconnect prompts to the sessions they came from.</h2>
            <p className="page-hero-copy">
              This view gives you a cleaner read of the raw prompt stream so you can revisit previous asks, trace them back to their project context, and jump directly into the originating session.
            </p>

            <div className="relative mt-6 max-w-xl">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search prompts..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
                className="input w-full pl-9 pr-3 py-3 text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Current Window</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--text-primary)" }}>
                {entries.length}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Prompts shown on this page out of {total.toLocaleString()} total indexed prompts.
              </p>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Latest Prompt</p>
              {latestEntry ? (
                <>
                  <p className="text-[15px] mt-3 leading-7" style={{ color: "var(--text-primary)" }}>
                    {latestEntry.prompt.length > 120 ? latestEntry.prompt.slice(0, 120) + "..." : latestEntry.prompt}
                  </p>
                  <div className="mt-4 badge">
                    <Sparkles size={11} />
                    {fmtDate(latestEntry.timestamp)} {fmtTime(latestEntry.timestamp)}
                  </div>
                </>
              ) : (
                <p className="text-[13px] mt-3" style={{ color: "var(--text-muted)" }}>No prompt history loaded yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Indexed Prompts</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-cyan)" }}>{total.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Visible Prompts</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--text-primary)" }}>{entries.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Projects In View</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-green)" }}>{uniqueProjects}</p>
        </div>
        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: "var(--text-muted)" }}>Page</p>
          <p className="text-[30px] mt-4 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-amber)" }}>{Math.max(page, 1)}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title={query ? "No prompts match" : "No history found"}
          message={query ? "Try a different search term." : "Your prompt history will appear here."}
          icon={<Clock size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <div key={`${e.sessionId}-${i}`} className="card card-glow p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(88, 214, 255, 0.12)", color: "var(--accent-cyan)" }}
                    >
                      <MessageSquareText size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: "var(--text-muted)" }}>
                        Prompt Snapshot
                      </p>
                      <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {fmtDate(e.timestamp)} · {fmtTime(e.timestamp)}
                      </p>
                    </div>
                  </div>

                  <p className="text-[14px] leading-7" style={{ color: "var(--text-primary)" }}>
                    {e.prompt.length > 260 ? e.prompt.slice(0, 260) + "..." : e.prompt}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {e.projectPath && (
                      <span className="badge">
                        <FolderOpen size={11} />
                        {e.projectPath}
                      </span>
                    )}
                    {e.sessionId && <span className="badge mono">{e.sessionId.slice(0, 8)}</span>}
                  </div>
                </div>

                {e.sessionId && (
                  <Link to={`/sessions/${e.sessionId}`} className="badge shrink-0" style={{ color: "var(--accent-cyan)" }}>
                    Open session <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="card p-4 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{total.toLocaleString()} prompts indexed</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn p-1.5">
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 mono">{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn p-1.5">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
