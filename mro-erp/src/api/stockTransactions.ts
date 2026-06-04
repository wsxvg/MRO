import { supabase } from '@/lib/supabase'
import type { StockTransaction, StockLot, ApiResult, ListResponse, Database } from '@/types'

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

// ====== Stock-In with Lot (批次入库) ======

export async function createStockIn(input: {
  product_id: number
  warehouse_id: number
  quantity: number
  unit_cost?: number
  is_estimated?: boolean
  supplier_id?: number | null
  remark?: string | null
}): Promise<ApiResult<number>> {
  const { data, error } = await supabase.rpc('stock_in_with_lot', {
    p_product_id: input.product_id,
    p_warehouse_id: input.warehouse_id,
    p_quantity: input.quantity,
    p_unit_cost: input.unit_cost ?? 0,
    p_is_estimated: input.is_estimated ?? (input.unit_cost ? false : true),
    p_supplier_id: input.supplier_id ?? null,
    p_remark: input.remark ?? null,
  } as any)

  // 入库后自动重算安全库存
  if (!error) {
    await supabase.rpc('calc_safety_stock', { p_product_id: input.product_id } as any)
  }

  return { data: data as number ?? null, error: error?.message ?? null }
}

// ====== Batch Stock-In (多商品批次入库) ======

export async function batchCreateStockIn(inputs: Array<{
  product_id: number
  warehouse_id: number
  quantity: number
  unit_cost?: number
  is_estimated?: boolean
  supplier_id?: number | null
  remark?: string | null
}>): Promise<ApiResult<null>> {
  if (inputs.length === 0) return { data: null, error: null }

  const errors: string[] = []
  for (const input of inputs) {
    const { error } = await createStockIn(input)
    if (error) errors.push(error)
  }

  return {
    data: null,
    error: errors.length > 0 ? errors.join('; ') : null
  }
}

// ====== Stock Lot Queries ======

export async function fetchStockLots(params?: {
  product_id?: number
  warehouse_id?: number
  only_positive?: boolean
}): Promise<ListResponse<StockLot>> {
  let query = supabase
    .from('stock_lots')
    .select('*, products!left(name), warehouses!left(name), suppliers!left(name)', { count: 'exact' })

  if (params?.product_id) {
    query = query.eq('product_id', params.product_id)
  }
  if (params?.warehouse_id) {
    query = query.eq('warehouse_id', params.warehouse_id)
  }
  if (params?.only_positive !== false) {
    query = query.gt('quantity', 0)
  }

  const { data, error, count } = await query.order('stock_in_date', { ascending: true })

  const mapped = (data ?? []).map((l: any) => ({
    ...l,
    product_name: l.products?.name ?? null,
    warehouse_name: l.warehouses?.name ?? null,
    supplier_name: l.suppliers?.name ?? null,
    products: undefined,
    warehouses: undefined,
    suppliers: undefined,
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

// ====== Update Lot Cost (核价) ======

export async function updateLotCost(lotId: number, newCost: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('update_lot_cost', {
    p_lot_id: lotId,
    p_new_cost: newCost,
  } as any)

  return { data: null, error: error?.message ?? null }
}

// ====== Recalculate Product Cost ======

export async function recalcProductCost(productId: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('recalc_product_cost', {
    p_product_id: productId,
  } as any)

  return { data: null, error: error?.message ?? null }
}

// ====== Stock Adjustment (goes through lots) ======

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

  // Get product cost price for the lot
  const { data: product } = await supabase
    .from('products')
    .select('cost_price')
    .eq('id', input.product_id)
    .single()
  const costPrice = (product as any)?.cost_price ?? 0

  if (delta > 0) {
    // Increase: create a new lot
    await supabase.from('stock_lots').insert({
      warehouse_id: input.warehouse_id,
      product_id: input.product_id,
      quantity: delta,
      unit_cost: costPrice,
      is_estimated: costPrice <= 0,
      remark: '手动调增',
    } as any)
  } else {
    // Decrease: deduct from lots FIFO
    let remaining = Math.abs(delta)
    const { data: lots } = await supabase
      .from('stock_lots')
      .select('id, quantity')
      .eq('product_id', input.product_id)
      .eq('warehouse_id', input.warehouse_id)
      .gt('quantity', 0)
      .order('stock_in_date', { ascending: true })

    for (const lot of (lots ?? []) as any[]) {
      if (remaining <= 0) break
      const deduct = Math.min(lot.quantity, remaining)
      await supabase.from('stock_lots').update({ quantity: lot.quantity - deduct } as any).eq('id', lot.id)
      remaining -= deduct
    }
  }

  // Create adjustment transaction
  const { error: txErr } = await supabase.from('stock_transactions').insert({
    product_id: input.product_id,
    warehouse_id: input.warehouse_id,
    type: 'adjustment',
    quantity: Math.abs(delta),
    unit_cost: costPrice > 0 ? costPrice : null,
    ref_type: null,
    ref_id: null,
    remark: delta > 0 ? '手动调增' : '手动调减'
  } as any)
  if (txErr) return { data: null, error: txErr.message }

  // Update stock record
  if (existing) {
    const { error: upErr } = await supabase
      .from('stocks')
      .update({ quantity: input.quantity } as any)
      .eq('id', (existing as { id: number }).id)
    return { data: null, error: upErr?.message ?? null }
  }

  const { error: insErr } = await supabase
    .from('stocks')
    .insert({ product_id: input.product_id, warehouse_id: input.warehouse_id, quantity: input.quantity } as any)
  return { data: null, error: insErr?.message ?? null }
}
