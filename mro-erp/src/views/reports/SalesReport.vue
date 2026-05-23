<template>
  <div class="page-padding">
    <BasePageHeader title="销售报表" />

    <!-- Filter -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">开始日期</label>
          <input v-model="dateFrom" type="date" class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">结束日期</label>
          <input v-model="dateTo" type="date" class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
        </div>
        <button class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" @click="fetchData">查询</button>
        <button class="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors" @click="resetFilters">本月</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Content -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="销售总额" :value="`¥${summary.totalAmount.toFixed(2)}`" icon="ri-coin-line" color="blue" />
        <StatCard title="订单数量" :value="String(summary.totalOrders)" icon="ri-shopping-cart-line" color="gray" />
        <StatCard title="日均销售额" :value="`¥${summary.dailyAverage.toFixed(2)}`" icon="ri-line-chart-line" color="emerald" />
      </div>

      <BaseCard>
        <template #header>
          <h3 class="text-sm font-semibold text-gray-900">每日销售明细</h3>
        </template>
        <BaseTable
          :columns="[
            { key: 'date', label: '日期' },
            { key: 'order_count', label: '订单数', align: 'right' },
            { key: 'total_amount', label: '销售金额', align: 'right' }
          ]"
          :data="dailyData"
          :loading="false"
          empty-text="暂无数据"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'total_amount'">¥{{ row.total_amount.toFixed(2) }}</template>
            <template v-else>{{ row[column.key] ?? '-' }}</template>
          </template>
        </BaseTable>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { fetchSalesSummary } from '@/api'
import BasePageHeader from '@/components/BasePageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'

const loading = ref(false)
const dateFrom = ref('')
const dateTo = ref('')
const dailyData = ref<{ date: string; total_amount: number; order_count: number }[]>([])
const summary = reactive({ totalAmount: 0, totalOrders: 0, dailyAverage: 0 })

function resetFilters() {
  const now = new Date()
  dateFrom.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  dateTo.value = now.toISOString().slice(0, 10)
  fetchData()
}

async function fetchData() {
  loading.value = true
  const res = await fetchSalesSummary({
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value ? dateTo.value + ' 23:59:59' : undefined
  })
  if (res.data) {
    dailyData.value = res.data
    summary.totalAmount = res.data.reduce((s, r) => s + r.total_amount, 0)
    summary.totalOrders = res.data.reduce((s, r) => s + r.order_count, 0)
    summary.dailyAverage = res.data.length > 0 ? summary.totalAmount / res.data.length : 0
  }
  loading.value = false
}

onMounted(resetFilters)
</script>
