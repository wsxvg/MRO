<template>
  <div class="h-full flex flex-col">
    <!-- Top Bar -->
    <div class="flex items-center gap-3 mb-4 flex-shrink-0">
      <router-link to="/sales" class="text-gray-500 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-xl font-bold text-gray-900">快速收银</h1>
      <div class="ml-auto flex items-center gap-3">
        <select v-model="form.customer_id" class="input text-sm py-1.5 w-44" required>
          <option value="">客户: 散客</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="form.warehouse_id" class="input text-sm py-1.5 w-40" required>
          <option value="">仓库: 请选择</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </div>
    </div>

    <!-- Main Content: Left Cart + Right Products -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- === LEFT: Shopping Cart === -->
      <div class="w-[420px] flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
        <!-- Cart Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span class="text-sm font-semibold text-gray-900">当前订单</span>
            <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{{ items.length }} 件</span>
          </div>
          <button v-if="items.length > 0" class="text-xs text-red-500 hover:text-red-700 font-medium" @click="clearCart">
            清空
          </button>
        </div>

        <!-- Cart Items (scrollable) -->
        <div v-if="items.length > 0" class="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div v-for="(item, idx) in items" :key="idx" class="flex items-center gap-2 py-2.5 border-b border-gray-50 last:border-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ item.product_name }}</p>
              <p class="text-xs text-gray-400">¥{{ item.unit_price?.toFixed(2) }}</p>
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

          <!-- Payment Methods -->
          <div>
            <div class="flex gap-2">
              <button :class="form.payment_method === 'cash' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors" @click="form.payment_method = 'cash'">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                现金
              </button>
              <button :class="form.payment_method === 'wechat' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors" @click="form.payment_method = 'wechat'">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045.246.246 0 00.241-.245c0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 01.177-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 2.164c.535 0 .968.44.968.982a.975.975 0 01-.968.983.975.975 0 01-.969-.983c0-.542.434-.982.969-.982zm4.36 0c.535 0 .969.44.969.982a.975.975 0 01-.969.983.975.975 0 01-.968-.983c0-.542.433-.982.968-.982z"/></svg>
                微信
              </button>
              <button :class="form.payment_method === 'alipay' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors" @click="form.payment_method = 'alipay'">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.422 15.358c-3.22-1.386-6.847-2.904-9.926-4.266 1.871-2.025 3.955-5.183 3.034-6.91-.767-1.44-3.753-1.267-5.307.176-1.493 1.39-2.07 3.531-1.49 5.976-2.896 1.32-5.762 2.71-8.083 3.869-.384.192-.59.443-.488.725.126.35.661.45 1.193.39.16-.044.574-.15.574-.15l6.564-2.278c.306.164.627.336.961.514-1.316 2.849-2.855 6.332-2.96 6.594-1.135 2.779-1.583 2.043-3.251.14l-.03 1.517c.916 1.259 3.105 3.55 5.64 3.55 2.267 0 3.957-1.983 5.653-4.36 1.364-1.906 2.743-4.164 4.228-6.647 1.108.495 2.043.914 2.624 1.173.142.076.421.172.705.172.548 0 1.015-.386 1.015-.973 0-.24-.111-.472-.328-.648zm-10.95-6.56c-.192-1.364.194-2.718.882-3.426.537-.557 1.47-.919 2.113-.74.168.542.117 1.647-.709 2.908-.606.922-1.459 1.67-2.286 1.258z"/></svg>
                支付宝
              </button>
              <button :class="form.payment_method === 'transfer' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors" @click="form.payment_method = 'transfer'">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                挂账
              </button>
            </div>
          </div>

          <!-- Complete Sale -->
          <button class="w-full btn bg-gray-900 text-white hover:bg-gray-800 border-0 py-3 text-base font-semibold" :disabled="saving || items.length === 0 || !form.customer_id || !form.warehouse_id" @click="handleQuickSale">
            {{ saving ? '保存中...' : '✓ 完成销售' }}
          </button>
        </div>

        <div v-if="error" class="px-4 pb-2 text-red-600 text-sm">{{ error }}</div>
        <div v-if="success" class="px-4 pb-2 text-green-600 text-sm font-medium">{{ success }}</div>
      </div>

      <!-- === RIGHT: Product Browser === -->
      <div class="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col min-w-0">
        <!-- Search -->
        <div class="px-4 pt-4 pb-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input v-model="searchQuery" placeholder="搜索商品名称 / SKU..." class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" @input="debouncedSearch" />
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="px-4 pb-3 flex gap-1.5 overflow-x-auto flex-shrink-0">
          <button :class="selectedCategoryId === null ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="selectedCategoryId = null">
            全部
          </button>
          <button v-for="cat in categories" :key="cat.id" :class="selectedCategoryId === cat.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="selectedCategoryId = cat.id">
            {{ cat.name }}
          </button>
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
            <div v-for="p in displayProducts" :key="p.id" class="group relative bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-gray-900 hover:shadow-sm transition-all" @click="selectProduct(p)">
              <div class="text-sm font-medium text-gray-900 truncate group-hover:text-gray-900">{{ p.name }}</div>
              <div class="text-xs text-gray-400 mt-0.5 truncate">{{ p.sku || '' }} {{ p.specification || '' }}</div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-sm font-bold text-gray-900">¥{{ (p.reference_price || 0).toFixed(1) }}</span>
                <span class="text-[10px] text-gray-400">库存:{{ p.stock_quantity ?? '-' }}</span>
              </div>
              <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Note / Remark -->
    <div class="flex-shrink-0 mt-3 flex items-center gap-3">
      <input v-model="form.remark" placeholder="备注（可选）" class="input text-sm py-1.5 flex-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchCustomers } from '@/api'
