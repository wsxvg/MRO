<template>
  <div class="max-w-5xl mx-auto py-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/sales" class="text-gray-500 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '销售单详情' : '新增销售单' }}</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: 商品明细 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">1</span>
            商品明细
          </h2>

          <!-- Items header -->
          <div class="hidden md:grid grid-cols-12 gap-3 px-1 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div class="col-span-5">商品</div>
            <div class="col-span-2 text-center">数量</div>
            <div class="col-span-2 text-center">单价</div>
            <div class="col-span-2 text-right">小计</div>
            <div class="col-span-1"></div>
          </div>

          <div v-for="(item, idx) in items" :key="idx" class="group relative bg-gray-50 rounded-lg p-3 mb-2 transition-colors hover:bg-gray-100">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div class="md:col-span-5">
                <label class="label text-xs md:hidden">商品</label>
                <SearchableSelect
                  :options="productOptions"
                  :model-value="item.product_id"
                  placeholder="请选择商品"
                  @update:model-value="onProductSelect(idx, $event)"
                />
              </div>
              <div class="md:col-span-2">
                <label class="label text-xs md:hidden">数量</label>
                <input v-model.number="item.quantity" type="number" min="1" class="input text-sm text-center" @input="calcLine(idx)" />
              </div>
              <div class="md:col-span-2">
                <label class="label text-xs md:hidden">单价</label>
                <input v-model.number="item.unit_price" type="number" step="0.01" min="0" class="input text-sm text-center" @input="calcLine(idx)" />
              </div>
              <div class="md:col-span-2 text-right">
                <label class="label text-xs md:hidden">小计</label>
                <div class="h-10 flex items-center justify-end text-sm font-semibold text-gray-900">¥{{ (item.line_total || 0).toFixed(2) }}</div>
              </div>
              <div class="md:col-span-1 flex justify-end">
                <button class="w-8 h-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors" @click="items.splice(idx, 1)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/50 transition-all" @click="addRow">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加商品
          </button>
        </div>
      </div>

      <!-- Right: 单据信息 -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">2</span>
            单据信息
          </h2>

          <div class="space-y-4">
            <div>
              <label class="label">客户 <span class="text-red-500">*</span></label>
              <SearchableSelect :options="customerOptions" v-model="form.customer_id" placeholder="请选择客户" />
            </div>
            <div>
              <label class="label">仓库 <span class="text-red-500">*</span></label>
              <SearchableSelect :options="warehouseOptions" v-model="form.warehouse_id" placeholder="请选择仓库" />
            </div>
            <div>
              <label class="label">备注</label>
              <textarea v-model="form.remark" class="input" rows="3" placeholder="备注信息..." />
            </div>
          </div>

          <!-- Total -->
          <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-gray-500">商品合计</span>
              <span class="text-sm text-gray-700">{{ items.filter(i => i.product_id).length }} 项</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">总计</span>
              <span class="text-2xl font-bold text-blue-600">¥{{ total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment records (edit only) -->
        <div v-if="isEdit && (formData.paid_amount ?? 0) > 0" class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-900">收款记录</h3>
          <div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
            <span class="text-sm text-gray-600">已收款</span>
            <span class="text-sm font-semibold text-green-600">¥{{ (formData.paid_amount || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button class="btn-secondary flex-1" :disabled="saving" @click="saveAsDraft">
            <svg v-if="saving" class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>
          <button class="btn-primary flex-1" :disabled="saving" @click="saveAndComplete">
            <svg v-if="saving" class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? '保存中...' : '完成销售' }}
          </button>
        </div>

        <div v-if="error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSalesOrder, createSalesOrder, updateSalesOrder, completeSalesOrder, fetchSalesOrderItems, saveSalesOrderItems } from '@/api'
import { fetchCustomers } from '@/api'
import { fetchWarehouses } from '@/api'
import { fetchProducts } from '@/api'
import type { Customer, Warehouse, Product, SalesOrder } from '@/types'

const route = useRoute(); const router = useRouter()
const isEdit = !!route.params.id
const saving = ref(false); const error = ref('')
const customers = ref<Customer[]>([])
const warehouses = ref<Warehouse[]>([])
const products = ref<Product[]>([])
const formData = reactive<Partial<SalesOrder>>({})

const form = reactive({ customer_id: null as number | null, warehouse_id: null as number | null, remark: '' })
const items = reactive<{ product_id: number | null; quantity: number; unit_price: number; cost_price: number; line_total: number }[]>([])

const total = computed(() => items.reduce((s, i) => s + (i.line_total || 0), 0))

const productOptions = computed(() =>
  products.value.map(p => ({ value: p.id, label: p.name }))
)
const customerOptions = computed(() =>
  customers.value.map(c => ({ value: c.id, label: c.name }))
)
const warehouseOptions = computed(() =>
  warehouses.value.map(w => ({ value: w.id, label: w.name }))
)

function addRow() {
  items.push({ product_id: null, quantity: 1, unit_price: 0, cost_price: 0, line_total: 0 })
}
function calcLine(idx: number) {
  items[idx].line_total = (items[idx].quantity || 0) * (items[idx].unit_price || 0)
}
function onProductSelect(idx: number, val: string | number | null) {
  items[idx].product_id = val as number | null
  if (!val) return
  const p = products.value.find(pr => pr.id === val)
  if (p) {
    items[idx].unit_price = p.reference_price || 0
    calcLine(idx)
  }
}

async function loadForm() {
  if (!isEdit) return
  const id = Number(route.params.id)
  const [orderRes, itemRes] = await Promise.all([fetchSalesOrder(id), fetchSalesOrderItems(id)])
  if (orderRes.data) {
    Object.assign(formData, orderRes.data)
    form.customer_id = orderRes.data.customer_id
    form.warehouse_id = orderRes.data.warehouse_id
    form.remark = orderRes.data.remark || ''
  }
  if (itemRes.data) {
    itemRes.data.forEach(i => items.push({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.cost_price,
      line_total: i.line_total
    }))
  }
}

async function saveAsDraft() { await handleSubmit('draft') }
async function saveAndComplete() { await handleSubmit('completed') }

async function handleSubmit(status: string) {
  if (saving.value) return
  saving.value = true; error.value = ''
  try {
    // 始终先存为草稿，再由 RPC 原子化完成（库存扣减 + 状态变更）
    const data = {
      customer_id: form.customer_id!,
      warehouse_id: form.warehouse_id!,
      total_amount: total.value,
      paid_amount: 0,
      remark: form.remark || null,
      status: 'draft'
    } as any
    const orderRes = isEdit
      ? await updateSalesOrder(Number(route.params.id), data)
      : await createSalesOrder(data)
    if (!orderRes.data) { error.value = orderRes.error || '保存失败'; return }
    const orderId = isEdit ? Number(route.params.id) : orderRes.data.id
    const itemData = items.filter(i => i.product_id).map(i => ({
      product_id: i.product_id!,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.cost_price
    }))
    await saveSalesOrderItems(orderId, itemData)
    // 仅在需要完成时调用 RPC（原子处理状态 + 扣库存）
    if (status === 'completed') {
      const rpcRes = await completeSalesOrder(orderId)
      if (rpcRes.error) {
        // RPC 失败时回退为草稿，防止出现"已完成但未扣库存"的脏数据
        await updateSalesOrder(orderId, { status: 'draft', paid_amount: 0 })
        error.value = rpcRes.error
        return
      }
    }
    router.push('/sales')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { saving.value = false }
}

onMounted(async () => {
  const [cRes, wRes, pRes] = await Promise.all([fetchCustomers({}), fetchWarehouses(), fetchProducts({})])
  if (cRes.data) customers.value = cRes.data
  if (wRes.data) warehouses.value = wRes.data
  if (pRes.data) products.value = pRes.data
  loadForm()
  if (!isEdit) addRow()
})
</script>
