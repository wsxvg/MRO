-- Migration: 删除未使用的 SKU 字段
ALTER TABLE products DROP COLUMN IF EXISTS sku;
