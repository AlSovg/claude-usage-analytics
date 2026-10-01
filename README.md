# Claude Code Usage Analytics

A local dashboard for your Claude Code history: tokens, activity, models, tools, agents and projects.
Data is read directly from `~/.claude/projects/**/*.jsonl` and never leaves your machine.

## Features

- **KPIs:** total tokens, conversations, active sessions, agent calls, cache hit rate.
- **Overview:** tokens per day (input / output / cache write / cache read), activity heatmap, activity by hour.
- **Models & tools:** tokens per model, subagent calls (`Agent`), top tools.
- **Projects:** conversations and tokens per project, recent conversations.

Range: 7D / 30D / 90D / All. UI in English and Russian (toggle in the header).

## Getting started

Requires Node.js ≥ 20.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
node .output/server/index.mjs
```

## API

`GET /api/analytics?range=7d|30d|90d|all` (defaults to `30d`; any other value → `400`).
A single endpoint returns all dashboard data; the response type is `AnalyticsResponse` in `shared/types/analytics.ts`.

## How it's calculated

- **Tokens** — sum of `message.usage` from assistant messages. `<synthetic>` responses (interrupted streams) are excluded.
- **Subagents** — `<session>/subagents/*.jsonl` files count toward their parent session's tokens but not as separate conversations.
- **User messages** — real ones only: no `isMeta`, and `origin.kind === "human"` when `origin` is present.
- **Dates and hours** — in the machine's local time zone.
- **Cache** — each file's parse result is kept in memory keyed by `mtime + size`, so repeat requests only re-read changed files. The first request after server start is slower.

## Limitations

- Claude Code deletes old transcripts itself (`cleanupPeriodDays` in `~/.claude/settings.json`, 30 days by default), so the dashboard only sees what is still on disk.
- The claude.ai data export can't be used for stats: it has no token or model data.
- For "All", the heatmap is capped at the last 730 days (totals are unaffected).

## Project structure

```
server/api/analytics.get.ts     endpoint
server/utils/                   file scan, parser, cache, aggregation
shared/types/analytics.ts       types shared by client and server
app/pages/index.vue             dashboard page
app/components/analytics/       charts and widgets (Chart.js via vue-chartjs)
i18n/locales/                   ru / en translations
```
