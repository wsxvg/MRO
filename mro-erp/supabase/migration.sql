-- ============================================================
-- MRO 进销存 - Supabase 数据库完整建表脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 0. 扩展和基础函数
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- update_updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动生成订单编号函数
CREATE OR REPLACE FUNCTION generate_order_no(prefix text)
RETURNS text AS $$
DECLARE
  date_part text;
  seq_num int;
  order_no text;
BEGIN
  date_part := to_char(NOW(), 'YYYYMMDD');
  -- 获取当天的序列号
  seq_num := COALESCE((
    SELECT CAST(RIGHT(order_no, 4) AS int) + 1
    FROM (
      SELECT order_no FROM sales_orders WHERE order_no LIKE prefix || '-' || date_part || '-%'
      UNION ALL
      SELECT order_no FROM sales_return_orders WHERE order_no LIKE prefix || '-' || date_part || '-%'
      UNION ALL
      SELECT order_no FROM stock_transfers WHERE order_no LIKE prefix || '-' || date_part || '-%'
    ) t
    ORDER BY order_no DESC
    LIMIT 1
  ), 0) + 1;
  order_no := prefix || '-' || date_part || '-' || LPAD(seq_num::text, 4, '0');
  RETURN order_no;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. 基础表
-- ============================================================

-- 1.0a units 计量单位
CREATE TABLE units (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_units_updated_at
  BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 预置常用单位
INSERT INTO units (name, sort_order) VALUES
  ('个', 1), ('箱', 2), ('套', 3), ('米', 4),
  ('千克', 5), ('升', 6), ('只', 7), ('台', 8)
ON CONFLICT (name) DO NOTHING;

-- 1.1 categories 商品分类
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 如已运行过旧版建表，执行下面语句补约束：
-- ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 1.3 warehouses 仓库
CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_warehouses_updated_at
  BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 1.4 products 商品
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  specification TEXT,
  unit TEXT DEFAULT '个',
  reference_price NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  min_stock NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 1.5 customers 客户
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 1.6 customer_prices 客户专属定价
CREATE TABLE customer_prices (
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  price NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (customer_id, product_id)
);

-- 1.7 stocks 库存
CREATE TABLE stocks (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);
CREATE TRIGGER trg_stocks_updated_at
  BEFORE UPDATE ON stocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 1.8 stock_transactions 库存流水
CREATE TABLE stock_transactions (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('stock_in','sale_out','sale_return','transfer_in','transfer_out','adjustment')),
  quantity NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2),
  ref_type TEXT,
  ref_id BIGINT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. 订单表
-- ============================================================

-- 2.1 sales_orders 销售订单
CREATE TABLE sales_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_sales_orders_updated_at
  BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION set_sales_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL THEN
    NEW.order_no := generate_order_no('SO');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_sales_orders_no
  BEFORE INSERT ON sales_orders FOR EACH ROW EXECUTE FUNCTION set_sales_order_no();

-- 2.2 sales_order_items 销售订单明细
CREATE TABLE sales_order_items (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 2.3 payment_records 收款记录
CREATE TABLE payment_records (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','wechat','alipay','other')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 退货表
-- ============================================================

-- 3.1 sales_return_orders 销售退货单
CREATE TABLE sales_return_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_sales_return_orders_updated_at
  BEFORE UPDATE ON sales_return_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION set_sales_return_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL THEN
    NEW.order_no := generate_order_no('SR');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_sales_return_orders_no
  BEFORE INSERT ON sales_return_orders FOR EACH ROW EXECUTE FUNCTION set_sales_return_no();

-- 3.2 sales_return_items 销售退货明细
CREATE TABLE sales_return_items (
  id BIGSERIAL PRIMARY KEY,
  return_order_id BIGINT NOT NULL REFERENCES sales_return_orders(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================================
-- 4. 库存调拨（第二期实现）
-- ============================================================
CREATE TABLE stock_transfers (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  from_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  to_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_stock_transfers_updated_at
  BEFORE UPDATE ON stock_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE stock_transfer_items (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT NOT NULL REFERENCES stock_transfers(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) NOT NULL
);

-- ============================================================
-- 5. RLS 策略（单人使用，全员可读可写）
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- 全员可读写策略
CREATE POLICY "all_access" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON customer_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON payment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON sales_return_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON sales_return_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON stock_transfer_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. RPC 存储过程
-- ============================================================

-- 6.1 complete_sales_order 完成销售订单（出库）
CREATE OR REPLACE FUNCTION complete_sales_order(p_order_id BIGINT)
RETURNS void AS $$
DECLARE
  so_status text;
  so_warehouse_id bigint;
  item_record record;
  current_quantity numeric;
BEGIN
  SELECT status, warehouse_id INTO so_status, so_warehouse_id
  FROM sales_orders WHERE id = p_order_id;
  IF so_status != 'draft' THEN
    RAISE EXCEPTION '订单状态不是草稿，无法完成';
  END IF;

  -- 检查并扣减库存
  FOR item_record IN
    SELECT soi.product_id, soi.quantity, soi.unit_price, p.cost_price
    FROM sales_order_items soi
    JOIN products p ON p.id = soi.product_id
    WHERE soi.sales_order_id = p_order_id
  LOOP
    -- 检查库存
    SELECT COALESCE(quantity, 0) INTO current_quantity
    FROM stocks WHERE warehouse_id = so_warehouse_id AND product_id = item_record.product_id;
    IF current_quantity < item_record.quantity THEN
      RAISE EXCEPTION '商品ID % 库存不足 (当前: %, 需要: %)',
        item_record.product_id, current_quantity, item_record.quantity;
    END IF;

    -- 扣减库存
    UPDATE stocks SET quantity = quantity - item_record.quantity
    WHERE warehouse_id = so_warehouse_id AND product_id = item_record.product_id;

    -- 回写成本价到订单明细
    UPDATE sales_order_items SET cost_price = item_record.cost_price
    WHERE sales_order_id = p_order_id AND product_id = item_record.product_id;

    -- 记录库存流水
    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (so_warehouse_id, item_record.product_id, 'sale_out', -item_record.quantity, item_record.cost_price, 'SO', p_order_id);
  END LOOP;

  -- 标记已完成（如果全款则自动更新已付金额）
  UPDATE sales_orders SET status = 'completed'
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 6.2 complete_sales_return 完成销售退货（入库回冲）
CREATE OR REPLACE FUNCTION complete_sales_return(p_return_id BIGINT)
RETURNS void AS $$
DECLARE
  r_status text;
  r_warehouse_id bigint;
  item_record record;
BEGIN
  SELECT status, warehouse_id INTO r_status, r_warehouse_id
  FROM sales_return_orders WHERE id = p_return_id;
  IF r_status != 'draft' THEN
    RAISE EXCEPTION '退货单状态不是草稿，无法完成';
  END IF;

  FOR item_record IN
    SELECT product_id, quantity, unit_price
    FROM sales_return_items WHERE return_order_id = p_return_id
  LOOP
    -- 增加库存
    UPDATE stocks SET quantity = quantity + item_record.quantity
    WHERE warehouse_id = r_warehouse_id AND product_id = item_record.product_id;

    -- 记录流水
    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, ref_type, ref_id)
    VALUES (r_warehouse_id, item_record.product_id, 'sale_return', item_record.quantity, 'SR', p_return_id);
  END LOOP;

  UPDATE sales_return_orders SET status = 'completed' WHERE id = p_return_id;
END;
$$ LANGUAGE plpgsql;
