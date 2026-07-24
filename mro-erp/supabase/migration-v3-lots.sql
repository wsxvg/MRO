-- ============================================================
-- Migration v3: 批次成本追踪 + 供应商管理
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- ====== Part 1: 供应商表 ======

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_suppliers_updated_at') THEN
    CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '全员可读写' AND polrelid = 'suppliers'::regclass) THEN
    CREATE POLICY "全员可读写" ON suppliers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ====== Part 2: 库存批次表 ======

CREATE TABLE IF NOT EXISTS stock_lots (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT REFERENCES warehouses(id) NOT NULL,
  product_id BIGINT REFERENCES products(id) NOT NULL,
  supplier_id BIGINT REFERENCES suppliers(id),
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_estimated BOOLEAN DEFAULT false,
  stock_in_date TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_lots_product_warehouse ON stock_lots(product_id, warehouse_id, stock_in_date);
CREATE INDEX IF NOT EXISTS idx_stock_lots_quantity ON stock_lots(quantity) WHERE quantity > 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stock_lots_updated_at') THEN
    CREATE TRIGGER trg_stock_lots_updated_at BEFORE UPDATE ON stock_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE stock_lots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = '全员可读写' AND polrelid = 'stock_lots'::regclass) THEN
    CREATE POLICY "全员可读写" ON stock_lots FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- stock_transactions 增加 lot_id 字段（关联批次）
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS lot_id BIGINT REFERENCES stock_lots(id);

-- ====== Part 3: 入库 RPC（创建批次 + 更新库存 + 写流水）======

CREATE OR REPLACE FUNCTION stock_in_with_lot(
  p_product_id BIGINT,
  p_warehouse_id BIGINT,
  p_quantity NUMERIC,
  p_unit_cost NUMERIC DEFAULT 0,
  p_is_estimated BOOLEAN DEFAULT false,
  p_supplier_id BIGINT DEFAULT NULL,
  p_remark TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_lot_id BIGINT;
BEGIN
  -- 1. 创建批次记录
  INSERT INTO stock_lots (warehouse_id, product_id, supplier_id, quantity, unit_cost, is_estimated, stock_in_date, remark)
  VALUES (p_warehouse_id, p_product_id, p_supplier_id, p_quantity, p_unit_cost, p_is_estimated, NOW(), p_remark)
  RETURNING id INTO v_lot_id;

  -- 2. 写库存流水
  INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, lot_id, ref_type, ref_id, remark)
  VALUES (p_warehouse_id, p_product_id, 'stock_in', p_quantity, CASE WHEN p_unit_cost > 0 THEN p_unit_cost ELSE NULL END, v_lot_id, 'LOT', v_lot_id, p_remark);

  -- 3. 更新总库存
  INSERT INTO stocks (warehouse_id, product_id, quantity)
  VALUES (p_warehouse_id, p_product_id, p_quantity)
  ON CONFLICT (warehouse_id, product_id)
  DO UPDATE SET quantity = stocks.quantity + p_quantity;

  -- 4. 如果有真实进价，重算商品平均成本
  IF p_unit_cost > 0 AND NOT p_is_estimated THEN
    PERFORM recalc_product_cost(p_product_id);
  END IF;

  RETURN v_lot_id;
END;
$$ LANGUAGE plpgsql;

-- ====== Part 4: FIFO 出库 RPC（重写 complete_sales_order）======

