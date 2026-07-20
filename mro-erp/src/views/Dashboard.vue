<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900">仪表盘</h1>
          <p class="text-sm text-gray-400 mt-1">{{ currentDate }}</p>
        </div>
        <router-link to="/sales/quick" class="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
          </svg>
          销售商品
        </router-link>
      </div>
      <button @click="toggleAmounts" :title="showAmounts ? '隐藏金额' : '显示金额'" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer" :class="showAmounts ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'">
        {{ showAmounts ? '👁 可见' : '👁 隐藏' }}
      </button>
      <div class="flex items-center gap-2 surface px-3 py-1.5">
        <i class="ri-calendar-line text-gray-400 text-sm"></i>
        <select v-model="selectedPeriod" class="text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-0 py-0 cursor-pointer">
          <option value="thisMonth">本月</option>
          <option value="lastMonth">上月</option>
          <option value="thisYear">本年</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n" class="surface-strong p-4 animate-pulse">
          <div class="h-3 w-24 bg-gray-100 rounded mb-4"></div>
          <div class="h-8 w-28 bg-gray-200 rounded mb-3"></div>
          <div class="h-2 w-16 bg-gray-100 rounded"></div>
          <div class="mt-4 h-9 w-full bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="surface-strong p-5 lg:col-span-2 animate-pulse">
          <div class="h-4 w-28 bg-gray-100 rounded mb-4"></div>
          <div class="h-72 bg-gray-50 rounded-2xl"></div>
        </div>
        <div class="surface-strong p-5 animate-pulse">
          <div class="h-4 w-20 bg-gray-100 rounded mb-4"></div>
          <div class="space-y-3">
            <div class="h-16 bg-gray-50 rounded-xl"></div>
            <div class="h-16 bg-gray-50 rounded-xl"></div>
            <div class="h-16 bg-gray-50 rounded-xl"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="surface-strong p-5 animate-pulse">
          <div class="h-4 w-28 bg-gray-100 rounded mb-4"></div>
          <div class="h-52 bg-gray-50 rounded-2xl"></div>
        </div>
        <div class="surface-strong p-5 animate-pulse">
          <div class="h-4 w-20 bg-gray-100 rounded mb-4"></div>
          <div class="space-y-3">
            <div class="h-16 bg-gray-50 rounded-xl"></div>
            <div class="h-16 bg-gray-50 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Hero -->
      <div class="surface-strong p-5 rounded-2xl mb-6 flex items-center justify-between">
        <div>
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wide">本月销售额</div>
          <div class="text-3xl font-bold text-gray-900 mt-1">{{ maskMoney(monthlySales) }}</div>
          <div class="text-xs text-gray-400 mt-1">
            <span :class="salesChange >= 0 ? 'text-emerald-500' : 'text-red-500'">{{ salesChange >= 0 ? '↑' : '↓' }} {{ Math.abs(salesChange) }}%</span> 较上月
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="$router.push('/sales/quick')" class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 shadow-sm">⚡ 快速开单</button>
          <button @click="$router.push('/products')" class="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">🔍 查库存</button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div ref="kpiContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <!-- 库存周转率 -->
        <div class="surface-strong p-4 kpi-card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">库存周转率</span>
            <div class="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <i class="ri-refresh-line text-amber-500 text-xs"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">
            <span ref="turnoverValueRef">0</span><span class="text-sm font-normal text-gray-400 ml-0.5">x</span>
          </div>
          <div class="text-xs text-gray-400">{{ selectedPeriodLabel }}销售成本 / 平均库存</div>
        </div>
        <!-- 低库存预警 -->
        <div class="surface-strong p-4 kpi-card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">低库存预警</span>
            <div class="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
              <i class="ri-alert-line text-red-500 text-xs"></i>
            </div>
          </div>
          <div ref="lowStockValueRef" class="text-2xl font-bold text-gray-900 mb-1">0</div>
          <div :class="lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'" class="text-xs">
            {{ lowStockCount > 0 ? '需及时补货' : '库存充足' }}
          </div>
        </div>
        <!-- 未收款总额 -->
        <div class="surface-strong p-4 kpi-card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">未收款总额</span>
            <div class="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <i class="ri-money-cny-circle-line text-orange-500 text-xs"></i>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ maskMoney(totalDebt) }}</div>
          <div :class="totalDebt > 0 ? 'text-orange-500' : 'text-gray-400'" class="text-xs">
            {{ unpaidCustomers.length }} 个客户应收
          </div>
        </div>
      </div>

      <!-- Low Stock Alert -->
      <div v-if="lowStockItems.length > 0" class="bg-white rounded-xl border border-red-100 p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i class="ri-alert-line text-red-500"></i>
            <h3 class="text-sm font-semibold text-gray-900">低库存商品</h3>
          </div>
          <router-link to="/stock/in" class="text-xs text-primary-600 hover:text-primary-700 font-medium">
            一键进货 →
          </router-link>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div v-for="item in lowStockItems" :key="item.id"
            class="flex items-center justify-between py-2 px-3 bg-red-50/60 rounded-lg">
            <div>
              <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
              <span class="text-xs text-red-500 ml-2">库存 {{ item.stock }} / 安全 {{ item.min_stock }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Trend + Orders -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- Trend Chart -->
        <div class="surface-strong p-5 lg:col-span-2">
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
        <div class="surface-strong p-5">
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

      <!-- Row 3: Pending Deliveries + Pending Purchases -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- 待发货订单 -->
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-truck-line text-amber-500 mr-1"></i>待发货
              <span v-if="pendingDeliveries.length" class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{{ pendingDeliveries.length }}</span>
            </h3>
            <router-link to="/sales" class="text-xs text-gray-600 hover:text-gray-900 font-medium">查看全部</router-link>
          </div>
          <div v-if="pendingDeliveries.length === 0" class="py-6 text-center text-sm text-gray-400">暂无待发货</div>
          <div v-else class="space-y-2">
            <router-link v-for="d in pendingDeliveries" :key="d.id" :to="`/sales/${d.id}`"
              class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900">{{ d.customer_name }}</span>
                  <span class="text-xs text-gray-400">{{ d.created_at }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5 truncate">{{ d.item_summary }}</p>
              </div>
              <span class="text-sm font-semibold text-gray-900 flex-shrink-0 ml-3">{{ maskMoney(d.total_amount) }}</span>
            </router-link>
          </div>
        </div>

        <!-- 待到货采购 -->
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-inbox-unarchive-line text-blue-500 mr-1"></i>待到货
              <span v-if="pendingPurchases.length" class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ pendingPurchases.length }}</span>
            </h3>
            <router-link to="/stock/in" class="text-xs text-gray-600 hover:text-gray-900 font-medium">去进货</router-link>
          </div>
          <div v-if="pendingPurchases.length === 0" class="py-6 text-center text-sm text-gray-400">暂无待到货</div>
          <div v-else class="space-y-2">
            <div v-for="p in pendingPurchases" :key="p.id" class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900">{{ p.supplier_name }}</span>
                  <span class="text-xs text-gray-400">{{ p.created_at }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5 truncate">{{ p.item_summary }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 4: Unpaid Customers -->
      <div v-if="unpaidCustomers.length > 0" class="mb-6">
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-money-cny-circle-line text-orange-500 mr-1"></i>未收款客户
              <span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{{ unpaidCustomers.length }}</span>
            </h3>
            <router-link to="/customers" class="text-xs text-gray-600 hover:text-gray-900 font-medium">去收款</router-link>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div v-for="c in unpaidCustomers" :key="c.customer_id"
              class="flex items-center justify-between py-2.5 px-3 bg-orange-50/60 rounded-lg">
              <span class="text-sm font-medium text-gray-900">{{ c.customer_name }}</span>
              <span class="text-sm font-bold text-orange-600">¥{{ c.debt.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis Section (collapsible) -->
      <div class="mb-6">
        <button class="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-4" @click="showAnalysis = !showAnalysis">
          <svg class="w-4 h-4 transition-transform" :class="showAnalysis ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          数据分析
          <span class="text-xs text-gray-400 font-normal">{{ showAnalysis ? '收起' : '展开' }}</span>
        </button>

        <template v-if="showAnalysis">
      <!-- Row 5: Hot Products -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Hot by Quantity -->
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-fire-line text-orange-500 mr-1"></i>热销 TOP 10（数量）
            </h3>
          </div>
          <div v-if="hotByQuantity.length === 0" class="py-8 text-center text-sm text-gray-400">暂无数据</div>
          <div v-else class="space-y-2">
            <div v-for="(item, i) in hotByQuantity" :key="i" class="flex items-center justify-between py-2 px-3 rounded-lg" :class="i < 3 ? 'bg-orange-50/60' : 'hover:bg-gray-50'">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-5 h-5 flex-shrink-0 rounded-full text-xs font-bold flex items-center justify-center" :class="i < 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'">{{ i + 1 }}</span>
                <div class="min-w-0">
                  <span class="text-sm font-medium text-gray-900 truncate block">{{ item.product_name }}</span>
                  <span v-if="item.specification" class="text-xs text-gray-400 truncate block">{{ item.specification }}</span>
                </div>
              </div>
              <span class="text-sm font-semibold text-gray-900 flex-shrink-0">{{ item.total_quantity }} 件</span>
            </div>
          </div>
        </div>
        <!-- Hot by Revenue -->
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-money-cny-circle-line text-emerald-500 mr-1"></i>热销商品 TOP 10（按销售额）
            </h3>
          </div>
          <div v-if="hotByRevenue.length === 0" class="py-8 text-center text-sm text-gray-400">暂无数据</div>
          <div v-else class="space-y-2">
            <div v-for="(item, i) in hotByRevenue" :key="i" class="flex items-center justify-between py-2 px-3 rounded-lg" :class="i < 3 ? 'bg-emerald-50/60' : 'hover:bg-gray-50'">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-5 h-5 flex-shrink-0 rounded-full text-xs font-bold flex items-center justify-center" :class="i < 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'">{{ i + 1 }}</span>
                <div class="min-w-0">
                  <span class="text-sm font-medium text-gray-900 truncate block">{{ item.product_name }}</span>
                  <span v-if="item.specification" class="text-xs text-gray-400 truncate block">{{ item.specification }}</span>
                </div>
              </div>
              <span class="text-sm font-semibold text-gray-900 flex-shrink-0">{{ maskMoney(item.total_amount) }}</span>
            </div>
          </div>
        </div>
        <!-- Inventory Pie -->
        <div class="surface-strong p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">库存分类分布</h3>
          <div ref="pieRef" class="h-52 w-full" />
          <div v-if="inventoryByCategory.length === 0" class="h-52 flex items-center justify-center text-sm text-gray-400 -mt-52">
            暂无数据
          </div>
        </div>
      </div>

      <!-- Row 5: Anomaly Alerts -->
      <div v-if="anomalies.length > 0" class="mb-6">
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-alarm-warning-line text-red-500 mr-1"></i>异常预警
              <span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">{{ anomalies.length }}</span>
            </h3>
          </div>
          <div class="space-y-2">
            <div v-for="(a, i) in anomalies" :key="i" class="flex items-start gap-3 py-2 px-3 rounded-lg"
              :class="a.severity === 'high' ? 'bg-red-50/60' : 'bg-amber-50/60'">
              <span class="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-xs"
                :class="a.severity === 'high' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'">
                {{ a.severity === 'high' ? '!' : '?' }}
              </span>
              <div class="min-w-0 flex-1">
                <span class="text-sm font-medium text-gray-900">{{ a.product_name }}</span>
                <span class="text-xs text-gray-500 ml-2 px-1.5 py-0.5 rounded"
                  :class="a.type === '进价异常' ? 'bg-red-100 text-red-600' : a.type === '库存为负' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'">
                  {{ a.type }}
                </span>
                <p class="text-xs text-gray-500 mt-0.5">{{ a.detail }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 6: Slow Products -->
      <div class="grid grid-cols-1 gap-4">
        <div class="surface-strong p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
              <i class="ri-snowflake-line text-blue-400 mr-1"></i>滞销商品（60天+未售出）
            </h3>
          </div>
          <div v-if="slowProducts.length === 0" class="py-8 text-center text-sm text-gray-400">暂无滞销商品</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b">
                  <th class="pb-2 font-medium">商品名称</th>
                  <th class="pb-2 font-medium">规格</th>
                  <th class="pb-2 font-medium text-right">库存</th>
                  <th class="pb-2 font-medium text-right">未售出天数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in slowProducts" :key="item.product_id" class="border-b border-gray-50">
                  <td class="py-2 font-medium text-gray-900">{{ item.product_name }}</td>
                  <td class="py-2 text-gray-500">{{ item.specification || '-' }}</td>
                  <td class="py-2 text-right">{{ item.stock_quantity }}</td>
                  <td class="py-2 text-right">
                    <span :class="item.days_idle >= 90 ? 'text-red-600 font-semibold' : 'text-amber-600'">
                      {{ item.days_idle >= 999 ? '从未售出' : item.days_idle + ' 天' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

        </template>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRealtimeTables } from '@/composables/useRealtime'
import { useDebounceFn } from '@/composables/useDebounce'
import { useCountUp, useStaggerIn } from '@/composables/useGsap'
import gsap from 'gsap'
// ECharts 按需引入（减少约 800KB）
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])
import {
  fetchDashboardKPIs,
  fetchInventoryByCategory,
  fetchInventoryTurnoverRate,
  fetchRecentOrders,
  fetchSalesSummary,
  fetchHotProducts,
  fetchSlowProducts,
  fetchAnomalies,
  fetchProfitReport,
  fetchStockReport
} from '@/api/reports'
import { fetchSalesOrders, fetchSalesOrderItems } from '@/api/orders'
import { fetchPurchaseOrders, fetchPurchaseOrderItems } from '@/api/purchaseOrders'
import type { SlowProduct, Anomaly } from '@/api/reports'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const showAmounts = ref(localStorage.getItem('mro_show_amounts') === 'true')
function toggleAmounts() { showAmounts.value = !showAmounts.value; localStorage.setItem('mro_show_amounts', String(showAmounts.value)) }
function maskMoney(value: number): string { return showAmounts.value ? '¥' + value.toLocaleString() : '***' }

const loading = ref(true)
const showAnalysis = ref(false)
const selectedPeriod = ref<'thisMonth' | 'lastMonth' | 'thisYear'>('thisMonth')

// KPI data
const monthlySales = ref(0)
const salesChange = ref(0)
const turnoverRate = ref(0)
const lowStockCount = ref(0)
const totalDebt = ref(0)

// Pending deliveries & purchases
const pendingDeliveries = ref<Array<{ id: number; order_no: string; customer_name: string; created_at: string; item_summary: string; total_amount: number }>>([])
const pendingPurchases = ref<Array<{ id: number; supplier_name: string; created_at: string; item_summary: string }>>([])
const unpaidCustomers = ref<Array<{ customer_id: number; customer_name: string; debt: number }>>([])

// Low stock items with details
const lowStockItems = ref<Array<{ id: number; name: string; stock: number; min_stock: number }>>([])

// GSAP animation refs
const kpiContainer = ref<HTMLElement | null>(null)
const salesValueRef = ref<HTMLElement | null>(null)
const turnoverValueRef = ref<HTMLElement | null>(null)
const lowStockValueRef = ref<HTMLElement | null>(null)

const { animate: animateSales, cleanup: cleanupSales } = useCountUp(monthlySales, salesValueRef, { prefix: '¥', duration: 1.5 })
const { animate: animateTurnover, cleanup: cleanupTurnover } = useCountUp(turnoverRate, turnoverValueRef, { decimals: 2, duration: 1.2 })
const { animate: animateLowStock, cleanup: cleanupLowStock } = useCountUp(lowStockCount, lowStockValueRef, { duration: 0.8 })
const { animate: animateKpiCards, cleanup: cleanupKpi } = useStaggerIn(kpiContainer, '.kpi-card', { y: 30, duration: 0.6 })
const pendingSO = ref(0)

// Chart data
const trendData = ref<any[]>([])
const inventoryByCategory = ref<any[]>([])
const recentOrders = ref<any[]>([])
const hotByQuantity = ref<Array<{ product_name: string; total_quantity: number; specification: string | null }>>([])
const hotByRevenue = ref<Array<{ product_name: string; total_amount: number; specification: string | null }>>([])
const slowProducts = ref<SlowProduct[]>([])
const anomalies = ref<Anomaly[]>([])

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

const selectedPeriodLabel = computed(() => {
  const labels: Record<typeof selectedPeriod.value, string> = {
    thisMonth: '本月',
    lastMonth: '上月',
    thisYear: '本年'
  }
  return labels[selectedPeriod.value]
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

function getPeriodRange() {
  const now = new Date()

  if (selectedPeriod.value === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return {
      dateFrom: start.toISOString(),
      dateTo: end.toISOString()
    }
  }

  if (selectedPeriod.value === 'thisYear') {
    const start = new Date(now.getFullYear(), 0, 1)
    return {
      dateFrom: start.toISOString(),
      dateTo: now.toISOString()
    }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    dateFrom: start.toISOString(),
    dateTo: now.toISOString()
  }
}

async function fetchTrendData(dateFrom: string, dateTo: string) {
  const res = await fetchSalesSummary({
    date_from: dateFrom,
    date_to: dateTo
  })

  if (!res.data) return []

  if (selectedPeriod.value === 'thisYear') {
    const monthMap = new Map<string, number>()
    for (const row of res.data) {
      const month = row.date.slice(0, 7)
      monthMap.set(month, (monthMap.get(month) ?? 0) + Number(row.total_amount))
    }
    return Array.from(monthMap.entries()).map(([month, sales_amount]) => ({
      label: month.slice(5) + '月',
      sales_amount
    }))
  }

  return res.data.map(row => ({
    label: row.date.slice(5),
    sales_amount: row.total_amount
  }))
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
  const labels = data.map((d: any) => d.label)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: any) => '¥' + Number(v).toLocaleString()
    },
    legend: { show: false },
    grid: { left: 50, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: labels,
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

async function loadData(force = false) {
  loading.value = true
  try {
    const { dateFrom, dateTo } = getPeriodRange()
    const [
      kpiRes, trendRes,
      inventoryRes, turnoverRes, ordersRes, hotRes,
      slowRes, anomalyRes
    ] = await Promise.all([
      fetchDashboardKPIs({ date_from: dateFrom, date_to: dateTo }),
      fetchTrendData(dateFrom, dateTo),
      fetchInventoryByCategory(),
      fetchInventoryTurnoverRate({ date_from: dateFrom, date_to: dateTo }),
      fetchRecentOrders(8, { date_from: dateFrom, date_to: dateTo }),
      fetchHotProducts({ date_from: dateFrom, date_to: dateTo }),
      fetchSlowProducts(),
      fetchAnomalies()
    ])

    if (kpiRes.data) {
      monthlySales.value = kpiRes.data.month_sales_amount
      lowStockCount.value = kpiRes.data.low_stock_count
      pendingSO.value = kpiRes.data.pending_sales_orders
    }

    if (turnoverRes.data) {
      turnoverRate.value = turnoverRes.data.rate
    }

    if (trendRes.length > 0) {
      trendData.value = trendRes
      salesChange.value = calcChange(trendRes.map((d: any) => d.sales_amount))
    } else {
      trendData.value = []
      salesChange.value = 0
    }

    if (inventoryRes.data) {
      inventoryByCategory.value = inventoryRes.data
    }

    recentOrders.value = ordersRes.data ?? []

    if (hotRes.data) {
      hotByQuantity.value = hotRes.data.by_quantity
      hotByRevenue.value = hotRes.data.by_revenue
    }

    slowProducts.value = slowRes.data ?? []
    anomalies.value = anomalyRes.data ?? []

    // Fetch pending deliveries, pending purchases, and unpaid customers
    const [pendingSORes, pendingPORes, allCompletedRes] = await Promise.all([
      fetchSalesOrders({ status: 'pending' }),
      fetchPurchaseOrders({ status: 'pending' }),
      fetchSalesOrders({ status: 'completed' })
    ])

    // Pending deliveries with item summaries
    if (pendingSORes.data) {
      const withSummary = await Promise.all(
        pendingSORes.data.map(async (order) => {
          const itemsRes = await fetchSalesOrderItems(order.id)
          const summary = (itemsRes.data ?? []).map((i: any) => `${i.product_name}×${i.quantity}`).join(', ')
          return {
            id: order.id,
            order_no: order.order_no,
            customer_name: order.customer_name || '零售',
            created_at: order.created_at?.slice(0, 10) ?? '',
            item_summary: summary,
            total_amount: order.total_amount || 0
          }
        })
      )
      pendingDeliveries.value = withSummary
      pendingSO.value = withSummary.length
    }

    // Pending purchases with item summaries
    if (pendingPORes.data) {
      const withSummary = await Promise.all(
        pendingPORes.data.map(async (order) => {
          const itemsRes = await fetchPurchaseOrderItems(order.id)
          const summary = (itemsRes.data ?? []).map((i: any) => `${i.product_name}×${i.quantity}`).join(', ')
          return {
            id: order.id,
            supplier_name: order.supplier_name || '未指定',
            created_at: order.created_at?.slice(0, 10) ?? '',
            item_summary: summary
          }
        })
      )
      pendingPurchases.value = withSummary
    }

    // Unpaid customers aggregation
    if (allCompletedRes.data) {
      const debtMap = new Map<number, { name: string; debt: number }>()
      for (const order of allCompletedRes.data) {
        if (!order.customer_id) continue
        const due = (order.total_amount || 0) - (order.paid_amount || 0)
        if (due > 0.01) {
          const existing = debtMap.get(order.customer_id)
          if (existing) {
            existing.debt += due
          } else {
            debtMap.set(order.customer_id, { name: order.customer_name || '未知', debt: due })
          }
        }
      }
      unpaidCustomers.value = Array.from(debtMap.entries())
        .map(([customer_id, v]) => ({ customer_id, customer_name: v.name, debt: Math.round(v.debt * 100) / 100 }))
        .sort((a, b) => b.debt - a.debt)
      totalDebt.value = unpaidCustomers.value.reduce((s, c) => s + c.debt, 0)
    }

    // Low stock items with details
    const stockRes = await fetchStockReport()
    if (stockRes.data) {
      lowStockItems.value = stockRes.data
        .filter(s => s.min_stock > 0 && s.quantity < s.min_stock)
        .map(s => ({ id: s.product_id, name: s.product_name, stock: s.quantity, min_stock: s.min_stock }))
    }

    await nextTick()
    renderAllCharts()

    // GSAP animations
    animateKpiCards()
    animateSales()
    animateTurnover()
    animateLowStock()

    // Desktop notifications
    if (lowStockCount.value > 0) {
      sendDesktopNotification('库存预警', `${lowStockCount.value} 个商品库存低于安全线，请及时补货`)
    }
    if (anomalies.value.length > 0) {
      const highSevere = anomalies.value.filter(a => a.severity === 'high')
      if (highSevere.length > 0) {
        sendDesktopNotification('异常预警', `发现 ${highSevere.length} 个高优先级异常，请及时处理`)
      }
    }
  } catch (e) {
    toast.error('仪表盘数据加载失败')
  } finally {
    loading.value = false
  }
}

const debouncedReload = useDebounceFn(() => {
  loadData()
}, 1000)

function sendDesktopNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/icons/icon-192x192.png' })
        }
      })
    }
  }
}

watch(selectedPeriod, () => { loadData() })
watch(showAmounts, (val) => { if (val) animateSales() })

onMounted(async () => {
  await loadData()

  // Supabase Realtime: 销售单或库存变化时自动刷新仪表盘
  useRealtimeTables(['sales_orders', 'stocks'], () => {
    debouncedReload()
  })

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
  cleanupSales()
  cleanupTurnover()
  cleanupLowStock()
  cleanupKpi()
})
</script>
