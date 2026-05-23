# Git setup script for MRO project - Step 2
Write-Output "=== Git Setup Step 2 ==="

# Set environment variables
$env:CI = "true"
$env:DEBIAN_FRONTEND = "noninteractive"
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"
$env:GIT_EDITOR = ":"
$env:EDITOR = ":"
$env:VISUAL = ""
$env:GIT_SEQUENCE_EDITOR = ":"
$env:GIT_MERGE_AUTOEDIT = "no"
$env:GIT_PAGER = "cat"
$env:PAGER = "cat"

# Rename branch to main (GitHub default)
Write-Output "--- Renaming branch to main ---"
git branch -m master main
if (-not $?) { Write-Error "git branch rename failed"; exit 1 }

# Add remote
Write-Output "--- Adding remote ---"
git remote add origin https://github.com/wsxvg/MRO.git
if (-not $?) { Write-Error "git remote add failed"; exit 1 }

# Stage all files (excluding .sisyphus per .gitignore)
Write-Output "--- Staging files ---"
git add .
if (-not $?) { Write-Error "git add failed"; exit 1 }

# Commit
Write-Output "--- Creating initial commit ---"
git commit -m "init MRO ERP"
if (-not $?) { Write-Error "git commit failed"; exit 1 }

Write-Output "=== Git setup complete ==="
Write-Output ""
Write-Output "--- Git log ---"
git log --oneline

Write-Output ""
Write-Output "--- Git status ---"
git status
