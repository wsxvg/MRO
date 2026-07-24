-- ============================================================
-- Migration: Remove Purchase Management (采购管理已废弃)
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 1. 删除采购相关 RPC 函数
DROP FUNCTION IF EXISTS complete_purchase_order(BIGINT);
DROP FUNCTION IF EXISTS complete_purchase_return(BIGINT);

-- 2. 删除采购相关触发器和函数
DROP TRIGGER IF EXISTS trg_purchase_orders_no ON purchase_orders;
DROP TRIGGER IF EXISTS trg_purchase_return_orders_no ON purchase_return_orders;
DROP FUNCTION IF EXISTS set_purchase_order_no();
DROP FUNCTION IF EXISTS set_purchase_return_no();

-- 3. 删除采购相关表（含明细和退货）
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_return_items CASCADE;
DROP TABLE IF EXISTS purchase_return_orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- 4. 移除 products 表中的 supplier_id 字段
ALTER TABLE products DROP COLUMN IF EXISTS supplier_id;

-- 5. 更新 stock_transactions 的 type 约束（去掉 purchase_in, purchase_return，改成 stock_in）
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_type_check;

-- 先把已有数据中的 purchase_in 改成 stock_in
UPDATE stock_transactions SET type = 'stock_in' WHERE type = 'purchase_in';
UPDATE stock_transactions SET type = 'stock_out' WHERE type = 'purchase_return';

-- 重新添加约束
ALTER TABLE stock_transactions ADD CONSTRAINT stock_transactions_type_check
  CHECK (type IN ('stock_in','stock_out','sale_out','sale_return','transfer_in','transfer_out','adjustment'));

-- 6. 更新 generate_order_no 函数（去掉 purchase_orders 和 purchase_return_orders 引用）
CREATE OR REPLACE FUNCTION generate_order_no(prefix text)
RETURNS text AS $$
DECLARE
  date_part text;
  seq_num int;
  order_no text;
BEGIN
  date_part := to_char(NOW(), 'YYYYMMDD');
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
