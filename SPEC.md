# MRO 进销存系统 - 技术规格说明书 (SPEC)

> 目标读者：AI 编码助手 -- 根据此文档直接生成全部代码

## 1. 项目概述

MRO 工业品贸易公司进销存系统。主营轴承、密封件、传动件、五金工具、电气元件、润滑油脂等工业维护维修运营物资。

### 1.1 核心业务模式
向供应商采购 → 存入仓库 → 销售给客户

### 1.2 功能域
- 商品管理：分类、商品资料、价格管理、Excel 批量导入
- 供应商管理：供应商信息
- 仓库管理：多仓库、库存查看、低库存预警
- 客户管理：客户信息、客户专属定价
- 采购管理：采购订单 → 入库 → 更新库存、采购退货
- 销售管理（含收银模式）：销售订单 → 出库 → 扣库存 → 收款、销售退货
- 资金管理：收款记录
- 报表：客户对账单、销售统计、库存分析、利润分析
- API 层：统一封装的接口层，供本项目和外部项目调用

### 1.3 非功能需求
- 手机浏览器可访问（PWA）
- 操作简单直接，单人使用
- 数据安全：Supabase 自动备份
- API 优先设计：业务逻辑通过 API 层封装，支持外部项目调用
- 配套接口文档

## 2. 技术架构

Vue 3 SPA → src/api/ 统一 API 层 → supabase-js → Supabase Cloud (PostgreSQL + Auth + RPC)

### 技术栈
Vue 3.4+ + TypeScript 5 + Vite 5 + Vue Router 4 + Pinia + supabase-js 2 + Tailwind CSS 3 + vite-plugin-pwa + xlsx

### 项目结构
```
mro-erp/
├── src/
│   ├── api/            ← 统一 API 层（所有后端调用集中在此）
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── suppliers.ts
│   │   ├── warehouses.ts
│   │   ├── orders.ts
│   │   ├── reports.ts
│   │   └── index.ts
│   ├── types/          ← 共享类型定义
│   ├── composables/
│   ├── components/
│   ├── views/
│   ├── stores/
│   └── lib/
├── docs/
│   └── api/            ← API 接口文档
└── ...
```

### API 设计原则
- 每个数据实体对应一个 `src/api/<entity>.ts` 文件
- API 函数命名统一：`getXxx` / `listXxx` / `createXxx` / `updateXxx` / `deleteXxx`
- 每个函数包含 JSDoc 注释说明入参、返回值、业务逻辑
- 外部项目可直接 import `src/api/` 或直调 Supabase RPC
- API 文档同步维护在 `docs/api/` 目录下，描述所有 RPC 和 API 函数

## 3. 数据库设计 (15 张表)

所有表含 created_at / updated_at 自动时间戳

### 3.1 categories 商品分类
id bigserial PK, name text NOT NULL, sort_order int default 0

### 3.2 suppliers 供应商
id bigserial PK, name text NOT NULL, contact_person text, phone text, address text, remark text

### 3.3 warehouses 仓库
id bigserial PK, name text NOT NULL, location text, remark text

### 3.4 products 商品
id bigserial PK, category_id bigint ref categories, name text NOT NULL, sku text, barcode text, specification text, unit text default '个', supplier_id bigint ref suppliers, reference_price numeric(12,2) default 0, cost_price numeric(12,2) default 0, min_stock numeric(12,2) default 0, is_active boolean default true, remark text

> 定价说明：`reference_price` 为参考售价（商品展示用 / 新客户默认价）。实际交易价格走 `customer_prices` 客户专属价表。

### 3.5 customers 客户
id bigserial PK, name text NOT NULL, contact_person text, phone text, address text, credit_limit numeric(12,2) default 0, remark text

### 3.6 customer_prices 客户专属定价
customer_id bigint ref customers PK, product_id bigint ref products PK, price numeric(12,2) NOT NULL

### 3.7 stocks 库存
id bigserial PK, warehouse_id bigint ref warehouses NOT NULL, product_id bigint ref products NOT NULL, quantity numeric(12,2) default 0, UNIQUE(warehouse_id, product_id)

### 3.8 stock_transactions 库存流水
id bigserial PK, warehouse_id bigint ref warehouses NOT NULL, product_id bigint ref products NOT NULL, type text NOT NULL (purchase_in/purchase_return/sale_out/sale_return/transfer_in/transfer_out/adjustment), quantity numeric(12,2) NOT NULL, unit_cost numeric(12,2), ref_type text PO/SO/TF/ADJ, ref_id bigint, remark text

