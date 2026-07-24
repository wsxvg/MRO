<template>
  <div class="surface" :class="{ 'p-5': !noPadding && !paddingless }">
    <div v-if="$slots.header || title" class="flex items-center justify-between mb-4">
      <h3 v-if="title" class="text-sm font-semibold text-gray-900 tracking-wide">{{ title }}</h3>
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  noPadding?: boolean
  paddingless?: boolean
}>(), {
  noPadding: false,
  paddingless: false
})
</script>
