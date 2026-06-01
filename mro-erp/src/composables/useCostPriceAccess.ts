import { ref } from 'vue'

const STORAGE_KEY = 'mro_cost_price_password'
const SESSION_UNLOCK_KEY = 'mro_cost_price_unlocked'
const DEFAULT_PASSWORD = '8888'

// Security question for password recovery
const COST_PRICE_SECURITY_QUESTION = '创建这个系统的公司名称是什么'
const COST_PRICE_SECURITY_ANSWER = 'MRO'

function loadPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PASSWORD
  } catch {
    return DEFAULT_PASSWORD
  }
}

function savePassword(password: string) {
  try {
    localStorage.setItem(STORAGE_KEY, password)
  } catch {
    // localStorage not available — silently ignore
  }
}

function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true'
  } catch {
    return false
  }
}

function setSessionUnlocked(unlocked: boolean) {
  try {
    if (unlocked) {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true')
    } else {
      sessionStorage.removeItem(SESSION_UNLOCK_KEY)
    }
  } catch {
    // sessionStorage not available — silently ignore
  }
}

export function useCostPriceAccess() {
  // Initialize from session storage - if already unlocked in this session, stay unlocked
  const isUnlocked = ref(isSessionUnlocked())

  function verify(password: string): boolean {
    if (password === loadPassword()) {
      isUnlocked.value = true
      setSessionUnlocked(true)
      return true
    }
    return false
  }

  function unlock() {
    isUnlocked.value = true
    setSessionUnlocked(true)
  }

  function lock() {
    isUnlocked.value = false
    setSessionUnlocked(false)
  }

  function changePassword(answer: string, newPassword: string): { success: boolean; error?: string } {
    if (answer.trim() !== COST_PRICE_SECURITY_ANSWER) {
      return { success: false, error: '安全问题回答错误' }
    }
    if (!newPassword || newPassword.length < 3) {
      return { success: false, error: '新密码至少 3 位字符' }
    }
    if (newPassword === loadPassword()) {
      return { success: false, error: '新密码不能与旧密码相同' }
    }
    savePassword(newPassword)
    // Lock after password change
    isUnlocked.value = false
    return { success: true }
  }

  return {
    isUnlocked,
    verify,
    unlock,
    lock,
    changePassword,
    COST_PRICE_SECURITY_QUESTION,
  }
}
