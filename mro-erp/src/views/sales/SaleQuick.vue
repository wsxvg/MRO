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
          <div v-for="(item, idx) in items" :key="item.product_id" class="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
            <!-- 毛利色条 -->
            <div v-if="marginGradient(item)" class="flex-shrink-0 flex items-center gap-1.5" :title="marginTip(item)">
              <div class="w-8 h-1.5 rounded-full overflow-hidden" :style="{ background: '#e5e7eb' }">
                <div class="h-full rounded-full transition-all duration-300" :style="{ width: marginGradient(item).pct + '%', background: marginGradient(item).color }"></div>
              </div>
              <span class="text-[11px] font-semibold" :style="{ color: marginGradient(item).color }">{{ marginGradient(item).label }}</span>
            </div>
            <span v-else class="w-1.5 h-1.5 rounded-full bg-primary-300 flex-shrink-0" title="未知进价"></span>
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
            <button class="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" @click="removeItem(idx)">
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
            <span class="text-sm text-gray-500">合计 <span class="text-gray-400">({{ itemCount }} 件)</span></span>
            <span class="text-xl font-bold text-gray-900">¥{{ total.toFixed(2) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button class="w-full btn-primary py-3 text-base font-semibold" :disabled="saving || items.length === 0" @click="handleQuickSale('paid')">
              {{ saving ? '保存中...' : '💰 收钱完成' }}
            </button>
            <button class="w-full btn-secondary py-3 text-base font-semibold" :disabled="saving || items.length === 0" @click="openCreditPopup">
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
    <div v-if="warehousePopup.visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50" @click.self="warehousePopup.visible = false">
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

    <!-- Credit Mode Popup -->
    <div v-if="creditPopup.visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50" @click.self="creditPopup.visible = false">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div class="flex justify-end -mt-2 -mr-2 mb-1">
          <button class="text-gray-400 hover:text-gray-600 p-1" @click="creditPopup.visible = false">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span class="text-2xl">📝</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">记账确认</h3>
        <p class="text-sm text-gray-500 mb-1">
          客户：<span class="font-medium text-gray-900">{{ creditPopup.customerName }}</span>
        </p>
        <p class="text-2xl font-bold text-gray-900 mb-5">¥{{ total.toFixed(2) }}</p>

        <div class="grid grid-cols-2 gap-3">
          <button class="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-900 hover:bg-gray-50 transition-colors"
            :disabled="creditPopup.saving" @click="handleCreditConfirm('picked_up')">
            ✅ 已取走
          </button>
          <button class="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-amber-500 hover:bg-amber-50 transition-colors"
            :disabled="creditPopup.saving" @click="handleCreditConfirm('delivery')">
            🚚 需要送货
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-3">「已取走」直接扣库存 · 「需要送货」稍后再扣</p>

        <div v-if="creditPopup.error" class="mt-3 text-sm text-red-600">{{ creditPopup.error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchableSelect from '@/components/SearchableSelect.vue'
import { useCommonStore } from '@/stores/common'
import { fetchDefaultWarehouse, fetchStockByProduct, createSalesOrder, saveSalesOrderItems, completeSalesOrder, completeSalesOrderWithWarehouses, deleteSalesOrder } from '@/api'
import { fetchHotProducts } from '@/api/reports'
import type { Customer, Category } from '@/types'
import { useCart } from '@/composables/useCart'
import { useCustomerPricing } from '@/composables/useCustomerPricing'
import { useProductSearch } from '@/composables/useProductSearch'
import { useStockLookup, type StockEntry } from '@/composables/useStockLookup'

const router = useRouter()
const commonStore = useCommonStore()

// Composables
const cart = useCart()
const { items, total, itemCount, calcLine, addProduct, increment, decrement, removeItem, clearCart, marginColor, marginTip, marginGradient } = cart
const pricing = useCustomerPricing(items, calcLine)
const { cacheProductPrices, getPriceForProduct, onCustomerChange } = pricing
const search = useProductSearch()
const { displayProducts, frequentProducts, searchQuery, selectedCategoryId, loadProducts, selectCategory, debouncedSearch } = search
const stock = useStockLookup()
const { hoveredProductId, productStocks, showStock, clearStockCache } = stock

// Local state
const saving = ref(false); const error = ref(''); const success = ref('')
const defaultWarehouseId = ref<number | null>(null)
const customers = ref<Customer[]>([])
const categories = ref<Category[]>([])

const form = reactive({
  customer_id: null as string | number | null,
  remark: ''
})

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

// Credit mode popup state
const creditPopup = reactive({
  visible: false,
  saving: false,
  error: '',
  customerName: '零售客户'
})

const customerOptions = computed(() => [
  { value: '', label: '默认零售' },
  ...customers.value.map(c => ({ value: c.id, label: c.name }))
])

function selectProduct(p: any) {
  const customerPrice = getPriceForProduct(p.id, p.reference_price)
  addProduct(p, customerPrice)
}

/** Fetch stock for a product (used in handleQuickSale for stock checking) */
async function fetchStockForProduct(productId: number): Promise<StockEntry[]> {
  if (productStocks[productId]) return productStocks[productId]
  const res = await fetchStockByProduct(productId)
  const stocks: StockEntry[] = (res.data ?? []).map((s: any) => ({
    warehouse_id: s.warehouse_id,
    warehouse_name: s.warehouse_name,
    quantity: s.quantity,
  }))
  productStocks[productId] = stocks
  return stocks
}

async function handleQuickSale(paymentMode: 'paid' | 'credit'): Promise<boolean> {
  if (saving.value) return false
  saving.value = true; error.value = ''; success.value = ''
  try {
    const shopId = defaultWarehouseId.value
    if (!shopId) { error.value = '未配置默认门店仓库'; saving.value = false; return false }

    // Check shop stock for each item
    const insufficient: typeof warehousePopup.items = []
    for (const item of items) {
      const stocks = await fetchStockForProduct(item.product_id)
      const shopStock = stocks.find(s => s.warehouse_id === shopId)?.quantity ?? 0
      if (shopStock < item.quantity) {
        const otherWarehouses = stocks.filter(s => s.warehouse_id !== shopId && s.quantity > 0)
        if (otherWarehouses.length === 0) {
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
      warehousePopup.items = insufficient
      warehousePopup.paymentMode = paymentMode
      warehousePopup.error = ''
      warehousePopup.visible = true
      saving.value = false
      return false
    }

    await submitOrder(shopId, paymentMode)
    return true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
    saving.value = false
    return false
  }
}

/** Open credit popup - shows customer name and total */
function openCreditPopup() {
  if (saving.value || items.length === 0) return
  const selected = customers.value.find(c => c.id === form.customer_id)
  creditPopup.customerName = selected?.name ?? '零售客户'
  creditPopup.error = ''
  creditPopup.visible = true
}

/** Handle credit popup confirmation */
async function handleCreditConfirm(mode: 'picked_up' | 'delivery') {
  creditPopup.saving = true
  creditPopup.error = ''

  const shopId = defaultWarehouseId.value
  if (!shopId) {
    creditPopup.error = '未配置默认门店仓库'
    creditPopup.saving = false
    return
  }

  try {
    if (mode === 'delivery') {
      creditPopup.visible = false
      await submitPendingOrder(shopId)
    } else {
      // handleQuickSale may open warehouse popup; only close credit popup on success
      const submitted = await handleQuickSale('credit')
      if (submitted) creditPopup.visible = false
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    creditPopup.saving = false
  }
}

async function confirmWarehouseSelection() {
  if (warehousePopup.saving) return
  warehousePopup.saving = true; warehousePopup.error = ''

  const unselected = warehousePopup.items.find(i => !i.selected_warehouse_id)
  if (unselected) {
    warehousePopup.error = `请选择「${unselected.product_name}」的出货仓库`
    warehousePopup.saving = false
    return
  }

  warehousePopup.visible = false

  try {
    const shopId = defaultWarehouseId.value!
    const warehouseMap = new Map<number, number>()
    warehouseMap.set(shopId, shopId)
    for (const item of warehousePopup.items) {
      warehouseMap.set(item.product_id, item.selected_warehouse_id!)
    }
    await submitOrder(shopId, warehousePopup.paymentMode, warehouseMap)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '出货失败'
  } finally {
    warehousePopup.saving = false
  }
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
      warehouse_id: warehouseMap?.get(i.product_id) ?? defaultWarehouseId
    }))
    const itemRes = await saveSalesOrderItems(orderId, itemData)
    if (itemRes.error) {
      // Clean up orphaned order
      await deleteSalesOrder(orderId)
      error.value = itemRes.error; saving.value = false; return
    }

    const completeRes = warehouseMap && warehouseMap.size > 0
      ? await completeSalesOrderWithWarehouses(orderId, Object.fromEntries(warehouseMap))
      : await completeSalesOrder(orderId)
    if (completeRes.error) {
      // Clean up: delete order with items (stock wasn't deducted yet)
      await deleteSalesOrder(orderId)
      error.value = completeRes.error; saving.value = false; return
    }

    clearCart()
    // Clear stock cache since quantities changed
    clearStockCache()
    // Invalidate shared caches
    commonStore.invalidate('products')
    success.value = paymentMode === 'paid' ? '收钱完成！' : '记账完成！'
    setTimeout(() => router.push('/sales'), 1000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { saving.value = false }
}

/** Create a pending order for delivery (no stock deduction) */
async function submitPendingOrder(shopId: number) {
  saving.value = true; error.value = ''; success.value = ''
  try {
    const data: Record<string, any> = {
      warehouse_id: shopId,
      total_amount: total.value,
      paid_amount: 0,
      remark: form.remark || null,
      needs_delivery: true,
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
      cost_price: i.cost_price
    }))
    const itemRes = await saveSalesOrderItems(orderId, itemData)
    if (itemRes.error) {
      await deleteSalesOrder(orderId)
      error.value = itemRes.error; saving.value = false; return
    }

    // Don't complete - keep as pending for delivery
    clearCart()
    success.value = '已创建待发货订单！'
    setTimeout(() => router.push('/sales'), 1000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { saving.value = false }
}

onMounted(async () => {
  const [defRes, cRes, catRes, hotRes] = await Promise.all([
    fetchDefaultWarehouse(),
    commonStore.getCustomers(),
    commonStore.getCategories(),
    fetchHotProducts()
  ])
  if (defRes.data) defaultWarehouseId.value = defRes.data.id
  customers.value = cRes
  categories.value = catRes

  // Build frequent products bar from hot data
  if (hotRes.data?.by_quantity) {
    const hotNames = new Set(hotRes.data.by_quantity.map(h => h.product_name))
    await loadProducts({ limit: 30 })
    if (displayProducts.value.length) {
      frequentProducts.value = displayProducts.value.filter(p => hotNames.has(p.name)).slice(0, 8)
      cacheProductPrices(displayProducts.value)
    }
  } else {
    await loadProducts({ limit: 30 })
    cacheProductPrices(displayProducts.value)
  }
})
</script>
