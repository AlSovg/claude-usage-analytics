<script setup lang="ts">
import { formatCompactNumber, formatNumber } from '../../utils/format'

const props = defineProps<{
  label: string
  value: number
  compact?: boolean
  percent?: boolean
}>()

const displayValue = computed(() => {
  if (props.percent) return `${(props.value * 100).toFixed(1)}%`
  return (props.compact ?? true) ? formatCompactNumber(props.value) : formatNumber(props.value)
})
const fullValue = computed(() => props.percent ? displayValue.value : formatNumber(props.value))
</script>

<template>
  <div class="stat-card" :title="fullValue">
    <span class="stat-label">{{ label }}</span>
    <span class="stat-value">{{ displayValue }}</span>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
</style>
