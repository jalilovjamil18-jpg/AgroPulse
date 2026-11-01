param(
    [Parameter(Mandatory=$true)][string]$OldProject
)
$ErrorActionPreference = 'Stop'
$targetRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $OldProject 'backend\db.sqlite3'
$dest = Join-Path $targetRoot 'backend\db.sqlite3'
if (!(Test-Path $source)) { throw "Eski baza topilmadi: $source" }
if (Test-Path $dest) { throw "Yangi papkada db.sqlite3 mavjud. Xavfsizlik uchun avtomatik almashtirilmaydi: $dest" }
Write-Host 'Ikkala loyiha serverlari toxtatilgan bolishi kerak.' -ForegroundColor Yellow
Copy-Item -LiteralPath $source -Destination $dest -ErrorAction Stop
Write-Host "Baza nusxalandi: $dest" -ForegroundColor Green
Write-Host 'Endi setup_windows.bat migrationlarni bajaradi.'
