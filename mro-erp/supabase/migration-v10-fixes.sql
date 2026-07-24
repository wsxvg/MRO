-- ============================================================
-- Migration v10: 修复退货单总额 + 清理幽灵恢复批次
-- ============================================================

-- 1. complete_sales_return：完成后写入 total_amount（之前只置 status，
--    导致退货总额永远为 0，且依赖 total_amount 的自动退款冲抵逻辑从不触发）
CREATE OR REPLACE FUNCTION complete_sales_return(p_return_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
  v_sales_order_id BIGINT;
  v_return_amount NUMERIC(12,2) := 0;
  v_customer_id BIGINT;
  v_total NUMERIC(12,2) := 0;
BEGIN
  SELECT warehouse_id, sales_order_id, total_amount, customer_id
  INTO v_warehouse_id, v_sales_order_id, v_return_amount, v_customer_id
  FROM sales_return_orders WHERE id = p_return_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '退货单不存在或不是草稿状态'; END IF;

  -- 退货总额以明细求和（权威），同时用于自动退款冲抵
  SELECT COALESCE(SUM(line_total), 0) INTO v_total
  FROM sales_return_items WHERE return_order_id = p_return_id;
  v_return_amount := v_total;

  -- 回补库存
  FOR item IN SELECT * FROM sales_return_items WHERE return_order_id = p_return_id LOOP
    INSERT INTO stocks (warehouse_id, product_id, quantity)
    VALUES (v_warehouse_id, item.product_id, item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = stocks.quantity + item.quantity;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'sale_return', item.quantity, 0, 'SR', p_return_id);
  END LOOP;

  -- 标记退货单完成，并写入退货总额
  UPDATE sales_return_orders SET status = 'completed', total_amount = v_total WHERE id = p_return_id;

  -- 自动冲抵：创建退款记录并扣减已付金额
  IF v_sales_order_id IS NOT NULL AND v_return_amount > 0 THEN
    INSERT INTO payment_records (sales_order_id, return_order_id, amount, payment_method, type, remark)
    VALUES (v_sales_order_id, p_return_id, -v_return_amount, 'other', 'refund',
            '退货单 ' || (SELECT order_no FROM sales_return_orders WHERE id = p_return_id) || ' 自动冲抵');

    UPDATE sales_orders
    SET paid_amount = GREATEST(0, COALESCE(paid_amount, 0) - v_return_amount)
    WHERE id = v_sales_order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 清理 product_id=2913 / warehouse_id=8 的幽灵恢复批次：
--    stocks.quantity 已被每次销售递减至 0（权威在库数），但 reverse_sales_order
--    插入的 is_estimated/零成本恢复批次因 FIFO 未被消费而残留，造成两表不一致。
--    这些批次被 stock_transactions.lot_id 外键引用，故不删除，仅将数量置 0
--    （v9 报表均按 quantity>0 过滤，置 0 后不再参与在库/估值计算，且可逆）。
UPDATE stock_lots
SET quantity = 0
WHERE warehouse_id = 8
  AND product_id = 2913
  AND remark = '订单撤回恢复'
  AND is_estimated = true
  AND unit_cost = 0;
