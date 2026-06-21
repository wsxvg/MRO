# 版本更新日志

> 本文档记录项目的重要变更，方便后续维护和回溯。

---

## v1.0.0 — 2026-06-21（当前版本）

### 基本信息
- **版本号**: 1.0.0
- **发布日期**: 2026-06-21
- **技术栈**: Vue 3 + TypeScript + Supabase BaaS + Tailwind CSS + Vite + Tauri
- **部署地址**: https://wsxvg.github.io/MRO/

### 功能模块
| 模块 | 状态 | 说明 |
|------|------|------|
| 仪表盘 | ✅ 完成 | KPI 卡片、销售趋势、库存预警、异常检测、热销排行 |
| 商品管理 | ✅ 完成 | CRUD、分类管理、批量导入、库存分布 |
| 客户管理 | ✅ 完成 | CRUD、专属定价、批量导入 |
| 销售管理 | ✅ 完成 | 标准销售单、快速收银（POS）、退货、收款 |
| 采购入库 | ✅ 完成 | 采购单管理、入库确认、批次成本 |
| 库存管理 | ✅ 完成 | 多仓库、调拨、流水、批次追踪 |
| 报表中心 | ✅ 完成 | 销售报表、利润报表、库存报表、客户对账单 |
| 打印功能 | ⚠️ 部分完成 | 报价单、送货单已实现；销售单、对账单待实现 |
| 数据导出 | ⚠️ 部分完成 | 客户对账单、数据导入导出页有导出；报表页待实现 |

### 数据库
- **14 张数据表**：categories, warehouses, products, customers, customer_prices, stocks, stock_lots, stock_transactions, sales_orders, sales_order_items, payment_records, sales_return_orders, sales_return_items, stock_transfers, stock_transfer_items
- **12 个 RPC 函数**：complete_sales_order, complete_sales_return, reverse_sales_order, stock_in_with_lot 等
- **RLS 策略**：全员可读写（适合 2 人小团队）

### 代码统计
- **94 个源文件** | **1,348 个代码节点** | **4,323 条依赖边**
- Vue 组件: 48 | TypeScript 文件: 31 | JavaScript 文件: 10

---

## 已知问题

1. **安全答案硬编码**：`stores/auth.ts` 中安全问题答案直接写在代码里，建议迁移到数据库
2. **无 README**：项目缺少说明文档
3. **无测试代码**：没有单元测试或 E2E 测试
4. **报表导出不完整**：仅部分报表支持 Excel 导出

---

## 待实现改进（详见 `docs/superpowers/plans/2026-06-21-improvements.md`）

| 优先级 | 改进项 | 状态 |
|--------|--------|------|
| P0 | 安全答案加密（迁移到数据库） | 待实现 |
| P1 | 补充 README 文档 | 待实现 |
| P1 | 销售单打印功能 | 待实现 |
| P1 | 对账单打印功能 | 待实现 |
| P1 | 统一 Excel 导出（抽离 composable） | 待实现 |
| P2 | 桌面通知预警 | 待实现 |
| P2 | 侧边栏"进货入库"改为"采购管理" | 待实现 |

---

## 历史优化记录

### 2026-05-23
- ECharts 按需引入（1.1MB → 543KB）
- 清理 dist 重复文件
- 添加 Supabase 代码分割
- 修复 sku 类型定义（改为可选）
- 修复 order_no 歧义错误（显式指定 select 字段）
- 修复 line_total 生成列问题（移除手动计算）
- 仓库编辑页面添加"设为默认仓库"选项

---

## 环境变量

```env
VITE_SUPABASE_URL=        # Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=   # Supabase 匿名 Key（前端使用）
```

## 构建命令

```bash
npm run dev       # 开发服务器
npm run build     # 生产构建（vue-tsc 类型检查 + vite build）
npm run preview   # 预览构建产物
```

## 部署方式

| 平台 | 方式 | 触发条件 |
|------|------|---------|
| GitHub Pages | GitHub Actions 自动部署 | push to main |
| Tauri 桌面端 | `npm run tauri build` | 手动构建 |
| PWA | vite-plugin-pwa 自动生成 | 随 Web 构建 |

---

> 最后更新: 2026-06-21
