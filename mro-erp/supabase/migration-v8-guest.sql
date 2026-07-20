-- 游客账号迁移
-- 在 Supabase SQL Editor 中执行此脚本，或手动在 Authentication → Users → Add User 创建：
--   Email: guest@mro-dev.xyz
--   Password: guest123456

-- 方式一：通过函数创建（如果支持）
-- SELECT auth.create_user('guest@mro-dev.xyz', 'guest123456', '{}'::jsonb, true);

-- 方式二：手动创建后，确保 RLS 允许游客只读关键表
-- 以下 RLS 策略可选——前端已通过 isGuest 控制界面，但建议也加上

-- 游客只读产品表（不能增删改）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Guest read-only products'
  ) THEN
    CREATE POLICY "Guest read-only products" ON public.products
      FOR SELECT USING (auth.email() = 'guest@mro-dev.xyz');
  END IF;
END
$$;

-- 游客只读库存表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Guest read-only stock'
  ) THEN
    CREATE POLICY "Guest read-only stock" ON public.stock
      FOR SELECT USING (auth.email() = 'guest@mro-dev.xyz');
  END IF;
END
$$;
