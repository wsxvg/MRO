<template>
  <BaseModal v-model="visible" title="修改密码">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="space-y-1.5">
        <label for="cp-old" class="text-sm font-medium text-gray-700">当前密码</label>
        <input id="cp-old" v-model="oldPassword" type="password" placeholder="输入当前密码" required class="input" />
      </div>

      <div class="space-y-1.5">
        <label for="cp-new" class="text-sm font-medium text-gray-700">新密码</label>
        <input id="cp-new" v-model="newPassword" type="password" placeholder="至少3位字符" required minlength="3" class="input" />
      </div>

      <div class="space-y-1.5">
        <label for="cp-confirm" class="text-sm font-medium text-gray-700">确认新密码</label>
        <input id="cp-confirm" v-model="confirmPassword" type="password" placeholder="再次输入新密码" required class="input" />
      </div>

      <div v-if="error" class="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl">{{ error }}</div>
      <div v-if="success" class="p-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl">{{ success }}</div>
    </form>

    <template #footer>
      <button type="button" @click="close" class="flex-1 h-10 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">取消</button>
      <button :disabled="loading" class="flex-1 h-10 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-xl transition-all" @click="handleSubmit">
        {{ loading ? '修改中...' : '确认修改' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import { useAuthStore } from '@/stores/auth'

const visible = defineModel<boolean>({ required: true })
const auth = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = ''

  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的新密码不一致'
    return
  }

  loading.value = true
  try {
    const result = await auth.changePassword(oldPassword.value, newPassword.value)
    if (result.success) {
      success.value = '密码修改成功'
      setTimeout(close, 1500)
    } else {
      error.value = result.error || '修改失败'
    }
  } finally {
    loading.value = false
  }
}

function close() {
  visible.value = false
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  error.value = ''
  success.value = ''
}
</script>