import { fetchWarehouses } from '@/api'
import { fetchProducts, fetchCategories } from '@/api'
import { createSalesOrder, saveSalesOrderItems, completeSalesOrder, createPayment } from '@/api'
import type { Customer, Warehouse, Product, Category } from '@/types'

const router = useRouter()
const saving = ref(false); const error = ref(''); const success = ref('')
const customers = ref<Customer[]>([])
const warehouses = ref<Warehouse[]>([])
const categories = ref<Category[]>([])
const allProducts = ref<Product[]>([])
const searchQuery = ref('')
const searchResults = ref<Product[]>([])
const selectedCategoryId = ref<number | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const form = reactive({
  customer_id: null as number | null,
  warehouse_id: null as number | null,
  payment_method: 'cash' as string,
  remark: ''
})

const items = reactive<{ product_id: number; product_name: string; quantity: number; unit_price: number; cost_price: number; line_total: number }[]>([])

const total = computed(() => items.reduce((s, i) => s + (i.line_total || 0), 0))

/** Products to show in the grid: either search results or category-filtered list */
const displayProducts = computed(() => {
  if (searchQuery.value.trim()) {
    return searchResults.value
  }
  if (selectedCategoryId.value !== null) {
    return allProducts.value.filter(p => p.category_id === selectedCategoryId.value)
  }
  return allProducts.value
})

function selectProduct(p: Product) {
  const existing = items.find(i => i.product_id === p.id)
  if (existing) {
    existing.quantity++
    calcLine(items.indexOf(existing))
  } else {
    items.push({
      product_id: p.id,
      product_name: p.name,
      quantity: 1,
      unit_price: p.reference_price || 0,
      cost_price: p.cost_price || 0,
      line_total: p.reference_price || 0
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

function calcLine(idx: number) {
  items[idx].line_total = (items[idx].quantity || 0) * (items[idx].unit_price || 0)
}

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    doSearch()
  }, 300)
}

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) { searchResults.value = []; return }
  const res = await fetchProducts({ search: q })
  if (res.data) {
    searchResults.value = res.data
  }
}

async function handleQuickSale() {
  saving.value = true; error.value = ''; success.value = ''
  try {
    const data = {
      customer_id: form.customer_id!,
      warehouse_id: form.warehouse_id!,
      total_amount: total.value,
      paid_amount: total.value,
      remark: form.remark || null,
      status: 'completed'
    } as any
    const orderRes = await createSalesOrder(data)
    if (!orderRes.data) { error.value = orderRes.error || '保存失败'; return }

    const orderId = orderRes.data.id
    const itemData = items.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.cost_price
    }))
    const itemRes = await saveSalesOrderItems(orderId, itemData)
    if (itemRes.error) { error.value = itemRes.error; return }

    // Create payment record
    await createPayment({
      sales_order_id: orderId,
      amount: total.value,
      payment_method: form.payment_method as any,
      paid_at: new Date().toISOString(),
      remark: null
    })

    const completeRes = await completeSalesOrder(orderId)
    if (completeRes.error) { error.value = completeRes.error; return }

    success.value = '销售完成！'
    setTimeout(() => router.push('/sales'), 1000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { saving.value = false }
}

onMounted(async () => {
  const [cRes, wRes, pRes, catRes] = await Promise.all([
    fetchCustomers({}),
    fetchWarehouses(),
    fetchProducts({}),
    fetchCategories()
  ])
  if (cRes.data) customers.value = cRes.data
  if (wRes.data) warehouses.value = wRes.data
  if (pRes.data) allProducts.value = pRes.data
  if (catRes.data) categories.value = catRes.data
})
</script>
