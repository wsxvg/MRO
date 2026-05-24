import { supabase } from '@/lib/supabase'
import type {
  SalesOrder, SalesOrderItem,
  SalesReturnOrder, SalesReturnItem,
  PaymentRecord,
  ApiResult, ListResponse
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
  if (params?.date_to) query = query.lte('created_at', params.date_to)

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
    delete o.customers
    delete o.warehouses
  }

  return { data: data as SalesOrder | null, error: error?.message ?? null }
}

export async function createSalesOrder(
  input: Omit<SalesOrder, 'id' | 'order_no' | 'created_at' | 'updated_at' | 'customer_name' | 'warehouse_name'>
): Promise<ApiResult<SalesOrder>> {
  const { data, error } = await supabase.from('sales_orders').insert(input as never).select('id, order_no, customer_id, warehouse_id, status, total_amount, paid_amount, remark, created_at, updated_at').single()
  return { data, error: error?.message ?? null }
}

export async function updateSalesOrder(
  id: number,
  input: Partial<Omit<SalesOrder, 'id' | 'order_no' | 'created_at' | 'updated_at'>>
): Promise<ApiResult<SalesOrder>> {
  const { data, error } = await supabase.from('sales_orders').update(input as never).eq('id', id).select('id, order_no, customer_id, warehouse_id, status, total_amount, paid_amount, remark, created_at, updated_at').single()
  return { data, error: error?.message ?? null }
}

export async function completeSalesOrder(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('complete_sales_order', { p_order_id: id } as never)
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
  await supabase.from('sales_order_items').delete().eq('sales_order_id', orderId)
  if (items.length === 0) return { data: null, error: null }

  const records = items.map(i => ({
    sales_order_id: orderId,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    cost_price: i.cost_price
  }))

  const { error } = await supabase.from('sales_order_items').insert(records as never)
  return { data: null, error: error?.message ?? null }
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
  const { data, error } = await supabase.from('sales_return_orders').insert(input as never).select().single()
  return { data, error: error?.message ?? null }
}

export async function completeSalesReturn(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.rpc('complete_sales_return', { p_return_id: id } as never)
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

  const { error } = await supabase.from('sales_return_items').insert(records as never)
  return { data: null, error: error?.message ?? null }
}

export async function createPayment(
  input: Omit<PaymentRecord, 'id' | 'created_at'>
): Promise<ApiResult<PaymentRecord>> {
  const { data, error } = await supabase.from('payment_records').insert(input as never).select().single()
  return { data, error: error?.message ?? null }
}


