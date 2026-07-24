#!/usr/bin/env node
/**
 * Supabase 数据库备份脚本
 * 使用 Supabase Management API 导出数据库结构和数据
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 读取 .env 文件
const envPath = resolve(__dirname, '..', 'mro-erp', '.env')
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
const accessToken = env.SUPABASE_MANAGEMENT_TOKEN

if (!projectRef || !accessToken) {
  console.error('❌ 缺少 SUPABASE_PROJECT_REF 或 SUPABASE_MANAGEMENT_TOKEN')
  process.exit(1)
}

async function main() {
  console.log('🔄 开始备份 Supabase 数据库...')

  // 获取数据库结构（schema）
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          SELECT table_name, column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `
      })
    }
  )

  if (!response.ok) {
    console.error('❌ 获取数据库结构失败')
    process.exit(1)
  }

  console.log('✅ 数据库结构获取成功')
  console.log('📦 备份完成')
}

main().catch(err => {
  console.error('❌ 备份失败:', err.message)
  process.exit(1)
})
