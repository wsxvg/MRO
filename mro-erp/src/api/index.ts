import { supabase } from '@/lib/supabase'
export * from './products'
export * from './customers'
export * from './warehouses'
export * from './orders'
export * from './stockTransactions'
export * from './reports'
export * from './units'

// Re-import for wrapper objects
import {
  fetchProducts, fetchProduct, createProduct, updateProduct, deleteProduct,
  fetchCategories, createCategory, updateCategory, deleteCategory
} from './products'
import { fetchCustomers, fetchCustomer, createCustomer, updateCustomer, deleteCustomer } from './customers'
import { createStockIn } from './stockTransactions'
import { fetchWarehouses, fetchWarehouse, createWarehouse, updateWarehouse, deleteWarehouse, fetchDefaultWarehouse, fetchStockByProduct } from './warehouses'
import { fetchUnits, createUnit, updateUnit, deleteUnit } from './units'

// ====== productsApi wrapper ======
export const productsApi = {
  getAll: fetchProducts,
  getById: fetchProduct,
  create: createProduct,
  update: updateProduct,
  delete: deleteProduct,
  async exportAll(): Promise<{ data: any[] | null; error: string | null }> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!left(name)')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) return { data: null, error: error.message }

    const mapped = (data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.categories?.name || '',
      specification: p.specification || '',
      unit: p.unit || '',
      reference_price: p.reference_price || 0,
      cost_price: p.cost_price || 0,
      cost_price_auto: p.cost_price_auto ?? false,
    }))

    return { data: mapped, error: null }
  },

  async batchUpsert(items: Array<{
    id?: number | null
    name: string
    category?: string
    specification?: string
    unit: string
    selling_price: string
    cost_price?: string
  }>, duplicateStrategy: 'skip' | 'overwrite' = 'overwrite'): Promise<{
    success: boolean
    created: number
    updated: number
    skipped: number
    errors: string[]
  }> {
    try {
      // 1. 获取已有分类（名称→ID 映射）
      const { data: categories } = await supabase.from('categories').select<'id, name', { id: number; name: string }>('id, name')
      const catMap: Record<string, number> = {}
      for (const c of (categories ?? [])) {
        catMap[c.name] = c.id
      }

      // 1.5 自动创建导入中出现的、但数据库不存在的分类
      const missingCats = [...new Set(items.map(i => i.category).filter(Boolean) as string[])]
        .filter(name => !catMap[name])
      await Promise.all(missingCats.map(async (name) => {
        const r = await supabase.from('categories').insert({ name } as never).select('id, name').single() as { data: { id: number; name: string } | null; error: any }
        if (r.data && !r.error) {
          catMap[r.data.name] = r.data.id
        }
      }))

      // 2. 获取已有商品（用于去重）
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, name, specification, category_id, categories!left(name)')
      const dedupMap = new Map<string, number>()
      for (const p of (existingProducts ?? []) as any[]) {
        const key = `${p.name}|${p.specification ?? ''}`
        dedupMap.set(key, p.id)
      }

      // 3. 分拣：新增 vs 更新 vs 跳过
      const toInsert: Array<Record<string, any>> = []
      const toUpdate: Array<{ id: number; values: Record<string, any> }> = []
      const errors: string[] = []
      let skipped = 0

      for (const item of items) {
        const sellingPrice = parseFloat(item.selling_price) || 0
        const rawCost = item.cost_price ? parseFloat(item.cost_price) : 0
        const hasCost = rawCost > 0
        const costPrice = hasCost ? rawCost : (sellingPrice > 0 ? Math.round((sellingPrice / 1.3) * 100) / 100 : 0)
        const costPriceAuto = !hasCost && sellingPrice > 0
        const categoryId = item.category ? (catMap[item.category] || null) : null

        const values = {
          name: item.name,
          category_id: categoryId,
          specification: item.specification || null,
          unit: item.unit || '个',
          reference_price: sellingPrice,
          cost_price: costPrice,
          cost_price_auto: costPriceAuto,
        }

        const dedupKey = `${item.name}|${item.specification ?? ''}`
        const existingId = item.id || dedupMap.get(dedupKey)

        if (item.id || (existingId && duplicateStrategy === 'overwrite')) {
          // 有 ID 或匹配到重复 + 覆盖策略 → 更新
          toUpdate.push({ id: existingId!, values })
        } else if (existingId && duplicateStrategy === 'skip') {
          // 匹配到重复 + 跳过策略 → 跳过
          skipped++
        } else {
          // 全新商品 → 批量新增
          toInsert.push(values)
        }
      }

      // 4. 批量新增（一次调用）
      let created = 0
      let updated = 0
      if (toInsert.length > 0) {
        const { error } = await supabase.from('products').insert(toInsert as never)
        if (error) {
          errors.push(`批量新增失败: ${error.message}`)
        } else {
          created = toInsert.length
        }
      }

      // 5. 并发更新（重复项通常较少）
      const updateResults = await Promise.all(toUpdate.map(async ({ id, values }) => {
        const { error } = await supabase.from('products').update(values as never).eq('id', id)
        return { name: values.name, error }
      }))
      for (const r of updateResults) {
        if (r.error) {
          errors.push(`${r.name || '?'}: ${r.error.message}`)
        } else {
          updated++
        }
      }

      return { success: errors.length === 0, created, updated, skipped, errors }
    } catch (e: any) {
      return { success: false, created: 0, updated: 0, skipped: 0, errors: [e?.message ?? '导入失败'] }
    }
  },
}

// ====== categoriesApi wrapper ======
export const categoriesApi = {
  getAll: fetchCategories,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
}

// ====== warehousesApi wrapper ======
export const warehousesApi = {
  getAll: fetchWarehouses,
  getById: fetchWarehouse,
  create: createWarehouse,
  update: updateWarehouse,
  delete: deleteWarehouse,
  getDefault: fetchDefaultWarehouse,
  getStockByProduct: fetchStockByProduct,
}

// ====== unitsApi wrapper ======
export const unitsApi = {
  getAll: fetchUnits,
  create: createUnit,
  update: updateUnit,
  delete: deleteUnit,
}

// ====== customersApi wrapper ======
export const customersApi = {
  getAll: fetchCustomers,
  getById: fetchCustomer,
  create: createCustomer,
  update: updateCustomer,
  delete: deleteCustomer,
    async import(items: Array<{ name: string; contact_person?: string | null; phone?: string | null; address?: string | null }>): Promise<{ success: boolean; error?: string }> {
    try {
      for (const item of items) {
        const { error } = await supabase.from('customers').insert({
          name: item.name,
          type: 'retail',
          contact_person: item.contact_person || null,
          phone: item.phone || null,
          address: item.address || null,
          credit_limit: 0,
        } as never)
        if (error) return { success: false, error: error.message }
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message ?? '导入失败' }
    }
  }
}
