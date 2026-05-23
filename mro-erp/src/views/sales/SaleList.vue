<template>
  <div class="page-padding">
    <BasePageHeader title="销售管理">
      <template v-if="activeTab === 'orders'">
        <div class="flex gap-3">
          <router-link to="/sales/quick" class="btn-secondary text-sm">快速销售</router-link>
          <router-link to="/sales/new" class="btn-primary text-sm">新增销售单</router-link>
        </div>
      </template>
      <router-link v-else to="/sales-returns/new" class="btn-primary text-sm">新增退货单</router-link>
    </BasePageHeader>

    <!-- Tabs -->
    <div class="flex gap-1 mb-4 border-b border-gray-200">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        @click="activeTab = tab.key; switchTab()"
      >{{ tab.label }}</button>
    </div>

    <!-- 销售单 Tab -->
    <template v-if="activeTab === 'orders'">
      <FilterBar
        :filters="[{ key: 'status', label: '全部状态', value: statusFilter, options: [
          { value: '', label: '全部状态' },
          { value: 'draft', label: '草稿' },
          { value: 'completed', label: '已完成' },
          { value: 'cancelled', label: '已取消' }
        ]}]"
        @filter-change="onFilterChange"
      />
      <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
      <BaseCard v-else>
        <BaseTable
          :columns="orderColumns"
          :data="list"
          empty-text="暂无销售单"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'status'">
              <StatusBadge :status="row.status" />
            </template>
            <template v-else-if="column.key === 'total_amount' || column.key === 'paid_amount'">
              ¥{{ (row[column.key] || 0).toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <router-link :to="`/sales/${row.id}`" class="text-primary-600 hover:text-primary-700 text-sm">查看</router-link>
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
      </BaseCard>
    </template>

    <!-- 退货记录 Tab -->
    <template v-else>
      <FilterBar
        :filters="[{ key: 'status', label: '全部状态', value: returnStatusFilter, options: [
          { value: '', label: '全部状态' },
          { value: 'draft', label: '草稿' },
          { value: 'completed', label: '已完成' },
          { value: 'cancelled', label: '已取消' }
        ]}]"
        @filter-change="onReturnFilterChange"
      />
      <div v-if="returnLoading" class="text-center py-12 text-gray-500">加载中...</div>
      <BaseCard v-else>
        <BaseTable
          :columns="returnColumns"
          :data="returnList"
          empty-text="暂无退货单"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'status'">
              <StatusBadge :status="row.status" />
            </template>
            <template v-else-if="column.key === 'total_amount'">
              ¥{{ (row.total_amount || 0).toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <router-link :to="`/sales-returns/${row.id}`" class="text-primary-600 hover:text-primary-700 text-sm">查看</router-link>
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
      </BaseCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchSalesOrders, fetchSalesReturns } from '@/api'
import type { SalesOrder, SalesReturnOrder } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const tabs = [
  { key: 'orders', label: '销售单' },
  { key: 'returns', label: '退货记录' }
] as const
const activeTab = ref<'orders' | 'returns'>('orders')

// Sales orders state
const list = ref<SalesOrder[]>([])
const loading = ref(true)
const statusFilter = ref('draft')

const orderColumns = [
  { key: 'order_no', label: '单号' },
  { key: 'customer_name', label: '客户' },
  { key: 'warehouse_name', label: '仓库' },
  { key: 'total_amount', label: '金额', align: 'right' as const },
  { key: 'paid_amount', label: '已收款', align: 'right' as const },
  { key: 'status', label: '状态' },
  { key: 'created_at', label: '日期' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

// Sales returns state
const returnList = ref<SalesReturnOrder[]>([])
const returnLoading = ref(false)
const returnStatusFilter = ref('draft')
let returnFetched = false

const returnColumns = [
  { key: 'order_no', label: '单号' },
  { key: 'customer_name', label: '客户' },
  { key: 'warehouse_name', label: '仓库' },
  { key: 'total_amount', label: '金额', align: 'right' as const },
  { key: 'status', label: '状态' },
  { key: 'created_at', label: '日期' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

function switchTab() {
  if (activeTab.value === 'returns' && !returnFetched) {
    fetchReturnData()
  }
}

function onFilterChange(payload: { key: string; value: string }) {
  statusFilter.value = payload.value
  fetchData()
}

function onReturnFilterChange(payload: { key: string; value: string }) {
  returnStatusFilter.value = payload.value
  fetchReturnData()
}

async function fetchData() {
  loading.value = true
  const res = await fetchSalesOrders({ status: statusFilter.value || undefined })
  if (res.data) list.value = res.data
  loading.value = false
}

async function fetchReturnData() {
  returnLoading.value = true
  returnFetched = true
  const res = await fetchSalesReturns({ status: returnStatusFilter.value || undefined })
  if (res.data) returnList.value = res.data
  returnLoading.value = false
}

onMounted(fetchData)
</script>
