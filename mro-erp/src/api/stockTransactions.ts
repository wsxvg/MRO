import { supabase } from '@/lib/supabase'
import type { StockTransaction, ApiResult, ListResponse } from '@/types'

export async function fetchStockTransactions(params?: {
  warehouse_id?: number
  product_id?: number
  type?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}): Promise<ListResponse<StockTransaction>> {
  let query = supabase
    .from('stock_transactions')
    .select('*, products!left(name), warehouses!left(name)', { count: 'exact' })

  if (params?.warehouse_id) {
    query = query.eq('warehouse_id', params.warehouse_id)
  }
  if (params?.product_id) {
    query = query.eq('product_id', params.product_id)
  }
  if (params?.type) {
    query = query.eq('type', params.type)
  }
  if (params?.date_from) {
    query = query.gte('created_at', params.date_from)
  }
  if (params?.date_to) {
    query = query.lte('created_at', params.date_to)
  }

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const mapped = (data ?? []).map((t: any) => ({
    ...t,
    product_name: t.products?.name ?? null,
    warehouse_name: t.warehouses?.name ?? null,
    products: undefined,
    warehouses: undefined
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

// ====== Simple Stock-In (for quick receiving) ======

export async function createStockIn(input: {
  product_id: number
  warehouse_id: number
  quantity: number
  unit_cost?: number
  remark?: string | null
}): Promise<ApiResult<null>> {
  // 1. Insert stock transaction
  const { error: txErr } = await supabase.from('stock_transactions').insert({
    product_id: input.product_id,
    warehouse_id: input.warehouse_id,
    type: 'stock_in',
    quantity: input.quantity,
    unit_cost: input.unit_cost ?? null,
    ref_type: null,
    ref_id: null,
    remark: input.remark ?? null
  } as never)
  if (txErr) return { data: null, error: txErr.message }

  // 2. Upsert stock quantity
  const { data: existing } = await supabase
    .from('stocks')
    .select('id, quantity')
    .eq('product_id', input.product_id)
    .eq('warehouse_id', input.warehouse_id)
    .maybeSingle()

  if (existing) {
    const existingData = existing as { id: number; quantity: number }
    const { error: upErr } = await supabase
      .from('stocks')
      .update({ quantity: existingData.quantity + input.quantity } as never)
      .eq('id', existingData.id)
    return { data: null, error: upErr?.message ?? null }
  }

  const { error: insErr } = await supabase
    .from('stocks')
    .insert({ product_id: input.product_id, warehouse_id: input.warehouse_id, quantity: input.quantity } as never)
  return { data: null, error: insErr?.message ?? null }
}

// ====== Stock Adjustment (for manual quantity setting) ======

export async function createStockAdjustment(input: {
  product_id: number
  warehouse_id: number
  quantity: number // target absolute quantity
}): Promise<ApiResult<null>> {
  const { data: existing } = await supabase
    .from('stocks')
    .select('id, quantity')
    .eq('product_id', input.product_id)
    .eq('warehouse_id', input.warehouse_id)
    .maybeSingle()

  const currentQty = existing ? (existing as { id: number; quantity: number }).quantity : 0
  const delta = input.quantity - currentQty

  if (delta === 0) return { data: null, error: null }

  // Create adjustment transaction
  const { error: txErr } = await supabase.from('stock_transactions').insert({
    product_id: input.product_id,
    warehouse_id: input.warehouse_id,
    type: 'adjustment',
    quantity: Math.abs(delta),
    unit_cost: null,
    ref_type: null,
    ref_id: null,
    remark: delta > 0 ? '手动调增' : '手动调减'
  } as never)
  if (txErr) return { data: null, error: txErr.message }

  // Update stock record
  if (existing) {
    const { error: upErr } = await supabase
      .from('stocks')
      .update({ quantity: input.quantity } as never)
      .eq('id', (existing as { id: number }).id)
    return { data: null, error: upErr?.message ?? null }
  }

  const { error: insErr } = await supabase
    .from('stocks')
    .insert({ product_id: input.product_id, warehouse_id: input.warehouse_id, quantity: input.quantity } as never)
  return { data: null, error: insErr?.message ?? null }
}
