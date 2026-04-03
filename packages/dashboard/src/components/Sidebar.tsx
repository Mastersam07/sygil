import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageSquare, BarChart3, FolderOpen, Flame, Clock } from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/sessions", icon: MessageSquare, label: "Sessions" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/projects", icon: FolderOpen, label: "Projects" },
  { to: "/activity", icon: Flame, label: "Activity" },
  { to: "/history", icon: Clock, label: "History" },
];

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col border-r shrink-0"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-lg font-bold mono" style={{ color: "var(--accent-cyan)" }}>
          ⬡ SYGIL
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Your System for Claude Code
        </p>
      </div>

      <nav className="flex-1 py-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? "border-r-2" : "hover:bg-white/5"}`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
              borderColor: isActive ? "var(--accent-cyan)" : "transparent",
              background: isActive ? "rgba(0, 212, 255, 0.05)" : undefined,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
      </div>
    </aside>
  );
}
