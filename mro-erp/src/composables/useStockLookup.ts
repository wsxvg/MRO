/**
 * 库存查询 composable
 *
 * 管理商品的各仓库库存查询和悬停展示。
 */
import { ref, reactive } from 'vue'
import { fetchStockByProduct } from '@/api'

export interface StockEntry {
  warehouse_id: number
  warehouse_name: string
  quantity: number
}

export function useStockLookup() {
  const hoveredProductId = ref<number | null>(null)
  const productStocks = reactive<Record<number, StockEntry[]>>({})

  async function showStock(productId: number) {
    hoveredProductId.value = productId
    if (productStocks[productId]) return
    const res = await fetchStockByProduct(productId)
    const stocks: StockEntry[] = (res.data ?? []).map((s: any) => ({
      warehouse_id: s.warehouse_id,
      warehouse_name: s.warehouse_name,
      quantity: s.quantity,
    }))
    productStocks[productId] = stocks
  }

  function clearStockCache() {
    Object.keys(productStocks).forEach(k => delete productStocks[Number(k)])
  }

  function hideStock() {
    hoveredProductId.value = null
  }

  return {
    hoveredProductId,
    productStocks,
    showStock,
    clearStockCache,
    hideStock,
  }
}
