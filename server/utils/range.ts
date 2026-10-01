import { RANGE_KEYS, type RangeKey } from '#shared/types/analytics'
import { toDateKey } from './date'

export function isRangeKey(value: unknown): value is RangeKey {
  return typeof value === 'string' && (RANGE_KEYS as string[]).includes(value)
}

const RANGE_DAYS: Record<Exclude<RangeKey, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90
}

/** For 'all', only caps how far back the activity heatmap grid renders — never affects totals. */
const ALL_TIME_HEATMAP_DAYS = 730

export interface ResolvedRange {
  start: Date | null
  end: Date
  startKey: string | null
  endKey: string
  heatmapStartKey: string
}

export function resolveRange(range: RangeKey): ResolvedRange {
  const end = new Date()
  const endKey = toDateKey(end)!

  if (range === 'all') {
    const heatmapStart = new Date(end)
    heatmapStart.setDate(heatmapStart.getDate() - ALL_TIME_HEATMAP_DAYS)
    return { start: null, end, startKey: null, endKey, heatmapStartKey: toDateKey(heatmapStart)! }
  }

  const start = new Date(end)
  start.setDate(start.getDate() - RANGE_DAYS[range])
  const startKey = toDateKey(start)!
  return { start, end, startKey, endKey, heatmapStartKey: startKey }
}

export function isDateKeyInRange(dateKey: string, resolved: ResolvedRange): boolean {
  if (resolved.startKey && dateKey < resolved.startKey) return false
  return dateKey <= resolved.endKey
}
