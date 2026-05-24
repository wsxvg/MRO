<template>
  <div>
    <template v-if="standalone">
      <div class="flex items-center gap-4 mb-6">
        <router-link to="/settings/warehouses" class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <h1 class="text-xl font-bold text-gray-900">{{ isEdit ? '编辑仓库' : '新增仓库' }}</h1>
      </div>
    </template>

    <div :class="standalone ? 'max-w-2xl' : ''">
      <form @submit.prevent="handleSubmit" :class="standalone ? 'bg-white rounded-xl border border-gray-100 p-5 space-y-4' : 'space-y-4'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="input" required placeholder="仓库名称" />
          </div>
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-700 mb-1 block">位置</label>
            <input v-model="form.location" type="text" class="input" placeholder="仓库位置（可选）" />
          </div>
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-700 mb-1 block">备注</label>
            <textarea v-model="form.remark" class="input" rows="2" placeholder="备注信息..." />
          </div>
          <div class="md:col-span-2">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" v-model="form.is_default" class="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              <div>
                <span class="text-sm font-medium text-gray-700">设为默认仓库</span>
                <p class="text-xs text-gray-400 mt-0.5">快速开单将默认使用此仓库</p>
              </div>
            </label>
          </div>
        </div>
        <div v-if="error" class="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg">{{ error }}</div>
        <div class="flex gap-3 pt-2">
          <button type="submit" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <router-link v-if="standalone" to="/settings/warehouses" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</router-link>
          <button v-else type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" @click="emit('cancel')">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchWarehouse, createWarehouse, updateWarehouse } from '@/api'

const props = withDefaults(defineProps<{
  standalone?: boolean
  warehouseId?: number | null
}>(), {
  standalone: true,
  warehouseId: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const route = useRoute(); const router = useRouter()
const isEdit = props.standalone ? !!route.params.id : !!props.warehouseId
const saving = ref(false); const error = ref('')
const form = reactive({ name: '', location: '', remark: '', is_default: false })

async function load() {
  if (!isEdit) return
  const id = props.standalone ? Number(route.params.id) : props.warehouseId!
  const res = await fetchWarehouse(id)
  if (res.data) {
    const d = res.data
    form.name = d.name || ''
    form.location = d.location || ''
    form.remark = d.remark || ''
    form.is_default = !!d.is_default
  }
}

async function handleSubmit() {
  saving.value = true; error.value = ''
  const data = {
    name: form.name,
    location: form.location || null,
    remark: form.remark || null,
    is_default: form.is_default
  }
  const id = props.standalone ? Number(route.params.id) : props.warehouseId!
  const res = isEdit ? await updateWarehouse(id, data) : await createWarehouse(data)
  if (res.data) {
    if (props.standalone) router.push('/settings/warehouses')
    else emit('saved')
  } else {
    error.value = res.error || '保存失败'
  }
  saving.value = false
}

watch(() => props.warehouseId, () => {
  if (props.warehouseId) {
    form.name = ''; form.location = ''; form.remark = ''; form.is_default = false
    load()
  }
})

onMounted(load)
</script>
