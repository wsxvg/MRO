import { supabase } from '@/lib/supabase'
import type { ApiResult, ListResponse, Database } from '@/types'

// ====== Stock Report ======
export async function fetchStockReport(params?: {
  warehouse_id?: number
}): Promise<ListResponse<{
  product_id: number
  product_name: string
  warehouse_name: string
  quantity: number
  min_stock: number
  cost_price: number
  stock_value: number
}>> {
  let query = supabase
    .from('stocks')
    .select(
      '*, products!left(name, min_stock, cost_price), warehouses!left(name)',
      { count: 'exact' }
    )

  if (params?.warehouse_id) {
    query = query.eq('warehouse_id', params.warehouse_id)
  }

  const { data, error, count } = await query.order('product_id')

  const mapped = (data ?? []).map((s: any) => ({
    product_id: s.product_id,
    product_name: s.products?.name ?? '',
    warehouse_name: s.warehouses?.name ?? '',
    quantity: s.quantity,
    min_stock: s.products?.min_stock ?? 0,
    cost_price: s.products?.cost_price ?? 0,
    stock_value: s.quantity * (s.products?.cost_price ?? 0)
  }))

  return { data: mapped, count: count ?? 0, error: error?.message ?? null }
}

// ====== Sales Summary ======
export async function fetchSalesSummary(params?: {
  date_from?: string
  date_to?: string
}): Promise<ListResponse<{
  date: string
  total_amount: number
  order_count: number
}>> {
  let query = supabase
    .from('sales_orders')
    .select('created_at, total_amount', { count: 'exact' })
    .eq('status', 'completed')

  if (params?.date_from) query = query.gte('created_at', params.date_from)
  if (params?.date_to) query = query.lte('created_at', params.date_to)

  const { data, error } = await query.order('created_at')

  // Group by date client-side for simplicity
  const map = new Map<string, { total_amount: number; order_count: number }>()
  for (const row of (data ?? []) as any[]) {
    const date = row.created_at.slice(0, 10)
    const entry = map.get(date) ?? { total_amount: 0, order_count: 0 }
    entry.total_amount += Number(row.total_amount)
    entry.order_count++
    map.set(date, entry)
  }

  const result = Array.from(map.entries()).map(([date, vals]) => ({
    date,
    ...vals
  }))

  return { data: result, count: result.length, error: error?.message ?? null }
}

// ====== Dashboard KPIs ======
export async function fetchDashboardKPIs(params?: {
  date_from?: string
  date_to?: string
}): Promise<
  ApiResult<{
    total_products: number
    total_customers: number
    total_warehouses: number
    pending_sales_orders: number
    month_sales_amount: number
    low_stock_count: number
  }>
> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const salesFrom = params?.date_from ?? monthStart
  const salesTo = params?.date_to

  const [products, customers, warehouses, pendingSO, monthSales, lowStock] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('warehouses').select('*', { count: 'exact', head: true }),
      supabase.from('sales_orders').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase
        .from('sales_orders')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('created_at', salesFrom)
        .lte('created_at', salesTo ?? now.toISOString()),
      supabase.from('stocks').select('*, products!left(min_stock)')
    ])

  const monthSalesTotal = ((monthSales.data ?? []) as any[]).reduce(
    (sum: number, o: any) => sum + Number(o.total_amount),
    0
  )

  // Low stock check
  const lowStockCount =
    lowStock.data?.filter((s: any) => {
      const minStock = (s as any).products?.min_stock
      return minStock != null && s.quantity < minStock
    }).length ?? 0

  return {
    data: {
      total_products: products.count ?? 0,
      total_customers: customers.count ?? 0,
      total_warehouses: warehouses.count ?? 0,
      pending_sales_orders: pendingSO.count ?? 0,
      month_sales_amount: monthSalesTotal,
      low_stock_count: lowStockCount
    },
    error: null
  }
}

// ====== Dashboard Extended: monthly trend (last 6 months) ======
export async function fetchMonthlyTrend(): Promise<ListResponse<{
  month: string
  sales_amount: number
  sales_count: number
}>> {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)

  const { data, error } = await supabase.rpc('get_monthly_sales_trend', {
    p_start_date: sixMonthsAgo,
  } as any)

  const raw = (data ?? []) as Array<{ month: string; sales_amount: number; sales_count: number }>

  // Fill missing months with 0
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const dbMap = new Map<string, { sales_amount: number; sales_count: number }>()
  for (const row of raw) {
    dbMap.set(row.month, { sales_amount: Number(row.sales_amount), sales_count: Number(row.sales_count) })
  }

  const result = months.map(m => ({
    month: m,
    sales_amount: dbMap.get(m)?.sales_amount ?? 0,
    sales_count: dbMap.get(m)?.sales_count ?? 0,
  }))

  return { data: result, count: result.length, error: error?.message ?? null }
}

// ====== Dashboard: inventory by category ======
export async function fetchInventoryByCategory(): Promise<ListResponse<{
  category_name: string
  quantity: number
  stock_value: number
}>> {
  const { data, error } = await supabase
    .from('stocks')
    .select('quantity, products!inner(cost_price, categories!inner(name))')

  const map = new Map<string, { quantity: number; value: number }>()
  for (const row of (data ?? []) as any[]) {
    const catName = row.products?.categories?.name ?? '未分类'
    const entry = map.get(catName) ?? { quantity: 0, value: 0 }
    entry.quantity += row.quantity
    entry.value += row.quantity * (row.products?.cost_price ?? 0)
    map.set(catName, entry)
  }

  const result = Array.from(map.entries()).map(([name, vals]) => ({
    category_name: name,
    quantity: vals.quantity,
    stock_value: vals.value
  }))

  return { data: result, count: result.length, error: error?.message ?? null }
}

