<template>
  <div class="page-padding">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">进货入库</h1>
      <router-link to="/stock/in/new" class="btn-primary text-sm">📥 进货</router-link>
    </div>

    <!-- 待到货区域 -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <h2 class="text-base font-semibold text-gray-900">待到货</h2>
        <span v-if="pendingOrders.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{{ pendingOrders.length }}</span>
      </div>

      <div v-if="pendingLoading" class="text-center py-8 text-gray-400">加载中...</div>

      <div v-else-if="pendingOrders.length === 0" class="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
        暂无待到货采购单
      </div>

      <div v-else class="space-y-2">
        <div v-for="order in pendingOrders" :key="order.id"
          class="bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-900">{{ order.supplier_name || '未指定供应商' }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(order.created_at) }}</span>
              </div>
              <div v-if="order.item_summary" class="text-xs text-gray-500 mt-1">{{ order.item_summary }}</div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium" @click="handleReceive(order.id)">确认到货</button>
              <button class="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" @click="handleCancelOrder(order.id)">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近入库 -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-900">最近入库</h2>
      </div>

      <div v-if="completedLoading" class="text-center py-8 text-gray-400">加载中...</div>

      <div v-else-if="completedOrders.length === 0" class="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
        暂无入库记录
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-100">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100">
              <th class="px-4 py-3 font-medium">供应商</th>
              <th class="px-4 py-3 font-medium">商品</th>
              <th class="px-4 py-3 font-medium text-right">状态</th>
              <th class="px-4 py-3 font-medium">日期</th>
              <th class="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in completedOrders" :key="order.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900 font-medium">{{ order.supplier_name || '未指定' }}</td>
              <td class="px-4 py-3 text-gray-600 text-xs">{{ order.item_summary || '-' }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已入库</span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(order.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <button class="text-primary-600 hover:text-primary-700 text-xs" @click="viewOrder(order)">查看</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 确认到货弹窗 -->
    <div v-if="receiveDialog.visible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="receiveDialog.visible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
        <h3 class="text-lg font-semibold">确认到货</h3>
        <p class="text-sm text-gray-500">请确认实际进价，如有变动可直接修改</p>
        <div class="space-y-3">
          <div v-for="item in receiveDialog.items" :key="item.product_id" class="flex items-center gap-3 py-2 border-b border-gray-50">
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-gray-900 truncate block">{{ item.product_name }}</span>
              <span class="text-xs text-gray-400">× {{ item.quantity }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">进价</span>
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">¥</span>
                <input v-model.number="item.unit_cost" type="number" step="0.01" min="0" class="w-24 text-sm border border-gray-200 rounded pl-6 pr-2 py-1" @input="item.is_estimated = item.unit_cost <= 0" />
              </div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" v-model="item.is_estimated" class="rounded border-gray-300 w-3 h-3" />
                <span class="text-xs text-gray-500">暂估</span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button class="btn-secondary" @click="receiveDialog.visible = false">取消</button>
          <button class="btn-primary" :disabled="receiveDialog.saving" @click="confirmReceive">
            {{ receiveDialog.saving ? '处理中...' : '确认到货入库' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <div v-if="detailVisible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="detailVisible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">采购单详情</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="detailVisible = false">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div v-if="detailOrder" class="space-y-3 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">供应商</span><span class="font-medium">{{ detailOrder.supplier_name || '未指定' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">状态</span><span>{{ detailOrder.status === 'completed' ? '已入库' : detailOrder.status === 'cancelled' ? '已取消' : '待到货' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">日期</span><span>{{ formatDate(detailOrder.created_at) }}</span></div>
        </div>
        <div v-if="detailItems.length > 0" class="mt-4 border-t border-gray-100 pt-4">
          <h4 class="text-sm font-medium text-gray-900 mb-2">商品明细</h4>
          <table class="w-full text-sm">
            <thead><tr class="text-left text-gray-500 text-xs"><th class="pb-1">商品</th><th class="pb-1 text-right">数量</th><th class="pb-1 text-right">进价</th></tr></thead>
            <tbody>
              <tr v-for="item in detailItems" :key="item.id" class="border-t border-gray-50">
                <td class="py-1.5">{{ item.product_name }}</td>
                <td class="py-1.5 text-right">{{ item.quantity }}</td>
                <td class="py-1.5 text-right">¥{{ (item.unit_cost || 0).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { fetchPurchaseOrders, fetchPurchaseOrderItems, completePurchaseOrder, cancelPurchaseOrder } from '@/api/purchaseOrders'
import { supabase } from '@/lib/supabase'
import type { PurchaseOrder, PurchaseOrderItem } from '@/api/purchaseOrders'

const pendingOrders = ref<(PurchaseOrder & { item_summary?: string })[]>([])
const pendingLoading = ref(true)
const completedOrders = ref<(PurchaseOrder & { item_summary?: string })[]>([])
const completedLoading = ref(true)

const detailVisible = ref(false)
const detailOrder = ref<(PurchaseOrder & { item_summary?: string }) | null>(null)
const detailItems = ref<PurchaseOrderItem[]>([])

const receiveDialog = reactive({
  visible: false, orderId: 0,
  items: [] as Array<{ product_id: number; product_name: string; quantity: number; unit_cost: number; is_estimated: boolean }>,
  saving: false,
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchPending() {
  pendingLoading.value = true
  try {
    const res = await fetchPurchaseOrders({ status: 'pending' })
    if (res.data && res.data.length > 0) {
      const orderIds = res.data.map(o => o.id)
      const { data: allItems } = await supabase.from('purchase_order_items').select('purchase_order_id, products!left(name)').in('purchase_order_id', orderIds)
      const itemsByOrder = new Map<number, string[]>()
      for (const item of (allItems ?? []) as any[]) {
        const list = itemsByOrder.get(item.purchase_order_id) ?? []
        list.push(item.products?.name ?? '?')
        itemsByOrder.set(item.purchase_order_id, list)
      }
      pendingOrders.value = res.data.map(order => ({ ...order, item_summary: (itemsByOrder.get(order.id) ?? []).join(', ') }))
    } else { pendingOrders.value = [] }
  } catch (e) { console.error('加载待到货失败', e) }
  finally { pendingLoading.value = false }
}

async function fetchCompleted() {
  completedLoading.value = true
  try {
    const res = await fetchPurchaseOrders({ status: 'completed' })
    if (res.data && res.data.length > 0) {
      const orderIds = res.data.map(o => o.id)
      const { data: allItems } = await supabase.from('purchase_order_items').select('purchase_order_id, products!left(name)').in('purchase_order_id', orderIds)
      const itemsByOrder = new Map<number, string[]>()
      for (const item of (allItems ?? []) as any[]) {
        const list = itemsByOrder.get(item.purchase_order_id) ?? []
        list.push(item.products?.name ?? '?')
        itemsByOrder.set(item.purchase_order_id, list)
      }
      completedOrders.value = res.data.map(order => ({ ...order, item_summary: (itemsByOrder.get(order.id) ?? []).join(', ') }))
    } else { completedOrders.value = [] }
  } catch (e) { console.error('加载入库记录失败', e) }
  finally { completedLoading.value = false }
}

async function handleReceive(orderId: number) {
  const { data } = await fetchPurchaseOrderItems(orderId)
  receiveDialog.orderId = orderId
  receiveDialog.items = (data ?? []).map((item: any) => ({
    product_id: item.product_id, product_name: item.product_name || `商品#${item.product_id}`,
    quantity: item.quantity, unit_cost: item.unit_cost || 0,
    is_estimated: item.is_estimated || item.unit_cost <= 0,
  }))
  receiveDialog.visible = true
}

async function confirmReceive() {
  receiveDialog.saving = true
  const priceOverrides: Record<number, { unit_cost: number; is_estimated: boolean }> = {}
  for (const item of receiveDialog.items) {
    priceOverrides[item.product_id] = { unit_cost: item.unit_cost, is_estimated: item.is_estimated || item.unit_cost <= 0 }
  }
  try {
    const { error } = await completePurchaseOrder(receiveDialog.orderId, priceOverrides)
    if (error) { alert('入库失败: ' + error) } else {
      receiveDialog.visible = false; fetchPending(); fetchCompleted()
    }
  } catch (e) { alert('入库失败') }
  finally { receiveDialog.saving = false }
}

async function handleCancelOrder(orderId: number) {
  const { error } = await cancelPurchaseOrder(orderId)
  if (!error) { fetchPending(); fetchCompleted() }
}

async function viewOrder(order: PurchaseOrder & { item_summary?: string }) {
  detailOrder.value = order; detailVisible.value = true
  const { data } = await fetchPurchaseOrderItems(order.id)
  detailItems.value = data ?? []
}

onMounted(() => { fetchPending(); fetchCompleted() })
</script>
