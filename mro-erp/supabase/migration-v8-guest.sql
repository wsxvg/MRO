-- 游客模式：允许匿名（未认证）用户读取部分表
-- 在 Supabase SQL Editor 中执行此脚本

-- 方式一：完全允许匿名读取（推荐，简单）
-- 如果下面报错 "policy already exists"，在 Supabase Dashboard → Authentication → Policies 中手动删除旧策略再执行

-- 商品表：允许所有人读取
DROP POLICY IF EXISTS "Read products" ON public.products;
CREATE POLICY "Read products" ON public.products FOR SELECT USING (true);

-- 库存表：允许所有人读取
DROP POLICY IF EXISTS "Read stock" ON public.stock;
CREATE POLICY "Read stock" ON public.stock FOR SELECT USING (true);

-- 分类表：允许所有人读取（游客浏览分类筛选）
DROP POLICY IF EXISTS "Read categories" ON public.categories;
CREATE POLICY "Read categories" ON public.categories FOR SELECT USING (true);

-- 单位表：允许所有人读取
DROP POLICY IF EXISTS "Read units" ON public.units;
CREATE POLICY "Read units" ON public.units FOR SELECT USING (true);

-- 仓库表：允许所有人读取（库存查询需要）
DROP POLICY IF EXISTS "Read warehouses" ON public.warehouses;
CREATE POLICY "Read warehouses" ON public.warehouses FOR SELECT USING (true);

-- 说明：
-- - 以上策略允许任何人（含游客）读取这些表
-- - 写入/修改/删除操作仍需要认证（已有策略不受影响）
-- - 游客在前端看不到进价/编辑按钮（由 Vue 前端控制）
-- - 如果需要更精细的控制，可以将 SELECT USING (true) 改为：
--   CREATE POLICY "Read products" ON public.products FOR SELECT
--     USING (auth.role() = 'authenticated' OR true);
