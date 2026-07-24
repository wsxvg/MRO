<template>
  <div class="page-padding">
    <BasePageHeader :title="`${warehouseName} - 库存明细`" to="/settings/warehouses" />

    <!-- Search -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[200px] flex-1">
          <input
            v-model="search"
            type="text"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            placeholder="搜索商品名称..."
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Content -->
    <div v-else class="bg-white rounded-xl border border-gray-100 p-5">
      <BaseTable
        :columns="[
          { key: 'product_name', label: '商品名称' },
          { key: 'product_specification', label: '规格' },
          { key: 'quantity', label: '库存数量', align: 'right' },
          { key: 'min_stock', label: '最低库存', align: 'right' },
          { key: 'status', label: '状态' },
          { key: 'actions', label: '操作' }
        ]"
        :data="list"
        :loading="false"
        empty-text="暂无库存记录"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'product_name'">
            <span class="font-medium text-gray-900">{{ row.product_name }}</span>
          </template>
          <template v-else-if="column.key === 'product_specification'">
            <span class="text-gray-600">{{ row.product_specification || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge v-if="row.min_stock != null && row.quantity < row.min_stock" status="cancelled" :labels="{ cancelled: '低库存' }" />
            <StatusBadge v-else status="completed" :labels="{ completed: '正常' }" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <button class="text-sm text-primary-600 hover:text-primary-700" @click="showLots(row.product_id, row.product_name)">
              查看批次
            </button>
          </template>
          <template v-else>
            {{ row[column.key] ?? '-' }}
          </template>
        </template>
      </BaseTable>

      <BasePagination :current-page="page" :total="total" :page-size="pageSize" @change="page = $event; fetchData()" />
    </div>

    <!-- 批次详情弹窗 -->
    <div v-if="lotDialog.visible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="lotDialog.visible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ lotDialog.productName }} - 批次明细</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="lotDialog.visible = false">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="lotDialog.loading" class="text-center py-8 text-gray-400">加载中...</div>

        <div v-else-if="lotDialog.lots.length === 0" class="text-center py-8 text-gray-400">暂无批次记录</div>

        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="pb-2 font-medium">入库日期</th>
              <th class="pb-2 font-medium text-right">数量</th>
              <th class="pb-2 font-medium text-right">进价</th>
              <th class="pb-2 font-medium">供应商</th>
              <th class="pb-2 font-medium">状态</th>
              <th class="pb-2 font-medium">操作</th>
              <th class="pb-2 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lot in lotDialog.lots" :key="lot.id" class="border-b border-gray-100">
              <td class="py-2">{{ formatDate(lot.stock_in_date) }}</td>
              <td class="py-2 text-right">{{ lot.quantity }}</td>
              <td class="py-2 text-right">¥{{ lot.unit_cost.toFixed(2) }}</td>
              <td class="py-2">{{ lot.supplier_name || '-' }}</td>
              <td class="py-2">
                <span v-if="lot.is_estimated" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">暂估</span>
                <span v-else class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">实际</span>
              </td>
              <td class="py-2">
                <button v-if="lot.is_estimated || lot.unit_cost <= 0"
                  class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  @click="openReconcile(lot)">
                  核价
                </button>
                <span v-else class="text-xs text-gray-400">-</span>
              </td>
              <td class="py-2 text-gray-500">{{ lot.remark || '-' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-medium">
              <td class="pt-3">合计</td>
              <td class="pt-3 text-right">{{ lotDialog.lots.reduce((s, l) => s + l.quantity, 0) }}</td>
              <td class="pt-3 text-right" colspan="5">
                加权均价: ¥{{ lotDialog.avgCost.toFixed(2) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- 核价弹窗 -->
    <div v-if="reconcileDialog.visible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="reconcileDialog.visible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">核价</h3>
        <div class="text-sm text-gray-600 space-y-1">
          <p><span class="text-gray-400">当前进价：</span>
            {{ reconcileDialog.currentCost > 0 ? `¥${reconcileDialog.currentCost.toFixed(2)}` : '未填写' }}
            <span class="text-amber-600 ml-1">（暂估）</span>
          </p>
          <p><span class="text-gray-400">剩余数量：</span>{{ reconcileDialog.quantity }}</p>
        </div>
        <div>
          <label class="label">实际进价 <span class="text-red-500">*</span></label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            <input v-model.number="reconcileDialog.newCost" type="number" step="0.01" min="0.01"
              class="input pl-7" placeholder="输入实际进价" autofocus
              @keyup.enter="doReconcile" />
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
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@/composables/useDebounce'
import { fetchWarehouse, fetchStocks, fetchStockLots, updateLotCost } from '@/api'
import type { Stock, StockLot } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseTable from '@/components/BaseTable.vue'
import BasePagination from '@/components/BasePagination.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const warehouseId = Number(route.params.id)
const warehouseName = ref('')
const list = ref<Stock[]>([])
const search = ref('')
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const pageSize = 15

const lotDialog = reactive({
  visible: false,
  loading: false,
  productName: '',
  productId: 0,
  lots: [] as StockLot[],
  avgCost: 0,
})

const reconcileDialog = reactive({
  visible: false,
  saving: false,
  lotId: 0,
  currentCost: 0,
  quantity: 0,
  newCost: 0,
  error: '',
})

const onSearch = useDebounceFn(() => { page.value = 1; fetchData() }, 300)

async function fetchData() {
  loading.value = true
  const res = await fetchStocks({ warehouse_id: warehouseId, search: search.value, page: page.value, limit: pageSize })
  if (res.data) {
    list.value = res.data
    total.value = res.count ?? 0
  }
  loading.value = false
}

async function showLots(productId: number, productName: string) {
  lotDialog.visible = true
  lotDialog.loading = true
  lotDialog.productName = productName
  lotDialog.productId = productId
  lotDialog.lots = []

  const { data } = await fetchStockLots({ product_id: productId, warehouse_id: warehouseId })
  lotDialog.lots = data ?? []

  const totalQty = lotDialog.lots.reduce((s, l) => s + l.quantity, 0)
  const totalValue = lotDialog.lots.reduce((s, l) => s + l.quantity * l.unit_cost, 0)
  lotDialog.avgCost = totalQty > 0 ? totalValue / totalQty : 0

  lotDialog.loading = false
}

function openReconcile(lot: StockLot) {
  reconcileDialog.visible = true
  reconcileDialog.lotId = lot.id
  reconcileDialog.currentCost = lot.unit_cost
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
    // 刷新批次列表
    await showLots(lotDialog.productId, lotDialog.productName)
  }
  reconcileDialog.saving = false
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(async () => {
  const w = await fetchWarehouse(warehouseId)
  if (w.data) warehouseName.value = w.data.name
  fetchData()
})
</script>
