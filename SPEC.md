# Sygil — Product Requirements Document

> **"Your System has awakened."**

## 1. Vision

**One-liner:** A CLI tool that reads your local Claude Code data and launches a browser dashboard with full analytics, session history, and usage insights — plus an MCP server so Claude itself can query your usage data.

**Problem:** Claude Code generates rich session data — transcripts, token counts, file edits, tool usage, debug logs, todos, memory files — but there's no unified way to explore it. Existing tools (ccusage, CCHV, claude-code-transcripts, cc-lens) each solve a slice but none combine every data source Claude Code produces into a single tool with both a visual dashboard AND a programmatic MCP interface.

**Solution:** `sygil` — run one command, get a full dashboard in your browser. Zero config. Reads everything from `~/.claude/` (and `~/.config/claude/` for newer versions). Open source, community-driven. Phase 2 adds an MCP server so Claude Code can query its own analytics ("how much did my auth-refactor branch cost?").

**Tagline:** *Your System for Claude Code. Real-time analytics dashboard for sessions, tokens, costs, and everything in ~/.claude/.*

---

## 2. User Persona

- **Primary:** Individual developers using Claude Code on Pro/Max plans who want visibility into their usage, costs, and productivity patterns.
- **Secondary:** Team leads who want to understand how their team uses Claude Code across projects.
- **Tertiary:** Open source contributors and Claude Code power users who want to optimize their workflows.

---

## 3. User Experience Flow

```
$ npx sygil

  ░▒▓█ S̷̢Y̵̡G̸̨I̶̧L̷̡ █▓▒░

  [SYSTEM ACTIVATED]

  Scanning shadows... 147 sessions across 12 projects

  ▸ Tokens consumed:  4,281,039
  ▸ Estimated cost:   $47.82
  ▸ Active projects:  12

  [INTERFACE READY]

  Dashboard → http://localhost:4321
```

Browser opens automatically. User lands on the Overview page. Sidebar navigation lets them explore all 17 feature areas. Data auto-refreshes every 5 seconds while the dashboard is open. Everything reads from local files — no API keys, no network calls, no auth.

---

## 4. Data Sources

All data is read-only from the user's local filesystem. Sygil never writes to `~/.claude/`.

| Source | Location | What it contains |
|--------|----------|-----------------|
| Session transcripts | `~/.claude/projects/<hash>/*.jsonl` | Full conversation: user messages, assistant responses, tool calls, tool results, token usage per message |
| Session index | `~/.claude/projects/<hash>/sessions-index.json` | Session summaries, message counts, git branches, timestamps, auto-generated titles |
| Global history | `~/.claude/history.jsonl` | Every prompt sent across all projects, with timestamps, project paths, session IDs |
| File history | `~/.claude/file-history/` | Before/after snapshots of files Claude edited |
| Todos | `~/.claude/todos/` | Task lists Claude creates per session |
| Plans | `~/.claude/plans/` | Plan mode markdown documents |
| Memory | `~/.claude/memory/` | Per-project memory files (user, feedback, project, reference, index types) |
| Debug logs | `~/.claude/debug/<sessionId>.txt` | Timestamped debug entries with tool timings, LSP events, slow operation warnings |
| Stats cache | `~/.claude/stats-cache.json` | Pre-aggregated usage statistics |
| Settings | `~/.claude/settings.json` | Global user settings |
| Config | `~/.claude.json` | Preferences, OAuth state, MCP server configs, per-project state, CC version info |
| Commands | `~/.claude/commands/` | Custom slash command definitions |
| Skills | `~/.claude/skills/` | Complex skill definitions |
| Plugins | `~/.claude/plugins/` | Installed plugins |
| Shell snapshots | `~/.claude/shell-snapshots/` | Shell environment captures |
| Telemetry | `~/.claude/telemetry/` | Usage telemetry if enabled |

**Compatibility note:** Claude Code v1.0.30+ moved data to `~/.config/claude/`. Sygil scans both locations and merges results automatically.

---

## 5. Features

### 5.1 Overview Dashboard

The landing page. At-a-glance summary of everything.

**Displays:**
- Total tokens consumed (input / output / cache creation / cache read)
- Estimated total cost (USD, calculated from model-specific pricing)
- Total sessions count and active projects count
- Sessions today / this week / this month
- Average tokens per session
- Most active project
- Quick sparkline charts for usage trends (last 30 days)
- Recent conversations list (last 10 sessions with quick-nav)
- Current Claude Code version + version history

