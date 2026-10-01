import { scanProjects } from './scanProjects'
import { parseSessionFile, type FileSummary, type DayBucket } from './parseSessionFile'
import { fileCache, combineCache, getGeneration, bumpGeneration, pruneFileCache } from './cache'
import { resolveRange, isDateKeyInRange } from './range'
import type {
  AnalyticsResponse,
  RangeKey,
  TokenBreakdown,
  DailyTokenPoint,
  HeatmapDay,
  ProjectUsage,
  RankedItem,
  RecentConversation
} from '../../shared/types/analytics'

/** Sums per-date nested counters across files for in-range dates. */
function sumNested(
  summaries: FileSummary[],
  pick: (s: FileSummary) => Map<string, Map<string, number>>,
  isInRange: (key: string) => boolean
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const summary of summaries) {
    for (const [date, inner] of pick(summary)) {
      if (!isInRange(date)) continue
      for (const [key, n] of inner) totals.set(key, (totals.get(key) ?? 0) + n)
    }
  }
  return totals
}

function toRanked(totals: Map<string, number>, limit: number): RankedItem[] {
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

function emptyBreakdown(): TokenBreakdown {
  return { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 }
}

interface SessionAgg {
  sessionId: string
  projectSlug: string
  cwd: string | null
  gitBranch: string | null
  main: FileSummary | null
  subs: FileSummary[]
}

/** Sums a file's daily buckets restricted to the ones matching `isInRange`. */
function sumRanged(summary: FileSummary, isInRange: (key: string) => boolean) {
  const totals = emptyBreakdown()
  let messageCount = 0
  for (const [date, bucket] of summary.dailyBuckets) {
    if (!isInRange(date)) continue
    totals.input += bucket.input
    totals.output += bucket.output
    totals.cacheCreation += bucket.cacheCreation
    totals.cacheRead += bucket.cacheRead
    messageCount += bucket.messageCount
  }
  totals.total = totals.input + totals.output + totals.cacheCreation + totals.cacheRead
  return { totals, messageCount }
}

export async function buildAnalyticsResponse(range: RangeKey): Promise<AnalyticsResponse> {
  const scanned = await scanProjects()
  pruneFileCache(new Set(scanned.map(f => f.filePath)))

  let filesParsedThisRequest = 0
  const summaries: FileSummary[] = []

  for (const file of scanned) {
    const cached = fileCache.get(file.filePath)
    if (cached && cached.mtimeMs === file.mtimeMs && cached.size === file.size) {
      summaries.push(cached.summary)
      continue
    }
    const summary = await parseSessionFile(file.filePath, file.projectSlug, file.sessionId, file.isSidechain)
    fileCache.set(file.filePath, { mtimeMs: file.mtimeMs, size: file.size, summary })
    bumpGeneration()
    filesParsedThisRequest++
    summaries.push(summary)
  }

  const resolved = resolveRange(range)
  const isInRange = (key: string) => isDateKeyInRange(key, resolved)
  const isInHeatmapRange = (key: string) => key >= resolved.heatmapStartKey && key <= resolved.endKey

  const cacheHitRatio = scanned.length === 0 ? 1 : 1 - filesParsedThisRequest / scanned.length
  const generation = getGeneration()
  const cachedCombined = combineCache.get(range)
  if (cachedCombined && cachedCombined.generation === generation) {
    return {
      ...cachedCombined.response,
      generatedAt: new Date().toISOString(),
      meta: { filesScanned: scanned.length, filesParsedThisRequest, cacheHitRatio }
    }
  }

  // --- combined daily buckets: token time series, breakdown, heatmap ---
  const combinedDaily = new Map<string, DayBucket>()
  for (const summary of summaries) {
    for (const [date, bucket] of summary.dailyBuckets) {
      if (!isInRange(date)) continue
      let target = combinedDaily.get(date)
      if (!target) {
        target = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, messageCount: 0 }
        combinedDaily.set(date, target)
      }
      target.input += bucket.input
      target.output += bucket.output
      target.cacheCreation += bucket.cacheCreation
      target.cacheRead += bucket.cacheRead
      target.messageCount += bucket.messageCount
    }
  }

  const tokenUsageOverTime: DailyTokenPoint[] = [...combinedDaily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      input: b.input,
      output: b.output,
      cacheCreation: b.cacheCreation,
      cacheRead: b.cacheRead,
      total: b.input + b.output + b.cacheCreation + b.cacheRead
    }))

  const activityHeatmap: HeatmapDay[] = tokenUsageOverTime
    .filter(p => isInHeatmapRange(p.date))
    .map(p => ({ date: p.date, messageCount: combinedDaily.get(p.date)!.messageCount, tokenTotal: p.total }))

  const tokenBreakdown = tokenUsageOverTime.reduce((acc, p) => {
    acc.input += p.input
    acc.output += p.output
    acc.cacheCreation += p.cacheCreation
    acc.cacheRead += p.cacheRead
    acc.total += p.total
    return acc
  }, emptyBreakdown())

  // --- agent uses ---
  const agentUsesTotals = sumNested(summaries, s => s.agentUsesByDate, isInRange)
  const agentUsage = toRanked(agentUsesTotals, 15)
  const totalAgentUses = [...agentUsesTotals.values()].reduce((a, b) => a + b, 0)

  const modelUsage = toRanked(sumNested(summaries, s => s.modelTokensByDate, isInRange), 10)
  const toolUsage = toRanked(sumNested(summaries, s => s.toolUsesByDate, isInRange), 15)

  const hourlyActivity: number[] = new Array(24).fill(0)
  for (const summary of summaries) {
    for (const [date, hours] of summary.hourlyByDate) {
      if (!isInRange(date)) continue
      hours.forEach((n, h) => { hourlyActivity[h]! += n })
    }
  }

  const promptTokens = tokenBreakdown.input + tokenBreakdown.cacheCreation + tokenBreakdown.cacheRead
  const cacheHitRate = promptTokens === 0 ? 0 : tokenBreakdown.cacheRead / promptTokens

  // --- group files by parent session (main .jsonl + its subagents/*.jsonl) ---
  const sessions = new Map<string, SessionAgg>()
  for (const summary of summaries) {
    let agg = sessions.get(summary.sessionId)
    if (!agg) {
      agg = { sessionId: summary.sessionId, projectSlug: summary.projectSlug, cwd: null, gitBranch: null, main: null, subs: [] }
      sessions.set(summary.sessionId, agg)
    }
    if (summary.isSidechain) agg.subs.push(summary)
    else agg.main = summary
    if (summary.cwd) agg.cwd = summary.cwd
    if (summary.gitBranch) agg.gitBranch = summary.gitBranch
  }

  interface ActiveSession {
    sessionId: string
    projectSlug: string
    cwd: string | null
    gitBranch: string | null
    lastActivityAt: string
    messageCount: number
    tokenTotal: number
  }

  const activeSessionsList: ActiveSession[] = []
  for (const agg of sessions.values()) {
    // Conversations/active sessions are defined by the top-level file; an orphaned
    // subagents/ dir with no parent .jsonl (shouldn't normally happen) isn't a conversation.
    if (!agg.main) continue
    const activeInRange = [...agg.main.dailyBuckets.keys()].some(isInRange)
    if (!activeInRange) continue

    const mainRanged = sumRanged(agg.main, isInRange)
    let tokenTotal = mainRanged.totals.total
    for (const sub of agg.subs) {
      tokenTotal += sumRanged(sub, isInRange).totals.total
    }

    activeSessionsList.push({
      sessionId: agg.sessionId,
      projectSlug: agg.projectSlug,
      cwd: agg.cwd,
      gitBranch: agg.gitBranch,
      lastActivityAt: agg.main.lastTimestamp ?? agg.main.firstTimestamp ?? resolved.end.toISOString(),
      messageCount: mainRanged.messageCount,
      tokenTotal
    })
  }

  const totals = {
    totalTokens: tokenBreakdown.total,
    conversations: activeSessionsList.length,
    activeSessions: activeSessionsList.length,
    agentUses: totalAgentUses,
    cacheHitRate
  }

  const projectMap = new Map<string, { cwd: string | null; conversations: number; tokenTotal: number }>()
  for (const s of activeSessionsList) {
    let p = projectMap.get(s.projectSlug)
    if (!p) {
      p = { cwd: sessions.get(s.sessionId)?.cwd ?? null, conversations: 0, tokenTotal: 0 }
      projectMap.set(s.projectSlug, p)
    }
    p.conversations++
    p.tokenTotal += s.tokenTotal
  }
  const projects: ProjectUsage[] = [...projectMap.entries()]
    .map(([projectSlug, p]) => ({ projectSlug, cwd: p.cwd, conversations: p.conversations, tokenTotal: p.tokenTotal }))
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 15)

  const recentConversations: RecentConversation[] = [...activeSessionsList]
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
    .slice(0, 20)
    .map(s => ({
      sessionId: s.sessionId,
      projectSlug: s.projectSlug,
      cwd: s.cwd,
      lastActivityAt: s.lastActivityAt,
      messageCount: s.messageCount,
      tokenTotal: s.tokenTotal,
      gitBranch: s.gitBranch
    }))

  const response: AnalyticsResponse = {
    range,
    rangeStart: resolved.startKey,
    rangeEnd: resolved.endKey,
    generatedAt: new Date().toISOString(),
    totals,
    tokenBreakdown,
    tokenUsageOverTime,
    activityHeatmap,
    agentUsage,
    modelUsage,
    toolUsage,
    hourlyActivity,
    projects,
    recentConversations,
    meta: { filesScanned: scanned.length, filesParsedThisRequest, cacheHitRatio }
  }

  combineCache.set(range, { generation: getGeneration(), response })
  return response
}
