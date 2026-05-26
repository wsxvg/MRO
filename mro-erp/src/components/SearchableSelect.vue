<template>
  <div ref="containerRef" class="relative">
    <!-- Trigger: display selected or input for search -->
    <div
      class="input flex items-center gap-2 cursor-pointer"
      :class="[disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:border-gray-400', focused && !disabled ? 'ring-2 ring-gray-900 border-gray-900' : '']"
      @click="openDropdown"
    >
      <!-- Selected label -->
      <span v-if="!searching && selectedLabel" class="flex-1 truncate">{{ selectedLabel }}</span>
      <span v-else-if="!searching" class="flex-1 text-gray-400">{{ placeholder }}</span>

      <!-- Search input (when open) -->
      <input
        v-if="open"
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        class="absolute inset-0 w-full bg-transparent px-3 outline-none text-sm"
        :placeholder="selectedLabel || placeholder"
        @input="onSearchInput"
        @keydown.escape.prevent="closeDropdown"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.tab="closeDropdown"
        @click.stop
      />

      <!-- Clear button -->
      <button
        v-if="modelValue !== null && modelValue !== '' && !disabled"
        type="button"
        class="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        @click.stop="clearSelection"
        tabindex="-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Chevron -->
      <svg
        class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': open }"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="open"
          ref="dropdownRef"
          class="fixed z-[100] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
          :style="dropdownStyle"
        >
          <!-- No results -->
          <div v-if="filteredOptions.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
            {{ emptyText }}
          </div>

          <!-- Options list -->
          <div class="max-h-60 overflow-y-auto py-1">
            <button
              v-for="(opt, i) in filteredOptions"
              :key="opt.value"
              type="button"
              class="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
              :class="i === highlightIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'"
              @click="selectOption(opt)"
              @mouseenter="highlightIndex = i"
            >
              <svg
                v-if="modelValue === opt.value"
                class="w-4 h-4 flex-shrink-0 text-primary-600"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else class="w-4 flex-shrink-0" />
              <span class="truncate">{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

interface SelectOption {
  value: string | number
  label: string
}

const props = withDefaults(defineProps<{
  options: SelectOption[]
  modelValue?: string | number | null
  placeholder?: string
  disabled?: boolean
  emptyText?: string
}>(), {
  modelValue: null,
  placeholder: '请选择',
  disabled: false,
  emptyText: '无匹配结果',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  change: [value: string | number | null]
}>()

// Refs
const containerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const open = ref(false)
const searching = ref(false)
const searchQuery = ref('')
const highlightIndex = ref(0)
const focused = ref(false)
const dropdownStyle = ref<Record<string, string>>({})

// Computed
const selectedLabel = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : ''
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

// Methods
function openDropdown() {
  if (props.disabled) return
  open.value = true
  searching.value = true
  focused.value = true
  searchQuery.value = ''
  highlightIndex.value = 0
  nextTick(() => {
    positionDropdown()
    searchInputRef.value?.focus()
  })
}

function closeDropdown() {
  open.value = false
  searching.value = false
  searchQuery.value = ''
  focused.value = false
}

function positionDropdown() {
  if (!containerRef.value || !dropdownRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    minWidth: `${Math.max(rect.width, 200)}px`,
  }
}

function onSearchInput() {
  highlightIndex.value = 0
  nextTick(() => positionDropdown())
}

function selectOption(opt: SelectOption) {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  closeDropdown()
}

function clearSelection() {
  emit('update:modelValue', null)
  emit('change', null)
}

function selectHighlighted() {
  const opt = filteredOptions.value[highlightIndex.value]
  if (opt) selectOption(opt)
}

function highlightNext() {
  if (highlightIndex.value < filteredOptions.value.length - 1) {
    highlightIndex.value++
    scrollToHighlight()
  }
}

function highlightPrev() {
  if (highlightIndex.value > 0) {
    highlightIndex.value--
    scrollToHighlight()
  }
}

function scrollToHighlight() {
  const el = dropdownRef.value?.querySelectorAll('button')[highlightIndex.value]
  el?.scrollIntoView({ block: 'nearest' })
}

// Click outside handler
function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (containerRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  closeDropdown()
}

watch(open, (val) => {
  if (val) {
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('scroll', positionDropdown, true)
    window.addEventListener('resize', positionDropdown)
  } else {
    document.removeEventListener('mousedown', onClickOutside)
    document.removeEventListener('scroll', positionDropdown, true)
    window.removeEventListener('resize', positionDropdown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('scroll', positionDropdown, true)
  window.removeEventListener('resize', positionDropdown)
})
</script>

<style scoped>
.dropdown-enter-active {
  transition: all 0.15s ease-out;
}
.dropdown-leave-active {
  transition: all 0.1s ease-in;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
