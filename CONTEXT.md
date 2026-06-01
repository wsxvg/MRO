# MRO 进销存系统 - 完整架构手册

> 最后更新: 2026-05-30 | 由 CodeGraph 索引自动生成

## 基本信息
- **项目名称**: MRO 进销存系统（工业品贸易进销存管理）
- **用户**: 2人私人小公司
- **技术栈**: Vue 3 + TypeScript + Supabase (BaaS) + Tailwind CSS + Vite
- **部署**: GitHub Pages + PWA + Tauri 桌面端
- **架构模式**: 纯前端 + Supabase BaaS，无自建后端

---

## 目录结构
```
mro-erp/
├── src/
│   ├── api/                    # 数据访问层（所有 Supabase 操作）
│   │   ├── products.ts         # 商品/分类/单位 CRUD
│   │   ├── customers.ts        # 客户 CRUD + 专属价格
│   │   ├── orders.ts           # 销售单/退货单/收款
│   │   ├── warehouses.ts       # 仓库/库存/流水
│   │   └── reports.ts          # 报表统计查询
│   ├── components/             # 通用 UI 组件
│   │   ├── BasePageHeader.vue  # 页面标题栏
│   │   ├── BaseTable.vue       # 通用表格（支持列定义/排序/插槽）
│   │   ├── BaseCard.vue        # 卡片容器
│   │   ├── BaseModal.vue       # 模态弹窗
│   │   ├── ConfirmDialog.vue   # 确认对话框
│   │   ├── FilterBar.vue       # 搜索+筛选栏
│   │   ├── SearchableSelect.vue# 可搜索下拉选择
│   │   ├── StatCard.vue        # 统计数字卡片
│   │   └── ToastNotification.vue # 全局消息提示
│   ├── composables/            # 组合式函数
│   │   ├── useToast.ts         # Toast 消息管理
│   │   └── useUpdateChecker.ts # PWA 更新检测
│   ├── lib/
│   │   └── supabase.ts         # Supabase 客户端初始化
│   ├── router/
│   │   └── index.ts            # 路由配置 + 鉴权守卫
│   ├── stores/
│   │   └── auth.ts             # 认证状态（Pinia/Vue ref）
│   ├── types/
│   │   └── index.ts            # 全局 TypeScript 类型定义
│   ├── views/
│   │   ├── App.vue             # 根组件
│   │   ├── Login.vue           # 登录页
│   │   ├── Layout.vue          # 主布局（侧边栏+顶栏+内容区）
│   │   ├── Dashboard.vue       # 首页仪表盘
│   │   ├── products/           # 商品管理
│   │   ├── customers/          # 客户管理
│   │   ├── sales/              # 销售管理
│   │   ├── warehouses/         # 仓库管理
│   │   └── reports/            # 报表中心
│   └── main.ts                 # 应用入口
├── scripts/                    # 数据初始化脚本
├── .env                        # 环境变量（gitignore）
└── supabase-schema.sql         # 数据库建表 SQL
```

---

## 数据模型 (`types/index.ts`)

### 核心实体关系图
```
Unit (计量单位) ──────────┐
Category (商品分类) ──────┤
                          ▼
                      Product (商品) ──────┬── Stock (库存) ─── Warehouse (仓库)
                                           │
                                           └── CustomerPrice (客户专属价格) ── Customer (客户)
                                                                                    │
Warehouse ──────────────────────────────────────────────────────────────────────────┤
                                                                                    │
                  SalesOrder (销售单) ──┬── SalesOrderItem (销售明细) ── Product     │
                                       │                                            │
                                       ├── PaymentRecord (收款记录)                  │
                                       │                                            │
                                       └── SalesReturnOrder (退货单) ── Customer ───┘
```

