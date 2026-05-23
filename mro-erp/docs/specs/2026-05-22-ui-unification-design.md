# UI 统一重构设计文档

## 目标

将所有列表页、表单页、报表页的视觉风格统一为 Dashboard 的高端简洁风（类似 Linear / 飞书风格），使用 Tailwind CSS 实现，不引入第三方 UI 库。

## 设计 Token

从 Dashboard.vue 提取的设计 Token：

| Token | 值 | 用途 |
|---|---|---|
| 卡片背景 | `bg-white rounded-xl border border-gray-100` | 所有卡片容器 |
| 卡片内边距 | `p-5` | 卡片内容区 |
| 标题 | `text-xl font-bold text-gray-900` | 页面标题 |
| 副标题 | `text-sm text-gray-400 mt-1` | 页面描述/统计 |
| 标签 | `text-xs font-medium text-gray-400 uppercase tracking-wider` | 表格表头、KPI 标签 |
| 正文 | `text-sm text-gray-900` | 表格数据 |
| 次要文字 | `text-sm text-gray-500` | 次要信息 |
| 图标容器 | `w-7 h-7 bg-{color}-50 rounded-lg flex items-center justify-center` | 图标背景 |
| 图标色 | `text-{color}-500 text-xs` | 图标颜色 |
| 状态标签 | `text-xs px-1.5 py-0.5 rounded font-medium` | 状态指示器 |
| 表格行 hover | `hover:bg-gray-50` | 行交互反馈 |
| 分隔线 | `border-b border-gray-100` | 表格行分割 |
| 空状态 | 居中 + 灰色图标 + 描述文字 | 无数据提示 |

## 组件层（新创建）

### BaseCard.vue
通用卡片容器，替代裸 `card` 类。

```vue
<template>
  <div class="bg-white rounded-xl border border-gray-100" :class="paddingClass">
    <div v-if="$slots.header || title" class="flex items-center justify-between mb-4 px-5 pt-5">
      <h3 v-if="title" class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <slot name="header" />
    </div>
    <div :class="{ 'p-5': !noPadding }">
      <slot />
    </div>
  </div>
</template>
```

### BaseTable.vue
统一表格结构，自带表头样式、行 hover、空状态。

Props: `columns`, `data`, `loading`, `emptyText`
Slots: `cell(column, row)` — 自定义列渲染

表头: `text-xs font-medium text-gray-400 uppercase tracking-wider pb-3`
行: `border-b border-gray-100 hover:bg-gray-50`
单元格: `py-3 text-sm`（数字右对齐用 `text-right`）

### BasePageHeader.vue
统一页头。

Props: `title`, `subtitle`, `backLink`

```vue
<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <router-link v-if="backLink" :to="backLink" class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
        <i class="ri-arrow-left-s-line text-gray-500" />
      </router-link>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-gray-400 mt-1">{{ subtitle }}</p>
      </div>
    </div>
    <slot />
  </div>
</template>
```

### FilterBar.vue
搜索 + 筛选组合。

Props: `showSearch`, `filters`（数组，每项 `{ key, label, options }`）
Emits: `update:modelValue`, `search`, `filter`

### StatusBadge.vue
统一状态标签，带彩色圆点。

```vue
<template>
  <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium"
    :class="variantClass">
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>
```

颜色映射: `draft → gray`, `confirmed → primary/blue`, `completed → green`, `cancelled → red`, `return → orange`

### StatCard.vue
统计数字卡片（仪表盘 KPI 卡片的简化版，供列表页顶部使用）。

Props: `title`, `value`, `icon`, `color`（emerald/amber/red/gray）

## 重构范围

### Phase 1: 核心组件创建
- BaseCard.vue, BaseTable.vue, BasePageHeader.vue
- FilterBar.vue, StatusBadge.vue, StatCard.vue

### Phase 2: 列表页重构（9 页）
按工作量从小到大排序：

1. **CategoryList** (~40 行→精简) — 最简单，无搜索无分页
2. **SupplierList** (~60 行→重构) — 标准列表
3. **CustomerList** (~60 行→重构) — 标准列表
4. **WarehouseList** (~60 行→重构) — 标准列表
5. **PurchaseList** (~88 行→重构) — 标准列表，加日期筛选
6. **SaleList** (~同→重构) — 同 PurchaseList
7. **PurchaseReturnList** (~同→重构) — 退货列表，加退货原因列
8. **SaleReturnList** (~同→重构) — 同上
9. **ProductList** (~197 行→重构) — 最复杂，有搜索+分类筛选+分页

### Phase 3: 详情/表单页重构
- ProductForm, PurchaseForm, SaleForm, SaleQuick, SaleReturnForm, PurchaseReturnForm
- SupplierForm, CustomerForm, WarehouseForm
- CustomerPricing

### Phase 4: 报表页重构
- ProfitReport, InventoryReport, SalesReport, CustomerStatement
- 这些本身就是卡片布局，改动最小

### Phase 5: 剩余页面
- WarehouseStock（库存页，需加低库存高亮）
- ProductImport, CustomerImport, StockImport（导入页）
- Settings

## 不修改的内容
- Dashboard.vue（已经是标杆）
- Login.vue（登录页风格独立，不宜强行统一）
- Layout.vue（已有页头侧边栏）
- 任何业务逻辑和 API 调用

## 样式扩增（index.css）

在 `@layer components` 中补充：

```css
/* Dashbaord 风格的状态标签变体 - 带圆点 */
.badge-with-dot {
  @apply inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium;
}
/* 表格容器 */
.table-container {
  @apply overflow-x-auto;
}
/* 页面容器内边距 */
.page-padding {
  @apply p-6;
}
```

## 质量标准
- 重构后页面视觉风格与 Dashboard 一致（卡片、标签、图标、间距）
- 不改变任何功能逻辑
- 不改变 API 调用和数据流
- 重构后 build 零错误
- 每个页面重构后逐页验收
