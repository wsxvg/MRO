<template>
  <div class="page-padding">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">进货入库</h1>
      <button class="btn-primary text-sm" @click="showImportForm = true">📥 进货</button>
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
              <button class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                @click="handleReceive(order.id)">
                确认到货
              </button>
              <button class="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                @click="handleCancelOrder(order.id)">
                取消
              </button>
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
                <span v-if="order.status === 'completed'" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已入库</span>
                <span v-else-if="order.status === 'cancelled'" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已取消</span>
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

    <!-- 右侧抽屉面板 -->
    <Teleport to="body">
      <div v-if="showImportForm" class="drawer-overlay" ref="drawerOverlayRef" @click="closeDrawer">
        <div class="drawer-panel" ref="drawerPanelRef" @click.stop>
          <!-- 抽屉头部 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">进货入库</h3>
            <button class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="closeDrawer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- 抽屉内容（可滚动） -->
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <!-- 仓库 + 供应商 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label text-xs">目标仓库 <span class="text-red-500">*</span></label>
                <select v-model="warehouseId" class="input text-sm" required>
                  <option :value="null">请选择仓库</option>
                  <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                </select>
              </div>
              <div>
                <label class="label text-xs">供应商</label>
                <div class="flex gap-1">
                  <select v-model="supplierId" class="input text-sm flex-1">
                    <option :value="null">不指定</option>
                    <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <button type="button" class="btn-secondary text-xs px-2" @click="showAddSupplier = true">+</button>
                </div>
              </div>
            </div>

            <!-- 商品列表 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">商品明细</span>
                <button type="button" class="text-xs px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-colors" @click="addRow">+ 添加</button>
              </div>

              <div v-if="rows.length === 0" class="text-center py-6 text-gray-400 text-xs">
                点击「+ 添加」开始进货
              </div>

              <div v-else class="space-y-3">
                <div v-for="(row, i) in rows" :key="i"
                  class="border border-gray-100 rounded-lg p-3 space-y-2"
                  :class="{ 'border-amber-200 bg-amber-50/50': row.is_estimated }">

                  <div class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="relative">
                        <input v-model="row.product_name" type="text" class="input text-sm" placeholder="商品名称"
                          @input="onProductNameInput(i)" @focus="row.showSuggestions = true" @blur="hideSuggestions(i)" />
                        <div v-if="row.showSuggestions && row.suggestions.length > 0"
                          class="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                          <div v-for="p in row.suggestions" :key="p.id"
                            class="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0"
                            @mousedown.prevent="selectProduct(i, p)">
                            <span class="font-medium text-gray-900">{{ p.name }}</span>
                            <span v-if="p.specification" class="text-gray-400 ml-1">{{ p.specification }}</span>
                            <span class="text-gray-500 ml-auto">¥{{ (p.reference_price || 0).toFixed(2) }}</span>
                          </div>
                        </div>
                      </div>
                      <p v-if="row.is_new" class="text-[10px] text-blue-500 mt-0.5">新商品</p>
                      <p v-else-if="row.product_id" class="text-[10px] text-green-500 mt-0.5">✓ 已匹配</p>
                    </div>
                    <input v-model.number="row.quantity" type="number" min="1" class="input text-sm w-16 text-center" placeholder="数量" />
                    <button type="button" class="text-gray-300 hover:text-red-500 transition-colors mt-1" @click="removeRow(i)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <input v-model="row.category_name" type="text" class="input text-xs" placeholder="分类" list="category-list" @change="onCategoryInput(i, $event)" />
                    <input v-model="row.specification" type="text" class="input text-xs" placeholder="规格" />
                  </div>

                  <div class="grid grid-cols-3 gap-2">
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">¥</span>
                      <input v-model.number="row.selling_price" type="number" step="0.01" min="0" class="input text-xs pl-5" placeholder="售价" />
                    </div>
                    <div class="relative">
                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">¥</span>
                      <input v-model.number="row.unit_cost" type="number" step="0.01" min="0" class="input text-xs pl-5" placeholder="进价" @input="row.is_estimated = row.unit_cost <= 0" />
                    </div>
                    <label class="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" v-model="row.is_estimated" class="rounded border-gray-300 w-3 h-3" />
                      <span class="text-[10px] text-gray-500">暂估</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 抽屉底部（固定） -->
          <div v-if="rows.length > 0" class="border-t border-gray-100 px-6 py-4 space-y-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="isOrderedOnly" class="rounded border-gray-300" />
              <span class="text-sm text-gray-700">货还没到（仅下单）</span>
            </label>
            <div class="flex gap-2">
              <button class="btn-primary flex-1 text-sm" :disabled="!canSubmit || saving" @click="doSubmit">
                {{ saving ? '处理中...' : (isOrderedOnly ? '确认下单' : '确认进货') }}
              </button>
              <button class="btn-secondary text-sm px-3" @click="rows = []">清空</button>
            </div>
            <div v-if="result" class="rounded-lg p-2 text-xs" :class="result.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'">
              {{ result.error || (isOrderedOnly ? '已下单' : '已入库') }}
            </div>
          </div>

          <!-- Category datalist -->
          <datalist id="category-list">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name" />
          </datalist>
        </div>
      </div>
    </Teleport>

    <!-- 新增供应商弹窗 -->
    <div v-if="showAddSupplier" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="showAddSupplier = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <h3 class="text-lg font-semibold">新增供应商</h3>
        <div>
          <label class="label">名称 <span class="text-red-500">*</span></label>
          <input v-model="newSupplier.name" type="text" class="input" placeholder="供应商名称" autofocus />
        </div>
        <div>
          <label class="label">联系人</label>
          <input v-model="newSupplier.contact_person" type="text" class="input" placeholder="可选" />
        </div>
        <div>
          <label class="label">电话</label>
          <input v-model="newSupplier.phone" type="text" class="input" placeholder="可选" />
        </div>
        <div v-if="addSupplierSuccess" class="text-sm text-green-600 font-medium">✓ 添加成功</div>
        <div class="flex gap-3 justify-end">
          <button class="btn-secondary" @click="showAddSupplier = false">取消</button>
          <button class="btn-primary" :disabled="!newSupplier.name || addSupplierSaving" @click="handleAddSupplier">
            {{ addSupplierSaving ? '保存中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认到货弹窗（可调价） -->
    <div v-if="receiveDialog.visible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="receiveDialog.visible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
        <h3 class="text-lg font-semibold">确认到货</h3>
        <p class="text-sm text-gray-500">请确认实际进价，如有变动可直接修改</p>
        <div class="space-y-3">
          <div v-for="item in receiveDialog.items" :key="item.product_id"
            class="flex items-center gap-3 py-2 border-b border-gray-50">
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-gray-900 truncate block">{{ item.product_name }}</span>
              <span class="text-xs text-gray-400">× {{ item.quantity }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">进价</span>
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">¥</span>
                <input v-model.number="item.unit_cost" type="number" step="0.01" min="0"
                  class="w-24 text-sm border border-gray-200 rounded pl-6 pr-2 py-1"
                  @input="item.is_estimated = item.unit_cost <= 0" />
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
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { fetchWarehouses, fetchProducts, createProduct, batchCreateStockIn, suppliersApi, fetchAllSuppliers, fetchStockLots, fetchCategories, createCategory } from '@/api'
import { createPurchaseOrder, fetchPurchaseOrders, fetchPurchaseOrderItems, completePurchaseOrder, cancelPurchaseOrder } from '@/api/purchaseOrders'
import { useCommonStore } from '@/stores/common'
import { supabase } from '@/lib/supabase'
import gsap from 'gsap'
import type { Warehouse, Product, Supplier } from '@/types'
import type { PurchaseOrder, PurchaseOrderItem } from '@/api/purchaseOrders'

interface StockInRow {
  product_id: number | null
  product_name: string
  specification: string
  category_id: number | null
  category_name: string
  quantity: number
  selling_price: number
  unit_cost: number
  is_estimated: boolean
  is_new: boolean
  remark: string
  showSuggestions: boolean
  suggestions: Product[]
}

interface Category { id: number; name: string }

const commonStore = useCommonStore()
const showImportForm = ref(false)
const drawerOverlayRef = ref<HTMLElement>()
const drawerPanelRef = ref<HTMLElement>()
const warehouses = ref<Warehouse[]>([])
const allProducts = ref<Product[]>([])
const suppliers = ref<Supplier[]>([])
const categories = ref<Category[]>([])
const warehouseId = ref<number | null>(null)
const supplierId = ref<number | null>(null)
const rows = ref<StockInRow[]>([])
const saving = ref(false)
const result = ref<{ error?: string } | null>(null)
const isOrderedOnly = ref(false)
const showAddSupplier = ref(false)
const addSupplierSaving = ref(false)
const addSupplierSuccess = ref(false)
const newSupplier = ref({ name: '', contact_person: '', phone: '' })

// Pending orders
const pendingOrders = ref<(PurchaseOrder & { item_summary?: string })[]>([])
const pendingLoading = ref(true)

// Completed orders
const completedOrders = ref<(PurchaseOrder & { item_summary?: string })[]>([])
const completedLoading = ref(true)

// Detail popup
const detailVisible = ref(false)
const detailOrder = ref<(PurchaseOrder & { item_summary?: string }) | null>(null)
const detailItems = ref<PurchaseOrderItem[]>([])

// Receive dialog
const receiveDialog = reactive({
  visible: false,
  orderId: 0,
  items: [] as Array<{ product_id: number; product_name: string; quantity: number; unit_cost: number; is_estimated: boolean }>,
  saving: false,
})

// Last cost prices cache
const lastCostMap = new Map<number, { cost: number; is_estimated: boolean; date: string }>()

const canSubmit = computed(() => {
  return warehouseId.value && rows.value.length > 0 && rows.value.every(r => {
    if (!r.product_name.trim() || r.quantity <= 0) return false
    if (r.is_new && r.selling_price <= 0) return false
    return true
  })
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function addRow() {
  rows.value.push({
    product_id: null, product_name: '', specification: '', category_id: null, category_name: '',
    quantity: 1, selling_price: 0, unit_cost: 0, is_estimated: true, is_new: true,
    remark: '', showSuggestions: false, suggestions: [],
  })
}

function removeRow(i: number) { rows.value.splice(i, 1) }

function onProductNameInput(i: number) {
  const row = rows.value[i]
  const q = row.product_name.trim().toLowerCase()
  if (!q) { row.suggestions = []; row.is_new = true; row.product_id = null; return }
  row.suggestions = allProducts.value.filter(p =>
    p.name.toLowerCase().includes(q) || (p.specification && p.specification.toLowerCase().includes(q))
  ).slice(0, 8)
  const exact = allProducts.value.find(p => p.name.toLowerCase() === q)
  if (exact) {
    row.is_new = false; row.product_id = exact.id
    row.specification = exact.specification || ''
    row.category_id = (exact as any).category_id ?? null
    row.category_name = (exact as any).category_name || ''
    row.selling_price = exact.reference_price || 0
    const lastCost = lastCostMap.get(exact.id)
    if (lastCost) { row.unit_cost = lastCost.cost; row.is_estimated = lastCost.is_estimated }
    else if (exact.cost_price > 0) { row.unit_cost = exact.cost_price; row.is_estimated = (exact as any).cost_price_auto ?? false }
  } else { row.is_new = true; row.product_id = null }
}

function selectProduct(i: number, product: Product) {
  const row = rows.value[i]
  row.product_id = product.id; row.product_name = product.name
  row.specification = product.specification || ''
  row.category_id = (product as any).category_id ?? null
  row.category_name = (product as any).category_name || ''
  row.is_new = false; row.selling_price = product.reference_price || 0
  const lastCost = lastCostMap.get(product.id)
  if (lastCost) { row.unit_cost = lastCost.cost; row.is_estimated = lastCost.is_estimated }
  else if (product.cost_price > 0) { row.unit_cost = product.cost_price; row.is_estimated = (product as any).cost_price_auto ?? false }
  row.suggestions = []; row.showSuggestions = false
}

function hideSuggestions(i: number) { setTimeout(() => { rows.value[i].showSuggestions = false }, 200) }

function onCategoryInput(i: number, event: Event) {
  const row = rows.value[i]
  const value = (event.target as HTMLInputElement).value.trim()
  const existing = categories.value.find(c => c.name === value)
  if (existing) { row.category_id = existing.id; row.category_name = existing.name }
  else { row.category_id = null; row.category_name = value }
}

async function doSubmit() {
  if (!canSubmit.value || !warehouseId.value) return
  saving.value = true; result.value = null
  try {
    for (const row of rows.value) {
      if (row.is_new && !row.product_id) {
        let categoryId = row.category_id
        if (!categoryId && row.category_name.trim()) {
          const existing = categories.value.find(c => c.name === row.category_name.trim())
          if (existing) { categoryId = existing.id }
          else {
            const { data: catData, error: catErr } = await createCategory({ name: row.category_name.trim(), sort_order: 999 } as any)
            if (catData) { categoryId = catData.id; categories.value.push(catData as any) }
            else if (catErr && catErr.includes('已存在')) {
              const catRes = await fetchCategories()
              if (catRes.data) categories.value = catRes.data as any
              const found = categories.value.find(c => c.name === row.category_name.trim())
              if (found) categoryId = found.id
            }
          }
        }
        const { data, error } = await createProduct({
          name: row.product_name.trim(), specification: row.specification.trim() || null,
          category_id: categoryId, reference_price: row.selling_price,
          cost_price: row.unit_cost || 0, cost_price_auto: row.unit_cost <= 0,
          unit: '个', is_active: true, min_stock: 0,
        } as any)
        if (error) { result.value = { error: `创建商品「${row.product_name}」失败: ${error}` }; saving.value = false; return }
        row.product_id = data!.id
      }
    }
    if (isOrderedOnly.value) {
      const { error } = await createPurchaseOrder({
        supplier_id: supplierId.value, warehouse_id: warehouseId.value,
        items: rows.value.map(r => ({
          product_id: r.product_id!, quantity: r.quantity,
          selling_price: r.selling_price, unit_cost: r.unit_cost || 0,
          is_estimated: r.is_estimated || r.unit_cost <= 0,
        })),
      })
      if (error) { result.value = { error } } else {
        result.value = {}; rows.value = []; commonStore.invalidate('products')
        fetchPending(); fetchCompleted()
      }
    } else {
      const inputs = rows.value.map(r => ({
        product_id: r.product_id!, warehouse_id: warehouseId.value!,
        quantity: r.quantity, unit_cost: r.unit_cost || 0,
        is_estimated: r.is_estimated || r.unit_cost <= 0,
        supplier_id: supplierId.value, remark: r.remark || null,
      }))
      const { error } = await batchCreateStockIn(inputs)
      if (error) { result.value = { error } } else {
        result.value = {}; rows.value = []; commonStore.invalidate('products')
        fetchCompleted()
      }
    }
  } catch (e: any) { result.value = { error: e?.message ?? '操作失败' } }
  finally { saving.value = false }
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
    if (error) { result.value = { error: `入库失败: ${error}` } } else {
      receiveDialog.visible = false; commonStore.invalidate('products')
      fetchPending(); fetchCompleted()
    }
  } catch (e) { result.value = { error: e instanceof Error ? e.message : '入库失败' } }
  finally { receiveDialog.saving = false }
}

async function handleCancelOrder(orderId: number) {
  const { error } = await cancelPurchaseOrder(orderId)
  if (!error) { fetchPending(); fetchCompleted() }
}

async function fetchPending() {
  pendingLoading.value = true
  try {
    const res = await fetchPurchaseOrders({ status: 'pending' })
    if (res.data && res.data.length > 0) {
      const orderIds = res.data.map(o => o.id)
      const { data: allItems } = await supabase
        .from('purchase_order_items')
        .select('purchase_order_id, products!left(name)')
        .in('purchase_order_id', orderIds)
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
      const { data: allItems } = await supabase
        .from('purchase_order_items')
        .select('purchase_order_id, products!left(name)')
        .in('purchase_order_id', orderIds)
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

async function viewOrder(order: PurchaseOrder & { item_summary?: string }) {
  detailOrder.value = order
  detailVisible.value = true
  const { data } = await fetchPurchaseOrderItems(order.id)
  detailItems.value = data ?? []
}

async function handleAddSupplier() {
  if (!newSupplier.value.name || addSupplierSaving.value) return
  addSupplierSaving.value = true; addSupplierSuccess.value = false
  const { data, error } = await suppliersApi.create({
    name: newSupplier.value.name,
    contact_person: newSupplier.value.contact_person || null,
    phone: newSupplier.value.phone || null,
  })
  if (!error && data) {
    suppliers.value.push(data); supplierId.value = data.id
    addSupplierSuccess.value = true
    newSupplier.value = { name: '', contact_person: '', phone: '' }
    setTimeout(() => { showAddSupplier.value = false; addSupplierSuccess.value = false }, 800)
  }
  addSupplierSaving.value = false
}

async function loadLastCostPrices() {
  const { data } = await fetchStockLots({ only_positive: false })
  for (const lot of (data ?? [])) {
    if (lot.unit_cost > 0) {
      const existing = lastCostMap.get(lot.product_id)
      if (!existing || new Date(lot.stock_in_date) > new Date(existing.date)) {
        lastCostMap.set(lot.product_id, { cost: lot.unit_cost, is_estimated: lot.is_estimated, date: lot.stock_in_date })
      }
    }
  }
}

// Drawer animation
watch(showImportForm, async (val) => {
  if (val) {
    await nextTick()
    if (drawerOverlayRef.value && drawerPanelRef.value) {
      gsap.set(drawerOverlayRef.value, { opacity: 0 })
      gsap.set(drawerPanelRef.value, { x: '100%' })
      gsap.to(drawerOverlayRef.value, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      gsap.to(drawerPanelRef.value, { x: '0%', duration: 0.35, ease: 'power3.out' })
    }
  }
})

function closeDrawer() {
  if (drawerOverlayRef.value && drawerPanelRef.value) {
    gsap.to(drawerPanelRef.value, { x: '100%', duration: 0.25, ease: 'power2.in' })
    gsap.to(drawerOverlayRef.value, {
      opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: () => { showImportForm.value = false }
    })
  } else {
    showImportForm.value = false
  }
}

onMounted(async () => {
  const [whRes, prodRes, supRes, catRes] = await Promise.all([
    fetchWarehouses(), fetchProducts({ limit: 5000 }), fetchAllSuppliers(), fetchCategories(),
  ])
  if (whRes.data) warehouses.value = whRes.data
  if (prodRes.data) allProducts.value = prodRes.data
  if (supRes.data) suppliers.value = supRes.data
  if (catRes.data) categories.value = catRes.data as any
  fetchPending(); fetchCompleted(); loadLastCostPrices()
})
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 50;
  backdrop-filter: blur(2px);
}

.drawer-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 90vw;
  background: white;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
</style>
