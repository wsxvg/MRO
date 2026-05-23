<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/sales-returns" class="text-gray-500 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '退货单详情' : '新增退货单' }}</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">退货商品</h2>
          <div v-for="(item, idx) in items" :key="idx" class="flex gap-2 items-end border-b border-gray-100 pb-3">
            <div class="flex-1">
              <label class="label text-xs">商品</label>
              <select v-model="item.product_id" class="input text-sm">
                <option value="">请选择</option>
                <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
              </select>
            </div>
            <div class="w-24">
              <label class="label text-xs">数量</label>
              <input v-model.number="item.quantity" type="number" min="1" class="input text-sm" @input="calcLine(idx)" />
            </div>
            <div class="w-28">
              <label class="label text-xs">单价</label>
              <input v-model.number="item.unit_price" type="number" step="0.01" class="input text-sm" @input="calcLine(idx)" />
            </div>
            <div class="w-28 text-right pt-5 text-sm text-gray-900">¥{{ (item.line_total || 0).toFixed(2) }}</div>
            <button class="text-red-500 pt-5" @click="items.splice(idx, 1)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <button class="btn-secondary text-sm" @click="addRow">+ 添加商品</button>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">单据信息</h2>
          <div>
            <label class="label">客户 <span class="text-red-500">*</span></label>
            <select v-model="form.customer_id" class="input" required>
              <option value="">请选择</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">仓库 <span class="text-red-500">*</span></label>
            <select v-model="form.warehouse_id" class="input" required>
              <option value="">请选择</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="form.remark" class="input" rows="2" />
          </div>
          <div class="text-right text-lg font-bold text-gray-900">
            ¥{{ total.toFixed(2) }}
          </div>
        </div>

        <div class="flex gap-3">
          <button class="btn-primary flex-1" :disabled="saving" @click="saveAsDraft">保存草稿</button>
          <button class="btn-primary flex-1" :disabled="saving" @click="saveAndComplete">完成退货</button>
        </div>

        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSalesReturn, createSalesReturn, completeSalesReturn, fetchSalesReturnItems, saveSalesReturnItems } from '@/api'
import { fetchCustomers } from '@/api'
import { fetchWarehouses } from '@/api'
import { fetchProducts } from '@/api'
import type { Customer, Warehouse, Product } from '@/types'

const route = useRoute(); const router = useRouter()
const isEdit = !!route.params.id
const saving = ref(false); const error = ref('')
const customers = ref<Customer[]>([])
const warehouses = ref<Warehouse[]>([])
const products = ref<Product[]>([])

const form = reactive({ customer_id: null as number | null, warehouse_id: null as number | null, remark: '' })
const items = reactive<{ product_id: number | null; quantity: number; unit_price: number; line_total: number }[]>([])

const total = computed(() => items.reduce((s, i) => s + (i.line_total || 0), 0))

function addRow() { items.push({ product_id: null, quantity: 1, unit_price: 0, line_total: 0 }) }
function calcLine(idx: number) { items[idx].line_total = (items[idx].quantity || 0) * (items[idx].unit_price || 0) }

async function loadForm() {
  if (!isEdit) return
  const id = Number(route.params.id)
  const [orderRes, itemRes] = await Promise.all([fetchSalesReturn(id), fetchSalesReturnItems(id)])
  if (orderRes.data) {
    form.customer_id = orderRes.data.customer_id
    form.warehouse_id = orderRes.data.warehouse_id
    form.remark = orderRes.data.remark || ''
  }
  if (itemRes.data) {
    itemRes.data.forEach(i => items.push({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, line_total: i.line_total }))
  }
}

async function saveAsDraft() { await handleSubmit('draft') }
async function saveAndComplete() { await handleSubmit('completed') }

async function handleSubmit(status: string) {
  saving.value = true; error.value = ''
  try {
    const data = { customer_id: form.customer_id!, warehouse_id: form.warehouse_id!, total_amount: total.value, remark: form.remark || null, status } as any
    const orderRes = await createSalesReturn(data)
    if (!orderRes.data) { error.value = orderRes.error || '保存失败'; return }
    const orderId = orderRes.data.id
    const itemData = items.filter(i => i.product_id).map(i => ({ product_id: i.product_id!, quantity: i.quantity, unit_price: i.unit_price }))
    await saveSalesReturnItems(orderId, itemData)
    if (status === 'completed') await completeSalesReturn(orderId)
    router.push('/sales-returns')
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
