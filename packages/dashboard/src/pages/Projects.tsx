import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { FolderOpen, GitBranch } from "lucide-react";

interface Project {
  path: string;
  name: string;
  hash: string;
  sessionCount: number;
  tokens: { input: number; output: number; cacheCreation: number; cacheRead: number };
  cost: number;
  branches: string[];
  lastActiveAt: string;
}

export default function Projects() {
  const { data, isLoading } = useApi<{ projects: Project[] }>("/projects");
  if (isLoading || !data) return <PageSkeleton />;

  if (data.projects.length === 0) {
    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Projects</h2>
        <EmptyState title="No projects found" message="Start using Claude Code in a project directory." icon={<FolderOpen size={28} />} />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Projects</h2>
        <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>{data.projects.length} projects</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {data.projects.map(p => (
          <Link
            key={p.hash}
            to={`/sessions?project=${p.hash}`}
            className="card card-glow p-4 block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen size={14} style={{ color: "var(--accent-cyan)" }} className="shrink-0" />
                <h3 className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
              </div>
              <span className="text-base font-bold mono shrink-0 ml-2" style={{ color: "var(--accent-green)" }}>{fmtCost(p.cost)}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] mb-3">
              <div>
                <span style={{ color: "var(--text-muted)" }}>Sessions</span>
                <p className="mono font-medium" style={{ color: "var(--text-primary)" }}>{p.sessionCount}</p>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Tokens</span>
                <p className="mono font-medium" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(p.tokens.input + p.tokens.output)}</p>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Cost/Session</span>
                <p className="mono font-medium" style={{ color: "var(--text-primary)" }}>{fmtCost(p.sessionCount > 0 ? p.cost / p.sessionCount : 0)}</p>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Last Active</span>
                <p style={{ color: "var(--text-primary)" }}>{timeAgo(p.lastActiveAt)}</p>
              </div>
            </div>

            {p.branches.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <GitBranch size={11} style={{ color: "var(--text-muted)" }} />
                {p.branches.slice(0, 3).map(b => (
                  <span key={b} className="badge">{b}</span>
                ))}
                {p.branches.length > 3 && (
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>+{p.branches.length - 3}</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
