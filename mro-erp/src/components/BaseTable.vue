<template>
  <div class="overflow-x-auto">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="data.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-sm text-gray-400">{{ emptyText }}</p>
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead>
        <tr class="text-left">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'text-xs font-medium text-gray-400 uppercase tracking-wider pb-3',
              col.align === 'right' ? 'text-right' : '',
              col.align === 'center' ? 'text-center' : ''
            ]"
            :style="col.width ? { width: col.width } : undefined"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIdx) in data"
          :key="row.id || rowIdx"
          class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
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
interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

defineProps<{
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyText?: string
}>()

defineSlots<{
  cell(props: { column: Column; row: any }): any
}>()
</script>
