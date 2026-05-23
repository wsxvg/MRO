<template>
  <div class="page-padding">
    <BasePageHeader title="商品管理">
      <div class="flex gap-2">
        <router-link to="/products/import" class="btn-secondary text-sm">导入</router-link>
        <button class="btn-primary text-sm" @click="showStockIn = true">入库</button>
        <button class="btn-primary text-sm" @click="showNewModal = true">新增商品</button>
      </div>
    </BasePageHeader>

    <FilterBar
      v-model="searchQuery"
      show-search
      search-placeholder="搜索商品名称..."
      :filters="categoryOptions"
      @update:model-value="onSearch"
      @filter-change="onCategoryChange"
    />

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="error" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button class="btn-primary" @click="fetchData">重试</button>
    </div>
    <template v-else>
      <BaseCard>
        <BaseTable
          :columns="columns"
          :data="products"
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
              <router-link :to="`/products/${row.id}/stock`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">库存</router-link>
              <router-link :to="`/products/${row.id}`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">编辑</router-link>
              <button class="text-red-600 hover:text-red-700 text-sm" @click="confirmDelete(row)">删除</button>
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
      </BaseCard>
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-4 mt-6">
        <button :disabled="page <= 1" class="btn-secondary text-sm" @click="page--; fetchData()">上一页</button>
        <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" class="btn-secondary text-sm" @click="page++; fetchData()">下一页</button>
      </div>
    </template>

    <BaseModal v-model="showNewModal" title="新增商品" size="lg">
      <ProductForm :standalone="false" @saved="onSaved" @cancel="showNewModal = false" />
    </BaseModal>

    <!-- Stock-In Modal -->
    <BaseModal v-model="showStockIn" title="入库" size="sm">
      <form @submit.prevent="handleStockIn">
        <div class="space-y-4">
          <div>
            <label class="label">商品 <span class="text-red-500">*</span></label>
            <select v-model="stockInForm.product_id" class="input" required>
              <option value="">选择商品...</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.sku || '无SKU' }})</option>
            </select>
          </div>
          <div>
            <label class="label">仓库 <span class="text-red-500">*</span></label>
            <select v-model="stockInForm.warehouse_id" class="input" required>
              <option value="">选择仓库...</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">数量 <span class="text-red-500">*</span></label>
            <input v-model.number="stockInForm.quantity" type="number" min="1" class="input" required placeholder="入库数量" />
          </div>
          <div>
            <label class="label">备注</label>
            <input v-model="stockInForm.remark" type="text" class="input" placeholder="选填" />
          </div>
        </div>
        <div v-if="stockInError" class="text-red-600 text-sm mt-3">{{ stockInError }}</div>
        <div v-if="stockInSuccess" class="text-green-600 text-sm mt-3 font-medium">{{ stockInSuccess }}</div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn-secondary text-sm" @click="showStockIn = false">取消</button>
          <button type="submit" class="btn-primary text-sm" :disabled="stockInSaving" @click="handleStockIn">
            {{ stockInSaving ? '保存中...' : '确认入库' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      title="确认删除"
      :message="`确定要删除商品「${deleteTarget?.name}」吗？此操作不可撤销。`"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { productsApi, categoriesApi, createStockIn, fetchWarehouses } from '@/api'
import type { Product, Category, Warehouse } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'

import BaseModal from '@/components/BaseModal.vue'
import ProductForm from './ProductForm.vue'

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
const warehouses = ref<Warehouse[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const categoryFilter = ref('')
const page = ref(1)
const total = ref(0)
const pageSize = 15
const showNewModal = ref(false)
const showDeleteDialog = ref(false)
const showStockIn = ref(false)
const stockInForm = reactive({ product_id: null as number | null, warehouse_id: null as number | null, quantity: 1, remark: '' })
const stockInSaving = ref(false)
const stockInError = ref('')
const stockInSuccess = ref('')
const deleteTarget = ref<Product | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

let searchTimer: ReturnType<typeof setTimeout> | undefined
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 300)
}

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

async function loadWarehouses() {
  const result = await fetchWarehouses()
  if (!result.error) {
    warehouses.value = result.data || []
  }
}

async function handleStockIn() {
  if (!stockInForm.product_id || !stockInForm.warehouse_id || !stockInForm.quantity) return
  stockInSaving.value = true
  stockInError.value = ''
  stockInSuccess.value = ''
  try {
    const res = await createStockIn({
      product_id: stockInForm.product_id,
      warehouse_id: stockInForm.warehouse_id,
      quantity: stockInForm.quantity,
      remark: stockInForm.remark || null
    })
    if (res.error) {
      stockInError.value = res.error
    } else {
      stockInSuccess.value = '入库成功！'
      stockInForm.product_id = null
      stockInForm.warehouse_id = null
      stockInForm.quantity = 1
      stockInForm.remark = ''
      setTimeout(() => { showStockIn.value = false; stockInSuccess.value = '' }, 1200)
    }
  } catch (e: unknown) {
    stockInError.value = e instanceof Error ? e.message : '入库失败'
  } finally {
    stockInSaving.value = false
  }
}

function onSaved() { showNewModal.value = false; fetchData() }

function confirmDelete(product: Product) {
  deleteTarget.value = product
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  const result = await productsApi.delete(deleteTarget.value.id!)
  if (!result.error) {
    showDeleteDialog.value = false
    deleteTarget.value = null
    fetchData()
  } else {
    error.value = result.error || '删除失败'
  }
}

onMounted(() => {
  fetchData()
  loadCategories()
  loadWarehouses()
})
</script>
