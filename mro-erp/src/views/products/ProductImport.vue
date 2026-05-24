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

      <div v-if="parseError" class="card mb-6 border-red-300 bg-red-50">
        <p class="text-sm text-red-600">{{ parseError }}</p>
      </div>

      <div v-if="preview.length > 0" class="card mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">预览 ({{ preview.length }} 条)</h3>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2 font-medium text-xs w-12">ID</th>
                <th class="pb-2 font-medium">名称</th>
                <th class="pb-2 font-medium">分类</th>
                <th class="pb-2 font-medium">规格型号</th>
                <th class="pb-2 font-medium">单位</th>
                <th class="pb-2 font-medium text-right">售价</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in preview" :key="i" class="border-b border-gray-100">
                <td class="py-2 text-xs text-gray-400">{{ row.id ?? '-' }}</td>
                <td class="py-2">{{ row.name }}</td>
                <td class="py-2">{{ row.category }}</td>
                <td class="py-2">{{ row.specification }}</td>
                <td class="py-2">{{ row.unit }}</td>
                <td class="py-2 text-right">{{ row.reference_price }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex items-center gap-4">
          <label class="flex items-center gap-1 text-sm text-gray-600">
            <span>重复商品：</span>
            <select v-model="duplicateStrategy" class="input text-sm py-1 w-36">
              <option value="overwrite">覆盖更新</option>
              <option value="skip">跳过重复</option>
            </select>
          </label>
          <button class="btn-primary" :disabled="saving" @click="doImport">
            {{ saving ? '导入中...' : '确认导入' }}
          </button>
        </div>
      </div>

      <div v-if="result" class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">导入结果</h3>
        <p class="text-sm">新增: <span class="text-green-600 font-medium">{{ result.created_count }}</span></p>
        <p class="text-sm" v-if="result.updated_count > 0">更新: <span class="text-blue-600 font-medium">{{ result.updated_count }}</span></p>
        <p class="text-sm" v-if="result.skipped_count > 0">跳过(重复): <span class="text-yellow-600 font-medium">{{ result.skipped_count }}</span></p>
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
import * as XLSX from 'xlsx'
import { productsApi } from '@/api'

interface PreviewRow {
  id?: number
  name: string
  category?: string
  unit?: string
  reference_price?: string
  cost_price?: string
  specification?: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const preview = ref<PreviewRow[]>([])
const duplicateStrategy = ref<'skip' | 'overwrite'>('overwrite')
const result = ref<{ created_count: number; updated_count: number; skipped_count: number; error_count: number; errors?: string[] } | null>(null)
const parseError = ref<string | null>(null)
const saving = ref(false)
let currentFileName = ''

function openFile() { fileInput.value?.click() }

const COLUMN_MAP: Record<string, keyof PreviewRow> = {
  '名称': 'name',
  '商品名称': 'name',
  '商品名称*': 'name',
  '分类': 'category',
  '分类*': 'category',
  '规格型号': 'specification',
  '单位': 'unit',
  '单位*': 'unit',
  '售价': 'reference_price',
  '售价*': 'reference_price',
  '进价': 'cost_price',
  '进价*': 'cost_price',
  '成本价': 'cost_price',
  'name': 'name',
  'category': 'category',
  'specification': 'specification',
  'unit': 'unit',
  'price': 'reference_price',
  'selling_price': 'reference_price',
  'cost': 'cost_price',
  'cost_price': 'cost_price',
  'ID': 'id',
  'id': 'id',
}

function parseCSV(text: string): PreviewRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('文件为空或只有表头')
  const headers = lines[0].split(',').map(h => h.trim())
  const rows: PreviewRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      const mapped = COLUMN_MAP[h] || h
      row[mapped] = vals[idx] ?? ''
    })
    if (row.name) {
      rows.push({
        id: row.id ? Number(row.id) : undefined,
        name: row.name,
        category: row.category || '',
        specification: row.specification || '',
        unit: row.unit || '',
        reference_price: row.reference_price || row.price || '',
        cost_price: row.cost_price || row.cost || '',
      })
    }
  }
  return rows
}

function parseXLSX(data: ArrayBuffer): PreviewRow[] {
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  if (!json.length) throw new Error('文件中没有数据')
  const headers = Object.keys(json[0])
  // Detect if using Chinese or English headers
  const useChinese = headers.some(h => COLUMN_MAP[h] !== undefined)
  const rows: PreviewRow[] = []
  for (const raw of json) {
    let mapped: Record<string, string> = {}
    if (useChinese) {
      for (const [h, v] of Object.entries(raw)) {
        const key = COLUMN_MAP[h] || h
        mapped[key] = String(v)
      }
    } else {
      mapped = raw as Record<string, string>
    }
    if (mapped.name) {
      rows.push({
        id: mapped.id ? Number(mapped.id) : undefined,
        name: mapped.name,
        category: mapped.category || '',
        specification: mapped.specification || '',
        unit: mapped.unit || '',
        reference_price: mapped.reference_price || mapped.price || '',
        cost_price: mapped.cost_price || mapped.cost || '',
      })
    }
  }
  return rows
}

function handleFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  parseError.value = null
  result.value = null
  preview.value = []
  currentFileName = file.name

  const isXLSX = /\.xlsx?$/i.test(file.name)

  if (isXLSX) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        preview.value = parseXLSX(reader.result as ArrayBuffer)
        if (!preview.value.length) parseError.value = '未能解析到有效商品数据，请检查列名是否为"名称"'
      } catch (err: any) {
        parseError.value = `文件解析失败: ${err?.message || '未知错误'}`
      }
    }
    reader.readAsArrayBuffer(file)
  } else {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        preview.value = parseCSV(reader.result as string)
        if (!preview.value.length) parseError.value = '未能解析到有效商品数据，请检查列名是否为"名称"'
      } catch (err: any) {
        parseError.value = `文件解析失败: ${err?.message || '未知错误'}`
      }
    }
    reader.readAsText(file)
  }
}

function downloadTemplate() {
  const bom = '\uFEFF'
  const blob = new Blob([bom + '名称,分类,单位,售价,成本价'], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '商品导入模板.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function doImport() {
  if (!preview.value.length) return
  saving.value = true
  result.value = null
  try {
    const items = preview.value.map(r => ({
      id: r.id || null,
      name: r.name,
      category: r.category || '',
      specification: r.specification || '',
      unit: r.unit || '个',
      selling_price: r.reference_price || '0',
      cost_price: r.cost_price,
    }))
    const res = await productsApi.batchUpsert(items, duplicateStrategy.value)
    result.value = {
      created_count: res.created,
      updated_count: res.updated,
      skipped_count: res.skipped,
      error_count: res.errors.length,
      errors: res.errors,
    }
    if (!res.errors.length) preview.value = []
  } catch (err: any) {
    result.value = { created_count: 0, updated_count: 0, skipped_count: 0, error_count: preview.value.length, errors: [err?.message || '导入失败'] }
  } finally {
    saving.value = false
  }
}
</script>
