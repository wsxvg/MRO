-- Migration: 退货退款闭环
-- 1. 支付记录增加 type 字段和 return_order_id
ALTER TABLE payment_records
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'payment' CHECK (type IN ('payment', 'refund')),
  ADD COLUMN IF NOT EXISTS return_order_id BIGINT REFERENCES sales_return_orders(id);

-- 2. 退货单增加 sales_order_id（关联原销售单）
ALTER TABLE sales_return_orders
  ADD COLUMN IF NOT EXISTS sales_order_id BIGINT REFERENCES sales_orders(id);

-- 3. 更新 complete_sales_return 函数：完成后自动创建退款记录
CREATE OR REPLACE FUNCTION complete_sales_return(p_return_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
  v_sales_order_id BIGINT;
  v_return_amount NUMERIC(12,2) := 0;
  v_customer_id BIGINT;
BEGIN
  SELECT warehouse_id, sales_order_id, total_amount, customer_id
  INTO v_warehouse_id, v_sales_order_id, v_return_amount, v_customer_id
  FROM sales_return_orders WHERE id = p_return_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION '退货单不存在或不是草稿状态'; END IF;

  -- 回补库存
  FOR item IN SELECT * FROM sales_return_items WHERE return_order_id = p_return_id LOOP
    INSERT INTO stocks (warehouse_id, product_id, quantity)
    VALUES (v_warehouse_id, item.product_id, item.quantity)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET quantity = stocks.quantity + item.quantity;

    INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
    VALUES (v_warehouse_id, item.product_id, 'sale_return', item.quantity, 0, 'SR', p_return_id);
  END LOOP;

  -- 标记退货单完成
  UPDATE sales_return_orders SET status = 'completed' WHERE id = p_return_id;

  -- 自动冲抵：创建退款记录并扣减持付金额
  IF v_sales_order_id IS NOT NULL AND v_return_amount > 0 THEN
    INSERT INTO payment_records (sales_order_id, return_order_id, amount, payment_method, type, remark)
    VALUES (v_sales_order_id, p_return_id, -v_return_amount, 'other', 'refund',
            '退货单 ' || (SELECT order_no FROM sales_return_orders WHERE id = p_return_id) || ' 自动冲抵');

    -- 更新销售单已付金额（确保不为负）
    UPDATE sales_orders
    SET paid_amount = GREATEST(0, COALESCE(paid_amount, 0) - v_return_amount)
    WHERE id = v_sales_order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
