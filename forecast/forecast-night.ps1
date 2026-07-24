# Forecast-Nachtlauf: pull.mjs (Convex-Reads) -> run.py (Chronos-2 Forecast + Backtest)
# -> push.mjs (HMAC-Ingest nach Convex). Taeglich 09:30 via Task Scheduler 'netco-forecast'.
$ErrorActionPreference = 'Continue'
$Repo = 'C:\Users\karent\Documents\Software\netco\_shared\dashboard'
$LogDir = Join-Path $Repo 'forecast\logs'
New-Item -ItemType Directory -Force $LogDir | Out-Null
$Today = Get-Date -Format 'yyyy-MM-dd'
Start-Transcript -Path (Join-Path $LogDir "night-$Today.log") -Append

try {
  Set-Location $Repo

  # Log-Rotation: 30 Tage
  Get-ChildItem $LogDir -Filter *.log | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force -Confirm:$false

  # 1. Pull: read-only Convex-Queries -> forecast/data/input.json
  node --env-file=.env.local forecast\pull.mjs
  if ($LASTEXITCODE -ne 0) {
    Write-Output "PULL FEHLGESCHLAGEN (Exit $LASTEXITCODE) — Abbruch, kein Forecast, kein Push."
    exit 1
  }

  # 2. Run: Chronos-2 Forecast + 7-Tage-Backtest -> forecast/data/output.json
  & (Join-Path $Repo 'forecast\.venv\Scripts\python.exe') (Join-Path $Repo 'forecast\run.py')
  if ($LASTEXITCODE -ne 0) {
    Write-Output "RUN.PY FEHLGESCHLAGEN (Exit $LASTEXITCODE) — Abbruch, kein Push."
    exit 1
  }

  # 3. Push: HMAC-Ingest nach Convex (POST /forecast/ingest). Bei Fehler bricht
  # push.mjs selbst mit Exit 1 ab, ohne done=true zu senden — alte Generation
  # bleibt aktiv (gewollt), daher hier kein zusaetzlicher Sonderfall noetig.
  node --env-file=.env.local forecast\push.mjs
  if ($LASTEXITCODE -ne 0) {
    Write-Output "PUSH FEHLGESCHLAGEN (Exit $LASTEXITCODE) — alte Generation bleibt aktiv (gewollt)."
    exit 1
  }

  Write-Output "Forecast-Nachtlauf $Today erfolgreich."
} finally {
  Stop-Transcript
}