CREATE OR REPLACE FUNCTION complete_sales_order(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_customer_id BIGINT;
  v_warehouse_id BIGINT;
  v_remaining NUMERIC;
  lot_rec RECORD;
  v_deduct_qty NUMERIC;
  v_total_cost NUMERIC;
  v_total NUMERIC(12,2);
BEGIN
  SELECT customer_id, warehouse_id INTO v_customer_id, v_warehouse_id
  FROM sales_orders WHERE id = p_order_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或不是草稿状态'; END IF;

  v_total := 0;
  FOR item IN SELECT * FROM sales_order_items WHERE sales_order_id = p_order_id LOOP
    -- 检查库存
    DECLARE v_stock_qty NUMERIC;
    BEGIN
      SELECT COALESCE(quantity, 0) INTO v_stock_qty
      FROM stocks WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;
      IF v_stock_qty < item.quantity THEN
        RAISE EXCEPTION '商品(ID=%) 库存不足，需要 %，仅有 %', item.product_id, item.quantity, v_stock_qty;
      END IF;
    END;

    -- FIFO: 按入库时间从早到晚扣减批次
    v_remaining := item.quantity;
    v_total_cost := 0;

    FOR lot_rec IN
      SELECT id, quantity, unit_cost
      FROM stock_lots
      WHERE product_id = item.product_id
        AND warehouse_id = v_warehouse_id
        AND quantity > 0
      ORDER BY stock_in_date ASC, id ASC
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_deduct_qty := LEAST(lot_rec.quantity, v_remaining);

      -- 扣减批次数量
      UPDATE stock_lots SET quantity = quantity - v_deduct_qty WHERE id = lot_rec.id;

      -- 记录出库流水（关联批次）
      INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, lot_id, ref_type, ref_id)
      VALUES (v_warehouse_id, item.product_id, 'sale_out', -v_deduct_qty, lot_rec.unit_cost, lot_rec.id, 'SO', p_order_id);

      v_total_cost := v_total_cost + v_deduct_qty * lot_rec.unit_cost;
      v_remaining := v_remaining - v_deduct_qty;
    END LOOP;

    -- 更新总库存
    UPDATE stocks SET quantity = quantity - item.quantity
    WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;

    -- 用 FIFO 实际成本更新订单明细的 cost_price
    IF item.quantity > 0 THEN
      UPDATE sales_order_items
      SET cost_price = ROUND(v_total_cost / item.quantity, 2)
      WHERE id = item.id;
    END IF;

    v_total := v_total + item.line_total;
  END LOOP;

  UPDATE sales_orders SET status = 'completed', total_amount = v_total WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- ====== Part 5: 核价 RPC（暂估→实际）======

CREATE OR REPLACE FUNCTION update_lot_cost(
  p_lot_id BIGINT,
  p_new_cost NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_product_id BIGINT;
BEGIN
  UPDATE stock_lots
  SET unit_cost = p_new_cost, is_estimated = false
  WHERE id = p_lot_id
  RETURNING product_id INTO v_product_id;

  IF NOT FOUND THEN RAISE EXCEPTION '批次不存在'; END IF;

  -- 重算商品平均成本
  PERFORM recalc_product_cost(v_product_id);
END;
$$ LANGUAGE plpgsql;

-- ====== Part 6: 重算商品平均成本 ======

CREATE OR REPLACE FUNCTION recalc_product_cost(p_product_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_total_qty NUMERIC;
  v_total_value NUMERIC;
  v_avg_cost NUMERIC;
BEGIN
  SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(quantity * unit_cost), 0)
  INTO v_total_qty, v_total_value
  FROM stock_lots
  WHERE product_id = p_product_id AND quantity > 0;

  IF v_total_qty > 0 THEN
    v_avg_cost := ROUND(v_total_value / v_total_qty, 2);
  ELSE
    v_avg_cost := 0;
  END IF;

  UPDATE products
  SET cost_price = v_avg_cost, cost_price_auto = true
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- ====== Part 7: 现有数据迁移（为每个有库存的商品创建初始批次）======

DO $$
DECLARE
  stock_rec RECORD;
BEGIN
  FOR stock_rec IN
    SELECT s.warehouse_id, s.product_id, s.quantity, p.cost_price
    FROM stocks s
    JOIN products p ON p.id = s.product_id
    WHERE s.quantity > 0
  LOOP
    -- 为每个有库存的商品创建一个初始批次
    INSERT INTO stock_lots (warehouse_id, product_id, quantity, unit_cost, is_estimated, stock_in_date, remark)
    VALUES (
      stock_rec.warehouse_id,
      stock_rec.product_id,
      stock_rec.quantity,
      COALESCE(stock_rec.cost_price, 0),
      COALESCE((SELECT cost_price_auto FROM products WHERE id = stock_rec.product_id), false),
      NOW(),
      'v3迁移：初始批次'
    );
  END LOOP;
END $$;

-- ====== Part 8: 定时任务（每 10 分钟保活，防止 Supabase 冷却）======

-- 先启用 pg_cron 扩展（只需执行一次，已启用则跳过）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 保活：最轻量的查询，防止 Supabase 免费版 7 天无活动后休眠
DO $$
BEGIN
  PERFORM cron.unschedule('supabase-keep-alive');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'supabase-keep-alive',    -- job name
  '0 3 */5 * *',            -- 每 5 天凌晨 3 点执行
  $$SELECT 1$$
);

