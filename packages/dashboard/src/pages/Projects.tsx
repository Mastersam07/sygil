import { useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { fmtTokens, fmtCost, fmtDuration, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { FolderOpen, GitBranch } from "lucide-react";

interface Project {
  path: string;
  name: string;
  hash: string;
  sessionCount: number;
  messageCount: number;
  duration: number;
  tokens: { input: number; output: number; cacheCreation: number; cacheRead: number };
  cost: number;
  branches: string[];
  lastActiveAt: string;
}

type SortKey = "cost" | "sessions" | "duration" | "messages";

export default function Projects() {
  const [sortBy, setSortBy] = useState<SortKey>("cost");
  const { data, isLoading } = useApi<{ projects: Project[] }>("/projects");

  const projects = useMemo(() => {
    return [...(data?.projects || [])].sort((a, b) => {
      if (sortBy === "sessions") return b.sessionCount - a.sessionCount;
      if (sortBy === "duration") return b.duration - a.duration;
      if (sortBy === "messages") return b.messageCount - a.messageCount;
      return b.cost - a.cost;
    });
  }, [data?.projects, sortBy]);

  if (isLoading || !data) return <PageSkeleton />;
  if (data.projects.length === 0) return <EmptyState title="No projects" message="Start using Claude Code in a project." icon={<FolderOpen size={24} />} />;

  return (
    <div className="page-enter space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["cost", "Cost"],
          ["sessions", "Sessions"],
          ["duration", "Duration"],
          ["messages", "Messages"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSortBy(value)}
            className="btn text-[11px] py-1.5"
            style={sortBy === value ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map(p => (
          <Link key={p.hash} to={`/sessions?project=${p.hash}`} className="card p-4 block hover:border-(--border-hover)">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen size={13} style={{ color: "var(--accent)" }} />
                <span className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{p.name}</span>
              </div>
              <span className="text-sm font-bold shrink-0 ml-2" style={{ color: "var(--accent-green)" }}>{fmtCost(p.cost)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-2">
              <div><span style={{ color: "var(--text-muted)" }}>sessions</span> <span style={{ color: "var(--text)" }}>{p.sessionCount}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>tokens</span> <span style={{ color: "var(--accent-blue)" }}>{fmtTokens(p.tokens.input + p.tokens.output)}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>messages</span> <span style={{ color: "var(--text)" }}>{p.messageCount.toLocaleString()}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>duration</span> <span style={{ color: "var(--text)" }}>{fmtDuration(p.duration)}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>$/session</span> <span style={{ color: "var(--text)" }}>{fmtCost(p.sessionCount > 0 ? p.cost / p.sessionCount : 0)}</span></div>
              <div><span style={{ color: "var(--text-muted)" }}>active</span> <span style={{ color: "var(--text)" }}>{timeAgo(p.lastActiveAt)}</span></div>
            </div>
            {p.branches.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <GitBranch size={10} style={{ color: "var(--text-muted)" }} />
                {p.branches.slice(0, 3).map(b => <span key={b} className="badge">{b}</span>)}
                {p.branches.length > 3 && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{p.branches.length - 3}</span>}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
