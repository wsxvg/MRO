import { supabase } from '@/lib/supabase'
import type { ApiResult, ListResponse, Database } from '@/types'

// ====== Stock Report (uses stock_lots for accurate valuation) ======
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
  has_estimated: boolean
}>> {
  const { data, error } = await supabase.rpc('get_stock_report', {
    p_warehouse_id: params?.warehouse_id ?? null,
  } as any)
  if (error) return { data: [], count: 0, error: error.message }
  const rows = (data ?? []).map((d: any) => ({
    product_id: d.product_id,
    product_name: d.product_name,
    warehouse_name: d.warehouse_name,
    quantity: Number(d.quantity ?? 0),
    min_stock: Number(d.min_stock ?? 0),
    cost_price: Number(d.cost_price ?? 0),
    stock_value: Number(d.stock_value ?? 0),
    has_estimated: !!d.has_estimated,
  }))
  return { data: rows, count: rows.length, error: null }
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
  const { data, error } = await supabase.rpc('get_sales_summary', {
    p_start_date: params?.date_from ?? null,
    p_end_date: params?.date_to ?? null,
    p_warehouse_id: null,
  } as any)
  if (error) return { data: [], count: 0, error: error.message }
  const result = (data ?? []).map((d: any) => ({
    date: d.date,
    total_amount: Number(d.total_amount ?? 0),
    order_count: Number(d.order_count ?? 0),
  }))
  return { data: result, count: result.length, error: null }
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
  const { data, error } = await supabase.rpc('get_dashboard_kpis', {
    p_start_date: params?.date_from ?? monthStart,
    p_end_date: params?.date_to ? params.date_to + 'T23:59:59' : now.toISOString(),
    p_warehouse_id: null,
  } as any)
  if (error) return { data: null, error: error.message }
  const d = (data ?? {}) as any
  return {
    data: {
      total_products: Number(d.total_products ?? 0),
      total_customers: Number(d.total_customers ?? 0),
      total_warehouses: Number(d.total_warehouses ?? 0),
      pending_sales_orders: Number(d.pending_sales_orders ?? 0),
      month_sales_amount: Number(d.month_sales_amount ?? 0),
      low_stock_count: Number(d.low_stock_count ?? 0),
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

// ====== Dashboard: inventory by category (uses stock_lots) ======
export async function fetchInventoryByCategory(): Promise<ListResponse<{
  category_name: string
  quantity: number
  stock_value: number
}>> {
  const { data, error } = await supabase.rpc('get_inventory_by_category', { p_warehouse_id: null } as any)
  if (error) return { data: [], count: 0, error: error.message }
  const result = (data ?? []).map((d: any) => ({
    category_name: d.category_name,
    quantity: Number(d.quantity ?? 0),
    stock_value: Number(d.stock_value ?? 0),
  }))
  return { data: result, count: result.length, error: null }
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

  // Average inventory value = sum of lot quantity * lot unit_cost
  const lotRes = await supabase
    .from('stock_lots')
    .select('quantity, unit_cost')
    .gt('quantity', 0)

  const avgInventory = ((lotRes.data ?? []) as any[]).reduce(
    (sum: number, l: any) => sum + (Number(l.quantity) * Number(l.unit_cost)),
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
  const { data, error } = await supabase.rpc('get_profit_report', {
    p_start_date: params?.date_from ?? null,
    p_end_date: params?.date_to ? params.date_to + 'T23:59:59' : null,
    p_warehouse_id: null,
  } as any)
  if (error) return { data: [], count: 0, error: error.message }
  const rows: ProfitRow[] = (data ?? []).map((d: any) => ({
    id: d.id,
    order_no: d.order_no,
    customer_name: d.customer_name,
    created_at: d.created_at,
    total_amount: Number(d.total_amount ?? 0),
    cost_amount: Number(d.cost_amount ?? 0),
    gross_profit: Number(d.gross_profit ?? 0),
    margin_rate: String(d.margin_rate ?? '0.0'),
  }))
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

// ====== Hot Products (Top 10 by quantity and revenue) ======
export async function fetchHotProducts(params?: {
  date_from?: string
  date_to?: string
}): Promise<ApiResult<{
  by_quantity: Array<{ product_name: string; total_quantity: number; specification: string | null }>
  by_revenue: Array<{ product_name: string; total_amount: number; specification: string | null }>
}>> {
  const { data, error } = await supabase.rpc('get_hot_products', {
    p_start_date: params?.date_from ?? null,
    p_end_date: params?.date_to ?? null,
    p_limit: 10,
  } as any)
  if (error) return { data: null, error: error.message }
  const d = (data ?? {}) as any
  const by_quantity = ((d.by_quantity ?? []) as any[]).map((p) => ({
    product_name: p.product_name,
    total_quantity: Number(p.total_quantity ?? 0),
    specification: p.specification ?? null,
  }))
  const by_revenue = ((d.by_revenue ?? []) as any[]).map((p) => ({
    product_name: p.product_name,
    total_amount: Number(p.total_amount ?? 0),
    specification: p.specification ?? null,
  }))
  return { data: { by_quantity, by_revenue }, error: null }
}

// ====== Slow Products (90 days no sales, with stock) ======
export interface SlowProduct {
  product_id: number
  product_name: string
  specification: string | null
  stock_quantity: number
  days_idle: number
}

export async function fetchSlowProducts(): Promise<ListResponse<SlowProduct>> {
  const { data, error } = await supabase.rpc('get_slow_products', { p_days: 60, p_limit: 10 } as any)
  if (error) return { data: [], count: 0, error: error.message }
  const rows: SlowProduct[] = (data ?? []).map((d: any) => ({
    product_id: d.product_id,
    product_name: d.product_name,
    specification: d.specification,
    stock_quantity: Number(d.stock_quantity ?? 0),
    days_idle: Number(d.days_idle ?? 0),
  }))
  return { data: rows, count: rows.length, error: null }
}

// ====== Anomaly Detection ======
export interface Anomaly {
  type: string
  severity: 'high' | 'medium'
  product_id: number
  product_name: string
  detail: string
}

export async function fetchAnomalies(): Promise<ListResponse<Anomaly>> {
  const anomalies: Anomaly[] = []

  // 1. 进价异常：最近一次入库价较上次波动 >30%（不显示具体价格）
  const { data: lots } = await supabase
    .from('stock_lots')
    .select('product_id, unit_cost, stock_in_date, products(name)')
    .gt('unit_cost', 0)
    .order('stock_in_date', { ascending: true })

  const lotsByProduct = new Map<number, Array<{ cost: number; date: string }>>()
  for (const lot of (lots ?? []) as any[]) {
    const arr = lotsByProduct.get(lot.product_id) ?? []
    arr.push({ cost: lot.unit_cost, date: lot.stock_in_date })
    lotsByProduct.set(lot.product_id, arr)
  }

  for (const [productId, lotArr] of lotsByProduct) {
    if (lotArr.length < 2) continue
    const latest = lotArr[lotArr.length - 1]
    const prev = lotArr[lotArr.length - 2]
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    if (new Date(latest.date).getTime() < thirtyDaysAgo) continue
    if (prev.cost <= 0) continue
    const changePct = Math.round(((latest.cost - prev.cost) / prev.cost) * 100)
    if (Math.abs(changePct) > 30) {
      const dir = changePct > 0 ? '上涨' : '下降'
      anomalies.push({
        type: '进价异常',
        severity: 'high',
        product_id: productId,
        product_name: (lots as any[])?.find((l: any) => l.product_id === productId)?.products?.name ?? '',
        detail: `进价较上次${dir} ${Math.abs(changePct)}%，请核实`,
      })
    }
  }

  // 2. 库存为负
  const { data: negStocks } = await supabase
    .from('stocks')
    .select('product_id, quantity, products!inner(name)')
    .lt('quantity', 0)

  for (const s of (negStocks ?? []) as any[]) {
    anomalies.push({
      type: '库存为负',
      severity: 'high',
      product_id: s.product_id,
      product_name: s.products?.name ?? '',
      detail: `库存为 ${s.quantity}，请检查出库记录`,
    })
  }

  // 3. 低库存预警
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id, name, min_stock, stocks(quantity)')
    .eq('is_active', true)
    .gt('min_stock', 0)

  for (const p of (lowStockProducts ?? []) as any[]) {
    const totalQty = (p.stocks ?? []).reduce((s: number, st: any) => s + st.quantity, 0)
    if (totalQty < p.min_stock) {
      anomalies.push({
        type: '低库存',
        severity: 'medium',
        product_id: p.id,
        product_name: p.name,
        detail: `当前库存 ${totalQty}，安全库存 ${p.min_stock}，建议补货`,
      })
    }
  }

  // 4. 滞销预警：有库存但 90 天无销售
  const { data: slowData } = await fetchSlowProducts()
  for (const s of (slowData ?? [])) {
    if (s.days_idle >= 90) {
      anomalies.push({
        type: '滞销预警',
        severity: 'medium',
        product_id: s.product_id,
        product_name: s.product_name,
        detail: `已 ${s.days_idle} 天未售出，库存 ${s.stock_quantity} 个，建议清库`,
      })
    }
  }

  // Sort: high severity first
  anomalies.sort((a, b) => (a.severity === 'high' ? -1 : 1) - (b.severity === 'high' ? -1 : 1))

  return { data: anomalies, count: anomalies.length, error: null }
}
