<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="title || '确认对话框'"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-gray-950/45 backdrop-blur-sm" @click="onCancel" />

        <!-- Panel -->
        <div
          class="relative w-full max-w-sm bg-white rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-gray-200/70 p-6 text-center overflow-hidden"
          @click.stop
        >

          <!-- Icon -->
          <div
            class="mx-auto mb-4 size-12 rounded-2xl flex items-center justify-center"
            :class="iconBgClass"
          >
            <!-- Danger: trash icon -->
            <svg v-if="type === 'danger'" class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <!-- Info: question mark circle -->
            <svg v-else class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>

          <!-- Message -->
          <p class="text-sm text-gray-600 mb-6 leading-relaxed">{{ message }}</p>

          <!-- Loading state -->
          <div v-if="loading" class="flex justify-center mb-6">
            <svg class="animate-spin h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          <!-- Buttons -->
          <div v-if="!loading" class="flex gap-3">
            <button
              type="button"
              class="flex-1 h-10 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="flex-1 h-10 text-sm font-semibold text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              :class="confirmBtnClass"
              :disabled="loading"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  type?: 'danger' | 'info'
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>(), {
  title: '确认操作',
  message: '确定要执行此操作吗？',
  type: 'danger',
  confirmText: '确认删除',
  cancelText: '取消',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const iconBgClass = computed(() =>
  props.type === 'danger'
    ? 'bg-red-50'
    : 'bg-primary-50'
)

const confirmBtnClass = computed(() =>
  props.type === 'danger'
    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
    : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
)

function close() {
  emit('update:modelValue', false)
}

function onCancel() {
  emit('cancel')
  close()
}

function onConfirm() {
  emit('confirm')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.2s ease-out;
}
.modal-leave-active {
  transition: all 0.15s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>
