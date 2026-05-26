<template>
  <div class="overflow-x-auto">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="data.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <slot name="empty">
        <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-sm text-gray-400">{{ emptyText }}</p>
      </slot>
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead>
        <tr class="text-left">
          <th v-if="selectable" class="pb-3 w-10">
            <input
              type="checkbox"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              :checked="allSelected"
              :indeterminate="partialSelected"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'text-xs font-medium text-gray-400 uppercase tracking-wider pb-3',
              col.align === 'right' ? 'text-right' : '',
              col.align === 'center' ? 'text-center' : '',
              col.sortKey ? 'cursor-pointer select-none hover:text-gray-600' : ''
            ]"
            :style="col.width ? { width: col.width } : undefined"
            @click="handleSort(col)"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.label }}
              <span v-if="col.sortKey && sortBy === col.sortKey" class="inline-flex flex-col leading-none">
                <svg class="w-3 h-3 -mb-0.5" :class="sortDir === 'asc' ? 'text-gray-900' : 'text-gray-300'" viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0z"/></svg>
                <svg class="w-3 h-3 -mt-0.5" :class="sortDir === 'desc' ? 'text-gray-900' : 'text-gray-300'" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z"/></svg>
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIdx) in data"
          :key="row.id || rowIdx"
          class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-primary-50/30': selectable && isSelected(row) }"
        >
          <td v-if="selectable" class="py-3 w-10">
            <input
              type="checkbox"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              :checked="isSelected(row)"
              @change="toggleRow(row)"
            />
          </td>
          <td
            v-for="col in columns"
            :key="col.key"
            :class="['py-3 text-sm', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-gray-900']"
          >
            <slot name="cell" :column="col" :row="row">
              {{ row[col.key] ?? '-' }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
  sortKey?: string
}

const props = defineProps<{
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyText?: string
  selectable?: boolean
  selected?: number[]
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  'update:selected': [ids: number[]]
  'sort-change': [payload: { sortBy: string; sortDir: 'asc' | 'desc' }]
}>()

defineSlots<{
  cell(props: { column: Column; row: any }): any
  empty(): any
}>()

const allSelected = computed(() => {
  if (!props.data.length) return false
  return props.data.every(r => isSelected(r))
})

const partialSelected = computed(() => {
  if (!props.data.length) return false
  const some = props.data.some(r => isSelected(r))
  return some && !allSelected.value
})

function isSelected(row: any): boolean {
  return props.selected?.includes(row.id) ?? false
}

function toggleAll() {
  if (allSelected.value) {
    const keep = (props.selected ?? []).filter(id => !props.data.some(r => r.id === id))
    emit('update:selected', keep)
  } else {
    const existing = new Set(props.selected ?? [])
    for (const r of props.data) existing.add(r.id)
    emit('update:selected', [...existing])
  }
}

function toggleRow(row: any) {
  const current = new Set(props.selected ?? [])
  if (current.has(row.id)) current.delete(row.id)
  else current.add(row.id)
  emit('update:selected', [...current])
}

function handleSort(col: Column) {
  if (!col.sortKey) return
  const key = col.sortKey
  if (props.sortBy === key) {
    emit('sort-change', { sortBy: key, sortDir: props.sortDir === 'asc' ? 'desc' : 'asc' })
  } else {
    emit('sort-change', { sortBy: key, sortDir: 'asc' })
  }
}
</script>
