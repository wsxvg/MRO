-- ============================================
-- 安全答案加密迁移：将硬编码的安全答案迁移到数据库
-- 在 Supabase SQL Editor 中执行
-- 创建日期: 2026-06-21
-- ============================================

-- 1. 创建配置表
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "全员可读写" ON app_config FOR ALL USING (true) WITH CHECK (true);

-- 3. 插入安全配置（问题 + 答案）
INSERT INTO app_config (key, value) VALUES
  ('security_question', '王道硕的手机号是什么'),
  ('security_answer', '17826038535')
ON CONFLICT (key) DO NOTHING;

-- 4. 更新时间戳触发器
CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
