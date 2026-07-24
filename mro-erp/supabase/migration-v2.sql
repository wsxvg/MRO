-- ============================================================
-- Migration v2: 移除采购管理 + 商品自动计算成本价
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- ====== Part 1: 移除采购管理（purchase 相关表从未被前端使用） ======

-- 1. 先删除采购表的 RLS 策略（必须在 DROP TABLE 之前执行）
-- 使用 DO 块检查表是否存在，避免二次运行时报错
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'purchase_orders') THEN
    DROP POLICY IF EXISTS "全员可读写" ON purchase_orders;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'purchase_order_items') THEN
    DROP POLICY IF EXISTS "全员可读写" ON purchase_order_items;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'purchase_return_orders') THEN
    DROP POLICY IF EXISTS "全员可读写" ON purchase_return_orders;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'purchase_return_items') THEN
    DROP POLICY IF EXISTS "全员可读写" ON purchase_return_items;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'suppliers') THEN
    DROP POLICY IF EXISTS "全员可读写" ON suppliers;
  END IF;
END $$;

-- 2. 删除采购相关 RPC 函数
DROP FUNCTION IF EXISTS complete_purchase_order(BIGINT);
DROP FUNCTION IF EXISTS complete_purchase_return(BIGINT);

-- 3. 删除采购相关表（含明细和退货）
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_return_items CASCADE;
DROP TABLE IF EXISTS purchase_return_orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- 3. 移除 products 表中的 supplier_id 字段
ALTER TABLE products DROP COLUMN IF EXISTS supplier_id;

-- 4. 更新 stock_transactions 的 type 约束（去掉 purchase_in/purchase_return）
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_type_check;

UPDATE stock_transactions SET type = 'stock_in' WHERE type = 'purchase_in';
UPDATE stock_transactions SET type = 'stock_out' WHERE type = 'purchase_return';

ALTER TABLE stock_transactions ADD CONSTRAINT stock_transactions_type_check
  CHECK (type IN ('stock_in','stock_out','sale_out','sale_return','transfer_in','transfer_out','adjustment'));

-- 5. 更新 generate_order_no 函数（去掉 purchase_orders/purchase_return_orders 引用）
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

-- 6. 简化 set_order_no 函数（去掉 PO/PR 分支，保留 SO/SR）
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

-- 创建 stock_transfers 的订单号触发器（如果有该表且尚未创建）
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

-- ====== Part 2: 商品添加成本价自动计算标记 ======

-- 7. products 表添加 cost_price_auto 列
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price_auto BOOLEAN DEFAULT false;

-- ====== 完成 ======
SELECT 'Migration v2 completed successfully' AS result;