### 3.9 purchase_orders 采购订单
id bigserial PK, order_no text NOT NULL UNIQUE, supplier_id bigint ref suppliers NOT NULL, warehouse_id bigint ref warehouses NOT NULL, status text default 'draft' (draft/completed/cancelled), total_amount numeric(12,2) default 0, remark text

> 状态简化为三级：draft(草稿) → completed(已完成/已入库) → cancelled(已取消)

### 3.10 purchase_order_items 采购订单明细
id bigserial PK, purchase_order_id bigint ref purchase_orders NOT NULL, product_id bigint ref products NOT NULL, quantity numeric(12,2) NOT NULL, unit_cost numeric(12,2) NOT NULL, line_total generated

### 3.11 sales_orders 销售订单
id bigserial PK, order_no text NOT NULL UNIQUE, customer_id bigint ref customers NOT NULL, warehouse_id bigint ref warehouses NOT NULL, status text default 'draft' (draft/completed/cancelled), total_amount numeric(12,2) default 0, paid_amount numeric(12,2) default 0, remark text

> 状态简化为三级：draft(草稿) → completed(已完成/已出库) → cancelled(已取消)

### 3.12 sales_order_items 销售订单明细
id bigserial PK, sales_order_id bigint ref sales_orders NOT NULL, product_id bigint ref products NOT NULL, quantity numeric(12,2) NOT NULL, unit_price numeric(12,2) NOT NULL, cost_price numeric(12,2) default 0, line_total generated

### 3.13 payment_records 收款记录
id bigserial PK, sales_order_id bigint ref sales_orders NOT NULL, amount numeric(12,2) NOT NULL, payment_method text NOT NULL (cash/transfer/wechat/alipay/other), paid_at timestamptz default now(), remark text

### 3.14 stock_transfers 库存调拨（第二期实现）
id bigserial PK, order_no text NOT NULL UNIQUE, from_warehouse_id bigint ref warehouses NOT NULL, to_warehouse_id bigint ref warehouses NOT NULL, status text default 'draft', remark text

### 3.15 stock_transfer_items 调拨明细（第二期实现）
id bigserial PK, transfer_id bigint ref stock_transfers NOT NULL, product_id bigint ref products NOT NULL, quantity numeric(12,2) NOT NULL

## 4. 新增表（退货用）

### 4.1 purchase_return_orders 采购退货单
id bigserial PK, order_no text NOT NULL UNIQUE, supplier_id bigint ref suppliers NOT NULL, warehouse_id bigint ref warehouses NOT NULL, status text default 'draft' (draft/completed/cancelled), total_amount numeric(12,2) default 0, remark text

### 4.2 purchase_return_items 采购退货明细
id bigserial PK, return_order_id bigint ref purchase_return_orders NOT NULL, product_id bigint ref products NOT NULL, quantity numeric(12,2) NOT NULL, unit_cost numeric(12,2) NOT NULL, line_total generated

### 4.3 sales_return_orders 销售退货单
id bigserial PK, order_no text NOT NULL UNIQUE, customer_id bigint ref customers NOT NULL, warehouse_id bigint ref warehouses NOT NULL, status text default 'draft' (draft/completed/cancelled), total_amount numeric(12,2) default 0, remark text

### 4.4 sales_return_items 销售退货明细
id bigserial PK, return_order_id bigint ref sales_return_orders NOT NULL, product_id bigint ref products NOT NULL, quantity numeric(12,2) NOT NULL, unit_price numeric(12,2) NOT NULL, line_total generated

## 5. RPC 存储过程

### complete_purchase_order(p_order_id)
验证 draft 状态 → 逐行更新 stocks (+库存) → 记录 stock_transactions(type=purchase_in) → 更新 cost_price → 标记 completed

### complete_sales_order(p_order_id)
验证 draft → 逐行检查库存 → 扣减 stocks → 记录流水(type=sale_out) → 回写成本价 → 标记 completed

### complete_purchase_return(p_return_id)
验证 draft → 扣减 stocks(type=purchase_return, -库存) → 记录流水 → 标记 completed

### complete_sales_return(p_return_id)
验证 draft → 增加 stocks(type=sale_return, +库存) → 记录流水 → 标记 completed

### complete_transfer(p_transfer_id)（第二期）
验证 draft → 检查源库存 → 扣减源仓 → 增加目标仓 → 记录流水 → 标记 completed

## 6. 触发器
- update_updated_at() 函数，每张含 updated_at 的表都有 BEFORE UPDATE 触发器
- 自动生成 order_no（格式: PO/SO/PR/SR/TF-YYYYMMDD-序列）

