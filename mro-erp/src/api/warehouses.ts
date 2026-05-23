import { supabase } from '@/lib/supabase'
import type { Warehouse, Stock, ApiResult, ListResponse } from '@/types'

// ====== Warehouses ======

export async function fetchWarehouses(): Promise<ListResponse<Warehouse>> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('name', { ascending: true })
  return { data: data ?? [], count: data?.length ?? 0, error: error?.message ?? null }
}

export async function fetchWarehouse(id: number): Promise<ApiResult<Warehouse>> {
  const { data, error } = await supabase.from('warehouses').select('*').eq('id', id).single()
  return { data, error: error?.message ?? null }
}

export async function createWarehouse(
  input: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResult<Warehouse>> {
  const { data, error } = await supabase.from('warehouses').insert(input as never).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateWarehouse(
  id: number,
  input: Partial<Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResult<Warehouse>> {
  const { data, error } = await supabase.from('warehouses').update(input as never).eq('id', id).select().single()
  return { data, error: error?.message ?? null }
}

export async function deleteWarehouse(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from('warehouses').delete().eq('id', id)
  return { data: null, error: error?.message ?? null }
}

// ====== Stocks ======

export async function fetchStocks(params?: {
  warehouse_id?: number
  product_id?: number
  low_stock?: boolean
  search?: string
  page?: number
  limit?: number
}): Promise<ListResponse<Stock>> {
  let query = supabase
    .from('stocks')
    .select('*, products!left(name, sku, specification, min_stock), warehouses!left(name)', {
      count: 'exact'
    })

  if (params?.warehouse_id) {
    query = query.eq('warehouse_id', params.warehouse_id)
  }
  if (params?.product_id) {
    query = query.eq('product_id', params.product_id)
  }
  if (params?.low_stock) {
    query = query.lt('quantity', 'products.min_stock' as any)
  }
  if (params?.search) {
    query = query.or(
      `products.name.ilike.%${params.search}%,products.sku.ilike.%${params.search}%`
    )
  }

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('product_id', { ascending: true })
    .range(from, to)

  const mapped = (data ?? []).map((s: any) => ({
    ...s,
    product_name: s.products?.name ?? null,
    product_sku: s.products?.sku ?? null,
    product_specification: s.products?.specification ?? null,
    warehouse_name: s.warehouses?.name ?? null,
    min_stock: s.products?.min_stock ?? null,
    products: undefined,
    warehouses: undefined
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

export async function fetchStockByProduct(
  productId: number
): Promise<ListResponse<Stock>> {
  const { data, error } = await supabase
    .from('stocks')
    .select('*, warehouses!left(name)')
    .eq('product_id', productId)

  const mapped = (data ?? []).map((s: any) => ({
    ...s,
    warehouse_name: s.warehouses?.name ?? null,
    warehouses: undefined
  }))

  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}