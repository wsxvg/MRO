<template>
  <div class="min-h-screen grid lg:grid-cols-2">
    <!-- Left Branding Panel -->
    <div class="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 p-12 overflow-hidden">
      <!-- Decorative background mesh -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 24px 24px;" />

      <!-- Decorative blurred orbs -->
      <div class="absolute top-1/3 -left-16 size-80 bg-primary-500/10 rounded-full blur-[100px]" />
      <div class="absolute bottom-1/3 -right-16 size-96 bg-sky-500/5 rounded-full blur-[120px]" />

      <!-- Industrial warehouse geometric elements -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div class="relative w-[460px] h-[480px]" ref="sceneRef">
          <!-- Back row - tall structures -->
          <div
            v-for="(block, i) in backBlocks"
            :key="'back-' + i"
            class="absolute bottom-0 transition-all duration-1000 ease-out rounded-sm"
            :style="{
              left: block.left + 'px',
              width: block.width + 'px',
              height: block.height + 'px',
              backgroundColor: block.color,
              opacity: block.opacity,
              transform: `translate(${blockOffsetX * block.depth}px, ${blockOffsetY * block.depth * 0.3}px)`,
              zIndex: block.zIndex,
            }"
          />

          <!-- Middle row - primary structures -->
          <div
            v-for="(block, i) in midBlocks"
            :key="'mid-' + i"
            class="absolute bottom-0 transition-all duration-700 ease-out rounded-sm"
            :style="{
              left: block.left + 'px',
              width: block.width + 'px',
              height: block.height + 'px',
              backgroundColor: block.color,
              opacity: block.opacity,
              transform: `translate(${blockOffsetX * block.depth}px, ${blockOffsetY * block.depth * 0.3}px)`,
              zIndex: block.zIndex,
            }"
          >
            <!-- Shelf lines on some blocks -->
            <div
              v-for="(line, li) in block.shelves || []"
              :key="'shelf-' + li"
              class="absolute left-[10%] right-[10%] h-[1px] bg-white/10"
              :style="{ top: line + '%' }"
            />
          </div>

          <!-- Front row - accent blocks -->
          <div
            v-for="(block, i) in frontBlocks"
            :key="'front-' + i"
            class="absolute bottom-0 transition-all duration-500 ease-out rounded-sm"
            :style="{
              left: block.left + 'px',
              width: block.width + 'px',
              height: block.height + 'px',
              backgroundColor: block.color,
              opacity: block.opacity,
              transform: `translate(${blockOffsetX * block.depth}px, ${blockOffsetY * block.depth * 0.3}px)`,
              zIndex: block.zIndex,
            }"
          />

          <!-- Floating particle dots -->
          <div
            v-for="(dot, i) in particles"
            :key="'dot-' + i"
            class="absolute rounded-full bg-white transition-all duration-[2000ms] ease-out"
            :style="{
              left: dot.left + '%',
              top: dot.top + '%',
              width: dot.size + 'px',
              height: dot.size + 'px',
              opacity: dot.opacity,
              transform: `translate(${blockOffsetX * 0.5}px, ${blockOffsetY * 0.5}px)`,
            }"
          />
        </div>
      </div>

      <!-- Top branding -->
      <div class="relative z-20">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="text-white/90 text-lg font-semibold tracking-tight">MRO 进销存</span>
        </div>
      </div>

      <!-- Bottom tagline -->
      <div class="relative z-20 space-y-3">
        <p class="text-2xl font-bold text-white/90 tracking-tight">工业品贸易管理</p>
        <p class="text-sm text-white/40 max-w-sm leading-relaxed">
          专业高效的 MRO 工业品进销存管理系统，让库存管理、采购销售轻松可控。        </p>
      </div>

      <!-- Bottom footer -->
      <div class="relative z-20 flex items-center gap-8 text-xs text-white/20">
        <span>© 2026 MRO 进销存系统</span>
        <a href="#" class="hover:text-white/50 transition-colors">隐私政策</a>
        <a href="#" class="hover:text-white/50 transition-colors">服务条款</a>
      </div>
    </div>

    <!-- Right Login Panel -->
    <div class="flex items-center justify-center p-6 sm:p-10 bg-white">
      <div class="w-full max-w-sm">
        <!-- Mobile header -->
        <div class="lg:hidden flex flex-col items-center gap-3 mb-12">
          <div class="size-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-900">MRO 进销存系统</h1>
          <p class="text-sm text-gray-500">工业品贸易管理系统</p>
        </div>

        <!-- Form Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">欢迎回来</h1>
          <p class="text-sm text-gray-500 mt-1.5">请登录您的账户</p>
        </div>

        <!-- Error Alert -->
        <Transition name="fade-slide">
          <div v-if="error" class="mb-5 p-3.5 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-2.5">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div class="space-y-1.5">
            <label for="username" class="text-sm font-medium text-gray-700">用户名</label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                autocomplete="username"
                required
                class="w-full h-11 pl-10 pr-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                @focus="isFieldFocused = 'username'"
                @blur="isFieldFocused = ''"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="password" class="text-sm font-medium text-gray-700">密码</label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                required
                class="w-full h-11 pl-10 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                @focus="isFieldFocused = 'password'"
                @blur="isFieldFocused = ''"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabindex="-1"
              >
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" v-model="rememberMe" class="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500/30 cursor-pointer" />
              <span class="text-gray-500 group-hover:text-gray-700 transition-colors">记住我</span>
            </label>
            <button type="button" @click="openChangePassword" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              修改密码
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full h-11 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Change Password Dialog -->
    <BaseModal v-model="showChangePassword" title="修改密码">
      <div class="text-center mb-4">
        <p class="text-sm text-gray-500">请先验证身份信息</p>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <!-- Security Question -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-xs font-medium text-amber-700 mb-1">安全问题验证</p>
              <p class="text-sm text-amber-800">{{ SECURITY_QUESTION }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="cp-answer" class="text-sm font-medium text-gray-700">安全问题答案</label>
          <input id="cp-answer" v-model="cpAnswer" type="text" placeholder="输入安全问题答案" required class="input" />
        </div>

        <div class="space-y-1.5">
          <label for="cp-new" class="text-sm font-medium text-gray-700">新密码</label>
          <input id="cp-new" v-model="cpNewPassword" type="password" placeholder="输入新密码（至少 3 位）" required minlength="3" class="input" />
        </div>

        <!-- Messages -->
        <Transition name="fade-slide">
          <div v-if="cpError" class="p-3.5 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-2.5">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ cpError }}</span>
          </div>
        </Transition>
        <Transition name="fade-slide">
          <div v-if="cpSuccess" class="p-3.5 text-sm bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-start gap-2.5">
            <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ cpSuccess }}</span>
          </div>
        </Transition>
      </form>

      <template #footer>
        <div class="flex gap-3 pt-1">
          <button type="button" @click="closeChangePassword" class="flex-1 h-10 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">取消</button>
          <button type="submit" :disabled="loading" class="flex-1 h-10 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center justify-center gap-2" @click="handleChangePassword">
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            确认修改
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseModal from '@/components/BaseModal.vue'

