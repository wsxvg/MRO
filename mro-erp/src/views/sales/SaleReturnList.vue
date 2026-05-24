<template>
  <div class="page-padding">
    <BasePageHeader title="销售退货">
      <router-link to="/sales-returns/new" class="btn-primary text-sm">新增退货单</router-link>
    </BasePageHeader>

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
        :columns="columns"
        :data="list"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchSalesReturns } from '@/api'
import type { SalesReturnOrder } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const columns = [
  { key: 'order_no', label: '单号' },
  { key: 'customer_name', label: '客户' },
  { key: 'warehouse_name', label: '仓库' },
  { key: 'total_amount', label: '金额', align: 'right' as const },
  { key: 'status', label: '状态' },
  { key: 'created_at', label: '日期' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const list = ref<SalesReturnOrder[]>([])
const loading = ref(true)
const statusFilter = ref('')

function onFilterChange(payload: { key: string; value: string }) {
  statusFilter.value = payload.value
  fetchData()
}

async function fetchData() {
  loading.value = true
  const res = await fetchSalesReturns({ status: statusFilter.value || undefined })
  if (res.data) list.value = res.data
  loading.value = false
}

onMounted(fetchData)
</script>
