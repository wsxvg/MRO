-- ============================================
-- Migration v11: 修复库存估值的仓库维度 bug
-- 问题：get_stock_report / get_inventory_by_category 在做库存估值 stock_value 时，
--       把 stock_lots（批次成本账）按 product_id 全局聚合，未带 warehouse_id 维度，
--       导致单仓报表 stock_value 被高估（混入其他仓库成本），全仓报表则被重复累加。
-- 修复：批次估值子查询增加 warehouse_id 的 SELECT/GROUP BY，并补充 JOIN 条件
--       s.warehouse_id = lv.warehouse_id，使估值精确到 (product, warehouse)。
--       同时把 get_inventory_by_category 的兜底改为与 get_stock_report 一致
--       （无批次时用 quantity * 商品主数据成本价）。
-- ============================================

-- ====== 4. 库存按分类（含批次估值，按仓库维度精确计算） ======
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

-- ====== 7. 库存报表（含批次估值，按仓库维度精确计算） ======
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
