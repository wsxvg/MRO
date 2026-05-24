import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const DEFAULT_USERNAME = 'huiyou'
const DEFAULT_EMAIL = 'huiyou@mro-dev.xyz'
const SECURITY_QUESTION = '王道硕的手机号是什么'
const SECURITY_ANSWER = '17826038535'

export const useAuthStore = defineStore('auth', () => {
  const loggedIn = ref(false)
  const loading = ref(false)
  const initialized = ref(false)
  let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

  const isLoggedIn = computed(() => loggedIn.value)

  let initPromise: Promise<void> | null = null

  async function initialize() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      loggedIn.value = !!session
      initialized.value = true
    })()

    // Listen for auth state changes
    authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loggedIn.value = true
      } else if (event === 'SIGNED_OUT') {
        loggedIn.value = false
      }
    })

    return initPromise
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      if (username !== DEFAULT_USERNAME) {
        return { success: false as const, error: '用户名或密码错误' }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: DEFAULT_EMAIL,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false as const, error: '用户名或密码错误' }
        }
        return { success: false as const, error: `登录失败: ${error.message}` }
      }

      loggedIn.value = true
      return { success: true as const }
    } finally {
      loading.value = false
    }
  }

  async function changePassword(answer: string, newPassword: string) {
    loading.value = true
    try {
      if (answer.trim() !== SECURITY_ANSWER) {
        return { success: false as const, error: '安全问题回答错误' }
      }

      if (!newPassword || newPassword.length < 3) {
        return { success: false as const, error: '新密码至少3位字符' }
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

  async function logout() {
    loggedIn.value = false
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
    loggedIn, loading, initialized, isLoggedIn,
    initialize, login, changePassword, logout,
    SECURITY_QUESTION, $dispose
  }
})
