<script setup lang="ts">
import type { HeatmapDay } from '../../../shared/types/analytics'
import { formatCompactNumber, formatDateShort, formatNumber } from '../../utils/format'

const props = defineProps<{ days: HeatmapDay[] }>()

interface Cell {
  date: string
  tokenTotal: number
  messageCount: number
  level: number
}

const WEEKDAYS = ['Пн', '', 'Ср', '', 'Пт', '', '']

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

const max = computed(() => Math.max(1, ...props.days.map(d => d.tokenTotal)))

const weeks = computed<Cell[][]>(() => {
  if (!props.days.length) return []

  const byDate = new Map(props.days.map(d => [d.date, d]))
  const sortedDates = [...byDate.keys()].sort()
  const end = parseDateKey(sortedDates[sortedDates.length - 1]!)

  // Align grid start to the preceding Monday so weeks form full 7-day columns.
  const cursor = parseDateKey(sortedDates[0]!)
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))

  const cells: Cell[] = []
  while (cursor <= end) {
    const key = toDateKey(cursor)
    const entry = byDate.get(key)
    const tokenTotal = entry?.tokenTotal ?? 0
    const level = tokenTotal === 0 ? 0 : Math.min(4, 1 + Math.floor((tokenTotal / max.value) * 3))
    cells.push({ date: key, tokenTotal, messageCount: entry?.messageCount ?? 0, level })
    cursor.setDate(cursor.getDate() + 1)
  }

  const result: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
  return result
})

// Columns shrink toward 18px only for long ranges; then a "dd.mm" label needs every 2nd column.
const labelEvery = computed(() => (weeks.value.length > 26 ? 2 : 1))
</script>

<template>
  <div v-if="weeks.length" class="heatmap">
    <div class="heatmap-scroll">
      <div class="heatmap-body" :style="{ '--weeks': weeks.length }">
        <span
          v-for="(label, di) in WEEKDAYS"
          :key="`wd${di}`"
          class="weekday"
          :style="{ gridColumn: 1, gridRow: di + 1 }"
        >{{ label }}</span>
        <template v-for="(week, wi) in weeks" :key="wi">
          <div
            v-for="(cell, di) in week"
            :key="cell.date"
            class="heatmap-cell"
            :data-level="cell.level"
            :style="{ gridColumn: wi + 2, gridRow: di + 1 }"
            :title="`${formatDateShort(cell.date)}: ${formatNumber(cell.tokenTotal)} токенов, ${cell.messageCount} сообщений`"
          />
          <span
            v-if="wi % labelEvery === 0"
            class="week-label"
            :style="{ gridColumn: wi + 2, gridRow: 8 }"
          >{{ formatDateShort(week[0]!.date) }}</span>
        </template>
      </div>
    </div>
    <div class="legend">
      <span>0</span>
      <span v-for="level in 5" :key="level" class="heatmap-cell" :data-level="level - 1" />
      <span>{{ formatCompactNumber(max) }} токенов/день</span>
    </div>
  </div>
  <p v-else class="empty">Нет данных за выбранный период</p>
</template>

<style scoped>
.heatmap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.heatmap-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.heatmap-body {
  display: grid;
  grid-template-columns: auto repeat(var(--weeks), minmax(18px, 40px));
  justify-content: start;
  gap: 4px;
}

.weekday {
  align-self: center;
  padding-right: 6px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.week-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
  width: 0;
  overflow: visible;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: var(--surface-2);
}

.heatmap-cell[data-level='1'] { background: #1a3d2e; }
.heatmap-cell[data-level='2'] { background: #256b45; }
.heatmap-cell[data-level='3'] { background: #2fa35c; }
.heatmap-cell[data-level='4'] { background: #3fd67a; }

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.legend .heatmap-cell {
  width: 12px;
  height: 12px;
}

.empty {
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
