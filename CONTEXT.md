# MRO 进销存系统 - 项目概览

## 基本信息
- **项目名称**: MRO 进销存系统
- **用途**: 工业品贸易进销存管理
- **用户**: 2人（私人小公司）
- **技术栈**: Vue 3 + TypeScript + Supabase + Tailwind CSS + PWA

## 目录结构
```
MRO/
├── mro-erp/                 # 主项目
│   ├── src/
│   │   ├── api/             # API 层（Supabase 查询）
│   │   ├── components/      # 通用组件
│   │   ├── composables/     # 组合式函数
│   │   ├── lib/             # 工具库（supabase.ts）
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── types/           # TypeScript 类型定义
│   │   └── views/           # 页面视图
│   │       ├── customers/   # 客户管理
│   │       ├── products/    # 商品管理
│   │       ├── reports/     # 报表
│   │       ├── sales/       # 销售管理
│   │       ├── settings/    # 系统设置
│   │       └── warehouses/  # 仓库管理
│   ├── supabase-schema.sql  # 数据库 Schema
│   └── .env                 # 环境变量（已 gitignore）
└── docs/                    # 文档
```

## 核心功能模块
1. **商品管理** - 商品 CRUD、分类、导入导出
2. **客户管理** - 客户 CRUD、专属定价、导入导出
3. **销售管理** - 销售单、快速开单、退货
4. **仓库管理** - 仓库 CRUD、库存、调拨、导入
5. **报表统计** - 销售报表、库存报表、利润报表、客户对账单

## 数据库（Supabase）
- **主要表**: products, customers, sales_orders, stocks, warehouses
- **认证**: Supabase Auth（单用户 huiyou@mro-dev.xyz）
- **RLS**: 当前设置为全员可读写（适合小团队）

## 关键配置
- **默认仓库**: 必须在仓库管理中设置，否则快速开单按钮禁用
- **ECharts**: 已按需引入（LineChart, PieChart）
- **PWA**: 支持离线访问和安装到桌面

## 已知问题
- `.env` 中有 Supabase Service Role Key（仅脚本使用，前端不打包）
- 没有测试代码
- 没有 README

## 构建命令
```bash
cd mro-erp
npm run dev      # 开发
npm run build    # 构建（会先运行 vue-tsc）
```

## 最近优化（2026-05-23）
- ECharts 按需引入（1.1MB → 543KB）
- 清理 dist 重复文件
- 添加 Supabase 代码分割
- 修复 sku 类型定义（改为可选）
- 修复 order_no 歧义错误（显式指定 select 字段）
- 修复 line_total 生成列问题（移除手动计算）
- 仓库编辑页面添加"设为默认仓库"选项

## 自动备份方案
- **方式**: GitHub Actions 自动备份到私有仓库
- **频率**: 每周日凌晨 3 点（UTC）
- **配置**: 需要在 GitHub 仓库设置 Secrets
  - `SUPABASE_ACCESS_TOKEN` - Supabase 访问令牌
  - `SUPABASE_DB_URL` - 数据库连接字符串
- **文件**: `.github/workflows/backup.yml`
- **存储**: `backups/` 目录，按日期命名

## Supabase 免费额度
- 数据库存储：500 MB（10 年预估使用 ~15 MB，完全够用）
- 不需要分多个项目部署
