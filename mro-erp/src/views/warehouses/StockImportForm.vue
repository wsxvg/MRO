<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Top Bar -->
    <div class="surface px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <router-link to="/stock/in" class="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </router-link>
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-gray-900">进货入库</h1>
      </div>
      <div class="ml-auto flex items-center gap-3">
        <select v-model="warehouseId" class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
          <option :value="null">选择仓库</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
        <select v-model="supplierId" class="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
          <option :value="null">不指定供应商</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- === LEFT: Cart === -->
      <div class="w-[440px] flex-shrink-0 surface-strong flex flex-col">
        <!-- Cart Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <span class="text-sm font-semibold text-gray-900">当前进货单</span>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{{ items.length }} 件</span>
          </div>
          <button v-if="items.length > 0" class="text-xs text-red-500 hover:text-red-700 font-medium" @click="items.splice(0, items.length)">清空</button>
        </div>

        <!-- New product input -->
        <div class="px-4 pt-3 pb-2">
          <div class="flex gap-2">
            <input v-model="newProductName" type="text" class="input text-sm flex-1" placeholder="输入新商品名称（没有的商品）" @keydown.enter="addNewProduct" />
            <button class="btn-secondary text-sm px-3" @click="addNewProduct" :disabled="!newProductName.trim()">+ 添加</button>
          </div>
        </div>

        <!-- Cart Items -->
        <div v-if="items.length > 0" class="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <div v-for="(item, idx) in items" :key="item.product_id || ('new-' + idx)" class="border border-gray-100 rounded-lg p-3 space-y-2" :class="{ 'border-amber-200 bg-amber-50/50': item.is_new }">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.product_name }}</p>
                <p v-if="item.is_new" class="text-[10px] text-blue-500">新商品，将自动创建</p>
                <p v-else-if="item.specification" class="text-[10px] text-gray-400">{{ item.specification }}</p>
              </div>
              <div class="flex items-center gap-1 ml-2">
                <button class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100" @click="decrement(idx)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                </button>
                <input v-model.number="item.quantity" type="number" min="1" class="w-12 text-center text-sm border border-gray-200 rounded-md py-1" />
                <button class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100" @click="item.quantity++">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                </button>
                <button class="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1" @click="items.splice(idx, 1)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <!-- Category + Spec (new products or editable) -->
            <div v-if="item.is_new" class="grid grid-cols-2 gap-2">
              <input v-model="item.category_name" type="text" class="input text-xs" placeholder="分类" list="import-category-list" />
              <input v-model="item.specification" type="text" class="input text-xs" placeholder="规格" />
            </div>

            <!-- Prices -->
            <div class="grid grid-cols-3 gap-2">
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">售</span>
                <input v-model.number="item.selling_price" type="number" step="0.01" min="0" class="input text-xs pl-5" placeholder="售价" />
              </div>
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">进</span>
                <input v-model.number="item.unit_cost" type="number" step="0.01" min="0" class="input text-xs pl-5" placeholder="进价" @input="item.is_estimated = item.unit_cost <= 0" />
              </div>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" v-model="item.is_estimated" class="rounded border-gray-300 w-3 h-3" />
                <span class="text-[10px] text-gray-500">暂估</span>
              </label>
            </div>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p class="text-sm text-gray-400 mt-2">点击右侧商品或输入新商品名</p>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="items.length > 0" class="border-t border-gray-100 px-4 py-3 space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="isOrderedOnly" class="rounded border-gray-300" />
            <span class="text-sm text-gray-700">货还没到（仅下单）</span>
          </label>
          <div class="flex gap-2">
            <button class="btn-primary flex-1 py-3 text-base font-semibold" :disabled="saving || !canSubmit" @click="doSubmit">
              {{ saving ? '处理中...' : (isOrderedOnly ? '📦 确认下单' : '✅ 确认进货') }}
            </button>
          </div>
          <div v-if="result" class="rounded-lg p-2 text-xs" :class="result.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'">
            {{ result.error || (isOrderedOnly ? '已下单，等待到货' : '已成功入库') }}
          </div>
        </div>

        <datalist id="import-category-list">
          <option v-for="cat in categories" :key="cat.id" :value="cat.name" />
        </datalist>
      </div>

      <!-- === RIGHT: Product Browser === -->
      <div class="flex-1 surface-strong flex flex-col min-w-0">
        <!-- Search -->
        <div class="px-4 pt-4 pb-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input v-model="searchQuery" placeholder="搜索商品名称..." class="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" @input="debouncedSearch" />
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="px-4 pb-3 flex gap-1.5 overflow-x-auto flex-shrink-0">
          <button :class="selectedCategoryId === null ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors" @click="selectCategory(null)">全部</button>
          <button v-for="cat in categories" :key="cat.id" :class="selectedCategoryId === cat.id ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors" @click="selectCategory(cat.id)">{{ cat.name }}</button>
        </div>

        <!-- Product Grid -->
        <div class="flex-1 overflow-y-auto px-4 pb-4">
          <div v-if="displayProducts.length === 0" class="flex items-center justify-center h-full">
            <p class="text-sm text-gray-400">暂无商品</p>
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div v-for="p in displayProducts" :key="p.id" class="group bg-white border border-gray-200/80 rounded-2xl p-3 cursor-pointer hover:border-gray-900 hover:shadow-sm transition-all" @click="addExistingProduct(p)">
              <div class="text-sm font-medium text-gray-900 truncate">{{ p.name }}</div>
              <div class="text-xs text-gray-400 mt-0.5 truncate">{{ p.specification || '' }}</div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-sm font-semibold text-gray-900">¥{{ (p.reference_price || 0).toFixed(1) }}</span>
                <span v-if="p.cost_price > 0" class="text-[10px] text-gray-500">进¥{{ p.cost_price.toFixed(1) }}</span>
              </div>
              <div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@/composables/useDebounce'
