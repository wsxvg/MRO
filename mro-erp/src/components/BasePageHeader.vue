<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <router-link
        v-if="to"
        :to="to"
        class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
      >
        <i class="ri-arrow-left-s-line text-gray-500" />
      </router-link>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-gray-400 mt-1">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  to?: string
}>()
</script>
