<template>
  <div class="flex h-screen bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.04),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(75,85,99,0.05),_transparent_26%),#f8fafc]">

    <!-- Desktop sidebar -->
    <aside :class="[
      'hidden lg:flex flex-col bg-white/90 backdrop-blur-xl border-r border-gray-200/80 flex-shrink-0 transition-all duration-300 shadow-[0_12px_40px_rgba(15,23,42,0.04)]',
      sidebarCollapsed ? 'w-nav' : 'w-nav-expanded'
    ]">
      <!-- Logo -->
      <div :class="['flex items-center h-16 border-b border-gray-100/80', sidebarCollapsed ? 'justify-center' : 'px-4 gap-3']">
        <div class="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <circle cx="12" cy="12" r="5.5" stroke-dasharray="2 3" />
            <circle cx="12" cy="12" r="3" stroke-dasharray="1.5 2" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke-linecap="round" />
            <circle cx="7.76" cy="7.76" r="0.8" />
            <circle cx="16.24" cy="7.76" r="0.8" />
            <circle cx="7.76" cy="16.24" r="0.8" />
            <circle cx="16.24" cy="16.24" r="0.8" />
          </svg>
        </div>
        <div v-show="!sidebarCollapsed" class="min-w-0">
          <span class="block font-semibold text-gray-900 text-sm truncate">MRO 进销存</span>
          <span class="block text-[11px] text-gray-400 mt-0.5">仓储 · 销售 · 报表</span>
        </div>
      </div>

      <!-- Nav items -->
      <nav :class="['flex-1 overflow-y-auto py-4', sidebarCollapsed ? 'flex flex-col items-center space-y-1 px-1.5' : 'px-3 space-y-1']">
        <button
          v-for="item in navItems"
          :key="item.path"
          :title="sidebarCollapsed ? item.label : ''"
          :class="[
            sidebarCollapsed
              ? 'w-10 h-10 flex items-center justify-center rounded-xl transition-colors mx-auto'
              : 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
            isActive(item.path)
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
          ]"
          @click="navigate(item.path)"
        >
          <span v-html="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-show="!sidebarCollapsed" class="text-sm">{{ item.label }}</span>
        </button>

      </nav>

      <!-- Collapse toggle + User -->
      <div :class="['border-t border-gray-100/80', sidebarCollapsed ? 'flex flex-col items-center py-3 space-y-3' : 'flex items-center justify-between px-3 py-3']">
        <button
          @click="toggleSidebar"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          class="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg class="w-4 h-4 transition-transform duration-300" :class="sidebarCollapsed ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <div v-show="!sidebarCollapsed" class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-sm cursor-default">
            H
          </div>
          <div>
            <span class="block text-sm text-gray-700 font-medium">管理员</span>
            <span class="block text-[11px] text-gray-400">本地账号</span>
          </div>
        </div>
        <div v-show="sidebarCollapsed" class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-sm cursor-default">
          H
        </div>
      </div>
    </aside>

    <!-- Mobile overlay + sidebar -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 lg:hidden">
      <div class="absolute inset-0 bg-black/30" @click="sidebarOpen = false" />
        <aside class="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-2xl flex flex-col">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div class="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <circle cx="12" cy="12" r="5.5" stroke-dasharray="2 3" />
              <circle cx="12" cy="12" r="3" stroke-dasharray="1.5 2" />
              <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke-linecap="round" />
              <circle cx="7.76" cy="7.76" r="0.8" />
              <circle cx="16.24" cy="7.76" r="0.8" />
              <circle cx="7.76" cy="16.24" r="0.8" />
              <circle cx="16.24" cy="16.24" r="0.8" />
            </svg>
          </div>
          <span class="font-bold text-gray-900 text-sm">MRO 进销存</span>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
              isActive(item.path)
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="navigate(item.path)"
          >
            <span v-html="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ item.label }}</span>
          </button>

        </nav>

        <!-- User footer (mobile) -->
        <div class="border-t border-gray-100 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                H
              </div>
              <span class="text-sm text-gray-700">管理员</span>
            </div>
            <button class="text-gray-400 hover:text-red-500 transition-colors" @click="handleLogout" title="退出登录">
              <i class="ri-logout-box-line text-lg"></i>
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
        <header class="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-4 lg:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" @click="sidebarOpen = true">
            <i class="ri-menu-line text-lg"></i>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400 hidden sm:block">{{ currentTime }}</span>
          <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-xl hover:bg-gray-100 transition-colors" @click="handleLogout" title="退出登录">
            <i class="ri-logout-box-line text-lg"></i>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto p-4 lg:p-6">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(localStorage.getItem('mro_sidebar_collapsed') === 'true')
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | undefined

interface NavItem {
  label: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  {
    label: '仪表板',
    path: '/dashboard',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
  },
  {
    label: '商品管理',
    path: '/products',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>'
  },
  {
    label: '客户管理',
    path: '/customers',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
  },
  {
    label: '销售管理',
    path: '/sales',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>'
  },
  {
    label: '系统设置',
    path: '/settings/warehouses',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'
  },
]

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
  sidebarOpen.value = false
}

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('mro_sidebar_collapsed', String(sidebarCollapsed.value))
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
