/**
 * 客户专属定价 composable
 *
 * 管理客户价格映射、原价缓存，以及在切换客户时自动更新购物车价格。
 */
import { ref } from 'vue'
import { fetchCustomerPrices } from '@/api'
import { useToast } from '@/composables/useToast'
import type { CartItem } from '@/composables/useCart'

export function useCustomerPricing(
  items: CartItem[],
  calcLine: (idx: number) => void
) {
  const toast = useToast()
  const customerPricesMap = new Map<number, number>()
  const productPricesCache = new Map<number, number>()
  let customerChangeVersion = 0

  /** 缓存商品原价（首次加载时调用） */
  function cacheProductPrices(products: Array<{ id: number; reference_price?: number }>) {
    for (const p of products) {
      productPricesCache.set(p.id, p.reference_price || 0)
    }
  }

  /** 获取某商品的售价（优先客户专属价） */
  function getPriceForProduct(productId: number, fallbackPrice?: number): number {
    return customerPricesMap.get(productId) ?? fallbackPrice ?? 0
  }

  /** 客户切换时更新价格 */
  async function onCustomerChange(customerId: string | number | null) {
    customerPricesMap.clear()
    const version = ++customerChangeVersion

    if (!customerId) {
      // 切回零售：恢复原价
      for (const item of items) {
        const defaultPrice = productPricesCache.get(item.product_id) ?? 0
        item.unit_price = defaultPrice
        calcLine(items.indexOf(item))
      }
      return
    }

    try {
      const { data } = await fetchCustomerPrices(Number(customerId))
      if (version !== customerChangeVersion) return // 过期响应，丢弃
      if (data) {
        for (const cp of data) {
          customerPricesMap.set(cp.product_id, cp.price)
        }
      }
      // 更新购物车每项的价格
      for (const item of items) {
        const cp = customerPricesMap.get(item.product_id)
        if (cp !== undefined) {
          item.unit_price = cp
        } else {
          item.unit_price = productPricesCache.get(item.product_id) ?? 0
        }
        calcLine(items.indexOf(item))
      }
    } catch (e) {
      toast.error('加载客户价格失败')
    }
  }

  /** 重置所有价格到原价 */
  function resetPrices() {
    customerPricesMap.clear()
    for (const item of items) {
      item.unit_price = productPricesCache.get(item.product_id) ?? 0
      calcLine(items.indexOf(item))
    }
  }

  return {
    customerPricesMap,
    productPricesCache,
    cacheProductPrices,
    getPriceForProduct,
    onCustomerChange,
    resetPrices,
  }
}
