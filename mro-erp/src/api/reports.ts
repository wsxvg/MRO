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
  // 1. Get stock quantities
  let stockQuery = supabase
    .from('stocks')
    .select('*, products!left(name, min_stock, cost_price), warehouses!left(name)', { count: 'exact' })

  if (params?.warehouse_id) {
    stockQuery = stockQuery.eq('warehouse_id', params.warehouse_id)
  }

  const { data: stockData, error, count } = await stockQuery.order('product_id')

  // 2. Get lot summaries for accurate valuation
  const productIds = [...new Set((stockData ?? []).map((s: any) => s.product_id))]
  const lotMap = new Map<number, { value: number; hasEstimated: boolean }>()

  if (productIds.length > 0) {
    const { data: lotData } = await supabase
      .from('stock_lots')
      .select('product_id, quantity, unit_cost, is_estimated')
      .in('product_id', productIds)
      .gt('quantity', 0)

    for (const lot of (lotData ?? []) as any[]) {
      const entry = lotMap.get(lot.product_id) ?? { value: 0, hasEstimated: false }
      entry.value += lot.quantity * lot.unit_cost
      if (lot.is_estimated) entry.hasEstimated = true
      lotMap.set(lot.product_id, entry)
    }
  }

  const mapped = (stockData ?? []).map((s: any) => {
    const lotInfo = lotMap.get(s.product_id)
    const stockValue = lotInfo ? lotInfo.value : s.quantity * (s.products?.cost_price ?? 0)
    return {
      product_id: s.product_id,
      product_name: s.products?.name ?? '',
      warehouse_name: s.warehouses?.name ?? '',
      quantity: s.quantity,
      min_stock: s.products?.min_stock ?? 0,
      cost_price: s.products?.cost_price ?? 0,
      stock_value: stockValue,
      has_estimated: lotInfo?.hasEstimated ?? false,
    }
  })

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

// ====== Dashboard: inventory by category (uses stock_lots) ======
export async function fetchInventoryByCategory(): Promise<ListResponse<{
  category_name: string
  quantity: number
  stock_value: number
}>> {
  // Get stock with product/category info
  const { data, error } = await supabase
    .from('stocks')
    .select('product_id, quantity, products!inner(categories!inner(name))')

  if (error) return { data: [], count: 0, error: error.message }

  // Get lot values per product
  const productIds = [...new Set((data ?? []).map((r: any) => r.product_id))]
  const lotValueMap = new Map<number, number>()
  if (productIds.length > 0) {
    const { data: lotData } = await supabase
      .from('stock_lots')
      .select('product_id, quantity, unit_cost')
      .in('product_id', productIds)
      .gt('quantity', 0)
    for (const lot of (lotData ?? []) as any[]) {
      lotValueMap.set(lot.product_id, (lotValueMap.get(lot.product_id) ?? 0) + lot.quantity * lot.unit_cost)
    }
  }

  const map = new Map<string, { quantity: number; value: number }>()
  for (const row of (data ?? []) as any[]) {
    const catName = row.products?.categories?.name ?? '未分类'
    const entry = map.get(catName) ?? { quantity: 0, value: 0 }
    entry.quantity += row.quantity
    entry.value += lotValueMap.get(row.product_id) ?? (row.quantity * 0)
    map.set(catName, entry)
  }

  const result = Array.from(map.entries()).map(([name, vals]) => ({
    category_name: name,
    quantity: vals.quantity,
    stock_value: vals.value
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

// ====== Hot Products (Top 10 by quantity and revenue) ======
export async function fetchHotProducts(params?: {
  date_from?: string
  date_to?: string
}): Promise<ApiResult<{
  by_quantity: Array<{ product_name: string; total_quantity: number; specification: string | null }>
  by_revenue: Array<{ product_name: string; total_amount: number; specification: string | null }>
}>> {
  let query = supabase
    .from('sales_order_items')
    .select('quantity, line_total, products!inner(name, specification), sales_orders!inner(created_at, status)')
    .eq('sales_orders.status', 'completed')

  if (params?.date_from) query = query.gte('sales_orders.created_at', params.date_from)
  if (params?.date_to) query = query.lte('sales_orders.created_at', params.date_to)

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  // Aggregate by product
  const agg = new Map<number, { name: string; spec: string | null; qty: number; revenue: number }>()
  for (const row of (data ?? []) as any[]) {
    const pid = row.products?.name ?? 'unknown'
    const key = pid
    const entry = agg.get(key as any) ?? { name: pid, spec: row.products?.specification ?? null, qty: 0, revenue: 0 }
    entry.qty += Number(row.quantity)
    entry.revenue += Number(row.line_total)
    agg.set(key as any, entry)
  }

  const all = Array.from(agg.values())

  const byQuantity = all
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .map(p => ({ product_name: p.name, total_quantity: p.qty, specification: p.spec }))

  const byRevenue = all
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => ({ product_name: p.name, total_amount: p.revenue, specification: p.spec }))

  return { data: { by_quantity: byQuantity, by_revenue: byRevenue }, error: null }
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
  // Get products with stock
  const { data: stocks } = await supabase
    .from('stocks')
    .select('product_id, quantity, products!inner(name, specification, is_active)')
    .gt('quantity', 0)

  const productsWithStock = ((stocks ?? []) as any[])
    .filter(s => s.products?.is_active)
    .map(s => ({
      product_id: s.product_id,
      product_name: s.products?.name ?? '',
      specification: s.products?.specification ?? null,
      stock_quantity: s.quantity,
    }))

  if (productsWithStock.length === 0) return { data: [], count: 0, error: null }

  // Get last sale date per product
  const productIds = productsWithStock.map(p => p.product_id)
  const { data: lastSales } = await supabase
    .from('stock_transactions')
    .select('product_id, created_at')
    .in('product_id', productIds)
    .eq('type', 'sale_out')
    .order('created_at', { ascending: false })

  const lastSaleMap = new Map<number, string>()
  for (const tx of (lastSales ?? []) as any[]) {
    if (!lastSaleMap.has(tx.product_id)) {
      lastSaleMap.set(tx.product_id, tx.created_at)
    }
  }

  const now = Date.now()
  const result: SlowProduct[] = productsWithStock
    .map(p => {
      const lastSale = lastSaleMap.get(p.product_id)
      const daysIdle = lastSale
        ? Math.floor((now - new Date(lastSale).getTime()) / 86400000)
        : 999
      return { ...p, days_idle: daysIdle }
    })
    .filter(p => p.days_idle >= 60)
    .sort((a, b) => b.days_idle - a.days_idle)
    .slice(0, 10)

  return { data: result, count: result.length, error: null }
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
