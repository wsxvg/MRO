Set-Location -LiteralPath "C:\项目\MRO\mro-erp"
git rm .github/workflows/tag-release.yml
git add src-tauri/tauri.conf.json
git commit -m "fix: NSIS installMode perUser→currentUser for Tauri v2, remove duplicate workflow"
git push origin main
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
git tag v1.0.0
git push origin v1.0.0
Write-Output "DONE"
