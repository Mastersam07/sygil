# Sygil

**Your System has awakened.**

Real-time analytics dashboard for Claude Code. Track tokens, costs, sessions, and everything in `~/.claude/` — zero config, zero cloud.

```
npx sygil
```

## What You Get

- **Overview** — total tokens, costs, sessions, cache savings at a glance
- **Sessions** — browse, search, and replay full conversations
- **Token Analytics** — usage over time, model breakdown, cache efficiency, cost projections
- **Projects** — per-project cost and usage breakdown
- **Activity** — GitHub-style heatmap, streaks, peak hours
- **History** — searchable prompt history across all projects

All data stays local. Nothing is sent anywhere.

## Install

```bash
# Run directly
npx sygil

# Or install globally
npm i -g sygil
sygil
```

Opens a dashboard in your browser. That's it.

## CLI

```
sygil                     Launch dashboard (default)
sygil stats               Print overview stats as JSON
sygil --port 8080         Custom port
sygil --no-open           Don't auto-open browser
sygil --dir ~/backup/.claude  Custom data directory
```

## Development

```bash
git clone https://github.com/nexlabstudio/sygil.git
cd sygil
pnpm install
pnpm dev
```

## License

MIT — NexLab Studio