### 全部接口定义
| 接口 | 文件位置 | 关键字段 |
|------|---------|---------|
| `Timestamps` | types/index.ts:8 | `created_at`, `updated_at` |
| `Unit` | types/index.ts:14 | `id`, `name`, `sort_order` |
| `Category` | types/index.ts:23 | `id`, `name`, `sort_order` |
| `Warehouse` | types/index.ts:32 | `id`, `name`, `location`, `is_default` |
| `Product` | types/index.ts:43 | `id`, `name`, `specification`, `category_id`, `unit_id`, `reference_price`, `cost_price`, `is_active` |
| `Customer` | types/index.ts:63 | `id`, `name`, `contact_person`, `phone`, `address`, `type`(retail/wholesale) |
| `CustomerPrice` | types/index.ts:77 | `customer_id`, `product_id`, `price` |
| `Stock` | types/index.ts:87 | `id`, `product_id`, `warehouse_id`, `quantity`, `min_stock` |
| `StockTransaction` | types/index.ts:102 | `id`, `product_id`, `warehouse_id`, `type`, `quantity`, `reference_no` |
| `SalesOrder` | types/index.ts:119 | `id`, `order_no`, `customer_id`, `warehouse_id`, `status`, `total_amount`, `paid_amount` |
| `SalesOrderItem` | types/index.ts:137 | `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `cost_price`, `line_total` |
| `PaymentRecord` | types/index.ts:151 | `id`, `order_id`, `amount`, `method`, `remark` |
| `SalesReturnOrder` | types/index.ts:164 | `id`, `return_no`, `original_order_id`, `customer_id`, `status`, `total_amount` |
| `ApiResult<T>` | types/index.ts:218 | `data: T \| null`, `error: string \| null` |
| `ListResponse<T>` | types/index.ts:212 | `data: T[]`, `count: number`, `error: string \| null` |

### 订单状态流转
```
SalesOrder.status:  draft → completed
                    draft → cancelled

