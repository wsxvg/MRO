import { defineConfig } from 'vitest/config'

// 仅测试纯函数（报表/金额计算等），不需要 DOM / 真实数据库
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
