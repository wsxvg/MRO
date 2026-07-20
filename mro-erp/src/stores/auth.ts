import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const DEFAULT_USERNAME = 'huiyou'
const DEFAULT_EMAIL = 'huiyou@mro-dev.xyz'
const DEFAULT_SECURITY_QUESTION = '王道硕的手机号是什么'
const DEFAULT_SECURITY_ANSWER = '17826038535'

// 游客通过 Supabase RLS 匿名策略访问，无需账号

export const useAuthStore = defineStore('auth', () => {
  const loggedIn = ref(false)
  const loading = ref(false)
  const initialized = ref(false)
  const isGuest = ref(false)
  const securityQuestion = ref(DEFAULT_SECURITY_QUESTION)
  let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

  const isLoggedIn = computed(() => loggedIn.value)

  let initPromise: Promise<void> | null = null

  async function initialize() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      loggedIn.value = !!session
      isGuest.value = false // 游客不持久化 session，刷新后需重新点游客按钮
      initialized.value = true

      // 从数据库获取安全问题（降级到默认值）
      try {
        const { data: config } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'security_question')
          .maybeSingle()
        if (config?.value) {
          securityQuestion.value = config.value
        }
      } catch {
        // app_config 表不存在，使用默认值
      }
    })()

    // Listen for auth state changes
    authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loggedIn.value = true
        isGuest.value = false
      } else if (event === 'SIGNED_OUT') {
        loggedIn.value = false
        isGuest.value = false
      }
    })

    return initPromise
  }

  async function login(password: string) {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEFAULT_EMAIL,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false as const, error: '密码错误' }
        }
        return { success: false as const, error: `登录失败: ${error.message}` }
      }

      loggedIn.value = true
      isGuest.value = false
      return { success: true as const }
    } finally {
      loading.value = false
    }
  }

  async function changePassword(answer: string, currentPassword: string, newPassword: string) {
    loading.value = true
    try {
      // 从数据库获取安全答案（降级到硬编码值）
      let correctAnswer = DEFAULT_SECURITY_ANSWER
      try {
        const { data: config } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'security_answer')
          .maybeSingle()
        if (config?.value) {
          correctAnswer = config.value
        }
      } catch {
        // app_config 表不存在，使用默认值
      }

      if (answer.trim() !== correctAnswer) {
        return { success: false as const, error: '安全问题回答错误' }
      }

      if (!currentPassword || !newPassword || newPassword.length < 3) {
        return { success: false as const, error: '当前密码和新密码至少3位字符' }
      }

      // 先登录获取会话，才能调用 updateUser 修改密码
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: DEFAULT_EMAIL,
        password: currentPassword,
      })
      if (loginError) {
        return { success: false as const, error: '当前密码错误' }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        return { success: false as const, error: `密码修改失败: ${error.message}` }
      }

      return { success: true as const, message: '密码修改成功' }
    } finally {
      loading.value = false
    }
  }

  function guestLogin() {
    // 游客无需 Supabase 认证，直接放行
    // 数据读取靠 Supabase RLS 匿名策略控制
    loggedIn.value = true
    isGuest.value = true
  }

  async function logout() {
    loggedIn.value = false
    isGuest.value = false
    await supabase.auth.signOut()
    if (authListener) {
      authListener.data.subscription.unsubscribe()
    }
  }

  // Cleanup on store dispose
  function $dispose() {
    if (authListener) {
      authListener.data.subscription.unsubscribe()
    }
  }

  return {
    loggedIn, loading, initialized, isLoggedIn, isGuest, securityQuestion,
    initialize, login, guestLogin, changePassword, logout, $dispose
  }
})
