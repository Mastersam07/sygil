import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Brain, Search, AlertTriangle } from "lucide-react";

interface MemoryFile {
  path: string;
  name: string;
  projectSlug: string;
  type: string;
  description: string;
  content: string;
  modifiedAt: string;
  isStale: boolean;
  isIndex: boolean;
}

interface MemoryData {
  files: MemoryFile[];
  countByProject: { project: string; count: number }[];
  countByType: { type: string; count: number }[];
}

const TYPE_COLORS: Record<string, string> = {
  user: "var(--accent-cyan)",
  feedback: "var(--accent-amber)",
  project: "var(--accent-green)",
  reference: "var(--accent-purple)",
  index: "var(--text-muted)",
  unknown: "var(--text-muted)",
};

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
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Memory</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Memory Files" value={files.length.toString()} icon={<Brain size={14} />} />
        <StatCard label="Projects" value={(data?.countByProject.length || 0).toString()} />
        <StatCard label="Stale Files" value={files.filter(f => f.isStale).length.toString()} color="var(--accent-amber)" icon={<AlertTriangle size={14} />} />
        <StatCard label="Types" value={types.length.toString()} />
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search memory..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input w-full pl-9 pr-3 py-2 text-[13px]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="input px-3 py-2 text-[13px]"
        >
          <option value="">All types</option>
          {types.map(t => <option key={t.type} value={t.type}>{t.type} ({t.count})</option>)}
        </select>
      </div>

      {files.length === 0 ? (
        <EmptyState title="No memory files" message="Claude's auto-memory will appear here." icon={<Brain size={28} />} />
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div
              key={f.path}
              className="card cursor-pointer"
              onClick={() => setExpanded(expanded === f.path ? null : f.path)}
            >
              <div className="p-3 flex items-center gap-3">
                <span
                  className="badge"
                  style={{ color: TYPE_COLORS[f.type] || "var(--text-muted)", borderColor: TYPE_COLORS[f.type] }}
                >
                  {f.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                  {f.description && (
                    <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{f.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{f.projectSlug.split("-").pop()}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{fmtDate(f.modifiedAt)}</p>
                </div>
                {f.isStale && (
                  <AlertTriangle size={12} style={{ color: "var(--accent-amber)" }} />
                )}
              </div>
              {expanded === f.path && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <pre className="text-[12px] mt-3 whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {f.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
