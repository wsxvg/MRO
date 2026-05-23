<template>
  <div class="max-w-5xl mx-auto py-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/sales" class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '销售单详情' : '新增销售单' }}</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: 商品明细 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <span class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
            <h2 class="text-lg font-bold text-gray-900">商品明细</h2>
          </div>

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
                <select v-model="item.product_id" class="input text-sm" @change="onProductChange(idx)">
                  <option value="">请选择商品</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} <template v-if="p.specification">({{ p.specification }})</template></option>
                </select>
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

          <button class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all" @click="addRow">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加商品
          </button>
        </div>
      </div>

      <!-- Right: 单据信息 -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <span class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
            <h2 class="text-lg font-bold text-gray-900">单据信息</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label">客户 <span class="text-red-500">*</span></label>
              <select v-model="form.customer_id" class="input" required>
                <option value="">请选择客户</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="label">仓库 <span class="text-red-500">*</span></label>
              <select v-model="form.warehouse_id" class="input" required>
                <option value="">请选择仓库</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
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
        <div v-if="isEdit && (formData.paid_amount ?? 0) > 0" class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">收款记录</h3>
          <div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
            <span class="text-sm text-gray-600">已收款</span>
            <span class="text-sm font-semibold text-green-600">¥{{ (formData.paid_amount || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button class="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all" :disabled="saving" @click="saveAsDraft">
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>
          <button class="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all" :disabled="saving" @click="saveAndComplete">
            完成销售
          </button>
        </div>

        <div v-if="error" class="text-red-600 text-sm bg-red-50 rounded-lg p-3">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
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

function addRow() {
  items.push({ product_id: null, quantity: 1, unit_price: 0, cost_price: 0, line_total: 0 })
}
function calcLine(idx: number) {
  items[idx].line_total = (items[idx].quantity || 0) * (items[idx].unit_price || 0)
}
function onProductChange(idx: number) {
  const pid = items[idx].product_id
  if (!pid) return
  const p = products.value.find(pr => pr.id === pid)
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
  saving.value = true; error.value = ''
  try {
    const data = {
      customer_id: form.customer_id!,
      warehouse_id: form.warehouse_id!,
      total_amount: total.value,
      paid_amount: status === 'completed' ? total.value : 0,
      remark: form.remark || null,
      status
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
    if (status === 'completed') await completeSalesOrder(orderId)
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