SalesReturnOrder.status:  draft → completed
```

---

## API 层详解 (`api/`)

所有 API 统一返回 `ApiResult<T>` 或 `ListResponse<T>`，通过 Supabase 客户端直接操作数据库。

### products.ts — 商品/分类/单位
| 函数 | 签名 | 说明 |
|------|------|------|
| `createCategory` | `(input: Pick<Category, 'name' \| 'sort_order'>) → ApiResult<Category>` | 创建分类 |
| `fetchCategories` | `() → ListResponse<Category>` | 获取所有分类 |
| `updateCategory` | `(id, input) → ApiResult<Category>` | 更新分类 |
| `deleteCategory` | `(id: number) → ApiResult<null>` | 删除分类 |
| `createUnit` | `(input: Pick<Unit, 'name' \| 'sort_order'>) → ApiResult<Unit>` | 创建单位 |
| `fetchUnits` | `() → ListResponse<Unit>` | 获取所有单位 |
| `updateUnit` | `(id, input) → ApiResult<Unit>` | 更新单位 |
| `deleteUnit` | `(id: number) → ApiResult<null>` | 删除单位 |
| `fetchProducts` | `(params?) → ListResponse<Product>` | 分页/搜索/筛选商品列表 |
| `fetchProduct` | `(id: number) → ApiResult<Product>` | 获取单个商品 |
| `createProduct` | `(input) → ApiResult<Product>` | 创建商品 |
| `updateProduct` | `(id, input) → ApiResult<Product>` | 更新商品 |
| `deleteProduct` | `(id: number) → ApiResult<null>` | 删除商品 |
| `batchDisableProducts` | `(ids: number[]) → ApiResult<null>` | 批量停用商品 |

### customers.ts — 客户/专属价格
| 函数 | 签名 | 说明 |
|------|------|------|
| `fetchCustomers` | `(params?) → ListResponse<Customer>` | 分页/搜索/筛选客户列表 |
| `fetchCustomer` | `(id: number) → ApiResult<Customer>` | 获取单个客户 |
| `createCustomer` | `(input) → ApiResult<Customer>` | 创建客户 |
| `updateCustomer` | `(id, input) → ApiResult<Customer>` | 更新客户 |
| `deleteCustomer` | `(id: number) → ApiResult<null>` | 删除客户 |
| `batchDeleteCustomers` | `(ids: number[]) → ApiResult<null>` | 批量删除客户 |
| `fetchCustomerPrices` | `(customerId: number) → ListResponse<CustomerPrice>` | 获取客户专属价格 |
| `upsertCustomerPrices` | `(prices[]) → ApiResult<null>` | 批量更新客户专属价格 |
| `deleteCustomerPrice` | `(customerId, productId) → ApiResult<null>` | 删除某条专属价格 |

### orders.ts — 销售/退货/收款
| 函数 | 签名 | 说明 |
|------|------|------|
| `fetchSalesOrders` | `(params?) → ListResponse<SalesOrder>` | 分页/筛选销售单列表 |
| `fetchSalesOrder` | `(id: number) → ApiResult<SalesOrder>` | 获取单个销售单 |
| `createSalesOrder` | `(input) → ApiResult<SalesOrder>` | 创建销售单（INSERT sales_orders） |
| `updateSalesOrder` | `(id, input) → ApiResult<SalesOrder>` | 更新销售单 |
| `completeSalesOrder` | `(id: number) → ApiResult<null>` | 完成销售单（RPC: `complete_sales_order`，扣减库存+更新应收） |
| `cancelSalesOrder` | `(id: number) → ApiResult<null>` | 取消销售单 |
| `deleteSalesOrder` | `(id: number) → ApiResult<null>` | 删除草稿销售单 |
| `fetchOrderItems` | `(orderId: number) → ListResponse<SalesOrderItem>` | 获取订单明细 |
| `createOrderItems` | `(items[]) → ApiResult<null>` | 批量创建订单明细 |
| `fetchSalesReturns` | `(params?) → ListResponse<SalesReturnOrder>` | 退货单列表 |
| `fetchSalesReturn` | `(id: number) → ApiResult<SalesReturnOrder>` | 获取单个退货单 |
| `createSalesReturn` | `(input) → ApiResult<SalesReturnOrder>` | 创建退货单 |
| `completeSalesReturn` | `(id: number) → ApiResult<null>` | 完成退货单（RPC，恢复库存） |
| `createPayment` | `(input) → ApiResult<PaymentRecord>` | 创建收款记录 |
| `fetchPayments` | `(orderId: number) → ListResponse<PaymentRecord>` | 获取订单收款记录 |

### warehouses.ts — 仓库/库存
| 函数 | 签名 | 说明 |
|------|------|------|
| `fetchWarehouses` | `() → ListResponse<Warehouse>` | 获取所有仓库 |
| `fetchWarehouse` | `(id: number) → ApiResult<Warehouse>` | 获取单个仓库 |
| `createWarehouse` | `(input) → ApiResult<Warehouse>` | 创建仓库 |
| `updateWarehouse` | `(id, input) → ApiResult<Warehouse>` | 更新仓库 |
| `deleteWarehouse` | `(id: number) → ApiResult<null>` | 删除仓库 |
| `fetchDefaultWarehouse` | `() → ApiResult<Warehouse>` | 获取默认仓库（快速开单依赖） |
| `fetchWarehouseStock` | `(warehouseId: number) → ListResponse<Stock>` | 获取仓库库存 |
| `fetchProductStock` | `(productId: number) → ListResponse<Stock>` | 获取商品在各仓库的库存 |
| `importStock` | `(warehouseId, items[]) → ApiResult<null>` | 批量入库 |
| `stockIn` | `(productId, warehouseId, qty) → ApiResult<null>` | 单品入库 |
| `fetchStockTransactions` | `(params?) → ListResponse<StockTransaction>` | 库存流水查询 |

### reports.ts — 报表统计
| 函数 | 签名 | 说明 |
|------|------|------|
| `fetchDashboardStats` | `() → ApiResult<DashboardStats>` | 仪表盘汇总数据 |
| `fetchSalesSummary` | `(params?) → ListResponse<{date, total_amount, order_count}>` | 按日汇总销售（客户端分组） |
| `fetchCustomerStatement` | `(params?) → ListResponse<StatementRow>` | 客户对账单（订单+收款） |
| `fetchInventoryReport` | `(params?) → ListResponse<InventoryRow>` | 库存报表（按仓库/商品） |
| `fetchProfitReport` | `(params?) → ListResponse<ProfitRow>` | 利润报表（每单毛利=销售额-成本） |

**关键业务逻辑**:
- `fetchSalesSummary`: 从 `sales_orders` 拉取 completed 订单，在客户端按日期 `Map` 聚合
- `fetchProfitReport`: JOIN `sales_orders` + `sales_order_items`，`gross_profit = total_amount - Σ(cost_price × quantity)`
- `completeSalesOrder`: 调用 Supabase RPC `complete_sales_order`，服务端事务处理库存扣减

---

## 路由结构

```
/login                          → Login.vue（无需鉴权）
/                               → 重定向到 /dashboard

