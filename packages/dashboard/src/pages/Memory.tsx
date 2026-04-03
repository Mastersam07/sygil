import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Brain, Search, AlertTriangle, Sparkles, FolderOpen, ArrowRight } from "lucide-react";
import MarkdownBlock from "../components/MarkdownBlock";

interface MemoryFile {
  path: string;
  name: string;
  projectSlug: string;
  type: string;
  description: string;
  content: string;
  modifiedAt: string;
  isStale: boolean;
  staleReason?: "age" | "missing_session";
  missingSessionId?: string;
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
  const staleFiles = files.filter(f => f.isStale).length;
  const latestFile = files[0];
  const dominantType = types.slice().sort((a, b) => b.count - a.count)[0];

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Memory Browser</p>
            <h2 className="page-hero-title mt-3">Project memory, references, and stale context in a calmer review surface.</h2>
            <p className="page-hero-copy">
              Browse Claude’s memory artifacts by type, inspect stale or missing-session references, and read the actual contents without losing project context.
            </p>

            <div className="flex gap-2 items-center flex-wrap mt-6">
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search memory..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="input w-full pl-9 pr-3 py-3 text-[13px]"
                />
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input px-3 py-3 text-[13px]"
              >
                <option value="">All types</option>
                {types.map(t => <option key={t.type} value={t.type}>{t.type} ({t.count})</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Latest Memory</p>
              {latestFile ? (
                <>
                  <p className="text-[24px] mt-3 font-bold tracking-[-0.05em] truncate" style={{ color: "var(--text-primary)" }}>
                    {latestFile.name}
                  </p>
                  <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                    Modified {fmtDate(latestFile.modifiedAt)} · {latestFile.projectSlug}
                  </p>
                  <div className="mt-4 badge">
                    <Sparkles size={11} />
                    {latestFile.type}
                  </div>
                </>
              ) : (
                <p className="text-[13px] mt-3" style={{ color: "var(--text-muted)" }}>No memory files discovered yet.</p>
              )}
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Dominant Type</p>
              <p className="text-[30px] mt-3 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-cyan)" }}>
                {dominantType?.count || 0}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {dominantType ? `${dominantType.type} files currently dominate the visible memory set.` : "No type distribution available yet."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Memory Files" value={files.length.toString()} icon={<Brain size={14} />} />
        <StatCard label="Projects" value={(data?.countByProject.length || 0).toString()} />
        <StatCard label="Stale Files" value={staleFiles.toString()} color="var(--accent-amber)" icon={<AlertTriangle size={14} />} />
        <StatCard label="Types" value={types.length.toString()} />
      </div>

      {files.length === 0 ? (
        <EmptyState title="No memory files" message="Claude's auto-memory will appear here." icon={<Brain size={28} />} />
      ) : (
        <div className="space-y-3">
          {files.map(f => (
            <div
              key={f.path}
              className="card cursor-pointer overflow-hidden"
              onClick={() => setExpanded(expanded === f.path ? null : f.path)}
            >
              <div className="p-5 flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="badge"
                      style={{ color: TYPE_COLORS[f.type] || "var(--text-muted)" }}
                    >
                      {f.type}
                    </span>
                    {f.isIndex && <span className="badge">index</span>}
                    {f.isStale && (
                      <span className="badge" style={{ color: "var(--accent-amber)" }}>
                        <AlertTriangle size={11} />
                        stale
                      </span>
                    )}
                  </div>

                  <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                  {f.description && (
                    <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>{f.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="badge">
                      <FolderOpen size={11} />
                      {f.projectSlug}
                    </span>
                    <span className="badge">{fmtDate(f.modifiedAt)}</span>
                  </div>
                </div>

                <span className="badge shrink-0" style={{ color: "var(--accent-cyan)" }}>
                  {expanded === f.path ? "Hide content" : "Read memory"} <ArrowRight size={12} />
                </span>
              </div>
              {expanded === f.path && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--border)" }}>
                  {f.isStale && (
                    <p className="text-[12px] mt-4" style={{ color: "var(--accent-amber)" }}>
                      {f.staleReason === "missing_session" && f.missingSessionId
                        ? `References missing session ${f.missingSessionId.slice(0, 8)}`
                        : "Has not been updated recently"}
                    </p>
                  )}
                  <div className="surface-muted p-4 mt-4">
                    <MarkdownBlock content={f.content} className="text-[12px]" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
