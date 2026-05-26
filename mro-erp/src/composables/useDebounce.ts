import { ref, watch, onUnmounted, type Ref } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay: number = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>

  let timeout: ReturnType<typeof setTimeout> | undefined
  watch(value, (newValue) => {
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  onUnmounted(() => {
    if (timeout !== undefined) clearTimeout(timeout)
  })

  return debouncedValue
}

/**
 * 回调函数防抖 —— 替代各处手动 clearTimeout + setTimeout 的重复代码
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const debounced = (...args: Parameters<T>) => {
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
  onUnmounted(() => {
    if (timeout !== undefined) clearTimeout(timeout)
  })
  return debounced
}
