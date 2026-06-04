<template>
  <Teleport to="body">
    <Transition
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="modelValue"
        ref="overlayRef"
        class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[8vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="fixed inset-0 bg-gray-950/45 backdrop-blur-sm modal-overlay" @click="close" />

        <div
          ref="panelRef"
          class="relative w-full rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-gray-200/70 bg-white overflow-hidden modal-panel"
          :class="sizeClass"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur">
            <h3 :id="titleId" class="text-lg font-semibold tracking-tight text-gray-900">{{ title }}</h3>
            <button
              type="button"
              aria-label="关闭"
              class="size-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              @click="close"
            >
              <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 bg-white">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 bg-gray-50/70">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'

function onBeforeEnter(el: Element) {
  gsap.set(el, { opacity: 0 })
  const overlay = el.querySelector('.modal-overlay')
  const panel = el.querySelector('.modal-panel')
  if (overlay) gsap.set(overlay, { opacity: 0 })
  if (panel) gsap.set(panel, { opacity: 0, scale: 0.95, y: 16 })
}

function onEnter(el: Element, done: () => void) {
  const overlay = el.querySelector('.modal-overlay')
  const panel = el.querySelector('.modal-panel')
  const tl = gsap.timeline({ onComplete: done })
  tl.to(el, { opacity: 1, duration: 0.15 })
  if (overlay) tl.to(overlay, { opacity: 1, duration: 0.2 }, '<')
  if (panel) tl.to(panel, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.2)' }, '-=0.1')
}

function onLeave(el: Element, done: () => void) {
  const panel = el.querySelector('.modal-panel')
  const overlay = el.querySelector('.modal-overlay')
  const tl = gsap.timeline({ onComplete: done })
  if (panel) tl.to(panel, { opacity: 0, scale: 0.96, y: 8, duration: 0.2, ease: 'power2.in' })
  if (overlay) tl.to(overlay, { opacity: 0, duration: 0.2 }, '-=0.1')
  tl.to(el, { opacity: 0, duration: 0.1 }, '-=0.05')
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  title: '',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const overlayRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const titleId = computed(() => `modal-title-${Math.random().toString(36).slice(2, 8)}`)

const sizeClass = computed(() => ({
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}[props.size]))

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
    return
  }
  if (e.key === 'Tab' && props.modelValue) {
    trapFocus(e)
  }
}

function trapFocus(e: KeyboardEvent) {
  const panel = panelRef.value
  if (!panel) return

  const focusable = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function restoreFocus() {
  if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
    previouslyFocused.focus()
  }
  previouslyFocused = null
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    previouslyFocused = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    // Focus the first focusable element in the panel
    const panel = panelRef.value
    if (panel) {
      const first = panel.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (first) first.focus()
    }
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
    restoreFocus()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
  restoreFocus()
})
</script>

