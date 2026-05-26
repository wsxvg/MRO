import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'
import { getErrorMessage, getComponentName } from './lib/errorHandler'
import { useToast } from './composables/useToast'

const app = createApp(App)

// 全局错误处理：捕获所有未处理的组件错误，显示 Toast 通知
app.config.errorHandler = (err, instance, info) => {
  const name = getComponentName(instance)
  const msg = getErrorMessage(err)

  console.error(`[全局错误] ${name}:`, err, info)

  // 向用户展示友好提示
  const toast = useToast()
  toast.error(`操作遇到问题: ${msg}`)
}

app.config.warnHandler = (msg) => {
  console.warn('[Vue警告]', msg)
}

app.use(createPinia())
app.use(router)
app.mount('#app')
