import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import DiffViewer from "../components/DiffViewer";
import { fmtDate } from "../lib/format";
import { Link } from "react-router-dom";
import { FileEdit, ChevronDown, ChevronRight } from "lucide-react";

interface FileChange { filePath: string; sessionId: string; project: string; timestamp: string; extension: string; hasSnapshot: boolean; }
interface DiffLine { type: "add" | "remove" | "context"; lineNumber: number; content: string; }
interface FileDiff { fileHash: string; filePath: string; sessionId: string; versionBefore: number; versionAfter: number; lines: DiffLine[]; additions: number; deletions: number; }
interface ChangesData { changes: FileChange[]; total: number; mostTouched: { filePath: string; count: number }[]; totalLinesAdded: number; totalLinesRemoved: number; totalFiles: number; }

function SessionDiffs({ sessionId }: { sessionId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useApi<FileDiff[]>(`/changes/${sessionId}/diffs`);
  if (isLoading) return <p className="text-[11px] py-2" style={{ color: "var(--text-muted)" }}>Loading diffs...</p>;
  if (!data || data.length === 0) return <p className="text-[11px] py-2" style={{ color: "var(--text-muted)" }}>No snapshots for this session.</p>;

  return (
    <div className="space-y-1 mt-2">
      {data.map(d => (
        <div key={d.fileHash} className="card overflow-hidden">
          <button onClick={() => setExpanded(expanded === d.fileHash ? null : d.fileHash)} className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px]">
            {expanded === d.fileHash ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{d.filePath.split("/").pop()}</span>
            <span style={{ color: "var(--text-muted)" }}>v{d.versionBefore}→v{d.versionAfter}</span>
            <span style={{ color: "var(--accent-green)" }}>+{d.additions}</span>
            <span style={{ color: "var(--accent-red)" }}>-{d.deletions}</span>
          </button>
          {expanded === d.fileHash && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <div className="px-3 py-1 text-[10px] truncate" style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}>{d.filePath}</div>
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
  if (data.total === 0) return <EmptyState title="No changes" message="File changes will appear as Claude edits files." icon={<FileEdit size={24} />} />;

  const sessionGroups = new Map<string, typeof data.changes>();
  for (const c of data.changes) { if (!c.sessionId) continue; const g = sessionGroups.get(c.sessionId) || []; g.push(c); sessionGroups.set(c.sessionId, g); }

  return (
    <div className="page-enter space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Files Modified" value={data.totalFiles.toString()} />
        <StatCard label="Total Changes" value={data.total.toString()} />
        <StatCard label="Lines Added" value={`+${data.totalLinesAdded.toLocaleString()}`} color="var(--accent-green)" />
        <StatCard label="Lines Removed" value={`-${data.totalLinesRemoved.toLocaleString()}`} color="var(--accent-red)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <div className="space-y-2">
          <p className="section-label">sessions with changes</p>
          {Array.from(sessionGroups.entries()).slice(0, 20).map(([sid, changes]) => (
            <div key={sid} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit size={12} style={{ color: "var(--accent-amber)" }} />
                  <Link to={`/sessions/${sid}`} className="text-[12px]" style={{ color: "var(--accent)" }}>{sid.slice(0, 8)}</Link>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{changes.length} files · {fmtDate(changes[0]?.timestamp || "")}</span>
                </div>
                <button onClick={() => setExpandedSession(expandedSession === sid ? null : sid)} className="btn text-[11px] py-0.5 px-2">
                  {expandedSession === sid ? "hide" : "diffs"}
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {changes.slice(0, 6).map((c, i) => <span key={i} className="badge">{c.filePath.split("/").pop()}</span>)}
                {changes.length > 6 && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{changes.length - 6}</span>}
              </div>
              {expandedSession === sid && <SessionDiffs sessionId={sid} />}
            </div>
          ))}
        </div>

        <div className="card p-4 self-start">
          <p className="section-label">most touched</p>
          <div className="space-y-1.5">
            {data.mostTouched.map((f, i) => (
              <div key={f.filePath} className="flex items-center gap-2 text-[11px]">
                <span className="w-4 text-right shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                <span className="flex-1 truncate" style={{ color: "var(--text)" }}>{f.filePath.split("/").pop() || f.filePath}</span>
                <span className="shrink-0" style={{ color: "var(--accent)" }}>{f.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
