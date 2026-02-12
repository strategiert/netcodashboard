
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"

# Read all CSV files and parse the data
$allBookings = @()

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
                    $accountNo = $parts[1]
                    $accountType = $parts[2]
                    $dateStr = $parts[3]
                    $description = $parts[6]
                    $vendorId = $parts[7]
                    $vendorName = $parts[8]
                    
                    $amountMatch = [regex]::Match($line, '([\d.,]+)\s*EUR')
                    $amount = 0
                    if ($amountMatch.Success) {
                        $amountStr = $amountMatch.Groups[1].Value -replace ',', ''
                        $amount = [double]$amountStr
                    }
                    
                    $month = 0
                    if ($dateStr -match "(\d{2})\.(\d{2})\.(\d{4})") {
                        $month = [int]$Matches[2]
                    }
                    
                    $category = "Sonstige"
                    $vendorLower = $vendorName.ToLower()
                    $descLower = $description.ToLower()
                    
                    if ($vendorLower -match "google|microsoft ads|bing") {
                        $category = "Pay-Per-Click Marketing"
                    } elseif ($vendorLower -match "linkedin|facebook|xing|twitter|instagram") {
                        $category = "Social Media"
                    } elseif ($vendorLower -match "seo|searchmetrics|sistrix|ryte|linkbuilding") {
                        $category = "SEO - Offpage"
                    } elseif ($vendorLower -match "pressebox|pr-gateway|news aktuell|presse") {
                        $category = "Content Marketing"
                    } elseif ($vendorLower -match "mailchimp|cleverreach|newsletter|rapidmail|sendinblue") {
                        $category = "Newsletter"
                    } elseif ($vendorLower -match "messe|event|dmexco|omr|expo") {
                        $category = "Messen/Events"
                    } elseif ($vendorLower -match "display|banner|criteo|taboola|outbrain") {
                        $category = "Display Advertising"
                    } elseif ($vendorLower -match "retarget|remarketing") {
                        $category = "Retargeting"
                    } elseif ($vendorLower -match "agentur|beratung|consult") {
                        $category = "Investment / Consulting"
                    } elseif ($vendorLower -match "web|website|hosting|domain") {
                        $category = "Web Development"
                    } elseif ($descLower -match "seo|keyword") {
                        $category = "SEO - Offpage"
                    } elseif ($descLower -match "google|microsoft|ppc|ads") {
                        $category = "Pay-Per-Click Marketing"
                    } elseif ($descLower -match "linkedin|social") {
                        $category = "Social Media"
                    } elseif ($descLower -match "presse|pr ") {
                        $category = "Content Marketing"
                    }
                    
                    $booking = [PSCustomObject]@{
                        Company = $csvInfo.Company
                        Year = $csvInfo.Year
                        Month = $month
                        Category = $category
                        VendorName = $vendorName
                        Description = $description
                        Amount = $amount
                    }
                    $allBookings += $booking
                }
            }
        }
    }
}

Write-Host "Total bookings parsed:" $allBookings.Count

# Aggregate by Year, Month, Category
$aggregated = @{}

foreach ($booking in $allBookings) {
    $key = "$($booking.Year)|$($booking.Month)|$($booking.Category)"
    if (-not $aggregated.ContainsKey($key)) {
        $aggregated[$key] = 0
    }
    $aggregated[$key] += $booking.Amount
}

# Output aggregated data
Write-Host "=== AGGREGATED DATA ==="
$years = @(2023, 2024, 2025)
$categories = @("SEO - Offpage", "Content Marketing", "Pay-Per-Click Marketing", "Display Advertising", "Retargeting", "Social Media", "Newsletter", "Investment / Consulting", "Web Development", "Messen/Events", "Sonstige")

foreach ($year in $years) {
    Write-Host "--- YEAR $year ---"
    foreach ($cat in $categories) {
        $yearTotal = 0
        $monthlyData = ""
        for ($m = 1; $m -le 12; $m++) {
            $key = "$year|$m|$cat"
            $val = 0
            if ($aggregated.ContainsKey($key)) {
                $val = $aggregated[$key]
            }
            $yearTotal += $val
            if ($val -gt 0) {
                $monthlyData += "M" + $m + "=" + [math]::Round($val,2) + " "
            }
        }
        if ($yearTotal -gt 0) {
            Write-Host $cat ":" ([math]::Round($yearTotal,2)) "EUR" "(" $monthlyData ")"
        }
    }
}

# Output monthly totals for each category in format for Excel
Write-Host ""
Write-Host "=== EXCEL DATA FORMAT ==="
foreach ($year in $years) {
    Write-Host "YEAR:$year"
    foreach ($cat in $categories) {
        $line = "CAT:$cat"
        for ($m = 1; $m -le 12; $m++) {
            $key = "$year|$m|$cat"
            $val = 0
            if ($aggregated.ContainsKey($key)) {
                $val = [math]::Round($aggregated[$key], 2)
            }
            $line += "|$val"
        }
        Write-Host $line
    }
}
