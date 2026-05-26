<template>
  <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
    <p class="text-sm text-gray-400">共 {{ total }} 条记录</p>
    <div class="flex items-center gap-2">
      <button
        class="px-3.5 py-2 text-sm border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        :disabled="currentPage <= 1"
        @click="go(currentPage - 1)"
      >上一页</button>
      <span class="text-sm text-gray-500 min-w-16 text-center">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="px-3.5 py-2 text-sm border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        :disabled="currentPage >= totalPages"
        @click="go(currentPage + 1)"
      >下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function go(page: number) {
  if (page < 1 || page > totalPages.value) return
  emit('change', page)
}
</script>
