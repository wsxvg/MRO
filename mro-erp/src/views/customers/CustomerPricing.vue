<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/customers" class="text-gray-500 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">{{ customerName }} - 专属价格</h1>
    </div>

    <div class="card mb-6">
      <p class="text-sm text-gray-600">设置针对该客户的专属商品价格。留空则使用商品默认售价。</p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-gray-500 border-b border-gray-200">
              <th class="pb-3 font-medium">SKU</th>
              <th class="pb-3 font-medium">商品名称</th>
              <th class="pb-3 font-medium text-right">参考售价</th>
              <th class="pb-3 font-medium text-right">专属价格</th>
              <th class="pb-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in prices" :key="item.product_id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 text-sm text-gray-600">{{ item.product_sku || '-' }}</td>
              <td class="py-3 text-sm font-medium text-gray-900">{{ item.product_name }}</td>
              <td class="py-3 text-sm text-gray-900 text-right">¥{{ (item.reference_price || 0).toFixed(2) }}</td>
              <td class="py-3 text-right">
                <input v-model.number="item.price" type="number" step="0.01" class="input w-32 text-right" placeholder="0.00" />
              </td>
              <td class="py-3 text-right">
                <button class="text-red-600 hover:text-red-700 text-sm" @click="removePrice(idx)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-200">
        <label class="label">添加商品</label>
        <div class="flex gap-2">
          <select v-model="newProductId" class="input">
            <option value="">请选择商品</option>
            <option v-for="p in availableProducts" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku }})</option>
          </select>
          <button class="btn-secondary" :disabled="!newProductId" @click="addProduct">添加</button>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button class="btn-primary" :disabled="saving" @click="savePrices">
          {{ saving ? '保存中...' : '保存价格' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchCustomer, fetchCustomerPrices, upsertCustomerPrices, deleteCustomerPrice } from '@/api'
import { fetchProducts } from '@/api'
import type { CustomerPrice, Product } from '@/types'

const route = useRoute()
const customerId = Number(route.params.id)
const customerName = ref('')

const loading = ref(true)
const saving = ref(false)
const prices = ref<(CustomerPrice & { price: number })[]>([])
const allProducts = ref<Product[]>([])
const newProductId = ref<number | null>(null)

const availableProducts = ref<Product[]>([])

async function loadData() {
  const [custRes, pricesRes, prodRes] = await Promise.all([
    fetchCustomer(customerId),
    fetchCustomerPrices(customerId),
    fetchProducts({})
  ])
  if (custRes.data) customerName.value = custRes.data.name
  if (pricesRes.data) {
    // 过滤掉已停用商品的专属价格
    const activeProductIds = new Set((prodRes.data ?? []).map((p: any) => p.id))
    prices.value = pricesRes.data
      .filter(p => activeProductIds.has(p.product_id))
      .map(p => ({ ...p, price: p.price || 0 }))
  }
  if (prodRes.data) {
    allProducts.value = prodRes.data
    const usedIds = new Set(prices.value.map(p => p.product_id))
    availableProducts.value = prodRes.data.filter(p => !usedIds.has(p.id))
  }
  loading.value = false
}

function addProduct() {
  if (!newProductId.value) return
  const prod = allProducts.value.find(p => p.id === newProductId.value)
  if (!prod) return
  prices.value.push({
    customer_id: customerId,
    product_id: prod.id,
    price: 0,
    product_name: prod.name,
    product_sku: prod.sku || '',
    reference_price: prod.reference_price
  })
  newProductId.value = null
  const usedIds = new Set(prices.value.map(p => p.product_id))
  availableProducts.value = allProducts.value.filter(p => !usedIds.has(p.id))
}

function removePrice(idx: number) {
  const item = prices.value[idx]
  prices.value.splice(idx, 1)
  if (item.product_name) {
    availableProducts.value.push(allProducts.value.find(p => p.id === item.product_id)!)
  }
}

async function savePrices() {
  saving.value = true
  const validPrices = prices.value.filter(p => p.price > 0).map(p => ({
    customer_id: customerId,
    product_id: p.product_id,
    price: p.price
  }))
  await upsertCustomerPrices(validPrices)
  saving.value = false
}

onMounted(loadData)
</script>
