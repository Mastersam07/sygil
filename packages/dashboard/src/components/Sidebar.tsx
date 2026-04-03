import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageSquare, BarChart3, FolderOpen, Flame, Clock, Wrench, GitBranch, FileEdit, Download } from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/sessions", icon: MessageSquare, label: "Sessions" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/tools", icon: Wrench, label: "Tools" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/git", icon: GitBranch, label: "Git" },
  { to: "/changes", icon: FileEdit, label: "Changes" },
  { to: "/activity", icon: Flame, label: "Activity" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/export", icon: Download, label: "Export" },
];

export default function Sidebar({ connected }: { connected: boolean }) {
  return (
    <aside
      className="w-52 flex flex-col shrink-0 border-r"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mono"
            style={{ background: "rgba(0, 200, 255, 0.1)", color: "var(--accent-cyan)" }}
          >
            S
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
              SYGIL
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              v0.2.0
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 mb-2">
        <div className="h-px" style={{ background: "var(--border)" }} />
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-all duration-150 ${
                isActive ? "font-medium" : ""
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
              background: isActive ? "rgba(0, 200, 255, 0.06)" : undefined,
            })}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: connected ? "var(--accent-green)" : "var(--accent-red)",
              animation: connected ? "pulse 2s infinite" : "none",
            }}
          />
          {connected ? "Live" : "Connecting..."}
        </div>
      </div>
    </aside>
  );
}
