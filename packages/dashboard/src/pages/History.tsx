import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import { fmtDate, fmtTime } from "../lib/format";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>History</h2>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search prompts..."
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <div className="space-y-1">
        {entries.map((e, i) => (
          <div
            key={`${e.sessionId}-${i}`}
            className="rounded-lg border p-3 hover:border-cyan-900 transition-colors"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {e.prompt.length > 200 ? e.prompt.slice(0, 200) + "..." : e.prompt}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{fmtDate(e.timestamp)} {fmtTime(e.timestamp)}</span>
              {e.projectPath && <span className="truncate max-w-xs">{e.projectPath}</span>}
              {e.sessionId && (
                <Link
                  to={`/sessions/${e.sessionId}`}
                  className="hover:underline"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  View session →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && !isLoading && (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
          {query ? "No prompts match your search." : "No history found."}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>{total} prompts</span>
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
