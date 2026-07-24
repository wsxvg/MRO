<template>
  <div class="page-padding">
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
    <template v-else>
      <BasePageHeader :title="`${productName} - 库存分布`" to="/products" />

      <div class="bg-white rounded-xl border border-gray-100 p-5 mt-6">
        <BaseTable
          :columns="[
            { key: 'warehouse_name', label: '仓库名称' },
            { key: 'quantity', label: '当前库存', align: 'right' },
            { key: 'updated_at', label: '更新时间' }
          ]"
          :data="list"
          :loading="false"
          empty-text="该商品暂无库存记录"
        >
          <template #cell="{ column, row }">
            <template v-if="column.key === 'warehouse_name'">
              <span class="font-medium text-gray-900">{{ row.warehouse_name || '-' }}</span>
            </template>
            <template v-if="column.key === 'quantity'">
              <span class="font-semibold text-gray-900">{{ row.quantity ?? 0 }}</span>
            </template>
            <template v-else-if="column.key === 'updated_at'">
              <span class="text-gray-500 text-sm">{{ formatTime(row.updated_at) }}</span>
            </template>
            <template v-else>
              {{ row[column.key] ?? '-' }}
            </template>
          </template>
        </BaseTable>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchStockByProduct, fetchProduct } from '@/api'
import type { Stock } from '@/types'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseTable from '@/components/BaseTable.vue'

const route = useRoute()
const productId = Number(route.params.id)
const productName = ref('')
const list = ref<Stock[]>([])
const loading = ref(true)

function formatTime(ts: string): string {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(async () => {
  const [pRes, sRes] = await Promise.all([
    fetchProduct(productId),
    fetchStockByProduct(productId),
  ])
  if (pRes.data) productName.value = pRes.data.name
  if (sRes.data) list.value = sRes.data
  loading.value = false
})
</script>
