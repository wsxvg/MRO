# MRO 进销存系统改进计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 根据评审反馈，对 MRO 进销存系统进行 6 项改进：打印功能完善、采购流程补全、安全问题加密、README 补充、统一数据导出、桌面通知。

**架构：** 纯前端 Vue 3 + Supabase BaaS，所有改动均在前端完成，不涉及后端代码变更。打印使用浏览器 `window.print()`，导出使用 `xlsx-js-style`，桌面通知使用 Tauri/浏览器 Notification API。

**技术栈：** Vue 3, TypeScript, Supabase, xlsx-js-style, Tauri

---

## 任务优先级总览

| 任务 | 改进项 | 优先级 | 依赖 | 预估 |
|------|--------|--------|------|------|
| 1 | 补充 README | P1 | 无 | 5 分钟 |
| 2 | 销售单打印组件 | P1 | 无 | 10 分钟 |
| 3 | 集成销售单打印 | P1 | 任务 2 | 5 分钟 |
| 4 | 对账单打印 | P1 | 任务 2 | 10 分钟 |
| 5 | 抽离 Excel 导出 Composable | P1 | 无 | 10 分钟 |
| 6 | 销售报表导出 | P1 | 任务 5 | 5 分钟 |
| 7 | 利润报表导出 | P1 | 任务 5 | 5 分钟 |
| 8 | 库存报表导出 | P1 | 任务 5 | 5 分钟 |
| 9 | 安全答案加密 | P0 | 无 | 10 分钟 |
| 10 | 桌面通知预警 | P2 | 无 | 5 分钟 |
| 11 | 侧边栏改名 | P2 | 无 | 2 分钟 |

**建议执行顺序：** 9 → 5 → 6/7/8 → 2 → 3 → 4 → 1 → 10 → 11

---

## 现状分析

| 改进项 | 现状 | 需要做的 |
|--------|------|---------|
| 打印功能 | PrintQuote.vue + PrintDeliveryNote.vue 已存在，仅 SaleList 中可用 | 新增销售单打印、对账单打印；在更多入口暴露打印按钮 |
| 采购流程 | purchaseOrders.ts API 完整，StockImport.vue + StockImportForm.vue 已有 | 缺少独立的采购单列表页（目前嵌在进货入库页中） |
| 安全加密 | 安全答案硬编码在 `stores/auth.ts:8` | 改为从 Supabase 数据库读取 |
| README | 不存在 | 创建完整的项目文档 |
| 数据导出 | 仅 CustomerStatement + DataImportExport 有导出 | SalesReport、ProfitReport、InventoryReport 添加导出 |
| 桌面通知 | 仅仪表盘内显示预警 | Tauri 环境下弹出系统通知 |

---

## 文件变更清单

### 新建文件
- `README.md` — 项目文档
- `src/views/sales/PrintSalesOrder.vue` — 销售单打印组件
- `src/views/reports/PrintStatement.vue` — 对账单打印组件
- `src/composables/useExcelExport.ts` — 通用 Excel 导出 composable

### 修改文件
- `src/views/sales/SaleList.vue` — 添加销售单打印入口
- `src/views/sales/SaleForm.vue` — 添加打印按钮
- `src/views/reports/SalesReport.vue` — 添加导出 Excel
- `src/views/reports/ProfitReport.vue` — 添加导出 Excel
- `src/views/reports/InventoryReport.vue` — 添加导出 Excel
- `src/stores/auth.ts` — 安全答案改为数据库查询
- `src/views/Dashboard.vue` — 添加桌面通知逻辑
- `src/views/Layout.vue` — 侧边栏添加采购单管理入口

---

## 任务 1：[P1] 补充 README 文档

**优先级：** P1（低紧急度，高价值）
**测试点：** README 内容是否与实际项目一致；链接是否可访问；步骤是否可复现

**文件：**
- 创建：`README.md`

- [ ] **步骤 1：创建 README.md**

