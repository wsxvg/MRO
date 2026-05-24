Set-Location -LiteralPath "C:\项目\MRO\mro-erp"
git add -A
git commit -m "feat: add Tauri signing config and tag-release CI workflow"
git push origin main
git tag v1.0.0
git push origin v1.0.0
Write-Output "DONE"
