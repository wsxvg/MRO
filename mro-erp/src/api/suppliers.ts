import { supabase } from '@/lib/supabase'
import type { Supplier, ApiResult, ListResponse } from '@/types'

export async function fetchSuppliers(params?: {
  page?: number
  limit?: number
}): Promise<ListResponse<Supplier>> {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 100
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact' })
    .order('name')
    .range(from, to)

  return { data: (data as Supplier[]) ?? [], count: count ?? 0, error: error?.message ?? null }
}

export async function fetchAllSuppliers(): Promise<{ data: Supplier[]; error: string | null }> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  return { data: (data as Supplier[]) ?? [], error: error?.message ?? null }
}

export async function createSupplier(input: {
  name: string
  contact_person?: string | null
  phone?: string | null
  remark?: string | null
}): Promise<ApiResult<Supplier>> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(input as any)
    .select()
    .single()

  return { data: data as Supplier | null, error: error?.message ?? null }
}

export async function updateSupplier(
  id: number,
  input: Partial<Pick<Supplier, 'name' | 'contact_person' | 'phone' | 'remark'>>
): Promise<ApiResult<Supplier>> {
  const { data, error } = await supabase
    .from('suppliers')
    .update(input as any)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Supplier | null, error: error?.message ?? null }
}

export async function deleteSupplier(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  return { data: null, error: error?.message ?? null }
}