**Data sources:** Session transcripts (token usage from each message), sessions-index.json, stats-cache.json for fast initial load, .claude.json for version info.

---

### 5.2 Sessions Browser

Browsable, searchable list of all sessions across all projects.

**Displays:**
- Session list with: title/summary, project name, timestamp, duration, message count, total tokens, estimated cost, git branch
- Session badges: compacted ⚡, agent 🤖, MCP 🔌, web search 🔍, thinking 🧠
- Search by keyword (searches session titles and prompt text from history.jsonl)
- Filter by: project, date range, git branch, model used, badge type
- Sort by: date, token usage, cost, duration, message count

**Click into a session → Session Detail view (5.3)**

**Data sources:** sessions-index.json for the list, history.jsonl for search across prompts.

---

### 5.3 Session Detail / Conversation Replay

Full conversation replay for a single session.

**Displays:**
- Conversation thread: user messages and assistant responses rendered in a chat-like UI
- Tool calls highlighted with expandable details (tool name, input, output)
- Compaction events marked inline (where context was compressed)
- Per-message token count displayed inline (input + output for that turn)
- Per-message cost annotation
- Cumulative token usage as a running total sidebar/chart (token timeline)
- Session metadata header: project, branch, start time, duration, model(s) used
- Copy/export session as markdown

**Data sources:** Individual session JSONL files (each line is a message event).

---

### 5.4 Token Analytics

Deep dive into token consumption patterns.

**Displays:**
- Usage over time: daily/weekly/monthly bar or area charts (input vs output vs cache)
- Cost over time: daily/weekly/monthly cost chart
- Model breakdown: pie/donut chart showing token split across models (Opus, Sonnet, Haiku)
- Cache efficiency: cache hit ratio over time, cache creation vs cache read tokens
- Peak usage hours: heatmap of which hours/days you use Claude Code most
- Average session cost trend line
- Token budget projections (at current burn rate, estimated monthly cost)

**Data sources:** Token usage fields from session JSONL messages, aggregated.

---

### 5.5 Per-Project Breakdown

Usage analytics scoped to individual projects.

**Displays:**
- Project card grid with: sessions count, total cost, cost per session, most-used tools, languages, git branches
- Per-project detail page: cost chart over time, session list, tool breakdown
- Project comparison: side-by-side bar chart of top N projects by cost
- Click into a project to see its sessions and analytics filtered

**Data sources:** Session files grouped by project directory (the encoded-cwd hash), sessions-index.json.

---

### 5.6 Change Timeline

Visual history of every file Claude has edited.

**Displays:**
- Timeline view: chronological list of file modifications across all sessions
- Each entry shows: file path, session it came from, timestamp, diff preview (before/after)
- Expandable inline diff viewer (side-by-side or unified)
- "Files most touched" ranking — which files Claude edits most
- Filter by: project, file extension, date range
- Aggregate stats: total lines added/removed by Claude

**Data sources:** `file-history/` directory (before/after snapshots). Falls back to parsing Edit/Write tool calls from session JSONL if file-history is unavailable.

---

### 5.7 Tool Analytics

Breakdown of how Claude Code uses its tools.

**Displays:**
- Tool ranking by category: file-io (Read, Edit, Write), shell (Bash), search (Grep, Glob), agent (Agent, SubAgent), web (WebFetch, WebSearch), planning (Plan, TodoRead, TodoWrite), MCP tools
- Tool usage over time: stacked area chart
- Read-to-Edit ratio: are you using Claude as a search engine or an editor?
- Bash command analysis: most common commands Claude runs
- Tool acceptance/rejection rates (from tool result status)
- Average tool calls per session
- MCP server details: which MCP servers are used, tool counts per server
- Feature adoption table: which Claude Code features you use (thinking, web search, agents, etc.)
- Claude Code version history: track which versions you've used over time

**Data sources:** Tool call events from session JSONL files, .claude.json for version info.

---

### 5.8 Task Tracker

Dashboard for Claude's self-assigned todos and plans.