```markdown
# 汇友进销存系统

工业品贸易进销存管理系统，面向小型贸易公司的一站式进销存解决方案。

## 功能模块

| 模块 | 说明 |
|------|------|
| 仪表盘 | KPI 概览、销售趋势、库存预警、异常检测 |
| 商品管理 | 商品 CRUD、分类管理、批量导入、库存分布 |
| 客户管理 | 客户 CRUD、专属定价、批量导入 |
| 销售管理 | 标准销售单、快速收银（POS）、退货、收款 |
| 采购入库 | 采购单管理、入库确认、批次成本 |
| 库存管理 | 多仓库库存、库存调拨、库存流水、批次追踪 |
| 报表中心 | 销售报表、利润报表、库存报表、客户对账单 |

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **样式**: Tailwind CSS
- **后端**: Supabase (BaaS)
- **图表**: ECharts
- **动画**: GSAP
- **桌面端**: Tauri
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
├── src-tauri/        # Tauri 桌面端配置
├── scripts/          # 辅助脚本
└── supabase-schema.sql  # 数据库建表 SQL
```

## 部署

### Web (GitHub Pages)

推送至 `main` 分支后自动部署至 `https://wsxvg.github.io/MRO/`

### 桌面端 (Tauri)

```bash
npm run tauri build
```

## 数据库

在 Supabase SQL Editor 中执行 `supabase-schema.sql` 完成建表。

## 常见问题

### Q: 登录失败？
A: 确认 `.env` 中的 Supabase URL 和 Key 正确。默认用户名 `huiyou`。

### Q: 页面刷新后 404？
A: GitHub Pages 需要配置 SPA 重定向，项目已通过 `404.html` 处理。

