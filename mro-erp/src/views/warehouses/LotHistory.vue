<template>
  <div class="page-padding">
    <BasePageHeader title="批次管理" to="/settings/warehouses" />

    <p class="text-sm text-gray-500 mb-6">查看所有库存批次，支持核价（暂估→实际）操作</p>

    <!-- 筛选 -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[200px] flex-1">
          <label class="label text-xs">搜索商品</label>
          <input v-model="search" type="text" class="input" placeholder="商品名称..." @input="onSearch" />
        </div>
        <div>
          <label class="label text-xs">状态</label>
          <select v-model="filterEstimated" class="input" @change="fetchData">
            <option value="all">全部</option>
            <option value="estimated">仅暂估</option>
            <option value="actual">仅实际</option>
          </select>
        </div>
        <div>
          <label class="label text-xs">仓库</label>
          <select v-model="filterWarehouse" class="input" @change="fetchData">
            <option :value="null">全部仓库</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 统计 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <div class="text-xs text-gray-500 mb-1">总批次数</div>
        <div class="text-xl font-bold">{{ allLots.length }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <div class="text-xs text-gray-500 mb-1">暂估批次数</div>
        <div class="text-xl font-bold text-amber-600">{{ allLots.filter(l => l.is_estimated).length }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <div class="text-xs text-gray-500 mb-1">总库存数量</div>
        <div class="text-xl font-bold">{{ allLots.reduce((s, l) => s + l.quantity, 0) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <div class="text-xs text-gray-500 mb-1">总库存价值</div>
        <div class="text-xl font-bold">¥{{ allLots.reduce((s, l) => s + l.quantity * l.unit_cost, 0).toFixed(2) }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- 批次列表 -->
    <div v-else class="bg-white rounded-xl border border-gray-100 p-5">
      <div v-if="pagedLots.length === 0" class="text-center py-8 text-gray-400">
        {{ allLots.length === 0 ? '暂无批次记录' : '没有匹配的记录' }}
      </div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b">
            <th class="pb-2 font-medium">商品名称</th>
            <th class="pb-2 font-medium">仓库</th>
            <th class="pb-2 font-medium">供应商</th>
            <th class="pb-2 font-medium text-right">数量</th>
            <th class="pb-2 font-medium text-right">进价</th>
            <th class="pb-2 font-medium">状态</th>
            <th class="pb-2 font-medium">入库日期</th>
            <th class="pb-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lot in pagedLots" :key="lot.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-2 font-medium text-gray-900">{{ lot.product_name }}</td>
            <td class="py-2 text-gray-600">{{ lot.warehouse_name }}</td>
            <td class="py-2 text-gray-600">{{ lot.supplier_name || '-' }}</td>
            <td class="py-2 text-right">{{ lot.quantity }}</td>
            <td class="py-2 text-right">
              <span v-if="lot.unit_cost > 0">¥{{ lot.unit_cost.toFixed(2) }}</span>
              <span v-else class="text-gray-400">未填写</span>
            </td>
            <td class="py-2">
              <span v-if="lot.is_estimated" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">暂估</span>
              <span v-else class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">实际</span>
            </td>
            <td class="py-2 text-gray-500">{{ formatDate(lot.stock_in_date) }}</td>
            <td class="py-2">
              <button v-if="lot.is_estimated || lot.unit_cost <= 0"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                @click="openReconcile(lot)">
                核价
              </button>
              <span v-else class="text-xs text-gray-400">已核价</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="allLots.length > pageSize" class="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>共 {{ allLots.length }} 条，第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex gap-2">
          <button class="btn-secondary text-xs" :disabled="page <= 1" @click="page--; scrollToTop()">上一页</button>
          <button class="btn-secondary text-xs" :disabled="page >= totalPages" @click="page++; scrollToTop()">下一页</button>
        </div>
      </div>
    </div>

    <!-- 核价弹窗 -->
    <div v-if="reconcileDialog.visible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="reconcileDialog.visible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">核价</h3>
        <div class="text-sm text-gray-600 space-y-1">
          <p><span class="text-gray-400">商品：</span>{{ reconcileDialog.productName }}</p>
          <p><span class="text-gray-400">当前进价：</span>
            {{ reconcileDialog.currentCost > 0 ? `¥${reconcileDialog.currentCost.toFixed(2)}` : '未填写' }}
            <span v-if="reconcileDialog.isEstimated" class="text-amber-600 ml-1">（暂估）</span>
          </p>
          <p><span class="text-gray-400">剩余数量：</span>{{ reconcileDialog.quantity }}</p>
        </div>
        <div>
          <label class="label">实际进价 <span class="text-red-500">*</span></label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            <input v-model.number="reconcileDialog.newCost" type="number" step="0.01" min="0.01"
              class="input pl-7" placeholder="输入实际进价" autofocus />
          </div>
        </div>
        <div v-if="reconcileDialog.error" class="text-sm text-red-600">{{ reconcileDialog.error }}</div>
        <div class="flex gap-3 justify-end">
          <button class="btn-secondary" @click="reconcileDialog.visible = false">取消</button>
          <button class="btn-primary" :disabled="!reconcileDialog.newCost || reconcileDialog.saving" @click="doReconcile">
            {{ reconcileDialog.saving ? '保存中...' : '确认核价' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useDebounceFn } from '@/composables/useDebounce'
import { fetchStockLots, updateLotCost, fetchWarehouses } from '@/api'
import type { StockLot, Warehouse } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'

const warehouses = ref<Warehouse[]>([])
const allLots = ref<StockLot[]>([])
const loading = ref(true)
const search = ref('')
const filterEstimated = ref('all')
const filterWarehouse = ref<number | null>(null)
const page = ref(1)
const pageSize = 20

const reconcileDialog = reactive({
  visible: false,
  saving: false,
  lotId: 0,
  productName: '',
  currentCost: 0,
  isEstimated: false,
  quantity: 0,
  newCost: 0,
  error: '',
})

const onSearch = useDebounceFn(() => { page.value = 1 }, 300)

const filteredLots = computed(() => {
  let lots = allLots.value
  if (search.value) {
    const q = search.value.toLowerCase()
    lots = lots.filter(l => l.product_name?.toLowerCase().includes(q))
  }
  if (filterEstimated.value === 'estimated') {
    lots = lots.filter(l => l.is_estimated)
  } else if (filterEstimated.value === 'actual') {
    lots = lots.filter(l => !l.is_estimated)
  }
  if (filterWarehouse.value) {
    lots = lots.filter(l => l.warehouse_id === filterWarehouse.value)
  }
  return lots
})

const totalPages = computed(() => Math.ceil(filteredLots.value.length / pageSize))

const pagedLots = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredLots.value.slice(start, start + pageSize)
})

async function fetchData() {
  loading.value = true
  const res = await fetchStockLots({ only_positive: false })
  allLots.value = res.data ?? []
  loading.value = false
}

function openReconcile(lot: StockLot) {
  reconcileDialog.visible = true
  reconcileDialog.lotId = lot.id
  reconcileDialog.productName = lot.product_name ?? `商品#${lot.product_id}`
  reconcileDialog.currentCost = lot.unit_cost
  reconcileDialog.isEstimated = lot.is_estimated
  reconcileDialog.quantity = lot.quantity
  reconcileDialog.newCost = lot.unit_cost > 0 ? lot.unit_cost : 0
  reconcileDialog.error = ''
}

async function doReconcile() {
  if (!reconcileDialog.newCost || reconcileDialog.newCost <= 0) {
    reconcileDialog.error = '请输入有效的进价'
    return
  }
  reconcileDialog.saving = true
  reconcileDialog.error = ''

  const { error } = await updateLotCost(reconcileDialog.lotId, reconcileDialog.newCost)
  if (error) {
    reconcileDialog.error = error
  } else {
    reconcileDialog.visible = false
    // 更新本地数据
    const lot = allLots.value.find(l => l.id === reconcileDialog.lotId)
    if (lot) {
      lot.unit_cost = reconcileDialog.newCost
      lot.is_estimated = false
    }
  }
  reconcileDialog.saving = false
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  const [whRes] = await Promise.all([
    fetchWarehouses(),
    fetchData(),
  ])
  if (whRes.data) warehouses.value = whRes.data
})
</script>
