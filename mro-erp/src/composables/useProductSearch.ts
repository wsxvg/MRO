/**
 * 商品搜索与分类筛选 composable
 *
 * 管理商品列表、分类标签、搜索过滤和热门商品推荐。
 */
import { ref } from 'vue'
import { useDebounceFn } from '@/composables/useDebounce'
import { fetchProducts } from '@/api'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/types'

export function useProductSearch() {
  const toast = useToast()
  const displayProducts = ref<Product[]>([])
  const frequentProducts = ref<Product[]>([])
  const searchQuery = ref('')
  const selectedCategoryId = ref<number | null>(null)
  const productsLoading = ref(false)

  async function loadProducts(opts?: { search?: string; category_id?: number; limit?: number }) {
    productsLoading.value = true
    try {
      const params: Record<string, any> = { limit: opts?.limit ?? 30 }
      if (opts?.search) params.search = opts.search
      if (opts?.category_id) params.category_id = opts.category_id
      const res = await fetchProducts(params)
      displayProducts.value = res.data ?? []
    } catch (e) {
      toast.error('加载商品失败')
    } finally {
      productsLoading.value = false
    }
  }

  function selectCategory(categoryId: number | null) {
    selectedCategoryId.value = categoryId
    searchQuery.value = ''
    loadProducts({ category_id: categoryId ?? undefined })
  }

  function doSearch() {
    const q = searchQuery.value.trim()
    if (!q) {
      selectedCategoryId.value = null
      loadProducts()
      return
    }
    selectedCategoryId.value = null
    loadProducts({ search: q, limit: 50 })
  }

  const debouncedSearch = useDebounceFn(() => doSearch(), 300)

  return {
    displayProducts,
    frequentProducts,
    searchQuery,
    selectedCategoryId,
    productsLoading,
    loadProducts,
    selectCategory,
    doSearch,
    debouncedSearch,
  }
}
