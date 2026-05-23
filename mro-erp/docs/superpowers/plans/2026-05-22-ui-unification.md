# UI 统一重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。
> 所有包含中文的文件必须使用 UTF-8 编码写入。禁止使用 PowerShell 的 Out-File / `>` / Set-Content 写入含中文的文件。

**目标：** 将所有列表页、表单页、报表页的视觉风格统一为 Dashboard 的高端简洁风（Tailwind CSS 实现，不引入第三方 UI 库）

**设计 Token（从 Dashboard.vue 提取）：**
- 卡片：`bg-white rounded-xl border border-gray-100 p-5`
- 标题：`text-xl font-bold text-gray-900`
- 副标题：`text-sm text-gray-400 mt-1`
- 标签（表头/KPI labels）：`text-xs font-medium text-gray-400 uppercase tracking-wider`
- 正文：`text-sm text-gray-900`
- 次要文字：`text-sm text-gray-500`
- 图标容器：`w-7 h-7 bg-{color}-50 rounded-lg flex items-center justify-center`
- 状态标签：`text-xs px-1.5 py-0.5 rounded font-medium` + 彩色圆点
- 行 hover：`hover:bg-gray-50`
- 分隔线：`border-b border-gray-100`

**架构：** 创建 6 个通用组件（BaseCard/BaseTable/BasePageHeader/FilterBar/StatusBadge/StatCard），然后按页面复杂度从小到大逐页重构。重构不改变任何业务逻辑和 API 调用。

**技术栈：** Vue 3 + TypeScript + Tailwind CSS + Remixicon（已有 `ri-*` 图标库）

**设计文档：** `docs/specs/2026-05-22-ui-unification-design.md`

---

### 任务 1：扩增 index.css 工具类

**文件：**
- 修改：`src/index.css`

**步骤：**

- [ ] **在 `@layer components` 中补充样式**

在 `index.css` 的 `@layer components` 末尾添加以下类：

```css
/* 页面容器内边距 */
.page-padding {
  @apply p-6;
}
```

注意：BaseCard 和 StatusBadge 不使用 CSS 类，直接用组件实现更灵活。表格行 hover 已经在各页面硬编码了，无需 CSS 类。

---

### 任务 2：创建 BaseCard.vue

**文件：**
- 创建：`src/components/BaseCard.vue`

**步骤：**

- [ ] **创建 BaseCard 组件**

```vue
<template>
  <div class="bg-white rounded-xl border border-gray-100" :class="[paddingClass, customClass]">
    <div v-if="$slots.header || title" class="flex items-center justify-between px-5 pt-5 pb-4">
      <h3 v-if="title" class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <slot name="header" />
    </div>
    <div :class="{ 'p-5': !noPadding }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  noPadding?: boolean
  paddingless?: boolean
}>(), {
  noPadding: false,
  paddingless: false
})

const paddingClass = computed(() => {
  if (props.paddingless) return ''
  return ''
})
</script>
```

注意：`paddingless` 属性可以完全取消内边距（用于表格等需要顶到头的内容）。`noPadding` 是兼容别名。

---

### 任务 3：创建 BaseTable.vue

**文件：**
- 创建：`src/components/BaseTable.vue`

**步骤：**

- [ ] **创建 BaseTable 组件**

功能需求：
- Props: `columns` (array of { key, label, align?, width? }), `data` (array), `loading` (boolean), `emptyText` (string, default '暂无数据')
- Slots: `cell({ column, row })` 自定义单元格渲染
- 自动渲染表头（`text-xs font-medium text-gray-400 uppercase tracking-wider pb-3`）
- 自动行 hover（`hover:bg-gray-50`）
- 空状态时显示居中图标 + emptyText
- 加载中时显示 spinner

