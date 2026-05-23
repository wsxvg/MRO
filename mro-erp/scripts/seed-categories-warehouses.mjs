import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gzvymxcojrljkprkgoap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnlteGNvanJsamtwcmtnb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzUwOTYsImV4cCI6MjA5NDk1MTA5Nn0.1I-5tJK_CNB6czEWZg0do_IgF1ohRnHZ5FJvGMD79k0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Categories from 汇友专用 (19 total)
const categories = [
  { name: '轴承类', sort_order: 1 },
  { name: '三角带', sort_order: 2 },
  { name: '链条传动', sort_order: 3 },
  { name: '化工原料', sort_order: 4 },
  { name: '得力工具', sort_order: 5 },
  { name: '机电设备', sort_order: 6 },
  { name: '紧固件', sort_order: 7 },
  { name: '法兰片', sort_order: 8 },
  { name: '五金工具', sort_order: 9 },
  { name: '仪表仪器', sort_order: 10 },
  { name: '管道配件', sort_order: 11 },
  { name: '气动件', sort_order: 12 },
  { name: '劳保用品', sort_order: 13 },
  { name: '世达工具', sort_order: 14 },
  { name: '密封件', sort_order: 15 },
  { name: '电磁阀', sort_order: 16 },
  { name: '阀门管件', sort_order: 17 },
  { name: '轮子', sort_order: 18 },
  { name: '其他', sort_order: 19 },
]

// Warehouses
const warehouses = [
  { name: '门店', location: '门店', remark: null },
  { name: '仓库A', location: '仓库A', remark: null },
  { name: '仓库B', location: '仓库B', remark: null },
]

async function seed() {
  console.log('=== Seeding Categories ===')
  for (const cat of categories) {
    const { data, error } = await supabase
      .from('categories')
      .insert(cat)
      .select()
      .single()
    if (error) {
      if (error.code === '23505') {
        console.log(`  ⏭ Category "${cat.name}" already exists, skipping`)
      } else {
        console.error(`  ❌ Failed to insert category "${cat.name}":`, error.message)
      }
    } else {
      console.log(`  ✅ Inserted category: "${data.name}" (sort_order: ${data.sort_order})`)
    }
  }

  console.log('')
  console.log('=== Seeding Warehouses ===')
  for (const wh of warehouses) {
    const { data, error } = await supabase
      .from('warehouses')
      .insert(wh)
      .select()
      .single()
    if (error) {
      if (error.code === '23505') {
        console.log(`  ⏭ Warehouse "${wh.name}" already exists, skipping`)
      } else {
        console.error(`  ❌ Failed to insert warehouse "${wh.name}":`, error.message)
      }
    } else {
      console.log(`  ✅ Inserted warehouse: "${data.name}"`)
    }
  }

  console.log('')
  console.log('=== Verification ===')
  const { data: cats, error: catErr } = await supabase.from('categories').select('*').order('sort_order')
  if (catErr) {
    console.error('Failed to verify categories:', catErr.message)
  } else {
    console.log(`Categories in DB (${cats.length}):`)
    cats.forEach(c => console.log(`  ${c.sort_order}. ${c.name}`))
  }

  const { data: whs, error: whErr } = await supabase.from('warehouses').select('*').order('name')
  if (whErr) {
    console.error('Failed to verify warehouses:', whErr.message)
  } else {
    console.log(`\nWarehouses in DB (${whs.length}):`)
    whs.forEach(w => console.log(`  - ${w.name}`))
  }
}

seed().catch(console.error)
