import { useState, type ReactNode } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Link } from "react-router-dom";
import { CheckSquare, Circle, Loader, CheckCircle, FileText, Sparkles, FolderOpen, ArrowRight } from "lucide-react";
import MarkdownBlock from "../components/MarkdownBlock";

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm?: string;
  priority?: string;
  sessionId: string;
  fileName: string;
  projectHash: string | null;
  projectName: string;
  projectRoot: string | null;
}

interface PlanFile {
  name: string;
  content: string;
  createdAt: string;
  modifiedAt: string;
}

const STATUS_ICON: Record<string, ReactNode> = {
  pending: <Circle size={12} style={{ color: "var(--text-muted)" }} />,
  in_progress: <Loader size={12} style={{ color: "var(--accent-amber)" }} />,
  completed: <CheckCircle size={12} style={{ color: "var(--accent-green)" }} />,
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--text-muted)",
  in_progress: "var(--accent-amber)",
  completed: "var(--accent-green)",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--accent-red)",
  medium: "var(--accent-amber)",
  low: "var(--accent-cyan)",
};

export default function TaskTracker() {
  const [filter, setFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const todoParams = new URLSearchParams();
  if (filter !== "all") todoParams.set("status", filter);
  if (projectFilter !== "all") todoParams.set("project", projectFilter);

  const { data: todoData, isLoading: todosLoading } = useApi<{ todos: TodoItem[]; stats: { total: number; completed: number; pending: number; inProgress: number; completionRate: number } }>(`/todos?${todoParams}`);
  const { data: planData, isLoading: plansLoading } = useApi<{ plans: PlanFile[] }>("/plans");

  if ((todosLoading && !todoData) || (plansLoading && !planData)) return <PageSkeleton />;

  const todos = todoData?.todos || [];
  const stats = todoData?.stats || { total: 0, completed: 0, pending: 0, inProgress: 0, completionRate: 0 };
  const plans = planData?.plans || [];
  const groupedTodos = new Map<string, TodoItem[]>();
  const projectOptions = Array.from(new Set(todos.map(todo => `${todo.projectHash || ""}::${todo.projectName}`)));
  const largestProject = [...todos].reduce((best, current) => {
    if (!best) return current;
    const bestCount = todos.filter(todo => todo.projectName === best.projectName).length;
    const currentCount = todos.filter(todo => todo.projectName === current.projectName).length;
    return currentCount > bestCount ? current : best;
  }, todos[0]);

  for (const todo of todos) {
    const key = `${todo.projectHash || "unknown"}::${todo.projectName}`;
    const current = groupedTodos.get(key) || [];
    current.push(todo);
    groupedTodos.set(key, current);
  }

  const groupedEntries = Array.from(groupedTodos.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page-enter space-y-6">
      <section className="card p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr] items-start">
          <div>
            <p className="eyebrow">Task Console</p>
            <h2 className="page-hero-title mt-3">Claude’s todo stream and planning files, organized into a reviewable execution view.</h2>
            <p className="page-hero-copy">
              Track work in progress by project, filter task status quickly, and keep plan documents visible alongside the active task stream.
            </p>
          </div>

          <div className="space-y-3">
            <div className="surface-muted p-5">
              <p className="eyebrow">Completion</p>
              <p className="text-[30px] mt-3 font-bold mono tracking-[-0.05em]" style={{ color: "var(--accent-green)" }}>
                {stats.completionRate.toFixed(0)}%
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {stats.completed} completed out of {stats.total} total tracked tasks.
              </p>
            </div>

            <div className="surface-muted p-5">
              <p className="eyebrow">Most Active Project</p>
              <p className="text-[24px] mt-3 font-bold tracking-[-0.05em] truncate" style={{ color: "var(--text-primary)" }}>
                {largestProject?.projectName || "—"}
              </p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {largestProject ? `${todos.filter(todo => todo.projectName === largestProject.projectName).length} visible tasks in the current filter.` : "No project grouping available yet."}
              </p>
              {largestProject && (
                <div className="mt-4 badge">
                  <Sparkles size={11} />
                  Highest visible task volume
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Tasks" value={stats.total.toString()} icon={<CheckSquare size={14} />} />
        <StatCard label="Completed" value={stats.completed.toString()} color="var(--accent-green)" icon={<CheckCircle size={14} />} />
        <StatCard label="Pending" value={stats.pending.toString()} color="var(--accent-amber)" icon={<Circle size={14} />} />
        <StatCard label="Completion Rate" value={`${stats.completionRate.toFixed(0)}%`} color="var(--accent-cyan)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_420px] gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {["all", "pending", "in_progress", "completed"].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className="btn text-[11px] py-2"
                style={filter === s ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)", background: "rgba(88, 214, 255, 0.08)" } : undefined}
              >
                {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="input px-3 py-3 text-[13px] min-w-56"
            >
              <option value="all">All projects</option>
              {projectOptions.map(option => {
                const [hash, name] = option.split("::");
                return <option key={option} value={hash || name}>{name}</option>;
              })}
            </select>
          </div>

          {todos.length === 0 ? (
            <EmptyState title="No tasks" message="Claude's todo items will appear here." icon={<CheckSquare size={28} />} />
          ) : (
            <div className="space-y-3">
              {groupedEntries.map(([groupKey, items]) => {
                const [, projectName] = groupKey.split("::");
                return (
                  <div key={groupKey} className="card p-5">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FolderOpen size={13} style={{ color: "var(--accent-cyan)" }} />
                          <p className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{projectName}</p>
                        </div>
                        <p className="text-[12px] mt-2" style={{ color: "var(--text-secondary)" }}>
                          {items.filter(item => item.status === "in_progress").length} in progress · {items.filter(item => item.status === "completed").length} completed
                        </p>
                      </div>
                      <span className="text-[11px] mono shrink-0" style={{ color: "var(--text-muted)" }}>{items.length} tasks</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((t, i) => (
                        <div key={`${t.fileName}-${i}`} className="surface-muted px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{STATUS_ICON[t.status]}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <p className="text-[13px] leading-6" style={{ color: STATUS_COLOR[t.status], textDecoration: t.status === "completed" ? "line-through" : "none" }}>
                                  {t.content}
                                </p>
                                {t.priority && (
                                  <span className="badge" style={{ color: PRIORITY_COLOR[t.priority] || "var(--text-muted)" }}>
                                    {t.priority}
                                  </span>
                                )}
                              </div>
                              {t.activeForm && (
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{t.activeForm}</p>
                              )}
                            </div>
                            <Link to={`/sessions/${t.sessionId}`} className="badge shrink-0" style={{ color: "var(--accent-cyan)" }}>
                              Session <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3">
            <p className="section-label mb-0">Plans</p>
            <p className="text-[14px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Plan documents captured alongside Claude’s todo output.
            </p>
          </div>
          {plans.length === 0 ? (
            <div className="card p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>No plans found.</div>
          ) : (
            <div className="space-y-2">
              {plans.map(p => (
                <div key={p.name} className="card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={13} style={{ color: "var(--accent-cyan)" }} />
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Modified: {fmtDate(p.modifiedAt)}
                  </p>
                  <div className="mt-3 max-h-48 overflow-y-auto surface-muted p-4">
                    <MarkdownBlock content={p.content.slice(0, 1000)} />
                    {p.content.length > 1000 && (
                      <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
