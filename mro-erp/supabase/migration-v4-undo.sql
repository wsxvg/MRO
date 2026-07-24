-- ============================================================
-- Migration v4: 销售撤回 + 库存调整走批次 + 采购到货调价 + 供应商地址
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- ====== Part 1: 销售撤回 RPC ======
CREATE OR REPLACE FUNCTION reverse_sales_order(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
  v_status TEXT;
BEGIN
  SELECT warehouse_id, status INTO v_warehouse_id, v_status
  FROM sales_orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在'; END IF;
  IF v_status NOT IN ('completed', 'returned') THEN RAISE EXCEPTION '只能撤回已完成或已退货的订单'; END IF;

  FOR item IN SELECT * FROM sales_order_items WHERE sales_order_id = p_order_id LOOP
    INSERT INTO stocks (warehouse_id, product_id, quantity)
    VALUES (v_warehouse_id, item.product_id, item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = stocks.quantity + item.quantity;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id, remark)
    VALUES (v_warehouse_id, item.product_id, 'sale_return', item.quantity, item.cost_price, 'REVOKE', p_order_id, '订单撤回');
  END LOOP;

  UPDATE sales_orders SET status = 'cancelled' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- ====== Part 2: 供应商表增加地址字段 ======
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
