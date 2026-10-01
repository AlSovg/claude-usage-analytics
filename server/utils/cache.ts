import type { AnalyticsResponse, RangeKey } from '../../shared/types/analytics'
import type { FileSummary } from './parseSessionFile'

interface FileCacheEntry {
  mtimeMs: number
  size: number
  summary: FileSummary
}

interface CombinedCacheEntry {
  generation: number
  response: AnalyticsResponse
}

/**
 * Module-scope singletons: live for the lifetime of the Nitro process. No file-watcher —
 * invalidation is purely by mtime+size, checked on every request (see aggregate.ts).
 */
export const fileCache = new Map<string, FileCacheEntry>()
export const combineCache = new Map<RangeKey, CombinedCacheEntry>()

let generation = 0

export function getGeneration(): number {
  return generation
}

export function bumpGeneration(): void {
  generation++
}

/** Drops cache entries for files that no longer exist on disk. */
export function pruneFileCache(currentPaths: Set<string>): void {
  for (const path of fileCache.keys()) {
    if (!currentPaths.has(path)) {
      fileCache.delete(path)
      generation++
    }
  }
}
