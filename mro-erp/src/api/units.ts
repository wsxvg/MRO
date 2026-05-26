import { supabase } from '@/lib/supabase'
import type { Database, Unit, ApiResult, ListResponse } from '@/types'

export async function fetchUnits(): Promise<ListResponse<Unit>> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('sort_order', { ascending: true })
  return { data: data ?? [], count: data?.length ?? 0, error: error?.message ?? null }
}

export async function createUnit(input: Pick<Unit, 'name' | 'sort_order'>): Promise<ApiResult<Unit>> {
  const { data: existing } = await supabase
    .from('units')
    .select('id')
    .eq('name', input.name)
    .maybeSingle()
  if (existing) {
    return { data: null, error: `单位「${input.name}」已存在` }
  }

  const { data, error } = await supabase.from('units').insert(input as any).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateUnit(id: number, input: Partial<Pick<Unit, 'name' | 'sort_order'>>): Promise<ApiResult<Unit>> {
  if (input.name) {
    const { data: existing } = await supabase
      .from('units')
      .select('id')
      .neq('id', id)
      .eq('name', input.name)
      .maybeSingle()
    if (existing) {
      return { data: null, error: `单位「${input.name}」已存在` }
    }
  }

  const { data, error } = await supabase.from('units').update(input as any).eq('id', id).select().single()
  return { data, error: error?.message ?? null }
}

export async function deleteUnit(id: number): Promise<ApiResult<null>> {
  const { error } = await supabase.from('units').delete().eq('id', id)
  return { data: null, error: error?.message ?? null }
}
