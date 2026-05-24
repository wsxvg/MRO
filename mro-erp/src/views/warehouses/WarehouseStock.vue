<template>
  <div class="page-padding">
    <BasePageHeader :title="`${warehouseName} - 库存明细`" to="/settings/warehouses" />

    <!-- Search -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[200px] flex-1">
          <input
            v-model="search"
            type="text"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            placeholder="搜索商品名称/SKU..."
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Content -->
    <div v-else class="bg-white rounded-xl border border-gray-100 p-5">
      <BaseTable
        :columns="[
          { key: 'product_name', label: '商品名称' },
          { key: 'product_specification', label: '规格' },
          { key: 'quantity', label: '库存数量', align: 'right' },
          { key: 'min_stock', label: '最低库存', align: 'right' },
          { key: 'status', label: '状态' }
        ]"
        :data="list"
        :loading="false"
        empty-text="暂无库存记录"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'product_name'">
            <span class="font-medium text-gray-900">{{ row.product_name }}</span>
          </template>
          <template v-else-if="column.key === 'product_specification'">
            <span class="text-gray-600">{{ row.product_specification || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge v-if="row.min_stock != null && row.quantity < row.min_stock" status="cancelled" :labels="{ cancelled: '低库存' }" />
            <StatusBadge v-else status="completed" :labels="{ completed: '正常' }" />
          </template>
          <template v-else>
            {{ row[column.key] ?? '-' }}
          </template>
        </template>
      </BaseTable>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <p class="text-sm text-gray-400">共 {{ total }} 条</p>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="page--; fetchData()"
          >上一页</button>
          <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
          <button
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="page++; fetchData()"
          >下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchWarehouse, fetchStocks } from '@/api'
import type { Stock } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseTable from '@/components/BaseTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const warehouseId = Number(route.params.id)
const warehouseName = ref('')
const list = ref<Stock[]>([])
const search = ref('')
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const pageSize = 15

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

let timer: ReturnType<typeof setTimeout>
function onSearch() { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; fetchData() }, 300) }

async function fetchData() {
  loading.value = true
  const res = await fetchStocks({ warehouse_id: warehouseId, search: search.value, page: page.value, limit: pageSize })
  if (res.data) { list.value = res.data; total.value = res.count ?? 0 }
  loading.value = false
}

onMounted(async () => {
  const w = await fetchWarehouse(warehouseId)
  if (w.data) warehouseName.value = w.data.name
  fetchData()
})
</script>
