<template>
  <div class="page-padding">
    <BasePageHeader title="客户管理">
      <div class="flex gap-2">
        <router-link to="/customers/import" class="btn-secondary text-sm">导入</router-link>
        <button class="btn-primary text-sm" @click="showNewModal = true">新增客户</button>
      </div>
    </BasePageHeader>

    <FilterBar v-model="search" show-search search-placeholder="搜索名称/联系人/电话..." @update:model-value="onSearch" />

    <!-- Type filter tabs -->
    <div class="flex gap-1.5 mb-4">
      <button :class="typeFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="typeFilter = ''; page = 1; fetchData()">
        全部
      </button>
      <button :class="typeFilter === 'retail' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="typeFilter = 'retail'; page = 1; fetchData()">
        零售客户
      </button>
      <button :class="typeFilter === 'wholesale' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors" @click="typeFilter = 'wholesale'; page = 1; fetchData()">
        批发客户
      </button>
    </div>

    <!-- Batch action bar -->
    <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 px-1">
      <span class="text-sm text-gray-500">已选 {{ selectedIds.length }} 项</span>
      <button class="btn-secondary text-sm" @click="selectedIds = []">取消选择</button>
      <button class="btn-secondary text-sm border-red-300 text-red-600 hover:bg-red-50" @click="confirmBatchDelete">批量删除</button>
    </div>

    <TableSkeleton v-if="loading" :show-search="true" />
    <div v-else-if="error" class="bg-white rounded-xl border border-gray-100 text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button class="btn-primary" @click="fetchData">重试</button>
    </div>
    <BaseCard v-else>
      <BaseTable
        :columns="columns"
        :data="list"
        selectable
        v-model:selected="selectedIds"
        empty-text="暂无客户"
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'name'">
            <router-link :to="`/customers/${row.id}`" class="text-primary-600 hover:text-primary-700">{{ highlightText(row.name ?? '', search) }}</router-link>
          </template>
          <template v-else-if="column.key === 'debt'">
            <span v-if="(debtMap[row.id] ?? 0) > 0.01" class="text-red-600 font-semibold">¥{{ debtMap[row.id].toFixed(2) }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="flex items-center gap-1 justify-end">
              <button v-if="(debtMap[row.id] ?? 0) > 0.01" class="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors" @click="openPayment(row)">收款</button>
              <router-link :to="`/customers/${row.id}/pricing`" class="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">价格</router-link>
              <div class="relative" @click.stop>
                <button class="text-gray-400 hover:text-gray-600 text-xs px-1" @click="toggleRowMenu(row.id)">···</button>
                <div v-if="openRowMenu === row.id" class="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[80px]">
                  <router-link :to="`/customers/${row.id}`" class="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">编辑</router-link>
                  <button class="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50" @click="openRowMenu = null; confirmDelete(row)">删除</button>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            {{ row[column.key] ?? '-' }}
          </template>
        </template>
      </BaseTable>
      <BasePagination :current-page="page" :total="total" :page-size="pageSize" @change="page = $event; fetchData()" />
    </BaseCard>

    <ConfirmDialog
      v-model="showDelete"
      type="danger"
      title="确认删除"
      :message="`确定要删除客户「${deleteTarget?.name}」吗？`"
      @confirm="handleDelete"
      @cancel="showDelete = false"
    />

    <ConfirmDialog
      v-model="showBatchDeleteDialog"
      type="danger"
      title="批量删除"
      :message="`确定要批量删除所选 ${selectedIds.length} 个客户吗？此操作不可恢复。`"
      :confirming="batchDeleting"
      @confirm="handleBatchDelete"
      @cancel="showBatchDeleteDialog = false"
    />

    <BaseModal v-model="showNewModal" title="新增客户" size="lg">
      <CustomerForm
        :standalone="false"
        @saved="onSaved"
        @cancel="showNewModal = false"
      />
    </BaseModal>

    <!-- Payment Collection Popup -->
    <div v-if="paymentPopup.visible" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">收款</h3>
            <p class="text-sm text-gray-500">客户：{{ paymentPopup.customerName }}</p>
          </div>
          <button class="text-gray-400 hover:text-gray-600" @click="paymentPopup.visible = false">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div v-if="paymentPopup.orders.length === 0" class="text-center py-8 text-gray-400">
          该客户没有未结清的订单
        </div>

        <template v-else>
          <div class="flex-1 overflow-y-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b border-gray-100">
                  <th class="pb-2 font-medium">单号</th>
                  <th class="pb-2 font-medium">日期</th>
                  <th class="pb-2 font-medium text-right">总额</th>
                  <th class="pb-2 font-medium text-right">已付</th>
                  <th class="pb-2 font-medium text-right">欠款</th>
                  <th class="pb-2 font-medium text-right">本次收款</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in paymentPopup.orders" :key="order.id" class="border-b border-gray-50">
                  <td class="py-2.5 font-medium text-gray-900">{{ order.order_no }}</td>
                  <td class="py-2.5 text-gray-500">{{ order.created_at }}</td>
                  <td class="py-2.5 text-right">¥{{ order.total_amount.toFixed(2) }}</td>
                  <td class="py-2.5 text-right text-green-600">¥{{ order.paid_amount.toFixed(2) }}</td>
                  <td class="py-2.5 text-right text-red-600 font-medium">¥{{ order.due.toFixed(2) }}</td>
                  <td class="py-2.5 text-right">
                    <input v-model.number="order.pay_amount" type="number" step="0.01" min="0" :max="order.due"
                      class="w-24 text-right text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div class="text-sm text-gray-500">
              本次合计收款：<span class="text-lg font-bold text-gray-900">¥{{ paymentPopup.orders.reduce((s, o) => s + (o.pay_amount || 0), 0).toFixed(2) }}</span>
            </div>
            <div class="flex gap-3">
              <button class="btn-secondary" @click="paymentPopup.visible = false">取消</button>
              <button class="btn-primary" :disabled="paymentPopup.saving" @click="submitPayment">
                {{ paymentPopup.saving ? '处理中...' : '确认收款' }}
              </button>
            </div>
          </div>
        </template>

        <div v-if="paymentPopup.error" class="mt-3 text-sm text-red-600">{{ paymentPopup.error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { fetchCustomers, deleteCustomer, batchDeleteCustomers, fetchSalesOrders, createPayment, updateSalesOrder } from '@/api'
import { useCommonStore } from '@/stores/common'
import { useDebounceFn } from '@/composables/useDebounce'
import { highlightText } from '@/lib/utils'
import type { Customer } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import BaseModal from '@/components/BaseModal.vue'
import BasePageHeader from '@/components/BasePageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseTable from '@/components/BaseTable.vue'
import FilterBar from '@/components/FilterBar.vue'
import BasePagination from '@/components/BasePagination.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import CustomerForm from '@/views/customers/CustomerForm.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const columns = [
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'contact_person', label: '联系人' },
  { key: 'phone', label: '电话' },
  { key: 'debt', label: '应收', align: 'right' as const },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const commonStore = useCommonStore()
const list = ref<Customer[]>([])
const search = ref('')
const typeFilter = ref('')
const loading = ref(true)
const error = ref('')
const showDelete = ref(false)
const showNewModal = ref(false)
const openRowMenu = ref<number | null>(null)
function toggleRowMenu(id: number) { openRowMenu.value = openRowMenu.value === id ? null : id }
const deleteTarget = ref<Customer | null>(null)
const page = ref(1)
const total = ref(0)
const pageSize = 15

// Batch operations
const selectedIds = ref<number[]>([])
const showBatchDeleteDialog = ref(false)
const batchDeleting = ref(false)

// Debt tracking
const debtMap = ref<Record<number, number>>({})

// Payment collection popup
const paymentPopup = reactive({
  visible: false,
  saving: false,
  error: '',
  customerId: 0,
  customerName: '',
  orders: [] as Array<{
    id: number
    order_no: string
    created_at: string
    total_amount: number
    paid_amount: number
    due: number
    pay_amount: number
  }>
})

function onSaved() {
  showNewModal.value = false
  fetchData()
}

const onSearch = useDebounceFn(() => { page.value = 1; fetchData() }, 300)

async function fetchData() {
  loading.value = true; error.value = ''
  try {
    const params: { search?: string; type?: string; page?: number; limit?: number } = {}
    if (search.value) params.search = search.value
    if (typeFilter.value) params.type = typeFilter.value
    params.page = page.value
    params.limit = pageSize
    const res = await fetchCustomers(params)
    if (res.data) list.value = res.data
    else error.value = res.error || '加载失败'
    total.value = res.count ?? list.value.length
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '网络错误'
  } finally { loading.value = false }
}

function confirmDelete(item: Customer) { deleteTarget.value = item; showDelete.value = true }
async function handleDelete() {
  if (!deleteTarget.value) return
  await deleteCustomer(deleteTarget.value.id!)
  showDelete.value = false; fetchData()
}

function confirmBatchDelete() {
  if (selectedIds.value.length === 0) return
  showBatchDeleteDialog.value = true
}

async function handleBatchDelete() {
  batchDeleting.value = true
  try {
    const res = await batchDeleteCustomers(selectedIds.value)
    if (res.error) {
      error.value = res.error
    } else {
      showBatchDeleteDialog.value = false
      selectedIds.value = []
      fetchData()
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '批量删除失败'
  } finally {
    batchDeleting.value = false
  }
}

/** Load debt amounts for all customers on current page */
async function loadDebts() {
  try {
    // Paginate through ALL completed orders to calculate accurate debt
    const debts: Record<number, number> = {}
    let page = 1
    let hasMore = true
    while (hasMore) {
      const { data: orders } = await fetchSalesOrders({ status: 'completed', page, limit: 200 })
      if (!orders || orders.length === 0) break
      for (const order of orders) {
        if (!order.customer_id) continue
        const due = (order.total_amount || 0) - (order.paid_amount || 0)
        if (due > 0.01) {
          debts[order.customer_id] = (debts[order.customer_id] ?? 0) + due
        }
      }
      hasMore = orders.length === 200
      page++
    }
    debtMap.value = debts
  } catch (e) {
    toast.error('加载欠款数据失败')
  }
}

/** Open payment collection popup for a customer */
async function openPayment(customer: Customer) {
  paymentPopup.customerId = customer.id!
  paymentPopup.customerName = customer.name
  paymentPopup.error = ''
  paymentPopup.visible = true

  // Fetch all orders for this customer that have outstanding balance
  const { data: orders } = await fetchSalesOrders({ customer_id: customer.id })
  paymentPopup.orders = (orders ?? [])
    .map(o => ({
      id: o.id,
      order_no: o.order_no,
      created_at: o.created_at?.slice(0, 10) ?? '',
      total_amount: o.total_amount || 0,
      paid_amount: o.paid_amount || 0,
      due: (o.total_amount || 0) - (o.paid_amount || 0),
      pay_amount: 0
    }))
    .filter(o => o.due > 0.01)

  // Pre-fill pay_amount with full due amount
  for (const o of paymentPopup.orders) {
    o.pay_amount = Math.round(o.due * 100) / 100
  }
}

/** Submit payment collection */
async function submitPayment() {
  if (paymentPopup.saving) return  // Prevent double-submit
  const ordersToPay = paymentPopup.orders.filter(o => o.pay_amount > 0)
  if (ordersToPay.length === 0) {
    paymentPopup.error = '请输入收款金额'
    return
  }

  // Validate amounts
  for (const o of ordersToPay) {
    if (o.pay_amount > o.due + 0.01) {
      paymentPopup.error = `单号 ${o.order_no} 收款金额不能超过欠款 ¥${o.due.toFixed(2)}`
      return
    }
  }

  paymentPopup.saving = true
  paymentPopup.error = ''

  try {
    for (const o of ordersToPay) {
      // Create payment record
      await createPayment({
        sales_order_id: o.id,
        type: 'payment',
        amount: o.pay_amount,
        payment_method: 'cash',
        paid_at: new Date().toISOString(),
        remark: '收款'
      })

      // Update order's paid_amount
      const newPaid = Math.round((o.paid_amount + o.pay_amount) * 100) / 100
      await updateSalesOrder(o.id, { paid_amount: newPaid })
    }

    paymentPopup.visible = false
    // Refresh debt data and invalidate shared cache
    await loadDebts()
    commonStore.invalidate('customers')
  } catch (e: unknown) {
    paymentPopup.error = e instanceof Error ? e.message : '收款失败'
  } finally {
    paymentPopup.saving = false
  }
}

onMounted(async () => {
  await fetchData()
  loadDebts()
})
</script>