## 7. RLS 策略
所有表启用 RLS，全员可读可写（单人使用场景）

## 8. 路由

### 核心模块
/login 登录
/ 仪表盘

### 商品管理
/products 商品列表
/products/new 新增商品
/products/:id 商品详情/编辑
/products/import 导入商品（Excel）

### 供应商
/suppliers 供应商列表
/suppliers/new 新增供应商
/suppliers/:id 供应商详情

### 仓库
/warehouses 仓库列表
/warehouses/new 新增仓库
/warehouses/:id/stock 库存查看
/warehouses/import-stock 导入期初库存（Excel）

### 客户
/customers 客户列表
/customers/new 新增客户
/customers/:id 客户详情
/customers/:id/pricing 客户专属定价
/customers/import 导入客户（Excel）

### 采购
/purchases 采购订单列表
/purchases/new 新建采购订单
/purchases/:id 采购订单详情
/purchase-returns 采购退货单列表
/purchase-returns/new 新建采购退货单
/purchase-returns/:id 采购退货单详情

### 销售
/sales 销售订单列表
/sales/quick 收银模式（快速开单）
/sales/new 新建销售订单
/sales/:id 销售订单详情
/sales-returns 销售退货单列表
/sales-returns/new 新建销售退货单
/sales-returns/:id 销售退货单详情

### 报表
/reports/customer-statement 客户对账单
/reports/sales 销售统计
/reports/inventory 库存报表
/reports/profit 利润分析

### 系统
/settings 系统设置（含数据导出）

## 9. 收银模式（快速开单）

独立页面 `/sales/quick`，流程：

1. 顶部搜索框：按商品名称/SKU/条码搜索，下拉展示匹配商品
2. 搜索结果点击添加到"购物车"列表
3. 购物车列表：商品名、数量（可调）、单价（自动带客户价 or 参考价）、小计
4. 底部：自动计算总金额
5. "确认收款"按钮 → 弹出收款方式选择 → 确认 → 后端创建已完成状态销售单 + 扣库存 + 记流水 + 记收款

> 收银模式下不走草稿流程，一步完成销售出库+收款。

## 10. Excel 导入

三个导入入口，都使用 xlsx 库解析标准模板：

### 商品导入 (/products/import)
模板列：名称、SKU、规格、单位、分类、参考售价、成本价、最低库存
匹配方式：分类名 → categories 表查找/创建

### 客户导入 (/customers/import)
模板列：名称、联系人、电话、地址、信用额度

### 期初库存导入 (/warehouses/import-stock)
模板列：商品名称/SKU、仓库名称、期初数量
匹配方式：商品名/SKU → products 表查找，仓库名 → warehouses 表查找

## 11. 客户对账单报表

`/reports/customer-statement`

参数：客户、开始日期、结束日期

SQL 逻辑：
```
期初欠款 = 截至开始日期前该客户所有销售单应收 - 已收
本期销售 = 日期范围内该客户所有 completed 销售单合计
本期收款 = 日期范围内该客户所有收款记录合计
期末欠款 = 期初欠款 + 本期销售 - 本期收款
```

展示格式：表格（日期、单据号、摘要、应收、已收、余额）+ 底部汇总

## 12. 通用组件
DataTable, SearchBar, Pagination, ConfirmDialog, StatusBadge, EmptyState, ProductSelector, LoadingSpinner, CashierCart（收银购物车组件）

## 13. PWA 配置
名称: MRO 进销存, short_name: MRO, theme_color: #1e40af, registerType: autoUpdate

## 14. 库存预警
- Dashboard 用红色醒目卡片展示低库存商品数量
- 登录时如果存在低库存商品，弹窗提醒

## 15. 数据导出
系统设置页提供"导出全部数据"功能：
- 商品、客户、供应商、库存导出为 Excel
- 所有订单导出为 Excel
- 打包为 ZIP 下载

## 16. 接口文档

位置: `docs/api/README.md`

内容：
- 所有 RPC 函数签名（入参、返回值、业务说明）
- API 层函数列表（src/api/ 下每个函数）
- 调用示例
- 从外部项目调用的方式说明

格式示例：
```typescript
/**
 * 完成销售订单（出库+扣库存+收款）
 * @param p_order_id - 销售订单ID
 * @returns void
 * 流程: 验证draft → 逐行扣库存 → 记录流水 → 更新成本 → 标记completed
 * 调用: await supabase.rpc('complete_sales_order', { p_order_id: 123 })
 */
```
