-- ============================================
-- Migration v9: 报表服务端聚合 RPC
-- 把原先在前端拉全量再 GROUP BY 的报表改成数据库端聚合，
-- 规避 Supabase 单次 1000 行上限与浏览器内存爆炸。
-- 在 Supabase SQL Editor 中执行（anon 角色在 RLS 下可读这些表）。
-- ============================================

-- ====== 1. 销售汇总（按日分组） ======
-- 替代 fetchSalesSummary
CREATE OR REPLACE FUNCTION get_sales_summary(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_warehouse_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  date TEXT,
  total_amount NUMERIC,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(so.created_at::DATE, 'YYYY-MM-DD')::TEXT,
    COALESCE(SUM(so.total_amount), 0)::NUMERIC,
    COUNT(*)::BIGINT
  FROM sales_orders so
  WHERE so.status = 'completed'
    AND (p_start_date IS NULL OR so.created_at >= p_start_date::TIMESTAMPTZ)
    AND (p_end_date IS NULL OR so.created_at <= (p_end_date::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 second'))
    AND (p_warehouse_id IS NULL OR so.warehouse_id = p_warehouse_id)
  GROUP BY TO_CHAR(so.created_at::DATE, 'YYYY-MM-DD')
  ORDER BY TO_CHAR(so.created_at::DATE, 'YYYY-MM-DD');
END;
$$ LANGUAGE plpgsql;

-- ====== 2. 毛利报表（按订单） ======
-- 替代 fetchProfitReport：直接算每单成本/毛利/毛利率
CREATE OR REPLACE FUNCTION get_profit_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_warehouse_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  order_no TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ,
  total_amount NUMERIC,
  cost_amount NUMERIC,
  gross_profit NUMERIC,
  margin_rate TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id,
    so.order_no,
    COALESCE(c.name, '-')::TEXT,
    so.created_at,
    so.total_amount::NUMERIC,
    COALESCE(SUM(soi.cost_price * soi.quantity), 0)::NUMERIC,
    (so.total_amount - COALESCE(SUM(soi.cost_price * soi.quantity), 0))::NUMERIC,
    CASE
      WHEN so.total_amount > 0
        THEN ((so.total_amount - COALESCE(SUM(soi.cost_price * soi.quantity), 0)) / so.total_amount * 100)::NUMERIC(10,1)::TEXT
      ELSE '0.0'
    END
  FROM sales_orders so
  LEFT JOIN customers c ON c.id = so.customer_id
  LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
  WHERE so.status = 'completed'
    AND (p_start_date IS NULL OR so.created_at >= p_start_date::TIMESTAMPTZ)
    AND (p_end_date IS NULL OR so.created_at <= (p_end_date::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 second'))
    AND (p_warehouse_id IS NULL OR so.warehouse_id = p_warehouse_id)
  GROUP BY so.id, so.order_no, c.name, so.created_at, so.total_amount
  ORDER BY so.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ====== 3. 仪表盘 KPI ======
-- 替代 fetchDashboardKPIs（多指标一次聚合）
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_warehouse_id BIGINT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_products', (SELECT COUNT(*) FROM products WHERE is_active),
    'total_customers', (SELECT COUNT(*) FROM customers),
    'total_warehouses', (SELECT COUNT(*) FROM warehouses),
    'pending_sales_orders', (SELECT COUNT(*) FROM sales_orders WHERE status = 'draft'),
    'month_sales_amount', COALESCE((
      SELECT SUM(total_amount) FROM sales_orders
      WHERE status = 'completed'
        AND (p_start_date IS NULL OR created_at >= p_start_date::TIMESTAMPTZ)
        AND (p_end_date IS NULL OR created_at <= (p_end_date::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 second'))
        AND (p_warehouse_id IS NULL OR warehouse_id = p_warehouse_id)
    ), 0),
    'low_stock_count', (
      SELECT COUNT(*) FROM stocks s
      JOIN products p ON p.id = s.product_id
      WHERE s.quantity < p.min_stock AND p.min_stock > 0
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ====== 4. 库存按分类（含批次估值） ======
-- 替代 fetchInventoryByCategory
CREATE OR REPLACE FUNCTION get_inventory_by_category(p_warehouse_id BIGINT DEFAULT NULL)
RETURNS TABLE (
  category_name TEXT,
  quantity NUMERIC,
  stock_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH lot_val AS (
    SELECT l.product_id, l.warehouse_id, SUM(l.quantity * l.unit_cost) AS val
    FROM stock_lots l
    WHERE l.quantity > 0
    GROUP BY l.product_id, l.warehouse_id
  )
  SELECT
    cat.name::TEXT,
    COALESCE(SUM(s.quantity), 0)::NUMERIC,
    COALESCE(SUM(COALESCE(lv.val, s.quantity * COALESCE(p.cost_price, 0))), 0)::NUMERIC
  FROM stocks s
  JOIN products p ON p.id = s.product_id
  JOIN categories cat ON cat.id = p.category_id
  LEFT JOIN lot_val lv ON lv.product_id = s.product_id AND lv.warehouse_id = s.warehouse_id
  WHERE (p_warehouse_id IS NULL OR s.warehouse_id = p_warehouse_id)
  GROUP BY cat.name
  ORDER BY cat.name;
END;
$$ LANGUAGE plpgsql;

-- ====== 5. 畅销商品（按量 / 按额 Top N） ======
-- 替代 fetchHotProducts
CREATE OR REPLACE FUNCTION get_hot_products(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'by_quantity', COALESCE((
      SELECT json_agg(x) FROM (
        SELECT p.name AS product_name, p.specification, SUM(soi.quantity) AS total_quantity
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.sales_order_id
        JOIN products p ON p.id = soi.product_id
        WHERE so.status = 'completed'
          AND (p_start_date IS NULL OR so.created_at >= p_start_date::TIMESTAMPTZ)
          AND (p_end_date IS NULL OR so.created_at <= (p_end_date::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 second'))
        GROUP BY p.id, p.name, p.specification
        ORDER BY SUM(soi.quantity) DESC
        LIMIT p_limit
      ) x
    ), '[]'::json),
    'by_revenue', COALESCE((
      SELECT json_agg(y) FROM (
        SELECT p.name AS product_name, p.specification, SUM(soi.line_total) AS total_amount
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.sales_order_id
        JOIN products p ON p.id = soi.product_id
        WHERE so.status = 'completed'
          AND (p_start_date IS NULL OR so.created_at >= p_start_date::TIMESTAMPTZ)
          AND (p_end_date IS NULL OR so.created_at <= (p_end_date::TIMESTAMPTZ + INTERVAL '1 day' - INTERVAL '1 second'))
        GROUP BY p.id, p.name, p.specification
        ORDER BY SUM(soi.line_total) DESC
        LIMIT p_limit
      ) y
    ), '[]'::json)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ====== 6. 滞销商品 ======
-- 替代 fetchSlowProducts（按未售天数倒序取 Top N）
CREATE OR REPLACE FUNCTION get_slow_products(p_days INT DEFAULT 60, p_limit INT DEFAULT 10)
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  specification TEXT,
  stock_quantity NUMERIC,
  days_idle INT
) AS $$
BEGIN
  RETURN QUERY
  WITH last_sale AS (
    SELECT st.product_id, MAX(st.created_at) AS last_sale_at
    FROM stock_transactions st
    WHERE st.type = 'sale_out'
    GROUP BY st.product_id
  )
  SELECT
    s.product_id,
    p.name::TEXT,
    p.specification::TEXT,
    s.quantity::NUMERIC,
    CASE
      WHEN ls.last_sale_at IS NULL THEN 999
      ELSE EXTRACT(DAY FROM (NOW() - ls.last_sale_at))::INT
    END
  FROM stocks s
  JOIN products p ON p.id = s.product_id AND p.is_active = TRUE
  LEFT JOIN last_sale ls ON ls.product_id = s.product_id
  WHERE s.quantity > 0
    AND (ls.last_sale_at IS NULL OR ls.last_sale_at <= NOW() - (p_days || ' days')::INTERVAL)
  ORDER BY (
    CASE WHEN ls.last_sale_at IS NULL THEN 999 ELSE EXTRACT(DAY FROM (NOW() - ls.last_sale_at))::INT END
  ) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ====== 7. 库存报表（含批次估值，可选仓库） ======
-- 替代 fetchStockReport
CREATE OR REPLACE FUNCTION get_stock_report(p_warehouse_id BIGINT DEFAULT NULL)
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  warehouse_name TEXT,
  quantity NUMERIC,
  min_stock NUMERIC,
  cost_price NUMERIC,
  stock_value NUMERIC,
  has_estimated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.product_id,
    p.name::TEXT,
    w.name::TEXT,
    s.quantity::NUMERIC,
    COALESCE(p.min_stock, 0)::NUMERIC,
    COALESCE(p.cost_price, 0)::NUMERIC,
    COALESCE(lv.val, s.quantity * COALESCE(p.cost_price, 0))::NUMERIC,
    COALESCE(lv.has_est, FALSE)
  FROM stocks s
  JOIN products p ON p.id = s.product_id
  JOIN warehouses w ON w.id = s.warehouse_id
  LEFT JOIN (
    SELECT l.product_id, l.warehouse_id, SUM(l.quantity * l.unit_cost) AS val, BOOL_OR(l.is_estimated) AS has_est
    FROM stock_lots l
    WHERE l.quantity > 0
    GROUP BY l.product_id, l.warehouse_id
  ) lv ON lv.product_id = s.product_id AND lv.warehouse_id = s.warehouse_id
  WHERE (p_warehouse_id IS NULL OR s.warehouse_id = p_warehouse_id)
  ORDER BY s.product_id;
END;
$$ LANGUAGE plpgsql;

-- ====== 验证 ======
-- 确认 7 个函数已创建
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_sales_summary', 'get_profit_report', 'get_dashboard_kpis',
    'get_inventory_by_category', 'get_hot_products', 'get_slow_products', 'get_stock_report'
  )
ORDER BY routine_name;
