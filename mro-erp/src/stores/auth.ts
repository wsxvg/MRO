import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'mro_auth'
const DEFAULT_USERNAME = 'huiyou'
const DEFAULT_PASSWORD = '123456'
const SECURITY_QUESTION = '王道硕的手机号是什么'
const SECURITY_ANSWER = '17826038535'

interface AuthData {
  username: string
  password: string
}

function loadAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveAuth(data: AuthData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useAuthStore = defineStore('auth', () => {
  const loggedIn = ref(false)
  const loading = ref(false)
  const initialized = ref(false)

  const isLoggedIn = computed(() => loggedIn.value)

  function initialize() {
    const data = loadAuth()
    if (data && data.username === DEFAULT_USERNAME) {
      loggedIn.value = true
    }
    initialized.value = true
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const stored = loadAuth()
      const validPassword = stored ? stored.password : DEFAULT_PASSWORD

      if (username !== DEFAULT_USERNAME || password !== validPassword) {
        return { success: false as const, error: '用户名或密码错误' }
      }

      saveAuth({ username, password: validPassword })
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

      saveAuth({ username: DEFAULT_USERNAME, password: newPassword })
      return { success: true as const, message: '密码修改成功' }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    loggedIn.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    loggedIn, loading, initialized, isLoggedIn,
    initialize, login, changePassword, logout,
    SECURITY_QUESTION
  }
})
