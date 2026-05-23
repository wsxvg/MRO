<template>
  <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
    <div class="flex flex-wrap items-end gap-4">
      <!-- Search -->
      <div v-if="showSearch" class="min-w-[200px] flex-1">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          type="text"
          class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          :placeholder="searchPlaceholder"
        />
      </div>

      <!-- Filter selects -->
      <div v-for="filter in filters" :key="filter.key" class="w-40">
        <select
          :value="filter.value"
          @change="$emit('filter-change', { key: filter.key, value: ($event.target as HTMLSelectElement).value })"
          class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">{{ filter.label }}</option>
          <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Default slot for extra buttons -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface FilterOption {
  value: string
  label: string
}

interface FilterItem {
  key: string
  label: string
  value: string
  options: FilterOption[]
}

defineProps<{
  modelValue?: string
  showSearch?: boolean
  searchPlaceholder?: string
  filters?: FilterItem[]
}>()

defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'filter-change', payload: { key: string; value: string }): void
}>()
</script>
