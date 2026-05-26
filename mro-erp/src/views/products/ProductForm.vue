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
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
              <template v-if="isUnlocked">
                <input v-model.number="form.cost_price" type="number" step="0.01" class="input pl-20" placeholder="0.00" />
                <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600" @click="lock()">锁定</button>
              </template>
              <template v-else>
                <div class="input pl-7 pr-20 bg-gray-50 text-gray-400 flex items-center gap-2">
                  <span>****</span>
                  <button type="button" class="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap" @click="unlockCostPrice">查看成本价</button>
                </div>
              </template>
              </div>
            </div>
            <div>
              <label class="label">最低库存预警</label>
              <input v-model.number="form.min_stock" type="number" class="input" placeholder="0" />
            </div>
          </div>
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
    </div>

    <PasswordDialog
      ref="passwordDialogRef"
      :visible="showPasswordDialog"
      title="查看成本价"
      description="请输入成本价密码以解锁"
      @verified="onPasswordVerified"
      @close="onPasswordDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productsApi, categoriesApi, unitsApi, fetchWarehouses } from '@/api'
import type { Category, Unit, Warehouse } from '@/types'
import { useCostPriceAccess } from '@/composables/useCostPriceAccess'
import PasswordDialog from '@/components/PasswordDialog.vue'

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

const { isUnlocked, verify, lock } = useCostPriceAccess()

const showPasswordDialog = ref(false)
const passwordDialogRef = ref<InstanceType<typeof PasswordDialog> | null>(null)

function unlockCostPrice() {
  showPasswordDialog.value = true
}

function onPasswordVerified(pwd: string) {
  if (verify(pwd)) {
    showPasswordDialog.value = false
  } else {
    passwordDialogRef.value?.showError('密码错误')
  }
}

function onPasswordDialogClose() {
  showPasswordDialog.value = false
}

const form = reactive({
  name: '',
  specification: '',
  unit: '个',
  category_id: null as number | null,
  reference_price: 0,
  cost_price: 0,
  cost_price_auto: false,
  min_stock: 0,
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
    form.cost_price_auto = p.cost_price_auto ?? false
    form.min_stock = p.min_stock || 0
    form.remark = p.remark || ''
  }

  if (!warehousesResult.error) {
    warehouses.value = warehousesResult.data || []
  }
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
      if (props.standalone) router.push('/products')
      else emit('saved')
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