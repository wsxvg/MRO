<template>
  <div class="page-padding">
    <BasePageHeader title="客户对账单" />

    <!-- Filter -->
    <div class="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">客户</label>
          <select v-model="customerId" class="block w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
            <option value="">全部客户</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">开始日期</label>
          <input v-model="dateFrom" type="date" class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">结束日期</label>
          <input v-model="dateTo" type="date" class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
        </div>
        <button class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" @click="fetchData">查询</button>
        <button class="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors" @click="resetFilters">重置</button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" @click="exportExcel">导出 Excel</button>
        <button class="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors" @click="showPrintDialog = true">打印对账单</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Content -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="销售总额" :value="`¥${stats.totalSales.toFixed(2)}`" icon="ri-coin-line" color="blue" />
        <StatCard title="已收款" :value="`¥${stats.totalPaid.toFixed(2)}`" icon="ri-checkbox-circle-line" color="emerald" />
        <StatCard title="未收款" :value="`¥${(stats.totalSales - stats.totalPaid).toFixed(2)}`" icon="ri-time-line" color="red" />
      </div>

      <BaseCard>
        <BaseTable
          :columns="[
            { key: 'created_at', label: '日期' },
            { key: 'order_no', label: '单号' },
            { key: 'customer_name', label: '客户' },
            { key: 'total_amount', label: '销售金额', align: 'right' },
            { key: 'paid_amount', label: '已收款', align: 'right' },
            { key: 'due_amount', label: '未收款', align: 'right' },
            { key: 'status', label: '状态' }
          ]"
          :data="list"
          :loading="false"
          empty-text="暂无数据"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'order_no'">
              <span class="font-medium text-gray-900">{{ row.order_no }}</span>
            </template>
            <template v-else-if="column.key === 'created_at'">
              <span class="text-gray-500">{{ row.created_at?.slice(0, 10) }}</span>
            </template>
            <template v-else-if="column.key === 'customer_name'">
              {{ row.customer_name || '-' }}
            </template>
            <template v-else-if="column.key === 'paid_amount'">
              <span class="text-green-600 font-medium">¥{{ (row.paid_amount || 0).toFixed(2) }}</span>
            </template>
            <template v-else-if="column.key === 'due_amount'">
              <span class="text-red-600 font-medium">¥{{ ((row.total_amount || 0) - (row.paid_amount || 0)).toFixed(2) }}</span>
            </template>
            <template v-else-if="column.key === 'total_amount'">
              ¥{{ (row.total_amount || 0).toFixed(2) }}
            </template>
            <template v-else-if="column.key === 'status'">
              <StatusBadge :status="row.status || ''" />
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
      </BaseCard>
    </div>
  </div>

  <PrintStatement
    :visible="showPrintDialog"
    :customer-name="selectedCustomerName"
    :date-from="dateFrom || '全部'"
    :date-to="dateTo || '全部'"
    :rows="printRows"
    :unpaid-total="unpaidTotal"
    @close="showPrintDialog = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { fetchSalesOrders } from '@/api'
import { fetchCustomers } from '@/api'
import { useExcelExport } from '@/composables/useExcelExport'
import type { Customer } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PrintStatement from '@/views/reports/PrintStatement.vue'

const customers = ref<Customer[]>([])
const list = ref<any[]>([])
const loading = ref(false)
const customerId = ref<number | ''>('')
const dateFrom = ref('')
const dateTo = ref('')
const showPrintDialog = ref(false)

const stats = reactive({ totalSales: 0, totalPaid: 0 })

const selectedCustomerName = computed(() => {
  if (!customerId.value) return '全部客户'
  return customers.value.find(c => c.id === customerId.value)?.name || '全部客户'
})

const printRows = computed(() =>
  list.value.map(o => ({
    date: o.created_at?.slice(0, 10) || '',
    type: '订单' as const,
    order_no: o.order_no,
    amount: o.total_amount || 0,
  }))
)

const unpaidTotal = computed(() => stats.totalSales - stats.totalPaid)

function resetFilters() {
  customerId.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  fetchData()
}

async function fetchData() {
  loading.value = true
  const res = await fetchSalesOrders({
    customer_id: customerId.value || undefined,
    status: 'completed',
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value ? dateTo.value + ' 23:59:59' : undefined,
  })
  if (res.data) {
    list.value = res.data
    stats.totalSales = res.data.reduce((s, o) => s + (o.total_amount || 0), 0)
    stats.totalPaid = res.data.reduce((s, o) => s + (o.paid_amount || 0), 0)
  }
  loading.value = false
}

onMounted(async () => {
  const cRes = await fetchCustomers({})
  if (cRes.data) customers.value = cRes.data
  fetchData()
})

