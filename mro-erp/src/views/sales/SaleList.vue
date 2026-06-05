<template>
  <div class="page-padding">
    <BasePageHeader title="销售管理">
      <div class="flex gap-3">
        <button class="btn-secondary text-sm" @click="showStatementDialog = true">导出对账单</button>
        <router-link to="/sales/quick" class="btn-primary text-sm">🏪 销售商品</router-link>
      </div>
    </BasePageHeader>

    <!-- 待发货区域 -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <h2 class="text-base font-semibold text-gray-900">待发货</h2>
        <span v-if="pendingOrders.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
          {{ pendingOrders.length }}
        </span>
      </div>

      <div v-if="pendingLoading" class="text-center py-8 text-gray-400">加载中...</div>

      <div v-else-if="pendingOrders.length === 0" class="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
        暂无待发货订单
      </div>

      <div v-else class="space-y-2">
        <div v-for="order in pendingOrders" :key="order.id"
          class="bg-white rounded-xl border border-gray-100 p-4 hover:border-amber-200 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-900">{{ order.customer_name || '零售客户' }}</span>
                <span class="text-xs text-gray-400">{{ order.order_no }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ formatDate(order.created_at) }} · {{ order.warehouse_name || '-' }}
              </div>
              <div v-if="order.item_summary" class="text-xs text-gray-400 mt-1">
                {{ order.item_summary }}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-lg font-bold text-gray-900">¥{{ (order.total_amount || 0).toFixed(2) }}</div>
              <div class="flex gap-2 mt-2">
                <button class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  @click="handleDeliver(order.id)">
                  标记已发货
                </button>
                <button class="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  @click="viewOrder(order.id)">
                  查看
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近销售 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-900">最近销售</h2>
        <div class="flex items-center gap-2">
          <select v-model="statusFilter" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" @change="fetchCompleted">
            <option value="">全部状态</option>
            <option value="completed">已完成</option>
            <option value="returned">已退货</option>
            <option value="cancelled">已撤回</option>
          </select>
        </div>
      </div>

      <div v-if="completedLoading" class="text-center py-8 text-gray-400">加载中...</div>

      <div v-else-if="completedOrders.length === 0" class="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
        暂无销售记录
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-100">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100">
              <th class="px-4 py-3 font-medium">单号</th>
              <th class="px-4 py-3 font-medium">客户</th>
              <th class="px-4 py-3 font-medium text-right">金额</th>
              <th class="px-4 py-3 font-medium">状态</th>
              <th class="px-4 py-3 font-medium">日期</th>
              <th class="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in completedOrders" :key="order.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{{ order.order_no }}</td>
              <td class="px-4 py-3 text-gray-600">{{ order.customer_name || '零售' }}</td>
              <td class="px-4 py-3 text-right font-medium">¥{{ (order.total_amount || 0).toFixed(2) }}</td>
              <td class="px-4 py-3">
                <span v-if="order.status === 'completed'" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已完成</span>
                <span v-else-if="order.status === 'returned'" class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">已退货</span>
                <span v-else class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ order.status }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(order.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <button class="text-primary-600 hover:text-primary-700 text-xs mr-2" @click="viewOrder(order.id)">查看</button>
                <button v-if="order.status === 'completed'" class="text-red-500 hover:text-red-600 text-xs mr-2" @click="openReturn(order)">退货</button>
                <button v-if="order.status === 'completed' || order.status === 'returned'" class="text-amber-500 hover:text-amber-600 text-xs" @click="handleRevoke(order.id)">撤回</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <div v-if="detailVisible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="detailVisible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">订单详情</h3>
          <div class="flex items-center gap-2">
            <button v-if="detailOrder" class="btn-secondary text-sm" @click="printDeliveryVisible = true">🖨️ 打印送货单</button>
            <button v-if="detailOrder" class="btn-secondary text-sm" @click="printQuoteVisible = true">📋 生成报价单</button>
            <button class="text-gray-400 hover:text-gray-600" @click="detailVisible = false">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="detailLoading" class="text-center py-8 text-gray-400">加载中...</div>

        <template v-else-if="detailOrder">
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">单号</span>
              <span class="font-medium">{{ detailOrder.order_no }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">客户</span>
              <span>{{ detailOrder.customer_name || '零售客户' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">仓库</span>
              <span>{{ detailOrder.warehouse_name || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">状态</span>
              <span v-if="detailOrder.status === 'completed'" class="text-green-600">已完成</span>
              <span v-else-if="detailOrder.status === 'pending'" class="text-amber-600">待发货</span>
              <span v-else>{{ detailOrder.status }}</span>
            </div>
          </div>

          <div class="mt-4 border-t border-gray-100 pt-4">
            <h4 class="text-sm font-medium text-gray-900 mb-2">商品明细</h4>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 text-xs">
                  <th class="pb-1">商品</th>
                  <th class="pb-1 text-right">数量</th>
                  <th class="pb-1 text-right">单价</th>
                  <th class="pb-1 text-right">小计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detailItems" :key="item.id" class="border-t border-gray-50">
                  <td class="py-1.5">{{ item.product_name }}</td>
                  <td class="py-1.5 text-right">{{ item.quantity }}</td>
                  <td class="py-1.5 text-right">¥{{ (item.unit_price || 0).toFixed(2) }}</td>
                  <td class="py-1.5 text-right">¥{{ (item.line_total || 0).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex justify-between text-sm font-semibold">
            <span>合计</span>
            <span>¥{{ (detailOrder.total_amount || 0).toFixed(2) }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 退货弹窗 -->
    <div v-if="returnVisible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="returnVisible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">退货</h3>
        <div class="text-sm text-gray-600">
          <p>订单：{{ returnOrder?.order_no }}</p>
          <p>客户：{{ returnOrder?.customer_name || '零售' }}</p>
        </div>

        <div v-if="returnItems.length > 0" class="space-y-2">
          <div v-for="item in returnItems" :key="item.id"
            class="flex items-center justify-between py-2 border-b border-gray-50">
            <div>
              <span class="text-sm font-medium">{{ item.product_name }}</span>
              <span class="text-xs text-gray-400 ml-1">×{{ item.quantity }}</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500">退货数量</label>
              <input v-model.number="item.return_qty" type="number" min="0" :max="item.quantity"
                class="w-16 text-center text-sm border border-gray-200 rounded py-1" />
            </div>
          </div>
        </div>

        <div v-if="returnError" class="text-sm text-red-600">{{ returnError }}</div>

        <div class="flex gap-3 justify-end">
          <button class="btn-secondary" @click="returnVisible = false">取消</button>
          <button class="btn-primary" :disabled="returnSaving || !hasReturnItems" @click="handleReturn">
            {{ returnSaving ? '处理中...' : '确认退货' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 对账单导出弹窗 -->
    <div v-if="showStatementDialog" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="showStatementDialog = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">导出对账单</h3>
        <div>
          <label class="label">客户 <span class="text-red-500">*</span></label>
          <select v-model="statementForm.customer_id" class="input">
            <option :value="null">请选择客户</option>
            <option v-for="c in allCustomers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">开始日期</label>
            <input v-model="statementForm.date_from" type="date" class="input" />
          </div>
          <div>
            <label class="label">结束日期</label>
            <input v-model="statementForm.date_to" type="date" class="input" />
          </div>
        </div>
        <div v-if="statementError" class="text-sm text-red-600">{{ statementError }}</div>
        <div class="flex gap-3 justify-end">
          <button class="btn-secondary" @click="showStatementDialog = false">取消</button>
          <button class="btn-primary" :disabled="!statementForm.customer_id || statementSaving" @click="handleExportStatement">
            {{ statementSaving ? '导出中...' : '导出 Excel' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Print Delivery Note -->
    <PrintDeliveryNote
      :visible="printDeliveryVisible"
      :order="detailOrder ?? {} as SalesOrder"
      :items="detailItems"
      @close="printDeliveryVisible = false"
    />

    <!-- Print Quote -->
    <PrintQuote
      :visible="printQuoteVisible"
      :order="detailOrder ?? {} as SalesOrder"
      :items="detailItems"
      @close="printQuoteVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { fetchSalesOrders, fetchSalesOrder, fetchSalesOrderItems, completeSalesOrder, updateSalesOrder, createSalesReturn, saveSalesReturnItems, completeSalesReturn, reverseSalesOrder, deleteSalesOrder, fetchCustomers } from '@/api'
import { fetchStatementData, exportStatementExcel } from '@/lib/statementExport'
import type { SalesOrder, SalesOrderItem, Customer } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import PrintDeliveryNote from '@/views/sales/PrintDeliveryNote.vue'
import PrintQuote from '@/views/sales/PrintQuote.vue'

// Pending deliveries
const pendingOrders = ref<(SalesOrder & { item_summary?: string })[]>([])
const pendingLoading = ref(true)

// Completed orders
const completedOrders = ref<SalesOrder[]>([])
const completedLoading = ref(true)
const statusFilter = ref('')

// Order detail
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailOrder = ref<SalesOrder | null>(null)
const detailItems = ref<SalesOrderItem[]>([])

// Return dialog
const returnVisible = ref(false)
const returnSaving = ref(false)
const returnError = ref('')
const returnOrder = ref<SalesOrder | null>(null)
const returnItems = ref<(SalesOrderItem & { return_qty: number })[]>([])
const hasReturnItems = computed(() => returnItems.value.some(i => i.return_qty > 0))

// Print delivery note
const printDeliveryVisible = ref(false)
const printQuoteVisible = ref(false)

// Statement export
const showStatementDialog = ref(false)
const statementSaving = ref(false)
const statementError = ref('')
const allCustomers = ref<Customer[]>([])
const statementForm = reactive({
  customer_id: null as number | null,
  date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

import { supabase } from '@/lib/supabase'

async function fetchPending() {
  pendingLoading.value = true
  try {
    const res = await fetchSalesOrders({ status: 'pending' })
    if (res.data && res.data.length > 0) {
      const orderIds = res.data.map(o => o.id)
      const { data: allItems } = await supabase
        .from('sales_order_items')
        .select('sales_order_id, products!left(name)')
        .in('sales_order_id', orderIds)

      const itemsByOrder = new Map<number, string[]>()
      for (const item of (allItems ?? []) as any[]) {
        const list = itemsByOrder.get(item.sales_order_id) ?? []
        list.push(item.products?.name ?? '?')
        itemsByOrder.set(item.sales_order_id, list)
      }

      pendingOrders.value = res.data.map(order => ({
        ...order,
        item_summary: (itemsByOrder.get(order.id) ?? []).join(', ')
      }))
    } else {
      pendingOrders.value = []
    }
  } catch (e) {
    console.error('加载待发货列表失败', e)
  } finally {
    pendingLoading.value = false
  }
}

async function fetchCompleted() {
  completedLoading.value = true
  const res = await fetchSalesOrders({
    status: statusFilter.value || undefined,
  })
  // Filter out pending; also filter out cancelled unless explicitly selected
  completedOrders.value = (res.data ?? []).filter(o => {
    if (o.status === 'pending') return false
    if (o.status === 'cancelled' && statusFilter.value !== 'cancelled') return false
    return true
  })
  completedLoading.value = false
}

async function handleDeliver(orderId: number) {
  const { error } = await completeSalesOrder(orderId)
  if (!error) {
    fetchPending()
    fetchCompleted()
  }
}

async function viewOrder(orderId: number) {
  detailVisible.value = true
  detailLoading.value = true
  const orderRes = await fetchSalesOrder(orderId)
  detailOrder.value = orderRes.data
  const itemsRes = await fetchSalesOrderItems(orderId)
  detailItems.value = itemsRes.data ?? []
  detailLoading.value = false
}

async function handleRevoke(orderId: number) {
  if (!confirm('确定撤回此订单？库存将恢复，订单将被删除。')) return
  const { error: reverseErr } = await reverseSalesOrder(orderId)
  if (reverseErr) { alert('撤回失败: ' + reverseErr); return }
  const { error: deleteErr } = await deleteSalesOrder(orderId)
  if (deleteErr) { alert('删除订单失败: ' + deleteErr + '，但库存已恢复'); }
  fetchPending()
  fetchCompleted()
}

async function openReturn(order: SalesOrder) {
  returnOrder.value = order
  returnError.value = ''
  returnVisible.value = true

  const itemsRes = await fetchSalesOrderItems(order.id)
  returnItems.value = (itemsRes.data ?? []).map((item: any) => ({
    ...item,
    return_qty: 0,
  }))
}

async function handleReturn() {
  if (!returnOrder.value || !hasReturnItems.value) return
  returnSaving.value = true
  returnError.value = ''

  const itemsToReturn = returnItems.value.filter(i => i.return_qty > 0)

  // Create return order
  const { data: returnData, error: createErr } = await createSalesReturn({
    customer_id: returnOrder.value.customer_id,
    warehouse_id: returnOrder.value.warehouse_id,
    sales_order_id: returnOrder.value.id,
    status: 'draft',
    total_amount: itemsToReturn.reduce((sum, i) => sum + i.return_qty * i.unit_price, 0),
    remark: null,
  } as any)

  if (createErr || !returnData) {
    returnError.value = createErr || '创建退货单失败'
    returnSaving.value = false
    return
  }

  // Add return items
  const { error: itemsErr } = await saveSalesReturnItems((returnData as any).id, itemsToReturn.map(i => ({
    product_id: i.product_id,
    quantity: i.return_qty,
    unit_price: i.unit_price,
  })))

  if (itemsErr) {
    returnError.value = itemsErr
    returnSaving.value = false
    return
  }

  // Complete return
  const { error: completeErr } = await completeSalesReturn((returnData as any).id)
  if (completeErr) {
    returnError.value = completeErr
    returnSaving.value = false
    return
  }

  // Don't change original order status — the return order itself records the return.
  // Original order stays as 'completed'.

  returnVisible.value = false
  returnSaving.value = false
  fetchPending()
  fetchCompleted()
}

async function handleExportStatement() {
  if (!statementForm.customer_id) return
  statementSaving.value = true
  statementError.value = ''

  const { data, error } = await fetchStatementData(
    statementForm.customer_id,
    statementForm.date_from,
    statementForm.date_to
  )

  if (error || !data) {
    statementError.value = error || '获取数据失败'
    statementSaving.value = false
    return
  }

  if (data.orders.length === 0) {
    statementError.value = '该时间段内无订单记录'
    statementSaving.value = false
    return
  }

  await exportStatementExcel(data)
  showStatementDialog.value = false
  statementSaving.value = false
}

onMounted(async () => {
  fetchPending()
  fetchCompleted()
  const custRes = await fetchCustomers({ limit: 1000 })
  if (custRes.data) allCustomers.value = custRes.data
})
</script>
