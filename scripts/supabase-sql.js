/**
 * Supabase SQL 执行工具
 * 使用 Management API 直接执行 SQL，无需登录 Dashboard
 *
 * 用法:
 *   node scripts/supabase-sql.js "ALTER TABLE xxx ADD COLUMN ..."
 *
 * 依赖:
 *   - .env 文件中有 SUPABASE_PROJECT_REF 和 SUPABASE_MANAGEMENT_TOKEN
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载 .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'mro-erp', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ 找不到 .env 文件:', envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
      }
    }
  });
  return env;
}

async function executeSQL(sql) {
  const env = loadEnv();
  const token = env.SUPABASE_MANAGEMENT_TOKEN;
  const ref = env.SUPABASE_PROJECT_REF;

  if (!token || !ref) {
    console.error('❌ .env 中缺少 SUPABASE_MANAGEMENT_TOKEN 或 SUPABASE_PROJECT_REF');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + ref + '/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// CLI 模式
const sql = process.argv[2];
if (sql) {
  console.log('📦 执行 SQL:', sql);
  executeSQL(sql).then(({ status, body }) => {
    console.log('状态:', status);
    if (status === 201) {
      try {
        console.log('✅ 结果:', JSON.stringify(JSON.parse(body), null, 2));
      } catch {
        console.log('✅ 成功:', body);
      }
    } else {
      console.log('❌ 失败:', body);
      process.exit(1);
    }
  }).catch(err => {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  });
} else {
  console.log('用法: node scripts/supabase-sql.js "YOUR SQL HERE"');
  console.log('示例: node scripts/supabase-sql.js "SELECT * FROM warehouses LIMIT 5"');
}

module.exports = { executeSQL, loadEnv };