**Displays:**
- Active todos across sessions, grouped by project
- Status filters: pending, in_progress, completed
- Priority badges
- Completion stats: completed vs abandoned vs in-progress, completion rate
- Plan documents rendered as markdown with metadata
- Linkback to the session that created each todo/plan

**Data sources:** `todos/` directory, `plans/` directory.

---

### 5.9 Git Correlation

Connect Claude Code usage to your git workflow.

**Displays:**
- Sessions grouped by git branch
- Cost per branch: how much did this feature cost in tokens?
- Branch activity timeline: when was Claude used on each branch?
- Sessions per branch count
- Branch comparison chart

**Data sources:** Git branch field from sessions-index.json, correlated with session token data.

---

### 5.10 Diagnostics

Performance and health insights from debug data.

**Displays:**
- Slow operations log: operations flagged as slow in debug logs, with durations
- Error frequency: count and categorize errors across sessions
- LSP health: LSP server events and issues
- Session health score: composite metric based on errors, slow ops, and tool failures per session
- Debug log viewer: searchable, filterable raw debug log

**Data sources:** `debug/<sessionId>.txt` files.

---

### 5.11 Config Viewer

Browse and compare your Claude Code configuration.

**Displays:**
- Global CLAUDE.md content rendered as markdown
- Per-project CLAUDE.md files (read from project directories via session paths)
- Global settings.json displayed as formatted, syntax-highlighted JSON
- Per-project settings comparison
- MCP server configurations from .claude.json
- Active permission rules (allow/deny) visualized
- Installed skills and plugins listed

**Data sources:** `~/.claude/CLAUDE.md`, `~/.claude/settings.json`, `~/.claude.json`, project-level config files.

---

### 5.12 Extensions Inventory

Catalog of all customizations installed.

**Displays:**
- Custom slash commands (from `~/.claude/commands/`): name, file, description
- Skills (from `~/.claude/skills/`): name, description
- Plugins (from `~/.claude/plugins/`): installed plugins with metadata
- Per-project commands/skills (from project `.claude/` directories)
- MCP servers configured (from .claude.json and .mcp.json files)

**Data sources:** `commands/`, `skills/`, `plugins/` directories, .claude.json, .mcp.json files.

---

### 5.13 Activity Heatmap

GitHub-style contribution visualization for Claude Code usage.

**Displays:**
- GitHub-style heatmap grid: daily activity intensity over the past year (colored by session count or token usage)
- Current streak and longest streak counters
- Day-of-week activity patterns: bar chart showing which days you use Claude Code most
- 24-hour peak hours bar chart: which hours of the day see the most activity
- Weekly/monthly activity trends

**Data sources:** Session timestamps from sessions-index.json and history.jsonl, aggregated into daily buckets.

---

### 5.14 Memory Browser

Browse Claude Code's auto-memory files across projects.

**Displays:**
- Memory file list across all projects, with project labels
- Filter by memory type: user, feedback, project, reference, index
- Memory content rendered as markdown
- Stale detection: flag memory files that haven't been updated recently or reference deleted sessions
- Memory file count per project
- Search across memory content

**Data sources:** `~/.claude/memory/` and per-project memory directories.

---

### 5.15 History Browser

Searchable, paginated view of your entire Claude Code command history.

**Displays:**
- Chronological list of every prompt sent across all projects
- Each entry shows: prompt text (truncated), timestamp, project path, session ID
- Full-text search across all prompts
- Pagination for large histories (some users have 1000+ entries)
- Click-through to the session that contains each prompt
- Filter by project, date range

**Data sources:** `~/.claude/history.jsonl`.

---

### 5.16 Export / Import

Export analytics data and import across machines.

**Displays:**
- Export button: download a `.json` snapshot of all parsed analytics data
- Export as `.zip`: full JSONL session files + parsed analytics bundle
- Export individual session as markdown
- Import: upload a previously exported `.json` or `.zip`, with additive merge preview (shows what will be added vs what already exists)
- CSV export for token/cost data (for spreadsheet analysis)

**Data sources:** All parsed data aggregated by the server, session JSONL files for raw export.

---

### 5.17 Real-Time Refresh

Live-updating dashboard without manual reload.

**Behavior:**
- Dashboard receives updates via Server-Sent Events (SSE)
- Server watches `~/.claude/` filesystem for new/modified session files
- New sessions appear automatically in the sessions list
- Overview stats update in real time as active sessions accumulate tokens
- Visual indicator showing "live" status and last refresh timestamp
- Can be paused/resumed by the user
- Fallback to 5-second polling if SSE is unavailable

