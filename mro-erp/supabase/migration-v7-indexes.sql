-- ============================================
-- Migration v7: 补充业务查询索引
-- 解决高频筛选/关联查询全表扫描问题
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- ====== 销售订单 ======
CREATE INDEX IF NOT EXISTS idx_sales_orders_status
  ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer
  ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created
  ON sales_orders(created_at DESC);

-- ====== 销售订单明细 ======
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order
  ON sales_order_items(sales_order_id);

-- ====== 库存 ======
-- stocks 表已有 UNIQUE(warehouse_id, product_id) 覆盖复合查询
-- 单独按 product_id 查需要额外索引
CREATE INDEX IF NOT EXISTS idx_stocks_product
  ON stocks(product_id);

-- ====== 库存流水 ======
CREATE INDEX IF NOT EXISTS idx_stock_tx_product
  ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_warehouse
  ON stock_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_tx_created
  ON stock_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_tx_type_created
  ON stock_transactions(type, created_at DESC);

-- ====== 收款记录 ======
CREATE INDEX IF NOT EXISTS idx_payment_records_order
  ON payment_records(sales_order_id);

-- ====== 退货单 ======
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer
  ON sales_return_orders(customer_id);

-- ====== 退货明细 ======
CREATE INDEX IF NOT EXISTS idx_sales_return_items_order
  ON sales_return_items(return_order_id);

-- ====== 调拨明细 ======
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer
  ON stock_transfer_items(transfer_id);

-- ====== 验证 ======
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
