<template>
  <div class="bg-white rounded-xl border border-gray-100 p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{{ title }}</span>
      <div v-if="icon" class="w-7 h-7 rounded-lg flex items-center justify-center" :class="iconBgClass">
        <i :class="[icon, iconColorClass, 'text-xs']" />
      </div>
    </div>
    <div class="text-2xl font-bold text-gray-900">
      <slot name="value">{{ value }}</slot>
    </div>
    <div v-if="$slots.footer" class="mt-1">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  value?: string | number
  icon?: string
  color?: 'gray' | 'emerald' | 'amber' | 'red' | 'blue'
}>(), {
  color: 'gray'
})

const colorMap: Record<string, { bg: string; icon: string }> = {
  gray: { bg: 'bg-gray-100', icon: 'text-gray-500' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
  red: { bg: 'bg-red-50', icon: 'text-red-500' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500' },
}

const iconBgClass = computed(() => colorMap[props.color]?.bg || colorMap.gray.bg)
const iconColorClass = computed(() => colorMap[props.color]?.icon || colorMap.gray.icon)
</script>