import { useCommonStore } from '@/stores/common'
import { fetchProducts, fetchCategories, createProduct, createCategory, batchCreateStockIn, fetchWarehouses, fetchAllSuppliers, fetchStockLots } from '@/api'
import { createPurchaseOrder } from '@/api/purchaseOrders'
import type { Product, Warehouse, Supplier } from '@/types'

interface ImportItem {
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
}

const router = useRouter()
const commonStore = useCommonStore()
const saving = ref(false)
const result = ref<{ error?: string } | null>(null)
const isOrderedOnly = ref(false)

const warehouses = ref<Warehouse[]>([])
const suppliers = ref<Supplier[]>([])
const categories = ref<{ id: number; name: string }[]>([])
const warehouseId = ref<number | null>(null)
const supplierId = ref<number | null>(null)

const items = reactive<ImportItem[]>([])
const newProductName = ref('')

const displayProducts = ref<Product[]>([])
const searchQuery = ref('')
const selectedCategoryId = ref<number | null>(null)

// Cost price cache
const lastCostMap = new Map<number, { cost: number; is_estimated: boolean; date: string }>()

const canSubmit = computed(() => {
  return warehouseId.value && items.length > 0 && items.every(i => {
    if (!i.product_name.trim() || i.quantity <= 0) return false
    if (i.is_new && i.selling_price <= 0) return false
    return true
  })
})

/** Add existing product from grid */
function addExistingProduct(p: Product) {
  const existing = items.find(i => i.product_id === p.id)
  if (existing) { existing.quantity++; return }
  const lastCost = lastCostMap.get(p.id)
  items.push({
    product_id: p.id,
    product_name: p.name,
    specification: p.specification || '',
    category_id: (p as any).category_id ?? null,
    category_name: (p as any).category_name || '',
    quantity: 1,
    selling_price: p.reference_price || 0,
    unit_cost: lastCost?.cost ?? p.cost_price ?? 0,
    is_estimated: lastCost?.is_estimated ?? (p.cost_price_auto ?? true),
    is_new: false,
  })
}

/** Add new product by name */
function addNewProduct() {
  const name = newProductName.value.trim()
  if (!name) return
  // Check if already in cart
  if (items.find(i => i.product_name === name)) { newProductName.value = ''; return }
  items.push({
    product_id: null,
    product_name: name,
    specification: '',
    category_id: null,
    category_name: '',
    quantity: 1,
    selling_price: 0,
    unit_cost: 0,
    is_estimated: true,
    is_new: true,
  })
  newProductName.value = ''
}

