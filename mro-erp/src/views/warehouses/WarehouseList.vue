<template>
  <div class="page-padding">
    <BasePageHeader title="仓库管理">
      <div class="flex gap-2">
        <router-link to="/settings/warehouses/import-stock" class="btn-secondary text-sm">导入库存</router-link>
        <button class="btn-primary text-sm" @click="showNewModal = true">新增仓库</button>
      </div>
    </BasePageHeader>

    <FilterBar v-model="search" show-search search-placeholder="搜索名称/编码..." @update:model-value="onSearch" />

    <TableSkeleton v-if="loading" :show-search="true" />
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
            <router-link :to="`/settings/warehouses/${row.id}`" class="text-primary-600 hover:text-primary-700 text-sm mr-3">编辑</router-link>
            <button class="text-red-600 hover:text-red-700 text-sm" @click="confirmDelete(row)">删除</button>
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
import { useDebounceFn } from '@/composables/useDebounce'
import type { Warehouse } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import BaseModal from '@/components/BaseModal.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import WarehouseForm from './WarehouseForm.vue'

const columns = [
  { key: 'name', label: '名称' },
  { key: 'location', label: '位置' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const list = ref<Warehouse[]>([]); const search = ref('')
const loading = ref(true); const showDelete = ref(false); const deleteTarget = ref<Warehouse | null>(null)
const showNewModal = ref(false)

const onSearch = useDebounceFn(() => fetchData(), 300)

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
