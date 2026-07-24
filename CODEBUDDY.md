# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

汇友 MRO 进销存系统：面向工业品贸易小公司的纯前端进销存（商品 / 客户 / 销售 / 采购 / 仓库 / 报表）。本仓库没有自建后端，所有持久化与业务计算都发生在 Supabase（PostgreSQL + Auth + RLS）。

## 工作目录约定

- 实际应用源码在 `mro-erp/`（即 `mro-erp/mro-erp/` 嵌套目录），日常开发改的都是这里：`src/`、`supabase-schema.sql`、`supabase/` 迁移、`vite.config.ts`。
- 本文件所在的 `MRO-main/` 是项目根，包含 `README.md`、`CONTEXT.md`、`scripts/`（备份与 SQL 工具）和 `.github/workflows/`。
- `mro-erp/mro-erp/` 下的 `README.md` / `frontend-compare.html` / `ui-audit.html` 是历史文档与对照稿，以 `CONTEXT.md` 为准。

## 常用命令

开发服务器（在 `mro-erp/mro-erp/` 下执行）：
```bash
cd mro-erp/mro-erp
npm install      # 首次安装依赖（Node 18+ / npm 9+）
npm run dev      # Vite 开发服务器，http://localhost:5173
```

生产构建与预览：
```bash
npm run build    # vue-tsc -b 类型检查 + vite build（发布前必须跑通）
npm run preview  # 本地预览构建产物
```
`npm run build` 会因 `vue-tsc` 类型错误中断；修改 TS 后务必保证类型检查通过再提交。

数据库迁移（无 ORM，SQL 即 Schema）：
- 全量建表与 RPC 函数见 `supabase-schema.sql`，首次部署在 Supabase SQL Editor 执行。
- 增量变更放在 `supabase/`（`migration-*.sql`，按 v2→v8、add/remove/fix 命名）。新增表 / 字段 / 函数时追加迁移文件，不要直接改 `supabase-schema.sql` 的历史。
- `scripts/supabase-sql.js` 与 `scripts/backup-supabase.mjs` 用于脚本化执行 SQL 与定时备份（需 `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_URL` 等 Secrets，Service Role Key 仅脚本使用，绝不进前端打包）。

无自动化测试：本项目没有测试框架与测试代码，不要寻找或编造 `npm test` / 单测命令。

## 架构总览

**分层（单向依赖）：** `views/*`(页面) → `api/*`(数据访问) → `lib/supabase.ts`(单一 client) → Supabase。视图通过 Pinia `stores/` 共享状态，`composables/` 抽出可复用逻辑（Toast、防抖、打印、PWA 更新等），全局类型集中在 `types/index.ts`（所有实体的唯一真相源，改表务必同步）。

**API 层（`src/api/`）：** 每个文件是某域的薄封装，直接调用 `supabase.from(...)` / `supabase.rpc(...)`，统一返回 `ApiResult<T>`（`{data, error}`）或 `ListResponse<T>`（`{data, count, error}`）。调用方必须检查 `error` 并通过 `lib/errorHandler.ts` 提示。涉及库存变动、单据完成、单号生成、统计趋势的逻辑全部用 SQL 函数实现，前端只负责传参，不要在前端重写这些计算。

**关键 SQL 函数（位于 `supabase-schema.sql`，务必沿用）：**
- `complete_sales_order(p_order_id)` / `complete_sales_return(p_return_id)`：完成单据时在事务内扣减 / 恢复库存并更应收。业务上「完成」不可逆，前端禁止绕过 RPC 手动改 `stocks` / `sales_orders`。
- `generate_order_no(prefix)` / `set_order_no()`：自动生成并写入 `order_no`，新增单据不要自己拼单号。
- `get_monthly_sales_trend` / `get_stock_transactions_by_date`：服务端聚合，报表优先调用这些而非全表拉取。
- `update_updated_at()`：触发器维护 `updated_at`。

**状态管理（`src/stores/`）：** `auth.ts` 是认证核心——单一硬编码账号（`huiyou@mro-dev.xyz`，密码经 `lib/supabase` 走 Supabase Auth）+ 游客模式（`guestLogin()`，靠 RLS 匿名策略只读）。登录成功后置 `loggedIn`，路由守卫（`router/index.ts`）用 `supabase.auth.getSession()` 决定是否放行。安全问题文本存于 `app_config` 表（key=`security_question`），缺失时降级到 `auth.ts` 内默认值。`common.ts` 存放跨页共享状态。

**鉴权与数据安全：** RLS 当前对 2 人团队较为宽松（匿名可读写），没有细粒度权限。涉及金额 / 成本的展示受 `stores`（如成本价可见性）控制，新增字段时注意是否应受限。`.env` 中的 `VITE_SUPABASE_ANON_KEY` 会进前端包；Service Role Key 只在脚本 `.env` 中。任何改动都不要在前端暴露高权限 Key。

**UI 约定（`src/components/`，以 `Base*` 命名）：** 页面统一包在 `Layout.vue`（侧栏 + 顶栏 + 内容区），内容区用 `page-padding` 类；标题栏用 `BasePageHeader`，表格用 `BaseTable`（`columns` 列定义驱动，支持排序 / 插槽），弹窗用 `BaseModal` / `ConfirmDialog`，统计卡用 `StatCard`，搜索筛选用 `FilterBar` / `SearchableSelect`。按钮类约定：`btn-primary`（主操作）/ `btn-secondary`（次操作）/ `btn-icon`（图标）。新增页面优先复用这些组件，保持视觉一致。

**报表数据流：** 仪表盘与报表页在客户端对 `completed` 状态的 `sales_orders` / `sales_order_items` 做分组聚合（毛利 = 销售额 − Σ成本×数量）。数据量小，沿用客户端聚合，不要急于引入服务端视图，除非数据规模明显增长。

**构建与产物：** Vite 5，`@` 别名指向 `src`。`vite.config.ts` 已用 `manualChunks` 把 `@supabase`、`echarts*`、`xlsx`、`vue`、`pinia`、`vue-router` 拆包以控体积；ECharts 按需引入。PWA 由 `vite-plugin-pwa` 自动生成（离线可用、`autoUpdate`）。GitHub Pages 部署经 `.github/workflows/deploy-web.yml`，注意 SPA 刷新 404 已由 `public/404.html` 处理。

**增量模块：** 代码已超出旧文档范围——新增了 `api/purchaseOrders.ts`、`api/suppliers.ts`、`api/stockTransactions.ts`（采购入库 / 供应商 / 库存流水），以及 `supabase/migration-v3-lots.sql`（批次）、`migration-v6-multi-warehouse.sql`（多仓）、`migration-v8-guest.sql`（游客）。改动采购 / 批次 / 多仓逻辑时，以这些新模块与迁移为准，而非 `CONTEXT.md` 中较旧的「单仓 / 无采购」描述。
