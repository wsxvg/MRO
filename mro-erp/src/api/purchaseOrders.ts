import { supabase } from '@/lib/supabase'
import type { ApiResult, ListResponse } from '@/types'

export interface PurchaseOrder {
  id: number
  supplier_id: number | null
  warehouse_id: number
  status: 'pending' | 'completed' | 'cancelled'
  remark: string | null
  created_at: string
  updated_at: string
  // Joined
  supplier_name?: string
  warehouse_name?: string
  items?: PurchaseOrderItem[]
  item_summary?: string
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  product_id: number
  quantity: number
  selling_price: number
  unit_cost: number
  is_estimated: boolean
  // Joined
  product_name?: string
}

export async function fetchPurchaseOrders(params?: {
  status?: string
}): Promise<ListResponse<PurchaseOrder>> {
  let query = supabase
    .from('purchase_orders')
    .select('*, suppliers!left(name), warehouses!left(name)', { count: 'exact' })

  if (params?.status) query = query.eq('status', params.status)

  const { data, error, count } = await query.order('created_at', { ascending: false })

  const mapped = (data ?? []).map((o: any) => ({
    ...o,
    supplier_name: o.suppliers?.name ?? null,
    warehouse_name: o.warehouses?.name ?? null,
    suppliers: undefined,
    warehouses: undefined,
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

export async function fetchPurchaseOrderItems(orderId: number): Promise<ListResponse<PurchaseOrderItem>> {
  const { data, error } = await supabase
    .from('purchase_order_items')
    .select('*, products!left(name)')
    .eq('purchase_order_id', orderId)

  const mapped = (data ?? []).map((i: any) => ({
    ...i,
    product_name: i.products?.name ?? null,
    products: undefined,
  }))

  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}

export async function createPurchaseOrder(input: {
  supplier_id?: number | null
  warehouse_id: number
  remark?: string | null
  items: Array<{
    product_id: number
    quantity: number
    selling_price: number
    unit_cost: number
    is_estimated: boolean
  }>
}): Promise<ApiResult<PurchaseOrder>> {
  const { data: order, error: orderErr } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: input.supplier_id ?? null,
      warehouse_id: input.warehouse_id,
      status: 'pending',
      remark: input.remark ?? null,
    } as any)
    .select()
    .single()

  if (orderErr || !order) return { data: null, error: orderErr?.message ?? '创建失败' }

  const items = input.items.map(i => ({
    purchase_order_id: (order as any).id,
    product_id: i.product_id,
    quantity: i.quantity,
    selling_price: i.selling_price,
    unit_cost: i.unit_cost,
    is_estimated: i.is_estimated,
  }))

  const { error: itemsErr } = await supabase.from('purchase_order_items').insert(items as any[])
  if (itemsErr) return { data: null, error: itemsErr.message }

  return { data: order as PurchaseOrder, error: null }
}

export async function completePurchaseOrder(
  orderId: number,
  priceOverrides?: Record<number, { unit_cost: number; is_estimated: boolean }>
): Promise<ApiResult<null>> {
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_order_id', orderId)

  if (!items || items.length === 0) return { data: null, error: '采购单无商品' }

  const { data: order } = await supabase
    .from('purchase_orders')
    .select('warehouse_id')
    .eq('id', orderId)
    .single()

  if (!order) return { data: null, error: '采购单不存在' }

  // Process items - if any fails, return error early (remaining items won't be processed)
  for (const item of items as any[]) {
    const override = priceOverrides?.[item.product_id]
    const unitCost = override?.unit_cost ?? item.unit_cost ?? 0
    const isEstimated = override?.is_estimated ?? (item.is_estimated || item.unit_cost <= 0)

    const { error } = await supabase.rpc('stock_in_with_lot', {
      p_product_id: item.product_id,
      p_warehouse_id: (order as any).warehouse_id,
      p_quantity: item.quantity,
      p_unit_cost: unitCost,
      p_is_estimated: isEstimated,
      p_supplier_id: null,
      p_remark: null,
    } as any)
    if (error) return { data: null, error: `入库失败(商品#${item.product_id}): ${error.message}` }
  }

  // All items processed successfully, update order status
  const { error: updateErr } = await supabase
    .from('purchase_orders')
    .update({ status: 'completed' } as any)
    .eq('id', orderId)

  return { data: null, error: updateErr?.message ?? null }
}

export async function cancelPurchaseOrder(orderId: number): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled' } as any)
    .eq('id', orderId)

  return { data: null, error: error?.message ?? null }
}
