<template>
  <div class="page-padding">
    <BasePageHeader title="客户对账单" />

    <!-- Filter -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">客户</label>
          <select v-model="customerId" class="block w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
            <option value="">全部客户</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">开始日期</label>
          <input v-model="dateFrom" type="date" class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">结束日期</label>
          <input v-model="dateTo" type="date" class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
        </div>
        <button class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" @click="fetchData">查询</button>
        <button class="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors" @click="resetFilters">重置</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Content -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="销售总额" :value="`¥${stats.totalSales.toFixed(2)}`" icon="ri-coin-line" color="blue" />
        <StatCard title="已收款" :value="`¥${stats.totalPaid.toFixed(2)}`" icon="ri-checkbox-circle-line" color="emerald" />
        <StatCard title="未收款" :value="`¥${(stats.totalSales - stats.totalPaid).toFixed(2)}`" icon="ri-time-line" color="red" />
      </div>

      <BaseCard>
        <BaseTable
          :columns="[
            { key: 'created_at', label: '日期' },
            { key: 'order_no', label: '单号' },
            { key: 'customer_name', label: '客户' },
            { key: 'total_amount', label: '销售金额', align: 'right' },
            { key: 'paid_amount', label: '已收款', align: 'right' },
            { key: 'due_amount', label: '未收款', align: 'right' },
            { key: 'status', label: '状态' }
          ]"
          :data="list"
          :loading="false"
          empty-text="暂无数据"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'order_no'">
              <span class="font-medium text-gray-900">{{ row.order_no }}</span>
            </template>
            <template v-else-if="column.key === 'created_at'">
              <span class="text-gray-500">{{ row.created_at?.slice(0, 10) }}</span>
            </template>
            <template v-else-if="column.key === 'customer_name'">
              {{ row.customer_name || '-' }}
            </template>
            <template v-else-if="column.key === 'paid_amount'">
              <span class="text-green-600 font-medium">¥{{ (row.paid_amount || 0).toFixed(2) }}</span>
            </template>
            <template v-else-if="column.key === 'due_amount'">
              <span class="text-red-600 font-medium">¥{{ ((row.total_amount || 0) - (row.paid_amount || 0)).toFixed(2) }}</span>
            </template>
            <template v-else-if="column.key === 'total_amount'">
              ¥{{ (row.total_amount || 0).toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'status'">
              <StatusBadge :status="row.status || ''" />
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
import { fetchSalesOrders } from '@/api'
import { fetchCustomers } from '@/api'
import type { Customer } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const customers = ref<Customer[]>([])
const list = ref<any[]>([])
const loading = ref(false)
const customerId = ref<number | ''>('')
const dateFrom = ref('')
const dateTo = ref('')

const stats = reactive({ totalSales: 0, totalPaid: 0 })

function resetFilters() {
  customerId.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  fetchData()
}

async function fetchData() {
  loading.value = true
  const res = await fetchSalesOrders({
    customer_id: customerId.value || undefined,
    status: 'completed'
  })
  if (res.data) {
    let filtered = res.data
    if (dateFrom.value) filtered = filtered.filter(o => o.created_at >= dateFrom.value)
    if (dateTo.value) filtered = filtered.filter(o => o.created_at.slice(0, 10) <= dateTo.value)
    list.value = filtered
    stats.totalSales = filtered.reduce((s, o) => s + (o.total_amount || 0), 0)
    stats.totalPaid = filtered.reduce((s, o) => s + (o.paid_amount || 0), 0)
  }
  loading.value = false
}

onMounted(async () => {
  const cRes = await fetchCustomers({})
  if (cRes.data) customers.value = cRes.data
  fetchData()
})
</script>
