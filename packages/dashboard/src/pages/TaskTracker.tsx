import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { PageSkeleton } from "../components/Skeleton";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { fmtDate } from "../lib/format";
import { Link } from "react-router-dom";
import { CheckSquare, Circle, Loader, CheckCircle, FileText } from "lucide-react";

interface TodoItem { content: string; status: "pending" | "in_progress" | "completed"; activeForm?: string; priority?: string; sessionId: string; fileName: string; projectHash: string | null; projectName: string; projectRoot: string | null; }
interface PlanFile { name: string; content: string; createdAt: string; modifiedAt: string; }

const STATUS_ICON: Record<string, React.ReactNode> = { pending: <Circle size={11} style={{ color: "var(--text-muted)" }} />, in_progress: <Loader size={11} style={{ color: "var(--accent-amber)" }} />, completed: <CheckCircle size={11} style={{ color: "var(--accent-green)" }} /> };

export default function TaskTracker() {
  const [filter, setFilter] = useState("all");
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);

  const { data: todoData, isLoading: tl } = useApi<{ todos: TodoItem[]; stats: { total: number; completed: number; pending: number; inProgress: number; completionRate: number } }>(`/todos?${params}`);
  const { data: planData, isLoading: pl } = useApi<{ plans: PlanFile[] }>("/plans");
  if ((tl && !todoData) || (pl && !planData)) return <PageSkeleton />;

  const todos = todoData?.todos || [];
  const stats = todoData?.stats || { total: 0, completed: 0, pending: 0, inProgress: 0, completionRate: 0 };
  const plans = planData?.plans || [];

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
          <div className="flex gap-1.5 mb-3">
            {["all", "pending", "in_progress", "completed"].map(s => (
              <button key={s} onClick={() => setFilter(s)} className="btn text-[11px] py-1"
                style={filter === s ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
                {s === "in_progress" ? "in progress" : s}
              </button>
            ))}
          </div>
          {todos.length === 0 ? <EmptyState title="No tasks" message="Claude's todos will appear here." icon={<CheckSquare size={24} />} /> : (
            <div className="space-y-1">
              {todos.map((t, i) => (
                <div key={`${t.fileName}-${i}`} className="card p-3 flex items-start gap-2">
                  <div className="mt-0.5">{STATUS_ICON[t.status]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px]" style={{ color: t.status === "completed" ? "var(--text-muted)" : "var(--text)", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.content}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span>{t.projectName}</span>
                      {t.priority && <span className="badge">{t.priority}</span>}
                    </div>
                  </div>
                  <Link to={`/sessions/${t.sessionId}`} className="text-[10px] shrink-0" style={{ color: "var(--accent)" }}>session →</Link>
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
                  <div className="flex items-center gap-1.5 mb-1"><FileText size={12} style={{ color: "var(--accent)" }} /><span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{p.name}</span></div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>modified: {fmtDate(p.modifiedAt)}</p>
                  <pre className="text-[11px] mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto" style={{ color: "var(--text-secondary)" }}>{p.content.slice(0, 800)}{p.content.length > 800 ? "\n..." : ""}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