function decrement(idx: number) {
  if (items[idx].quantity <= 1) { items.splice(idx, 1) } else { items[idx].quantity-- }
}

/** Load products from server */
async function loadProducts(opts?: { search?: string; category_id?: number; limit?: number }) {
  const params: Record<string, any> = { limit: opts?.limit ?? 30 }
  if (opts?.search) params.search = opts.search
  if (opts?.category_id) params.category_id = opts.category_id
  const res = await fetchProducts(params)
  displayProducts.value = res.data ?? []
}

function selectCategory(catId: number | null) {
  selectedCategoryId.value = catId
  searchQuery.value = ''
  loadProducts({ category_id: catId ?? undefined })
}

const debouncedSearch = useDebounceFn(() => {
  const q = searchQuery.value.trim()
  selectedCategoryId.value = null
  loadProducts(q ? { search: q, limit: 50 } : undefined)
}, 300)

async function doSubmit() {
  if (!canSubmit.value || !warehouseId.value) return
  saving.value = true; result.value = null

  try {
    // Create new products first
    for (const item of items) {
      if (item.is_new && !item.product_id) {
        let categoryId = item.category_id
        if (!categoryId && item.category_name.trim()) {
          const existing = categories.value.find(c => c.name === item.category_name.trim())
          if (existing) { categoryId = existing.id }
          else {
            const { data: catData, error: catErr } = await createCategory({ name: item.category_name.trim(), sort_order: 999 } as any)
            if (catData) { categoryId = catData.id; categories.value.push(catData as any) }
            else if (catErr && catErr.includes('已存在')) {
              const catRes = await fetchCategories()
              if (catRes.data) categories.value = catRes.data as any
              const found = categories.value.find(c => c.name === item.category_name.trim())
              if (found) categoryId = found.id
            }
          }
        }
        const { data, error } = await createProduct({
          name: item.product_name.trim(), specification: item.specification.trim() || null,
          category_id: categoryId, reference_price: item.selling_price,
          cost_price: item.unit_cost || 0, cost_price_auto: item.unit_cost <= 0,
          unit: '个', is_active: true, min_stock: 0,
        } as any)
        if (error) { result.value = { error: `创建商品「${item.product_name}」失败: ${error}` }; saving.value = false; return }
        item.product_id = data!.id
      }
    }

    if (isOrderedOnly.value) {
      const { error } = await createPurchaseOrder({
        supplier_id: supplierId.value, warehouse_id: warehouseId.value,
        items: items.map(i => ({
          product_id: i.product_id!, quantity: i.quantity,
          selling_price: i.selling_price, unit_cost: i.unit_cost || 0,
          is_estimated: i.is_estimated || i.unit_cost <= 0,
        })),
      })
      if (error) { result.value = { error } } else {
        items.splice(0, items.length); commonStore.invalidate('products')
        setTimeout(() => router.push('/stock/in'), 1000)
      }
    } else {
      const { error } = await batchCreateStockIn(items.map(i => ({
        product_id: i.product_id!, warehouse_id: warehouseId.value!,
        quantity: i.quantity, unit_cost: i.unit_cost || 0,
        is_estimated: i.is_estimated || i.unit_cost <= 0,
        supplier_id: supplierId.value, remark: null,
      })))
      if (error) { result.value = { error } } else {
        items.splice(0, items.length); commonStore.invalidate('products')
        setTimeout(() => router.push('/stock/in'), 1000)
      }
    }
  } catch (e: any) { result.value = { error: e?.message ?? '操作失败' } }
  finally { saving.value = false }
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

onMounted(async () => {
  const [whRes, supRes, catRes] = await Promise.all([
    fetchWarehouses(), fetchAllSuppliers(), fetchCategories(),
  ])
  if (whRes.data) { warehouses.value = whRes.data; warehouseId.value = whRes.data[0]?.id ?? null }
  if (supRes.data) suppliers.value = supRes.data
  if (catRes.data) categories.value = catRes.data as any
  loadProducts({ limit: 30 })
  loadLastCostPrices()
})
</script>
