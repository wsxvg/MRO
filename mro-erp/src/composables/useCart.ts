/**
 * 购物车逻辑 composable
 *
 * 管理购物车商品的增删改查、金额计算和利润率展示。
 */
import { reactive, computed } from 'vue'

export interface CartItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  cost_price: number
  line_total: number
}

export function useCart() {
  const items = reactive<CartItem[]>([])

  const total = computed(() => items.reduce((s, i) => s + (i.line_total || 0), 0))

  const itemCount = computed(() => items.reduce((s, i) => s + (i.quantity || 0), 0))

  function calcLine(idx: number) {
    items[idx].line_total = (items[idx].quantity || 0) * (items[idx].unit_price || 0)
  }

  function addProduct(product: {
    id: number
    name: string
    reference_price?: number
    cost_price?: number
  }, customerPrice?: number) {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      existing.quantity++
      calcLine(items.indexOf(existing))
    } else {
      const price = customerPrice ?? product.reference_price ?? 0
      items.push({
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: price,
        cost_price: product.cost_price || 0,
        line_total: price,
      })
    }
  }

  function increment(idx: number) {
    items[idx].quantity++
    calcLine(idx)
  }

  function decrement(idx: number) {
    if (items[idx].quantity <= 1) {
      items.splice(idx, 1)
    } else {
      items[idx].quantity--
      calcLine(idx)
    }
  }

  function removeItem(idx: number) {
    items.splice(idx, 1)
  }

  function clearCart() {
    items.splice(0, items.length)
  }

  function marginColor(item: { unit_price: number; cost_price: number }): string {
    if (item.cost_price <= 0) return 'bg-gray-300'
    if (item.unit_price <= 0 || item.unit_price < item.cost_price) return 'bg-gray-900'
    const margin = (item.unit_price - item.cost_price) / item.unit_price
    if (margin >= 0.3) return 'bg-green-500'
    if (margin >= 0.1) return 'bg-amber-400'
    return 'bg-red-500'
  }

  function marginTip(item: { unit_price: number; cost_price: number; product_name: string }): string {
    if (item.cost_price <= 0) return '未知进价'
    if (item.unit_price <= 0) return '无售价！'
    if (item.unit_price < item.cost_price) return '低于进价！'
    const margin = ((item.unit_price - item.cost_price) / item.unit_price * 100).toFixed(0)
    return `毛利 ${margin}%`
  }

  return {
    items,
    total,
    itemCount,
    calcLine,
    addProduct,
    increment,
    decrement,
    removeItem,
    clearCart,
    marginColor,
    marginTip,
  }
}
