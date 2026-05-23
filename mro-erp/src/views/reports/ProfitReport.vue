<template>
  <div class="page-padding">
    <BasePageHeader title="利润报表" />

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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="销售收入" :value="`¥${profitStats.salesAmount.toFixed(2)}`" icon="ri-coin-line" color="blue" />
        <StatCard title="销售成本" :value="`¥${profitStats.costAmount.toFixed(2)}`" icon="ri-money-dollar-circle-line" color="red" />
        <StatCard title="毛利" :value="`¥${profitStats.grossProfit.toFixed(2)}`" icon="ri-funds-line" color="emerald" />
        <StatCard title="毛利率" :value="`${profitStats.marginRate}%`" icon="ri-percent-line" color="amber" />
      </div>

      <BaseCard>
        <template #header>
          <h3 class="text-sm font-semibold text-gray-900">已完成销售单利润明细</h3>
        </template>
        <BaseTable
          :columns="[
            { key: 'order_no', label: '单号' },
            { key: 'customer_name', label: '客户' },
            { key: 'created_at', label: '日期' },
            { key: 'total_amount', label: '销售金额', align: 'right' },
            { key: 'cost_amount', label: '成本金额', align: 'right' },
            { key: 'gross_profit', label: '毛利', align: 'right' },
            { key: 'margin_rate', label: '毛利率', align: 'right' }
          ]"
          :data="profitData"
          :loading="false"
          empty-text="暂无数据"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'order_no'">
              <span class="font-medium text-gray-900">{{ row.order_no }}</span>
            </template>
            <template v-else-if="column.key === 'customer_name'">
              {{ row.customer_name || '-' }}
            </template>
            <template v-else-if="column.key === 'created_at'">
              <span class="text-gray-500">{{ row.created_at?.slice(0, 10) }}</span>
            </template>
            <template v-else-if="column.key === 'gross_profit'">
              <span class="text-green-600 font-medium">¥{{ row.gross_profit.toFixed(2) }}</span>
            </template>
            <template v-else-if="column.key === 'total_amount' || column.key === 'cost_amount'">
              ¥{{ row[column.key].toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'margin_rate'">
              {{ row.margin_rate }}%
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
import { fetchSalesOrders, fetchSalesOrderItems } from '@/api'
import type { SalesOrderItem } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'

const loading = ref(false)
const dateFrom = ref('')
const dateTo = ref('')
const profitData = ref<any[]>([])
const profitStats = reactive({ salesAmount: 0, costAmount: 0, grossProfit: 0, marginRate: '0.00' })

function resetFilters() {
  const now = new Date()
  dateFrom.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  dateTo.value = now.toISOString().slice(0, 10)
  fetchData()
}

async function fetchData() {
  loading.value = true
  const res = await fetchSalesOrders({ status: 'completed' })
  if (res.data) {
    let orders = res.data
    if (dateFrom.value) orders = orders.filter(o => o.created_at >= dateFrom.value)
    if (dateTo.value) orders = orders.filter(o => o.created_at.slice(0, 10) <= dateTo.value)

    const rows: any[] = []
    let totalSales = 0, totalCost = 0

    for (const order of orders) {
      const itemRes = await fetchSalesOrderItems(order.id)
      const items = itemRes.data || []
      const orderSales = order.total_amount || 0
      const orderCost = items.reduce((s, i: SalesOrderItem) => s + (i.cost_price * i.quantity), 0)
      const grossProfit = orderSales - orderCost
      const marginRate = orderSales > 0 ? ((grossProfit / orderSales) * 100).toFixed(1) : '0.0'

      rows.push({
        id: order.id,
        order_no: order.order_no,
        customer_name: order.customer_name,
        created_at: order.created_at,
        total_amount: orderSales,
        cost_amount: orderCost,
        gross_profit: grossProfit,
        margin_rate: marginRate
      })

      totalSales += orderSales
      totalCost += orderCost
    }

    profitData.value = rows
    profitStats.salesAmount = totalSales
    profitStats.costAmount = totalCost
    profitStats.grossProfit = totalSales - totalCost
    profitStats.marginRate = totalSales > 0 ? ((totalSales - totalCost) / totalSales * 100).toFixed(1) : '0.00'
  }
  loading.value = false
}

onMounted(resetFilters)
</script>
