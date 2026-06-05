-- Migration: Multi-warehouse sales order completion
-- Run this in Supabase SQL Editor

-- Step 1: Add warehouse_id column to sales_order_items
-- This allows per-item warehouse override (e.g., item A from shop, item B from warehouse 2)
ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS warehouse_id BIGINT REFERENCES warehouses(id);

-- Step 2: Fix existing complete_sales_order to accept 'pending' status
-- (Previously only accepted 'draft', but frontend creates orders with 'pending')
CREATE OR REPLACE FUNCTION complete_sales_order(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_warehouse_id BIGINT;
  v_remaining NUMERIC;
  lot_rec RECORD;
  v_deduct_qty NUMERIC;
  v_total_cost NUMERIC;
  v_total NUMERIC(12,2);
BEGIN
  SELECT warehouse_id INTO v_warehouse_id
  FROM sales_orders WHERE id = p_order_id AND status IN ('pending', 'draft');
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或状态不正确'; END IF;

  v_total := 0;
  FOR item IN SELECT * FROM sales_order_items WHERE sales_order_id = p_order_id LOOP
    v_remaining := item.quantity;
    v_total_cost := 0;

    FOR lot_rec IN
      SELECT id, quantity, unit_cost
      FROM stock_lots
      WHERE product_id = item.product_id
        AND warehouse_id = v_warehouse_id
        AND quantity > 0
      ORDER BY stock_in_date ASC, id ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct_qty := LEAST(lot_rec.quantity, v_remaining);
      UPDATE stock_lots SET quantity = quantity - v_deduct_qty WHERE id = lot_rec.id;
      INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, lot_id, ref_type, ref_id)
      VALUES (v_warehouse_id, item.product_id, 'sale_out', -v_deduct_qty, lot_rec.unit_cost, lot_rec.id, 'SO', p_order_id);
      v_total_cost := v_total_cost + v_deduct_qty * lot_rec.unit_cost;
      v_remaining := v_remaining - v_deduct_qty;
    END LOOP;

    -- Update total stock (allows negative)
    UPDATE stocks SET quantity = quantity - item.quantity
    WHERE warehouse_id = v_warehouse_id AND product_id = item.product_id;
    IF NOT FOUND THEN
      INSERT INTO stocks (warehouse_id, product_id, quantity)
      VALUES (v_warehouse_id, item.product_id, -item.quantity);
    END IF;

    IF item.quantity > 0 THEN
      UPDATE sales_order_items
      SET cost_price = ROUND(v_total_cost / item.quantity, 2)
      WHERE id = item.id;
    END IF;

    v_total := v_total + item.line_total;
  END LOOP;

  UPDATE sales_orders SET status = 'completed', total_amount = v_total WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create multi-warehouse completion function
-- This is like complete_sales_order but:
--   - Accepts orders with status 'pending' (not just 'draft')
--   - Uses per-item warehouse_id if set, otherwise falls back to order's warehouse
--   - Allows negative stock (for shop scenarios where stock runs out)

CREATE OR REPLACE FUNCTION complete_sales_order_mw(p_order_id BIGINT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  v_order_warehouse_id BIGINT;
  v_effective_warehouse_id BIGINT;
  v_remaining NUMERIC;
  lot_rec RECORD;
  v_deduct_qty NUMERIC;
  v_total_cost NUMERIC;
  v_total NUMERIC(12,2);
BEGIN
  -- Get order's default warehouse
  SELECT warehouse_id INTO v_order_warehouse_id
  FROM sales_orders WHERE id = p_order_id AND status IN ('pending', 'draft');
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或状态不正确'; END IF;

  v_total := 0;
  FOR item IN SELECT * FROM sales_order_items WHERE sales_order_id = p_order_id LOOP
    -- Use per-item warehouse if set, otherwise order's warehouse
    v_effective_warehouse_id := COALESCE(item.warehouse_id, v_order_warehouse_id);

    -- FIFO: deduct from lots by stock_in_date
    v_remaining := item.quantity;
    v_total_cost := 0;

    FOR lot_rec IN
      SELECT id, quantity, unit_cost
      FROM stock_lots
      WHERE product_id = item.product_id
        AND warehouse_id = v_effective_warehouse_id
        AND quantity > 0
      ORDER BY stock_in_date ASC, id ASC
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_deduct_qty := LEAST(lot_rec.quantity, v_remaining);

      UPDATE stock_lots SET quantity = quantity - v_deduct_qty WHERE id = lot_rec.id;

      INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, lot_id, ref_type, ref_id)
      VALUES (v_effective_warehouse_id, item.product_id, 'sale_out', -v_deduct_qty, lot_rec.unit_cost, lot_rec.id, 'SO', p_order_id);

      v_total_cost := v_total_cost + v_deduct_qty * lot_rec.unit_cost;
      v_remaining := v_remaining - v_deduct_qty;
    END LOOP;

    -- If no lots were found (new product or all lots empty), use product cost_price
    IF v_total_cost = 0 THEN
      SELECT cost_price INTO v_total_cost FROM products WHERE id = item.product_id;
      v_total_cost := COALESCE(v_total_cost, 0) * item.quantity;

      -- Still record the transaction
      INSERT INTO stock_transactions (warehouse_id, product_id, type, quantity, unit_cost, ref_type, ref_id)
      VALUES (v_effective_warehouse_id, item.product_id, 'sale_out', -item.quantity,
              COALESCE((SELECT cost_price FROM products WHERE id = item.product_id), 0), 'SO', p_order_id);
    END IF;

    -- Update total stock (allows negative)
    UPDATE stocks SET quantity = quantity - item.quantity
    WHERE warehouse_id = v_effective_warehouse_id AND product_id = item.product_id;

    -- If no stock record exists, create one with negative quantity
    IF NOT FOUND THEN
      INSERT INTO stocks (warehouse_id, product_id, quantity)
      VALUES (v_effective_warehouse_id, item.product_id, -item.quantity);
    END IF;

    -- Update cost_price on order item using FIFO actual cost
    IF item.quantity > 0 THEN
      UPDATE sales_order_items
      SET cost_price = ROUND(v_total_cost / item.quantity, 2)
      WHERE id = item.id;
    END IF;

    v_total := v_total + item.line_total;
  END LOOP;

  UPDATE sales_orders SET status = 'completed', total_amount = v_total WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
