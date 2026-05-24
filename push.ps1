# PowerShell script to push MRO to GitHub
$ErrorActionPreference = "Stop"
$repoPath = "C:\项目\MRO"
Set-Location -LiteralPath $repoPath

Write-Output "=== Git status ==="
git status

Write-Output "`n=== Git log ==="
git log --oneline -5

Write-Output "`n=== Staging all files ==="
git add -A

Write-Output "`n=== Status after staging ==="
git status

Write-Output "`n=== Committing ==="
git commit -m "feat: MRO 进销存系统 v1.0.0

- 商品管理、客户管理、销售管理、仓库管理
- Tauri v2 desktop app with auto-update
- Supabase backend with RLS
- PWA support
- ECharts 按需引入优化"

Write-Output "`n=== Pushing to main ==="
git push -u origin main 2>&1

Write-Output "`n=== DONE ==="
