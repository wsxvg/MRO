import { supabase } from '@/lib/supabase'
export * from './products'
export * from './customers'
export * from './warehouses'
export * from './orders'
export * from './stockTransactions'
export * from './reports'
export * from './units'

// Re-import for wrapper objects
import {
  fetchProducts, fetchProduct, createProduct, updateProduct, deleteProduct,
  fetchCategories, createCategory, updateCategory, deleteCategory
} from './products'
import { fetchCustomers, fetchCustomer, createCustomer, updateCustomer, deleteCustomer } from './customers'
import { createStockIn } from './stockTransactions'
import { fetchWarehouses, fetchWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from './warehouses'
import { fetchUnits, createUnit, updateUnit, deleteUnit } from './units'

// ====== productsApi wrapper ======
export const productsApi = {
  getAll: fetchProducts,
  getById: fetchProduct,
  create: createProduct,
  update: updateProduct,
  delete: deleteProduct,
  async import(items: Array<{ sku: string; name: string; category: string; unit: string; selling_price: string }>): Promise<{ success: boolean; error?: string }> {
    try {
      for (const item of items) {
        const { error } = await supabase.from('products').insert({
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          selling_price: parseFloat(item.selling_price) || 0,
        } as never)
        if (error) return { success: false, error: error.message }
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message ?? '导入失败' }
    }
  }
}

// ====== categoriesApi wrapper ======
export const categoriesApi = {
  getAll: fetchCategories,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
}

// ====== warehousesApi wrapper ======
export const warehousesApi = {
  getAll: fetchWarehouses,
  getById: fetchWarehouse,
  create: createWarehouse,
  update: updateWarehouse,
  delete: deleteWarehouse,
}

// ====== unitsApi wrapper ======
export const unitsApi = {
  getAll: fetchUnits,
  create: createUnit,
  update: updateUnit,
  delete: deleteUnit,
}

// ====== customersApi wrapper ======
export const customersApi = {
  getAll: fetchCustomers,
  getById: fetchCustomer,
  create: createCustomer,
  update: updateCustomer,
  delete: deleteCustomer,
}