// ====== Dashboard: inventory turnover rate ======
export async function fetchInventoryTurnoverRate(params?: {
  date_from?: string
  date_to?: string
}): Promise<ApiResult<{
  rate: number
  cogs: number
  avg_inventory_value: number
}>> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const salesFrom = params?.date_from ?? monthStart
  const salesTo = params?.date_to ?? now.toISOString()

  // COGS = cost of goods sold this month (from completed sales order items)
  const cogsRes = await supabase
    .from('sales_order_items')
    .select('cost_price, quantity, sales_orders!inner(created_at, status)')
    .eq('sales_orders.status', 'completed')
    .gte('sales_orders.created_at', salesFrom)
    .lte('sales_orders.created_at', salesTo)

  const cogs = ((cogsRes.data ?? []) as any[]).reduce(
    (sum: number, item: any) => sum + (Number(item.cost_price) * item.quantity),
    0
  )

  // Average inventory value = sum of stock quantity * cost_price
  const stockRes = await supabase
    .from('stocks')
    .select('quantity, products!inner(cost_price)')

  const avgInventory = ((stockRes.data ?? []) as any[]).reduce(
    (sum: number, s: any) => sum + (s.quantity * Number(s.products?.cost_price ?? 0)),
    0
  )

  const rate = avgInventory > 0 ? cogs / avgInventory : 0

  return {
    data: { rate: Math.round(rate * 100) / 100, cogs, avg_inventory_value: avgInventory },
    error: null
  }
}

// ====== Profit Report (single query, no N+1) ======
export interface ProfitRow {
  id: number
  order_no: string
  customer_name: string
  created_at: string
  total_amount: number
  cost_amount: number
  gross_profit: number
  margin_rate: string
}

export async function fetchProfitReport(params?: {
  date_from?: string
  date_to?: string
}): Promise<ListResponse<ProfitRow>> {
  let query = supabase
    .from('sales_orders')
    .select(`
      id,
      order_no,
      created_at,
      total_amount,
      customers!left(name),
      sales_order_items!left(cost_price, quantity)
    `)
    .eq('status', 'completed')

  if (params?.date_from) query = query.gte('created_at', params.date_from)
  if (params?.date_to) query = query.lte('created_at', params.date_to + 'T23:59:59')

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return { data: [], count: 0, error: error.message }

  const rows: ProfitRow[] = []
  for (const raw of (data ?? []) as any[]) {
    const items: Array<{ cost_price: number; quantity: number }> = (raw.sales_order_items ?? []).map((i: any) => ({
      cost_price: Number(i.cost_price ?? 0),
      quantity: Number(i.quantity ?? 0)
    }))
    const totalAmount = Number(raw.total_amount ?? 0)
    const costAmount = items.reduce((s, i) => s + i.cost_price * i.quantity, 0)
    const grossProfit = totalAmount - costAmount
    const marginRate = totalAmount > 0 ? ((grossProfit / totalAmount) * 100).toFixed(1) : '0.0'

    rows.push({
      id: raw.id,
      order_no: raw.order_no,
      customer_name: raw.customers?.name ?? '-',
      created_at: raw.created_at,
      total_amount: totalAmount,
      cost_amount: costAmount,
      gross_profit: grossProfit,
      margin_rate: marginRate,
    })
  }

  return { data: rows, count: rows.length, error: null }
}

// ====== Stock Transactions by Date Report ======
export interface StockTransactionByDate {
  date: string
  type: string
  total_quantity: number
  transaction_count: number
}

export async function fetchStockTransactionsByDate(params?: {
  date_from?: string
  date_to?: string
  warehouse_id?: number
  product_id?: number
  type?: string
}): Promise<ListResponse<StockTransactionByDate>> {
  const { data, error } = await supabase.rpc('get_stock_transactions_by_date', {
    p_date_from: params?.date_from ?? null,
    p_date_to: params?.date_to ?? null,
    p_warehouse_id: params?.warehouse_id ?? null,
    p_product_id: params?.product_id ?? null,
    p_type: params?.type ?? null,
  } as any)
  const mapped = (data ?? []).map((d: any) => ({
    date: d.date,
    type: d.type,
    total_quantity: Number(d.total_quantity),
    transaction_count: Number(d.transaction_count),
  }))
  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}

export async function fetchRecentOrders(
  limit: number = 8,
  params?: {
    date_from?: string
    date_to?: string
  }
): Promise<ListResponse<{
  id: number
  order_no: string
  counterparty: string
  total_amount: number
  status: string
  created_at: string
}>> {
  let query = supabase
    .from('sales_orders')
    .select('id, order_no, total_amount, status, created_at, customers!left(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (params?.date_from) query = query.gte('created_at', params.date_from)
  if (params?.date_to) query = query.lte('created_at', params.date_to)

  const { data, error } = await query

  const mapped = ((data ?? []) as any[]).map(o => ({
    id: o.id,
    order_no: o.order_no,
    counterparty: o.customers?.name ?? '-',
    total_amount: Number(o.total_amount),
    status: o.status,
    created_at: o.created_at
  }))

  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}
