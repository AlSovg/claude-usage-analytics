import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { toDateKey } from './date'

export interface DayBucket {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
  messageCount: number
}

export interface FileSummary {
  filePath: string
  projectSlug: string
  sessionId: string
  isSidechain: boolean
  cwd: string | null
  gitBranch: string | null
  firstTimestamp: string | null
  lastTimestamp: string | null
  userMessageCount: number
  assistantMessageCount: number
  /** date (YYYY-MM-DD) -> token/message totals for that day */
  dailyBuckets: Map<string, DayBucket>
  /** date (YYYY-MM-DD) -> agentType -> invocation count */
  agentUsesByDate: Map<string, Map<string, number>>
  /** date -> model -> total tokens */
  modelTokensByDate: Map<string, Map<string, number>>
  /** date -> tool name -> invocation count */
  toolUsesByDate: Map<string, Map<string, number>>
  /** date -> 24 message counts by local hour */
  hourlyByDate: Map<string, number[]>
  malformedLines: number
}

function incNested(map: Map<string, Map<string, number>>, date: string, key: string, n: number) {
  let inner = map.get(date)
  if (!inner) {
    inner = new Map()
    map.set(date, inner)
  }
  inner.set(key, (inner.get(key) ?? 0) + n)
}

function incHour(map: Map<string, number[]>, date: string, timestamp: string) {
  let hours = map.get(date)
  if (!hours) {
    hours = new Array(24).fill(0)
    map.set(date, hours)
  }
  hours[new Date(timestamp).getHours()]!++
}

function emptyDayBucket(): DayBucket {
  return { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, messageCount: 0 }
}

function getOrCreateDayBucket(map: Map<string, DayBucket>, key: string): DayBucket {
  let bucket = map.get(key)
  if (!bucket) {
    bucket = emptyDayBucket()
    map.set(key, bucket)
  }
  return bucket
}

function isRealUserMessage(record: any): boolean {
  if (record.isMeta === true) return false
  const originKind = record.origin?.kind
  // origin was added in newer CLI versions; absence means an older file, treat as real.
  return !originKind || originKind === 'human'
}

export async function parseSessionFile(
  filePath: string,
  projectSlug: string,
  sessionId: string,
  isSidechain: boolean
): Promise<FileSummary> {
  const summary: FileSummary = {
    filePath,
    projectSlug,
    sessionId,
    isSidechain,
    cwd: null,
    gitBranch: null,
    firstTimestamp: null,
    lastTimestamp: null,
    userMessageCount: 0,
    assistantMessageCount: 0,
    dailyBuckets: new Map(),
    agentUsesByDate: new Map(),
    modelTokensByDate: new Map(),
    toolUsesByDate: new Map(),
    hourlyByDate: new Map(),
    malformedLines: 0
  }

  const rl = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }), crlfDelay: Infinity })

  for await (const line of rl) {
    if (!line.trim()) continue

    let record: any
    try {
      record = JSON.parse(line)
    } catch {
      summary.malformedLines++
      continue
    }

    if (record.type !== 'user' && record.type !== 'assistant') continue

    if (typeof record.cwd === 'string') summary.cwd = record.cwd
    if (typeof record.gitBranch === 'string') summary.gitBranch = record.gitBranch

    const dateKey = typeof record.timestamp === 'string' ? toDateKey(record.timestamp) : null
    if (dateKey) {
      if (!summary.firstTimestamp || record.timestamp < summary.firstTimestamp) summary.firstTimestamp = record.timestamp
      if (!summary.lastTimestamp || record.timestamp > summary.lastTimestamp) summary.lastTimestamp = record.timestamp
    }

    const message = record.message
    if (!message) continue

    if (record.type === 'assistant') {
      if (message.model === '<synthetic>') continue

      summary.assistantMessageCount++

      const usage = message.usage
      if (usage && dateKey) {
        const bucket = getOrCreateDayBucket(summary.dailyBuckets, dateKey)
        const input = usage.input_tokens ?? 0
        const output = usage.output_tokens ?? 0
        const cacheCreation = usage.cache_creation_input_tokens ?? 0
        const cacheRead = usage.cache_read_input_tokens ?? 0
        bucket.input += input
        bucket.output += output
        bucket.cacheCreation += cacheCreation
        bucket.cacheRead += cacheRead
        bucket.messageCount += 1
        incNested(summary.modelTokensByDate, dateKey, message.model ?? 'unknown', input + output + cacheCreation + cacheRead)
        incHour(summary.hourlyByDate, dateKey, record.timestamp)
      }

      if (Array.isArray(message.content) && dateKey) {
        for (const block of message.content) {
          if (block?.type !== 'tool_use') continue
          incNested(summary.toolUsesByDate, dateKey, block.name ?? 'unknown', 1)
          if (block.name === 'Agent') {
            incNested(summary.agentUsesByDate, dateKey, block.input?.subagent_type ?? block.input?.description ?? 'unknown', 1)
          }
        }
      }
    } else if (record.type === 'user') {
      if (isRealUserMessage(record)) {
        summary.userMessageCount++
        if (dateKey) {
          const bucket = getOrCreateDayBucket(summary.dailyBuckets, dateKey)
          bucket.messageCount += 1
          incHour(summary.hourlyByDate, dateKey, record.timestamp)
        }
      }
    }
  }

  return summary
}
