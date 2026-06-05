<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Top Bar -->
    <div class="surface px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <router-link to="/sales" class="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-gray-900">销售商品</h1>
      </div>
      <div class="ml-auto flex items-center gap-3">
        <SearchableSelect :options="customerOptions" v-model="form.customer_id" placeholder="客户: 默认零售" class="w-44" @update:model-value="onCustomerChange" />
      </div>
    </div>

    <!-- Main Content: Left Cart + Right Products -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- === LEFT: Shopping Cart === -->
      <div class="w-[420px] flex-shrink-0 surface-strong flex flex-col">
        <!-- Cart Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span class="text-sm font-semibold text-gray-900">当前订单</span>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{{ items.length }} 件</span>
          </div>
          <button v-if="items.length > 0" class="text-xs text-red-500 hover:text-red-700 font-medium" @click="clearCart">
            清空
          </button>
        </div>

        <!-- Cart Items (scrollable) -->
        <div v-if="items.length > 0" class="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div v-for="(item, idx) in items" :key="idx" class="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
            <span v-if="item.cost_price > 0 && item.unit_price < item.cost_price"
              class="text-sm flex-shrink-0" title="💀 低于进价！">💀</span>
            <span v-else
              class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="marginColor(item)" :title="marginTip(item)"></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ item.product_name }}</p>
              <div class="flex items-center gap-1 mt-0.5">
                <span class="text-xs text-gray-400">¥</span>
                <input v-model.number="item.unit_price" type="number" step="0.01" min="0"
                  class="w-16 text-xs text-gray-600 border-b border-dashed border-gray-300 focus:border-primary-500 focus:outline-none bg-transparent pb-0.5"
                  @input="calcLine(idx)" />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors" @click="decrement(idx)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
              </button>
              <input v-model.number="item.quantity" type="number" min="1" class="w-12 text-center text-sm border border-gray-200 rounded-md py-1.5" @input="calcLine(idx)" />
              <button class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors" @click="increment(idx)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div class="w-24 text-right">
              <p class="text-sm font-semibold text-gray-900">¥{{ (item.line_total || 0).toFixed(2) }}</p>
            </div>
            <button class="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" @click="items.splice(idx, 1)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <p class="text-sm text-gray-400 mt-2">点击右侧商品添加</p>
          </div>
        </div>

        <!-- Cart Footer: Total + Payment + Submit -->
        <div v-if="items.length > 0" class="border-t border-gray-100 px-4 py-3 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">合计 <span class="text-gray-400">({{ items.reduce((s, i) => s + (i.quantity || 0), 0) }} 件)</span></span>
            <span class="text-xl font-bold text-gray-900">¥{{ total.toFixed(2) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button class="w-full btn-primary py-3 text-base font-semibold" :disabled="saving || items.length === 0" @click="handleQuickSale('paid')">
              {{ saving ? '保存中...' : '💰 收钱完成' }}
            </button>
            <button class="w-full btn-secondary py-3 text-base font-semibold" :disabled="saving || items.length === 0" @click="handleQuickSale('credit')">
              {{ saving ? '保存中...' : '📝 记账' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="px-4 pb-2 text-red-600 text-sm">{{ error }}</div>
        <div v-if="success" class="px-4 pb-2 text-green-600 text-sm font-medium">{{ success }}</div>
      </div>

      <!-- === RIGHT: Product Browser === -->
      <div class="flex-1 surface-strong flex flex-col min-w-0">
        <!-- Search -->
        <div class="px-4 pt-4 pb-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" placeholder="搜索商品名称..." class="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" @input="debouncedSearch" />
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="px-4 pb-3 flex gap-1.5 overflow-x-auto flex-shrink-0">
          <button :class="selectedCategoryId === null ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors" @click="selectCategory(null)">
            全部
          </button>
          <button v-for="cat in categories" :key="cat.id" :class="selectedCategoryId === cat.id ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors" @click="selectCategory(cat.id)">
            {{ cat.name }}
          </button>
        </div>

        <!-- Frequent Products -->
        <div v-if="!searchQuery && frequentProducts.length > 0" class="px-4 pb-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-medium text-gray-500">常用商品</span>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button v-for="p in frequentProducts" :key="p.id"
              class="flex-shrink-0 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
              @click="selectProduct(p)">
              {{ p.name }} ¥{{ (p.reference_price || 0).toFixed(0) }}
            </button>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <div v-if="displayProducts.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p class="text-sm text-gray-400 mt-2">暂无商品</p>
            </div>
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div v-for="p in displayProducts" :key="p.id" class="group relative bg-white border border-gray-200/80 rounded-2xl p-3 cursor-pointer hover:border-gray-900 hover:shadow-sm transition-all" @click="selectProduct(p)" @mouseenter="showStock(p.id)" @mouseleave="hoveredProductId = null">
              <div class="text-sm font-medium text-gray-900 truncate group-hover:text-gray-900">{{ p.name }}</div>
              <div class="text-xs text-gray-400 mt-0.5 truncate">{{ p.specification || '' }}</div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-sm font-semibold text-gray-900">¥{{ (p.reference_price || 0).toFixed(1) }}</span>
                <span class="text-[10px] text-gray-500">库存:{{ p.stock_quantity ?? '-' }}</span>
              </div>
              <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <!-- Per-Warehouse Stock Tooltip -->
              <div v-if="hoveredProductId === p.id && productStocks[p.id]?.length" class="absolute z-50 left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                <div class="font-medium mb-1 text-gray-300">各仓库库存</div>
                <div v-for="s in productStocks[p.id]" :key="s.warehouse_id" class="flex justify-between gap-3">
                  <span>{{ s.warehouse_name }}</span>
                  <span :class="s.quantity < 0 ? 'text-red-400' : 'text-green-300'">{{ s.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Note / Remark -->
    <div class="flex-shrink-0 mt-1 flex items-center gap-3">
      <input v-model="form.remark" placeholder="备注（可选）" class="input text-sm py-2 flex-1" />
    </div>

    <!-- Warehouse Selection Popup (when shop stock insufficient) -->
    <div v-if="warehousePopup.visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">门店库存不足</h3>
        <p class="text-sm text-gray-500 mb-4">以下商品需要从仓库补货，请选择从哪个仓库扣减：</p>

        <div class="space-y-3 max-h-60 overflow-y-auto">
          <div v-for="item in warehousePopup.items" :key="item.product_id" class="border border-gray-100 rounded-xl p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900">{{ item.product_name }}</span>
              <span class="text-xs text-gray-500">需 {{ item.quantity }} 个（门店剩 {{ item.shop_stock }}）</span>
            </div>
            <div class="flex gap-2">
              <button v-for="wh in item.available_warehouses" :key="wh.warehouse_id"
                class="flex-1 px-3 py-2 text-sm rounded-lg border-2 transition-colors"
                :class="item.selected_warehouse_id === wh.warehouse_id
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'"
                @click="item.selected_warehouse_id = wh.warehouse_id">
                {{ wh.warehouse_name }}
                <span class="block text-xs mt-0.5" :class="item.selected_warehouse_id === wh.warehouse_id ? 'text-gray-300' : 'text-gray-400'">
                  库存 {{ wh.quantity }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="warehousePopup.error" class="mt-3 text-sm text-red-600">{{ warehousePopup.error }}</div>

        <div class="flex gap-3 justify-end mt-5">
          <button class="btn-secondary" @click="warehousePopup.visible = false">取消</button>
          <button class="btn-primary" :disabled="warehousePopup.saving" @click="confirmWarehouseSelection">
            {{ warehousePopup.saving ? '处理中...' : '确认出货' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchableSelect from '@/components/SearchableSelect.vue'
import { useDebounceFn } from '@/composables/useDebounce'
import { fetchCustomers, fetchCustomerPrices } from '@/api'
import { fetchDefaultWarehouse, fetchStockByProduct } from '@/api'
import { fetchProducts, fetchCategories } from '@/api'
import { createSalesOrder, saveSalesOrderItems, completeSalesOrder, completeSalesOrderWithWarehouses } from '@/api'
import { fetchHotProducts } from '@/api/reports'
import type { Customer, Product, Category } from '@/types'

const router = useRouter()
const saving = ref(false); const error = ref(''); const success = ref('')
const defaultWarehouseId = ref<number | null>(null)
const customers = ref<Customer[]>([])
const categories = ref<Category[]>([])
const displayProducts = ref<Product[]>([])
const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)
const hoveredProductId = ref<number | null>(null)
const frequentProducts = ref<Product[]>([])
const productsLoading = ref(false)
const customerPricesMap = new Map<number, number>()
const productStocks = reactive<Record<number, { warehouse_id: number; warehouse_name: string; quantity: number }[]>>({})

const form = reactive({
  customer_id: null as string | number | null,
  remark: ''
})

const items = reactive<{ product_id: number; product_name: string; quantity: number; unit_price: number; cost_price: number; line_total: number }[]>([])

const total = computed(() => items.reduce((s, i) => s + (i.line_total || 0), 0))

// Warehouse selection popup state
const warehousePopup = reactive({
  visible: false,
  saving: false,
  error: '',
  paymentMode: 'paid' as 'paid' | 'credit',
  items: [] as Array<{
    product_id: number
    product_name: string
    quantity: number
    shop_stock: number
    selected_warehouse_id: number | null
    available_warehouses: Array<{ warehouse_id: number; warehouse_name: string; quantity: number }>
  }>
})

const customerOptions = computed(() => [
  { value: '', label: '默认零售' },
  ...customers.value.map(c => ({ value: c.id, label: c.name }))
])

/** Load products from server with optional filters */
async function loadProducts(opts?: { search?: string; category_id?: number; limit?: number }) {
  productsLoading.value = true
  const params: Record<string, any> = { limit: opts?.limit ?? 30 }
  if (opts?.search) params.search = opts.search
  if (opts?.category_id) params.category_id = opts.category_id
  const res = await fetchProducts(params)
  displayProducts.value = res.data ?? []
  productsLoading.value = false
}

/** Switch category tab */
function selectCategory(categoryId: number | null) {
  selectedCategoryId.value = categoryId
  searchQuery.value = ''
  loadProducts({ category_id: categoryId ?? undefined })
}

function selectProduct(p: Product) {
  const existing = items.find(i => i.product_id === p.id)
  if (existing) {
    existing.quantity++
    calcLine(items.indexOf(existing))
  } else {
    const customerPrice = customerPricesMap.get(p.id)
    const price = customerPrice ?? p.reference_price ?? 0
    items.push({
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      unit_price: price,
      cost_price: p.cost_price || 0,
      line_total: price
    })
  }
}

function increment(idx: number) {
  items[idx].quantity++
  calcLine(idx)
}

function decrement(idx: number) {
  if (items[idx].quantity <= 1) {
    items.splice(idx, 1)
  } else {
    items[idx].quantity--
    calcLine(idx)
  }
}

function clearCart() {
  items.splice(0, items.length)
}

function marginColor(item: { unit_price: number; cost_price: number }): string {
  if (item.cost_price <= 0) return 'bg-gray-300'
  if (item.unit_price < item.cost_price) return 'bg-gray-900'
  const margin = (item.unit_price - item.cost_price) / item.unit_price
  if (margin >= 0.3) return 'bg-green-500'
  if (margin >= 0.1) return 'bg-amber-400'
  return 'bg-red-500'
}

function marginTip(item: { unit_price: number; cost_price: number; product_name: string }): string {
  if (item.cost_price <= 0) return '未知进价'
  if (item.unit_price < item.cost_price) return '💀 低于进价！'
  const margin = ((item.unit_price - item.cost_price) / item.unit_price * 100).toFixed(0)
  return `毛利 ${margin}%`
}

async function onCustomerChange(customerId: string | number | null) {
  customerPricesMap.clear()
  if (!customerId) return
  const { data } = await fetchCustomerPrices(Number(customerId))
  if (data) {
    for (const cp of data) {
      customerPricesMap.set(cp.product_id, cp.price)
    }
    for (const item of items) {
      const cp = customerPricesMap.get(item.product_id)
      if (cp !== undefined) {
        item.unit_price = cp
        calcLine(items.indexOf(item))
      }
    }
  }
}

function calcLine(idx: number) {
  items[idx].line_total = (items[idx].quantity || 0) * (items[idx].unit_price || 0)
}

const debouncedSearch = useDebounceFn(() => doSearch(), 300)

async function showStock(productId: number) {
  hoveredProductId.value = productId
  if (productStocks[productId]) return
  const res = await fetchStockByProduct(productId)
  if (res.data) {
    productStocks[productId] = res.data.map((s: any) => ({
      warehouse_id: s.warehouse_id,
      warehouse_name: s.warehouse_name,
      quantity: s.quantity
    }))
  }
}

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    // Clear search, reload default or current category
    selectedCategoryId.value = null
    loadProducts()
    return
  }
  selectedCategoryId.value = null
  loadProducts({ search: q, limit: 50 })
}

async function handleQuickSale(paymentMode: 'paid' | 'credit') {
  if (saving.value) return
  saving.value = true; error.value = ''; success.value = ''
  try {
    const shopId = defaultWarehouseId.value
    if (!shopId) { error.value = '未配置默认门店仓库'; saving.value = false; return }

    // Check shop stock for each item
    const insufficient: typeof warehousePopup.items = []
    for (const item of items) {
      const stocks = productStocks[item.product_id] || await fetchStockByProduct(item.product_id).then(r => (r.data ?? []).map((s: any) => ({ warehouse_id: s.warehouse_id, warehouse_name: s.warehouse_name, quantity: s.quantity })))
      if (!productStocks[item.product_id] && stocks.length) {
        productStocks[item.product_id] = stocks as any
      }
      const shopStock = stocks.find((s: any) => s.warehouse_id === shopId)?.quantity ?? 0
      if (shopStock < item.quantity) {
        const otherWarehouses = stocks.filter((s: any) => s.warehouse_id !== shopId && s.quantity > 0)
        if (otherWarehouses.length === 0) {
          // No warehouse has stock either — proceed anyway (allow negative)
          continue
        }
        insufficient.push({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          shop_stock: shopStock,
          selected_warehouse_id: otherWarehouses[0].warehouse_id,
          available_warehouses: otherWarehouses as any
        })
      }
    }

    if (insufficient.length > 0) {
      // Show warehouse selection popup
      warehousePopup.items = insufficient
      warehousePopup.paymentMode = paymentMode
      warehousePopup.error = ''
      warehousePopup.visible = true
      saving.value = false
      return
    }

    // All items have enough shop stock — proceed directly
    await submitOrder(shopId, paymentMode)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
    saving.value = false
  }
}

async function confirmWarehouseSelection() {
  if (warehousePopup.saving) return
  warehousePopup.saving = true; warehousePopup.error = ''

  // Check all items have a selected warehouse
  const unselected = warehousePopup.items.find(i => !i.selected_warehouse_id)
  if (unselected) {
    warehousePopup.error = `请选择「${unselected.product_name}」的出货仓库`
    warehousePopup.saving = false
    return
  }

  warehousePopup.visible = false

  // Build warehouse mapping: product_id → warehouse_id
  const shopId = defaultWarehouseId.value!
  const warehouseMap = new Map<number, number>()
  warehouseMap.set(shopId, shopId) // default to shop
  for (const item of warehousePopup.items) {
    warehouseMap.set(item.product_id, item.selected_warehouse_id!)
  }

  await submitOrder(shopId, warehousePopup.paymentMode, warehouseMap)
}

async function submitOrder(
  defaultWarehouseId: number,
  paymentMode: 'paid' | 'credit',
  warehouseMap?: Map<number, number>
) {
  saving.value = true; error.value = ''; success.value = ''
  try {
    const data: Record<string, any> = {
      warehouse_id: defaultWarehouseId,
      total_amount: total.value,
      paid_amount: paymentMode === 'paid' ? total.value : 0,
      remark: form.remark || null,
      needs_delivery: false,
      status: 'pending'
    }
    if (form.customer_id) {
      data.customer_id = form.customer_id
    }
    const orderRes = await createSalesOrder(data as any)
    if (!orderRes.data) { error.value = orderRes.error || '保存失败'; saving.value = false; return }

    const orderId = orderRes.data.id
    const itemData = items.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.cost_price,
      // Use specific warehouse if mapped, otherwise default
      warehouse_id: warehouseMap?.get(i.product_id) ?? defaultWarehouseId
    }))
    const itemRes = await saveSalesOrderItems(orderId, itemData)
    if (itemRes.error) { error.value = itemRes.error; saving.value = false; return }

    const completeRes = warehouseMap && warehouseMap.size > 0
      ? await completeSalesOrderWithWarehouses(orderId, Object.fromEntries(warehouseMap))
      : await completeSalesOrder(orderId)
    if (completeRes.error) { error.value = completeRes.error; saving.value = false; return }

    items.splice(0, items.length)
    success.value = paymentMode === 'paid' ? '收钱完成！' : '记账完成！'
    setTimeout(() => router.push('/sales'), 1000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { saving.value = false }
}

onMounted(async () => {
  const [defRes, cRes, catRes, hotRes] = await Promise.all([
    fetchDefaultWarehouse(),
    fetchCustomers({}),
    fetchCategories(),
    fetchHotProducts()
  ])
  if (defRes.data) defaultWarehouseId.value = defRes.data.id
  if (cRes.data) customers.value = cRes.data
  if (catRes.data) categories.value = catRes.data

  // Build frequent products bar from hot data
  if (hotRes.data?.by_quantity) {
    const hotNames = new Set(hotRes.data.by_quantity.map(h => h.product_name))
    const hotProductRes = await fetchProducts({ limit: 30 })
    if (hotProductRes.data) {
      frequentProducts.value = hotProductRes.data.filter(p => hotNames.has(p.name)).slice(0, 8)
      displayProducts.value = hotProductRes.data.slice(0, 30)
    }
  } else {
    await loadProducts({ limit: 30 })
  }
})
</script>
