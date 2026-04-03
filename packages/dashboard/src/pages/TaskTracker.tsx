import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Link } from "react-router-dom";
import { CheckSquare, Circle, Loader, CheckCircle, FileText } from "lucide-react";
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

const STATUS_ICON: Record<string, React.ReactNode> = {
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

  for (const todo of todos) {
    const key = `${todo.projectHash || "unknown"}::${todo.projectName}`;
    const current = groupedTodos.get(key) || [];
    current.push(todo);
    groupedTodos.set(key, current);
  }

  const groupedEntries = Array.from(groupedTodos.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page-enter space-y-5">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Tasks</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Tasks" value={stats.total.toString()} icon={<CheckSquare size={14} />} />
        <StatCard label="Completed" value={stats.completed.toString()} color="var(--accent-green)" icon={<CheckCircle size={14} />} />
        <StatCard label="Pending" value={stats.pending.toString()} color="var(--accent-amber)" icon={<Circle size={14} />} />
        <StatCard label="Completion Rate" value={`${stats.completionRate.toFixed(0)}%`} color="var(--accent-cyan)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            {["all", "pending", "in_progress", "completed"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="btn text-[11px] py-1"
                style={filter === s ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" } : undefined}
              >
                {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="input px-3 py-2 text-[13px] min-w-56"
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
                  <div key={groupKey} className="card p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{projectName}</p>
                      <span className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>{items.length} tasks</span>
                    </div>
                    <div className="space-y-1">
                      {items.map((t, i) => (
                        <div key={`${t.fileName}-${i}`} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-primary)" }}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{STATUS_ICON[t.status]}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-[13px]" style={{ color: STATUS_COLOR[t.status], textDecoration: t.status === "completed" ? "line-through" : "none" }}>
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
                            <Link to={`/sessions/${t.sessionId}`} className="text-[10px] shrink-0" style={{ color: "var(--accent-cyan)" }}>
                              session →
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
          <p className="section-label">Plans</p>
          {plans.length === 0 ? (
            <div className="card p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>No plans found.</div>
          ) : (
            <div className="space-y-2">
              {plans.map(p => (
                <div key={p.name} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={13} style={{ color: "var(--accent-cyan)" }} />
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Modified: {fmtDate(p.modifiedAt)}
                  </p>
                  <div className="mt-2 max-h-48 overflow-y-auto">
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
