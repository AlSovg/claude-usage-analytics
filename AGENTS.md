# claude-usage-analytics

Local Claude Code analytics dashboard over `~/.claude/projects/**/*.jsonl`. Replacement for the broken `claude-code-templates --analytics`. What it shows and how it counts — see `README.md`.

## Stack
- Nuxt 4, Vue 3, TypeScript
- Chart.js + vue-chartjs (charts wrapped in `<ClientOnly>`, registered in `app/plugins/chartjs.client.ts`)
- @nuxtjs/i18n: ru (default) / en, `no_prefix`, cookie `i18n_locale`
- No database, no Pinia

## Commands
- `npm run dev` — http://localhost:3000
- `npm run build` — production build
- Typecheck is not set up (no `vue-tsc`)

## Architecture
- Single endpoint `GET /api/analytics?range=7d|30d|90d|all` → `buildAnalyticsResponse` (`server/utils/aggregate.ts`)
- `parseSessionFile.ts` → `FileSummary` with date-keyed maps (`YYYY-MM-DD`, local time); range filtering sums these maps, lines are never re-read
- `cache.ts`: `fileCache` keyed by `mtime+size` + `combineCache` per range/generation, in memory only
- Response types live in `shared/types/analytics.ts`, shared by client and server
- UI: `app/pages/index.vue` (tabs in `?tab=overview|tools|projects`), components in `app/components/analytics/` with no name prefix

## Rules
- New metric: field in `FileSummary` → aggregation in `aggregate.ts` → type in `shared/types` → component
- All UI strings go through i18n, keys in both `i18n/locales/{ru,en}.json`
- Formatters (`app/utils/format.ts`) take `locale` explicitly; chart options are `computed` with `locale: locale.value`
- Don't add `fs.watch`/chokidar — full recompute on every change was the main bug of the tool this replaces
- Read files as streams (`readline`), never whole: some are 20+ MB

## Gotchas
- Editing files in `server/` drops the in-memory cache: the first request re-parses ~500 files and can take over 2 minutes
- A subagent call is a `tool_use` with `name === "Agent"` (not `"Task"`)
- The project root contains a claude.ai account export with personal data — it is in `.gitignore`; never commit or publish it

## Status
Dashboard works. CLI packaging (`bin/cli.mjs`, npm publish) is the next step, not started.
