# MRO 进销存系统

面向工业品贸易的轻量级进销存管理系统，支持商品管理、客户管理、销售开单、仓库库存和数据报表。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Pinia |
| 后端服务 | Supabase (Auth + PostgreSQL + Realtime) |
| 图表 | ECharts (按需引入) |
| Excel | SheetJS (xlsx) |
| 桌面端 | Tauri v2 |
| PWA | vite-plugin-pwa |

## 功能模块

### 仪表盘
- 本月销售额、库存周转率、低库存预警 KPI 卡片
- 销售趋势折线图（支持本月/上月/本年切换）
- 最近订单列表、库存分类饼图、待处理事项

### 商品管理
- 商品 CRUD（名称、SKU、规格、单位、参考售价、成本价）
- 商品分类管理
- 批量导入/导出（Excel）
- 库存数量查看

### 客户管理
- 客户 CRUD（名称、类型、联系人、电话、地址、信用额度）
- 客户专属定价
- 批量导入

### 销售管理
- 销售单创建与编辑
- 快速开单（商品搜索 → 加入购物车 → 一键下单）
- 销售退货单
- 支持多种支付方式（现金、转账、微信、支付宝）

### 仓库管理
- 仓库 CRUD，支持设为默认仓库
- 库存查看与管理
- 入库/出库/调拨/盘点
- 库存批量导入

### 报表统计
- 销售报表（按日/月汇总）
- 库存报表（含低库存预警）
- 利润报表（销售额、成本、毛利）
- 客户对账单

### 系统设置
- 计量单位管理
- 商品分类管理
- 安全设置（密码修改）

## 项目结构

```
MRO/
├── mro-erp/                    # 主项目
│   ├── src/
│   │   ├── api/                # API 层（Supabase 查询封装）
│   │   │   ├── index.ts        # API 聚合导出
│   │   │   ├── products.ts     # 商品 + 分类 API
│   │   │   ├── customers.ts    # 客户 API
│   │   │   ├── orders.ts       # 销售单 + 退货 API
│   │   │   ├── warehouses.ts   # 仓库 API
│   │   │   ├── stockTransactions.ts  # 库存事务 API
│   │   │   ├── reports.ts      # 报表 API
│   │   │   └── units.ts        # 计量单位 API
│   │   ├── components/         # 通用 UI 组件
│   │   ├── composables/        # 组合式函数
│   │   │   ├── useAuth.ts      # 认证状态
│   │   │   ├── useToast.ts     # 通知提示
│   │   │   ├── useDebounce.ts  # 防抖
│   │   │   ├── useRealtime.ts  # Supabase Realtime
│   │   │   └── useCostPriceAccess.ts  # 成本价权限
│   │   ├── lib/
│   │   │   ├── supabase.ts     # Supabase 客户端
│   │   │   ├── errorHandler.ts # 错误处理
│   │   │   └── utils.ts        # 工具函数
│   │   ├── router/             # Vue Router 路由配置
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── types/              # TypeScript 类型定义
│   │   └── views/              # 页面视图
│   │       ├── Dashboard.vue
│   │       ├── Login.vue
│   │       ├── Layout.vue
│   │       ├── customers/      # 客户管理页面
│   │       ├── products/       # 商品管理页面
│   │       ├── sales/          # 销售管理页面
│   │       ├── warehouses/     # 仓库管理页面
│   │       ├── reports/        # 报表页面
│   │       └── settings/       # 设置页面
│   ├── src-tauri/              # Tauri 桌面应用配置
│   ├── scripts/                # 工具脚本
│   ├── vite.config.ts          # Vite 配置
│   ├── tailwind.config.js      # Tailwind 配置
│   └── package.json
├── scripts/                    # 项目级脚本
│   ├── backup-supabase.mjs     # 数据库备份
│   └── supabase-sql.js         # SQL 执行工具
├── docs/                       # 文档
└── .github/workflows/          # CI/CD
    ├── deploy-web.yml          # GitHub Pages 自动部署
    └── release.yml             # Tauri 桌面应用发布
```

## 快速开始

### 环境要求

- Node.js 20+
- npm

### 安装

```bash
git clone <repo-url>
cd MRO/mro-erp
npm install
```

### 环境变量

在 `mro-erp/` 目录下创建 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEFAULT_PASSWORD=your-default-password
```

### 开发

```bash
npm run dev        # 启动开发服务器 (http://localhost:5173)
```

### 构建

```bash
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览构建产物
```

### 桌面应用 (Tauri)

```bash
npx tauri dev      # 开发模式
npx tauri build    # 构建桌面安装包
```

## 数据库

使用 Supabase (PostgreSQL) 作为后端，主要数据表：

| 表名 | 说明 |
|------|------|
| `products` | 商品信息 |
| `categories` | 商品分类 |
| `customers` | 客户信息 |
| `customer_prices` | 客户专属定价 |
| `warehouses` | 仓库 |
| `stocks` | 库存 |
| `stock_transactions` | 库存事务记录 |
| `sales_orders` | 销售单 |
| `sales_order_items` | 销售单明细 |
| `payment_records` | 收款记录 |
| `sales_return_orders` | 退货单 |
| `sales_return_items` | 退货明细 |
| `units` | 计量单位 |

数据库 Schema 参见 [`supabase-schema.sql`](supabase-schema.sql)。

## 部署

### GitHub Pages (自动)

推送到 `main` 分支自动触发 GitHub Actions 构建并部署到 GitHub Pages。

### 数据库备份

通过 GitHub Actions 定时备份（每周日凌晨 3 点 UTC），需配置 Secrets：

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_URL`

## 路由一览

| 路径 | 页面 |
|------|------|
| `/login` | 登录 |
| `/dashboard` | 仪表盘 |
| `/products` | 商品列表 |
| `/products/new` | 新建商品 |
| `/products/:id` | 编辑商品 |
| `/products/:id/stock` | 商品库存 |
| `/products/import` | 商品导入 |
| `/customers` | 客户列表 |
| `/customers/new` | 新建客户 |
| `/customers/:id` | 编辑客户 |
| `/customers/:id/pricing` | 客户定价 |
| `/customers/import` | 客户导入 |
| `/sales` | 销售单列表 |
| `/sales/quick` | 快速开单 |
| `/sales/new` | 新建销售单 |
| `/sales/:id` | 销售单详情 |
| `/sales-returns` | 退货列表 |
| `/sales-returns/new` | 新建退货 |
| `/sales-returns/:id` | 退货详情 |
| `/reports/sales` | 销售报表 |
| `/reports/inventory` | 库存报表 |
| `/reports/profit` | 利润报表 |
| `/reports/customer-statement` | 客户对账单 |
| `/settings/warehouses` | 仓库管理 |
| `/settings/categories` | 分类管理 |
| `/settings/units` | 计量单位 |
| `/settings/security` | 安全设置 |

## License

Private
