import type { Ref } from 'vue'

interface ExportColumn {
  key: string
  label: string
  width?: number
  format?: (value: any) => string | number
}

/**
 * 通用 Excel 导出 composable
 * @param columns 列定义
 * @param data 响应式数据源
 * @param filename 文件名前缀
 *
 * @example
 * ```ts
 * const { exportExcel } = useExcelExport(columns, rows, '销售报表')
 * // 点击导出按钮时调用
 * exportExcel()
 * ```
 */
export function useExcelExport(
  columns: ExportColumn[],
  data: Ref<any[]>,
  filename: string
) {
  async function exportExcel() {
    if (data.value.length === 0) {
      return { success: false, message: '暂无数据可导出' }
    }

    try {
      const XLSX = await import('xlsx-js-style')

      const rows = data.value.map(row =>
        Object.fromEntries(
          columns.map(col => {
            const raw = row[col.key]
            const value = col.format ? col.format(raw) : raw
            return [col.label, value]
          })
        )
      )

      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = columns.map(col => ({ wch: col.width ?? 12 }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31))

      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `${filename}_${date}.xlsx`)

      return { success: true, message: '导出成功' }
    } catch {
      return { success: false, message: '导出失败，请重试' }
    }
  }

  return { exportExcel }
}
