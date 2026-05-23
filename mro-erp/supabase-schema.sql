-- ============================================
-- MRO 进销存系统 - 完整数据库建表 SQL
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. update_updated_at 函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. auto_order_no 函数
CREATE OR REPLACE FUNCTION generate_order_no(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_num INT;
  date_str TEXT;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  seq_num := nextval('order_seq');
  RETURN prefix || '-' || date_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- 3. 分类表
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. 商品表
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  specification TEXT,
  unit TEXT DEFAULT '个',
  supplier_id BIGINT REFERENCES suppliers(id),
  reference_price NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  min_stock NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. 客户表
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

-- 8. 客户专属定价表
CREATE TABLE IF NOT EXISTS customer_prices (
  customer_id BIGINT REFERENCES customers(id),
  product_id BIGINT REFERENCES products(id),
  price NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (customer_id, product_id)
);

-- 9. 库存表
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

-- 10. 库存流水表
CREATE TABLE IF NOT EXISTS stock_transactions (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase_in','purchase_return','sale_out','sale_return','transfer_in','transfer_out','adjustment')),
  quantity NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2),
  ref_type TEXT,
  ref_id BIGINT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 采购订单表
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  supplier_id BIGINT REFERENCES suppliers(id) NOT NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 12. 采购订单明细表
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id BIGINT REFERENCES purchase_orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- 13. 销售订单表
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

-- 14. 销售订单明细表
CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT REFERENCES sales_orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 15. 收款记录表
CREATE TABLE IF NOT EXISTS payment_records (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT REFERENCES sales_orders(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','transfer','wechat','alipay','other')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. 采购退货单表
CREATE TABLE IF NOT EXISTS purchase_return_orders (
  id BIGSERIAL PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  supplier_id BIGINT REFERENCES suppliers(id) NOT NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_purchase_return_orders_updated_at BEFORE UPDATE ON purchase_return_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 17. 采购退货明细表
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id BIGSERIAL PRIMARY KEY,
  return_order_id BIGINT REFERENCES purchase_return_orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- 18. 销售退货单表
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

-- 19. 销售退货明细表
CREATE TABLE IF NOT EXISTS sales_return_items (
  id BIGSERIAL PRIMARY KEY,
  return_order_id BIGINT REFERENCES sales_return_orders(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 20. 库存调拨表（第二期）
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

-- 21. 调拨明细表（第二期）
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT REFERENCES stock_transfers(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL
);

-- 22. 订单号自动生成触发器
CREATE OR REPLACE FUNCTION set_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_NAME = 'trg_purchase_orders_no' THEN
    NEW.order_no := generate_order_no('PO');
  ELSIF TG_NAME = 'trg_sales_orders_no' THEN
    NEW.order_no := generate_order_no('SO');
  ELSIF TG_NAME = 'trg_purchase_return_orders_no' THEN
    NEW.order_no := generate_order_no('PR');
  ELSIF TG_NAME = 'trg_sales_return_orders_no' THEN
    NEW.order_no := generate_order_no('SR');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_orders_no BEFORE INSERT ON purchase_orders FOR EACH ROW EXECUTE FUNCTION set_order_no();
CREATE TRIGGER trg_sales_orders_no BEFORE INSERT ON sales_orders FOR EACH ROW EXECUTE FUNCTION set_order_no();
CREATE TRIGGER trg_purchase_return_orders_no BEFORE INSERT ON purchase_return_orders FOR EACH ROW EXECUTE FUNCTION set_order_no();
CREATE TRIGGER trg_sales_return_orders_no BEFORE INSERT ON sales_return_orders FOR EACH ROW EXECUTE FUNCTION set_order_no();

-- 23. RLS 策略（全员可读写）
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全员可读写" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON customer_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON payment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON purchase_return_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON purchase_return_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_return_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON sales_return_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "全员可读写" ON stock_transfer_items FOR ALL USING (true) WITH CHECK (true);

-- 24. RPC: complete_purchase_order
CREATE OR REPLACE FUNCTION complete_purchase_order(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_supplier_id BIGINT;
  v_warehouse_id BIGINT;
BEGIN
  SELECT supplier_id, warehouse_id INTO v_supplier_id, v_warehouse_id
  FROM purchase_orders WHERE id = p_order_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或不是草稿状态'; END IF;

  FOR item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = p_order_id LOOP
    INSERT INTO stocks (warehouse_id, product_id, quantity)
    VALUES (v_warehouse_id, item.product_id, item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = stocks.quantity + item.quantity;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'purchase_in', item.quantity, item.unit_cost, 'PO', p_order_id);

    UPDATE products SET cost_price = item.unit_cost WHERE id = item.product_id;
  END LOOP;

  UPDATE purchase_orders SET status = 'completed' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 25. RPC: complete_sales_order
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
    IF v_stock_qty < item.quantity THEN
      RAISE EXCEPTION '商品 % 库存不足 (可用: %, 需要: %)', item.product_id, v_stock_qty, item.quantity;
    END IF;

    UPDATE stocks SET quantity = quantity - item.quantity
    WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'sale_out', -item.quantity, item.cost_price, 'SO', p_order_id);

    v_total := v_total + item.line_total;
  END LOOP;

  UPDATE sales_orders SET status = 'completed', total_amount = v_total WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 26. RPC: complete_purchase_return
CREATE OR REPLACE FUNCTION complete_purchase_return(p_return_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
BEGIN
  SELECT warehouse_id INTO v_warehouse_id
  FROM purchase_return_orders WHERE id = p_return_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '退货单不存在或不是草稿状态'; END IF;

  FOR item IN SELECT * FROM purchase_return_items WHERE return_order_id = p_return_id LOOP
    UPDATE stocks SET quantity = quantity - item.quantity
    WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'purchase_return', -item.quantity, item.unit_cost, 'PR', p_return_id);
  END LOOP;

  UPDATE purchase_return_orders SET status = 'completed' WHERE id = p_return_id;
END;
$$ LANGUAGE plpgsql;

-- 27. RPC: complete_sales_return
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
