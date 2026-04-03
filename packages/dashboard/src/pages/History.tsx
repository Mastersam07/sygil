import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { fmtDate, fmtTime } from "../lib/format";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface Entry { prompt: string; timestamp: string; projectPath: string; sessionId: string; }

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

  return (
    <div className="page-enter space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search prompts..." value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="input w-full pl-9 pr-3 py-2 text-[13px]" />
        </div>
        <span className="text-[11px] ml-auto" style={{ color: "var(--text-muted)" }}>{total} prompts</span>
      </div>

      {entries.length === 0 ? (
        <EmptyState title={query ? "No matches" : "No history"} message="Your prompt history will appear here." icon={<Clock size={24} />} />
      ) : (
        <div className="space-y-1">
          {entries.map((e, i) => (
            <div key={`${e.sessionId}-${i}`} className="card p-3">
              <p className="text-[13px]" style={{ color: "var(--text)" }}>{e.prompt.length > 200 ? e.prompt.slice(0, 200) + "..." : e.prompt}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span>{fmtDate(e.timestamp)} {fmtTime(e.timestamp)}</span>
                {e.projectPath && <span className="truncate max-w-48">{e.projectPath}</span>}
                {e.sessionId && <Link to={`/sessions/${e.sessionId}`} style={{ color: "var(--accent)" }}>session →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn p-1"><ChevronLeft size={14} /></button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn p-1"><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  );
}
