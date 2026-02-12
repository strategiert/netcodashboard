
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"

# ===== TRAFFIC DATA ANALYSIS =====
Write-Host "=== TRAFFIC ANALYSE (2023-01 bis 2026-01) ==="
Write-Host ""

$trafficFile = "$basePath\Traffic_acquisition_Session_source_medium.csv"
$trafficContent = Get-Content $trafficFile -Encoding UTF8

# Parse traffic data
$trafficData = @{}
$totalSessions = 0
$totalEngaged = 0

foreach ($line in $trafficContent) {
    if ($line -match "^[a-zA-Z()]") {
        $parts = $line -split ","
        if ($parts.Count -ge 2 -and $parts[0] -ne "Session source / medium") {
            $source = $parts[0]
            $sessions = [int]$parts[1]
            $engaged = [int]$parts[2]
            
            # Categorize traffic source
            $category = "Sonstige"
            $sourceLower = $source.ToLower()
            
            if ($sourceLower -match "google.*cpc|microsoft.*cpc|bing.*cpc|fb.*paid|ig.*paid|linkedin.*paid|facebook.*werbeanzeige") {
                $category = "Paid Traffic (PPC/Ads)"
            } elseif ($sourceLower -match "google.*organic|bing.*organic|yahoo.*organic|ecosia|duckduckgo|qwant") {
                $category = "Organic Search (SEO)"
            } elseif ($sourceLower -match "direct.*none") {
                $category = "Direct Traffic"
            } elseif ($sourceLower -match "linkedin|facebook|xing|instagram|social") {
                $category = "Social Media"
            } elseif ($sourceLower -match "newsletter|email|cleverreach") {
                $category = "Newsletter/Email"
            } elseif ($sourceLower -match "referral") {
                $category = "Referral Traffic"
            } elseif ($sourceLower -match "presse|welt|handelsblatt") {
                $category = "PR/Presse"
            }
            
            if (-not $trafficData.ContainsKey($category)) {
                $trafficData[$category] = @{Sessions=0; Engaged=0}
            }
            $trafficData[$category].Sessions += $sessions
            $trafficData[$category].Engaged += $engaged
            $totalSessions += $sessions
            $totalEngaged += $engaged
        }
    }
}

Write-Host "TRAFFIC NACH KANAL (Gesamt 2023-2026):"
Write-Host "========================================"
$trafficData.GetEnumerator() | Sort-Object {$_.Value.Sessions} -Descending | ForEach-Object {
    $pct = [math]::Round(($_.Value.Sessions / $totalSessions) * 100, 1)
    $engRate = [math]::Round(($_.Value.Engaged / $_.Value.Sessions) * 100, 1)
    Write-Host ("{0,-30} {1,10:N0} Sessions ({2,5}%)  Engagement: {3}%" -f $_.Key, $_.Value.Sessions, $pct, $engRate)
}
Write-Host "----------------------------------------"
Write-Host ("{0,-30} {1,10:N0} Sessions (100%)" -f "GESAMT:", $totalSessions)

# ===== COST DATA BY BRAND =====
Write-Host ""
Write-Host ""
Write-Host "=== WERBEKOSTEN NACH MARKE ==="
Write-Host ""

# Re-read CSV files to get vendor details for brand assignment
$brandCosts = @{
    "Bodycam" = @{2023=0; 2024=0; 2025=0}
    "BauTV+" = @{2023=0; 2024=0; 2025=0}
    "Microvista" = @{2023=0; 2024=0; 2025=0}
    "NetCo Allgemein" = @{2023=0; 2024=0; 2025=0}
}

$csvFiles = @(
    @{File="Werbekosten MV 2023.csv"; Company="MV"; Year=2023},
    @{File="Werbekosten MV 2024.csv"; Company="MV"; Year=2024},
    @{File="Werbekosten MV 2025.csv"; Company="MV"; Year=2025},
    @{File="Werbekosten NetCo 2023.csv"; Company="NetCo"; Year=2023},
    @{File="Werbekosten NetCo 2024.csv"; Company="NetCo"; Year=2024},
    @{File="Werbekosten NetCo 2025.csv"; Company="NetCo"; Year=2025}
)

