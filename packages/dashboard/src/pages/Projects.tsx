import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import { fmtTokens, fmtCost, timeAgo } from "../lib/format";
import { Link } from "react-router-dom";
import { FolderOpen, GitBranch, ArrowRight, Sparkles, Activity, Coins, Layers3 } from "lucide-react";

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

  const sortedProjects = [...data.projects].sort((a, b) => b.cost - a.cost);
  const totalCost = sortedProjects.reduce((sum, project) => sum + project.cost, 0);
  const totalSessions = sortedProjects.reduce((sum, project) => sum + project.sessionCount, 0);
  const totalTokens = sortedProjects.reduce((sum, project) => sum + project.tokens.input + project.tokens.output, 0);
  const featuredProject = sortedProjects[0];

  if (data.projects.length === 0) {
    return (
      <div className="page-enter space-y-5">
        <section className="card p-6 lg:p-8">
          <p className="eyebrow">Project Portfolio</p>
          <h2 className="page-hero-title mt-3">Project-level activity will appear once Claude sessions accumulate across workspaces.</h2>
          <p className="page-hero-copy">
            This view highlights where your usage is concentrated, which repositories are most active, and how cost is distributed across projects.
          </p>
        </section>
        <EmptyState title="No projects found" message="Start using Claude Code in a project directory." icon={<FolderOpen size={28} />} />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Project Portfolio</p>
            <h2 className="page-hero-title mt-3">Workspace activity, cost concentration, and project momentum in one portfolio view.</h2>
            <p className="page-hero-copy">
              Compare repositories by usage intensity, session count, and branch spread so it is immediately clear where Claude is doing the most work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <StatCard
                label="Tracked Projects"
                value={sortedProjects.length.toString()}
                sub={`${totalSessions.toLocaleString()} sessions captured`}
                icon={<Layers3 size={16} />}
              />
              <StatCard
                label="Portfolio Cost"
                value={fmtCost(totalCost)}
                sub={`${fmtTokens(totalTokens)} total interactive tokens`}
                color="var(--accent-green)"
                icon={<Coins size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3">
            {featuredProject && (
              <div className="surface-muted p-5">
                <p className="eyebrow">Most Invested Project</p>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[28px] font-bold tracking-[-0.05em] truncate" style={{ color: "var(--text-primary)" }}>
                      {featuredProject.name}
                    </p>
                    <p className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>
                      {fmtCost(featuredProject.cost)} across {featuredProject.sessionCount} sessions
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(88, 214, 255, 0.12)", color: "var(--accent-cyan)" }}
                  >
                    <Sparkles size={18} />
                  </div>
                </div>
                <div className="mt-5 badge">
                  <Activity size={11} />
                  Active {timeAgo(featuredProject.lastActiveAt)}
                </div>
              </div>
            )}

            <div className="surface-muted p-5">
              <p className="eyebrow">Branch Coverage</p>
              <p className="text-[30px] mt-3 font-bold tracking-[-0.05em] mono" style={{ color: "var(--accent-blue)" }}>
                {sortedProjects.reduce((sum, project) => sum + project.branches.length, 0)}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Distinct branch references discovered across the full project portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Average Cost"
          value={fmtCost(sortedProjects.length > 0 ? totalCost / sortedProjects.length : 0)}
          sub="Mean cost per project"
          color="var(--accent-amber)"
          icon={<Coins size={14} />}
        />
        <StatCard
          label="Average Sessions"
          value={(sortedProjects.length > 0 ? totalSessions / sortedProjects.length : 0).toFixed(1)}
          sub="Sessions per project"
          icon={<Activity size={14} />}
        />
        <StatCard
          label="Average Tokens"
          value={fmtTokens(sortedProjects.length > 0 ? totalTokens / sortedProjects.length : 0)}
          sub="Interactive tokens per project"
          icon={<FolderOpen size={14} />}
        />
        <StatCard
          label="Projects with Git Branches"
          value={sortedProjects.filter(project => project.branches.length > 0).length.toString()}
          sub="Repositories with branch metadata"
          color="var(--accent-blue)"
          icon={<GitBranch size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedProjects.map(p => {
          const projectTokens = p.tokens.input + p.tokens.output;
          const costShare = totalCost > 0 ? (p.cost / totalCost) * 100 : 0;
          const tokenShare = totalTokens > 0 ? (projectTokens / totalTokens) * 100 : 0;

          return (
            <Link
              key={p.hash}
              to={`/sessions?project=${p.hash}`}
              className="card card-glow p-5 block"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={14} style={{ color: "var(--accent-cyan)" }} className="shrink-0" />
                    <h3 className="text-[16px] font-semibold truncate tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>{p.name}</h3>
                  </div>
                  <p className="text-[12px] mt-2 truncate" style={{ color: "var(--text-muted)" }}>{p.path}</p>
                </div>
                <span className="text-[17px] font-bold mono shrink-0 ml-2" style={{ color: "var(--accent-green)" }}>{fmtCost(p.cost)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
                <div className="surface-muted p-3">
                  <p style={{ color: "var(--text-muted)" }}>Sessions</p>
                  <p className="mono font-semibold text-[18px] mt-2" style={{ color: "var(--text-primary)" }}>{p.sessionCount}</p>
                </div>
                <div className="surface-muted p-3">
                  <p style={{ color: "var(--text-muted)" }}>Tokens</p>
                  <p className="mono font-semibold text-[18px] mt-2" style={{ color: "var(--accent-cyan)" }}>{fmtTokens(projectTokens)}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
                    <span style={{ color: "var(--text-muted)" }}>Portfolio cost share</span>
                    <span className="mono" style={{ color: "var(--text-primary)" }}>{costShare.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(costShare, 4)}%`, background: "linear-gradient(90deg, var(--accent-green), rgba(110, 231, 183, 0.35))" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
                    <span style={{ color: "var(--text-muted)" }}>Token share</span>
                    <span className="mono" style={{ color: "var(--text-primary)" }}>{tokenShare.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(tokenShare, 4)}%`, background: "linear-gradient(90deg, var(--accent-cyan), rgba(88, 214, 255, 0.35))" }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-[12px] mb-4">
                <div>
                  <p style={{ color: "var(--text-muted)" }}>Cost / session</p>
                  <p className="mono font-medium mt-1" style={{ color: "var(--text-primary)" }}>{fmtCost(p.sessionCount > 0 ? p.cost / p.sessionCount : 0)}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: "var(--text-muted)" }}>Last active</p>
                  <p className="mt-1" style={{ color: "var(--text-primary)" }}>{timeAgo(p.lastActiveAt)}</p>
                </div>
              </div>

              {p.branches.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <GitBranch size={11} style={{ color: "var(--text-muted)" }} />
                  {p.branches.slice(0, 4).map(b => (
                    <span key={b} className="badge">{b}</span>
                  ))}
                  {p.branches.length > 4 && (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>+{p.branches.length - 4}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>{p.hash.slice(0, 8)}</span>
                <span className="badge" style={{ color: "var(--accent-cyan)" }}>
                  Open sessions <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
