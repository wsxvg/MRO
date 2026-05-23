<template>
  <div>
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <router-link to="/products" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">导入商品</h1>
      </div>

      <div class="card mb-6">
        <div class="text-center py-8">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-gray-600 mb-2">点击或拖拽文件到此处上传</p>
          <p class="text-sm text-gray-400 mb-4">支持 .xlsx, .xls, .csv 格式</p>
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" ref="fileInput" @change="handleFile" />
          <button class="btn-primary" @click="openFile">选择文件</button>
          <button class="btn-secondary ml-2" @click="downloadTemplate">下载模板</button>
        </div>
      </div>

      <div v-if="preview.length > 0" class="card mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">预览 ({{ preview.length }} 条)</h3>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2 font-medium">SKU</th>
                <th class="pb-2 font-medium">名称</th>
                <th class="pb-2 font-medium">分类</th>
                <th class="pb-2 font-medium">单位</th>
                <th class="pb-2 font-medium text-right">售价</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in preview" :key="i" class="border-b border-gray-100">
                <td class="py-2">{{ row.sku }}</td>
                <td class="py-2">{{ row.name }}</td>
                <td class="py-2">{{ row.category }}</td>
                <td class="py-2">{{ row.unit }}</td>
                <td class="py-2 text-right">{{ row.selling_price }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4">
          <button class="btn-primary" @click="doImport">确认导入</button>
        </div>
      </div>

      <div v-if="result" class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">导入结果</h3>
        <p class="text-sm">成功: <span class="text-green-600 font-medium">{{ result.success_count }}</span></p>
        <p class="text-sm">失败: <span class="text-red-600 font-medium">{{ result.error_count }}</span></p>
        <div v-if="result.errors?.length" class="mt-2">
          <p v-for="(err, i) in result.errors" :key="i" class="text-xs text-red-500">{{ err }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { productsApi } from '@/api'

const fileInput = ref<HTMLInputElement | null>(null)
const preview = ref<any[]>([])
const result = ref<{ success_count: number; error_count: number; errors?: string[] } | null>(null)

function openFile() { fileInput.value?.click() }

function handleFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    const reader = new FileReader()
    reader.onload = () => {
      preview.value = [{ sku: 'DEMO-001', name: '示例商品', category: '电子', unit: '个', selling_price: '100.00' }]
    }
    reader.readAsText(input.files[0])
  }
}

function downloadTemplate() {
  const bom = '\uFEFF'
  const blob = new Blob([bom + 'SKU,名称,分类,单位,售价,成本价'], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '商品导入模板.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function doImport() {
  const res = await productsApi.import(preview.value)
  result.value = res.success
    ? { success_count: preview.value.length, error_count: 0 }
    : { success_count: 0, error_count: preview.value.length, errors: [res.error || '导入失败'] }
}
</script>