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

    <div :class="standalone ? 'max-w-6xl' : ''">
      <div :class="isEdit ? 'flex gap-6' : 'max-w-2xl'">
      <!-- Left: Form -->
      <div :class="isEdit ? 'flex-1 min-w-0' : 'w-full'">
      <!-- Step 1: Basic Info -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
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
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                  <input v-model.number="form.cost_price" type="number" step="0.01" class="input pl-7" placeholder="0.00" />
                </div>
                <span v-if="form.cost_price_auto" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">暂估</span>
                <span v-else-if="form.cost_price > 0" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">实际</span>
              </div>
            </div>
            <div>
              <label class="label">安全库存</label>
              <div class="flex items-center gap-2">
                <input v-model.number="form.min_stock" type="number" class="input flex-1" placeholder="0"
                  @input="form.safety_stock_manual = true" />
                <span v-if="form.safety_stock_manual" class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">手动</span>
                <span v-else class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">自动</span>
                <button v-if="form.safety_stock_manual" type="button" class="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap" @click="resetToAuto">恢复自动</button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">备注</h2>
          <textarea v-model="form.remark" class="input" rows="2" placeholder="商品描述或备注..." />
        </div>

        <!-- 仓库库存 -->
        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">3</span>
            仓库库存
          </h2>
          <div v-if="!isEdit" class="text-sm text-gray-400 py-2">保存商品后可在此设置各仓库库存</div>
          <div v-else-if="warehouseStocks.length === 0" class="text-sm text-gray-400 py-2">暂无仓库</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2 font-medium">仓库</th>
                <th class="pb-2 font-medium text-right">当前库存</th>
                <th class="pb-2 font-medium text-right" style="width:160px">调整为</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ws in warehouseStocks" :key="ws.warehouse_id" class="border-b border-gray-50">
                <td class="py-2 font-medium text-gray-900">{{ ws.warehouse_name }}</td>
                <td class="py-2 text-right text-gray-600">{{ ws.current_quantity }}</td>
                <td class="py-2 text-right">
                  <input v-model.number="ws.new_quantity" type="number" min="0" class="input text-sm text-right w-32" />
                </td>
              </tr>
            </tbody>
          </table>
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
      </div>

      <!-- Right: Similar Products Pricing Reference -->
      <div v-if="isEdit && similarProducts.length > 0" class="w-80 flex-shrink-0 hidden lg:block">
        <div class="bg-white rounded-xl border border-gray-100 p-5 sticky top-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            同类商品参考
          </h3>

          <div class="text-xs text-gray-500 mb-3">
            分类：{{ currentCategoryName || '未分类' }}（{{ similarProducts.length }} 个商品）
          </div>

          <!-- Similar products list -->
          <div class="space-y-1.5 max-h-[400px] overflow-y-auto">
            <div v-for="sp in similarProducts" :key="sp.id"
              class="flex items-center justify-between py-1.5 px-2 rounded text-xs"
              :class="sp.id === Number(route.params.id) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'">
              <div class="min-w-0 flex-1">
                <span class="truncate block" :class="sp.id === Number(route.params.id) ? 'font-semibold text-primary-700' : 'text-gray-900'">
                  {{ sp.name }}
                </span>
                <span v-if="sp.specification" class="text-gray-400 truncate block">{{ sp.specification }}</span>
              </div>
              <div class="text-right flex-shrink-0 ml-2">
                <span class="font-medium text-gray-900">¥{{ (sp.reference_price || 0).toFixed(2) }}</span>
                <span v-if="sp.margin > 0" class="block text-gray-400">毛利 {{ sp.margin.toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productsApi, categoriesApi, unitsApi, fetchWarehouses, fetchStocks, createStockAdjustment } from '@/api'
import type { Category, Unit, Warehouse } from '@/types'

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
const saving = ref(false)
const error = ref('')

interface WarehouseStock {
  warehouse_id: number
  warehouse_name: string
  current_quantity: number
  new_quantity: number
}
const warehouseStocks = ref<WarehouseStock[]>([])

interface SimilarProduct {
  id: number
  name: string
  specification: string | null
  reference_price: number
  cost_price: number
  margin: number
}
const similarProducts = ref<SimilarProduct[]>([])
const currentCategoryName = ref('')
const avgSimilarPrice = computed(() => {
  // 只用列表中显示的商品计算均价，排除当前商品和售价为0的
  const prices = similarProducts.value
    .filter(p => p.id !== Number(route.params.id) && p.reference_price > 0)
    .map(p => p.reference_price)
  return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
})

const form = reactive({
  name: '',
  specification: '',
  unit: '个',
  category_id: null as number | null,
  reference_price: 0,
  cost_price: 0,
  cost_price_auto: false,
  min_stock: 0,
  safety_stock_manual: false,
  remark: ''
})

async function loadCategories() {
  const result = await categoriesApi.getAll()
  if (!result.error) categories.value = result.data || []
}

async function loadUnits() {
  const result = await unitsApi.getAll()
  if (!result.error) units.value = result.data || []
}

async function loadProduct() {
  // Always load warehouses
  const warehousesResult = await fetchWarehouses()
  if (!warehousesResult.error) {
    warehouses.value = warehousesResult.data || []
  }

  if (!isEdit) return
  const id = props.standalone ? Number(route.params.id) : props.productId!

  // Load product data
  const result = await productsApi.getById(id)
  if (!result.error && result.data) {
    const p = result.data
    form.name = p.name || ''
    form.specification = p.specification || ''
    form.unit = p.unit || '个'
    form.category_id = p.category_id
    form.reference_price = p.reference_price || 0
    form.cost_price = p.cost_price || 0
    form.cost_price_auto = p.cost_price_auto ?? false
    form.min_stock = p.min_stock || 0
    form.safety_stock_manual = p.safety_stock_manual ?? false
    form.remark = p.remark || ''
  }

  // Load stock per warehouse for this product
  const stockRes = await fetchStocks({ product_id: id })
  const stockMap = new Map<number, number>()
  for (const s of (stockRes.data ?? [])) {
    stockMap.set(s.warehouse_id, s.quantity)
  }
  warehouseStocks.value = warehouses.value.map(w => ({
    warehouse_id: w.id,
    warehouse_name: w.name,
    current_quantity: stockMap.get(w.id) ?? 0,
    new_quantity: stockMap.get(w.id) ?? 0,
  }))

  // Load similar products (same category)
  if (form.category_id) {
    const cat = categories.value.find(c => c.id === form.category_id)
    currentCategoryName.value = cat?.name || '未分类'
    const { data: allProducts } = await productsApi.getAll({ category_id: form.category_id, limit: 50 })
    similarProducts.value = (allProducts ?? [])
      .filter(p => p.id !== id)
      .map(p => ({
        id: p.id,
        name: p.name,
        specification: p.specification,
        reference_price: p.reference_price || 0,
        cost_price: p.cost_price || 0,
        margin: p.reference_price > 0 && p.cost_price > 0
          ? ((p.reference_price - p.cost_price) / p.reference_price * 100)
          : 0,
      }))
      .sort((a, b) => b.reference_price - a.reference_price)
  }
}

function resetToAuto() {
  form.safety_stock_manual = false
  form.min_stock = 0
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const refPrice = Number(form.reference_price) || 0
    const costPrice = Number(form.cost_price) || 0
    // Auto-calculate cost_price if not provided
    let finalCostPrice = costPrice
    let finalAutoFlag = form.cost_price_auto
    if (costPrice <= 0 && refPrice > 0) {
      finalCostPrice = Math.round((refPrice / 1.3) * 100) / 100
      finalAutoFlag = true
    }
    const data = {
      ...form,
      reference_price: refPrice,
      cost_price: finalCostPrice,
      cost_price_auto: finalAutoFlag,
      min_stock: Number(form.min_stock) || 0,
      is_active: true
    }
    const id = props.standalone ? Number(route.params.id) : props.productId!
    const result = isEdit
      ? await productsApi.update(id, data)
      : await productsApi.create(data)
    if (!result.error) {
      // Save warehouse stock adjustments for existing products
      if (isEdit && warehouseStocks.value.length > 0) {
        for (const ws of warehouseStocks.value) {
          if (ws.new_quantity !== ws.current_quantity) {
            await createStockAdjustment({
              product_id: id,
              warehouse_id: ws.warehouse_id,
              quantity: ws.new_quantity,
            })
          }
        }
      }
      if (props.standalone) {
        // New product → go to edit page so user can set stock
        if (!isEdit && result.data?.id) {
          router.push(`/products/${result.data.id}`)
        } else {
          router.push('/products')
        }
      } else {
        emit('saved')
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

// If user manually edits cost_price while in auto mode → disable auto mark
watch(() => form.cost_price, (newVal) => {
  if (form.cost_price_auto && newVal > 0) {
    form.cost_price_auto = false
  }
})

watch(() => props.productId, () => {
  if (props.productId) {
    form.name = ''; form.specification = ''; form.unit = '个'
    form.category_id = null
    form.reference_price = 0; form.cost_price = 0; form.cost_price_auto = false; form.min_stock = 0
    form.safety_stock_manual = false
    form.remark = ''
    loadProduct()
  }
})

onMounted(() => {
  loadCategories()
  loadUnits()
  loadProduct()
})
</script>