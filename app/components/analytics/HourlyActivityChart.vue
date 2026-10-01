<script setup lang="ts">
import { Bar } from 'vue-chartjs'

const props = defineProps<{ hours: number[] }>()

const { t, locale } = useI18n()

const chartData = computed(() => ({
  labels: props.hours.map((_, h) => String(h).padStart(2, '0')),
  datasets: [
    { label: t('values.messages'), data: props.hours, backgroundColor: '#f59e0b', borderRadius: 4 }
  ]
}))

const chartOptions = computed(() => ({
  locale: locale.value,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { title: (items: any[]) => `${items[0]?.label}:00–${items[0]?.label}:59` } }
  },
  scales: {
    x: { ticks: { color: '#71717a' }, grid: { display: false } },
    y: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } }
  }
}))
</script>

<template>
  <div class="chart-wrap">
    <ClientOnly>
      <Bar :data="chartData" :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.chart-wrap { position: relative; flex: 1; min-height: 220px; }
</style>