-- ====== Part 9: 自动安全库存计算 ======

-- 给 products 表增加手动标记字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_stock_manual BOOLEAN DEFAULT false;

-- 自动计算单个商品的安全库存
CREATE OR REPLACE FUNCTION calc_safety_stock(p_product_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_total_sold NUMERIC;
  v_days INT := 90;
  v_daily_avg NUMERIC;
  v_std_dev NUMERIC;
  v_volatility NUMERIC;
  v_safety_days INT;
  v_new_min_stock NUMERIC;
  v_is_manual BOOLEAN;
BEGIN
  -- 检查是否手动设置过，手动设置的不覆盖
  SELECT safety_stock_manual INTO v_is_manual FROM products WHERE id = p_product_id;
  IF v_is_manual THEN RETURN; END IF;

  -- 过去 90 天总销量
  SELECT COALESCE(SUM(ABS(quantity)), 0) INTO v_total_sold
  FROM stock_transactions
  WHERE product_id = p_product_id
    AND type = 'sale_out'
    AND created_at >= NOW() - INTERVAL '90 days';

  v_daily_avg := v_total_sold / v_days;

  -- 计算标准差（按天聚合后算）
  SELECT COALESCE(STDDEV(daily_qty), 0) INTO v_std_dev
  FROM (
    SELECT SUM(ABS(quantity)) AS daily_qty
    FROM stock_transactions
    WHERE product_id = p_product_id
      AND type = 'sale_out'
      AND created_at >= NOW() - INTERVAL '90 days'
    GROUP BY DATE(created_at)
  ) t;

  -- 波动系数（上限 2，下限 1）
  IF v_daily_avg > 0 THEN
    v_volatility := LEAST(GREATEST(v_std_dev / v_daily_avg, 1), 2);
  ELSE
    v_volatility := 1;
  END IF;

  -- 安全天数（按日均销量分档）
  IF v_daily_avg >= 1 THEN
    v_safety_days := 7;
  ELSIF v_daily_avg >= 0.1 THEN
    v_safety_days := 15;
  ELSIF v_daily_avg >= 0.01 THEN
    v_safety_days := 30;
  ELSE
    v_safety_days := 0;
  END IF;

  v_new_min_stock := ROUND(v_daily_avg * v_safety_days * v_volatility);

  UPDATE products SET min_stock = v_new_min_stock WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 批量计算所有商品的安全库存
CREATE OR REPLACE FUNCTION calc_all_safety_stocks()
RETURNS VOID AS $$
DECLARE
  pid BIGINT;
BEGIN
  FOR pid IN SELECT id FROM products WHERE is_active = true LOOP
    PERFORM calc_safety_stock(pid);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 每天凌晨 2:30 自动刷新安全库存
DO $$
BEGIN
  PERFORM cron.unschedule('auto-safety-stock');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'auto-safety-stock',
  '30 2 * * *',
  $$SELECT calc_all_safety_stocks()$$
);

-- ====== Part 10: 异常检测查询函数 ======

