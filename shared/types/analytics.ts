export type RangeKey = '7d' | '30d' | '90d' | 'all'

export const RANGE_KEYS: RangeKey[] = ['7d', '30d', '90d', 'all']

export interface TokenBreakdown {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
  total: number
}

export interface DailyTokenPoint extends TokenBreakdown {
  date: string
}

export interface HeatmapDay {
  date: string
  messageCount: number
  tokenTotal: number
}

export interface RankedItem {
  label: string
  value: number
}

export interface ProjectUsage {
  projectSlug: string
  cwd: string | null
  conversations: number
  tokenTotal: number
}

export interface RecentConversation {
  sessionId: string
  projectSlug: string
  cwd: string | null
  lastActivityAt: string
  messageCount: number
  tokenTotal: number
  gitBranch: string | null
}

export interface AnalyticsResponse {
  range: RangeKey
  rangeStart: string | null
  rangeEnd: string
  generatedAt: string
  totals: {
    totalTokens: number
    conversations: number
    activeSessions: number
    agentUses: number
    /** cacheRead / (input + cacheCreation + cacheRead), 0..1 */
    cacheHitRate: number
  }
  tokenBreakdown: TokenBreakdown
  tokenUsageOverTime: DailyTokenPoint[]
  activityHeatmap: HeatmapDay[]
  /** Agent tool invocations per subagent type, top 15 desc */
  agentUsage: RankedItem[]
  /** tokens per model, desc */
  modelUsage: RankedItem[]
  /** tool_use invocations per tool name, top 15 desc */
  toolUsage: RankedItem[]
  /** messages per local hour of day, length 24 */
  hourlyActivity: number[]
  projects: ProjectUsage[]
  recentConversations: RecentConversation[]
  meta: {
    filesScanned: number
    filesParsedThisRequest: number
    cacheHitRatio: number
  }
}
