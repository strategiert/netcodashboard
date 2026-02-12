
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"

Write-Host "=============================================="
Write-Host "  MARKETING ANALYSE: NETCO & MICROVISTA"
Write-Host "  Zeitraum: 2023-2025"
Write-Host "=============================================="
Write-Host ""

# === NETCO TRAFFIC ===
$netcoTrafficFile = "$basePath\Traffic_acquisition_Session_source_medium.csv"
$netcoTraffic = @{
    "Paid (PPC)" = 0
    "Organic (SEO)" = 0
    "Direct" = 0
    "Referral" = 0
    "Social" = 0
    "Newsletter" = 0
    "Sonstige" = 0
}
$netcoTotal = 0
$netcoEngaged = 0

Get-Content $netcoTrafficFile -Encoding UTF8 | ForEach-Object {
    if ($_ -match "^[a-zA-Z()]" -and $_ -notmatch "^Session source") {
        $parts = $_ -split ","
        if ($parts.Count -ge 3) {
            $source = $parts[0].ToLower()
            $sessions = [int]$parts[1]
            $engaged = [int]$parts[2]
            $netcoTotal += $sessions
            $netcoEngaged += $engaged
            
            if ($source -match "cpc|paid|werbeanzeige") {
                $netcoTraffic["Paid (PPC)"] += $sessions
            } elseif ($source -match "organic") {
                $netcoTraffic["Organic (SEO)"] += $sessions
            } elseif ($source -match "direct.*none") {
                $netcoTraffic["Direct"] += $sessions
            } elseif ($source -match "newsletter|email|cleverreach") {
                $netcoTraffic["Newsletter"] += $sessions
            } elseif ($source -match "linkedin|facebook|xing|instagram|social") {
                $netcoTraffic["Social"] += $sessions
            } elseif ($source -match "referral") {
                $netcoTraffic["Referral"] += $sessions
            } else {
                $netcoTraffic["Sonstige"] += $sessions
            }
        }
    }
}

# === MICROVISTA TRAFFIC ===
$mvTrafficFile = "$basePath\Traffic_acquisition_Session_source_medium (1).csv"
$mvTraffic = @{
    "Paid (PPC)" = 0
    "Organic (SEO)" = 0
    "Direct" = 0
    "Referral" = 0
    "Social" = 0
    "Newsletter" = 0
    "Sonstige" = 0
}
$mvTotal = 0
$mvEngaged = 0

Get-Content $mvTrafficFile -Encoding UTF8 | ForEach-Object {
    if ($_ -match "^[a-zA-Z()]" -and $_ -notmatch "^Session source") {
        $parts = $_ -split ","
        if ($parts.Count -ge 3) {
            $source = $parts[0].ToLower()
            $sessions = [int]$parts[1]
            $engaged = [int]$parts[2]
            $mvTotal += $sessions
            $mvEngaged += $engaged
            
            if ($source -match "cpc|paid|werbeanzeige") {
                $mvTraffic["Paid (PPC)"] += $sessions
            } elseif ($source -match "organic") {
                $mvTraffic["Organic (SEO)"] += $sessions
            } elseif ($source -match "direct.*none") {
                $mvTraffic["Direct"] += $sessions
            } elseif ($source -match "newsletter|email|cleverreach|nessie") {
                $mvTraffic["Newsletter"] += $sessions
            } elseif ($source -match "linkedin|facebook|xing|instagram|social") {
                $mvTraffic["Social"] += $sessions
            } elseif ($source -match "referral") {
                $mvTraffic["Referral"] += $sessions
            } else {
                $mvTraffic["Sonstige"] += $sessions
            }
        }
    }
}

# === OUTPUT ===
Write-Host "=== TRAFFIC UEBERSICHT (2023-2025) ==="
Write-Host ""
Write-Host ("{0,-20} {1,15} {2,15} {3,15}" -f "Kanal", "NetCo", "Microvista", "GESAMT")
Write-Host ("{0,-20} {1,15} {2,15} {3,15}" -f "-----", "-----", "----------", "------")

$channels = @("Paid (PPC)", "Organic (SEO)", "Direct", "Referral", "Social", "Newsletter", "Sonstige")
foreach ($ch in $channels) {
    $nc = $netcoTraffic[$ch]
    $mv = $mvTraffic[$ch]
    $total = $nc + $mv
    Write-Host ("{0,-20} {1,15:N0} {2,15:N0} {3,15:N0}" -f $ch, $nc, $mv, $total)
}
Write-Host ("{0,-20} {1,15} {2,15} {3,15}" -f "-----", "-----", "----------", "------")
Write-Host ("{0,-20} {1,15:N0} {2,15:N0} {3,15:N0}" -f "TOTAL", $netcoTotal, $mvTotal, ($netcoTotal + $mvTotal))

