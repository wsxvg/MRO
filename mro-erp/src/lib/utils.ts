/**
 * 高亮文本中的搜索关键词，返回带 <mark> 标签的 HTML
 */
export function highlightText(text: string | null | undefined, query: string): string {
  if (!query || !text) return text ?? ''
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-yellow-200 rounded px-0.5 text-inherit">$1</mark>')
}
