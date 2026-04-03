import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageSquare, BarChart3, FolderOpen, Flame, Clock, Wrench, GitBranch, FileEdit, Download, CheckSquare, Brain, Activity, Settings, Puzzle } from "lucide-react";

const NAV = [
  {
    label: "Command Center",
    items: [
      { to: "/", icon: LayoutDashboard, label: "overview" },
      { to: "/sessions", icon: MessageSquare, label: "sessions" },
      { to: "/analytics", icon: BarChart3, label: "analytics" },
      { to: "/tools", icon: Wrench, label: "tools" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/projects", icon: FolderOpen, label: "projects" },
      { to: "/git", icon: GitBranch, label: "git" },
      { to: "/changes", icon: FileEdit, label: "changes" },
      { to: "/activity", icon: Flame, label: "activity" },
      { to: "/history", icon: Clock, label: "history" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/tasks", icon: CheckSquare, label: "tasks" },
      { to: "/memory", icon: Brain, label: "memory" },
      { to: "/diagnostics", icon: Activity, label: "diagnostics" },
      { to: "/config", icon: Settings, label: "config" },
      { to: "/extensions", icon: Puzzle, label: "extensions" },
      { to: "/export", icon: Download, label: "export" },
    ],
  },
];

export default function Sidebar({ connected }: { connected: boolean }) {
  return (
    <aside className="sidebar">
      <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
          SYGIL
        </span>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.label} className="mb-4">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2 px-3" style={{ color: "var(--text-muted)" }}>
              {section.label}
            </p>
            <div className="space-y-px">
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-[13px] rounded transition-colors ${
                      isActive
                        ? "border-l-2 pl-2.5"
                        : "hover:bg-(--bg-hover)"
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    background: isActive ? "var(--bg-hover)" : undefined,
                    borderColor: isActive ? "var(--accent)" : undefined,
                  })}
                >
                  <Icon size={14} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <div className="flex items-center justify-between">
          <span>v0.3.0</span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: connected ? "var(--accent-green)" : "var(--accent-red)" }}
            />
            {connected ? "live" : "offline"}
          </div>
        </div>
      </div>
    </aside>
  );
}
