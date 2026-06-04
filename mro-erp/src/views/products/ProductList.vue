<template>
  <div class="page-padding">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900">商品管理</h1>
      <router-link to="/stock/in" class="btn-primary text-sm">进货</router-link>
    </div>

    <FilterBar
      v-model="searchQuery"
      show-search
      search-placeholder="搜索商品名称..."
      :filters="categoryOptions"
      @update:model-value="onSearch"
      @filter-change="onCategoryChange"
    />

    <!-- Batch action bar -->
    <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 px-1">
      <span class="text-sm text-gray-500">已选 {{ selectedIds.length }} 项</span>
      <button class="btn-secondary text-sm" @click="selectedIds = []">取消选择</button>
      <button class="btn-secondary text-sm border-red-300 text-red-600 hover:bg-red-50" @click="handleBatchDisable">批量停用</button>
    </div>

    <TableSkeleton v-if="loading" :show-search="true" />
    <div v-else-if="error" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button class="btn-primary" @click="fetchData">重试</button>
    </div>
    <template v-else>
      <BaseCard>
        <BaseTable
          :columns="columns"
          :data="products"
          selectable
          v-model:selected="selectedIds"
          empty-text="暂无商品"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'reference_price'">
              ¥{{ (row.reference_price || 0).toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'stock_quantity'">
              {{ row.stock_quantity ?? 0 }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <router-link :to="`/products/${row.id}`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">编辑</router-link>
              <button class="text-red-600 hover:text-red-700 text-sm" @click="confirmDelete(row)">停用</button>
            </template>
            <template v-else-if="column.key === 'name'">
              <span v-html="highlightText(row.name ?? '', searchQuery)"></span>
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
        <BasePagination :current-page="page" :total="total" :page-size="pageSize" @change="page = $event; fetchData()" />
      </BaseCard>
    </template>

    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      title="确认停用"
      :message="`确定要停用商品「${deleteTarget?.name}」吗？停用后将不再显示在列表中，但库存和单据记录会保留。`"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />

    <!-- Batch disable confirm -->
    <ConfirmDialog
      v-model="showBatchDisableDialog"
      type="danger"
      title="批量停用"
      :message="`确定要批量停用所选 ${selectedIds.length} 个商品吗？停用后将不再显示在列表中。`"
      :loading="batchDisabling"
      @confirm="confirmBatchDisable"
      @cancel="showBatchDisableDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDebounceFn } from '@/composables/useDebounce'
import { highlightText } from '@/lib/utils'
import { productsApi, categoriesApi } from '@/api'
import type { Product, Category } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import BasePagination from '@/components/BasePagination.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

const columns = [
  { key: 'name', label: '名称' },
  { key: 'specification', label: '规格' },
  { key: 'category_name', label: '分类' },
  { key: 'unit', label: '单位' },
  { key: 'reference_price', label: '售价', align: 'right' as const },
  { key: 'stock_quantity', label: '库存', align: 'right' as const },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const categoryOptions = computed(() => [{
  key: 'category_id',
  label: '全部分类',
  value: categoryFilter.value,
  options: categories.value.map((c: Category) => ({ value: String(c.id), label: c.name }))
}])

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const categoryFilter = ref('')
const page = ref(1)
const total = ref(0)
const pageSize = 15
const showDeleteDialog = ref(false)
const deleteTarget = ref<Product | null>(null)

// Batch operations
const selectedIds = ref<number[]>([])
const showBatchDisableDialog = ref(false)
const batchDisabling = ref(false)

const onSearch = useDebounceFn(() => { page.value = 1; fetchData() }, 300)

function onCategoryChange(payload: { key: string; value: string }) {
  categoryFilter.value = payload.value
  page.value = 1
  fetchData()
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const result = await productsApi.getAll({
      search: searchQuery.value,
      category_id: categoryFilter.value ? Number(categoryFilter.value) : undefined,
      page: page.value,
      limit: pageSize
    })
    if (!result.error) {
      products.value = result.data || []
      total.value = result.count || result.data?.length || 0
    } else {
      error.value = result.error || '加载失败'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const result = await categoriesApi.getAll()
  if (!result.error) {
    categories.value = result.data || []
  }
}

function confirmDelete(product: Product) {
  deleteTarget.value = product
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const result = await productsApi.update(deleteTarget.value.id!, { is_active: false })
  if (!result.error) {
    showDeleteDialog.value = false
    deleteTarget.value = null
    fetchData()
  } else {
    error.value = result.error || '停用失败'
  }
}

async function handleBatchDisable() {
  if (selectedIds.value.length === 0) return
  showBatchDisableDialog.value = true
}

async function confirmBatchDisable() {
  batchDisabling.value = true
  try {
    const res = await productsApi.batchDisable(selectedIds.value)
    if (res.error) {
      error.value = res.error
    } else {
      showBatchDisableDialog.value = false
      selectedIds.value = []
      fetchData()
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '批量停用失败'
  } finally {
    batchDisabling.value = false
  }
}

onMounted(() => {
  fetchData()
  loadCategories()
})
</script>
