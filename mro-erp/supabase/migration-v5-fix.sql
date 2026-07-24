-- ============================================================
-- Migration v5: 修复撤回恢复批次 + 清理
-- ============================================================

-- 修复 reverse_sales_order：撤回时恢复批次数量
CREATE OR REPLACE FUNCTION reverse_sales_order(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
  v_status TEXT;
  v_cost NUMERIC;
BEGIN
  SELECT warehouse_id, status INTO v_warehouse_id, v_status
  FROM sales_orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在'; END IF;
  IF v_status NOT IN ('completed', 'returned') THEN RAISE EXCEPTION '只能撤回已完成或已退货的订单'; END IF;

  FOR item IN SELECT * FROM sales_order_items WHERE sales_order_id = p_order_id LOOP
    -- 恢复总库存
    INSERT INTO stocks (warehouse_id, product_id, quantity)
    VALUES (v_warehouse_id, item.product_id, item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = stocks.quantity + item.quantity;

    -- 创建新批次记录恢复库存（用订单快照的成本价）
    v_cost := COALESCE(item.cost_price, 0);
    INSERT INTO stock_lots (warehouse_id, product_id, quantity, unit_cost, is_estimated, remark)
    VALUES (v_warehouse_id, item.product_id, item.quantity, v_cost, v_cost <= 0, '订单撤回恢复');

    -- 记录流水
    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id, remark)
    VALUES (v_warehouse_id, item.product_id, 'sale_return', item.quantity, v_cost, 'REVOKE', p_order_id, '订单撤回');
  END LOOP;

  -- 更新订单状态
  UPDATE sales_orders SET status = 'cancelled' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
