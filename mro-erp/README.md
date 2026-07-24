# 汇友进销存系统

工业品贸易进销存管理系统，面向小型贸易公司的一站式进销存解决方案。

## 功能模块

| 模块 | 说明 |
|------|------|
| 仪表盘 | KPI 概览、销售趋势、库存预警、异常检测、热销排行、滞销商品 |
| 商品管理 | 商品 CRUD、分类管理、批量导入、库存分布 |
| 客户管理 | 客户 CRUD、专属定价、批量导入 |
| 销售管理 | 标准销售单、快速收银（POS）、退货、收款、打印销售单/送货单/报价单 |
| 采购入库 | 采购单管理、入库确认、批次成本 |
| 库存管理 | 多仓库库存、库存调拨、库存流水、批次追踪 |
| 报表中心 | 销售报表、利润报表、库存报表、客户对账单（支持 Excel 导出和打印） |

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **样式**: Tailwind CSS
- **后端**: [Supabase](https://supabase.com) (BaaS)
- **图表**: ECharts
- **动画**: GSAP
- **PWA**: vite-plugin-pwa

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆项目
git clone https://github.com/wsxvg/MRO.git
cd MRO/mro-erp

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 配置
```

### 环境变量

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 数据库初始化

在 Supabase SQL Editor 中执行以下文件：
1. `supabase-schema.sql` — 建表 + RPC 函数
2. `supabase/migration-security-answer.sql` — 安全配置表

### 开发

```bash
npm run dev      # 启动开发服务器 http://localhost:5173
```

### 构建

```bash
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
```

## 项目结构

```
mro-erp/
├── src/
│   ├── api/          # Supabase 数据访问层
│   ├── components/   # 通用 UI 组件
│   ├── composables/  # Vue 组合式函数
│   ├── views/        # 页面视图
│   ├── stores/       # Pinia 状态管理
│   ├── types/        # TypeScript 类型定义
│   ├── lib/          # 工具库（Supabase 客户端等）
│   └── router/       # 路由配置
├── scripts/          # 辅助脚本
├── supabase/         # 数据库迁移文件
└── supabase-schema.sql  # 数据库建表 SQL
```

## 部署

### Web (GitHub Pages)

推送至 `main` 分支后自动部署至 `https://wsxvg.github.io/MRO/`

### PWA

构建时自动生成 PWA 配置，支持离线访问和安装到桌面。

## 常见问题

### Q: 登录失败？
A: 确认 `.env` 中的 Supabase URL 和 Key 正确。默认用户名 `huiyou`。

### Q: 页面刷新后 404？
A: GitHub Pages 需要配置 SPA 重定向，项目已通过 `404.html` 处理。

### Q: 如何备份数据？
A: 项目配置了 GitHub Actions 自动备份（每周日），也可在 Supabase Dashboard 手动导出。

### Q: 如何修改安全问题？
A: 在 Supabase 的 `app_config` 表中更新 `security_question` 和 `security_answer` 的值。

## 版本历史

详见 [docs/CHANGELOG.md](docs/CHANGELOG.md)
