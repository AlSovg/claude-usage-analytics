<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { ProjectUsage } from '#shared/types/analytics'
import { formatCompactNumber, shortProjectName } from '../../utils/format'

const props = defineProps<{ items: ProjectUsage[] }>()

const { t, locale } = useI18n()

const chartData = computed(() => ({
  labels: props.items.map(i => shortProjectName(i.cwd, i.projectSlug)),
  datasets: [
    { label: t('values.conversations'), data: props.items.map(i => i.conversations), backgroundColor: '#22d3ee', borderRadius: 4 }
  ]
}))

const chartOptions = computed(() => ({
  locale: locale.value,
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: any[]) => props.items[items[0]?.dataIndex]?.cwd ?? props.items[items[0]?.dataIndex]?.projectSlug ?? '',
        afterLabel: (ctx: any) => t('projects.tokens', { n: formatCompactNumber(props.items[ctx.dataIndex]?.tokenTotal ?? 0, locale.value) })
      }
    }
  },
  scales: {
    x: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
    y: { ticks: { color: '#a1a1aa' }, grid: { display: false } }
  }
}))
</script>

<template>
  <div class="chart-wrap" :style="{ height: Math.max(180, items.length * 32) + 'px' }">
    <ClientOnly>
      <Bar v-if="items.length" :data="chartData" :options="chartOptions" />
      <p v-else class="empty">{{ $t('empty.period') }}</p>
    </ClientOnly>
  </div>
</template>

<style scoped>
.chart-wrap { position: relative; }
.empty {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
  padding-top: 60px;
}
</style>
