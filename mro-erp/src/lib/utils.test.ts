import { describe, it, expect } from 'vitest'
import {
  calcGrossProfit,
  calcMarginRate,
  computeStatementFinal,
  highlightText,
} from './utils'

describe('金额计算', () => {
  it('calcGrossProfit = 销售额 - 成本', () => {
    expect(calcGrossProfit(100, 60)).toBe(40)
    expect(calcGrossProfit(0, 0)).toBe(0)
    expect(calcGrossProfit(50, 80)).toBe(-30) // 亏本
  })

  it('calcMarginRate 正常毛利率保留 1 位小数', () => {
    expect(calcMarginRate(100, 40)).toBe('40.0')
    expect(calcMarginRate(90, 9)).toBe('10.0')
  })

  it('calcMarginRate 销售额为 0 时返回 0.0', () => {
    expect(calcMarginRate(0, 0)).toBe('0.0')
  })

  it('computeStatementFinal = 应收 - 退货', () => {
    expect(computeStatementFinal(1000, 200)).toBe(800)
    expect(computeStatementFinal(0, 0)).toBe(0)
  })
})

describe('highlightText', () => {
  it('无关键词原样返回', () => {
    expect(highlightText('扳手', '')).toBe('扳手')
  })

  it('关键词被 <mark> 包裹', () => {
    expect(highlightText('活动扳手', '扳手')).toContain('<mark')
    expect(highlightText('活动扳手', '扳手')).toContain('扳手')
  })

  it('特殊正则字符不报错', () => {
    expect(highlightText('a.b', '.')).toContain('<mark')
  })
})
