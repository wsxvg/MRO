import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCustomers } from '@/api/customers'
import { fetchProducts } from '@/api/products'
import { fetchCategories } from '@/api/products'
import { fetchWarehouses } from '@/api/warehouses'
import type { Customer, Product, Category, Warehouse } from '@/types'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function isFresh(entry: CacheEntry<unknown> | null, ttlMs: number): boolean {
  return !!entry && Date.now() - entry.timestamp < ttlMs
}

export const useCommonStore = defineStore('common', () => {
  // Cache TTLs
  const CUSTOMER_TTL = 5 * 60 * 1000   // 5 min
  const PRODUCT_TTL = 5 * 60 * 1000    // 5 min
  const CATEGORY_TTL = 30 * 60 * 1000  // 30 min
  const WAREHOUSE_TTL = 30 * 60 * 1000 // 30 min

  // Cached data
  const customers = ref<CacheEntry<Customer[]> | null>(null)
  const products = ref<CacheEntry<Product[]> | null>(null)
  const categories = ref<CacheEntry<Category[]> | null>(null)
  const warehouses = ref<CacheEntry<Warehouse[]> | null>(null)

  // Loading states
  const loadingCustomers = ref(false)
  const loadingProducts = ref(false)

  async function getCustomers(force = false): Promise<Customer[]> {
    if (!force && isFresh(customers.value, CUSTOMER_TTL)) {
      return customers.value!.data
    }
    loadingCustomers.value = true
    try {
      const res = await fetchCustomers({ limit: 2000 })
      const data = res.data ?? []
      customers.value = { data, timestamp: Date.now() }
      return data
    } finally {
      loadingCustomers.value = false
    }
  }

  async function getProducts(force = false): Promise<Product[]> {
    if (!force && isFresh(products.value, PRODUCT_TTL)) {
      return products.value!.data
    }
    loadingProducts.value = true
    try {
      const res = await fetchProducts({ limit: 5000 })
      const data = res.data ?? []
      products.value = { data, timestamp: Date.now() }
      return data
    } finally {
      loadingProducts.value = false
    }
  }

  async function getCategories(force = false): Promise<Category[]> {
    if (!force && isFresh(categories.value, CATEGORY_TTL)) {
      return categories.value!.data
    }
    const res = await fetchCategories()
    const data = res.data ?? []
    categories.value = { data, timestamp: Date.now() }
    return data
  }

  async function getWarehouses(force = false): Promise<Warehouse[]> {
    if (!force && isFresh(warehouses.value, WAREHOUSE_TTL)) {
      return warehouses.value!.data
    }
    const res = await fetchWarehouses()
    const data = res.data ?? []
    warehouses.value = { data, timestamp: Date.now() }
    return data
  }

  /** Invalidate specific cache after mutations */
  function invalidate(what: 'customers' | 'products' | 'categories' | 'warehouses' | 'all') {
    if (what === 'all' || what === 'customers') customers.value = null
    if (what === 'all' || what === 'products') products.value = null
    if (what === 'all' || what === 'categories') categories.value = null
    if (what === 'all' || what === 'warehouses') warehouses.value = null
  }

  return {
    customers, products, categories, warehouses,
    loadingCustomers, loadingProducts,
    getCustomers, getProducts, getCategories, getWarehouses,
    invalidate,
  }
})
