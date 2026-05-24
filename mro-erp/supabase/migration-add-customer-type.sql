-- ============================================================
-- 迁移: 添加客户类型字段 + 收银台优化
-- ============================================================

-- 1. 客户表添加 type 字段
ALTER TABLE customers ADD COLUMN type TEXT NOT NULL DEFAULT 'retail' CHECK (type IN ('retail', 'wholesale'));

-- 2. sales_orders.customer_id 改为可空（快速收银可以不选择客户）
ALTER TABLE sales_orders ALTER COLUMN customer_id DROP NOT NULL;

-- 3. sales_return_orders.customer_id 改为可空（保持一致）
ALTER TABLE sales_return_orders ALTER COLUMN customer_id DROP NOT NULL;
