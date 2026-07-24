/**
 * 高亮文本中的搜索关键词，返回带 <mark> 标签的 HTML
 */
export function highlightText(text: string | null | undefined, query: string): string {
  if (!query || !text) return text ?? ''
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-yellow-200 rounded px-0.5 text-inherit">$1</mark>')
}

/** 毛利 = 销售额 - 成本金额（可为负，亏本） */
export function calcGrossProfit(totalAmount: number, costAmount: number): number {
  return Number(totalAmount) - Number(costAmount)
}

/** 毛利率 = 毛利 / 销售额 * 100，保留 1 位小数；销售额为 0 时返回 '0.0' */
export function calcMarginRate(totalAmount: number, grossProfit: number): string {
  const t = Number(totalAmount)
  return t > 0 ? ((grossProfit / t) * 100).toFixed(1) : '0.0'
}

/** 对账实付金额 = 应收合计 - 退货合计 */
export function computeStatementFinal(ordersTotal: number, returnsTotal: number): number {
  return Number(ordersTotal) - Number(returnsTotal)
}
