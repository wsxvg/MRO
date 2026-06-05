import { supabase } from '@/lib/supabase'
import type {
  SalesOrder, SalesOrderItem,
  SalesReturnOrder, SalesReturnItem,
  PaymentRecord,
  ApiResult, ListResponse, Database
} from '@/types'

// ====== Sales Orders ======

export async function fetchSalesOrders(params?: {
  status?: string
  customer_id?: number
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}): Promise<ListResponse<SalesOrder>> {
  let query = supabase
    .from('sales_orders')
    .select('*, customers!left(name), warehouses!left(name)', { count: 'exact' })

  if (params?.status) query = query.eq('status', params.status)
  if (params?.customer_id) query = query.eq('customer_id', params.customer_id)
  if (params?.date_from) query = query.gte('created_at', params.date_from)
  if (params?.date_to) {
    // If date_to is a date-only string (YYYY-MM-DD), extend to end of day
    const dateTo = params.date_to.length === 10
      ? `${params.date_to}T23:59:59.999`
      : params.date_to
    query = query.lte('created_at', dateTo)
  }

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const mapped = (data ?? []).map((o: any) => ({
    ...o,
    customer_name: o.customers?.name ?? null,
    warehouse_name: o.warehouses?.name ?? null,
    needs_delivery: o.needs_delivery ?? false,
    customers: undefined,
    warehouses: undefined
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

export async function fetchSalesOrder(id: number): Promise<ApiResult<SalesOrder>> {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*, customers!left(name), warehouses!left(name)')
    .eq('id', id)
    .single()

  if (data) {
    const o = data as any
    o.customer_name = o.customers?.name ?? null
    o.warehouse_name = o.warehouses?.name ?? null
    o.needs_delivery = o.needs_delivery ?? false
    delete o.customers
    delete o.warehouses
  }

  return { data: data as SalesOrder | null, error: error?.message ?? null }
}

export async function createSalesOrder(
  input: Omit<SalesOrder, 'id' | 'order_no' | 'created_at' | 'updated_at' | 'customer_name' | 'warehouse_name'>
): Promise<ApiResult<SalesOrder>> {
  const { data, error } = await supabase.from('sales_orders').insert(input as any).select('id, order_no, customer_id, warehouse_id, status, needs_delivery, total_amount, paid_amount, remark, created_at, updated_at').single()
  return { data, error: error?.message ?? null }
}

export async function updateSalesOrder(
  id: number,
  input: Partial<Omit<SalesOrder, 'id' | 'order_no' | 'created_at' | 'updated_at'>>
): Promise<ApiResult<SalesOrder>> {
  const { data, error } = await supabase.from('sales_orders').update(input as any).eq('id', id).select('id, order_no, customer_id, warehouse_id, status, needs_delivery, total_amount, paid_amount, remark, created_at, updated_at').single()
  return { data, error: error?.message ?? null }
}

export async function completeSalesOrder(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('complete_sales_order', { p_order_id: id } as any)
  if (!error) {
    const { data: items } = await supabase
      .from('sales_order_items')
      .select('product_id')
      .eq('sales_order_id', id)
    const productIds = [...new Set((items ?? []).map((i: any) => i.product_id))]
    await Promise.all(productIds.map(pid =>
      supabase.rpc('calc_safety_stock', { p_product_id: pid } as any)
    ))
  }
  return { data: null, error: error?.message ?? null }
}

/**
 * Complete a sales order with per-item warehouse overrides.
 * Items not in the override map use the order's default warehouse.
 * This is used when some items need to be deducted from a different warehouse
 * (e.g., shop is out of stock, pull from warehouse B).
 */
export async function completeSalesOrderWithWarehouses(
  orderId: number,
  warehouseOverrides: Record<number, number> // product_id → warehouse_id
): Promise<ApiResult<null>> {
  // Update warehouse_id on specific order items before completing
  for (const [productId, warehouseId] of Object.entries(warehouseOverrides)) {
    await supabase
      .from('sales_order_items')
      .update({ warehouse_id: warehouseId } as any)
      .eq('sales_order_id', orderId)
      .eq('product_id', Number(productId))
  }

  // Call the multi-warehouse completion RPC
  const { error } = await supabase.rpc('complete_sales_order_mw', { p_order_id: orderId } as any)
  if (!error) {
    const { data: items } = await supabase
      .from('sales_order_items')
      .select('product_id')
      .eq('sales_order_id', orderId)
    const productIds = [...new Set((items ?? []).map((i: any) => i.product_id))]
    await Promise.all(productIds.map(pid =>
      supabase.rpc('calc_safety_stock', { p_product_id: pid } as any)
    ))
  }
  return { data: null, error: error?.message ?? null }
}

export async function reverseSalesOrder(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('reverse_sales_order', { p_order_id: id } as any)
  return { data: null, error: error?.message ?? null }
}

/**
 * Delete a sales order and all related records (items, payment records).
 * Use after reversing stock, or for cancelled orders.
 */
export async function deleteSalesOrder(id: number): Promise<ApiResult<null>> {
  await supabase.from('payment_records').delete().eq('sales_order_id', id)
  await supabase.from('sales_order_items').delete().eq('sales_order_id', id)
  const { error } = await supabase.from('sales_orders').delete().eq('id', id)
  return { data: null, error: error?.message ?? null }
}

// ====== Sales Order Items ======

export async function fetchSalesOrderItems(orderId: number): Promise<ListResponse<SalesOrderItem>> {
  const { data, error } = await supabase
    .from('sales_order_items')
    .select('*, products!left(name, specification)')
    .eq('sales_order_id', orderId)

  const mapped = (data ?? []).map((i: any) => ({
    ...i,
    product_name: i.products?.name ?? null,
    product_specification: i.products?.specification ?? null,
    products: undefined
  }))

  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}

export async function saveSalesOrderItems(
  orderId: number,
  items: Omit<SalesOrderItem, 'id' | 'sales_order_id' | 'line_total'>[]
): Promise<ApiResult<null>> {
  if (items.length === 0) {
    const { error } = await supabase.from('sales_order_items').delete().eq('sales_order_id', orderId)
    return { data: null, error: error?.message ?? null }
  }

  const records = items.map(i => ({
    sales_order_id: orderId,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    cost_price: i.cost_price,
    warehouse_id: (i as any).warehouse_id ?? null
  }))

  // Safe pattern: validate insert succeeds before deleting old data.
  // Step 1: Insert new items alongside old ones (temporarily have duplicates)
  const { error: insertErr } = await supabase.from('sales_order_items').insert(records as any[])
  if (insertErr) return { data: null, error: insertErr.message }

  // Step 2: Old items still exist; delete them by keeping only the newest batch.
  // Fetch all items for this order, keep only the latest N (our new items).
  const { data: allItems } = await supabase
    .from('sales_order_items')
    .select('id')
    .eq('sales_order_id', orderId)
    .order('id', { ascending: false })

  if (allItems && allItems.length > records.length) {
    // Delete the older extras (everything beyond our new batch)
    const idsToDelete = allItems.slice(records.length).map((r: any) => r.id)
    await supabase.from('sales_order_items').delete().in('id', idsToDelete)
  }

  return { data: null, error: null }
}

// ====== Sales Returns ======

export async function fetchSalesReturns(params?: {
  status?: string
  customer_id?: number
  page?: number
  limit?: number
}): Promise<ListResponse<SalesReturnOrder>> {
  let query = supabase
    .from('sales_return_orders')
    .select('*, customers!left(name), warehouses!left(name)', { count: 'exact' })

  if (params?.status) query = query.eq('status', params.status)
  if (params?.customer_id) query = query.eq('customer_id', params.customer_id)

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const mapped = (data ?? []).map((o: any) => ({
    ...o,
    customer_name: o.customers?.name ?? null,
    warehouse_name: o.warehouses?.name ?? null,
    needs_delivery: o.needs_delivery ?? false,
    customers: undefined,
    warehouses: undefined
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

export async function fetchSalesReturn(id: number): Promise<ApiResult<SalesReturnOrder>> {
  const { data, error } = await supabase
    .from('sales_return_orders')
    .select('*, customers!left(name), warehouses!left(name)')
    .eq('id', id)
    .single()

  if (data) {
    const o = data as any
    o.customer_name = o.customers?.name ?? null
    o.warehouse_name = o.warehouses?.name ?? null
    delete o.customers
    delete o.warehouses
  }

  return { data: data as SalesReturnOrder | null, error: error?.message ?? null }
}

export async function createSalesReturn(
  input: Omit<SalesReturnOrder, 'id' | 'order_no' | 'created_at' | 'updated_at' | 'customer_name' | 'warehouse_name'>
): Promise<ApiResult<SalesReturnOrder>> {
  const { data, error } = await supabase.from('sales_return_orders').insert(input as any).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateSalesReturn(
  id: number,
  input: Partial<Omit<SalesReturnOrder, 'id' | 'order_no' | 'created_at' | 'updated_at' | 'customer_name' | 'warehouse_name'>>
): Promise<ApiResult<SalesReturnOrder>> {
  const { data, error } = await supabase.from('sales_return_orders').update(input as any).eq('id', id).select().single()
  return { data, error: error?.message ?? null }
}

export async function completeSalesReturn(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('complete_sales_return', { p_return_id: id } as any)
  return { data: null, error: error?.message ?? null }
}

// ====== Sales Return Items ======

export async function fetchSalesReturnItems(returnId: number): Promise<ListResponse<SalesReturnItem>> {
  const { data, error } = await supabase
    .from('sales_return_items')
    .select('*, products!left(name)')
    .eq('return_order_id', returnId)

  const mapped = (data ?? []).map((i: any) => ({
    ...i,
    product_name: i.products?.name ?? null,
    products: undefined
  }))

  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}

export async function saveSalesReturnItems(
  returnId: number,
  items: Omit<SalesReturnItem, 'id' | 'return_order_id' | 'line_total'>[]
): Promise<ApiResult<null>> {
  await supabase.from('sales_return_items').delete().eq('return_order_id', returnId)
  if (items.length === 0) return { data: null, error: null }

  const records = items.map(i => ({
    return_order_id: returnId,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price
  }))

  const { error } = await supabase.from('sales_return_items').insert(records as any[])
  return { data: null, error: error?.message ?? null }
}

export async function createPayment(
  input: Omit<PaymentRecord, 'id' | 'created_at'>
): Promise<ApiResult<PaymentRecord>> {
  const { data, error } = await supabase.from('payment_records').insert(input as any).select().single()
  return { data, error: error?.message ?? null }
}

export async function fetchPaymentRecords(salesOrderId: number): Promise<ListResponse<PaymentRecord>> {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('sales_order_id', salesOrderId)
    .order('created_at', { ascending: false })

  return { data: (data as PaymentRecord[]) ?? [], count: data?.length ?? 0, error: error?.message ?? null }
}


