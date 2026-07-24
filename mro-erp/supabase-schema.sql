-- ============================================================
-- 本文件由 live Supabase 库自动重建 (project: gzvymxcojrljkprkgoap)
-- 生成时间: 2026-07-24
-- 内容: 表结构 + 约束 (PRIMARY KEY / UNIQUE / FOREIGN KEY / CHECK)
-- 注意: 触发器、RLS 策略、RPC 函数定义在 supabase/migration*.sql 中，本文件不包含。
-- ============================================================

CREATE TABLE IF NOT EXISTS app_config (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS categories (
  id bigint DEFAULT nextval('categories_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS customer_prices (
  customer_id bigint NOT NULL,
  product_id bigint NOT NULL,
  price numeric(12,2) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  PRIMARY KEY (customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id bigint DEFAULT nextval('customers_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  address text,
  credit_limit numeric(12,2) DEFAULT 0,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  type text DEFAULT 'retail'::text NOT NULL,
  CHECK ((type = ANY (ARRAY['retail'::text, 'wholesale'::text]))),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS payment_records (
  id bigint DEFAULT nextval('payment_records_id_seq'::regclass) NOT NULL,
  sales_order_id bigint NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  paid_at timestamptz DEFAULT now(),
  remark text,
  created_at timestamptz DEFAULT now(),
  type text DEFAULT 'payment'::text,
  return_order_id bigint,
  CHECK ((payment_method = ANY (ARRAY['cash'::text, 'transfer'::text, 'wechat'::text, 'alipay'::text, 'other'::text]))),
  CHECK ((type = ANY (ARRAY['payment'::text, 'refund'::text]))),
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
  FOREIGN KEY (return_order_id) REFERENCES sales_return_orders(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS products (
  id bigint DEFAULT nextval('products_id_seq'::regclass) NOT NULL,
  category_id bigint,
  name text NOT NULL,
  barcode text,
  specification text,
  unit text DEFAULT '个'::text,
  reference_price numeric(12,2) DEFAULT 0,
  cost_price numeric(12,2) DEFAULT 0,
  min_stock numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cost_price_auto boolean DEFAULT false,
  safety_stock_manual boolean DEFAULT false,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id bigint DEFAULT nextval('purchase_order_items_id_seq'::regclass) NOT NULL,
  purchase_order_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity numeric(12,2) NOT NULL,
  selling_price numeric(12,2) DEFAULT 0,
  unit_cost numeric(12,2) DEFAULT 0,
  is_estimated boolean DEFAULT true,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id bigint DEFAULT nextval('purchase_orders_id_seq'::regclass) NOT NULL,
  supplier_id bigint,
  warehouse_id bigint NOT NULL,
  status text DEFAULT 'pending'::text,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text]))),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id bigint DEFAULT nextval('sales_order_items_id_seq'::regclass) NOT NULL,
  sales_order_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  cost_price numeric(12,2) DEFAULT 0,
  line_total numeric(12,2) GENERATED ALWAYS AS ((quantity * unit_price)) STORED,
  warehouse_id bigint,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id bigint DEFAULT nextval('sales_orders_id_seq'::regclass) NOT NULL,
  order_no text NOT NULL,
  customer_id bigint,
  warehouse_id bigint NOT NULL,
  status text DEFAULT 'draft'::text,
  total_amount numeric(12,2) DEFAULT 0,
  paid_amount numeric(12,2) DEFAULT 0,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  needs_delivery boolean DEFAULT false,
  CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'completed'::text, 'cancelled'::text, 'returned'::text]))),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  PRIMARY KEY (id),
  UNIQUE (order_no)
);

CREATE TABLE IF NOT EXISTS sales_return_items (
  id bigint DEFAULT nextval('sales_return_items_id_seq'::regclass) NOT NULL,
  return_order_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity numeric(12,2) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  line_total numeric(12,2) GENERATED ALWAYS AS ((quantity * unit_price)) STORED,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (return_order_id) REFERENCES sales_return_orders(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sales_return_orders (
  id bigint DEFAULT nextval('sales_return_orders_id_seq'::regclass) NOT NULL,
  order_no text NOT NULL,
  customer_id bigint,
  warehouse_id bigint NOT NULL,
  status text DEFAULT 'draft'::text,
  total_amount numeric(12,2) DEFAULT 0,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sales_order_id bigint,
  CHECK ((status = ANY (ARRAY['draft'::text, 'completed'::text, 'cancelled'::text]))),
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  PRIMARY KEY (id),
  UNIQUE (order_no)
);

CREATE TABLE IF NOT EXISTS stock_lots (
  id bigint DEFAULT nextval('stock_lots_id_seq'::regclass) NOT NULL,
  warehouse_id bigint NOT NULL,
  product_id bigint NOT NULL,
  supplier_id bigint,
  quantity numeric(12,2) DEFAULT 0 NOT NULL,
  unit_cost numeric(12,2) DEFAULT 0 NOT NULL,
  is_estimated boolean DEFAULT false,
  stock_in_date timestamptz DEFAULT now(),
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id bigint DEFAULT nextval('stock_transactions_id_seq'::regclass) NOT NULL,
  warehouse_id bigint NOT NULL,
  product_id bigint NOT NULL,
  type text NOT NULL,
  quantity numeric(12,2) NOT NULL,
  unit_cost numeric(12,2),
  ref_type text,
  ref_id bigint,
  remark text,
  created_at timestamptz DEFAULT now(),
  lot_id bigint,
  CHECK ((type = ANY (ARRAY['stock_in'::text, 'stock_out'::text, 'sale_out'::text, 'sale_return'::text, 'transfer_in'::text, 'transfer_out'::text, 'adjustment'::text]))),
  FOREIGN KEY (lot_id) REFERENCES stock_lots(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id bigint DEFAULT nextval('stock_transfer_items_id_seq'::regclass) NOT NULL,
  transfer_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity numeric(12,2) NOT NULL,
  FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id bigint DEFAULT nextval('stock_transfers_id_seq'::regclass) NOT NULL,
  order_no text NOT NULL,
  from_warehouse_id bigint NOT NULL,
  to_warehouse_id bigint NOT NULL,
  status text DEFAULT 'draft'::text,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK ((status = ANY (ARRAY['draft'::text, 'completed'::text, 'cancelled'::text]))),
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
  PRIMARY KEY (id),
  UNIQUE (order_no)
);

CREATE TABLE IF NOT EXISTS stocks (
  id bigint DEFAULT nextval('stocks_id_seq'::regclass) NOT NULL,
  warehouse_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  PRIMARY KEY (id),
  UNIQUE (warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id bigint DEFAULT nextval('suppliers_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  address text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS units (
  id bigint DEFAULT nextval('units_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id bigint DEFAULT nextval('warehouses_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  location text,
  remark text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_default boolean DEFAULT false NOT NULL,
  PRIMARY KEY (id)
);

