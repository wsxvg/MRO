<template>
  <div class="page-padding">
    <BasePageHeader title="分类管理">
      <button class="btn-primary text-sm" @click="showForm = true; editTarget = null">新增分类</button>
    </BasePageHeader>

    <BaseCard>
      <div @dragover.prevent @drop="onDrop" @dragend="onDragEnd">
      <BaseTable
        :columns="columns"
        :data="categories"
        empty-text="暂无分类"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'sortHandle'">
            <button
              draggable="true"
              class="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600"
              :class="{ 'opacity-30': draggedId === row.id }"
              @dragstart="onDragStart(row.id, $event)"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 4a2 2 0 100 4 2 2 0 000-4zM9 10a2 2 0 100 4 2 2 0 000-4zM9 16a2 2 0 100 4 2 2 0 000-4zM15 4a2 2 0 100 4 2 2 0 000-4zM15 10a2 2 0 100 4 2 2 0 000-4zM15 16a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </button>
          </template>
          <template v-else-if="column.key === 'actions'">
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
      </div>
    </BaseCard>

    <!-- Form Modal -->
    <BaseModal v-model="showForm" :title="editTarget ? '编辑分类' : '新增分类'" size="sm">
      <form @submit.prevent="handleSave">
        <div class="space-y-4">
          <div>
            <label class="label">名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="input" required placeholder="分类名称" />
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
      :message="`确定要删除分类「${deleteTarget?.name}」吗？`"
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { categoriesApi } from '@/api'
import type { Category } from '@/types'
import BaseModal from '@/components/BaseModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'

const columns = [
  { key: 'sortHandle', label: '' },
  { key: 'name', label: '名称' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const categories = ref<Category[]>([])
const showForm = ref(false)
const showDelete = ref(false)
const editTarget = ref<Category | null>(null)
const deleteTarget = ref<Category | null>(null)
const saving = ref(false)
const savingSortOrder = ref(false)
const draggedId = ref<number | null>(null)
const formError = ref('')

const form = reactive({ name: '' })

async function fetchData() {
  const result = await categoriesApi.getAll()
  if (!result.error) categories.value = result.data || []
}

function edit(cat: Category) {
  editTarget.value = cat
  form.name = cat.name || ''
  showForm.value = true
}

async function handleSave() {
  saving.value = true
  formError.value = ''
  try {
    const result = editTarget.value
      ? await categoriesApi.update(editTarget.value.id!, { name: form.name, sort_order: 0 })
      : await categoriesApi.create({ name: form.name, sort_order: 0 })
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

function confirmDelete(cat: Category) {
  deleteTarget.value = cat
  showDelete.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  await categoriesApi.delete(deleteTarget.value.id!)
  showDelete.value = false
  fetchData()
}

// --- Drag-and-Drop Sorting ---
function onDragStart(id: number, event: DragEvent) {
  if (savingSortOrder.value) { event.preventDefault(); return }
  draggedId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(id))
  }
}

function onDrop(event: DragEvent) {
  const tr = (event.target as HTMLElement).closest('tr')
  if (!tr || draggedId.value === null) return

  const tbody = tr.closest('tbody')
  if (!tbody) return

  const rows = Array.from(tbody.querySelectorAll('tr'))
  const dropIndex = rows.indexOf(tr)
  const dragIndex = categories.value.findIndex(c => c.id === draggedId.value)

  if (dragIndex === -1 || dropIndex === -1 || dragIndex === dropIndex) {
    draggedId.value = null
    return
  }

  // Reorder the array locally (visual update is instant)
  const item = categories.value.splice(dragIndex, 1)[0]
  categories.value.splice(dropIndex, 0, item)

  // Persist new sort_order to database
  saveSortOrder()
  draggedId.value = null
}

function onDragEnd() {
  draggedId.value = null
}

async function saveSortOrder() {
  savingSortOrder.value = true
  try {
    await Promise.all(
      categories.value.map((cat, index) =>
        categoriesApi.update(cat.id, { sort_order: index })
      )
    )
  } catch (e) {
    console.error('保存排序失败', e)
    fetchData() // Revert on failure
  } finally {
    savingSortOrder.value = false
  }
}

onMounted(fetchData)
</script>
