/**
 * 全局错误处理工具
 * - 统一的错误信息提取
 * - Supabase 错误码转用户友好消息
 * - 网络错误分类
 */

/**
 * 从任意类型的错误值提取可读字符串
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    // Supabase 错误格式：{ code: string; message: string; details: string }
    const obj = err as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.error === 'string') return obj.error
    if (typeof obj.msg === 'string') return obj.msg
  }
  return '发生未知错误，请重试'
}

/**
 * 获取组件显示名称（用于日志）
 */
export function getComponentName(instance: unknown): string {
  if (!instance) return 'unknown'
  const comp = instance as Record<string, unknown>
  return (
    (comp.type as Record<string, unknown>)?.__name as string
    || (comp.type as Record<string, unknown>)?.name as string
    || 'anonymous'
  )
}

/**
 * Supabase PostgreSQL 错误码 → 中文用户提示
 */
const SUPABASE_ERROR_MAP: Record<string, string> = {
  '23503': '该数据已被其他记录引用，无法删除',
  '23505': '数据重复，请检查是否已存在相同记录',
  '42P01': '数据库表不存在，请检查配置',
  '42703': '数据库字段不存在，请检查配置',
  'PGRST116': '查询无结果',
}

/**
 * 将 Supabase 错误转换为用户友好消息
 */
export function getSupabaseErrorMessage(error: { code?: string; message: string } | null): string {
  if (!error) return ''
  const friendly = SUPABASE_ERROR_MAP[error.code ?? '']
  if (friendly) return friendly
  // 移除 PostgreSQL 冗长的技术细节
  const msg = error.message
    .replace(/^new row violates row-level security policy for "(\w+)"/, '权限不足，无法操作「$1」')
    .replace(/^duplicate key value violates unique constraint.*/, '数据重复，请检查')
  return msg
}

/**
 * Supabase 查询包装器：统一错误处理
 * 返回 { data, error }，error 为 null 或用户友好消息
 */
export async function wrapQuery<T>(
  query: Promise<{ data: T | null; error: unknown }>,
  fallbackMsg = '查询失败',
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await query
    if (error) {
      const msg = getSupabaseErrorMessage(error as { code?: string; message: string })
      console.error(`[DB] ${fallbackMsg}:`, error)
      return { data: null, error: msg || fallbackMsg }
    }
    return { data, error: null }
  } catch (e: unknown) {
    console.error(`[DB] ${fallbackMsg}:`, e)
    return { data: null, error: getErrorMessage(e) || fallbackMsg }
  }
}
