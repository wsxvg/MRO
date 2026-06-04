import type { SalesOrder, SalesOrderItem, SalesReturnOrder, SalesReturnItem } from '@/types'

interface StatementData {
  customer_name: string
  date_from: string
  date_to: string
  orders: Array<{
    order_no: string
    date: string
    items: Array<{
      product_name: string
      specification: string | null
      unit: string
      quantity: number
      unit_price: number
      line_total: number
    }>
    total: number
  }>
  returns: Array<{
    order_no: string
    date: string
    items: Array<{
      product_name: string
      specification: string | null
      unit: string
      quantity: number
      unit_price: number
      line_total: number
    }>
    total: number
  }>
  orders_total: number
  returns_total: number
  final_amount: number
}

export async function fetchStatementData(
  customerId: number,
  dateFrom: string,
  dateTo: string
): Promise<{ data: StatementData | null; error: string | null }> {
  const { supabase } = await import('@/lib/supabase')

  // Fetch customer name
  const { data: customer } = await supabase
    .from('customers')
    .select('name')
    .eq('id', customerId)
    .single()

  // Fetch completed orders in date range
  const { data: orders } = await supabase
    .from('sales_orders')
    .select('id, order_no, created_at, total_amount')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo + 'T23:59:59')
    .order('created_at', { ascending: true })

  // Fetch order items for each order
  const orderDetails: StatementData['orders'] = []
  for (const order of (orders ?? []) as any[]) {
    const { data: items } = await supabase
      .from('sales_order_items')
      .select('quantity, unit_price, line_total, products(name, specification, unit)')
      .eq('sales_order_id', order.id)

    orderDetails.push({
      order_no: order.order_no,
      date: order.created_at.slice(0, 10),
      items: (items ?? []).map((i: any) => ({
        product_name: i.products?.name ?? '',
        specification: i.products?.specification ?? null,
        unit: i.products?.unit ?? '个',
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      })),
      total: order.total_amount,
    })
  }

  // Fetch returned orders in date range
  const { data: returns } = await supabase
    .from('sales_return_orders')
    .select('id, order_no, created_at, total_amount')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo + 'T23:59:59')
    .order('created_at', { ascending: true })

  const returnDetails: StatementData['returns'] = []
  for (const ret of (returns ?? []) as any[]) {
    const { data: items } = await supabase
      .from('sales_return_items')
      .select('quantity, unit_price, line_total, products(name, specification, unit)')
      .eq('return_order_id', ret.id)

    returnDetails.push({
      order_no: ret.order_no,
      date: ret.created_at.slice(0, 10),
      items: (items ?? []).map((i: any) => ({
        product_name: i.products?.name ?? '',
        specification: i.products?.specification ?? null,
        unit: i.products?.unit ?? '个',
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      })),
      total: ret.total_amount,
    })
  }

  const ordersTotal = orderDetails.reduce((sum, o) => sum + o.total, 0)
  const returnsTotal = returnDetails.reduce((sum, r) => sum + r.total, 0)

  return {
    data: {
      customer_name: (customer as any)?.name ?? '未知客户',
      date_from: dateFrom,
      date_to: dateTo,
      orders: orderDetails,
      returns: returnDetails,
      orders_total: ordersTotal,
      returns_total: returnsTotal,
      final_amount: ordersTotal - returnsTotal,
    },
    error: null,
  }
}

export async function exportStatementExcel(data: StatementData): Promise<void> {
  const XLSX = await import('xlsx-js-style')

  const rows: any[][] = []
  let rowNum = 0

  // Title
  rows.push([]) // Row 0: empty
  rows.push([null, `${data.customer_name} 对账明细表`]) // Row 1: title
  rowNum = 2

  // Period
  rows.push([null, `对账期间：${data.date_from} 至 ${data.date_to}`])
  rowNum = 3

  // Empty row
  rows.push([])
  rowNum = 4

  // Header
  rows.push([null, '序号', '日期', '商品名称', '规格型号', '单位', '数量', '单价(元)', '金额(元)'])
  rowNum = 5

  // Order details
  let seq = 1
  for (const order of data.orders) {
    for (const item of order.items) {
      rows.push([
        null,
        seq++,
        order.date,
        item.product_name,
        item.specification || '',
        item.unit,
        item.quantity,
        item.unit_price,
        item.line_total,
      ])
    }
    // Subtotal row
    rows.push([null, null, null, null, null, null, null, `小计:`, order.total])
  }

  // Grand total
  rows.push([null, null, null, null, null, null, null, '合计:', data.orders_total])

  // Returns section
  if (data.returns.length > 0) {
    rows.push([])
    rows.push([null, '退货明细'])
    rows.push([null, '序号', '日期', '商品名称', '规格型号', '单位', '数量', '单价(元)', '金额(元)'])

    let retSeq = 1
    for (const ret of data.returns) {
      for (const item of ret.items) {
        rows.push([
          null,
          retSeq++,
          ret.date,
          item.product_name,
          item.specification || '',
          item.unit,
          item.quantity,
          item.unit_price,
          item.line_total,
        ])
      }
    }
    rows.push([null, null, null, null, null, null, null, '退货合计:', data.returns_total])
    rows.push([null, null, null, null, null, null, null, '实付金额:', data.final_amount])
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 3 },  // A: spacer
    { wch: 6 },  // B: seq
    { wch: 12 }, // C: date
    { wch: 20 }, // D: product name
    { wch: 18 }, // E: spec
    { wch: 6 },  // F: unit
    { wch: 8 },  // G: quantity
    { wch: 10 }, // H: price
    { wch: 12 }, // I: amount
  ]

  // Apply styles
  const headerStyle = {
    fill: { fgColor: { rgb: '1F4E79' } },
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
      left: { style: 'thin', color: { rgb: 'D0D0D0' } },
      right: { style: 'thin', color: { rgb: 'D0D0D0' } },
    },
  }

  const dataStyle = {
    font: { sz: 10 },
    border: {
      top: { style: 'thin', color: { rgb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
      left: { style: 'thin', color: { rgb: 'D0D0D0' } },
      right: { style: 'thin', color: { rgb: 'D0D0D0' } },
    },
  }

  const subtotalStyle = {
    fill: { fgColor: { rgb: 'FFF3E0' } },
    font: { bold: true, color: { rgb: 'C00000' }, sz: 11 },
    alignment: { horizontal: 'center' },
  }

  // Apply header style to header rows
  for (const cell of ['B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5']) {
    if (ws[cell]) ws[cell].s = headerStyle
  }

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '对账明细')

  // Export
  const fileName = `${data.customer_name}_对账_${data.date_from}_${data.date_to}.xlsx`
  XLSX.writeFile(wb, fileName)
}
