# Tägliches Backup der Convex-Prod-Datenbank (netco-marketing-workstation).
# Läuft als Windows Scheduled Task "NetCoDashboard Convex Backup" (07:30).
# Ablage: C:\Users\karent\Backups\netcodashboard\ — Retention 30 Dateien.
# Zusätzlich Cloud-Kopie nach Klaus OS (externalBackup-Endpoint, Retention 30);
# der Klaus-OS-Watchdog-Cron alertet per Telegram, wenn kein frisches Backup ankommt.
$ErrorActionPreference = "Stop"

$repo = "C:\Users\karent\Documents\Software\netco\_shared\dashboard"
$backupDir = "C:\Users\karent\Backups\netcodashboard"
$logFile = Join-Path $backupDir "backup.log"
New-Item -ItemType Directory -Force $backupDir | Out-Null

$stamp = Get-Date -Format "yyyy-MM-dd"
$target = Join-Path $backupDir "netcodashboard-prod-$stamp.zip"

function Log($msg) {
    Add-Content $logFile "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg"
}

try {
    Set-Location $repo
    npx convex export --prod --path $target 2>&1 | Out-Null
    if (-not (Test-Path $target) -or (Get-Item $target).Length -lt 10KB) {
        throw "Export-Datei fehlt oder verdächtig klein"
    }
    Log "OK  $target ($([math]::Round((Get-Item $target).Length/1MB,1)) MB)"

    # Cloud-Kopie nach Klaus OS. Fehler hier sind nicht fatal (lokales Backup
    # steht) — der Klaus-OS-Watchdog meldet ausbleibende Uploads ohnehin.
    try {
        $secret = (Select-String "C:\Users\karent\.env" -Pattern '^BACKUP_UPLOAD_SECRET_KLAUS_OS=(.+)$').Matches[0].Groups[1].Value.Trim()
        $uri = "https://industrious-boar-90.eu-west-1.convex.site/external-backup?project=netco-dashboard&date=$stamp"
        Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "x-backup-secret" = $secret } -InFile $target -ContentType "application/zip" | Out-Null
        Log "OK  Cloud-Kopie Klaus OS"
    } catch {
        Log "WARN  Cloud-Upload fehlgeschlagen: $($_.Exception.Message)"
    }

    # Retention: nur die 30 neuesten Backups behalten
    Get-ChildItem $backupDir -Filter "netcodashboard-prod-*.zip" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip 30 |
        Remove-Item -Force -Confirm:$false
} catch {
    Log "FEHLER  $($_.Exception.Message)"
    exit 1
}
