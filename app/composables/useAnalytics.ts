import type { AnalyticsResponse, RangeKey } from '#shared/types/analytics'

export function useAnalytics() {
  const range = useState<RangeKey>('analytics-range', () => '30d')

  const { data, status, error, refresh } = useFetch<AnalyticsResponse>('/api/analytics', {
    query: { range },
    watch: [range]
  })

  return { range, data, status, error, refresh }
}
