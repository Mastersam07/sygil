import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import DiffViewer from "../components/DiffViewer";
import { fmtDate } from "../lib/format";
import { Link } from "react-router-dom";
import { FileEdit, Plus, Minus, File, ChevronDown, ChevronRight } from "lucide-react";

interface FileChange {
  filePath: string;
  sessionId: string;
  project: string;
  timestamp: string;
  extension: string;
  hasSnapshot: boolean;
}

interface DiffLine {
  type: "add" | "remove" | "context";
  lineNumber: number;
  content: string;
}

interface FileDiff {
  fileHash: string;
  filePath: string;
  sessionId: string;
  versionBefore: number;
  versionAfter: number;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

interface ChangesData {
  changes: FileChange[];
  total: number;
  mostTouched: { filePath: string; count: number }[];
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalFiles: number;
}

function SessionDiffs({ sessionId }: { sessionId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useApi<FileDiff[]>(`/changes/${sessionId}/diffs`);

  if (isLoading) return <div className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>Loading diffs...</div>;
  if (!data || data.length === 0) return <div className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>No file snapshots for this session.</div>;

  return (
    <div className="space-y-1 mt-2">
      {data.map(d => (
        <div key={d.fileHash} className="card overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === d.fileHash ? null : d.fileHash)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
            style={{ background: expanded === d.fileHash ? "var(--bg-hover)" : "transparent" }}
          >
            {expanded === d.fileHash ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="text-[12px] mono flex-1 truncate" style={{ color: "var(--text-primary)" }}>
              {d.filePath.split("/").pop()}
            </span>
            <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>
              v{d.versionBefore}→v{d.versionAfter}
            </span>
            <span className="text-[11px] mono" style={{ color: "var(--accent-green)" }}>+{d.additions}</span>
            <span className="text-[11px] mono" style={{ color: "var(--accent-red)" }}>-{d.deletions}</span>
          </button>
          {expanded === d.fileHash && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <div className="px-3 py-1 text-[11px] truncate" style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
                {d.filePath}
              </div>
              <DiffViewer lines={d.lines} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChangeTimeline() {
  const { data, isLoading } = useApi<ChangesData>("/changes?limit=100");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (isLoading || !data) return <PageSkeleton />;

  if (data.total === 0) {
    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Change Timeline</h2>
        <EmptyState title="No file changes found" message="File changes will appear here as Claude edits files." icon={<FileEdit size={28} />} />
      </div>
    );
  }

  const sessionGroups = new Map<string, typeof data.changes>();
  for (const c of data.changes) {
    if (!c.sessionId) continue;
    const existing = sessionGroups.get(c.sessionId) || [];
    existing.push(c);
    sessionGroups.set(c.sessionId, existing);
  }

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Change Timeline</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Files Modified" value={data.totalFiles.toString()} icon={<File size={14} />} />
        <StatCard label="Total Changes" value={data.total.toString()} icon={<FileEdit size={14} />} />
        <StatCard label="Lines Added" value={`+${data.totalLinesAdded.toLocaleString()}`} color="var(--accent-green)" icon={<Plus size={14} />} />
        <StatCard label="Lines Removed" value={`-${data.totalLinesRemoved.toLocaleString()}`} color="var(--accent-red)" icon={<Minus size={14} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <p className="section-label">Sessions with Changes</p>
          {Array.from(sessionGroups.entries()).slice(0, 20).map(([sessionId, changes]) => (
            <div key={sessionId} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileEdit size={13} style={{ color: "var(--accent-amber)" }} className="shrink-0" />
                  <Link to={`/sessions/${sessionId}`} className="text-[13px] mono truncate" style={{ color: "var(--accent-cyan)" }}>
                    {sessionId.slice(0, 8)}
                  </Link>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {changes.length} files · {fmtDate(changes[0]?.timestamp || "")}
                  </span>
                </div>
                <button
                  onClick={() => setExpandedSession(expandedSession === sessionId ? null : sessionId)}
                  className="btn text-[11px] py-1"
                >
                  {expandedSession === sessionId ? "Hide diffs" : "View diffs"}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {changes.slice(0, 8).map((c, i) => (
                  <span key={i} className="badge mono">{c.filePath.split("/").pop()}</span>
                ))}
                {changes.length > 8 && (
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>+{changes.length - 8} more</span>
                )}
              </div>

              {expandedSession === sessionId && <SessionDiffs sessionId={sessionId} />}
            </div>
          ))}
        </div>

        <div className="card p-5 self-start">
          <p className="section-label">Most Touched Files</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.mostTouched.map((f, i) => (
              <div key={f.filePath} className="flex items-center gap-2">
                <span className="text-[11px] mono w-5 text-right shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] mono truncate" style={{ color: "var(--text-primary)" }}>
                    {f.filePath.split("/").pop() || f.filePath}
                  </p>
                </div>
                <span className="text-[11px] mono shrink-0" style={{ color: "var(--accent-cyan)" }}>{f.count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
