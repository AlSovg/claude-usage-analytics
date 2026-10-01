<script setup lang="ts">
import type { RecentConversation } from '#shared/types/analytics'
import { formatCompactNumber, formatDateTime, shortProjectName } from '../../utils/format'

defineProps<{ items: RecentConversation[] }>()

const { locale } = useI18n()
</script>

<template>
  <div class="list-wrap">
    <table v-if="items.length" class="conv-table">
      <thead>
        <tr>
          <th>{{ $t('recent.project') }}</th>
          <th>{{ $t('recent.branch') }}</th>
          <th>{{ $t('recent.lastActivity') }}</th>
          <th>{{ $t('recent.messages') }}</th>
          <th>{{ $t('recent.tokens') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.sessionId">
          <td class="project-cell" :title="item.cwd ?? item.projectSlug">{{ shortProjectName(item.cwd, item.projectSlug) }}</td>
          <td class="branch-cell">{{ item.gitBranch ?? '—' }}</td>
          <td>{{ formatDateTime(item.lastActivityAt, locale) }}</td>
          <td class="num">{{ item.messageCount }}</td>
          <td class="num">{{ formatCompactNumber(item.tokenTotal, locale) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty">{{ $t('empty.conversations') }}</p>
  </div>
</template>

<style scoped>
.list-wrap {
  overflow-x: auto;
}

.conv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.conv-table th {
  text-align: left;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.conv-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  white-space: nowrap;
}

.project-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.branch-cell {
  color: var(--text-secondary);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.empty {
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