**Implementation:** SSE from the Fastify server, filesystem watching via chokidar.

---

## 6. Tech Stack

### Monorepo Tooling

| Tool | Role |
|------|------|
| **pnpm** | Package manager + workspace linking |
| **Turborepo** | Task orchestration, parallel builds, caching |

### Package: `@sygil/core`

| Tech | Role |
|------|------|
| TypeScript | Language |

Pure TypeScript. Zero runtime dependencies. All parsers, types, pricing tables, and the `~/.claude/` directory detector. This package is the foundation — both the CLI server and MCP server import from it.

### Package: `sygil` (CLI)

| Tech | Role |
|------|------|
| TypeScript | Language |
| Commander.js | CLI arg parsing |
| Fastify | HTTP server for API + static dashboard |
| @fastify/static | Serves pre-built dashboard assets |
| @fastify/cors | CORS for dev mode |
| chokidar | Filesystem watching for real-time updates |
| chalk | Terminal colors for glitchy startup animation |
| open | Auto-open browser |

### Package: `@sygil/dashboard`

| Tech | Role |
|------|------|
| React 19 | UI framework |
| React Router 7 | Client-side page routing |
| SWR | Data fetching with stale-while-revalidate caching |
| Recharts | Charts (time series, bar, donut, heatmap) |
| Tailwind CSS 4 | Styling via @tailwindcss/vite |
| Lucide React | Icons |
| Vite 6 | Build + dev server with HMR |

Not published to npm. Built into static assets at publish time and bundled into the CLI package.

### Package: `@sygil/mcp` (Phase 2)

| Tech | Role |
|------|------|
| @modelcontextprotocol/sdk | MCP server implementation |

Imports `@sygil/core` for all data access. Exposes 10 MCP tools via stdio or SSE transport.

---

## 7. Architecture

```
┌──────────────────────────────────────────────────────┐
│  User's Terminal                                      │
│  $ npx sygil [--port 4321] [--no-open]               │
│  $ npx sygil mcp                          (Phase 2)  │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│  CLI Package (packages/cli)                           │
│  - Parse args (port, claude dir path, flags)          │
│  - Glitchy System startup animation                   │
│  - Detect data dir via @sygil/core                    │
│  - Start Fastify server                               │
│  - Serve dashboard static files                       │
│  - Open browser                                       │
└──────────┬───────────────────────────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐ ┌─────────────────────────────────────────┐
│ MCP      │ │  Fastify Server (inside CLI package)     │
│ Package  │ │                                          │
│ (Ph. 2)  │ │  Static files ──── API routes (/api/..) │
│          │ │  (dashboard)       + SSE endpoint        │
│ 10 tools │ │                                          │
│ stdio/   │ │  15 route files covering all 17 features │
│ sse      │ │                                          │
└────┬─────┘ └──────────────┬──────────────────────────┘
     │                      │
     │                      ▼
     │       ┌─────────────────────────────────────────┐
     │       │  Dashboard Package (packages/dashboard)  │
     │       │  React 19 + Vite → static assets         │
     │       │  17 pages, shared components, SWR hooks  │
     │       │  Built at publish time, served by CLI     │
     │       └─────────────────────────────────────────┘
     │
     └──────────────┐
                    ▼
     ┌─────────────────────────────────────────────────┐
     │  Core Package (packages/core)                    │
     │  Shared by CLI server + MCP server               │
     │                                                  │
     │  detector.ts  ─── find ~/.claude/ automatically  │
     │  types.ts     ─── shared TypeScript types        │
     │  pricing.ts   ─── model cost tables              │
     │                                                  │
     │  parser/                                         │
     │    jsonl.ts sessions.ts tokens.ts tools.ts       │
     │    files.ts todos.ts   memory.ts debug.ts        │
     │    config.ts git.ts    extensions.ts             │
     │    activity.ts history.ts                        │
     │                                                  │
     └──────────────┬──────────────────────────────────┘
                    │
                    ▼
     ┌─────────────────────────────────────────────────┐
     │  Filesystem (read-only)                          │
     │  ~/.claude/  +  ~/.config/claude/                │
     └─────────────────────────────────────────────────┘
```

