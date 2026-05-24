<template>
  <div>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-xl font-bold text-gray-900">仪表盘</h1>
          <p class="text-sm text-gray-400 mt-1">{{ currentDate }}</p>
        </div>
        <router-link to="/sales/quick" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
          </svg>
          快速开单
        </router-link>
      </div>
      <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
        <i class="ri-calendar-line text-gray-400 text-sm"></i>
        <select v-model="selectedPeriod" class="text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-0 py-0 cursor-pointer">
          <option value="thisMonth">本月</option>
          <option value="lastMonth">上月</option>
          <option value="thisYear">本年</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <!-- 本月销售额 -->
        <div class="bg-white rounded-xl border border-gray-100 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">本月销售额</span>
            <div class="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <i class="ri-handbag-line text-emerald-500 text-xs"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">¥{{ monthlySales.toLocaleString() }}</div>
          <div class="flex items-center gap-1">
            <span :class="salesChange >= 0 ? 'text-green-600' : 'text-red-500'" class="text-xs font-medium inline-flex items-center gap-0.5">
              <i :class="salesChange >= 0 ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"></i>
              {{ Math.abs(salesChange) }}%
            </span>
            <span class="text-xs text-gray-400">较上月</span>
          </div>
          <div ref="spark2Ref" class="mt-1 h-9 w-full" />
        </div>
        <!-- 库存周转率 -->
        <div class="bg-white rounded-xl border border-gray-100 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">库存周转率</span>
            <div class="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <i class="ri-refresh-line text-amber-500 text-xs"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">
            {{ turnoverRate }}<span class="text-sm font-normal text-gray-400 ml-0.5">x</span>
          </div>
          <div class="text-xs text-gray-400">本月销售成本 / 平均库存</div>
        </div>
        <!-- 低库存预警 -->
        <div class="bg-white rounded-xl border border-gray-100 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">低库存预警</span>
            <div class="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
              <i class="ri-alert-line text-red-500 text-xs"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ lowStockCount }}</div>
          <div :class="lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'" class="text-xs">
            {{ lowStockCount > 0 ? '需及时补货' : '库存充足' }}
          </div>
        </div>
      </div>

      <!-- Row 2: Trend + Orders -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- Trend Chart -->
        <div class="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">销售趋势</h3>
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1.5 text-xs text-gray-400">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>销售额
              </span>
            </div>
          </div>
          <div ref="trendRef" class="h-72 w-full" />
          <div v-if="trendData.length === 0" class="h-72 flex items-center justify-center text-sm text-gray-400 -mt-72">
            暂无趋势数据
          </div>
        </div>
        <!-- Recent Orders -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">最近订单</h3>
            <router-link to="/sales" class="text-xs text-gray-600 hover:text-gray-900 font-medium">查看全部</router-link>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="order in recentOrders" :key="order.id" class="flex items-center justify-between py-2.5">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 truncate">{{ order.order_no }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  <span class="text-emerald-500 font-medium">销售</span>
                  <span class="mx-1">·</span>
                  {{ order.counterparty }}
                </p>
              </div>
              <div class="text-right flex-shrink-0 ml-3">
                <p class="text-xs font-semibold text-gray-900 mb-1">¥{{ order.total_amount.toLocaleString() }}</p>
                <span :class="statusBadge(order.status)" class="inline-block text-xs px-1.5 py-0.5 rounded font-medium">{{ statusLabel(order.status) }}</span>
              </div>
            </div>
            <div v-if="recentOrders.length === 0" class="py-10 text-center text-sm text-gray-400">暂无订单数据</div>
          </div>
        </div>
      </div>

      <!-- Row 3: Pie + Pending -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Inventory Pie -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">库存分类分布</h3>
          <div ref="pieRef" class="h-52 w-full" />
          <div v-if="inventoryByCategory.length === 0" class="h-52 flex items-center justify-center text-sm text-gray-400 -mt-52">
            暂无数据
          </div>
        </div>
        <!-- Pending / Alerts -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">待处理</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3.5 bg-gray-100 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900">待确认销售单</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ pendingSO }} 单待处理</p>
              </div>
              <div class="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                <span class="text-sm font-bold text-gray-700">{{ pendingSO }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between p-3.5 bg-red-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900">低库存商品</p>
                <p class="text-xs text-gray-500 mt-0.5">低于安全库存</p>
              </div>
              <div class="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <span class="text-sm font-bold text-red-500">{{ lowStockCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
// ECharts 按需引入（减少约 800KB）
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])
import {
  fetchDashboardKPIs,
  fetchMonthlyTrend,
  fetchInventoryByCategory,
  fetchInventoryTurnoverRate,
  fetchRecentOrders
} from '@/api/reports'

const loading = ref(true)
const selectedPeriod = ref('thisMonth')