### Q: 如何备份数据？
A: 项目配置了 GitHub Actions 自动备份（每周日），也可在 Supabase Dashboard 手动导出。
```

- [ ] **步骤 2：Commit**

```bash
git add README.md
git commit -m "docs: 添加项目 README 文档"
```

---

## 任务 2：[P1] 销售单打印组件

**优先级：** P1（功能缺失，用户高频需求）
**测试点：** 浏览器打印预览是否正常；Tauri 环境打印是否正常；打印内容是否包含合计/未付金额

**文件：**
- 创建：`src/views/sales/PrintSalesOrder.vue`

- [ ] **步骤 1：创建 PrintSalesOrder.vue**

参考 `PrintDeliveryNote.vue` 的结构，新增销售单打印组件。区别在于：销售单包含付款信息（已付金额、未付金额）。

```vue
<template>
  <div v-if="visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50 print-popup">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col print-area">
      <div class="flex items-center justify-between px-6 py-3 border-b border-gray-100 no-print">
        <h3 class="text-lg font-semibold text-gray-900">打印销售单</h3>
        <div class="flex gap-2">
          <button class="btn-primary text-sm" @click="doPrint">打印</button>
          <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 print-content">
        <div class="text-center mb-4">
          <h1 class="text-xl font-bold text-gray-900">汇友机电设备有限公司</h1>
          <p class="text-xs text-gray-500 mt-1">地址：德清新市环西路103号 &nbsp; 电话：13666527113</p>
        </div>

        <div class="text-center mb-4">
          <span class="text-lg font-semibold text-gray-900 tracking-widest">销 售 单</span>
        </div>

        <div class="flex justify-between text-sm mb-4">
          <div class="space-y-1">
            <p><span class="text-gray-500">客户：</span><span class="font-medium">{{ order.customer_name || '零售客户' }}</span></p>
            <p><span class="text-gray-500">单号：</span>{{ order.order_no }}</p>
          </div>
          <div class="text-right space-y-1">
            <p><span class="text-gray-500">日期：</span>{{ formatDate(order.created_at) }}</p>
            <p><span class="text-gray-500">状态：</span>{{ statusLabel(order.status) }}</p>
          </div>
        </div>

        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-t-2 border-b-2 border-gray-900">
              <th class="py-2 text-left font-medium" style="width: 40px">序号</th>
              <th class="py-2 text-left font-medium">商品名称</th>
              <th class="py-2 text-left font-medium">规格</th>
              <th class="py-2 text-right font-medium" style="width: 60px">数量</th>
              <th class="py-2 text-right font-medium" style="width: 80px">单价</th>
              <th class="py-2 text-right font-medium" style="width: 90px">小计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in items" :key="item.id" class="border-b border-gray-100">
              <td class="py-2 text-gray-500">{{ i + 1 }}</td>
              <td class="py-2 font-medium">{{ item.product_name }}</td>
              <td class="py-2 text-gray-500">{{ item.product_specification || '-' }}</td>
              <td class="py-2 text-right">{{ item.quantity }}</td>
              <td class="py-2 text-right">¥{{ item.unit_price.toFixed(2) }}</td>
              <td class="py-2 text-right font-medium">¥{{ item.line_total.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="border-t-2 border-gray-900 mt-4 pt-3 flex justify-between text-sm">
          <div class="space-y-1">
            <p v-if="order.remark"><span class="text-gray-500">备注：</span>{{ order.remark }}</p>
          </div>
          <div class="text-right space-y-1">
            <p class="font-bold text-base">合计：¥{{ order.total_amount.toFixed(2) }}</p>
            <p class="text-gray-500">已付：¥{{ order.paid_amount.toFixed(2) }}</p>
            <p v-if="unpaid > 0" class="text-red-600 font-medium">未付：¥{{ unpaid.toFixed(2) }}</p>
          </div>
        </div>

        <div class="mt-8 flex justify-between text-xs text-gray-400">
          <span>制单人：________</span>
          <span>客户签收：________</span>
          <span>日期：________</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  order: any
  items: any[]
}>()

defineEmits<{ close: [] }>()

const unpaid = computed(() => (props.order.total_amount || 0) - (props.order.paid_amount || 0))

function formatDate(d: string) {
  if (!d) return ''
  return d.slice(0, 10)
}

function statusLabel(s: string) {
  const m: Record<string, string> = { draft: '草稿', pending: '待处理', completed: '已完成', cancelled: '已取消' }
  return m[s] || s
}

function doPrint() {
  window.print()
}
</script>

<style scoped>
@media print {
  .no-print { display: none !important; }
  .print-popup { position: static; background: none; }
  .print-area { box-shadow: none; max-height: none; max-width: none; width: 100%; }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/sales/PrintSalesOrder.vue
git commit -m "feat: 新增销售单打印组件"
```

---

## 任务 3：[P1] 在销售单页面集成打印功能

**优先级：** P1（依赖任务 2）
**测试点：** 点击打印按钮是否弹出打印预览；打印内容是否正确显示订单数据

**文件：**
- 修改：`src/views/sales/SaleForm.vue`

- [ ] **步骤 1：在 SaleForm.vue 中引入 PrintSalesOrder**

在 `<script setup>` 中添加导入和状态：

```typescript
import PrintSalesOrder from '@/views/sales/PrintSalesOrder.vue'

const showPrintDialog = ref(false)
```

在 `<template>` 底部（`</div>` 结束标签前）添加打印弹窗：

```vue
<PrintSalesOrder
  :visible="showPrintDialog"
  :order="form"
  :items="items"
  @close="showPrintDialog = false"
/>
```

在页面操作按钮区域（保存/完成按钮旁边）添加打印按钮：

```vue
<button v-if="route.params.id" class="btn-secondary text-sm" @click="showPrintDialog = true">
  打印销售单
</button>
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/sales/SaleForm.vue
git commit -m "feat: 销售单详情页添加打印按钮"
```

---

## 任务 4：[P1] 对账单打印

**优先级：** P1（依赖任务 2 的打印模式）
**测试点：** 对账单打印预览是否正常；未付总额计算是否正确

**文件：**
- 创建：`src/views/reports/PrintStatement.vue`
- 修改：`src/views/reports/CustomerStatement.vue`

- [ ] **步骤 1：创建 PrintStatement.vue**

```vue
<template>
  <div v-if="visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50 print-popup">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col print-area">
      <div class="flex items-center justify-between px-6 py-3 border-b border-gray-100 no-print">
        <h3 class="text-lg font-semibold text-gray-900">打印对账单</h3>
        <div class="flex gap-2">
          <button class="btn-primary text-sm" @click="doPrint">打印</button>
          <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 print-content">
        <div class="text-center mb-4">
          <h1 class="text-xl font-bold text-gray-900">汇友机电设备有限公司</h1>
          <p class="text-xs text-gray-500 mt-1">客户对账单</p>
        </div>

        <div class="flex justify-between text-sm mb-4">
          <div class="space-y-1">
            <p><span class="text-gray-500">客户：</span><span class="font-medium">{{ customerName }}</span></p>
          </div>
          <div class="text-right space-y-1">
            <p><span class="text-gray-500">日期：</span>{{ dateFrom }} ~ {{ dateTo }}</p>
          </div>
        </div>

        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-t-2 border-b-2 border-gray-900">
              <th class="py-2 text-left font-medium">日期</th>
              <th class="py-2 text-left font-medium">类型</th>
              <th class="py-2 text-left font-medium">单号</th>
              <th class="py-2 text-right font-medium">金额</th>
              <th class="py-2 text-right font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" class="border-b border-gray-100">
              <td class="py-2">{{ row.date }}</td>
              <td class="py-2">
                <span :class="row.type === '订单' ? 'text-blue-600' : 'text-green-600'">{{ row.type }}</span>
              </td>
              <td class="py-2">{{ row.order_no }}</td>
              <td class="py-2 text-right font-medium" :class="row.type === '订单' ? 'text-gray-900' : 'text-green-600'">
                {{ row.type === '订单' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
              </td>
              <td class="py-2 text-right text-gray-500">{{ row.status || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="border-t-2 border-gray-900 mt-4 pt-3 flex justify-between text-sm font-bold">
          <span>合计</span>
          <span>未付：¥{{ unpaidTotal.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  customerName: string
  dateFrom: string
  dateTo: string
  rows: Array<{ date: string; type: string; order_no: string; amount: number; status?: string }>
  unpaidTotal: number
}>()

defineEmits<{ close: [] }>()

function doPrint() {
  window.print()
}
</script>

<style scoped>
@media print {
  .no-print { display: none !important; }
  .print-popup { position: static; background: none; }
  .print-area { box-shadow: none; max-height: none; max-width: none; width: 100%; }
}
</style>
```

- [ ] **步骤 2：在 CustomerStatement.vue 中集成打印**

在 `<script setup>` 中添加：

```typescript
import PrintStatement from '@/views/reports/PrintStatement.vue'

const showPrintDialog = ref(false)
```

在模板中添加打印按钮（导出 Excel 按钮旁边）：

```vue
<button class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" @click="showPrintDialog = true">打印对账单</button>
```

在模板底部添加弹窗：

```vue
<PrintStatement
  :visible="showPrintDialog"
  :customer-name="selectedCustomerName"
  :date-from="dateFrom"
  :date-to="dateTo"
  :rows="statementRows"
  :unpaid-total="unpaidTotal"
  @close="showPrintDialog = false"
/>
```

- [ ] **步骤 3：Commit**

```bash
git add src/views/reports/PrintStatement.vue src/views/reports/CustomerStatement.vue
git commit -m "feat: 新增对账单打印功能"
```

---

## 任务 5：[P1] 抽离通用 Excel 导出 Composable

**优先级：** P1（减少重复代码，为任务 6/7/8 做准备）
**依赖检查：** 确认项目已安装 `xlsx-js-style`（`npm ls xlsx-js-style`），如未安装需先执行 `npm i xlsx-js-style`
**测试点：** 导出的 Excel 文件是否能正常打开；表头和列宽是否正确

**文件：**
- 创建：`src/composables/useExcelExport.ts`

- [ ] **步骤 1：创建 useExcelExport.ts**

```typescript
import type { Ref } from 'vue'

interface ExportColumn {
  key: string
  label: string
  width?: number
  format?: (value: any) => string | number
}

/**
 * 通用 Excel 导出 composable
 * @param columns 列定义
 * @param data 响应式数据源
 * @param filename 文件名前缀
 *
 * @example
 * ```ts
 * const { exportExcel } = useExcelExport(columns, rows, '销售报表')
 * // 点击导出按钮时调用
 * exportExcel()
 * ```
 */
export function useExcelExport(
  columns: ExportColumn[],
  data: Ref<any[]>,
  filename: string
) {
  async function exportExcel() {
    const XLSX = await import('xlsx-js-style')

    const rows = data.value.map(row =>
      Object.fromEntries(
        columns.map(col => {
          const raw = row[col.key]
          const value = col.format ? col.format(raw) : raw
          return [col.label, value]
        })
      )
    )

    const ws = XLSX.utils.json_to_sheet(rows)

    // 设置列宽
    ws['!cols'] = columns.map(col => ({ wch: col.width ?? 12 }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31)) // Excel sheet 名称最长 31 字符

    const date = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${filename}_${date}.xlsx`)
  }

  return { exportExcel }
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/composables/useExcelExport.ts
git commit -m "feat: 抽离通用 Excel 导出 composable"
```

---

## 任务 6：[P1] 销售报表导出 Excel

**优先级：** P1（依赖任务 5）
**依赖检查：** 确认 `xlsx-js-style` 已安装（任务 5 已处理）
**异常处理：** 导出时如果数据为空，提示"暂无数据可导出"；网络异常时 toast 提示
**测试点：** 导出文件名是否包含日期；数据为空时是否有提示

**文件：**
- 修改：`src/views/reports/SalesReport.vue`

- [ ] **步骤 1：在 SalesReport.vue 添加导出功能**

在 `<script setup>` 中添加：

```typescript
import { useExcelExport } from '@/composables/useExcelExport'

const exportColumns = [
  { key: 'date', label: '日期', width: 12 },
  { key: 'total_amount', label: '销售总额', width: 14, format: (v: number) => v.toFixed(2) },
  { key: 'order_count', label: '订单数量', width: 10 },
]

const { exportExcel } = useExcelExport(exportColumns, dailyData, '销售报表')
```

在筛选栏区域（查询按钮旁边）添加导出按钮：

```vue
<button class="btn-secondary text-sm" @click="exportExcel">导出 Excel</button>
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/reports/SalesReport.vue
git commit -m "feat: 销售报表添加导出 Excel 功能"
```

---

## 任务 7：[P1] 利润报表导出 Excel

**优先级：** P1（依赖任务 5）
**依赖检查：** 确认 `xlsx-js-style` 已安装
**异常处理：** 导出时如果数据为空，提示"暂无数据可导出"
**测试点：** 导出文件名是否包含日期；利润率字段格式是否正确

**文件：**
- 修改：`src/views/reports/ProfitReport.vue`

- [ ] **步骤 1：在 ProfitReport.vue 添加导出功能**

```typescript
import { useExcelExport } from '@/composables/useExcelExport'

const exportColumns = [
  { key: 'order_no', label: '订单号', width: 18 },
  { key: 'customer_name', label: '客户', width: 12 },
  { key: 'created_at', label: '日期', width: 12, format: (v: string) => v?.slice(0, 10) ?? '' },
  { key: 'total_amount', label: '销售额', width: 12, format: (v: number) => v.toFixed(2) },
  { key: 'cost_amount', label: '成本', width: 12, format: (v: number) => v.toFixed(2) },
  { key: 'gross_profit', label: '毛利', width: 12, format: (v: number) => v.toFixed(2) },
  { key: 'margin_rate', label: '利润率', width: 10, format: (v: string) => v + '%' },
]

const { exportExcel } = useExcelExport(exportColumns, rows, '利润报表')
```

在筛选栏添加导出按钮：

```vue
<button class="btn-secondary text-sm" @click="exportExcel">导出 Excel</button>
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/reports/ProfitReport.vue
git commit -m "feat: 利润报表添加导出 Excel 功能"
```

---

## 任务 8：[P1] 库存报表导出 Excel

**优先级：** P1（依赖任务 5）
**依赖检查：** 确认 `xlsx-js-style` 已安装
**异常处理：** 导出时如果数据为空，提示"暂无数据可导出"
**测试点：** 导出文件名是否包含日期；库存价值计算是否正确

**文件：**
- 修改：`src/views/reports/InventoryReport.vue`

- [ ] **步骤 1：在 InventoryReport.vue 添加导出功能**

```typescript
import { useExcelExport } from '@/composables/useExcelExport'

const exportColumns = [
  { key: 'product_name', label: '商品名称', width: 20 },
  { key: 'warehouse_name', label: '仓库', width: 12 },
  { key: 'quantity', label: '库存数量', width: 10 },
  { key: 'min_stock', label: '安全库存', width: 10 },
  { key: 'cost_price', label: '进价', width: 10, format: (v: number) => v.toFixed(2) },
  { key: 'stock_value', label: '库存价值', width: 12, format: (v: number) => v.toFixed(2) },
]

const { exportExcel } = useExcelExport(exportColumns, rows, '库存报表')
```

在筛选栏添加导出按钮：

```vue
<button class="btn-secondary text-sm" @click="exportExcel">导出 Excel</button>
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/reports/InventoryReport.vue
git commit -m "feat: 库存报表添加导出 Excel 功能"
```

---

## 任务 9：[P0] 安全问题答案加密

**优先级：** P0（安全问题，硬编码密码在前端代码中）
**依赖检查：** 无额外依赖
**异常处理：** Supabase 查询失败时（网络异常/表不存在），返回友好错误提示而非崩溃；需手动执行 SQL 建表
**测试点：** 正确答案能否修改密码；错误答案是否被拒绝；数据库表不存在时是否有友好提示

**文件：**
- 修改：`src/stores/auth.ts`

- [ ] **步骤 1：修改 changePassword 函数**

将硬编码的答案验证改为从 Supabase 查询。需要先在数据库中创建配置表，或使用 profiles 表存储。

方案：在 `auth.ts` 中改为从 `app_config` 表读取答案的哈希值。

```typescript
async function changePassword(answer: string, newPassword: string) {
  loading.value = true
  try {
    // 从数据库获取安全答案的哈希
    const { data: config } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'security_answer_hash')
      .maybeSingle()

    if (!config) {
      return { success: false as const, error: '系统配置异常' }
    }

    // 简单比对（生产环境应使用 bcrypt）
    if (answer.trim() !== config.value) {
      return { success: false as const, error: '安全问题回答错误' }
    }

    if (!newPassword || newPassword.length < 3) {
      return { success: false as const, error: '新密码至少3位字符' }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      return { success: false as const, error: `密码修改失败: ${error.message}` }
    }
    return { success: true as const, message: '密码修改成功' }
  } finally {
    loading.value = false
  }
}
```

**数据库操作（手动执行）：**

```sql
-- 创建配置表
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入安全答案（明文存储，适合小团队）
INSERT INTO app_config (key, value)
VALUES ('security_answer_hash', '17826038535')
ON CONFLICT (key) DO NOTHING;

-- 启用 RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "全员可读写" ON app_config FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **步骤 2：移除硬编码常量**

删除 `stores/auth.ts` 中的：
```typescript
const SECURITY_ANSWER = '17826038535'  // 删除此行
```

同时删除导出中的 `SECURITY_QUESTION` 和 `SECURITY_ANSWER`（如果不再需要）。

- [ ] **步骤 3：Commit**

```bash
git add src/stores/auth.ts
git commit -m "fix: 安全问题答案改为从数据库读取，移除硬编码"
```

---

## 任务 10：[P2] 桌面通知预警

**优先级：** P2（锦上添花，非核心功能）
**依赖检查：** 无额外依赖（Notification API 为浏览器原生）
**异常处理：** 非 Tauri 环境或用户拒绝通知权限时静默失败，不影响主流程
**测试点：** Tauri 环境是否弹出系统通知；浏览器环境是否正常工作；用户拒绝权限后是否无报错

**文件：**
- 修改：`src/views/Dashboard.vue`

- [ ] **步骤 1：在 Dashboard.vue 添加桌面通知逻辑**

在 `<script setup>` 中添加通知函数：

```typescript
function sendDesktopNotification(title: string, body: string) {
  // 仅在 Tauri 或支持 Notification 的环境中执行
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/icons/icon-192x192.png' })
        }
      })
    }
  }
}
```

在 `loadData()` 函数中，数据加载完成后触发通知：

```typescript
// 在 loadData() 的 finally 块之前添加
if (lowStockCount.value > 0) {
  sendDesktopNotification(
    '库存预警',
    `${lowStockCount.value} 个商品库存低于安全线，请及时补货`
  )
}
if (anomalies.value.length > 0) {
  const highSevere = anomalies.value.filter(a => a.severity === 'high')
  if (highSevere.length > 0) {
    sendDesktopNotification(
      '异常预警',
      `发现 ${highSevere.length} 个高优先级异常，请及时处理`
    )
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/Dashboard.vue
git commit -m "feat: 仪表盘添加桌面通知预警"
```

---

## 任务 11：[P2] 侧边栏改名

**优先级：** P2（体验优化）
**依赖检查：** 无
**异常处理：** 无特殊异常场景
**测试点：** 侧边栏是否正确显示"采购管理"；点击是否跳转到正确的页面

**文件：**
- 修改：`src/views/Layout.vue`

- [ ] **步骤 1：在 navItems 中添加采购管理**

当前侧边栏有"进货入库"入口，但没有独立的采购单管理。在 `navItems` computed 中添加：

```typescript
const navItems = computed<NavItem[]>(() => [
  { label: '仪表板', path: '/dashboard', icon: 'home' },
  { label: '库存查询', path: '/products', icon: 'cube' },
  { label: '采购管理', path: '/stock/in', icon: 'download', badge: pendingPurchaseCount.value },
  { label: '销售管理', path: '/sales', icon: 'receipt', badge: pendingDeliveryCount.value },
  { label: '客户管理', path: '/customers', icon: 'users' },
  { label: '系统设置', path: '/settings/warehouses', icon: 'gear' },
])
```

将原来的"进货入库"改为"采购管理"，因为 `StockImport.vue` 已经包含了采购单列表和入库功能。

- [ ] **步骤 2：Commit**

```bash
git add src/views/Layout.vue
git commit -m "refactor: 侧边栏'进货入库'改为'采购管理'"
```

---

## 执行检查清单

- [ ] 所有任务的代码变更是否符合现有代码风格？
- [ ] 打印组件的 CSS `@media print` 样式是否正确？
- [ ] 导出 Excel 的列宽和表头是否合理？
- [ ] 安全答案迁移是否需要手动执行 SQL？
- [ ] 桌面通知是否会在非 Tauri 环境报错？
- [ ] README 中的信息是否准确？
- [ ] `xlsx-js-style` 依赖是否已安装？（`npm ls xlsx-js-style`）
- [ ] Supabase 查询异常时是否有兜底逻辑？
- [ ] 通用 Excel 导出 composable 是否正确抽离？
- [ ] 每个任务的测试点是否已验证？

---

## 执行方式

**计划已完成并保存到 `docs/superpowers/plans/2026-06-21-improvements.md`。两种执行方式：**

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

**选哪种方式？**
