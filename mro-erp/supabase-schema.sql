-- ============================================
-- MRO 进销存系统 - 完整数据库建表 SQL
-- 在 Supabase SQL Editor 中执行
-- 最后更新: 2026-05-24 (v2: 移除采购管理)
-- ============================================

-- 1. update_updated_at 函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 订单号函数
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_no(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  seq_num INT;
  order_no TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  seq_num := COALESCE((
    SELECT CAST(RIGHT(order_no, 4) AS INT) + 1
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
  order_no := prefix || '-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN order_no;
END;
$$ LANGUAGE plpgsql;

-- 3. 分类表
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  remark TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. 商品表
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  specification TEXT,
  unit TEXT DEFAULT '个',
  reference_price NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  cost_price_auto BOOLEAN DEFAULT false,
  min_stock NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. 客户表
CREATE TABLE IF NOT EXISTS customers (
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
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. 客户专属定价表
CREATE TABLE IF NOT EXISTS customer_prices (
  customer_id BIGINT REFERENCES customers(id),
  product_id BIGINT REFERENCES products(id),
  price NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (customer_id, product_id)
);

-- 8. 库存表
CREATE TABLE IF NOT EXISTS stocks (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);
CREATE TRIGGER trg_stocks_updated_at BEFORE UPDATE ON stocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. 库存流水表
CREATE TABLE IF NOT EXISTS stock_transactions (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stock_in','stock_out','sale_out','sale_return','transfer_in','transfer_out','adjustment')),
  quantity NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2),
  ref_type TEXT,
  ref_id BIGINT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 销售订单表
CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  customer_id BIGINT REFERENCES customers(id) NOT NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. 销售订单明细表
CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT REFERENCES sales_orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 12. 收款记录表
CREATE TABLE IF NOT EXISTS payment_records (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT REFERENCES sales_orders(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','wechat','alipay','other')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 销售退货单表
CREATE TABLE IF NOT EXISTS sales_return_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  customer_id BIGINT REFERENCES customers(id) NOT NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_sales_return_orders_updated_at BEFORE UPDATE ON sales_return_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 14. 销售退货明细表
CREATE TABLE IF NOT EXISTS sales_return_items (
  id BIGSERIAL PRIMARY KEY,
  return_order_id BIGINT REFERENCES sales_return_orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 15. 库存调拨表
CREATE TABLE IF NOT EXISTS stock_transfers (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  from_warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  to_warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_stock_transfers_updated_at BEFORE UPDATE ON stock_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 16. 调拨明细表
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT REFERENCES stock_transfers(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL
);

-- 17. 订单号自动生成触发器
CREATE OR REPLACE FUNCTION set_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_NAME = 'trg_sales_orders_no' THEN
    NEW.order_no := generate_order_no('SO');
  ELSIF TG_NAME = 'trg_sales_return_orders_no' THEN
    NEW.order_no := generate_order_no('SR');
  ELSIF TG_NAME = 'trg_stock_transfers_no' THEN
    NEW.order_no := generate_order_no('TF');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sales_orders_no BEFORE INSERT ON sales_orders FOR EACH ROW EXECUTE FUNCTION set_order_no();
CREATE TRIGGER trg_sales_return_orders_no BEFORE INSERT ON sales_return_orders FOR EACH ROW EXECUTE FUNCTION set_order_no();

-- stock_transfers 的订单号触发器（如果该表存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_transfers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stock_transfers_no') THEN
      CREATE TRIGGER trg_stock_transfers_no
        BEFORE INSERT ON stock_transfers
        FOR EACH ROW EXECUTE FUNCTION set_order_no();
    END IF;
  END IF;
END $$;

-- 18. RLS 策略（全员可读写）
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

CREATE POLICY "全员可读写" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON customer_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON payment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_return_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_return_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stock_transfer_items FOR ALL USING (true) WITH CHECK (true);

-- 19. RPC: complete_sales_order
CREATE OR REPLACE FUNCTION complete_sales_order(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_customer_id BIGINT;
  v_warehouse_id BIGINT;
  v_stock_qty NUMERIC(12,2);
  v_total NUMERIC(12,2);
BEGIN
  SELECT customer_id, warehouse_id INTO v_customer_id, v_warehouse_id
  FROM sales_orders WHERE id = p_order_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或不是草稿状态'; END IF;

  v_total := 0;
  FOR item IN SELECT * FROM sales_order_items WHERE sales_order_id = p_order_id LOOP
    SELECT COALESCE(quantity, 0) INTO v_stock_qty
    FROM stocks WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;
    UPDATE stocks SET quantity = quantity - item.quantity
    WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'sale_out', -item.quantity, item.cost_price, 'SO', p_order_id);

    v_total := v_total + item.line_total;
  END LOOP;

  UPDATE sales_orders SET status = 'completed', total_amount = v_total WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 20. RPC: complete_sales_return
CREATE OR REPLACE FUNCTION complete_sales_return(p_return_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
BEGIN
  SELECT warehouse_id INTO v_warehouse_id
  FROM sales_return_orders WHERE id = p_return_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '退货单不存在或不是草稿状态'; END IF;

  FOR item IN SELECT * FROM sales_return_items WHERE return_order_id = p_return_id LOOP
    INSERT INTO stocks (warehouse_id, product_id, quantity)
    VALUES (v_warehouse_id, item.product_id, item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = stocks.quantity + item.quantity;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'sale_return', item.quantity, 0, 'SR', p_return_id);
  END LOOP;

  UPDATE sales_return_orders SET status = 'completed' WHERE id = p_return_id;
END;
$$ LANGUAGE plpgsql;
