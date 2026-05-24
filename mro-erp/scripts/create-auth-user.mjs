/**
 * 一次性脚本：通过 Supabase Management API 创建 Auth 用户
 *
 * 使用方式：node scripts/create-auth-user.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = resolve(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=')
      return [key.trim(), rest.join('=').trim()]
    })
)

const projectRef = env.SUPABASE_PROJECT_REF
const mgmtToken = env.SUPABASE_MANAGEMENT_TOKEN
const password = env.VITE_DEFAULT_PASSWORD || '123456'
const email = 'huiyou@mro.local'

if (!projectRef || !mgmtToken) {
  console.error('❌ 缺少 SUPABASE_PROJECT_REF 或 SUPABASE_MANAGEMENT_TOKEN')
  process.exit(1)
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = env.VITE_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  const sbAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. 检查用户是否已存在
  console.log('🔍 检查是否已存在用户...')
  const { data: existing } = await sbAdmin.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === email)

  if (found) {
    console.log(`✅ 用户已存在 (${found.id})，更新密码...`)
    const { error } = await sbAdmin.auth.admin.updateUserById(found.id, {
      password
    })
    if (error) throw error
    console.log('✅ 密码已更新')
  } else {
    console.log(`📝 创建用户 ${email}...`)
    const { data, error } = await sbAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (error) throw error
    console.log(`✅ 用户已创建 (${data.user.id})`)
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Supabase Auth 配置完成')
  console.log(`  Email（内部映射）: ${email}`)
  console.log(`  密码: ${password}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(err => {
  console.error('❌ 失败:', err.message)
  process.exit(1)
})
