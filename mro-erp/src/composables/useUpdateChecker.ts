import { onMounted } from 'vue'
import { check } from '@tauri-apps/plugin-updater'

export function useUpdateChecker() {
  onMounted(async () => {
    try {
      const update = await check()
      if (update?.available) {
        const body = update.body ? `\n${update.body}\n` : ''
        const confirmed = window.confirm(
          `发现新版本 v${update.version}！${body}\n是否立即下载更新？`
        )
        if (confirmed) {
          await update.downloadAndInstall()
        }
      }
    } catch {
      // Silently ignore — not running in Tauri, or updater not configured
    }
  })
}
