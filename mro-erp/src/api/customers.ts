import { supabase } from '@/lib/supabase'
import type { Customer, CustomerPrice, ApiResult, ListResponse } from '@/types'

// ====== Customers ======

export async function fetchCustomers(params?: {
  search?: string
  type?: string
  page?: number
  limit?: number
}): Promise<ListResponse<Customer>> {
  let query = supabase.from('customers').select('*', { count: 'exact' })

  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    )
  }

  if (params?.type) {
    query = query.eq('type', params.type)
  }

  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(from, to)

  return { data: data ?? [], count: count ?? 0, error: error?.message ?? null }
}

export async function fetchCustomer(id: number): Promise<ApiResult<Customer>> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
  return { data, error: error?.message ?? null }
}

export async function createCustomer(
  input: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResult<Customer>> {
  const { data, error } = await supabase.from('customers').insert(input as never).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateCustomer(
  id: number,
  input: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResult<Customer>> {
  const { data, error } = await supabase.from('customers').update(input as never).eq('id', id).select().single()
  return { data, error: error?.message ?? null }
}

export async function deleteCustomer(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  return { data: null, error: error?.message ?? null }
}

// ====== Customer Prices ======

export async function fetchCustomerPrices(
  customerId: number
): Promise<ListResponse<CustomerPrice>> {
  const { data, error } = await supabase
    .from('customer_prices')
    .select('*, products!left(name, sku, reference_price)')
    .eq('customer_id', customerId)

  const mapped = (data ?? []).map((p: any) => ({
    customer_id: p.customer_id,
    product_id: p.product_id,
    price: p.price,
    product_name: p.products?.name ?? null,
    product_sku: p.products?.sku ?? null,
    reference_price: p.products?.reference_price ?? null
  }))

  return { data: mapped, count: mapped.length, error: error?.message ?? null }
}

export async function upsertCustomerPrices(
  prices: { customer_id: number; product_id: number; price: number }[]
): Promise<ApiResult<null>> {
  const { error } = await supabase.from('customer_prices').upsert(prices as never, {
    onConflict: 'customer_id,product_id'
  })
  return { data: null, error: error?.message ?? null }
}

export async function deleteCustomerPrice(
  customerId: number,
  productId: number
): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from('customer_prices')
    .delete()
    .eq('customer_id', customerId)
    .eq('product_id', productId)
  return { data: null, error: error?.message ?? null }
}