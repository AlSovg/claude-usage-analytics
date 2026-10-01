<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { DailyTokenPoint } from '../../../shared/types/analytics'
import { formatDateShort, formatCompactNumber } from '../../utils/format'

const props = defineProps<{ points: DailyTokenPoint[] }>()

const chartData = computed(() => ({
  labels: props.points.map(p => formatDateShort(p.date)),
  datasets: [
    { label: 'Input', data: props.points.map(p => p.input), backgroundColor: '#6366f1', stack: 'tokens' },
    { label: 'Output', data: props.points.map(p => p.output), backgroundColor: '#22d3ee', stack: 'tokens' },
    { label: 'Cache write', data: props.points.map(p => p.cacheCreation), backgroundColor: '#f59e0b', stack: 'tokens' },
    { label: 'Cache read', data: props.points.map(p => p.cacheRead), backgroundColor: '#4b5563', stack: 'tokens' }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#a1a1aa', boxWidth: 12 } },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.dataset.label}: ${formatCompactNumber(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    x: { stacked: true, ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
    y: {
      stacked: true,
      ticks: { color: '#71717a', callback: (v: number) => formatCompactNumber(v) },
      grid: { color: '#27272a' }
    }
  }
}
</script>

<template>
  <div class="chart-wrap">
    <ClientOnly>
      <Bar v-if="points.length" :data="chartData" :options="chartOptions" />
      <p v-else class="empty">Нет данных за выбранный период</p>
      <template #fallback>
        <p class="empty">Загрузка графика…</p>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 280px;
  position: relative;
}

.empty {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
  padding-top: 100px;
}
</style>
