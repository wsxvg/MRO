<template>
  <div class="page-padding">
    <BasePageHeader title="库存流水" to="/settings/warehouses" />

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[160px]">
          <label class="block text-xs text-gray-500 mb-1">仓库</label>
          <select
            v-model="filterWarehouseId"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            @change="page = 1; fetchData()"
          >
            <option value="">全部仓库</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div class="min-w-[160px]">
          <label class="block text-xs text-gray-500 mb-1">开始日期</label>
          <input
            v-model="dateFrom"
            type="date"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            @change="page = 1; fetchData()"
          />
        </div>
        <div class="min-w-[160px]">
          <label class="block text-xs text-gray-500 mb-1">结束日期</label>
          <input
            v-model="dateTo"
            type="date"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            @change="page = 1; fetchData()"
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
          { key: 'created_at', label: '时间' },
          { key: 'product_name', label: '商品' },
          { key: 'warehouse_name', label: '仓库' },
          { key: 'type_label', label: '类型' },
          { key: 'quantity', label: '数量', align: 'right' },
          { key: 'remark', label: '备注' }
        ]"
        :data="list"
        :loading="false"
        empty-text="暂无流水记录"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'created_at'">
            <span class="text-gray-600 text-sm">{{ formatTime(row.created_at) }}</span>
          </template>
          <template v-else-if="column.key === 'product_name'">
            <span class="font-medium text-gray-900">{{ row.product_name || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'type_label'">
            <span
              class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
              :class="typeBadgeClass(row.type)"
            >{{ typeLabel(row.type) }}</span>
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span :class="row.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
              {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
            </span>
          </template>
          <template v-else>
            {{ row[column.key] ?? '-' }}
          </template>
        </template>
      </BaseTable>

      <BasePagination :current-page="page" :total="total" :page-size="pageSize" @change="page = $event; fetchData()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchStockTransactions, fetchWarehouses } from '@/api'
import type { StockTransaction, Warehouse } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseTable from '@/components/BaseTable.vue'
import BasePagination from '@/components/BasePagination.vue'

const list = ref<StockTransaction[]>([])
const warehouses = ref<Warehouse[]>([])
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const pageSize = 15
const filterWarehouseId = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const typeLabels: Record<string, string> = {
  stock_in: '入库',
  sale_out: '销售出库',
  sale_return: '销售退货',
  transfer_in: '调拨入库',
  transfer_out: '调拨出库',
  adjustment: '盘点调整',
}

function typeLabel(type: string): string {
  return typeLabels[type] || type
}

function typeBadgeClass(type: string): string {
  if (type === 'stock_in' || type === 'sale_return' || type === 'transfer_in') {
    return 'bg-green-50 text-green-700'
  }
  if (type === 'sale_out' || type === 'transfer_out') {
    return 'bg-red-50 text-red-700'
  }
  return 'bg-gray-50 text-gray-700'
}

function formatTime(ts: string): string {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchData() {
  loading.value = true
  const res = await fetchStockTransactions({
    warehouse_id: filterWarehouseId.value ? Number(filterWarehouseId.value) : undefined,
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value ? dateTo.value + ' 23:59:59' : undefined,
    page: page.value,
    limit: pageSize,
  })
  if (res.data) {
    list.value = res.data
    total.value = res.count ?? 0
  }
  loading.value = false
}

onMounted(async () => {
  const wRes = await fetchWarehouses()
  if (wRes.data) warehouses.value = wRes.data
  fetchData()
})
</script>
