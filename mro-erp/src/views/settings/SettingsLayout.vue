<template>
  <div class="flex gap-0 h-full">
    <!-- Settings sub-sidebar -->
    <aside class="w-48 flex-shrink-0 bg-white border-r border-gray-200">
      <div class="p-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-900">系统设置</h2>
      </div>
      <nav class="p-2 space-y-1">
        <router-link
          v-for="item in settingsNav"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive(item.path) ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
        >
          <span v-html="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Content -->
    <div class="flex-1 min-w-0 overflow-auto p-6">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

interface SettingsNavItem {
  label: string
  path: string
  icon: string
}

const settingsNav: SettingsNavItem[] = [
  {
    label: '仓库管理',
    path: '/settings/warehouses',
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2M8 7h8M8 11h8M8 15h4" /></svg>'
  },
  {
    label: '分类管理',
    path: '/settings/categories',
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>'
  },
  {
    label: '单位管理',
    path: '/settings/units',
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>'
  },
]

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>