CREATE OR REPLACE FUNCTION detect_anomalies()
RETURNS TABLE (
  anomaly_type TEXT,
  severity TEXT,
  product_id BIGINT,
  product_name TEXT,
  detail TEXT
) AS $$
BEGIN
  -- 进价异常
  RETURN QUERY
  WITH lot_costs AS (
    SELECT sl.product_id AS pid, sl.unit_cost AS cost, sl.stock_in_date AS sdate,
      LAG(sl.unit_cost) OVER (PARTITION BY sl.product_id ORDER BY sl.stock_in_date) AS prev
    FROM stock_lots sl WHERE sl.unit_cost > 0
  ),
  cost_changes AS (
    SELECT lc.pid, lc.cost, lc.prev,
      ROUND(((lc.cost - lc.prev) / lc.prev * 100)::numeric, 0) AS pct
    FROM lot_costs lc
    WHERE lc.prev > 0 AND lc.sdate >= NOW() - INTERVAL '30 days'
      AND ABS(lc.cost - lc.prev) / lc.prev > 0.3
  )
  SELECT '进价异常'::TEXT, 'high'::TEXT, cc.pid, p.name::TEXT,
    ('进价较上次波动 ' || cc.pct || '%，请核实')::TEXT
  FROM cost_changes cc JOIN products p ON p.id = cc.pid;

  -- 库存为负
  RETURN QUERY
  SELECT '库存为负'::TEXT, 'high'::TEXT, s.product_id, p.name::TEXT,
    ('库存为 ' || s.quantity || '，请检查')::TEXT
  FROM stocks s JOIN products p ON p.id = s.product_id WHERE s.quantity < 0;

  -- 低库存预警
  RETURN QUERY
  SELECT '低库存'::TEXT, 'medium'::TEXT, p.id, p.name::TEXT,
    ('库存 ' || COALESCE(stk.qty, 0) || '，安全 ' || p.min_stock || '，建议补货')::TEXT
  FROM products p
  LEFT JOIN (SELECT s2.product_id AS pid, SUM(s2.quantity) AS qty FROM stocks s2 GROUP BY s2.product_id) stk ON stk.pid = p.id
  WHERE p.is_active AND p.min_stock > 0 AND COALESCE(stk.qty, 0) < p.min_stock;

  -- 滞销预警
  RETURN QUERY
  SELECT '滞销预警'::TEXT, 'medium'::TEXT, p.id, p.name::TEXT,
    ('已 ' || COALESCE(ls.days_idle, 999) || ' 天未售出，库存 ' || COALESCE(stk.qty, 0) || ' 个')::TEXT
  FROM products p
  LEFT JOIN (SELECT s3.product_id AS pid, SUM(s3.quantity) AS qty FROM stocks s3 GROUP BY s3.product_id) stk ON stk.pid = p.id
  LEFT JOIN (SELECT st.product_id AS pid, EXTRACT(DAY FROM NOW() - MAX(st.created_at))::INT AS days_idle
    FROM stock_transactions st WHERE st.type = 'sale_out' GROUP BY st.product_id) ls ON ls.pid = p.id
  WHERE p.is_active AND COALESCE(stk.qty, 0) > 0
    AND (ls.days_idle >= 90 OR ls.days_idle IS NULL);
END;
$$ LANGUAGE plpgsql;

-- ====== Part 11: 快速开单支持无客户（零售）======
ALTER TABLE sales_orders ALTER COLUMN customer_id DROP NOT NULL;

-- ====== Part 12: 修复 generate_order_no 函数变量名歧义 ======
CREATE OR REPLACE FUNCTION generate_order_no(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  v_date_part TEXT;
  v_seq_num INT;
  v_order_no TEXT;
BEGIN
  v_date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  v_seq_num := COALESCE((
    SELECT CAST(RIGHT(t.order_no, 4) AS INT) + 1
    FROM (
      SELECT order_no FROM sales_orders WHERE order_no LIKE prefix || '-' || v_date_part || '-%'
      UNION ALL
      SELECT order_no FROM sales_return_orders WHERE order_no LIKE prefix || '-' || v_date_part || '-%'
      UNION ALL
      SELECT order_no FROM stock_transfers WHERE order_no LIKE prefix || '-' || v_date_part || '-%'
    ) t
    ORDER BY t.order_no DESC
    LIMIT 1
  ), 0) + 1;
  v_order_no := prefix || '-' || v_date_part || '-' || LPAD(v_seq_num::TEXT, 4, '0');
  RETURN v_order_no;
END;
$$ LANGUAGE plpgsql;

-- ====== Part 13: 修复销售订单状态约束 ======
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'returned'));

-- ====== 完成 ======
SELECT 'Migration v3 completed successfully' AS result;
