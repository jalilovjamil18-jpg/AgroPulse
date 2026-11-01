$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root 'backend\db.sqlite3'
if (!(Test-Path $source)) { throw "Baza topilmadi. Avval o‘rnatish va migrationni bajaring." }
Write-Host 'Backup olishdan oldin backend serverini toxtating!' -ForegroundColor Yellow
$folder = Join-Path $root 'backups'
New-Item -ItemType Directory -Force $folder | Out-Null
$dest = Join-Path $folder ('agropulse_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.sqlite3')
Copy-Item -LiteralPath $source -Destination $dest -ErrorAction Stop
Write-Host "Zaxira tayyor: $dest" -ForegroundColor Green
