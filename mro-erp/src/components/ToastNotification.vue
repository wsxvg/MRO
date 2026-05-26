<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm transition-all"
          :class="bgMap[t.type]"
        >
          <!-- Icon -->
          <i class="mt-0.5 text-lg" :class="iconMap[t.type]"></i>

          <!-- Message -->
          <p class="flex-1 text-sm leading-relaxed text-gray-900">{{ t.message }}</p>

          <!-- Close -->
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="removeToast(t.id)"
            aria-label="关闭"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import type { ToastType } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const bgMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
}

const iconMap: Record<ToastType, string> = {
  success: 'ri-checkbox-circle-line text-green-500',
  error: 'ri-error-warning-line text-red-500',
  warning: 'ri-alert-line text-amber-500',
  info: 'ri-information-line text-blue-500',
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
