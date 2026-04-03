import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageSquare, BarChart3, FolderOpen, Flame, Clock, Wrench, GitBranch, FileEdit, Download, CheckSquare, Brain, Activity, Settings, Puzzle, X, Radio, Command } from "lucide-react";

const NAV = [
  {
    label: "Command Center",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Overview" },
      { to: "/sessions", icon: MessageSquare, label: "Sessions" },
      { to: "/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/tools", icon: Wrench, label: "Tool Analytics" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/projects", icon: FolderOpen, label: "Projects" },
      { to: "/git", icon: GitBranch, label: "Git Correlation" },
      { to: "/changes", icon: FileEdit, label: "Change Timeline" },
      { to: "/activity", icon: Flame, label: "Activity" },
      { to: "/history", icon: Clock, label: "History" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/tasks", icon: CheckSquare, label: "Tasks" },
      { to: "/memory", icon: Brain, label: "Memory" },
      { to: "/diagnostics", icon: Activity, label: "Diagnostics" },
      { to: "/config", icon: Settings, label: "Configuration" },
      { to: "/extensions", icon: Puzzle, label: "Extensions" },
      { to: "/export", icon: Download, label: "Export" },
    ],
  },
];

export default function Sidebar({ connected, open, onClose }: { connected: boolean; open: boolean; onClose: () => void }) {
  return (
    <aside className={`app-sidebar ${open ? "open" : ""}`}>
      <div className="px-5 pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold mono shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(88, 214, 255, 0.18), rgba(122, 166, 255, 0.22))", color: "var(--accent-cyan)" }}
            >
              <Command size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-[-0.03em]" style={{ color: "var(--text-primary)" }}>
                Sygil
              </h1>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Claude analytics, history, and diagnostics in one console.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn p-2 lg:hidden" aria-label="Close navigation">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="surface-muted rounded-[18px] p-4">
          <p className="eyebrow">System Status</p>
          <div className="flex items-center gap-2 mt-2">
            <Radio size={14} style={{ color: connected ? "var(--accent-green)" : "var(--accent-red)" }} />
            <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {connected ? "Live stream connected" : "Waiting for event stream"}
            </p>
          </div>
          <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>
            Dashboard refreshes automatically as new session data arrives.
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <div className="space-y-6">
          {NAV.map(section => (
            <div key={section.label}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3 px-2" style={{ color: "var(--text-muted)" }}>
                {section.label}
              </p>
              <div className="space-y-1.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-2xl text-[13px] transition-all duration-150 ${isActive ? "font-semibold" : "font-medium"}`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      background: isActive ? "linear-gradient(135deg, rgba(88, 214, 255, 0.16), rgba(122, 166, 255, 0.08))" : "transparent",
                      border: isActive ? "1px solid rgba(88, 214, 255, 0.18)" : "1px solid transparent",
                    })}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255, 255, 255, 0.035)" }}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3">
          <div
            className="px-3 py-2 rounded-full text-[11px] font-semibold"
            style={{ background: "rgba(255, 255, 255, 0.04)", color: "var(--text-secondary)" }}
          >
            v0.3.0
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
              {connected ? "Connected" : "Offline"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Local-first analytics
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
