import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import PageHeader from "../components/PageHeader";
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

const BADGE_MAP: Record<string, string> = { compacted: "⚡", agent: "🤖", mcp: "🔌", web: "🔍", thinking: "🧠" };

export default function Sessions() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");
  const limit = 30;

  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, order: "desc" });
  if (query) params.set("q", query);

  const { data, isLoading, mutate } = useApi<{ sessions: Session[]; total: number }>(`/sessions?${params}`);
  if (isLoading && !data) return <PageSkeleton />;

  const sessions = data?.sessions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-enter space-y-8">
      <PageHeader 
        pageName="sessions" 
        subtitle={`${total} total sessions`} 
        onRefresh={() => mutate()} 
      />

      <div className="flex gap-6 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search project or prompt..." value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="input w-full pl-9" />
        </div>
        
        <div className="flex items-center gap-2 border rounded border-(--border)">
          {/* Mock filters based on reference app Design Audit */}
          <button className="px-3 py-1.5 text-[13px] bg-(--bg-hover) text-(--text)">all</button>
          <button className="px-3 py-1.5 text-[13px] text-(--text-muted) hover:text-(--text) hover:bg-(--bg-hover)">active</button>
          <button className="px-3 py-1.5 text-[13px] text-(--text-muted) hover:text-(--text) hover:bg-(--bg-hover)">recent</button>
        </div>

        <div className="flex gap-6 items-center text-[12px] text-(--text-muted) ml-2 border-l border-(--border) pl-4">
           <label className="flex items-center gap-1.5 cursor-pointer hover:text-(--text)"><input type="checkbox" className="accent-(--accent)" /> ⚡ compacted</label>
           <label className="flex items-center gap-1.5 cursor-pointer hover:text-(--text)"><input type="checkbox" className="accent-(--accent)" /> 🤖 agent</label>
           <label className="flex items-center gap-1.5 cursor-pointer hover:text-(--text)"><input type="checkbox" className="accent-(--accent)" /> 🔌 mcp</label>
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)} className="input ml-auto">
          <option value="date">Date ↓</option>
          <option value="tokens">Tokens</option>
          <option value="cost">Cost</option>
          <option value="messages">Messages</option>
        </select>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title={query ? "No matches" : "No sessions"} message="Start using Claude Code to see sessions here." icon={<MessageSquare size={24} />} />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th className="w-24">Date</th>
                <th>Project</th>
                <th>Session</th>
                <th className="text-right">Tokens</th>
                <th className="text-right">Cost</th>
                <th className="w-16 text-right">Flags</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="cursor-pointer group">
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(s.startedAt).toLocaleDateString([], { month: "numeric", day: "numeric", year: "2-digit" })}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{s.project || "—"}</td>
                  <td>
                    <Link to={`/sessions/${s.id}`} className="block">
                      <span className="group-hover:text-(--accent) transition-colors" style={{ color: "var(--text)" }}>{s.title}</span>
                      {s.branch && <span className="badge ml-2">{s.branch}</span>}
                    </Link>
                  </td>
                  <td className="text-right" style={{ color: "var(--accent-amber)" }}>{fmtTokens(s.tokens.input + s.tokens.output)}</td>
                  <td className="text-right" style={{ color: "var(--accent-green)" }}>{fmtCost(s.cost)}</td>
                  <td className="text-right text-[12px]">
                    {s.badges.map(b => BADGE_MAP[b] || "").join(" ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
