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
  // Use a subquery to sum stock quantities per product
  let query = supabase
    .from('products')
    .select('*, categories!left(name), stock_total:stocks!left(product_id)(quantity)', { count: 'exact' })

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%,barcode.ilike.%${params.search}%`)
  }
  if (params?.category_id) {
    query = query.eq('category_id', params.category_id)
  }
  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active)
  }

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to)

  const mapped = (data ?? []).map((p: any) => ({
    ...p,
    category_name: p.categories?.name ?? null,
    categories: undefined,
    stock_quantity: Array.isArray(p.stock_total)
      ? p.stock_total.reduce((sum: number, s: any) => sum + (s.quantity ?? 0), 0)
      : 0,
    stock_total: undefined
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
  return { data: null, error: error?.message ?? null }
}