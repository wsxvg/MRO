import { supabase } from '@/lib/supabase'
import type { Category, Product, ApiResult, ListResponse } from '@/types'

// ====== Categories ======

export async function fetchCategories(): Promise<ListResponse<Category>> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  return { data: data ?? [], count: data?.length ?? 0, error: error?.message ?? null }
}

export async function createCategory(input: Pick<Category, 'name' | 'sort_order'>): Promise<ApiResult<Category>> {
  // 查重：同名分类不允许创建
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', input.name)
    .maybeSingle()
  if (existing) {
    return { data: null, error: `分类「${input.name}」已存在` }
  }

  const { data, error } = await supabase.from('categories').insert(input as never).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateCategory(id: number, input: Partial<Pick<Category, 'name' | 'sort_order'>>): Promise<ApiResult<Category>> {
  // 查重：改名时检查新名称是否与其他分类冲突
  if (input.name) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .neq('id', id)
      .eq('name', input.name)
      .maybeSingle()
    if (existing) {
      return { data: null, error: `分类「${input.name}」已存在` }
    }
  }

  const { data, error } = await supabase.from('categories').update(input as never).eq('id', id).select().single()
  return { data, error: error?.message ?? null }
}

export async function deleteCategory(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  return { data: null, error: error?.message ?? null }
}

// ====== Products ======

export async function fetchProducts(params?: {
  search?: string
  category_id?: number | null
  is_active?: boolean
  page?: number
  limit?: number
}): Promise<ListResponse<Product>> {
  // Step 1: Fetch products with category left join only
  let query = supabase
    .from('products')
    .select('*, categories!left(name)', { count: 'exact' })

  if (params?.search) {
    query = query.ilike('name', `%${params.search}%`)
  }
  if (params?.category_id) {
    query = query.eq('category_id', params.category_id)
  }
  // 默认只显示启用商品；显式传 null 表示查全部
  if (params?.is_active !== undefined) {
    if (params.is_active === null) {
      // 不添加筛选，查全部
    } else {
      query = query.eq('is_active', params.is_active)
    }
  } else {
    query = query.eq('is_active', true)
  }

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to)

  // Step 2: Fetch stock totals separately (avoid PostgREST join syntax ambiguity)
  const productIds = (data ?? []).map((p: any) => p.id)
  const stockMap: Record<number, number> = {}
  if (productIds.length > 0) {
    const { data: stocks } = await supabase
      .from('stocks')
      .select('product_id, quantity')
      .in('product_id', productIds)
    for (const s of (stocks ?? []) as any[]) {
      stockMap[s.product_id] = (stockMap[s.product_id] || 0) + (s.quantity || 0)
    }
  }

  const mapped = (data ?? []).map((p: any) => ({
    ...p,
    category_name: p.categories?.name ?? null,
    categories: undefined,
    stock_quantity: stockMap[p.id] ?? 0,
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

export async function fetchProduct(id: number): Promise<ApiResult<Product>> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories!left(name)')
    .eq('id', id)
    .single()

  if (data) {
    const p = data as any
    p.category_name = p.categories?.name ?? null
    delete p.categories
  }

  return { data: data as Product | null, error: error?.message ?? null }
}

export async function createProduct(input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<ApiResult<Product>> {
  const { data, error } = await supabase.from('products').insert(input as never).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateProduct(id: number, input: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResult<Product>> {
  const { data, error } = await supabase.from('products').update(input as never).eq('id', id).select().single()
  return { data, error: error?.message ?? null }
}

export async function deleteProduct(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    // PostgreSQL 外键冲突 (23503) — 商品被库存或单据引用
    if ((error as any)?.code === '23503') {
      return { data: null, error: '该商品尚有库存或关联单据，无法删除。请先清空该商品的库存记录。' }
    }
    return { data: null, error: error?.message ?? null }
  }
  return { data: null, error: null }
}