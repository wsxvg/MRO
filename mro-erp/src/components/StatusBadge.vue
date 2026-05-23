<template>
  <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium" :class="bgClass">
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  status: string
  labels?: Record<string, string>
}>(), {
  labels: () => ({})
})

const defaultLabels: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
  returned: '已退货',
  active: '启用',
  inactive: '停用'
}

const label = computed(() => {
  return props.labels[props.status] || defaultLabels[props.status] || props.status
})

const variantMap: Record<string, { bg: string; dot: string }> = {
  draft: { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  confirmed: { bg: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
  completed: { bg: 'bg-green-50 text-green-600', dot: 'bg-green-400' },
  cancelled: { bg: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
  returned: { bg: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
  active: { bg: 'bg-green-50 text-green-600', dot: 'bg-green-400' },
  inactive: { bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
}

const bgClass = computed(() => variantMap[props.status]?.bg || 'bg-gray-100 text-gray-600')
const dotClass = computed(() => variantMap[props.status]?.dot || 'bg-gray-400')
</script>
