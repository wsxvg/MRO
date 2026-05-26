import { onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

/**
 * Supabase Realtime 订阅
 * 监听指定表的 postgres_changes，变更时触发 callback
 * 组件卸载时自动取消订阅，防止内存泄漏
 *
 * @example
 * ```ts
 * useRealtime('sales_orders', () => loadSalesOrders())
 * useRealtime('stocks', () => loadStockData(), '*', 'warehouse_id=eq.1')
 * ```
 */
export function useRealtime(
  table: string,
  callback: () => void,
  event: RealtimeEvent = '*',
  filter?: string
) {
  const channelName = `pg-changes-${table}-${event}-${Date.now()}`

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      { event, schema: 'public', table, filter },
      () => callback()
    )
    .subscribe()

  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
}

/**
 * 批量订阅多张表，适用于需要同时监听多个数据源的页面（如仪表盘）
 *
 * @example
 * ```ts
 * useRealtimeTables(['sales_orders', 'stocks'], () => loadDashboardData())
 * ```
 */
export function useRealtimeTables(
  tables: string[],
  callback: () => void,
  event: RealtimeEvent = '*'
) {
  const channels = tables.map((table) => {
    const channelName = `pg-changes-${table}-${event}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        { event, schema: 'public', table },
        () => callback()
      )
      .subscribe()

    return channel
  })

  onUnmounted(() => {
    channels.forEach((ch) => supabase.removeChannel(ch))
  })
}
