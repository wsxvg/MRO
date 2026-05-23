<template>
  <div>
    <template v-if="standalone">
      <div class="flex items-center gap-4 mb-6">
        <router-link to="/settings/warehouses" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '编辑仓库' : '新增仓库' }}</h1>
      </div>
    </template>

    <div :class="standalone ? 'max-w-2xl' : ''">
      <form @submit.prevent="handleSubmit" :class="standalone ? 'card space-y-4' : 'space-y-4'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="input" required placeholder="仓库名称" />
          </div>
          <div class="md:col-span-2">
            <label class="label">位置</label>
            <input v-model="form.location" type="text" class="input" placeholder="仓库位置" />
          </div>
          <div class="md:col-span-2">
            <label class="label">备注</label>
            <textarea v-model="form.remark" class="input" rows="2" placeholder="备注..." />
          </div>
        </div>
        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
        <div class="flex gap-3">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? '保存中...' : '保存' }}</button>
          <button v-if="!standalone" type="button" class="btn-secondary" @click="emit('cancel')">取消</button>
          <router-link v-else to="/settings/warehouses" class="btn-secondary">取消</router-link>
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
const form = reactive({ name: '', location: '', remark: '' })

async function load() {
  if (!isEdit) return
  const id = props.standalone ? Number(route.params.id) : props.warehouseId!
  const res = await fetchWarehouse(id)
  if (res.data) {
    const d = res.data; form.name = d.name || ''
    form.location = d.location || ''; form.remark = d.remark || ''
  }
}

async function handleSubmit() {
  saving.value = true; error.value = ''
  const data = { name: form.name, location: form.location || null, remark: form.remark || null }
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
    form.name = ''; form.location = ''; form.remark = ''
    load()
  }
})

onMounted(load)
</script>