```vue
<template>
  <div class="overflow-x-auto">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="data.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-sm text-gray-400">{{ emptyText }}</p>
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead>
        <tr class="text-left">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'text-xs font-medium text-gray-400 uppercase tracking-wider pb-3',
              col.align === 'right' ? 'text-right' : '',
              col.align === 'center' ? 'text-center' : ''
            ]"
            :style="col.width ? { width: col.width } : undefined"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIdx) in data"
          :key="row.id || rowIdx"
          class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="['py-3 text-sm', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-gray-900']"
          >
            <slot name="cell" :column="col" :row="row">
              {{ row[col.key] ?? '-' }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string }[]
  data: any[]
  loading?: boolean
  emptyText?: string
}>()

defineSlots<{
  cell(props: { column: { key: string; label: string }; row: any }): any
}>()
</script>
```

---

### 任务 4：创建 BasePageHeader.vue

**文件：**
- 创建：`src/components/BasePageHeader.vue`

**步骤：**

- [ ] **创建 BasePageHeader 组件**

```vue
<template>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <router-link
        v-if="to"
        :to="to"
        class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
      >
        <i class="ri-arrow-left-s-line text-gray-500" />
      </router-link>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-gray-400 mt-1">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  to?: string
}>()
</script>
```

---

### 任务 5：创建 StatusBadge.vue

**文件：**
- 创建：`src/components/StatusBadge.vue`

**步骤：**

- [ ] **创建 StatusBadge 组件**

```vue
<template>
  <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium" :class="bgClass">
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  status: string
  labels?: Record<string, string>
}>(), {
  labels: () => ({})
})

const defaultLabels: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
  returned: '已退货',
  active: '启用',
  inactive: '停用'
}

const label = computed(() => {
  return props.labels[props.status] || defaultLabels[props.status] || props.status
})

const variantMap: Record<string, { bg: string; dot: string }> = {
  draft: { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  confirmed: { bg: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
  completed: { bg: 'bg-green-50 text-green-600', dot: 'bg-green-400' },
  cancelled: { bg: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
  returned: { bg: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
  active: { bg: 'bg-green-50 text-green-600', dot: 'bg-green-400' },
  inactive: { bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
}

const bgClass = computed(() => variantMap[props.status]?.bg || 'bg-gray-100 text-gray-600')
const dotClass = computed(() => variantMap[props.status]?.dot || 'bg-gray-400')
</script>
```

---

### 任务 6：创建 FilterBar.vue

**文件：**
- 创建：`src/components/FilterBar.vue`

**步骤：**

- [ ] **创建 FilterBar 组件**

```vue
<template>
  <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
    <div class="flex flex-wrap items-end gap-4">
      <!-- Search -->
      <div v-if="showSearch" class="min-w-[200px] flex-1">
        <input
          :modelValue="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          type="text"
          class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          :placeholder="searchPlaceholder"
        />
      </div>

      <!-- Filter selects -->
      <div v-for="filter in filters" :key="filter.key" class="w-40">
        <select
          :value="filter.value"
          @change="$emit('filter-change', { key: filter.key, value: ($event.target as HTMLSelectElement).value })"
          class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">{{ filter.label }}</option>
          <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  showSearch?: boolean
  searchPlaceholder?: string
  filters?: { key: string; label: string; value: string; options: { value: string; label: string }[] }[]
}>()

defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'filter-change', payload: { key: string; value: string }): void
}>()
</script>
```

---

### 任务 7：创建 StatCard.vue

**文件：**
- 创建：`src/components/StatCard.vue`

**步骤：**

- [ ] **创建 StatCard 组件**

