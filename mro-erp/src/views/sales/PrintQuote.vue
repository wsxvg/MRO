<template>
  <div v-if="visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50 print-popup">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col print-area">
      <!-- Action bar (hidden when printing) -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-gray-100 no-print">
        <h3 class="text-lg font-semibold text-gray-900">报价单</h3>
        <div class="flex gap-2">
          <button class="btn-primary text-sm" @click="doPrint">🖨️ 打印</button>
          <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <!-- Printable content -->
      <div class="flex-1 overflow-y-auto p-6 print-content">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-900">汇友机电设备有限公司</h1>
            <p class="text-xs text-gray-500 mt-1">地址：德清新市环西路103号</p>
            <p class="text-xs text-gray-500">电话：13666527113</p>
          </div>
          <div class="text-right">
            <h2 class="text-2xl font-bold text-gray-900 tracking-widest">报 价 单</h2>
            <p class="text-xs text-gray-500 mt-2">报价日期：{{ today }}</p>
            <p class="text-xs text-gray-500">有效期至：{{ validUntil }}</p>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-gray-900 mb-4"></div>

        <!-- Customer info -->
        <div class="mb-4 text-sm">
          <p><span class="text-gray-500">致：</span><span class="font-medium">{{ order.customer_name || '尊敬的客户' }}</span></p>
          <p v-if="order.order_no"><span class="text-gray-500">报价编号：</span>{{ order.order_no }}</p>
        </div>

        <!-- Items table -->
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-t-2 border-b-2 border-gray-900">
              <th class="py-2 text-left font-medium" style="width: 40px">序号</th>
              <th class="py-2 text-left font-medium">商品名称</th>
              <th class="py-2 text-left font-medium">规格</th>
              <th class="py-2 text-right font-medium" style="width: 60px">数量</th>
              <th class="py-2 text-right font-medium" style="width: 90px">单价</th>
              <th class="py-2 text-right font-medium" style="width: 100px">小计</th>
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
              <td class="py-2 text-right font-medium">{{ items.reduce((s, i) => s + i.quantity, 0) }}</td>
              <td></td>
              <td class="py-2 text-right text-lg font-bold">¥{{ (order.total_amount || 0).toFixed(2) }}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Remarks -->
        <div v-if="order.remark" class="mt-3 text-sm">
          <span class="text-gray-500">备注：</span>{{ order.remark }}
        </div>

        <!-- Terms -->
        <div class="mt-6 text-xs text-gray-500 space-y-1">
          <p>1. 本报价有效期为30天，过期需重新报价。</p>
          <p>2. 付款方式：现金/转账/微信/支付宝。</p>
          <p>3. 如有疑问请致电 13666527113。</p>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-right text-sm">
          <p class="font-medium">汇友机电设备有限公司</p>
          <p class="text-gray-500 text-xs mt-1">{{ today }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SalesOrder, SalesOrderItem } from '@/types'

defineProps<{
  visible: boolean
  order: SalesOrder
  items: SalesOrderItem[]
}>()

defineEmits<{
  close: []
}>()

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const validUntil = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

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
    margin: 15mm;
  }
}
</style>