（以下均在 Layout.vue 布局内，需要鉴权）
/dashboard                      → Dashboard.vue（仪表盘）

/products                       → ProductList.vue（商品列表）
/products/new                   → ProductForm.vue（新增商品）
/products/:id                   → ProductForm.vue（编辑商品）
/products/import                → ProductImport.vue（批量导入）
/products/:id/stock             → ProductStock.vue（商品库存分布）

/customers                      → CustomerList.vue（客户列表）
/customers/new                  → CustomerForm.vue（新增客户）
/customers/:id                  → CustomerForm.vue（编辑客户）
/customers/import               → CustomerImport.vue（批量导入）
/customers/:id/pricing          → CustomerPricing.vue（专属价格）

/sales                          → SaleList.vue（销售单列表，含退货 Tab）
/sales/new                      → SaleForm.vue（新增销售单）
/sales/:id                      → SaleForm.vue（编辑/查看销售单）
/sales/quick                    → SaleQuick.vue（快速收银）
/sales-returns/new              → SaleReturnForm.vue（新增退货单）
/sales-returns/:id              → SaleReturnForm.vue（编辑/查看退货单）

/settings/warehouses            → WarehouseList.vue（仓库列表）
/settings/warehouses/new        → WarehouseForm.vue（新增仓库）
/settings/warehouses/:id        → WarehouseForm.vue（编辑仓库）
/settings/warehouses/:id/stock  → WarehouseStock.vue（仓库库存明细）
/settings/warehouses/import-stock → StockImport.vue（批量导入库存）
/settings/warehouses/transactions → StockTransactions.vue（库存流水）

/reports/sales                  → SalesReport.vue（销售报表）
/reports/profit                 → ProfitReport.vue（利润报表）
/reports/inventory              → InventoryReport.vue（库存报表）
/reports/customer-statement     → CustomerStatement.vue（客户对账单）
```

---

## 鉴权流程

```
用户输入 username + password
    ↓
stores/auth.ts → login(username, password)
    ↓
校验 username === 常量 DEFAULT_USERNAME
    ↓
supabase.auth.signInWithPassword({ email: DEFAULT_EMAIL, password })
    ↓
成功 → loggedIn.value = true → router.push('/dashboard')
失败 → 返回错误信息（中文提示）
    ↓
路由守卫 (router/index.ts):
  beforeEach → 检查 supabase.auth.getSession()
  → 无 session 且非 /login → 重定向 /login
  → 有 session → 放行
```

**Supabase 配置** (`lib/supabase.ts`):
- URL: `import.meta.env.VITE_SUPABASE_URL`
- Key: `import.meta.env.VITE_SUPABASE_ANON_KEY`
- Auth: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`

---

## 核心数据流

### 1. 快速收银流程 (SaleQuick)
```
选择商品 → items[] (购物车)
    ↓
调整数量/单价 → 自动计算 line_total
    ↓
点击结算 → createSalesOrder({ customer_id, warehouse_id, status:'draft', total_amount })
    ↓
成功 → createOrderItems([{ order_id, product_id, quantity, unit_price, cost_price, line_total }])
    ↓
成功 → completeSalesOrder(order_id)  // RPC: 扣库存 + 更新应收
    ↓
完成 → 清空购物车，Toast 提示
```

### 2. 标准销售单流程 (SaleForm)
```
填写表单（客户、仓库、备注）
    ↓
添加商品明细（每行: 商品、数量、单价）
    ↓
保存草稿 → createSalesOrder(status:'draft') + createOrderItems()
    ↓
完成订单 → completeSalesOrder(id)  // 调用 RPC，不可逆
    ↓
可追加收款 → createPayment({ order_id, amount, method })
```

### 3. 退货流程 (SaleReturnForm)
```
选择原始销售单 → 加载原单明细
    ↓
选择退货商品/数量
    ↓
保存 → createSalesReturn()
    ↓
完成 → completeSalesReturn(id)  // RPC: 恢复库存
```

