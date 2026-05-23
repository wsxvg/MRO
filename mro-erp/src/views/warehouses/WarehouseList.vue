<template>
  <div class="page-padding">
    <BasePageHeader title="仓库管理">
      <div class="flex gap-2">
        <router-link to="/settings/warehouses/import-stock" class="btn-secondary text-sm">导入库存</router-link>
        <button class="btn-primary text-sm" @click="showNewModal = true">新增仓库</button>
      </div>
    </BasePageHeader>

    <FilterBar v-model="search" show-search search-placeholder="搜索名称/编码..." @update:model-value="onSearch" />

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>
    <BaseCard v-else>
      <BaseTable
        :columns="columns"
        :data="list"
        empty-text="暂无仓库"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'actions'">
            <router-link :to="`/settings/warehouses/${row.id}/stock`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">库存</router-link>
            <router-link :to="`/settings/warehouses/transactions`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">流水</router-link>
             <router-link :to="`/settings/warehouses/${row.id}`" class="btn-icon text-gray-500 hover:text-primary-600" title="编辑">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </router-link>
              <button class="btn-icon-danger" title="删除" @click="confirmDelete(row)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
          </template>
          <template v-else>
            {{ row[column.key] ?? '-' }}
          </template>
        </template>
      </BaseTable>
    </BaseCard>

    <ConfirmDialog
      v-model="showDelete"
      type="danger"
      title="确认删除"
      :message="`确定要删除仓库「${deleteTarget?.name}」吗？`"
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />

    <BaseModal v-model="showNewModal" title="新增仓库" size="md">
      <WarehouseForm :standalone="false" @saved="onSaved" @cancel="showNewModal = false" />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { warehousesApi } from '@/api'
import type { Warehouse } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import BaseModal from '@/components/BaseModal.vue'
import WarehouseForm from './WarehouseForm.vue'

const columns = [
  { key: 'name', label: '名称' },
  { key: 'location', label: '位置' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const list = ref<Warehouse[]>([]); const search = ref('')
const loading = ref(true); const showDelete = ref(false); const deleteTarget = ref<Warehouse | null>(null)
const showNewModal = ref(false)

let timer: ReturnType<typeof setTimeout>
function onSearch() { clearTimeout(timer); timer = setTimeout(() => fetchData(), 300) }

function onSaved() { showNewModal.value = false; fetchData() }

async function fetchData() {
  loading.value = true
  const res = await warehousesApi.getAll()
  if (!res.error) {
    list.value = res.data || []
    if (search.value) {
      const q = search.value.toLowerCase()
      list.value = list.value.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q)
      )
    }
  }
  loading.value = false
}

function confirmDelete(item: Warehouse) { deleteTarget.value = item; showDelete.value = true }
async function handleDelete() {
  if (!deleteTarget.value) return
  await warehousesApi.delete(deleteTarget.value.id!); showDelete.value = false; fetchData()
}

onMounted(fetchData)
</script>
