<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { RankedItem } from '../../../shared/types/analytics'
import { formatCompactNumber } from '../../utils/format'

const props = defineProps<{
  items: RankedItem[]
  color: string
  valueLabel: string
  emptyText: string
}>()

const chartData = computed(() => ({
  labels: props.items.map(i => i.label),
  datasets: [
    { label: props.valueLabel, data: props.items.map(i => i.value), backgroundColor: props.color, borderRadius: 4 }
  ]
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#71717a', callback: (v: string | number) => formatCompactNumber(Number(v)) }, grid: { color: '#27272a' } },
    y: { ticks: { color: '#a1a1aa' }, grid: { display: false } }
  }
}
</script>

<template>
  <div class="chart-wrap" :style="{ height: Math.max(180, items.length * 32) + 'px' }">
    <ClientOnly>
      <Bar v-if="items.length" :data="chartData" :options="chartOptions" />
      <p v-else class="empty">{{ emptyText }}</p>
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
