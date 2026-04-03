# ⬡ Sygil

**Your System has awakened.**

A real-time analytics dashboard + MCP server for Claude Code. Track tokens, costs, sessions, file changes, and everything in `~/.claude/` — zero config, zero cloud.

```
npx sygil
```

## Features

- **Overview** — tokens, costs, sessions, projects at a glance
- **Sessions** — browse, search, filter, replay full conversations
- **Token Analytics** — usage over time, model breakdown, cache efficiency, cost projections
- **Projects** — per-project cost and usage breakdown
- **Activity** — GitHub-style heatmap, streaks, peak hours
- **History** — searchable prompt history across all projects
- **Git Correlation** — cost per branch *(v0.2)*
- **Change Timeline** — file diffs from Claude edits *(v0.2)*
- **Tool Analytics** — tool usage breakdown *(v0.2)*
- **Diagnostics** — debug log analysis *(v0.3)*
- **Memory Browser** — explore Claude's memory files *(v0.3)*
- **MCP Server** — let Claude query its own analytics *(v0.4)*

## Setup (Development)

### Prerequisites

- Node.js 18+
- pnpm 9+
- Claude Code with local data in `~/.claude/`

### Install

```bash
git clone https://github.com/nexlabstudio/sygil.git
cd sygil
pnpm install
```

### Run (Development)

```bash
# Start both the API server and dashboard dev server
pnpm dev
```

This runs:
- API server on `http://localhost:4321`
- Dashboard dev server on `http://localhost:5173` (with HMR, proxies API calls to 4321)

### Run (Production-like)

```bash
pnpm build
cd packages/cli
node dist/index.js
```

### Build

```bash
pnpm build    # builds all packages in dependency order via Turborepo
```

## Architecture

```
sygil/
├── packages/
│   ├── core/         @sygil/core — parsers, types, pricing (shared foundation)
│   ├── cli/          sygil — Fastify server, API routes, CLI entry point
│   ├── dashboard/    @sygil/dashboard — React 19 + Vite (not published)
│   └── mcp/          @sygil/mcp — MCP server (Phase 2)
```

**Dependency flow:**
```
dashboard ──→ (talks to cli server via HTTP)
cli ─────────→ @sygil/core
mcp ─────────→ @sygil/core
```

## CLI

```
Usage: sygil [command] [options]

Commands:
  dashboard (default)   Launch browser dashboard
  stats                 Print overview stats as JSON
  mcp                   Start MCP server (v0.4)

Options:
  -p, --port <number>   Port (default: 4321)
  -d, --dir <path>      Claude data directory (default: auto-detect)
  --no-open             Don't auto-open browser
  -v, --version         Show version
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + Turborepo |
| Core | TypeScript (zero deps) |
| Server | Fastify |
| Dashboard | React 19, React Router 7, Recharts, SWR, Tailwind CSS 4 |
| Build | Vite 6 |
| MCP | @modelcontextprotocol/sdk (Phase 2) |

## Data Sources

All data is read **locally** from `~/.claude/` (or `~/.config/claude/`). Nothing is sent anywhere.

| Source | What |
|--------|------|
| `projects/<hash>/*.jsonl` | Session transcripts with token usage |
| `projects/<hash>/sessions-index.json` | Session metadata |
| `history.jsonl` | Global prompt history |
| `file-history/` | File edit snapshots |
| `todos/` | Task lists |
| `plans/` | Plan documents |
| `memory/` | Auto-memory files |
| `debug/` | Debug logs |
| `settings.json` | User settings |

## Roadmap

- **v0.1** — MVP: Overview, Sessions, Analytics, Projects, Activity, History
- **v0.2** — Tool Analytics, Git Correlation, Change Timeline, Export, Real-time SSE
- **v0.3** — Todos, Memory, Diagnostics, Config Viewer, Extensions
- **v0.4** — MCP Server
- **v0.5** — Theming, Keyboard Shortcuts, Windows Support

## License

MIT — NexLab Studio
