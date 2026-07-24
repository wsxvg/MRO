/**
 * Toast 通知系统
 *
 * 模块级单例 — 所有组件共用一个 toasts 数组，
 * ToastNotification.vue 监听该数组渲染通知。
 *
 * 用法：
 *   const { success, error, warning, info } = useToast()
 *   success('保存成功')
 *   error('网络连接失败')
 */
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
}

// ===== Module-level singleton state =====
const toasts = ref<ToastItem[]>([])
let nextId = 0

export function useToast() {
  function showToast(message: string, type: ToastType = 'error', duration = 4000) {
    const id = ++nextId
    toasts.value.push({ id, message, type, duration })

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }

  function removeToast(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  // Convenience shortcuts
  function success(msg: string) { showToast(msg, 'success', 3000) }
  function error(msg: string)   { showToast(msg, 'error', 5000) }
  function warning(msg: string) { showToast(msg, 'warning', 4000) }
  function info(msg: string)    { showToast(msg, 'info', 3000) }

  return { toasts, showToast, removeToast, success, error, warning, info }
}