// 对账项目配色
const STYLE = {
  headerBg: { fill: { fgColor: { rgb: '1F4E79' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder() },
  subtotalBg: { fill: { fgColor: { rgb: 'FFF3E0' } }, font: { bold: true, sz: 10 }, border: thinBorder() },
  totalBg: { fill: { fgColor: { rgb: '1F4E79' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, alignment: { horizontal: 'right', vertical: 'center' }, border: thinBorder() },
  dataRow: { font: { sz: 10 }, border: thinBorder(), alignment: { vertical: 'center' } },
  amountRed: { font: { bold: true, color: { rgb: 'C00000' }, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder() },
  amountNormal: { font: { sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder() },
  titleStyle: { font: { bold: true, sz: 16, color: { rgb: '333333' } }, alignment: { horizontal: 'center', vertical: 'center' } },
}

function thinBorder() {
  return {
    top: { style: 'thin', color: { rgb: 'D0D0D0' } },
    bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
    left: { style: 'thin', color: { rgb: 'D0D0D0' } },
    right: { style: 'thin', color: { rgb: 'D0D0D0' } },
  }
}

function cellStyle(base: Record<string, any>, overrides?: Record<string, any>) {
  return { ...base, ...overrides }
}

async function exportExcel() {
  if (list.value.length === 0) return

  const XLSX = await import('xlsx-js-style')
  const wb = XLSX.utils.book_new()

  // 按客户分组
  const grouped = new Map<string, typeof list.value>()
  for (const order of list.value) {
    const name = order.customer_name || '未指定客户'
    if (!grouped.has(name)) grouped.set(name, [])
    grouped.get(name)!.push(order)
  }

  const custName = customerId.value ? (customers.value.find(c => c.id === customerId.value)?.name || '全部') : '全部客户'
  const dateLabel = `${dateFrom.value || '全部'} 至 ${dateTo.value || '全部'}`

  for (const [customerName, orders] of grouped) {
    const rows: any[][] = []
    const merges: any[] = []
    const styles: Record<string, Record<string, any>> = {}
    let rowIdx = 0

    // Title
    rows.push([`${custName} 对账单`])
    styles[`${rowIdx},0`] = STYLE.titleStyle
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } })
    rowIdx++

    // Date range
    rows.push([`日期范围: ${dateLabel}`])
    styles[`${rowIdx},0`] = { font: { sz: 10, color: { rgb: '666666' } }, alignment: { horizontal: 'center' } }
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } })
    rowIdx++

    // Empty row
    rows.push([])
    rowIdx++

    // Section header: 送货明细
    rows.push(['送货明细'])
    styles[`${rowIdx},0`] = { font: { bold: true, sz: 12, color: { rgb: '1F4E79' } } }
    merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 7 } })
    rowIdx++

    // Table header
    const headers = ['序号', '日期', '单号', '客户', '数量', '单价', '销售金额', '已收款']
    rows.push(headers)
    for (let c = 0; c < headers.length; c++) {
      styles[`${rowIdx},${c}`] = STYLE.headerBg
    }
    rowIdx++

    // Data rows
    let totalSales = 0
    let totalPaid = 0
    orders.forEach((order, i) => {
      const sales = order.total_amount || 0
      const paid = order.paid_amount || 0
      totalSales += sales
      totalPaid += paid
      rows.push([
        i + 1,
        order.created_at?.slice(0, 10) || '',
        order.order_no,
        order.customer_name || '-',
        '',
        '',
        sales,
        paid,
      ])
      for (let c = 0; c < 8; c++) {
        if (c === 6 || c === 7) {
          styles[`${rowIdx},${c}`] = cellStyle(STYLE.amountNormal, { numFmt: '¥#,##0.00' })
        } else {
          styles[`${rowIdx},${c}`] = c <= 3 ? cellStyle(STYLE.dataRow, { alignment: { horizontal: 'center', vertical: 'center' } }) : STYLE.dataRow
        }
      }
      rowIdx++
    })

    // Subtotal row
    rows.push(['', '', '', '小计:', '', '', totalSales, totalPaid])
    for (let c = 0; c < 8; c++) {
      if (c === 6 || c === 7) {
        styles[`${rowIdx},${c}`] = cellStyle(STYLE.subtotalBg, { font: { bold: true, color: { rgb: 'C00000' }, sz: 10 }, numFmt: '¥#,##0.00', alignment: { horizontal: 'center', vertical: 'center' } })
      } else if (c === 3) {
        styles[`${rowIdx},${c}`] = cellStyle(STYLE.subtotalBg, { alignment: { horizontal: 'right', vertical: 'center' } })
      } else {
        styles[`${rowIdx},${c}`] = STYLE.subtotalBg
      }
    }
    rowIdx++

    // Empty row
    rows.push([])
    rowIdx++

    // Total row
    const due = totalSales - totalPaid
    rows.push(['', '', '', '', '', '合计:', totalSales, due])
    for (let c = 0; c < 8; c++) {
      if (c === 5) {
        styles[`${rowIdx},${c}`] = STYLE.totalBg
      } else if (c === 6 || c === 7) {
        styles[`${rowIdx},${c}`] = cellStyle({ fill: { fgColor: { rgb: '1F4E79' } }, font: { bold: true, color: { rgb: 'C00000' }, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder() }, { numFmt: '¥#,##0.00' })
      } else {
        styles[`${rowIdx},${c}`] = STYLE.headerBg
      }
    }
    rowIdx++

    // 实付金额 row
    rows.push(['', '', '', '', '', '实付金额:', totalSales, ''])
    for (let c = 0; c < 8; c++) {
      if (c === 5) {
        styles[`${rowIdx},${c}`] = STYLE.totalBg
      } else if (c === 6) {
        styles[`${rowIdx},${c}`] = cellStyle({ fill: { fgColor: { rgb: '1F4E79' } }, font: { bold: true, color: { rgb: 'C00000' }, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder() }, { numFmt: '¥#,##0.00' })
      } else {
        styles[`${rowIdx},${c}`] = STYLE.headerBg
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!merges'] = merges
    ws['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
      { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ]
    ws['!rows'] = Array(rowIdx + 1).fill({ hpt: 22 })
    ws['!rows'][0] = { hpt: 35 }

    // Apply styles
    for (const [key, style] of Object.entries(styles)) {
      const [r, c] = key.split(',').map(Number)
      const cellRef = XLSX.utils.encode_cell({ r, c })
      if (ws[cellRef]) ws[cellRef].s = style
    }

    const sheetName = customerName.length > 31 ? customerName.slice(0, 31) : customerName
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  const fileName = `客户对账单_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}
</script>
