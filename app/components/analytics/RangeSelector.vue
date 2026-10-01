<script setup lang="ts">
import type { RangeKey } from '#shared/types/analytics'
import { RANGE_KEYS } from '#shared/types/analytics'

const range = defineModel<RangeKey>({ required: true })
</script>

<template>
  <div class="range-selector">
    <button
      v-for="key in RANGE_KEYS"
      :key="key"
      type="button"
      class="range-btn"
      :class="{ active: range === key }"
      @click="range = key"
    >
      {{ $t(`range.${key}`) }}
    </button>
  </div>
</template>

<style scoped>
.range-selector {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface-2);
  border-radius: 10px;
}

.range-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.range-btn:hover {
  color: var(--text-primary);
}

.range-btn.active {
  background: var(--accent);
  color: var(--accent-contrast);
}
</style>
