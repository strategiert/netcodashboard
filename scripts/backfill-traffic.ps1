# Einmaliger Backfill weeklyReports aus GA4 (Chunks wegen Action-Zeitlimit + API-Quota)
Set-Location "C:\Users\karent\Documents\Software\netco\_shared\dashboard"
$chunks = @("24 19","18 13","12 7","6 0")
foreach ($c in $chunks) {
  $p = $c -split " "
  Write-Host "Chunk Wochen $($p[0])..$($p[1])"
  npx convex run actions/syncTraffic:syncTraffic ("{`"weeksBack`":$($p[0]),`"weeksUntil`":$($p[1])}")
  Start-Sleep -Seconds 30
}
