import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import DiffViewer from "../components/DiffViewer";
import { fmtDate, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { FileEdit, Plus, Minus, File, ChevronDown, ChevronRight, Sparkles, Clock3, ArrowRight } from "lucide-react";

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
    <div className="space-y-2 mt-3">
      {data.map(d => (
        <div key={d.fileHash} className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(expanded === d.fileHash ? null : d.fileHash)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
            style={{ background: expanded === d.fileHash ? "var(--bg-hover)" : "transparent" }}
          >
            {expanded === d.fileHash ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="text-[12px] mono flex-1 truncate" style={{ color: "var(--text-primary)" }}>
              {d.filePath.split("/").pop()}
            </span>
            <span className="text-[11px] mono shrink-0" style={{ color: "var(--text-muted)" }}>
              v{d.versionBefore}→v{d.versionAfter}
            </span>
            <span className="text-[11px] mono shrink-0" style={{ color: "var(--accent-green)" }}>+{d.additions}</span>
            <span className="text-[11px] mono shrink-0" style={{ color: "var(--accent-red)" }}>-{d.deletions}</span>
          </button>
          {expanded === d.fileHash && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <div className="px-4 py-2 text-[11px] truncate" style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.03)" }}>
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
      <div className="page-enter space-y-5">
        <section className="card p-6 lg:p-8">
          <p className="eyebrow">Change Timeline</p>
          <h2 className="page-hero-title mt-3">File activity will surface here once Claude starts editing tracked files.</h2>
          <p className="page-hero-copy">
            This view follows changed files through sessions, snapshots, and diffs so workspace modifications can be reviewed in context.
          </p>
        </section>
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

  const sessionsWithChanges = Array.from(sessionGroups.entries())
    .map(([sessionId, changes]) => [
      sessionId,
      [...changes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    ] as const)
    .sort((a, b) => {
      const aTs = new Date(a[1][0]?.timestamp || 0).getTime();
      const bTs = new Date(b[1][0]?.timestamp || 0).getTime();
      return bTs - aTs;
    });
  const latestSession = sessionsWithChanges[0];
  const touchedLeader = data.mostTouched[0];

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Change Timeline</p>
            <h2 className="page-hero-title mt-3">Follow file edits across sessions with enough context to actually review what changed.</h2>
            <p className="page-hero-copy">
              Track which sessions produced code changes, which files were touched most often, and inspect stored diffs without leaving the dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Files Modified"
                value={data.totalFiles.toString()}
                sub={`${data.total} total file change events`}
                icon={<File size={16} />}
              />
              <StatCard
                label="Net Delta"
                value={`${data.totalLinesAdded - data.totalLinesRemoved >= 0 ? "+" : ""}${(data.totalLinesAdded - data.totalLinesRemoved).toLocaleString()}`}
                sub={`+${data.totalLinesAdded.toLocaleString()} added · -${data.totalLinesRemoved.toLocaleString()} removed`}
                color="var(--accent-green)"
                icon={<Plus size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            {latestSession && (
              <div className="surface-muted p-5">
                <p className="eyebrow">Latest Change Session</p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[28px] font-bold mono tracking-[-0.05em]" style={{ color: "var(--text-primary)" }}>
                      {latestSession[0].slice(0, 8)}
                    </p>
                    <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                      {latestSession[1].length} files touched · {timeAgo(latestSession[1][0]?.timestamp || "")}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(88, 214, 255, 0.12)", color: "var(--accent-cyan)" }}
                  >
                    <Clock3 size={18} />
                  </div>
                </div>
                <Link to={`/sessions/${latestSession[0]}`} className="mt-5 badge" style={{ color: "var(--accent-cyan)" }}>
                  Open session <ArrowRight size={12} />
                </Link>
              </div>
            )}

            <div className="surface-muted p-5">
              <p className="eyebrow">Most Touched File</p>
              <p className="text-[28px] mt-3 font-bold tracking-[-0.05em] truncate" style={{ color: "var(--text-primary)" }}>
                {touchedLeader?.filePath.split("/").pop() || "—"}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {touchedLeader ? `${touchedLeader.count} change events across captured sessions.` : "No repeated file touchpoints yet."}
              </p>
              {touchedLeader && (
                <div className="mt-4 badge">
                  <Sparkles size={11} />
                  Hot file in the current timeline
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Files Modified" value={data.totalFiles.toString()} icon={<File size={14} />} />
        <StatCard label="Total Changes" value={data.total.toString()} icon={<FileEdit size={14} />} />
        <StatCard label="Lines Added" value={`+${data.totalLinesAdded.toLocaleString()}`} color="var(--accent-green)" icon={<Plus size={14} />} />
        <StatCard label="Lines Removed" value={`-${data.totalLinesRemoved.toLocaleString()}`} color="var(--accent-red)" icon={<Minus size={14} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.18fr)_420px] gap-4 items-start">
        <div className="space-y-3">
          <div>
            <p className="section-label mb-0">Sessions with Changes</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Recent sessions that produced tracked file modifications.
            </p>
          </div>
          {sessionsWithChanges.slice(0, 20).map(([sessionId, changes]) => (
            <div key={sessionId} className="card p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileEdit size={13} style={{ color: "var(--accent-amber)" }} className="shrink-0" />
                    <Link to={`/sessions/${sessionId}`} className="text-[13px] mono truncate" style={{ color: "var(--accent-cyan)" }}>
                      {sessionId.slice(0, 8)}
                    </Link>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {changes.length} files · {fmtDate(changes[0]?.timestamp || "")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {changes.slice(0, 8).map((c, i) => (
                      <span key={i} className="badge mono">{c.filePath.split("/").pop()}</span>
                    ))}
                    {changes.length > 8 && (
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>+{changes.length - 8} more</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedSession(expandedSession === sessionId ? null : sessionId)}
                  className="btn text-[11px] py-2 shrink-0"
                >
                  {expandedSession === sessionId ? "Hide diffs" : "View diffs"}
                </button>
              </div>

              {expandedSession === sessionId && <SessionDiffs sessionId={sessionId} />}
            </div>
          ))}
        </div>

        <div className="card p-5 self-start">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label mb-0">Most Touched Files</p>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Files showing up most often in tracked changes.
              </p>
            </div>
            <span className="badge">{data.mostTouched.length}</span>
          </div>
          <div className="space-y-2 max-h-[34rem] overflow-y-auto">
            {data.mostTouched.map((f, i) => (
              <div key={f.filePath} className="surface-muted px-4 py-3 flex items-center gap-3">
                <span className="text-[11px] mono w-5 text-right shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] mono truncate" style={{ color: "var(--text-primary)" }}>
                    {f.filePath.split("/").pop() || f.filePath}
                  </p>
                  <p className="text-[11px] mt-1 truncate" style={{ color: "var(--text-muted)" }}>{f.filePath}</p>
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
