import { buildAnalyticsResponse } from '../utils/aggregate'
import { isRangeKey } from '../utils/range'
import type { RangeKey } from '../../shared/types/analytics'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawRange = query.range ?? '30d'

  if (!isRangeKey(rawRange)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid range "${String(rawRange)}". Expected one of: 7d, 30d, 90d, all.`
    })
  }

  return buildAnalyticsResponse(rawRange as RangeKey)
})
