import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Brain, Search, AlertTriangle } from "lucide-react";

interface MemoryFile { path: string; name: string; projectSlug: string; type: string; description: string; content: string; modifiedAt: string; isStale: boolean; staleReason?: string; missingSessionId?: string; isIndex: boolean; }
interface MemoryData { files: MemoryFile[]; countByProject: { project: string; count: number }[]; countByType: { type: string; count: number }[]; }

export default function Memory() {
  const [typeFilter, setTypeFilter] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (typeFilter) params.set("type", typeFilter);
  if (query) params.set("q", query);

  const { data, isLoading } = useApi<MemoryData>(`/memory?${params}`);
  if (isLoading && !data) return <PageSkeleton />;
  const files = data?.files || [];
  const types = data?.countByType || [];

  return (
    <div className="page-enter space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Memory Files" value={files.length.toString()} />
        <StatCard label="Projects" value={(data?.countByProject.length || 0).toString()} />
        <StatCard label="Stale" value={files.filter(f => f.isStale).length.toString()} color="var(--accent-amber)" />
        <StatCard label="Types" value={types.length.toString()} />
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search memory..." value={query} onChange={e => setQuery(e.target.value)} className="input w-full pl-9 pr-3 py-2 text-[13px]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input px-3 py-2 text-[13px]">
          <option value="">All types</option>
          {types.map(t => <option key={t.type} value={t.type}>{t.type} ({t.count})</option>)}
        </select>
      </div>

      {files.length === 0 ? <EmptyState title="No memory files" message="Claude's auto-memory will appear here." icon={<Brain size={24} />} /> : (
        <div className="space-y-1">
          {files.map(f => (
            <div key={f.path} className="card cursor-pointer" onClick={() => setExpanded(expanded === f.path ? null : f.path)}>
              <div className="p-3 flex items-center gap-2">
                <span className="badge">{f.type}</span>
                <span className="text-[13px] font-bold flex-1 truncate" style={{ color: "var(--text)" }}>{f.name}</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{f.projectSlug.split("-").pop()}</span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{fmtDate(f.modifiedAt)}</span>
                {f.isStale && <AlertTriangle size={11} style={{ color: "var(--accent-amber)" }} />}
              </div>
              {expanded === f.path && (
                <div className="px-3 pb-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <pre className="text-[12px] mt-2 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{f.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
