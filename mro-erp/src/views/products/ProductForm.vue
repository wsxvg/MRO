<template>
  <div>
    <template v-if="standalone">
      <div class="flex items-center gap-4 mb-6">
        <router-link to="/products" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '编辑商品' : '新增商品' }}</h1>
      </div>
    </template>

    <div :class="standalone ? 'max-w-2xl' : ''">
      <!-- Step 1: Basic Info -->
      <form v-if="!showStockStep" @submit.prevent="handleSubmit" class="space-y-5">
        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">1</span>
            基本信息
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">商品名称 <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" class="input" required placeholder="输入商品名称" />
            </div>
            <div>
              <label class="label">规格型号</label>
              <input v-model="form.specification" type="text" class="input" placeholder="例如 16A/250V" />
            </div>
            <div>
              <label class="label">单位 <span class="text-red-500">*</span></label>
              <select v-model="form.unit" class="input" required>
                <option v-for="u in units" :key="u.id" :value="u.name">{{ u.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">分类</label>
              <select v-model="form.category_id" class="input">
                <option value="">无分类</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">2</span>
            价格设置
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="label">售价 <span class="text-red-500">*</span></label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                <input v-model.number="form.reference_price" type="number" step="0.01" class="input pl-7" required placeholder="0.00" />
              </div>
            </div>
            <div>
              <label class="label">成本价</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                <input v-model.number="form.cost_price" type="number" step="0.01" class="input pl-7" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label class="label">最低库存预警</label>
              <input v-model.number="form.min_stock" type="number" class="input" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Stock Management (edit mode only) -->
        <div v-if="isEdit" class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-5 h-5 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            库存管理
          </h2>

          <div v-if="warehouses.length === 0" class="text-sm text-gray-400 text-center py-4">暂无仓库数据</div>

          <div v-for="w in warehouses" :key="w.id"
            class="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">{{ w.name }}</div>
              <div v-if="w.location" class="text-xs text-gray-400 truncate">{{ w.location }}</div>
            </div>
            <div class="text-xs text-gray-400 text-right min-w-[60px]">
              当前 <span class="font-semibold text-gray-700">{{ getCurrentStock(w.id) ?? 0 }}</span>
            </div>
            <div class="w-24">
              <input v-model.number="stockAdjustments[w.id]" type="number" min="0" class="input text-sm text-center"
                :placeholder="String(getCurrentStock(w.id) ?? 0)" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <button :disabled="stockSaving || !hasStockChanges" class="btn-primary btn-sm" @click="saveStockAdjustments">
              <svg v-if="stockSaving" class="animate-spin h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ stockSaving ? '保存中...' : '保存库存调整' }}
            </button>
            <span v-if="stockSaveSuccess" class="text-green-600 text-sm flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              已保存
            </span>
          </div>
          <div v-if="stockSaveError" class="text-red-600 text-sm">{{ stockSaveError }}</div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">备注</h2>
          <textarea v-model="form.remark" class="input" rows="2" placeholder="商品描述或备注..." />
        </div>

        <div v-if="error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{{ error }}</div>

        <div class="flex gap-3 pt-2">
          <button type="submit" :disabled="saving" class="btn-primary min-w-[100px] flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? '保存中...' : (isEdit ? '保存修改' : '创建商品') }}
          </button>
          <button v-if="!standalone" type="button" class="btn-secondary" @click="emit('cancel')">取消</button>
          <router-link v-else to="/products" class="btn-secondary">取消</router-link>
        </div>
      </form>

      <!-- Step 2: Initial Stock (only for new products after save) -->
      <div v-else class="space-y-5">
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">商品创建成功</h3>
              <p class="text-sm text-gray-500">「{{ form.name }}」已创建，可设置各仓库初始库存</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">3</span>
            初始库存（选填）
          </h2>
          <p class="text-sm text-gray-500">设置商品在各仓库的初始库存数量，保存后可在库存页面调整</p>

          <div v-if="warehouses.length === 0" class="text-sm text-gray-400 text-center py-4">暂无仓库，请先在仓库管理中创建</div>

          <div v-for="w in warehouses" :key="w.id"
            class="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">{{ w.name }}</div>
              <div v-if="w.location" class="text-xs text-gray-400 truncate">{{ w.location }}</div>
            </div>
            <div class="w-28">
              <input v-model.number="stockForm[w.id]" type="number" min="0" class="input text-sm text-center" placeholder="0" />
            </div>
          </div>

          <div v-if="stockSaveSuccess" class="text-green-600 text-sm font-medium flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            库存设置成功！
          </div>
          <div v-if="stockSaveError" class="text-red-600 text-sm">{{ stockSaveError }}</div>
        </div>

        <div class="flex gap-3 pt-2">
          <button :disabled="stockSaving" class="btn-primary min-w-[100px] flex items-center justify-center gap-2" @click="saveStock">
            <svg v-if="stockSaving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ stockSaving ? '保存中...' : '保存库存设置' }}
          </button>
          <button class="btn-secondary" @click="finish">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productsApi, categoriesApi, unitsApi, fetchWarehouses, createStockIn, fetchStockByProduct, createStockAdjustment } from '@/api'
import type { Category, Unit, Warehouse, Stock } from '@/types'

const props = withDefaults(defineProps<{
  standalone?: boolean
  productId?: number | null
}>(), {
  standalone: true,
  productId: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const route = useRoute()
const router = useRouter()
const isEdit = props.standalone ? !!route.params.id : !!props.productId
const categories = ref<Category[]>([])
const units = ref<Unit[]>([])
const warehouses = ref<Warehouse[]>([])
const productStocks = ref<Stock[]>([])
const saving = ref(false)
const error = ref('')

// Stock step state
const showStockStep = ref(false)
const stockForm = reactive<Record<number, number>>({})
const stockSaving = ref(false)
const stockSaveSuccess = ref(false)
const stockSaveError = ref('')
let savedProductId: number | null = null

// Edit-mode stock adjustment state
const stockAdjustments = reactive<Record<number, number>>({})

function getCurrentStock(warehouseId: number): number | undefined {
  const s = productStocks.value.find(st => st.warehouse_id === warehouseId)
  return s?.quantity
}

function initStockAdjustments() {
  for (const w of warehouses.value) {
    const existing = productStocks.value.find(s => s.warehouse_id === w.id)
    stockAdjustments[w.id] = existing?.quantity ?? 0
  }
}

const hasStockChanges = computed(() => {
  for (const w of warehouses.value) {
    const current = getCurrentStock(w.id) ?? 0
    const adjusted = stockAdjustments[w.id]
    if (adjusted !== undefined && adjusted !== current) return true
  }
  return false
})

async function saveStockAdjustments() {
  stockSaving.value = true
  stockSaveSuccess.value = false
  stockSaveError.value = ''
  const id = props.standalone ? Number(route.params.id) : props.productId!
  try {
    for (const w of warehouses.value) {
      const newQty = stockAdjustments[w.id]
      if (newQty === undefined) continue
      const current = getCurrentStock(w.id) ?? 0
      if (newQty !== current) {
        const res = await createStockAdjustment({
          product_id: id,
          warehouse_id: w.id,
          quantity: newQty
        })
        if (res.error) {
          stockSaveError.value = `仓库「${w.name}」调整失败：${res.error}`
          stockSaving.value = false
          return
        }
      }
    }
    stockSaveSuccess.value = true
    // Reload stock data
    const stockResult = await fetchStockByProduct(id)
    if (!stockResult.error) {
      productStocks.value = stockResult.data || []
    }
  } catch (e: unknown) {
    stockSaveError.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    stockSaving.value = false
  }
}

const form = reactive({
  name: '',
  specification: '',
  unit: '个',
  category_id: null as number | null,
  reference_price: 0,
  cost_price: 0,
  min_stock: 0,
  remark: '',
  barcode: ''
})

async function loadCategories() {
  const result = await categoriesApi.getAll()
  if (!result.error) categories.value = result.data || []
}

async function loadUnits() {
  const result = await unitsApi.getAll()
  if (!result.error) units.value = result.data || []
}

async function loadWarehouses() {
  const result = await fetchWarehouses()
  if (!result.error) warehouses.value = result.data || []
}

async function loadProduct() {
  if (!isEdit) return
  const id = props.standalone ? Number(route.params.id) : props.productId!

  // Load product data and warehouses in parallel
  const [result, warehousesResult] = await Promise.all([
    productsApi.getById(id),
    fetchWarehouses()
  ])

  if (!result.error && result.data) {
    const p = result.data
    form.name = p.name || ''
    form.specification = p.specification || ''
    form.unit = p.unit || '个'
    form.category_id = p.category_id
    form.reference_price = p.reference_price || 0
    form.cost_price = p.cost_price || 0
    form.min_stock = p.min_stock || 0
    form.remark = p.remark || ''
    form.barcode = p.barcode || ''
  }

  if (!warehousesResult.error) {
    warehouses.value = warehousesResult.data || []
  }

  // Load stock distribution
  const stockResult = await fetchStockByProduct(id)
  if (!stockResult.error) {
    productStocks.value = stockResult.data || []
  }

  // Init stock adjustment form
  initStockAdjustments()
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const data = {
      ...form,
      sku: form.barcode || null,
      is_active: true
    }
    const id = props.standalone ? Number(route.params.id) : props.productId!
    const result = isEdit
      ? await productsApi.update(id, data)
      : await productsApi.create(data)
    if (!result.error) {
      if (isEdit) {
        if (props.standalone) router.push('/products')
        else emit('saved')
      } else {
        // After create, show warehouse stock step
        savedProductId = result.data?.id ?? null
        if (savedProductId) {
          await loadWarehouses()
          // Initialize stock form with 0 for each warehouse
          warehouses.value.forEach(w => { stockForm[w.id] = 0 })
          showStockStep.value = true
        } else {
          if (props.standalone) router.push('/products')
          else emit('saved')
        }
      }
    } else {
      error.value = result.error || '保存失败'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally {
    saving.value = false
  }
}

async function saveStock() {
  if (!savedProductId) return
  stockSaving.value = true
  stockSaveSuccess.value = false
  stockSaveError.value = ''
  try {
    for (const w of warehouses.value) {
      const qty = stockForm[w.id] ?? 0
      if (qty > 0) {
        const res = await createStockIn({
          product_id: savedProductId,
          warehouse_id: w.id,
          quantity: qty,
          remark: '创建商品时初始入库'
        })
        if (res.error) {
          stockSaveError.value = `仓库「${w.name}」设置失败：${res.error}`
          stockSaving.value = false
          return
        }
      }
    }
    stockSaveSuccess.value = true
  } catch (e: unknown) {
    stockSaveError.value = e instanceof Error ? e.message : '保存库存失败'
  } finally {
    stockSaving.value = false
  }
}

function finish() {
  if (props.standalone) router.push('/products')
  else emit('saved')
}

watch(() => props.productId, () => {
  if (props.productId) {
    form.name = ''; form.specification = ''; form.unit = '个'
    form.category_id = null
    form.reference_price = 0; form.cost_price = 0; form.min_stock = 0
    form.remark = ''; form.barcode = ''
    showStockStep.value = false
    loadProduct()
  }
})

onMounted(() => {
  loadCategories()
  loadUnits()
  loadProduct()
})
</script>