const router = useRouter()
const auth = useAuthStore()

const SECURITY_QUESTION = auth.SECURITY_QUESTION

// Form state
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const isFieldFocused = ref('')

// Change password dialog
const showChangePassword = ref(false)
const cpAnswer = ref('')
const cpNewPassword = ref('')
const cpError = ref('')
const cpSuccess = ref('')

// === 3D Scene - Mouse Tracking ===
const sceneRef = ref<HTMLDivElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)
const blockOffsetX = ref(0)
const blockOffsetY = ref(0)

// Warehouse block definitions
const backBlocks = [
  { left: 40, width: 90, height: 240, color: 'rgba(59,130,246,0.08)', opacity: 0.8, depth: 0.6, zIndex: 1, shelves: [30, 55, 80] },
  { left: 300, width: 110, height: 280, color: 'rgba(59,130,246,0.06)', opacity: 0.7, depth: 0.5, zIndex: 1, shelves: [25, 50, 75] },
  { left: 160, width: 70, height: 200, color: 'rgba(96,165,250,0.07)', opacity: 0.6, depth: 0.7, zIndex: 1 },
]

const midBlocks = [
  { left: 20, width: 120, height: 180, color: 'rgba(59,130,246,0.12)', opacity: 0.9, depth: 0.3, zIndex: 2, shelves: [35, 65] },
  { left: 250, width: 130, height: 220, color: 'rgba(37,99,235,0.1)', opacity: 0.85, depth: 0.2, zIndex: 2, shelves: [30, 60] },
  { left: 140, width: 60, height: 150, color: 'rgba(96,165,250,0.09)', opacity: 0.7, depth: 0.4, zIndex: 2 },
]

const frontBlocks = [
  { left: 50, width: 100, height: 130, color: 'rgba(59,130,246,0.18)', opacity: 0.95, depth: 0, zIndex: 3 },
  { left: 300, width: 80, height: 100, color: 'rgba(37,99,235,0.15)', opacity: 0.9, depth: 0.05, zIndex: 3 },
  { left: 180, width: 50, height: 80, color: 'rgba(147,197,253,0.12)', opacity: 0.8, depth: 0.1, zIndex: 3 },
]

// Floating particles
const particles = Array.from({ length: 20 }, (_, i) => ({
  left: 10 + (i * 4.2) % 80,
  top: 10 + (i * 7.3) % 80,
  size: 1.5 + (i % 3),
  opacity: 0.15 + (i % 4) * 0.05,
}))

function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
  if (sceneRef.value) {
    const rect = sceneRef.value.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    blockOffsetX.value = (e.clientX - centerX) / 60
    blockOffsetY.value = (e.clientY - centerY) / 60
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})

// === Auth Functions ===
async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const result = await auth.login(username.value, password.value)
    if (result.success) {
      router.push('/dashboard')
    } else {
      error.value = result.error || '登录失败'
    }
  } finally {
    loading.value = false
  }
}

function openChangePassword() {
  showChangePassword.value = true
  cpAnswer.value = ''
  cpNewPassword.value = ''
  cpError.value = ''
  cpSuccess.value = ''
}

function closeChangePassword() {
  showChangePassword.value = false
  cpAnswer.value = ''
  cpNewPassword.value = ''
  cpError.value = ''
  cpSuccess.value = ''
}

async function handleChangePassword() {
  cpError.value = ''
  cpSuccess.value = ''
  loading.value = true
  try {
    const result = await auth.changePassword(
      cpAnswer.value,
      cpNewPassword.value
    )
    if (result.success) {
      cpSuccess.value = result.message || '密码修改成功'
      setTimeout(() => closeChangePassword(), 1500)
    } else {
      cpError.value = result.error || '修改失败'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.dialog-enter-active {
  transition: all 0.25s ease-out;
}
.dialog-leave-active {
  transition: all 0.2s ease-in;
}
.dialog-enter-from {
  opacity: 0;
}
.dialog-enter-from > div:last-child {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
.dialog-leave-to {
  opacity: 0;
}
.dialog-leave-to > div:last-child {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
