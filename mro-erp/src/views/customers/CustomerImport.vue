<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/customers" class="text-gray-500 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">导入客户</h1>
    </div>

    <div class="max-w-2xl">
      <div
        class="card mb-6 border-dashed transition-colors"
        :class="isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200'"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="text-center py-8 px-6">
          <svg class="w-16 h-16 mx-auto mb-4" :class="isDragging ? 'text-gray-900' : 'text-gray-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-gray-700 mb-2 font-medium">{{ isDragging ? '松开即可上传文件' : '点击或拖拽文件到此处上传' }}</p>
          <p class="text-sm text-gray-400 mb-4">支持 .xlsx, .xls, .csv 格式</p>
          <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span v-if="currentFileName" class="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              <i class="ri-file-text-line text-sm"></i>
              {{ currentFileName }}
            </span>
            <span v-else class="text-xs text-gray-400">还没有选择文件</span>
          </div>
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" ref="fileInput" @change="handleFile" />
          <button class="btn-primary" @click="openFile">选择文件</button>
          <button class="btn-secondary ml-2" @click="downloadTemplate">下载模板</button>
        </div>
      </div>

      <div v-if="parseError" class="card mb-6 border-red-200 bg-red-50">
        <div class="flex items-start gap-3 p-4">
          <i class="ri-error-warning-line text-red-500 text-lg mt-0.5"></i>
          <div>
            <p class="text-sm font-medium text-red-700 mb-1">文件解析失败</p>
            <p class="text-sm text-red-600">{{ parseError }}</p>
          </div>
        </div>
      </div>

      <div v-if="preview.length > 0" class="card mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">预览 ({{ preview.length }} 条)</h3>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2 font-medium">名称</th>
                <th class="pb-2 font-medium">联系人</th>
                <th class="pb-2 font-medium">电话</th>
                <th class="pb-2 font-medium">地址</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in preview" :key="i" class="border-b border-gray-100">
                <td class="py-2">{{ row.name }}</td>
                <td class="py-2">{{ row.contact_person }}</td>
                <td class="py-2">{{ row.phone }}</td>
                <td class="py-2">{{ row.address }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4">
          <button class="btn-primary" :disabled="saving" @click="doImport">
            {{ saving ? '导入中...' : '确认导入' }}
          </button>
        </div>
      </div>

      <div v-else-if="!parseError" class="mb-6 text-sm text-gray-400">
        选中文件后会在这里显示预览，确认无误再导入。
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
import { customersApi } from '@/api'

interface PreviewRow {
  name: string
  contact_person?: string
  phone?: string
  address?: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const preview = ref<PreviewRow[]>([])
const result = ref<{ success_count: number; error_count: number; errors?: string[] } | null>(null)
const parseError = ref<string | null>(null)
const saving = ref(false)
const currentFileName = ref('')
const isDragging = ref(false)
let xlsxModulePromise: Promise<typeof import('xlsx')> | null = null

async function getXLSX() {
  xlsxModulePromise ||= import('xlsx')
  return xlsxModulePromise
}

function openFile() { fileInput.value?.click() }

function handleDragEnter() {
  isDragging.value = true
}

function handleDragOver() {
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !fileInput.value) return
  const dt = new DataTransfer()
  dt.items.add(file)
  fileInput.value.files = dt.files
  handleFile({ target: fileInput.value } as unknown as Event)
}

const COLUMN_MAP: Record<string, keyof PreviewRow> = {
  '名称': 'name',
  '联系人': 'contact_person',
  '电话': 'phone',
  '手机': 'phone',
  '地址': 'address',
  'name': 'name',
  'contact_person': 'contact_person',
  'contact': 'contact_person',
  'phone': 'phone',
  'tel': 'phone',
  'address': 'address',
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
        name: row.name,
        contact_person: row.contact_person || '',
        phone: row.phone || '',
        address: row.address || '',
      })
    }
  }
  return rows
}

async function parseXLSX(data: ArrayBuffer): Promise<PreviewRow[]> {
  const XLSX = await getXLSX()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  if (!json.length) throw new Error('文件中没有数据')
  const headers = Object.keys(json[0])
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
        name: mapped.name,
        contact_person: mapped.contact_person || '',
        phone: mapped.phone || '',
        address: mapped.address || '',
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
  currentFileName.value = file.name

  const isXLSX = /\.xlsx?$/i.test(file.name)

  if (isXLSX) {
    const reader = new FileReader()
    reader.onload = () => {
      ;(async () => {
        try {
          preview.value = await parseXLSX(reader.result as ArrayBuffer)
          if (!preview.value.length) parseError.value = '未能解析到有效客户数据，请检查列名是否为"名称"'
        } catch (err: any) {
          parseError.value = `文件解析失败: ${err?.message || '未知错误'}`
        }
      })()
    }
    reader.readAsArrayBuffer(file)
  } else {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        preview.value = parseCSV(reader.result as string)
        if (!preview.value.length) parseError.value = '未能解析到有效客户数据，请检查列名是否为"名称"'
      } catch (err: any) {
        parseError.value = `文件解析失败: ${err?.message || '未知错误'}`
      }
    }
    reader.readAsText(file)
  }
}

function downloadTemplate() {
  const bom = '\uFEFF'
  const blob = new Blob([bom + '名称,联系人,电话,地址'], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = '客户导入模板.csv'; a.click()
  URL.revokeObjectURL(url)
}

async function doImport() {
  if (!preview.value.length) return
  saving.value = true
  result.value = null
  try {
    const items = preview.value.map(r => ({
      name: r.name,
      contact_person: r.contact_person || null,
      phone: r.phone || null,
      address: r.address || null,
    }))
    const res = await customersApi.import(items)
    if (res.success) {
      result.value = { success_count: preview.value.length, error_count: 0 }
      preview.value = []
    } else {
      result.value = { success_count: 0, error_count: preview.value.length, errors: [res.error || '导入失败'] }
    }
  } catch (err: any) {
    result.value = { success_count: 0, error_count: preview.value.length, errors: [err?.message || '导入失败'] }
  } finally {
    saving.value = false
  }
}
</script>
