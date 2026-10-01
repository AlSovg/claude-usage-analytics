<script setup lang="ts">
const { range, data, status, error } = useAnalytics()

const TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'tools', label: 'Модели и инструменты' },
  { key: 'projects', label: 'Проекты' }
] as const
type TabKey = typeof TABS[number]['key']

const route = useRoute()
const router = useRouter()
const tab = computed<TabKey>({
  get: () => TABS.find(t => t.key === route.query.tab)?.key ?? 'overview',
  set: key => router.replace({ query: { ...route.query, tab: key } })
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div>
        <h1>Claude Code Usage Analytics</h1>
        <p v-if="data" class="range-meta">
          {{ data.rangeStart ?? '…' }} — {{ data.rangeEnd }} ·
          файлов истории: {{ data.meta.filesScanned }}
          <template v-if="data.meta.filesParsedThisRequest">
            (перечитано заново: {{ data.meta.filesParsedThisRequest }})
          </template>
        </p>
      </div>
      <RangeSelector v-model="range" />
    </header>

    <p v-if="status === 'pending' && !data" class="status-line">Загрузка…</p>
    <p v-else-if="error" class="status-line error">Ошибка загрузки: {{ error.message }}</p>

    <template v-if="data">
      <section class="stat-grid">
        <StatCard label="Всего токенов" :value="data.totals.totalTokens" />
        <StatCard label="Разговоры" :value="data.totals.conversations" />
        <StatCard label="Активные сессии" :value="data.totals.activeSessions" />
        <StatCard label="Вызовы агентов" :value="data.totals.agentUses" />
        <StatCard label="Попадания в кэш" :value="data.totals.cacheHitRate" percent />
      </section>

      <nav class="tabs" role="tablist">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          role="tab"
          class="tab"
          :class="{ active: tab === t.key }"
          :aria-selected="tab === t.key"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </nav>

      <template v-if="tab === 'overview'">
        <section class="panel">
          <h2>Использование токенов по дням</h2>
          <TokenUsageChart :points="data.tokenUsageOverTime" />
        </section>

        <div class="two-col activity-row">
          <section class="panel">
            <h2>Активность</h2>
            <ActivityHeatmap :days="data.activityHeatmap" />
          </section>

          <section class="panel">
            <h2>Активность по часам</h2>
            <HourlyActivityChart :hours="data.hourlyActivity" />
          </section>
        </div>
      </template>

      <template v-else-if="tab === 'tools'">
        <div class="two-col">
          <section class="panel">
            <h2>Модели (токены)</h2>
            <RankedBarChart :items="data.modelUsage" color="#34d399" value-label="Токены" empty-text="Нет данных за период" />
          </section>

          <section class="panel">
            <h2>Использование агентов</h2>
            <RankedBarChart :items="data.agentUsage" color="#8b5cf6" value-label="Использований" empty-text="Нет вызовов агентов за период" />
          </section>
        </div>

        <section class="panel">
          <h2>Инструменты</h2>
          <RankedBarChart :items="data.toolUsage" color="#f472b6" value-label="Вызовов" empty-text="Нет вызовов инструментов за период" />
        </section>
      </template>

      <template v-else>
        <section class="panel">
          <h2>Проекты</h2>
          <ProjectsChart :items="data.projects" />
        </section>

        <section class="panel conversations-panel">
          <h2>Последние разговоры</h2>
          <RecentConversations :items="data.recentConversations" />
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.range-meta {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.status-line {
  color: var(--text-secondary);
}

.status-line.error {
  color: #f87171;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.panel {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.panel h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}

.tab {
  padding: 10px 16px;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--text-primary);
  border-bottom-color: var(--accent);
}

.conversations-panel {
  overflow: hidden;
}

.activity-row {
  grid-template-columns: minmax(0, auto) minmax(320px, 1fr);
  align-items: stretch;
}

.activity-row .panel {
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .two-col,
  .activity-row {
    grid-template-columns: 1fr;
  }
}
</style>
