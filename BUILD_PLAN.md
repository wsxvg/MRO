# MRO 进销存 ERP - 构建计划 (BUILD PLAN)

18 个阶段，按顺序执行。每个阶段完成后验证再进入下一步。

## 阶段 0: 准备工作
- [ ] 阅读 `C:\项目\MRO\SPEC.md` 了解完整技术规格
- [ ] 确认 Supabase 项目信息（URL、anon key）
- [ ] 在 `C:\项目\MRO\` 下创建 `mro-erp/` 项目目录

## 阶段 1: 项目脚手架
- [ ] 在 `mro-erp/` 下执行 `npm create vite@latest . -- --template vue-ts`
- [ ] `npm install vue-router pinia @supabase/supabase-js tailwindcss postcss autoprefixer vite-plugin-pwa xlsx`
- [ ] 配置 Tailwind (tailwind.config.js, postcss.config.js, index.css)
- [ ] 配置 Vite PWA
- [ ] 创建目录结构：`src/{api,types,composables,components,views,stores,lib}/`
- [ ] 创建 `.env`（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）

## 阶段 2: Supabase 数据库
- [ ] 在 Supabase SQL Editor 执行 15 张基础表的 CREATE TABLE
- [ ] 新增 4 张退货表：purchase_return_orders, purchase_return_items, sales_return_orders, sales_return_items
- [ ] 创建字段约束、主键、外键
- [ ] 启用 RLS，创建全员可读写策略
- [ ] 创建 update_updated_at 触发器和函数
- [ ] 创建 5 个 RPC:
  - complete_purchase_order
  - complete_sales_order
  - complete_purchase_return
  - complete_sales_return
  - complete_transfer（可延后）
- [ ] 创建自动生成 order_no（PO/SO/PR/SR/TF）的序列和触发器

## 阶段 3: API 层 + 类型定义
- [ ] 创建 `src/types/index.ts`（所有 TypeScript 接口，含新表）
- [ ] 创建 `src/lib/supabase.ts`（Supabase 客户端初始化）
- [ ] 创建 `src/api/` 下每个实体文件：
  - `products.ts`（含 importExcel 方法）
  - `customers.ts`（含 importExcel 方法）
  - `suppliers.ts`
  - `warehouses.ts`（含 importStock 方法）
  - `orders.ts`（采购/销售/退货 CRUD + RPC 调用）
  - `reports.ts`（对账单、统计报表）
- [ ] 每个 API 函数写 JSDoc 注释（入参、返回、业务说明）
- [ ] 创建 `docs/api/README.md` 接口文档
- [ ] 创建 `src/stores/auth.ts`（登录状态）

## 阶段 4: 认证 + 主布局
- [ ] 登录页面 `/login`（邮箱密码，调用 Supabase Auth）
- [ ] 主布局：顶部导航 + 左侧折叠菜单 + 内容区（菜单用 Pinia 管理）
- [ ] 路由守卫：未登录跳转登录页

## 阶段 5: 通用组件库
- [ ] DataTable（排序、分页、自定义列）
- [ ] SearchBar（防抖搜索）
- [ ] Pagination
- [ ] ConfirmDialog
- [ ] StatusBadge（显示 draft/completed/cancelled）
- [ ] EmptyState
- [ ] ProductSelector（搜索+选择商品）
- [ ] LoadingSpinner

## 阶段 6: 商品管理
- [ ] 分类管理页面（增删改、排序）
- [ ] 商品列表页 `/products`（搜索、按分类筛选、分页）
- [ ] 新增/编辑商品页（表单含参考售价、成本价）
- [ ] 商品详情页
- [ ] 商品导入页 `/products/import`（Excel 解析 + 批量写入）

## 阶段 7: 供应商 + 仓库
- [ ] 供应商列表 `/suppliers` + 新增/编辑
- [ ] 仓库列表 `/warehouses` + 新增/编辑
- [ ] 库存查看页 `/warehouses/:id/stock`
- [ ] 期初库存导入 `/warehouses/import-stock`

## 阶段 8: 客户管理 + 专属定价
- [ ] 客户列表 `/customers` + 搜索
- [ ] 新增/编辑客户
- [ ] 客户专属定价设置页面
- [ ] 客户导入 `/customers/import`（Excel）

## 阶段 9: 采购管理
- [ ] 采购订单列表（状态筛选）
- [ ] 新建采购订单（选供应商、仓库、添加商品行）
- [ ] 采购订单详情页
- [ ] 完成采购 → 调用 complete_purchase_order RPC（扣库存+写入库流水）
- [ ] 复制订单（从已有采购单复制）

## 阶段 10: 销售管理（标准模式）
- [ ] 销售订单列表
- [ ] 新建销售订单（选客户、仓库、添加商品行、自动带价格）
- [ ] 销售订单详情页（含收款记录）
- [ ] 完成销售 → 调用 complete_sales_order RPC（扣库存+写出库流水）
- [ ] 复制订单（从已有销售单复制）

## 阶段 11: 收银模式（快速开单）
- [ ] 独立页面 `/sales/quick`
- [ ] 搜索框：按商品名称/SKU/条码搜索
- [ ] 搜索结果添加到购物车列表
- [ ] 购物车组件 CashierCart：数量调节、单价显示、小计计算
- [ ] 底部总金额自动计算
- [ ] 确认收款：弹出收款方式 → 一笔完成（创建销售单+扣库存+记收款）

## 阶段 12: 退货管理
- [ ] 采购退货单列表 `/purchase-returns`
- [ ] 新建采购退货单 + 完成（调 complete_purchase_return RPC，回冲库存+写流水）
- [ ] 销售退货单列表 `/sales-returns`
- [ ] 新建销售退货单 + 完成（调 complete_sales_return RPC，回冲库存+写流水）

## 阶段 13: 收款管理
- [ ] 在销售订单详情中录入收款
- [ ] 收款方式：现金/转账/微信/支付宝/其他

## 阶段 14: 仪表盘
- [ ] 总商品数、总客户数、总供应商数
- [ ] 低库存预警红色卡片
- [ ] 登录时弹窗提醒低库存商品
- [ ] 最近采购/销售订单列表

## 阶段 15: 报表
- [ ] 客户对账单 `/reports/customer-statement`（选客户+日期范围，生成对账表）
- [ ] 销售统计报表
- [ ] 库存报表
- [ ] 利润分析

## 阶段 16: 系统设置
- [ ] 数据导出：商品、客户、供应商、库存导出为 Excel
- [ ] 全部数据打包为 ZIP 下载
- [ ] 全局搜索功能
- [ ] 错误提示（toast）
- [ ] 全局 loading 状态

## 阶段 17: PWA + 最终打磨
- [ ] 配置 vite-plugin-pwa（生成图标、manifest）
- [ ] 添加离线 fallback 页面
- [ ] TypeScript 严格模式
- [ ] 确保全部路由正常工作
- [ ] 确保移动端菜单和布局兼容

## 阶段 18: 整体验证
- [ ] 走通完整业务流程：
  1. 导入商品/客户/期初库存
  2. 采购入库 → 库存增加
  3. 快速开单收款 → 库存减少 → 收款记录
  4. 退货 → 库存回冲
  5. 查看对账单
  6. 导出数据备份
- [ ] 验证所有 API 函数可正常工作
- [ ] 确认接口文档完整
