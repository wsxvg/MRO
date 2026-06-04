// ====== MRO ERP Type Definitions ======

// --- Common Types ---
export type OrderStatus = 'draft' | 'pending' | 'completed' | 'cancelled' | 'returned'
export type PaymentMethod = 'cash' | 'transfer' | 'wechat' | 'alipay' | 'other'
export type StockTransactionType = 'stock_in' | 'stock_out' | 'sale_out' | 'sale_return' | 'transfer_in' | 'transfer_out' | 'adjustment'

// --- Suppliers ---
export interface Supplier {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  address: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

// --- Stock Lots (批次) ---
export interface StockLot {
  id: number
  warehouse_id: number
  product_id: number
  supplier_id: number | null
  quantity: number
  unit_cost: number
  is_estimated: boolean
  stock_in_date: string
  remark: string | null
  created_at: string
  updated_at: string
  // Joined fields
  product_name?: string
  warehouse_name?: string
  supplier_name?: string
}

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
  is_default: boolean
  created_at: string
  updated_at: string
}

// --- Products ---
export interface Product {
  id: number
  category_id: number | null
  name: string
  specification: string | null
  unit: string
  reference_price: number
  cost_price: number
  cost_price_auto: boolean
  min_stock: number
  safety_stock_manual: boolean
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
  type: string
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
  lot_id: number | null
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
  customer_id: number | null
  warehouse_id: number
  status: OrderStatus
  needs_delivery: boolean
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
  product_specification?: string
}

// --- Payment Records ---
export interface PaymentRecord {
  id: number
  sales_order_id: number
  return_order_id?: number | null
  amount: number
  payment_method: PaymentMethod
  type: 'payment' | 'refund'
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
  sales_order_id?: number | null
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
      units: { Row: Unit; Insert: Omit<Unit, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Unit, 'id'>>; Relationships: [] }
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Category, 'id'>>; Relationships: [] }
      warehouses: { Row: Warehouse; Insert: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Warehouse, 'id'>>; Relationships: [] }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Product, 'id'>>; Relationships: [] }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>; Relationships: [] }
      customer_prices: { Row: CustomerPrice; Insert: CustomerPrice; Update: Partial<CustomerPrice>; Relationships: [] }
      stocks: { Row: Stock; Insert: Omit<Stock, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Stock, 'id'>>; Relationships: [] }
      stock_transactions: { Row: StockTransaction; Insert: Omit<StockTransaction, 'id' | 'created_at'>; Update: Partial<Omit<StockTransaction, 'id'>>; Relationships: [] }
      suppliers: { Row: Supplier; Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Supplier, 'id'>>; Relationships: [] }
      stock_lots: { Row: StockLot; Insert: Omit<StockLot, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<StockLot, 'id'>>; Relationships: [] }
      stock_transfers: { Row: StockTransfer; Insert: Omit<StockTransfer, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<StockTransfer, 'id'>>; Relationships: [] }
      stock_transfer_items: { Row: StockTransferItem; Insert: Omit<StockTransferItem, 'id'>; Update: Partial<Omit<StockTransferItem, 'id'>>; Relationships: [] }
      sales_orders: { Row: SalesOrder; Insert: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesOrder, 'id'>>; Relationships: [] }
      sales_order_items: { Row: SalesOrderItem; Insert: Omit<SalesOrderItem, 'id' | 'line_total'>; Update: Partial<Omit<SalesOrderItem, 'id'>>; Relationships: [] }
      payment_records: { Row: PaymentRecord; Insert: Omit<PaymentRecord, 'id' | 'created_at'>; Update: Partial<Omit<PaymentRecord, 'id'>>; Relationships: [] }
      sales_return_orders: { Row: SalesReturnOrder; Insert: Omit<SalesReturnOrder, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesReturnOrder, 'id'>>; Relationships: [] }
      sales_return_items: { Row: SalesReturnItem; Insert: Omit<SalesReturnItem, 'id' | 'line_total'>; Update: Partial<Omit<SalesReturnItem, 'id'>>; Relationships: [] }
    }
    Views: {}
    Functions: {
      complete_sales_order: { Args: { p_order_id: number }; Returns: void }
      complete_sales_return: { Args: { p_return_id: number }; Returns: void }
      get_monthly_sales_trend: { Args: { p_start_date: string }; Returns: { month: string; sales_amount: number; sales_count: number }[] }
      get_stock_transactions_by_date: { Args: { p_date_from?: string; p_date_to?: string; p_warehouse_id?: number; p_product_id?: number; p_type?: string }; Returns: { date: string; type: string; total_quantity: number; transaction_count: number }[] }
      stock_in_with_lot: { Args: { p_product_id: number; p_warehouse_id: number; p_quantity: number; p_unit_cost?: number; p_is_estimated?: boolean; p_supplier_id?: number; p_remark?: string }; Returns: number }
      update_lot_cost: { Args: { p_lot_id: number; p_new_cost: number }; Returns: void }
      recalc_product_cost: { Args: { p_product_id: number }; Returns: void }
    }
  }
}