### Dependency flow

```
@sygil/dashboard  ──→  (standalone, talks to CLI server via HTTP)
sygil (cli)       ──→  @sygil/core
@sygil/mcp        ──→  @sygil/core
```

---

## 8. API Endpoints

### Overview
```
GET /api/overview
Response: {
  totalTokens: { input, output, cacheCreation, cacheRead },
  estimatedCost: number,
  sessionCount: number,
  projectCount: number,
  sessionsToday: number,
  sessionsThisWeek: number,
  sessionsThisMonth: number,
  avgTokensPerSession: number,
  mostActiveProject: string,
  dailyUsage: [{ date, tokens, cost }],
  recentSessions: [{ id, title, project, timestamp, tokens }],
  ccVersion: { current, history: [{ version, firstSeen, lastSeen }] }
}
```

### Sessions
```
GET /api/sessions?project=&branch=&from=&to=&q=&sort=&order=&badges=&page=1&limit=50
Response: {
  sessions: [{ id, title, project, branch, startedAt, duration,
               messageCount, tokens, cost, model, badges[] }],
  total: number
}

GET /api/sessions/:id
Response: {
  metadata: { id, project, branch, startedAt, duration, model, badges },
  messages: [{ role, type, content, tokens, cost, timestamp,
               toolName?, toolInput?, toolResult?, isCompaction? }],
  totalTokens: { input, output },
  totalCost: number,
  tokenTimeline: [{ messageIndex, cumulativeTokens, cumulativeCost }]
}
```

### Analytics
```
GET /api/analytics/tokens?period=day|week|month&from=&to=
GET /api/analytics/tools?project=&from=&to=
GET /api/analytics/git?from=&to=
```

### Activity
```
GET /api/activity?from=&to=
Response: {
  heatmap: [{ date, count, tokens }],
  currentStreak: number,
  longestStreak: number,
  dayOfWeek: [{ day, avgSessions, avgTokens }],
  hourOfDay: [{ hour, avgSessions, avgTokens }],
  weeklyTrend: [{ week, sessions, tokens }]
}
```

### Changes
```
GET /api/changes?project=&ext=&from=&to=&page=1&limit=50
GET /api/changes/:sessionId/:filePath → { before, after, diff }
```

### Todos & Plans
```
GET /api/todos?project=&status=pending|in_progress|completed
GET /api/plans
```

### Memory
```
GET /api/memory?project=&type=user|feedback|project|reference|index&q=
Response: {
  files: [{ path, project, type, content, modifiedAt, isStale }],
  countByProject: [{ project, count }],
  countByType: [{ type, count }]
}
```

### History
```
GET /api/history?q=&project=&from=&to=&page=1&limit=100
Response: {
  entries: [{ prompt, timestamp, projectPath, sessionId }],
  total: number
}
```

### Diagnostics, Config, Extensions
```
GET /api/diagnostics?sessionId=&severity=slow|error|info
GET /api/config
GET /api/extensions
```

### Export / Import
```
GET /api/export?format=json|zip|csv&scope=all|project:<hash>|session:<id>
POST /api/import (multipart/form-data)
```

### Real-Time Events
```
GET /api/events (SSE stream)
Events: session_updated, session_created, stats_changed
```

---

## 9. CLI Interface

```
Usage: sygil [command] [options]

Commands:
  dashboard (default)     Launch browser dashboard
  mcp                     Start MCP server (Phase 2)
  stats                   Print overview stats to terminal as JSON

Dashboard Options:
  -p, --port <number>       Port for dashboard server (default: 4321)
  -d, --dir <path>          Path to Claude data directory (default: auto-detect)
  --no-open                 Don't auto-open browser
  --no-live                 Disable real-time refresh

MCP Options (Phase 2):
  --stdio                   Use stdio transport (default)
  --port <number>           Use SSE transport on given port

Global Options:
  -v, --version             Show version
  -h, --help                Show help

Examples:
  $ sygil                              # Launch dashboard
  $ sygil --port 8080                  # Custom port
  $ sygil --dir ~/backup/.claude       # Custom data directory
  $ sygil stats                        # Quick stats in terminal
  $ sygil mcp                          # Start MCP server (Phase 2)
```

---

## 10. Token Cost Calculation

Model pricing (configurable, defaults as of mid-2025):

