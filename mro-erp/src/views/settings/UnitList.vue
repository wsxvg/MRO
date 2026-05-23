<template>
  <div class="page-padding">
    <BasePageHeader title="单位管理">
      <button class="btn-primary text-sm" @click="showForm = true; editTarget = null">新增单位</button>
    </BasePageHeader>

    <BaseCard>
      <BaseTable
        :columns="columns"
        :data="units"
        empty-text="暂无单位"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'actions'">
             <button class="btn-icon text-gray-500 hover:text-primary-600" title="编辑" @click="edit(row)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
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

    <!-- Form Modal -->
    <BaseModal v-model="showForm" :title="editTarget ? '编辑单位' : '新增单位'" size="sm">
      <form @submit.prevent="handleSave">
        <div class="space-y-4">
          <div>
            <label class="label">名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="input" required placeholder="单位名称" />
          </div>
        </div>
        <div v-if="formError" class="text-red-600 text-sm mt-3">{{ formError }}</div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn-secondary text-sm" @click="showForm = false">取消</button>
          <button type="submit" class="btn-primary text-sm" :disabled="saving" @click="handleSave">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirm -->
    <ConfirmDialog
      v-model="showDelete"
      type="danger"
      title="确认删除"
      :message="`确定要删除单位「${deleteTarget?.name}」吗？`"
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { unitsApi } from '@/api'
import type { Unit } from '@/types'
import BaseModal from '@/components/BaseModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'

const columns = [
  { key: 'name', label: '名称' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const units = ref<Unit[]>([])
const showForm = ref(false)
const showDelete = ref(false)
const editTarget = ref<Unit | null>(null)
const deleteTarget = ref<Unit | null>(null)
const saving = ref(false)
const formError = ref('')

const form = reactive({ name: '' })

async function fetchData() {
  const result = await unitsApi.getAll()
  if (!result.error) units.value = result.data || []
}

function edit(unit: Unit) {
  editTarget.value = unit
  form.name = unit.name || ''
  showForm.value = true
}

async function handleSave() {
  saving.value = true
  formError.value = ''
  try {
    const result = editTarget.value
      ? await unitsApi.update(editTarget.value.id!, { name: form.name, sort_order: 0 })
      : await unitsApi.create({ name: form.name, sort_order: 0 })
    if (!result.error) {
      showForm.value = false
      fetchData()
    } else {
      formError.value = result.error || '保存失败'
    }
  } finally {
    saving.value = false
  }
}

function confirmDelete(unit: Unit) {
  deleteTarget.value = unit
  showDelete.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  await unitsApi.delete(deleteTarget.value.id!)
  showDelete.value = false
  fetchData()
}

onMounted(fetchData)
</script>
