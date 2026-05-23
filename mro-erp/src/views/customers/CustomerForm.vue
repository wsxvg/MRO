<template>
  <div class="max-w-3xl mx-auto py-6">
    <!-- Header -->
    <template v-if="standalone">
      <div class="flex items-center gap-4 mb-6">
        <router-link to="/customers" class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? '编辑客户' : '新增客户' }}</h1>
      </div>
    </template>

    <div :class="standalone ? '' : ''">
      <form @submit.prevent="handleSubmit">
        <!-- Main section -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-6">
            <span class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
            <h2 class="text-lg font-bold text-gray-900">客户信息</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="label">名称 <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" class="input" required placeholder="客户名称" />
            </div>
            <div>
              <label class="label">联系人</label>
              <input v-model="form.contact_person" type="text" class="input" placeholder="联系人姓名" />
            </div>
            <div>
              <label class="label">电话</label>
              <input v-model="form.phone" type="text" class="input" placeholder="联系电话" />
            </div>
            <div>
              <label class="label">地址</label>
              <input v-model="form.address" type="text" class="input" placeholder="客户地址" />
            </div>
            <div>
              <label class="label">信用额度</label>
              <input v-model.number="form.credit_limit" type="number" step="0.01" class="input" placeholder="0.00" />
            </div>
            <div class="md:col-span-2">
              <label class="label">备注</label>
              <textarea v-model="form.remark" class="input" rows="3" placeholder="备注信息..." />
            </div>
          </div>

          <div v-if="error" class="mt-4 text-red-600 text-sm bg-red-50 rounded-lg p-3">{{ error }}</div>

          <!-- Actions -->
          <div class="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <button type="submit" :disabled="saving" class="px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all">
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button v-if="!standalone" type="button" class="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all" @click="emit('cancel')">取消</button>
            <router-link v-else to="/customers" class="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">取消</router-link>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCustomer, createCustomer, updateCustomer } from '@/api'
import type { Customer } from '@/types'

const props = withDefaults(defineProps<{
  standalone?: boolean
  customerId?: number | null
}>(), {
  standalone: true,
  customerId: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const route = useRoute(); const router = useRouter()
const isEdit = props.standalone ? !!route.params.id : !!props.customerId
const saving = ref(false); const error = ref('')
const form = reactive({ name: '', contact_person: '', phone: '', address: '', credit_limit: 0, remark: '' })

async function load() {
  if (!isEdit) return
  const id = props.standalone ? Number(route.params.id) : props.customerId!
  const res = await fetchCustomer(id)
  if (res.data) {
    const d = res.data; form.name = d.name || ''; form.contact_person = d.contact_person || ''
    form.phone = d.phone || ''; form.address = d.address || ''
    form.credit_limit = d.credit_limit || 0; form.remark = d.remark || ''
  }
}

async function handleSubmit() {
  saving.value = true; error.value = ''
  const data = { ...form, credit_limit: form.credit_limit || 0 }
  const id = props.standalone ? Number(route.params.id) : props.customerId!
  const res = isEdit ? await updateCustomer(id, data) : await createCustomer(data)
  if (res.data) {
    if (props.standalone) router.push('/customers')
    else emit('saved')
  } else {
    error.value = res.error || '保存失败'
  }
  saving.value = false
}

watch(() => props.customerId, () => {
  if (props.customerId) {
    form.name = ''; form.contact_person = ''; form.phone = ''; form.address = ''
    form.credit_limit = 0; form.remark = ''
    load()
  }
})

onMounted(load)
</script>