# === WERBEKOSTEN ===
Write-Host ""
Write-Host ""
Write-Host "=== WERBEKOSTEN UEBERSICHT ==="
Write-Host ""

# NetCo costs (from earlier analysis)
$netcoCosts = @{
    2023 = 227824  # 467614 - 33656 (MV) - we need recalc
    2024 = 240380
    2025 = 314825
}

# MV costs
$mvCosts = @{
    2023 = 33656
    2024 = 23552
    2025 = 46297
}

# Expansion (10% of total)
$expansionCosts = @{
    2023 = 0  # No expansion in 2023
    2024 = 26547  # 10% of 265473
    2025 = 33672  # 10% of 336715
}

Write-Host "Nach Firma:"
Write-Host ("{0,-20} {1,15} {2,15} {3,15} {4,15}" -f "Firma", "2023", "2024", "2025", "GESAMT")
Write-Host ("{0,-20} {1,15} {2,15} {3,15} {4,15}" -f "-----", "----", "----", "----", "------")

$netco2023 = 194168
$netco2024 = 216828
$netco2025 = 268528
Write-Host ("{0,-20} {1,12:N0} EUR {2,12:N0} EUR {3,12:N0} EUR {4,12:N0} EUR" -f "NetCo (DE)", $netco2023, $netco2024, $netco2025, ($netco2023+$netco2024+$netco2025))

Write-Host ("{0,-20} {1,12:N0} EUR {2,12:N0} EUR {3,12:N0} EUR {4,12:N0} EUR" -f "Microvista", $mvCosts[2023], $mvCosts[2024], $mvCosts[2025], ($mvCosts[2023]+$mvCosts[2024]+$mvCosts[2025]))

Write-Host ("{0,-20} {1,12:N0} EUR {2,12:N0} EUR {3,12:N0} EUR {4,12:N0} EUR" -f "Expansion (IT/NL)*", $expansionCosts[2023], $expansionCosts[2024], $expansionCosts[2025], ($expansionCosts[2023]+$expansionCosts[2024]+$expansionCosts[2025]))

$total2023 = $netco2023 + $mvCosts[2023]
$total2024 = $netco2024 + $mvCosts[2024]
$total2025 = $netco2025 + $mvCosts[2025]
Write-Host ("{0,-20} {1,15} {2,15} {3,15} {4,15}" -f "-----", "----", "----", "----", "------")
Write-Host ("{0,-20} {1,12:N0} EUR {2,12:N0} EUR {3,12:N0} EUR {4,12:N0} EUR" -f "GESAMT", $total2023, $total2024, $total2025, ($total2023+$total2024+$total2025))

Write-Host ""
Write-Host "* Expansion = geschaetzt 10% des Gesamtbudgets ab 2024"

# === KOSTEN PRO SESSION ===
Write-Host ""
Write-Host ""
Write-Host "=== KOSTEN PRO SESSION ==="
Write-Host ""

# NetCo
$netcoCostTotal = $netco2023 + $netco2024 + $netco2025
$netcoCPS = [math]::Round($netcoCostTotal / $netcoTotal, 2)
Write-Host "NetCo:"
Write-Host "  Werbekosten (3 Jahre): $([math]::Round($netcoCostTotal,0)) EUR"
Write-Host "  Sessions (3 Jahre): $netcoTotal"
Write-Host "  Kosten/Session: $netcoCPS EUR"

# Microvista
$mvCostTotal = $mvCosts[2023] + $mvCosts[2024] + $mvCosts[2025]
$mvCPS = [math]::Round($mvCostTotal / $mvTotal, 2)
Write-Host ""
Write-Host "Microvista:"
Write-Host "  Werbekosten (3 Jahre): $([math]::Round($mvCostTotal,0)) EUR"
Write-Host "  Sessions (3 Jahre): $mvTotal"
Write-Host "  Kosten/Session: $mvCPS EUR"

# PPC specific
$ppcTotal = 132307 + 211705 + 252390
$ppcSessions = $netcoTraffic["Paid (PPC)"] + $mvTraffic["Paid (PPC)"]
$ppcCPS = [math]::Round($ppcTotal / $ppcSessions, 2)
Write-Host ""
Write-Host "NUR PPC (beide):"
Write-Host "  PPC Kosten (3 Jahre): $ppcTotal EUR"
Write-Host "  PPC Sessions (3 Jahre): $ppcSessions"
Write-Host "  PPC Kosten/Session: $ppcCPS EUR"

# SEO (free traffic value)
$seoSessions = $netcoTraffic["Organic (SEO)"] + $mvTraffic["Organic (SEO)"]
$seoValue = $seoSessions * $ppcCPS
Write-Host ""
Write-Host "SEO (Organic) Wert:"
Write-Host "  Organic Sessions: $seoSessions"
Write-Host "  Wert wenn PPC: $([math]::Round($seoValue, 0)) EUR (gespart)"
