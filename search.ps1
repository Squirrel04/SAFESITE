Get-ChildItem -Path d:\safesite -File -Recurse -Force | 
    Where-Object { 
        $_.FullName -notmatch "\\\.venv\\" -and 
        $_.FullName -notmatch "\\venv\\" -and 
        $_.FullName -notmatch "\\node_modules\\" -and 
        $_.FullName -notmatch "\\\.git\\" 
    } | 
    Select-String -Pattern "insforge" -List -ErrorAction SilentlyContinue | 
    Select-Object Path
