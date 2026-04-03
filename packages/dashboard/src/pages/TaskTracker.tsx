import { useState, type ReactNode } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import MarkdownBlock from "../components/MarkdownBlock";
import { Link } from "react-router-dom";
import { CheckSquare, Circle, Loader, CheckCircle, FileText, FolderKanban, ArrowRight } from "lucide-react";

interface TodoItem { content: string; status: "pending" | "in_progress" | "completed"; activeForm?: string; priority?: string; sessionId: string; fileName: string; projectHash: string | null; projectName: string; projectRoot: string | null; }
interface PlanFile { name: string; content: string; createdAt: string; modifiedAt: string; }
interface TodoResponse {
  todos: TodoItem[];
  stats: { total: number; completed: number; pending: number; inProgress: number; completionRate: number };
  availableProjects: { id: string; name: string }[];
  availablePriorities: string[];
}

const STATUS_ICON: Record<string, ReactNode> = { pending: <Circle size={11} style={{ color: "var(--text-muted)" }} />, in_progress: <Loader size={11} style={{ color: "var(--accent-amber)" }} />, completed: <CheckCircle size={11} style={{ color: "var(--accent-green)" }} /> };
const STATUS_LABEL: Record<TodoItem["status"], string> = { pending: "pending", in_progress: "in progress", completed: "completed" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--accent-red)",
  medium: "var(--accent-amber)",
  low: "var(--accent-green)",
};

export default function TaskTracker() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (projectFilter !== "all") params.set("project", projectFilter);
  if (priorityFilter !== "all") params.set("priority", priorityFilter);

  const { data: todoData, isLoading: tl } = useApi<TodoResponse>(`/todos?${params}`);
  const { data: planData, isLoading: pl } = useApi<{ plans: PlanFile[] }>("/plans");
  const todos = todoData?.todos || [];
  const stats = todoData?.stats || { total: 0, completed: 0, pending: 0, inProgress: 0, completionRate: 0 };
  const plans = planData?.plans || [];
  const projects = todoData?.availableProjects || [];
  const priorities = todoData?.availablePriorities || [];
  const groups = new Map<string, TodoItem[]>();

  for (const todo of todos) {
    const key = todo.projectName || "Unknown Project";
    const bucket = groups.get(key) || [];
    bucket.push(todo);
    groups.set(key, bucket);
  }

  const groupedTodos = Array.from(groups.entries())
    .map(([project, items]) => ({
      project,
      items: [...items].sort((a, b) => {
        const priorityRank = { high: 0, medium: 1, low: 2 };
        const aRank = priorityRank[a.priority as keyof typeof priorityRank] ?? 3;
        const bRank = priorityRank[b.priority as keyof typeof priorityRank] ?? 3;
        if (aRank !== bRank) return aRank - bRank;
        return a.content.localeCompare(b.content);
      }),
    }))
    .sort((a, b) => a.project.localeCompare(b.project));

  if ((tl && !todoData) || (pl && !planData)) return <PageSkeleton />;

  return (
    <div className="page-enter space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Completed" value={stats.completed.toString()} color="var(--accent-green)" />
        <StatCard label="Pending" value={stats.pending.toString()} color="var(--accent-amber)" />
        <StatCard label="Completion" value={`${stats.completionRate.toFixed(0)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {["all", "pending", "in_progress", "completed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className="btn text-[11px] py-1"
                style={statusFilter === s ? { borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" } : undefined}>
                {s === "in_progress" ? "in progress" : s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={projectFilter} onChange={event => setProjectFilter(event.target.value)} className="input px-3 py-2 text-[12px]">
              <option value="all">All projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)} className="input px-3 py-2 text-[12px]">
              <option value="all">All priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
          {todos.length === 0 ? <EmptyState title="No tasks" message="Claude's todos will appear here." icon={<CheckSquare size={24} />} /> : (
            <div className="space-y-3">
              {groupedTodos.map(group => (
                <div key={group.project} className="card overflow-hidden">
                  <div className="p-3 flex items-center justify-between gap-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderKanban size={13} style={{ color: "var(--accent-cyan)" }} />
                        <span className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {group.project}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                        {group.items.length} task{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {group.items.map((t, i) => (
                      <div key={`${t.fileName}-${i}`} className="p-3 flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{STATUS_ICON[t.status]}</div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] leading-6"
                            style={{
                              color: t.status === "completed" ? "var(--text-muted)" : "var(--text-primary)",
                              textDecoration: t.status === "completed" ? "line-through" : "none",
                            }}
                          >
                            {t.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            <span className="badge">{STATUS_LABEL[t.status]}</span>
                            {t.priority && (
                              <span className="badge" style={{ color: PRIORITY_COLOR[t.priority] || "var(--accent-amber)" }}>
                                priority: {t.priority}
                              </span>
                            )}
                            {t.activeForm && <span className="badge">{t.activeForm}</span>}
                            <span className="mono">{t.fileName}</span>
                          </div>
                        </div>
                        <Link to={`/sessions/${t.sessionId}`} className="btn text-[11px] py-1.5 px-2.5 shrink-0">
                          session <ArrowRight size={11} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="section-label">plans</p>
          {plans.length === 0 ? <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>No plans found.</p> : (
            <div className="space-y-2">
              {plans.map(p => (
                <div key={p.name} className="card p-3">
                  <div className="flex items-center gap-1.5 mb-1"><FileText size={12} style={{ color: "var(--accent-cyan)" }} /><span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{p.name}</span></div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>modified: {fmtDate(p.modifiedAt)}</p>
                  <div className="mt-2 max-h-56 overflow-y-auto">
                    <MarkdownBlock content={p.content.slice(0, 800)} />
                    {p.content.length > 800 && (
                      <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                        …
                      </p>
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
