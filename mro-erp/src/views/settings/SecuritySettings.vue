<template>
  <div class="page-padding">
    <BasePageHeader title="安全设置" />

    <!-- Cost Price Password Card -->
    <BaseCard>
      <template #default>
        <div class="p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-1">成本价密码</h3>
          <p class="text-sm text-gray-500 mb-6">
            修改查看成本价时所需的密码。修改后需重新输入新密码才能查看成本价。
          </p>

          <div class="max-w-md space-y-6">
            <!-- Current status -->
            <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
              <span class="text-sm text-gray-600">当前密码</span>
              <span class="text-sm font-medium text-gray-900">已设置</span>
            </div>

            <!-- Security Question Verification -->
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-xs font-medium text-amber-700 mb-1">安全问题验证</p>
                  <p class="text-sm text-amber-800">{{ SECURITY_QUESTION }}</p>
                </div>
              </div>
            </div>

            <!-- Change Password Form -->
            <form @submit.prevent="handleChangePassword" class="space-y-4">
              <div class="space-y-1.5">
                <label class="label">安全问题答案</label>
                <input
                  v-model="form.answer"
                  type="text"
                  class="input"
                  placeholder="输入安全问题答案"
                  required
                  :disabled="changed"
                />
              </div>

              <div class="space-y-1.5">
                <label class="label">新密码</label>
                <input
                  v-model="form.newPassword"
                  type="password"
                  class="input"
                  placeholder="输入新密码（至少 3 位）"
                  required
                  minlength="3"
                  :disabled="changed"
                />
              </div>

              <!-- Messages -->
              <Transition name="fade-slide">
                <div
                  v-if="error"
                  class="p-3.5 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-2.5"
                >
                  <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ error }}</span>
                </div>
              </Transition>
              <Transition name="fade-slide">
                <div
                  v-if="success"
                  class="p-3.5 text-sm bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-start gap-2.5"
                >
                  <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ success }}</span>
                </div>
              </Transition>

              <div class="flex gap-3 pt-1">
                <button
                  type="submit"
                  class="btn-primary text-sm"
                  :disabled="saving || changed"
                >
                  <svg v-if="saving" class="animate-spin -ml-1 mr-1.5 w-4 h-4 inline" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ saving ? '修改中...' : '确认修改' }}
                </button>
                <button
                  v-if="changed"
                  type="button"
                  class="btn-secondary text-sm"
                  @click="resetForm"
                >
                  继续修改
                </button>
              </div>
            </form>
          </div>
        </div>
      </template>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCostPriceAccess } from '@/composables/useCostPriceAccess'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'

const { changePassword, COST_PRICE_SECURITY_QUESTION } = useCostPriceAccess()
const SECURITY_QUESTION = COST_PRICE_SECURITY_QUESTION

const form = ref({
  answer: '',
  newPassword: '',
})
const error = ref('')
const success = ref('')
const saving = ref(false)
const changed = ref(false)

function resetForm() {
  form.value.answer = ''
  form.value.newPassword = ''
  error.value = ''
  success.value = ''
  changed.value = false
}

async function handleChangePassword() {
  error.value = ''
  success.value = ''
  saving.value = true

  try {
    const result = changePassword(form.value.answer, form.value.newPassword)
    if (result.success) {
      success.value = '密码修改成功'
      changed.value = true
    } else {
      error.value = result.error || '修改失败'
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
