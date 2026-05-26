<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="handleCancel">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <!-- Dialog -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-1">{{ title }}</h3>
          <p class="text-sm text-gray-500 mb-4">{{ description }}</p>

          <!-- Password Input -->
          <div class="relative mb-4">
            <input
              ref="inputRef"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input pr-10"
              :class="{ 'border-red-300 focus:ring-red-500': errorMsg }"
              :placeholder="placeholder"
              @keydown.enter="handleConfirm"
              @input="errorMsg = ''"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <!-- Eye open -->
              <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <!-- Eye closed -->
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            </button>
          </div>

          <!-- Error -->
          <Transition name="msg">
            <p v-if="errorMsg" class="text-sm text-red-500 mb-3 flex items-center gap-1.5">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ errorMsg }}
            </p>
          </Transition>

          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button type="button" class="btn-secondary text-sm px-4 py-2" @click="handleCancel">取消</button>
            <button type="button" class="btn-primary text-sm px-4 py-2" :disabled="!password" @click="handleConfirm">确认</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  description?: string
  placeholder?: string
}>(), {
  title: '请输入密码',
  description: '此操作需要密码验证',
  placeholder: '输入密码',
})

const emit = defineEmits<{
  close: []
  verified: [pwd: string]
}>()

const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function handleConfirm() {
  if (!password.value) return
  emit('verified', password.value)
}

function handleCancel() {
  password.value = ''
  errorMsg.value = ''
  showPassword.value = false
  emit('close')
}

function showError(msg: string) {
  errorMsg.value = msg
  password.value = ''
}

watch(() => props.visible, async (val) => {
  if (val) {
    password.value = ''
    errorMsg.value = ''
    showPassword.value = false
    await nextTick()
    inputRef.value?.focus()
  }
})

defineExpose({ showError })
</script>

<style scoped>
.dialog-enter-active {
  transition: all 0.2s ease-out;
}
.dialog-leave-active {
  transition: all 0.15s ease-in;
}
.dialog-enter-from {
  opacity: 0;
}
.dialog-enter-from > div:last-child {
  transform: scale(0.95);
}
.dialog-leave-to {
  opacity: 0;
}

.msg-enter-active {
  transition: all 0.2s ease-out;
}
.msg-leave-active {
  transition: all 0.15s ease-in;
}
.msg-enter-from,
.msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
