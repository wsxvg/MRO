<template>
  <div class="space-y-3 animate-pulse">
    <div v-if="showSearch" class="h-10 bg-gray-50 rounded-xl w-64" />
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-4 px-5 py-3 border-b border-gray-100">
        <div v-for="c in columns" :key="c" class="h-3 bg-gray-100 rounded" :style="{ width: randomWidth() }" />
      </div>
      <!-- Rows -->
      <div v-for="r in rows" :key="r" class="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
        <div v-for="c in columns" :key="c" class="h-3 bg-gray-100 rounded" :style="{ width: randomWidth() }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  columns?: number
  rows?: number
  showSearch?: boolean
}>(), {
  columns: 5,
  rows: 5,
  showSearch: false,
})

function randomWidth() {
  const widths = ['56px', '72px', '88px', '104px', '120px', '140px']
  return widths[Math.floor(Math.random() * widths.length)]
}
</script>
