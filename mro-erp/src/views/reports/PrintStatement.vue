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
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" class="border-b border-gray-200">
              <td class="py-2">{{ row.date }}</td>
              <td class="py-2">
                <span :class="row.type === '订单' ? 'text-blue-600' : 'text-green-600'">{{ row.type }}</span>
              </td>
              <td class="py-2">{{ row.order_no }}</td>
              <td class="py-2 text-right font-medium" :class="row.type === '订单' ? 'text-gray-900' : 'text-green-600'">
                {{ row.type === '订单' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
              </td>
            </tr>
            <tr v-for="n in Math.max(0, 4 - rows.length)" :key="'empty-' + n" class="border-b border-gray-200">
              <td class="py-2">&nbsp;</td><td></td><td></td><td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-gray-900">
              <td colspan="3" class="py-2 text-right font-medium">未付合计：</td>
              <td class="py-2 text-right text-lg font-bold" :class="unpaidTotal > 0 ? 'text-red-600' : 'text-green-600'">
                ¥{{ unpaidTotal.toFixed(2) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="mt-8 flex justify-between text-sm">
          <div>制单人签字：________________</div>
          <div>客户确认：________________</div>
        </div>
        <div class="mt-3 flex justify-between text-sm text-gray-500">
          <div>日期：________________</div>
          <div>日期：________________</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  customerName: string
  dateFrom: string
  dateTo: string
  rows: Array<{ date: string; type: string; order_no: string; amount: number }>
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
  .print-popup {
    position: static !important;
    background: none !important;
    display: block !important;
  }
  .print-area {
    box-shadow: none !important;
    border-radius: 0 !important;
    max-height: none !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .print-content {
    overflow: visible !important;
    padding: 10mm !important;
  }
  @page {
    size: A4;
    margin: 12mm;
  }
}
</style>
