import { type ReactNode, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSSE } from "../hooks/useSSE";

const PAGE_META = [
  { match: (path: string) => path === "/", title: "Overview", subtitle: "Track cost, volume, and activity across your Claude workflow." },
  { match: (path: string) => path.startsWith("/sessions/"), title: "Session Detail", subtitle: "Review the full conversation, telemetry, and tool trail for a single run." },
  { match: (path: string) => path.startsWith("/sessions"), title: "Sessions", subtitle: "Search and compare sessions with cost, model, and branch context." },
  { match: (path: string) => path.startsWith("/analytics"), title: "Analytics", subtitle: "Understand token burn, cache behavior, and model mix over time." },
  { match: (path: string) => path.startsWith("/tools"), title: "Tool Analytics", subtitle: "See how Claude uses tools, shell commands, and MCP integrations." },
  { match: (path: string) => path.startsWith("/projects"), title: "Projects", subtitle: "Compare project cost, activity, and branch spread at a glance." },
  { match: (path: string) => path.startsWith("/git"), title: "Git Correlation", subtitle: "Tie Claude usage to branches and feature work." },
  { match: (path: string) => path.startsWith("/changes"), title: "Changes", subtitle: "Inspect the file timeline and diffs across all sessions." },
  { match: (path: string) => path.startsWith("/activity"), title: "Activity", subtitle: "Watch your usage patterns, streaks, and cadence over time." },
  { match: (path: string) => path.startsWith("/tasks"), title: "Tasks", subtitle: "Follow Claude plans and todos across active projects." },
  { match: (path: string) => path.startsWith("/memory"), title: "Memory", subtitle: "Browse and audit auto-memory content across your workspace." },
  { match: (path: string) => path.startsWith("/history"), title: "History", subtitle: "Search every prompt and jump back into the originating session." },
  { match: (path: string) => path.startsWith("/diagnostics"), title: "Diagnostics", subtitle: "Surface slow operations, errors, and debug health signals." },
  { match: (path: string) => path.startsWith("/config"), title: "Configuration", subtitle: "Review settings, permissions, CLAUDE files, and integrations." },
  { match: (path: string) => path.startsWith("/extensions"), title: "Extensions", subtitle: "Inventory commands, skills, plugins, and MCP servers." },
  { match: (path: string) => path.startsWith("/export"), title: "Export & Import", subtitle: "Move analytics snapshots across machines and environments." },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { connected } = useSSE();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = useMemo(
    () => PAGE_META.find(item => item.match(location.pathname)) || PAGE_META[0],
    [location.pathname]
  );

  return (
    <div className="app-shell">
      <Sidebar connected={connected} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={`app-backdrop ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />

      <div className="app-main">
        <header className="topbar">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="btn p-2.5 lg:hidden shrink-0"
              aria-label="Open navigation"
            >
              <Menu size={16} />
            </button>
            <div className="min-w-0">
              <p className="topbar-title">{meta.title}</p>
              <p className="topbar-subtitle">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="topbar-pill">
              <span
                className="topbar-dot"
                style={{ background: connected ? "var(--accent-green)" : "var(--accent-red)" }}
              />
              {connected ? "Live updates active" : "Reconnecting"}
            </div>
            <div className="topbar-pill hidden md:inline-flex">
              {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date())}
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
