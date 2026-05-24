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
        <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">1</span>
            客户信息
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="label">名称 <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" class="input" required placeholder="客户名称" />
            </div>
            <div>
              <label class="label">客户类型</label>
              <div class="flex gap-3 mt-1">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input v-model="form.type" type="radio" value="retail" class="w-4 h-4 text-primary-600" />
                  <span class="text-sm text-gray-700">零售客户</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input v-model="form.type" type="radio" value="wholesale" class="w-4 h-4 text-primary-600" />
                  <span class="text-sm text-gray-700">批发客户</span>
                </label>
              </div>
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

          <div v-if="error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{{ error }}</div>

          <!-- Actions -->
          <div class="flex gap-3 mt-6 pt-5 border-t border-gray-100">
          <button type="submit" :disabled="saving" class="btn-primary min-w-[100px] flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button v-if="!standalone" type="button" class="btn-secondary" @click="emit('cancel')">取消</button>
          <router-link v-else to="/customers" class="btn-secondary">取消</router-link>
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
const form = reactive({ name: '', type: 'retail', contact_person: '', phone: '', address: '', credit_limit: 0, remark: '' })

async function load() {
  if (!isEdit) return
  const id = props.standalone ? Number(route.params.id) : props.customerId!
  const res = await fetchCustomer(id)
  if (res.data) {
    const d = res.data; form.name = d.name || ''; form.type = d.type || 'retail'; form.contact_person = d.contact_person || ''
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
    form.name = ''; form.type = 'retail'; form.contact_person = ''; form.phone = ''; form.address = ''
    form.credit_limit = 0; form.remark = ''
    load()
  }
})

onMounted(load)
</script>
