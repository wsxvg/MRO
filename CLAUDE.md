# MRO 进销存 ERP - AI 全自动构建说明

## 一句话启动指令

把下面这句话粘贴到你的 AI 编码工具（Claude Code / Cursor / OpenCode）：

"请阅读当前目录下的 CLAUDE.md、SPEC.md 和 BUILD_PLAN.md 三个文件，然后使用 frontend-design skill 设计所有前端页面，严格按照 BUILD_PLAN.md 的 15 个 Task 顺序，逐步完成整个 MRO 进销存系统的开发，每个 Task 完成后检查无误再进入下一步。"

## 前置条件

1. **Supabase 项目**：去 https://supabase.com 创建一个免费项目，在项目 Settings > API 获取 URL 和 anon key
2. **AI 工具**：推荐 Claude Code 或 OpenCode，你当前用的这个就可以
3. **首次运行**：AI 读取 C:\项目\MRO 下的文档后会自动开始构建

## 自动化流程

AI 收到指令后会自动：
1. 读取 SPEC.md 了解全部需求
2. 读取 BUILD_PLAN.md 了解 15 个 Task 的分步计划
3. 使用 frontend-design skill 设计现代化 UI
4. 按顺序执行：建项目结构 → 建数据库 → 写前端页面 → 测接口
5. 每完成一个 Task 记录进度
6. 全部完成后通知你

## 关于 UI 设计

- AI 会自动使用 frontend-design skill 生成现代化、美观的 UI
- 默认风格：简洁、移动端优先、统一配色
- 如果你后期想换风格，直接对 AI 说一句话即可，例如"重新设计所有页面，用蓝色主题和卡片式布局"
- UI 是纯前端表现层，改样式不影响任何业务逻辑和数据库

## 注意事项

- 如果 AI 问 Supabase URL 和 Key，粘贴 .env 文件里对应的值
- 构建过程中 AI 可能会执行 npm install，确保网络通畅
- 全部完成后运行 npm run dev 即可预览

## ⚠️ 编码红线（必须遵守）

**写入所有包含中文/非 ASCII 字符的文件时，必须使用 UTF-8 编码。**

- 禁止使用 `powershell` 的 `Out-File` / `>` / `Set-Content` 写入含中文的文件——这些命令默认使用 GBK 编码
- 写入文件必须使用 `write` 工具（自动 UTF-8），或 `bash` 中显式指定 `-Encoding utf8` / `-Encoding utf8NoBOM`
- 任何涉及中文的文件写入操作，完成后立即检查文件编码（`bash: [System.Text.Encoding]::Default.GetString([System.IO.File]::ReadAllBytes("path"))` 或 VS Code 右下角编码指示器）
- 如果连续出现编码乱码，优先怀疑写入渠道的编码链路，而不是重写代码内容