```vue
<template>
  <div class="bg-white rounded-xl border border-gray-100 p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{{ title }}</span>
      <div v-if="icon" class="w-7 h-7 rounded-lg flex items-center justify-center" :class="iconBgClass">
        <i :class="[icon, iconColorClass, 'text-xs']" />
      </div>
    </div>
    <div class="text-2xl font-bold text-gray-900">
      <slot name="value">{{ value }}</slot>
    </div>
    <div v-if="$slots.footer" class="mt-1">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  value?: string | number
  icon?: string
  color?: 'gray' | 'emerald' | 'amber' | 'red' | 'blue'
}>(), {
  color: 'gray'
})

const colorMap: Record<string, { bg: string; icon: string }> = {
  gray: { bg: 'bg-gray-100', icon: 'text-gray-500' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
  red: { bg: 'bg-red-50', icon: 'text-red-500' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500' },
}

const iconBgClass = computed(() => colorMap[props.color]?.bg || colorMap.gray.bg)
const iconColorClass = computed(() => colorMap[props.color]?.icon || colorMap.gray.icon)
</script>
```

---

### 任务 8：重构 CategoryList.vue

**文件：**
- 修改：`src/views/products/CategoryList.vue`

说明：最简单的列表页，无搜索无分页。先用 BasePageHeader + BaseCard + BaseTable 重构。

- [ ] **重构 CategoryList.vue**

读取当前 CategoryList.vue 内容，然后用 BasePageHeader/BaseCard/BaseTable 重构 template，保持 script 逻辑不变。

---

### 任务 9：重构 SupplierList.vue

**文件：**
- 修改：`src/views/suppliers/SupplierList.vue`

- [ ] **重构 SupplierList.vue**

读取当前文件，引入 BasePageHeader/BaseCard/BaseTable/FilterBar/StatusBadge，替换原有模板。

---

### 任务 10：重构 CustomerList.vue

**文件：**
- 修改：`src/views/customers/CustomerList.vue`

- [ ] **重构 CustomerList.vue**

---

### 任务 11：重构 WarehouseList.vue

**文件：**
- 修改：`src/views/warehouses/WarehouseList.vue`

- [ ] **重构 WarehouseList.vue**

---

### 任务 12：重构 PurchaseList.vue

**文件：**
- 修改：`src/views/purchases/PurchaseList.vue`

- [ ] **重构 PurchaseList.vue**

比前面的列表多一个日期筛选功能。用 StatusBadge 替换手动 statusClass/statusLabel。

---

### 任务 13：重构 SaleList.vue

**文件：**
- 修改：`src/views/sales/SaleList.vue`

- [ ] **重构 SaleList.vue**

与 PurchaseList 结构对称。

---

### 任务 14：重构 PurchaseReturnList.vue

**文件：**
- 修改：`src/views/purchases/PurchaseReturnList.vue`

- [ ] **重构 PurchaseReturnList.vue**

---
### 任务 15：重构 SaleReturnList.vue

**文件：**
- 修改：`src/views/sales/SaleReturnList.vue`

- [ ] **重构 SaleReturnList.vue**

---

### 任务 16：重构 ProductList.vue

**文件：**
- 修改：`src/views/products/ProductList.vue`

说明：最复杂的列表页，有搜索 + 分类筛选 + 分页。

- [ ] **重构 ProductList.vue**

完整重写 template 使用新组件，script 逻辑保持不动。

---

### 任务 17：重构报表页

**文件：**
- 修改：`src/views/reports/SalesReport.vue`
- 修改：`src/views/reports/ProfitReport.vue`
- 修改：`src/views/reports/InventoryReport.vue`
- 修改：`src/views/reports/CustomerStatement.vue`

说明：报表页改动最小，主要是把 `card` 类替换为 BaseCard，把统计卡片替换为 StatCard，统一表格表头样式。

- [ ] **重构 SalesReport.vue**
- [ ] **重构 ProfitReport.vue**
- [ ] **重构 InventoryReport.vue**
- [ ] **重构 CustomerStatement.vue**

---

### 任务 18：重构剩余页面

**文件：**
- 修改：`src/views/warehouses/WarehouseStock.vue`（加低库存行高亮）
- 修改：`src/views/Settings.vue`

- [ ] **重构 WarehouseStock.vue**
- [ ] **重构 Settings.vue**

---

### 验证

- [ ] **运行 build 确认零错误**

```bash
cd C:\项目\MRO\mro-erp
npm run build
```
