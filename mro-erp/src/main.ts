import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'

const app = createApp(App)

// 全局错误处理：捕获所有未处理的组件错误
app.config.errorHandler = (err, instance, info) => {
  console.error('[全局错误]', err)
  console.error('[组件]', (instance as any)?.type?.__name || (instance as any)?.type?.name || 'unknown')
  console.error('[信息]', info)
}

app.config.warnHandler = (msg, instance, info) => {
  console.warn('[Vue警告]', msg)
}

app.use(createPinia())
app.use(router)
app.mount('#app')
