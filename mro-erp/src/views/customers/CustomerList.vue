<template>
  <div class="page-padding">
    <BasePageHeader title="客户管理">
      <div class="flex gap-2">
        <router-link to="/customers/import" class="btn-secondary text-sm">导入</router-link>
        <button class="btn-primary text-sm" @click="showNewModal = true">新增客户</button>
      </div>
    </BasePageHeader>

    <FilterBar v-model="search" show-search search-placeholder="搜索名称/联系人/电话..." @update:model-value="onSearch" />

    <!-- Type filter tabs -->
    <div class="flex gap-1.5 mb-4">
      <button :class="typeFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="typeFilter = ''; page = 1; fetchData()">
        全部
      </button>
      <button :class="typeFilter === 'retail' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="typeFilter = 'retail'; page = 1; fetchData()">
        零售客户
      </button>
      <button :class="typeFilter === 'wholesale' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="typeFilter = 'wholesale'; page = 1; fetchData()">
        批发客户
      </button>
    </div>

    <!-- Batch action bar -->
    <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 px-1">
      <span class="text-sm text-gray-500">已选 {{ selectedIds.length }} 项</span>
      <button class="btn-secondary text-sm" @click="selectedIds = []">取消选择</button>
      <button class="btn-secondary text-sm border-red-300 text-red-600 hover:bg-red-50" @click="confirmBatchDelete">批量删除</button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <div v-else-if="error" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button class="btn-primary" @click="fetchData">重试</button>
    </div>
    <BaseCard v-else>
      <BaseTable
        :columns="columns"
        :data="list"
        selectable
        v-model:selected="selectedIds"
        empty-text="暂无客户"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'name'">
            <router-link :to="`/customers/${row.id}`" class="text-primary-600 hover:text-primary-700">{{ highlightText(row.name ?? '', search) }}</router-link>
          </template>
          <template v-else-if="column.key === 'actions'">
            <router-link :to="`/customers/${row.id}/pricing`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">价格</router-link>
             <router-link :to="`/customers/${row.id}`" class="btn-icon text-gray-500 hover:text-primary-600" title="编辑">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </router-link>
              <button class="btn-icon-danger" title="删除" @click="confirmDelete(row)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
          </template>
          <template v-else-if="column.key === 'credit_limit'">
            ¥{{ (row.credit_limit || 0).toFixed(2) }}
          </template>
          <template v-else>
            {{ row[column.key] ?? '-' }}
          </template>
        </template>
      </BaseTable>
      <BasePagination :current-page="page" :total="total" :page-size="pageSize" @change="page = $event; fetchData()" />
    </BaseCard>

    <ConfirmDialog
      v-model="showDelete"
      type="danger"
      title="确认删除"
      :message="`确定要删除客户「${deleteTarget?.name}」吗？`"
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />

    <ConfirmDialog
      v-model="showBatchDeleteDialog"
      type="danger"
      title="批量删除"
      :message="`确定要批量删除所选 ${selectedIds.length} 个客户吗？此操作不可恢复。`"
      :confirming="batchDeleting"
      @confirm="handleBatchDelete"
      @cancel="showBatchDeleteDialog = false"
    />

    <BaseModal v-model="showNewModal" title="新增客户" size="lg">
      <CustomerForm
        :standalone="false"
        @saved="onSaved"
        @cancel="showNewModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchCustomers, deleteCustomer, batchDeleteCustomers } from '@/api'
import { useDebounceFn } from '@/composables/useDebounce'
import { highlightText } from '@/lib/utils'
import type { Customer } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BaseModal from '@/components/BaseModal.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import BasePagination from '@/components/BasePagination.vue'
import CustomerForm from '@/views/customers/CustomerForm.vue'

const columns = [
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'contact_person', label: '联系人' },
  { key: 'phone', label: '电话' },
  { key: 'address', label: '地址' },
  { key: 'credit_limit', label: '信用额度', align: 'right' as const },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const list = ref<Customer[]>([])
const search = ref('')
const typeFilter = ref('')
const loading = ref(true)
const error = ref('')
const showDelete = ref(false)
const showNewModal = ref(false)
const deleteTarget = ref<Customer | null>(null)
const page = ref(1)
const total = ref(0)
const pageSize = 15

// Batch operations
const selectedIds = ref<number[]>([])
const showBatchDeleteDialog = ref(false)
const batchDeleting = ref(false)

function onSaved() {
  showNewModal.value = false
  fetchData()
}

const onSearch = useDebounceFn(() => { page.value = 1; fetchData() }, 300)

async function fetchData() {
  loading.value = true; error.value = ''
  try {
    const params: { search?: string; type?: string; page?: number; limit?: number } = {}
    if (search.value) params.search = search.value
    if (typeFilter.value) params.type = typeFilter.value
    params.page = page.value
    params.limit = pageSize
    const res = await fetchCustomers(params)
    if (res.data) list.value = res.data
    else error.value = res.error || '加载失败'
    total.value = res.count ?? list.value.length
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { loading.value = false }
}

function confirmDelete(item: Customer) { deleteTarget.value = item; showDelete.value = true }
async function handleDelete() {
  if (!deleteTarget.value) return
  await deleteCustomer(deleteTarget.value.id!)
  showDelete.value = false; fetchData()
}

function confirmBatchDelete() {
  if (selectedIds.value.length === 0) return
  showBatchDeleteDialog.value = true
}

async function handleBatchDelete() {
  batchDeleting.value = true
  try {
    const res = await batchDeleteCustomers(selectedIds.value)
    if (res.error) {
      error.value = res.error
    } else {
      showBatchDeleteDialog.value = false
      selectedIds.value = []
      fetchData()
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '批量删除失败'
  } finally {
    batchDeleting.value = false
  }
}

onMounted(fetchData)
</script>
