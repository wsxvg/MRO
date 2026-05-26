<template>
  <div class="page-padding">
    <BasePageHeader title="库存报表" />

    <!-- Filter -->
    <div class="surface p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">仓库</label>
          <select v-model="warehouseId" class="block w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
            <option value="">全部仓库</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <button class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" @click="fetchData">查询</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-for="n in 4" :key="n" class="surface-strong p-4 animate-pulse">
          <div class="h-3 w-24 bg-gray-100 rounded mb-4"></div>
          <div class="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div class="surface-strong p-5 animate-pulse">
        <div class="h-4 w-32 bg-gray-100 rounded mb-4"></div>
        <div class="space-y-3">
          <div v-for="n in 6" :key="n" class="h-10 bg-gray-50 rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="库存商品数" :value="String(stats.productCount)" icon="ri-stack-line" color="gray" />
        <StatCard title="库存总量" :value="String(stats.totalQuantity)" icon="ri-cube-line" color="blue" />
        <StatCard title="库存总价值" :value="`¥${stats.totalValue.toFixed(2)}`" icon="ri-funds-box-line" color="emerald" />
        <StatCard title="低库存商品" :value="String(stats.lowStockCount)" icon="ri-alert-line" color="red" />
      </div>

      <BaseCard>
        <BaseTable
          :columns="[
            { key: 'product_name', label: '商品名称' },
            { key: 'product_sku', label: 'SKU' },
            { key: 'warehouse_name', label: '仓库' },
            { key: 'quantity', label: '库存数量', align: 'right' },
            { key: 'min_stock', label: '最低库存', align: 'right' },
            { key: 'cost_price', label: '成本价', align: 'right' },
            { key: 'stock_value', label: '库存价值', align: 'right' },
            { key: 'status', label: '状态' }
          ]"
          :data="list"
          :loading="false"
          empty-text="暂无数据"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'product_name'">
              <span class="font-medium text-gray-900">{{ row.product_name }}</span>
            </template>
            <template v-else-if="column.key === 'cost_price' || column.key === 'stock_value'">
              ¥{{ row[column.key].toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'status'">
              <StatusBadge v-if="row.min_stock > 0 && row.quantity <= row.min_stock" status="cancelled" :labels="{ cancelled: '偏低' }" />
              <StatusBadge v-else status="completed" :labels="{ completed: '正常' }" />
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { fetchStockReport } from '@/api'
import { fetchWarehouses } from '@/api'
import type { Warehouse } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const warehouses = ref<Warehouse[]>([])
const list = ref<any[]>([])
const loading = ref(false)
const warehouseId = ref<number | ''>('')

const stats = reactive({ productCount: 0, totalQuantity: 0, totalValue: 0, lowStockCount: 0 })

async function fetchData() {
  loading.value = true
  const res = await fetchStockReport({ warehouse_id: warehouseId.value || undefined })
  if (res.data) {
    list.value = res.data
    stats.productCount = res.data.length
    stats.totalQuantity = res.data.reduce((s, r) => s + r.quantity, 0)
    stats.totalValue = res.data.reduce((s, r) => s + r.stock_value, 0)
    stats.lowStockCount = res.data.filter(r => r.min_stock > 0 && r.quantity <= r.min_stock).length
  }
  loading.value = false
}

onMounted(async () => {
  const wRes = await fetchWarehouses()
  if (wRes.data) warehouses.value = wRes.data
  fetchData()
})
</script>
