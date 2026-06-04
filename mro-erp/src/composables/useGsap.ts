import { type Ref } from 'vue'
import gsap from 'gsap'

/**
 * 数字滚动动画（从 0 到目标值）
 */
export function useCountUp(target: Ref<number>, element: Ref<HTMLElement | null>, options?: {
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const { duration = 1.2, prefix = '', suffix = '', decimals = 0 } = options ?? {}
  let ctx: gsap.Context | null = null

  function animate() {
    if (!element.value) return
    const obj = { val: 0 }
    ctx = gsap.context(() => {
      gsap.to(obj, {
        val: target.value,
        duration,
        ease: 'power2.out',
        onUpdate() {
          if (element.value) {
            const formatted = decimals > 0
              ? obj.val.toFixed(decimals)
              : Math.round(obj.val).toLocaleString()
            element.value.textContent = `${prefix}${formatted}${suffix}`
          }
        }
      })
    })
  }

  function cleanup() { ctx?.revert() }

  return { animate, cleanup }
}

/**
 * 交错入场动画
 */
export function useStaggerIn(container: Ref<HTMLElement | null>, selector: string, options?: {
  delay?: number
  stagger?: number
  duration?: number
  y?: number
}) {
  const { delay = 0.1, stagger = 0.08, duration = 0.5, y = 20 } = options ?? {}
  let ctx: gsap.Context | null = null

  function animate() {
    if (!container.value) return
    ctx = gsap.context(() => {
      gsap.from(selector, {
        y,
        opacity: 0,
        duration,
        stagger,
        delay,
        ease: 'power2.out',
      })
    }, container.value)
  }

  function cleanup() { ctx?.revert() }

  return { animate, cleanup }
}

/**
 * 淡入动画
 */
export function useFadeIn(element: Ref<HTMLElement | null>, options?: {
  delay?: number
  duration?: number
  y?: number
}) {
  const { delay = 0, duration = 0.5, y = 15 } = options ?? {}
  let ctx: gsap.Context | null = null

  function animate() {
    if (!element.value) return
    ctx = gsap.context(() => {
      gsap.from(element.value, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: 'power2.out',
      })
    })
  }

  function cleanup() { ctx?.revert() }

  return { animate, cleanup }
}

/**
 * 进度条动画
 */
export function useProgressAnimate(element: Ref<HTMLElement | null>, targetWidth: string, options?: {
  delay?: number
  duration?: number
}) {
  const { delay = 0.3, duration = 1 } = options ?? {}
  let ctx: gsap.Context | null = null

  function animate() {
    if (!element.value) return
    ctx = gsap.context(() => {
      gsap.fromTo(element.value,
        { width: '0%' },
        { width: targetWidth, duration, delay, ease: 'power2.out' }
      )
    })
  }

  function cleanup() { ctx?.revert() }

  return { animate, cleanup }
}

export { gsap }
