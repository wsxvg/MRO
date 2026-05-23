// ====== MRO ERP Type Definitions ======

// --- Common Types ---
export type OrderStatus = 'draft' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'transfer' | 'wechat' | 'alipay' | 'other'
export type StockTransactionType = 'stock_in' | 'stock_out' | 'sale_out' | 'sale_return' | 'transfer_in' | 'transfer_out' | 'adjustment'

export interface Timestamps {
  created_at: string
  updated_at: string
}

// --- Units ---
export interface Unit {
  id: number
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

// --- Categories ---
export interface Category {
  id: number
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

// --- Warehouses ---
export interface Warehouse {
  id: number
  name: string
  location: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

// --- Products ---
export interface Product {
  id: number
  category_id: number | null
  name: string
  sku: string | null
  barcode: string | null
  specification: string | null
  unit: string
  reference_price: number
  cost_price: number
  min_stock: number
  is_active: boolean
  remark: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category_name?: string
  stock_quantity?: number
}

// --- Customers ---
export interface Customer {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  address: string | null
  credit_limit: number
  remark: string | null
  created_at: string
  updated_at: string
}

// --- Customer Prices ---
export interface CustomerPrice {
  customer_id: number
  product_id: number
  price: number
  // Joined fields
  product_name?: string
  product_sku?: string
  reference_price?: number
}

// --- Stocks ---
export interface Stock {
  id: number
  warehouse_id: number
  product_id: number
  quantity: number
  created_at: string
  updated_at: string
  // Joined fields
  product_name?: string
  product_sku?: string
  product_specification?: string
  warehouse_name?: string
  min_stock?: number
}

// --- Stock Transactions ---
export interface StockTransaction {
  id: number
  warehouse_id: number
  product_id: number
  type: StockTransactionType
  quantity: number
  unit_cost: number | null
  ref_type: string | null
  ref_id: number | null
  remark: string | null
  created_at: string
  // Joined fields
  product_name?: string
  warehouse_name?: string
}

// --- Sales Orders ---
export interface SalesOrder {
  id: number
  order_no: string
  customer_id: number
  warehouse_id: number
  status: OrderStatus
  total_amount: number
  paid_amount: number
  remark: string | null
  created_at: string
  updated_at: string
  // Joined fields
  customer_name?: string
  warehouse_name?: string
  items?: SalesOrderItem[]
  payments?: PaymentRecord[]
}

export interface SalesOrderItem {
  id: number
  sales_order_id: number
  product_id: number
  quantity: number
  unit_price: number
  cost_price: number
  line_total: number
  // Joined fields
  product_name?: string
  product_sku?: string
  product_specification?: string
}

// --- Payment Records ---
export interface PaymentRecord {
  id: number
  sales_order_id: number
  amount: number
  payment_method: PaymentMethod
  paid_at: string
  remark: string | null
  created_at: string
}

// --- Sales Returns ---
export interface SalesReturnOrder {
  id: number
  order_no: string
  customer_id: number
  warehouse_id: number
  status: OrderStatus
  total_amount: number
  remark: string | null
  created_at: string
  updated_at: string
  // Joined fields
  customer_name?: string
  warehouse_name?: string
  items?: SalesReturnItem[]
}

export interface SalesReturnItem {
  id: number
  return_order_id: number
  product_id: number
  quantity: number
  unit_price: number
  line_total: number
  // Joined fields
  product_name?: string
}

// --- Stock Transfers (V2) ---
export interface StockTransfer {
  id: number
  order_no: string
  from_warehouse_id: number
  to_warehouse_id: number
  status: OrderStatus
  remark: string | null
  created_at: string
  updated_at: string
}

export interface StockTransferItem {
  id: number
  transfer_id: number
  product_id: number
  quantity: number
}

// --- API Types ---
export interface ListResponse<T> {
  data: T[]
  count: number
  error: string | null
}

export interface ApiResult<T> {
  data: T | null
  error: string | null
}

// --- Database Schema Map for Supabase ---
export interface Database {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Category, 'id'>> }
      warehouses: { Row: Warehouse; Insert: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Warehouse, 'id'>> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Product, 'id'>> }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Customer, 'id'>> }
      customer_prices: { Row: CustomerPrice; Insert: CustomerPrice; Update: Partial<CustomerPrice> }
      stocks: { Row: Stock; Insert: Omit<Stock, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Stock, 'id'>> }
      stock_transactions: { Row: StockTransaction; Insert: Omit<StockTransaction, 'id' | 'created_at'>; Update: Partial<Omit<StockTransaction, 'id'>> }
      sales_orders: { Row: SalesOrder; Insert: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesOrder, 'id'>> }
      sales_order_items: { Row: SalesOrderItem; Insert: Omit<SalesOrderItem, 'id' | 'line_total'>; Update: Partial<Omit<SalesOrderItem, 'id'>> }
      payment_records: { Row: PaymentRecord; Insert: Omit<PaymentRecord, 'id' | 'created_at'>; Update: Partial<Omit<PaymentRecord, 'id'>> }
      sales_return_orders: { Row: SalesReturnOrder; Insert: Omit<SalesReturnOrder, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesReturnOrder, 'id'>> }
      sales_return_items: { Row: SalesReturnItem; Insert: Omit<SalesReturnItem, 'id' | 'line_total'>; Update: Partial<Omit<SalesReturnItem, 'id'>> }
    }
    Functions: {
      complete_sales_order: { Args: { p_order_id: number }; Returns: void }
      complete_sales_return: { Args: { p_return_id: number }; Returns: void }
    }
  }
}
