
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"

Write-Host "=============================================="
Write-Host "  GOOGLE ADS ANALYSE NACH MARKE"
Write-Host "  Zeitraum: 2023-2025"
Write-Host "=============================================="
Write-Host ""

$csvFile = "$basePath\Campaign performance.csv"

# Skip first 2 header lines and import
$csvContent = Get-Content $csvFile -Encoding UTF8 | Select-Object -Skip 2 | ConvertFrom-Csv

# Initialize brand totals
$brandData = @{}
$countryData = @{}
$typeData = @{}

foreach ($row in $csvContent) {
    $campaign = $row.Campaign
    $cost = 0
    $clicks = 0
    $conv = 0
    
    # Parse cost (handle different formats)
    $costStr = $row.Cost -replace "[^0-9.]", ""
    if ($costStr) { 
        try { $cost = [double]$costStr } catch {} 
    }
    
    # Parse clicks
    $clickStr = $row.Clicks -replace "[^0-9]", ""
    if ($clickStr) { 
        try { $clicks = [int]$clickStr } catch {} 
    }
    
    # Parse conversions
    $convStr = $row.Conversions -replace "[^0-9.]", ""
    if ($convStr) { 
        try { $conv = [double]$convStr } catch {} 
    }
    
    if ($cost -eq 0) { continue }
    
    # Determine brand
    $brand = "Sonstige"
    $campaignUpper = $campaign.ToUpper()
    
    if ($campaignUpper.StartsWith("BK-") -or $campaignUpper.StartsWith("BK ") -or $campaignUpper -match "BAUSTELLENKAMERA|BAUTV") {
        $brand = "BauTV+"
    } elseif ($campaignUpper.StartsWith("BC-") -or $campaignUpper.StartsWith("BC ") -or $campaignUpper -match "BODYCAM|BODY.CAM") {
        $brand = "Bodycam"
    } elseif ($campaignUpper.StartsWith("NDT-") -or $campaignUpper.StartsWith("NDT ") -or $campaignUpper.StartsWith("MV-") -or $campaignUpper -match "MICROVISTA|SCANEXPRESS|ULTRASCHALL") {
        $brand = "Microvista"
    } elseif ($campaignUpper.StartsWith("NC-") -or $campaignUpper.StartsWith("NC ")) {
        $brand = "NetCo"
    }
    
    if (-not $brandData.ContainsKey($brand)) {
        $brandData[$brand] = @{Cost=0; Clicks=0; Conv=0}
    }
    $brandData[$brand].Cost += $cost
    $brandData[$brand].Clicks += $clicks
    $brandData[$brand].Conv += $conv
    
    # Determine country
    $country = "Sonstige"
    if ($campaign -match "-D[-s]|-D$" -or $campaign -match "[-_]D[-_]") {
        $country = "Deutschland"
    } elseif ($campaign -match "-NL[-s]|-NL$" -or $campaign -match "[-_]NL[-_]") {
        $country = "Niederlande"
    } elseif ($campaign -match "-IT[-s]|-IT$" -or $campaign -match "[-_]IT[-_]") {
        $country = "Italien"
    } elseif ($campaign -match "-EU[-s]|-EU$" -or $campaign -match "[-_]EU[-_]") {
        $country = "EU"
    } elseif ($campaign -match "-AT[-s]|-AT$") {
        $country = "Oesterreich"
    }
    
    if (-not $countryData.ContainsKey($country)) {
        $countryData[$country] = @{Cost=0; Clicks=0}
    }
    $countryData[$country].Cost += $cost
    $countryData[$country].Clicks += $clicks
    
    # Campaign type
    $type = $row.'Campaign type'
    if ($type -and $type -ne "") {
        if (-not $typeData.ContainsKey($type)) {
            $typeData[$type] = @{Cost=0; Clicks=0; Conv=0}
        }
        $typeData[$type].Cost += $cost
        $typeData[$type].Clicks += $clicks
        $typeData[$type].Conv += $conv
    }
}

# Output by Brand
Write-Host "=== GOOGLE ADS NACH MARKE ==="
Write-Host ""

$totalCost = 0
$totalClicks = 0
$totalConv = 0

foreach ($brand in @("BauTV+", "Bodycam", "Microvista", "NetCo", "Sonstige")) {
    if ($brandData.ContainsKey($brand)) {
        $data = $brandData[$brand]
        $cpc = if ($data.Clicks -gt 0) { [math]::Round($data.Cost / $data.Clicks, 2) } else { 0 }
        $costFormatted = "{0:N0}" -f $data.Cost
        Write-Host "$brand : $costFormatted EUR | $($data.Clicks) Clicks | $($data.Conv) Conv | CPC: $cpc EUR"
        $totalCost += $data.Cost
        $totalClicks += $data.Clicks
        $totalConv += $data.Conv
    }
}

Write-Host "---"
Write-Host "GESAMT: $([math]::Round($totalCost, 0)) EUR | $totalClicks Clicks | $([math]::Round($totalConv, 0)) Conversions"

# Output by Country
Write-Host ""
Write-Host ""
Write-Host "=== GOOGLE ADS NACH LAND ==="
Write-Host ""

foreach ($country in @("Deutschland", "Niederlande", "Italien", "EU", "Oesterreich", "Sonstige")) {
    if ($countryData.ContainsKey($country)) {
        $data = $countryData[$country]
        $pct = [math]::Round(($data.Cost / $totalCost) * 100, 1)
        $costFormatted = "{0:N0}" -f $data.Cost
        Write-Host "$country : $costFormatted EUR ($pct%) | $($data.Clicks) Clicks"
    }
}

# Output by Type
Write-Host ""
Write-Host ""
Write-Host "=== GOOGLE ADS NACH KAMPAGNENTYP ==="
Write-Host ""

foreach ($type in $typeData.Keys | Sort-Object { $typeData[$_].Cost } -Descending) {
    $data = $typeData[$type]
    $costFormatted = "{0:N0}" -f $data.Cost
    Write-Host "$type : $costFormatted EUR | $($data.Clicks) Clicks | $($data.Conv) Conv"
}

# Bing estimate (mirrored)
Write-Host ""
Write-Host ""
Write-Host "=== BING ADS (GESCHAETZT - gespiegelt) ==="
Write-Host ""
Write-Host "Annahme: Bing ist gespiegelt, aber etwa 10-15% des Google-Volumens"
$bingEstimate = [math]::Round($totalCost * 0.12, 0)
Write-Host "Geschaetzte Bing-Kosten: ca. $bingEstimate EUR"
Write-Host ""
Write-Host "Google + Bing gesamt: ca. $([math]::Round($totalCost + $bingEstimate, 0)) EUR"