// KPI data
const monthlySales = ref(0)
const salesChange = ref(0)
const turnoverRate = ref(0)
const lowStockCount = ref(0)
const pendingSO = ref(0)

// Chart data
const trendData = ref<any[]>([])
const inventoryByCategory = ref<any[]>([])
const recentOrders = ref<any[]>([])

// ECharts container refs
const trendRef = ref<HTMLDivElement>()
const pieRef = ref<HTMLDivElement>()
const spark2Ref = ref<HTMLDivElement>()

// ECharts instances (kept alive, not reactive)
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let spark2: echarts.ECharts | null = null

const currentDate = computed(() => {
  const now = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`
})

const statusLabels: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消'
}

function statusLabel(s: string): string {
  return statusLabels[s] || s
}

function statusBadge(s: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-500',
    confirmed: 'bg-primary-100 text-primary-700',
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-500'
  }
  return colors[s] || 'bg-gray-100 text-gray-500'
}

/** Calculate month-over-month change, falling back if current month is zero. */
function calcChange(data: number[]): number {
  if (data.length < 2) return 0
  let cur = data[data.length - 1]
  let prev = data[data.length - 2]
  if (cur === 0 && data.length >= 3) {
    cur = prev
    prev = data[data.length - 3]
  }
  return prev > 0 ? Math.round((cur - prev) / prev * 100) : 0
}

function initChart(el: HTMLElement): echarts.ECharts {
  return echarts.init(el)
}

function renderSparkline(chart: echarts.ECharts, data: number[], color: string) {
  chart.setOption({
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: data.map((_, i) => i) },
    yAxis: { show: false, min: 'dataMin' },
    series: [{
      type: 'line',
      data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '30' },
          { offset: 1, color: color + '05' }
        ])
      }
    }],
    animation: false
  })
}

function renderTrendChart(chart: echarts.ECharts, data: any[]) {
  const months = data.map((d: any) => d.month.slice(5))
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: any) => '¥' + Number(v).toLocaleString()
    },
    legend: { show: false },
    grid: { left: 50, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + 'w' : String(v)
      }
    },
    series: [
      {
        name: '销售',
        type: 'line',
        data: data.map((d: any) => d.sales_amount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#34d399', width: 2 },
        itemStyle: { color: '#34d399' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#34d39930' },
            { offset: 1, color: '#34d39905' }
          ])
        }
      }
    ]
  })
}

function renderPieChart(chart: echarts.ECharts, data: any[]) {
  const colors = ['#111827', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}件 ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['45%', '68%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 12, fontWeight: 'bold' },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0,0,0,0.15)'
        }
      },
      labelLine: { show: false },
      data: data.map((d: any, i: number) => ({
        name: d.category_name,
        value: d.quantity,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }],
    animation: true
  })
}

function renderAllCharts() {
  if (trendRef.value && trendData.value.length > 0) {
    trendChart = trendChart || initChart(trendRef.value)
    renderTrendChart(trendChart, trendData.value)
  }
  if (pieRef.value && inventoryByCategory.value.length > 0) {
    pieChart = pieChart || initChart(pieRef.value)
    renderPieChart(pieChart, inventoryByCategory.value)
  }
  if (spark2Ref.value && trendData.value.length > 0) {
    spark2 = spark2 || initChart(spark2Ref.value)
    renderSparkline(spark2, trendData.value.map((d: any) => d.sales_amount), '#34d399')
  }
}

let resizeHandler: (() => void) | null = null

async function loadData() {
  loading.value = true
  try {
    const [
      kpiRes, trendRes,
      inventoryRes, turnoverRes, ordersRes
    ] = await Promise.all([
      fetchDashboardKPIs(),
      fetchMonthlyTrend(),
      fetchInventoryByCategory(),
      fetchInventoryTurnoverRate(),
      fetchRecentOrders(8)
    ])

    if (kpiRes.data) {
      monthlySales.value = kpiRes.data.month_sales_amount
      lowStockCount.value = kpiRes.data.low_stock_count
      pendingSO.value = kpiRes.data.pending_sales_orders
    }

    if (turnoverRes.data) {
      turnoverRate.value = turnoverRes.data.rate
    }

    if (trendRes.data && trendRes.data.length > 0) {
      trendData.value = trendRes.data
      salesChange.value = calcChange(trendRes.data.map((d: any) => d.sales_amount))
    }

    if (inventoryRes.data) {
      inventoryByCategory.value = inventoryRes.data
    }

    recentOrders.value = ordersRes.data ?? []

    await nextTick()
    renderAllCharts()
  } catch (e) {
    console.error('仪表盘数据加载失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
  resizeHandler = () => {
    trendChart?.resize()
    pieChart?.resize()
    spark2?.resize()
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  trendChart?.dispose()
  pieChart?.dispose()
  spark2?.dispose()
})
</script>
