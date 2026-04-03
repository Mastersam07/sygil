import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: "var(--accent-cyan)" }}>Projects</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.projects.map(p => (
          <Link
            key={p.hash}
            to={`/sessions?project=${p.hash}`}
            className="rounded-lg border p-4 hover:border-cyan-800 transition-colors"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} style={{ color: "var(--accent-cyan)" }} />
                <h3 className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
              </div>
              <span className="text-lg font-bold mono" style={{ color: "var(--accent-green)" }}>{fmtCost(p.cost)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
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
              <div className="flex items-center gap-1 flex-wrap">
                <GitBranch size={12} style={{ color: "var(--text-muted)" }} />
                {p.branches.slice(0, 3).map(b => (
                  <span key={b} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    {b}
                  </span>
                ))}
                {p.branches.length > 3 && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{p.branches.length - 3}</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {data.projects.length === 0 && (
        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>No projects found.</div>
      )}
    </div>
  );
}