### 4. 报表数据流
```
Dashboard:
  fetchDashboardStats() → 汇总卡片（总销售额、订单数、客户数、库存量）
  fetchSalesSummary() → 趋势折线图

SalesReport:
  fetchSalesSummary({ date_from, date_to }) → 按日聚合 → StatCard + 表格

ProfitReport:
  fetchProfitReport({ date_from, date_to }) → 每单毛利 → 汇总 + 明细表

CustomerStatement:
  fetchCustomerStatement({ customer_id, date_from, date_to }) → 订单+收款流水
```

---

## 公共组件使用指南

| 组件 | 用途 | 关键 Props |
|------|------|-----------|
| `BasePageHeader` | 页面标题+返回按钮+右侧操作区 | `title`, `to`(返回路径) |
| `BaseTable` | 通用数据表格 | `columns: Column[]`, `data`, `empty-text` |
| `BaseCard` | 卡片容器 | 无特殊 props，用 slot 填充 |
| `BaseModal` | 模态弹窗 | `modelValue`(v-model), `title` |
| `ConfirmDialog` | 确认操作弹窗 | `modelValue`, `title`, `message`, `onConfirm` |
| `FilterBar` | 搜索+筛选栏 | `v-model`(搜索值), `filters: FilterItem[]`, `show-search` |
| `SearchableSelect` | 可搜索下拉 | `options: SelectOption[]`, `v-model`, `placeholder` |
| `StatCard` | 统计数字展示 | `label`, `value`, `color` |

**BaseTable Column 定义**:
```typescript
interface Column {
  key: string           // 数据字段名
  label: string         // 表头显示
  align?: 'left' | 'center' | 'right'
  width?: string
  sortable?: boolean
}
```

---

## 关键约定

### 统一 API 返回格式
```typescript
// 单条记录
interface ApiResult<T> {
  data: T | null
  error: string | null
}

// 列表
interface ListResponse<T> {
  data: T[]
  count: number
  error: string | null
}
```

### 按钮样式约定
- `btn-primary` — 主操作（新增、保存、提交）
- `btn-secondary` — 次操作（导入、导出、取消）
- `btn-icon` — 图标按钮

### 页面布局约定
- 所有页面包裹在 `Layout.vue` 中（侧边栏+顶栏+内容区）
- 内容区使用 `class="page-padding"` 统一间距
- 详情/表单页使用 `max-w-2xl` 或 `max-w-5xl` 限制宽度

---

## 环境变量
```
VITE_SUPABASE_URL=        # Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=   # Supabase 匿名 Key（前端使用）
```

## 构建命令
```bash
cd mro-erp
npm run dev       # 开发服务器
npm run build     # 生产构建（先 vue-tsc 类型检查，再 vite build）
npm run preview   # 预览构建产物
```

## 部署
- **GitHub Actions**: `.github/workflows/deploy-web.yml` → GitHub Pages
- **PWA**: 支持离线访问和安装到桌面
- **Tauri**: 桌面端打包（NSIS perUser 安装）

---

## 已知约束
- 无后端权限控制，RLS 设为全员可读写（适合 2 人团队）
- 报表聚合在客户端完成（数据量小，无需服务端视图）
- `completeSalesOrder` / `completeSalesReturn` 通过 Supabase RPC 执行，库存扣减逻辑在数据库函数中
- 无测试代码
- 没有 README
- `.env` 中有 Supabase Service Role Key（仅脚本使用，前端不打包）

---

## Supabase 免费额度
- 数据库存储：500 MB（10 年预估使用 ~15 MB，完全够用）
- 不需要分多个项目部署

## 自动备份方案
- **方式**: GitHub Actions 自动备份到私有仓库
- **频率**: 每周日凌晨 3 点（UTC）
- **配置**: 需要在 GitHub 仓库设置 Secrets
  - `SUPABASE_ACCESS_TOKEN` — Supabase 访问令牌
  - `SUPABASE_DB_URL` — 数据库连接字符串
- **文件**: `.github/workflows/backup.yml`
- **存储**: `backups/` 目录，按日期命名

## 历史优化记录

### 2026-05-23
- ECharts 按需引入（1.1MB → 543KB）
- 清理 dist 重复文件
- 添加 Supabase 代码分割
- 修复 sku 类型定义（改为可选）
- 修复 order_no 歧义错误（显式指定 select 字段）
- 修复 line_total 生成列问题（移除手动计算）
- 仓库编辑页面添加"设为默认仓库"选项
