import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Link } from "react-router-dom";
import { FileEdit, Plus, Minus, File } from "lucide-react";

interface FileChange {
  filePath: string;
  sessionId: string;
  project: string;
  timestamp: string;
  extension: string;
  hasSnapshot: boolean;
}

interface ChangesData {
  changes: FileChange[];
  total: number;
  mostTouched: { filePath: string; count: number }[];
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalFiles: number;
}

export default function ChangeTimeline() {
  const { data, isLoading } = useApi<ChangesData>("/changes?limit=100");
  if (isLoading || !data) return <PageSkeleton />;

  if (data.total === 0) {
    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Change Timeline</h2>
        <EmptyState title="No file changes found" message="File changes will appear here as Claude edits files." icon={<FileEdit size={28} />} />
      </div>
    );
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
        <div className="lg:col-span-2 card p-5">
          <p className="section-label">Recent Changes</p>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {data.changes.map((c, i) => (
              <div
                key={`${c.sessionId}-${c.filePath}-${i}`}
                className="flex items-center gap-3 py-2 px-2 rounded-lg transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <FileEdit size={13} style={{ color: "var(--accent-amber)" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] mono truncate" style={{ color: "var(--text-primary)" }}>
                    {c.filePath.split("/").pop()}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                    {c.filePath}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtDate(c.timestamp)}</p>
                  {c.sessionId && (
                    <Link to={`/sessions/${c.sessionId}`} className="text-[10px]" style={{ color: "var(--accent-cyan)" }}>
                      session →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="section-label">Most Touched Files</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.mostTouched.map((f, i) => (
              <div key={f.filePath} className="flex items-center gap-2">
                <span className="text-[11px] mono w-5 text-right shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] mono truncate" style={{ color: "var(--text-primary)" }}>
                    {f.filePath.split("/").pop()}
                  </p>
                </div>
                <span className="text-[11px] mono shrink-0" style={{ color: "var(--accent-cyan)" }}>{f.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
