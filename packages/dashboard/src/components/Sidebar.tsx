import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Moon, Sun, Wifi, WifiOff } from "lucide-react";

const NAV = [
  {
    label: "Command Center",
    items: [
      { to: "/", label: "overview" },
      { to: "/sessions", label: "sessions" },
      { to: "/analytics", label: "analytics" },
      { to: "/tools", label: "tools" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/projects", label: "projects" },
      { to: "/git", label: "git" },
      { to: "/changes", label: "changes" },
      { to: "/activity", label: "activity" },
      { to: "/history", label: "history" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/tasks", label: "tasks" },
      { to: "/memory", label: "memory" },
      { to: "/diagnostics", label: "diagnostics" },
      { to: "/config", label: "config" },
      { to: "/extensions", label: "extensions" },
      { to: "/export", label: "export" },
    ],
  },
];

export default function Sidebar({ connected }: { connected: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("sygil-theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("sygil-theme", theme);
  }, [theme]);

  return (
    <aside className="sidebar">
      <div className="px-4 pt-6 pb-6">
        <span className="text-[17px] font-bold tracking-wide" style={{ color: "var(--accent)" }}>
          Sygil Console
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {NAV.map(section => (
            <div key={section.label}>
              <p className="text-[11px] uppercase font-bold mb-2 px-4" style={{ color: "var(--text-muted)", letterSpacing: "1.5px" }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 text-[14px] transition-all rounded-r-md mr-4 ${
                        isActive ? "font-medium" : "hover:bg-white/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? "var(--accent)" : "var(--text-muted)",
                      background: isActive ? "var(--bg-sidebar-active)" : undefined,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <span className="opacity-70 text-[14px] w-3 flex justify-center">{isActive ? "›" : "›"}</span>
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="px-4 py-4 mt-auto border-t border-white/5 flex flex-col gap-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-2 px-2 py-1.5">
          {connected ? (
            <Wifi size={14} style={{ color: "var(--accent-green)" }} />
          ) : (
            <WifiOff size={14} style={{ color: "var(--accent-red)" }} />
          )}
          <span style={{ color: connected ? "var(--accent-green)" : "var(--accent-red)" }}>
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
        <button
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          Toggle theme
        </button>
        <div className="px-2 pt-1 text-[11px] opacity-50">
          Made by NexLab
        </div>
      </div>
    </aside>
  );
}
