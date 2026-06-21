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
            <tr v-for="(item, idx) in items" :key="item.id" class="border-b border-gray-200">
              <td class="py-2 text-gray-500">{{ idx + 1 }}</td>
              <td class="py-2 font-medium">{{ item.product_name }}</td>
              <td class="py-2 text-gray-500">{{ item.product_specification || '' }}</td>
              <td class="py-2 text-right">{{ item.quantity }}</td>
              <td class="py-2 text-right">¥{{ (item.unit_price || 0).toFixed(2) }}</td>
              <td class="py-2 text-right font-medium">¥{{ (item.line_total || 0).toFixed(2) }}</td>
            </tr>
            <tr v-for="n in Math.max(0, 4 - items.length)" :key="'empty-' + n" class="border-b border-gray-200">
              <td class="py-2">&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-gray-900">
              <td colspan="3" class="py-2 text-right font-medium">合计：</td>
              <td class="py-2 text-right font-medium">{{ totalQuantity }}</td>
              <td></td>
              <td class="py-2 text-right text-lg font-bold">¥{{ (order.total_amount || 0).toFixed(2) }}</td>
            </tr>
          </tfoot>
        </table>

        <div class="mt-4 flex justify-between text-sm">
          <div v-if="order.remark" class="text-gray-500">备注：{{ order.remark }}</div>
          <div></div>
          <div class="text-right space-y-1">
            <p>已付：<span class="font-medium">¥{{ (order.paid_amount || 0).toFixed(2) }}</span></p>
            <p v-if="unpaid > 0" class="text-red-600 font-medium">未付：¥{{ unpaid.toFixed(2) }}</p>
          </div>
        </div>

        <div class="mt-8 flex justify-between text-sm">
          <div>制单人签字：________________</div>
          <div>客户签收：________________</div>
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
import { computed } from 'vue'
import type { SalesOrder, SalesOrderItem } from '@/types'

const props = defineProps<{
  visible: boolean
  order: SalesOrder
  items: SalesOrderItem[]
}>()

defineEmits<{ close: [] }>()

const unpaid = computed(() => (props.order.total_amount || 0) - (props.order.paid_amount || 0))
const totalQuantity = computed(() => props.items.reduce((s, i) => s + i.quantity, 0))

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

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
    size: A5 landscape;
    margin: 10mm;
  }
}
</style>