| Model | Input (/1M) | Output (/1M) | Cache Write | Cache Read |
|-------|------------|-------------|-------------|------------|
| Claude Opus 4 | $15.00 | $75.00 | $18.75 | $1.50 |
| Claude Sonnet 4 | $3.00 | $15.00 | $3.75 | $0.30 |
| Claude Haiku 3.5 | $0.80 | $4.00 | $1.00 | $0.08 |

Embedded as defaults in `@sygil/core`, overridable via `~/.sygil.json`.

---

## 11. Dashboard Design Direction

**Aesthetic:** The System — dark, glowing, information-dense. Inspired by Solo Leveling's System interface. Not anime cosplay, but channeling the energy: a hidden intelligence layer that sees everything and presents it in clean, luminous panels.

**Key design decisions:**
- Dark background (#0a0a0f) with electric blue/cyan accent palette — System glow
- Monospace font (JetBrains Mono or IBM Plex Mono) for data, clean sans-serif (Geist or DM Sans) for UI
- Subtle glow effects on key metrics and active elements
- Dense information layout — no giant empty cards with single numbers
- Charts use a consistent 4-color palette: cyan (input tokens), green (output tokens), amber (cache), red (cost/errors)
- Sidebar navigation, collapsible on smaller screens
- Date range picker on every page
- Skeleton loading states, not spinners
- Live indicator (pulsing dot) when real-time refresh active
- Desktop-first

---

## 12. Monorepo Structure

```
sygil/
├── package.json                    ← workspace root (private, not published)
├── pnpm-workspace.yaml             ← pnpm workspace config
├── turbo.json                      ← Turborepo task orchestration
├── tsconfig.base.json              ← shared TypeScript config
├── README.md
├── LICENSE
├── .gitignore
│
├── packages/
│   │
│   ├── core/                       ← @sygil/core (published)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                ← public API barrel export
│   │       ├── types.ts                ← shared types for all packages
│   │       ├── pricing.ts              ← model pricing table + overrides
│   │       ├── detector.ts             ← find ~/.claude/ or ~/.config/claude/
│   │       └── parser/
│   │           ├── jsonl.ts            ← JSONL streaming line reader
│   │           ├── sessions.ts         ← session index + transcript parser
│   │           ├── tokens.ts           ← token extraction, cost calculation
│   │           ├── tools.ts            ← tool call extraction + analysis
│   │           ├── files.ts            ← file history diff engine
│   │           ├── todos.ts            ← todo/plan file reader
│   │           ├── memory.ts           ← memory file reader + stale detection
│   │           ├── debug.ts            ← debug log parser
│   │           ├── config.ts           ← settings/CLAUDE.md reader
│   │           ├── git.ts              ← branch correlation engine
│   │           ├── extensions.ts       ← commands/skills/plugins scanner
│   │           ├── activity.ts         ← heatmap/streak aggregation
│   │           └── history.ts          ← history.jsonl reader + search
│   │
│   ├── cli/                        ← sygil (published — the main binary)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                ← CLI entry: arg parsing, routing
│   │       ├── startup.ts              ← glitchy System terminal animation
│   │       ├── server.ts               ← Fastify setup, static file serving
│   │       ├── sse.ts                  ← Server-Sent Events for live updates
│   │       ├── watcher.ts              ← Filesystem watcher (chokidar)
│   │       └── routes/
│   │           ├── overview.ts
│   │           ├── sessions.ts
│   │           ├── analytics.ts
│   │           ├── projects.ts
│   │           ├── activity.ts
│   │           ├── changes.ts
│   │           ├── todos.ts
│   │           ├── memory.ts
│   │           ├── history.ts
│   │           ├── diagnostics.ts
│   │           ├── config.ts
│   │           ├── extensions.ts
│   │           ├── export.ts
│   │           └── events.ts           ← SSE endpoint
│   │
│   ├── dashboard/                  ← @sygil/dashboard (NOT published)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx                 ← Router + layout
│   │       ├── index.css               ← Tailwind imports + global styles
│   │       │
│   │       ├── components/
│   │       │   ├── Layout.tsx          ← App shell: sidebar + content area
│   │       │   ├── Sidebar.tsx         ← Navigation sidebar
│   │       │   ├── StatCard.tsx        ← Reusable stat display card
│   │       │   ├── DateRangePicker.tsx
│   │       │   ├── SearchInput.tsx
│   │       │   ├── DataTable.tsx       ← Sortable, paginated table
│   │       │   ├── DiffViewer.tsx      ← Side-by-side or unified diff
│   │       │   ├── Heatmap.tsx         ← GitHub-style contribution grid
│   │       │   ├── LiveIndicator.tsx   ← Pulsing dot for real-time status
│   │       │   ├── MarkdownRenderer.tsx
│   │       │   ├── JsonViewer.tsx      ← Syntax-highlighted JSON
│   │       │   ├── ChatMessage.tsx     ← Single conversation message
│   │       │   ├── ToolCallBlock.tsx   ← Expandable tool call display
│   │       │   ├── Badge.tsx           ← Session feature badges
│   │       │   ├── EmptyState.tsx
│   │       │   └── Skeleton.tsx        ← Loading skeleton
│   │       │
│   │       ├── pages/
│   │       │   ├── Overview.tsx
│   │       │   ├── Sessions.tsx
│   │       │   ├── SessionDetail.tsx
│   │       │   ├── Analytics.tsx
│   │       │   ├── Projects.tsx
│   │       │   ├── ProjectDetail.tsx
│   │       │   ├── Activity.tsx
│   │       │   ├── ChangeTimeline.tsx
│   │       │   ├── ToolAnalytics.tsx
│   │       │   ├── TaskTracker.tsx
│   │       │   ├── GitCorrelation.tsx
│   │       │   ├── History.tsx
│   │       │   ├── Memory.tsx
│   │       │   ├── Diagnostics.tsx
│   │       │   ├── ConfigViewer.tsx
│   │       │   ├── Extensions.tsx
│   │       │   └── ExportImport.tsx
│   │       │
│   │       ├── hooks/
│   │       │   ├── useApi.ts           ← SWR-based fetch
│   │       │   ├── useSSE.ts           ← SSE hook for live updates
│   │       │   ├── useDateRange.ts     ← Shared date range state
│   │       │   └── useDebounce.ts
│   │       │
│   │       └── lib/
│   │           ├── api.ts              ← Typed API client
│   │           ├── format.ts           ← Number/date/token formatting
│   │           ├── colors.ts           ← Chart color palette
│   │           └── types.ts            ← Frontend-specific types
│   │
│   └── mcp/                        ← @sygil/mcp (Phase 2, published)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                ← MCP server entry point
│           ├── tools.ts                ← MCP tool definitions
│           └── handlers.ts             ← Tool handlers (reuses @sygil/core)
```

### What gets published to npm

| Package | npm name | Published? | Who uses it |
|---------|----------|-----------|-------------|
| `packages/core` | `@sygil/core` | Yes | Anyone building custom tooling on the parser layer |
| `packages/cli` | `sygil` | Yes | Everyone — the main `npx sygil` entry point. Bundles dashboard static assets. |
| `packages/dashboard` | — | No | Built into static files, included in CLI package at publish time |
| `packages/mcp` | `@sygil/mcp` | Yes (Phase 2) | People who only want the MCP server without the dashboard |

### Dev workflow

```bash
git clone https://github.com/[org]/sygil.git
cd sygil
pnpm install
pnpm dev          # runs cli + dashboard in parallel via turbo
pnpm build        # builds all packages in dependency order
pnpm test         # runs tests across all packages
```

---

## 13. MCP Server (Phase 2)

After the dashboard is stable, we ship an MCP server so Claude Code can query its own analytics. This turns Sygil from a passive dashboard into an active assistant.

### MCP Tools

| Tool | Params | Returns |
|------|--------|---------|
| `get_overview` | — | Token totals, cost, session count, project count |
| `get_sessions` | project?, branch?, from?, to?, limit? | Session list with tokens and cost |
| `get_session_detail` | session_id | Full session metadata + message summary |
| `get_project_stats` | project? | Per-project token/cost breakdown |
| `get_branch_cost` | branch_name | Total tokens, cost, session count for a branch |
| `search_history` | query, limit? | Matching prompts with timestamps and session links |
| `get_activity_summary` | days? (default 30) | Streak, daily counts, peak hours |
| `get_token_analytics` | period?, from?, to? | Time series of token usage and cost |
| `get_tool_usage` | project?, from?, to? | Tool frequency breakdown, top bash commands |
| `get_diagnostics` | session_id? | Slow ops, errors, health score |

### Integration

Users add to `.mcp.json`:
```json
{
  "mcpServers": {
    "sygil": {
      "command": "npx",
      "args": ["@sygil/mcp"]
    }
  }
}
```

Then in Claude Code:
```
> How much have I spent on Claude Code this week?
> Which project has the highest token cost?
> What's my cost for the feature/auth branch?
> Show me my most used tools this month
```

---

## 14. Milestones

### v0.1.0 — MVP
- Monorepo scaffold: pnpm workspaces + Turborepo
- `@sygil/core`: all 13 parsers, types, detector, pricing
- `sygil` CLI: arg parsing, Fastify server, glitchy startup animation
- Dashboard: Overview, Sessions, Session Detail, Token Analytics, Per-Project, Activity Heatmap, History Browser
- 9 of 17 pages functional with real data

### v0.2.0 — Deep Analytics
- Tool analytics with categories, MCP details, feature adoption, CC version history
- Git correlation (cost per branch, branch comparison)
- Change timeline with diff viewer
- Real-time refresh via SSE + filesystem watching
- Export (JSON, ZIP, CSV)

### v0.3.0 — Full Feature Set
- Task tracker (todos + plans with status/priority)
- Memory browser with type filters and stale detection
- Diagnostics (debug log analysis, health scores)
- Config viewer with permissions visualization
- Extensions inventory
- Import with merge preview

### v0.4.0 — MCP Server
- `@sygil/mcp` package: MCP server with stdio transport
- All 10 MCP tools implemented
- SSE transport option
- .mcp.json integration guide

### v0.5.0 — Polish & Community
- Theming (light/dark toggle)
- Keyboard shortcuts
- Session comparison mode (diff two sessions)
- Plugin system for custom dashboard panels
- Windows support

---

## 15. Non-Goals (v1)

- **No write operations to ~/.claude/** — Sygil reads only. Memory browsing is read-only.
- **No network calls** — everything is local. No phoning home, no telemetry.
- **No auth** — local tool, no login needed.
- **No mobile optimization** — desktop-first developer tool.
- **No Windows support at launch** — Unix paths assumed. Windows in v0.5+.

---

## 16. Open Questions

1. **License:** MIT? Apache 2.0?
2. **Config file:** Support `~/.sygil.json` for custom pricing, theme, default date range?
3. **Memory editing:** Stay read-only or allow edits (violates no-write principle)?
4. **PDF export:** Should session detail support PDF export in addition to markdown?
5. **MCP write ops:** Should the MCP server expose write operations or stay read-only?
6. **GitHub org:** Publish under a `@sygil` org or personal account?

---

## 17. Competitive Landscape

| Tool | What it does | Gaps Sygil fills |
|------|-------------|-----------------|
| **cc-lens** | Next.js dashboard: overview, sessions, costs, tools, activity, history, memory, todos, plans, settings, export | No file change diffs, no deep git cost-per-branch, no debug diagnostics, no MCP server, heavier runtime (Next.js) |
| ccusage | CLI tables: daily/monthly/session token counts | No web UI, no session replay, no file changes, no diagnostics |
| Claude-Code-Usage-Monitor | Real-time TUI token tracking | Real-time only, no historical analytics, no project breakdowns |
| CCHV | Electron app, token visualization | Heavy install, no git correlation, no tool analytics |
| claude-code-transcripts | HTML transcript export | Read-only transcripts, no analytics, no aggregation |
| claude-conversation-extractor | Extract sessions to markdown | Export tool only, no dashboard, no analytics |

**Sygil's differentiators:**
- Feature-complete: 17 feature areas covering every data source in `~/.claude/`
- Monorepo architecture: `@sygil/core` usable independently for custom tooling
- Lightweight: Vite + Fastify vs Next.js or Electron
- File change timeline with diffs (unique)
- Deep git correlation with cost-per-branch analytics (unique)
- Debug diagnostics with session health scores (unique)
- MCP server for programmatic access from Claude Code itself (unique, Phase 2)
- Glitchy System-inspired terminal experience and dashboard aesthetic
- Real-time SSE updates
- Export + import with merge preview
- Single `npx sygil`, zero config
- Open source, community-driven
