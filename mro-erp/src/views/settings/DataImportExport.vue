<template>
  <div>
    <h2 class="text-lg font-semibold text-gray-900 mb-6">数据导入导出</h2>

    <div class="space-y-6">
      <!-- 商品导入导出 -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h3 class="text-base font-semibold text-gray-900 mb-4">商品数据</h3>
        <div class="flex gap-3">
          <router-link to="/products/import" class="btn-secondary text-sm">导入商品</router-link>
          <button class="btn-secondary text-sm" @click="exportProducts">导出商品</button>
        </div>
        <p class="text-xs text-gray-400 mt-2">支持 CSV / XLSX 格式</p>
      </div>

      <!-- 客户导入导出 -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h3 class="text-base font-semibold text-gray-900 mb-4">客户数据</h3>
        <div class="flex gap-3">
          <router-link to="/customers/import" class="btn-secondary text-sm">导入客户</router-link>
          <button class="btn-secondary text-sm" @click="exportCustomers">导出客户</button>
        </div>
        <p class="text-xs text-gray-400 mt-2">支持 CSV / XLSX 格式</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { productsApi, customersApi } from '@/api'

async function exportProducts() {
  const result = await productsApi.exportAll()
  if (result.error || !result.data) return
  const XLSX = await import('xlsx-js-style')
  const ws = XLSX.utils.json_to_sheet(result.data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '商品')
  XLSX.writeFile(wb, `商品数据_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

async function exportCustomers() {
  const result = await customersApi.getAll({ limit: 10000 })
  if (result.error || !result.data) return
  const data = result.data.map(c => ({
    名称: c.name,
    联系人: c.contact_person || '',
    电话: c.phone || '',
    地址: c.address || '',
  }))
  const XLSX = await import('xlsx-js-style')
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '客户')
  XLSX.writeFile(wb, `客户数据_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>