foreach ($csvInfo in $csvFiles) {
    $filePath = Join-Path $basePath $csvInfo.File
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Encoding UTF8
        foreach ($line in $content) {
            if ($line -match "^,46") {
                $parts = $line -split ","
                if ($parts.Count -ge 10) {
                    $description = $parts[6].ToLower()
                    $vendorName = $parts[8].ToLower()
                    
                    # Extract amount
                    $amountMatch = [regex]::Match($line, '([\d.]+),?(\d*)\s*EUR')
                    $amount = 0
                    if ($amountMatch.Success) {
                        $amountStr = $amountMatch.Groups[1].Value + "." + $amountMatch.Groups[2].Value
                        $amountStr = $amountStr.TrimEnd(".")
                        try {
                            $amount = [double]$amountStr
                        } catch {}
                    }
                    
                    # Assign to brand based on company and keywords
                    $brand = "NetCo Allgemein"
                    
                    if ($csvInfo.Company -eq "MV") {
                        $brand = "Microvista"
                    } else {
                        # NetCo - try to assign to Bodycam or BauTV+
                        if ($description -match "bodycam|body cam|polizei|sicherheit|kamera" -or $vendorName -match "bodycam") {
                            $brand = "Bodycam"
                        } elseif ($description -match "bautv|baustell|webcam|bauwerk" -or $vendorName -match "bautv|baustell") {
                            $brand = "BauTV+"
                        }
                    }
                    
                    $brandCosts[$brand][$csvInfo.Year] += $amount
                }
            }
        }
    }
}

Write-Host "WERBEKOSTEN NACH MARKE:"
Write-Host "======================="
Write-Host ""
Write-Host ("{0,-20} {1,15} {2,15} {3,15} {4,15}" -f "Marke", "2023", "2024", "2025", "GESAMT")
Write-Host ("{0,-20} {1,15} {2,15} {3,15} {4,15}" -f "-----", "----", "----", "----", "------")

$totalAll = 0
foreach ($brand in @("Bodycam", "BauTV+", "Microvista", "NetCo Allgemein")) {
    $y2023 = $brandCosts[$brand][2023]
    $y2024 = $brandCosts[$brand][2024]
    $y2025 = $brandCosts[$brand][2025]
    $total = $y2023 + $y2024 + $y2025
    $totalAll += $total
    Write-Host ("{0,-20} {1,12:N2} EUR {2,12:N2} EUR {3,12:N2} EUR {4,12:N2} EUR" -f $brand, $y2023, $y2024, $y2025, $total)
}
Write-Host ("{0,-20} {1,15} {2,15} {3,15} {4,15}" -f "-----", "----", "----", "----", "------")
Write-Host ("{0,-20} {1,12:N2} EUR {2,12:N2} EUR {3,12:N2} EUR {4,12:N2} EUR" -f "GESAMT", ($brandCosts["Bodycam"][2023]+$brandCosts["BauTV+"][2023]+$brandCosts["Microvista"][2023]+$brandCosts["NetCo Allgemein"][2023]), ($brandCosts["Bodycam"][2024]+$brandCosts["BauTV+"][2024]+$brandCosts["Microvista"][2024]+$brandCosts["NetCo Allgemein"][2024]), ($brandCosts["Bodycam"][2025]+$brandCosts["BauTV+"][2025]+$brandCosts["Microvista"][2025]+$brandCosts["NetCo Allgemein"][2025]), $totalAll)

# Cost per Session calculation
Write-Host ""
Write-Host ""
Write-Host "=== KOSTEN PRO SESSION (Näherung) ==="
Write-Host "(Traffic-Daten sind nur für NetCo allgemein verfügbar)"
Write-Host ""

$netcoTotal = 0
foreach ($brand in @("Bodycam", "BauTV+", "NetCo Allgemein")) {
    $netcoTotal += $brandCosts[$brand][2023] + $brandCosts[$brand][2024] + $brandCosts[$brand][2025]
}

# Approximate sessions per year (total is 3 years of data)
$sessionsPerYear = [math]::Round($totalSessions / 3)
$costPerSession = [math]::Round($netcoTotal / $totalSessions, 2)

Write-Host "NetCo Gesamt-Werbekosten (3 Jahre): $([math]::Round($netcoTotal, 2)) EUR"
Write-Host "Gesamt Sessions (3 Jahre): $totalSessions"
Write-Host "Durchschnitt Kosten/Session: $costPerSession EUR"

# PPC specific
$ppcSessions = $trafficData["Paid Traffic (PPC/Ads)"].Sessions
$ppcCosts = 132307 + 211705 + 252390  # PPC costs from earlier analysis
$ppcCostPerSession = [math]::Round($ppcCosts / $ppcSessions, 2)
Write-Host ""
Write-Host "PPC Kosten (3 Jahre): $ppcCosts EUR"
Write-Host "PPC Sessions (3 Jahre): $ppcSessions"
Write-Host "PPC Kosten/Session: $ppcCostPerSession EUR"
