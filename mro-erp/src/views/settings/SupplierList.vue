<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900">供应商管理</h2>
      <button class="btn-primary text-sm" @click="openForm()">+ 新增供应商</button>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-center justify-between">
      <span>{{ error }}</span>
      <button @click="fetchData" class="text-red-600 font-medium hover:underline">重试</button>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- 列表 -->
    <div v-else-if="!error && suppliers.length > 0" class="bg-white rounded-xl border border-gray-100">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">名称</th>
            <th class="px-5 py-3 font-medium">联系人</th>
            <th class="px-5 py-3 font-medium">电话</th>
            <th class="px-5 py-3 font-medium">地址</th>
            <th class="px-5 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in suppliers" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="px-5 py-3 font-medium text-gray-900">{{ s.name }}</td>
            <td class="px-5 py-3 text-gray-600">{{ s.contact_person || '-' }}</td>
            <td class="px-5 py-3 text-gray-600">{{ s.phone || '-' }}</td>
            <td class="px-5 py-3 text-gray-500">{{ s.address || '-' }}</td>
            <td class="px-5 py-3 text-right space-x-2">
              <button class="text-primary-600 hover:text-primary-700 text-sm" @click="openForm(s)">编辑</button>
              <button class="text-red-500 hover:text-red-600 text-sm" @click="handleDelete(s)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-12 text-gray-400">
      暂无供应商，点击上方按钮新增
    </div>

    <!-- 表单弹窗 -->
    <div v-if="formDialog.visible" class="fixed inset-0 bg-black/10 flex items-center justify-center z-50" @click.self="formDialog.visible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">{{ formDialog.editingId ? '编辑供应商' : '新增供应商' }}</h3>
        <div>
          <label class="label">名称 <span class="text-red-500">*</span></label>
          <input v-model="formDialog.name" type="text" class="input" placeholder="供应商名称" autofocus />
        </div>
        <div>
          <label class="label">联系人</label>
          <input v-model="formDialog.contact_person" type="text" class="input" placeholder="可选" />
        </div>
        <div>
          <label class="label">电话</label>
          <input v-model="formDialog.phone" type="text" class="input" placeholder="可选" />
        </div>
        <div>
          <label class="label">地址</label>
          <input v-model="formDialog.address" type="text" class="input" placeholder="可选" />
        </div>
        <div>
          <label class="label">备注</label>
          <input v-model="formDialog.remark" type="text" class="input" placeholder="可选" />
        </div>
        <div v-if="formDialog.error" class="text-sm text-red-600">{{ formDialog.error }}</div>
        <div class="flex gap-3 justify-end">
          <button class="btn-secondary" @click="formDialog.visible = false">取消</button>
          <button class="btn-primary" :disabled="!formDialog.name || formDialog.saving" @click="handleSave">
            {{ formDialog.saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
    <ConfirmDialog v-model="showDeleteConfirm" title="删除供应商" :message="'确定删除供应商\u300C' + deletingSupplier?.name + '\u300D？'" @confirm="doDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { suppliersApi } from '@/api'
import type { Supplier } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const suppliers = ref<Supplier[]>([])
const loading = ref(true)
const error = ref('')
const showDeleteConfirm = ref(false)
const deletingSupplier = ref<Supplier | null>(null)

const formDialog = reactive({
  visible: false,
  saving: false,
  editingId: null as number | null,
  name: '',
  contact_person: '',
  phone: '',
  address: '',
  remark: '',
  error: '',
})

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await suppliersApi.getAll()
    suppliers.value = data ?? []
  } catch (e) {
    error.value = '加载失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

function openForm(supplier?: Supplier) {
  formDialog.editingId = supplier?.id ?? null
  formDialog.name = supplier?.name ?? ''
  formDialog.contact_person = supplier?.contact_person ?? ''
  formDialog.phone = supplier?.phone ?? ''
  formDialog.address = supplier?.address ?? ''
  formDialog.remark = supplier?.remark ?? ''
  formDialog.error = ''
  formDialog.visible = true
}

async function handleSave() {
  if (!formDialog.name) return
  formDialog.saving = true
  formDialog.error = ''

  const input = {
    name: formDialog.name,
    contact_person: formDialog.contact_person || null,
    phone: formDialog.phone || null,
    address: formDialog.address || null,
    remark: formDialog.remark || null,
  }

  if (formDialog.editingId) {
    const { error } = await suppliersApi.update(formDialog.editingId, input)
    if (error) { formDialog.error = error; formDialog.saving = false; return }
  } else {
    const { data, error } = await suppliersApi.create(input)
    if (error) { formDialog.error = error; formDialog.saving = false; return }
    if (data) suppliers.value.push(data)
  }

  formDialog.visible = false
  formDialog.saving = false
  fetchData()
}

async function handleDelete(supplier: Supplier) {
  deletingSupplier.value = supplier
  showDeleteConfirm.value = true
}
async function doDelete() {
  if (!deletingSupplier.value) return
  showDeleteConfirm.value = false
  const { error } = await suppliersApi.delete(deletingSupplier.value.id)
  if (!error) {
    suppliers.value = suppliers.value.filter(s => s.id !== deletingSupplier.value!.id)
  }
}

onMounted(fetchData)
</script>
