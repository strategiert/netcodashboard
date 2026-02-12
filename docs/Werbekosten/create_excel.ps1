
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"
$templatePath = "$basePath\Marketingplan.xlsx"
$outputPath = "$basePath\Marketingplan_Ausgefuellt_2023-2025.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    # Copy template
    Copy-Item $templatePath $outputPath -Force
    
    $workbook = $excel.Workbooks.Open($outputPath)
    $sheet = $workbook.Sheets.Item(1)
    
    # 2023 data - starts at row 22
    # Row 25 = SEO, 27 = Content, 28 = PPC, etc.
    
    # === 2023 Section (Base Row 22) ===
    # Row 25: SEO - Offpage
    $sheet.Cells.Item(25, 3).Value2 = 5555
    $sheet.Cells.Item(25, 4).Value2 = 2510
    $sheet.Cells.Item(25, 5).Value2 = 2510
    $sheet.Cells.Item(25, 6).Value2 = 2510
    $sheet.Cells.Item(25, 7).Value2 = 0
    $sheet.Cells.Item(25, 8).Value2 = 449.25
    $sheet.Cells.Item(25, 9).Value2 = 149.75
    $sheet.Cells.Item(25, 10).Value2 = 149.75
    $sheet.Cells.Item(25, 11).Value2 = 149.75
    $sheet.Cells.Item(25, 12).Value2 = 149.75
    $sheet.Cells.Item(25, 13).Value2 = 149.75
    $sheet.Cells.Item(25, 14).Value2 = 149.75
    $sheet.Cells.Item(25, 15).Value2 = 14432.75
    
    # Row 27: Content Marketing
    $sheet.Cells.Item(27, 3).Value2 = 0
    $sheet.Cells.Item(27, 4).Value2 = 0
    $sheet.Cells.Item(27, 5).Value2 = 372.45
    $sheet.Cells.Item(27, 6).Value2 = 124.15
    $sheet.Cells.Item(27, 7).Value2 = 124.15
    $sheet.Cells.Item(27, 8).Value2 = 124.15
    $sheet.Cells.Item(27, 9).Value2 = 3228
    $sheet.Cells.Item(27, 10).Value2 = 0
    $sheet.Cells.Item(27, 11).Value2 = 568
    $sheet.Cells.Item(27, 12).Value2 = 0
    $sheet.Cells.Item(27, 13).Value2 = 0
    $sheet.Cells.Item(27, 14).Value2 = 0
    $sheet.Cells.Item(27, 15).Value2 = 4540.90
    
    # Row 28: Pay-Per-Click Marketing
    $sheet.Cells.Item(28, 3).Value2 = 9111.70
    $sheet.Cells.Item(28, 4).Value2 = 9915.60
    $sheet.Cells.Item(28, 5).Value2 = 11271.23
    $sheet.Cells.Item(28, 6).Value2 = 11083.57
    $sheet.Cells.Item(28, 7).Value2 = 10802.15
    $sheet.Cells.Item(28, 8).Value2 = 10709.14
    $sheet.Cells.Item(28, 9).Value2 = 10611.27
    $sheet.Cells.Item(28, 10).Value2 = 10197.92
    $sheet.Cells.Item(28, 11).Value2 = 11763.51
    $sheet.Cells.Item(28, 12).Value2 = 10651.41
    $sheet.Cells.Item(28, 13).Value2 = 10771.18
    $sheet.Cells.Item(28, 14).Value2 = 15418.47
    $sheet.Cells.Item(28, 15).Value2 = 132307.15
    
    # Row 31: Social Media
    $sheet.Cells.Item(31, 3).Value2 = 0
    $sheet.Cells.Item(31, 4).Value2 = 0
    $sheet.Cells.Item(31, 5).Value2 = 409.14
    $sheet.Cells.Item(31, 6).Value2 = 136.38
    $sheet.Cells.Item(31, 7).Value2 = 136.38
    $sheet.Cells.Item(31, 8).Value2 = 136.38
    $sheet.Cells.Item(31, 9).Value2 = 136.38
    $sheet.Cells.Item(31, 10).Value2 = 136.38
    $sheet.Cells.Item(31, 11).Value2 = 136.38
    $sheet.Cells.Item(31, 12).Value2 = 929.67
    $sheet.Cells.Item(31, 13).Value2 = 136.38
    $sheet.Cells.Item(31, 14).Value2 = 2339.58
    $sheet.Cells.Item(31, 15).Value2 = 4633.05
    
    # Row 34: Investment / Consulting
    $sheet.Cells.Item(34, 3).Value2 = 0
    $sheet.Cells.Item(34, 4).Value2 = 195
    $sheet.Cells.Item(34, 5).Value2 = 688
    $sheet.Cells.Item(34, 6).Value2 = 0
    $sheet.Cells.Item(34, 7).Value2 = 468
    $sheet.Cells.Item(34, 8).Value2 = 0
    $sheet.Cells.Item(34, 9).Value2 = 1044
    $sheet.Cells.Item(34, 10).Value2 = 0
    $sheet.Cells.Item(34, 11).Value2 = 0
    $sheet.Cells.Item(34, 12).Value2 = 0
    $sheet.Cells.Item(34, 13).Value2 = 0
    $sheet.Cells.Item(34, 14).Value2 = 0
    $sheet.Cells.Item(34, 15).Value2 = 2395
    
    # === 2024 Section (Base Row 40) ===
    # Row 43: SEO - Offpage
    $sheet.Cells.Item(43, 3).Value2 = 149.75
    $sheet.Cells.Item(43, 4).Value2 = 149.75
    $sheet.Cells.Item(43, 5).Value2 = 149.75
    $sheet.Cells.Item(43, 6).Value2 = 0
    $sheet.Cells.Item(43, 7).Value2 = 0
    $sheet.Cells.Item(43, 8).Value2 = 0
    $sheet.Cells.Item(43, 9).Value2 = 0
    $sheet.Cells.Item(43, 10).Value2 = 299.50
    $sheet.Cells.Item(43, 11).Value2 = 215.64
    $sheet.Cells.Item(43, 12).Value2 = 59.90
    $sheet.Cells.Item(43, 13).Value2 = 59.90
    $sheet.Cells.Item(43, 14).Value2 = 275.54
    $sheet.Cells.Item(43, 15).Value2 = 1359.73
    
    # Row 45: Content Marketing
    $sheet.Cells.Item(45, 3).Value2 = 0
    $sheet.Cells.Item(45, 4).Value2 = 0
    $sheet.Cells.Item(45, 5).Value2 = 0
    $sheet.Cells.Item(45, 6).Value2 = 0
    $sheet.Cells.Item(45, 7).Value2 = 0
    $sheet.Cells.Item(45, 8).Value2 = 0
    $sheet.Cells.Item(45, 9).Value2 = 1614
    $sheet.Cells.Item(45, 10).Value2 = 1614
    $sheet.Cells.Item(45, 11).Value2 = 0
    $sheet.Cells.Item(45, 12).Value2 = 239.29
    $sheet.Cells.Item(45, 13).Value2 = 239.29
    $sheet.Cells.Item(45, 14).Value2 = 239.29
    $sheet.Cells.Item(45, 15).Value2 = 3945.87
    
    # Row 46: Pay-Per-Click Marketing
    $sheet.Cells.Item(46, 3).Value2 = 11445.72
    $sheet.Cells.Item(46, 4).Value2 = 12122.23
    $sheet.Cells.Item(46, 5).Value2 = 12393.47
    $sheet.Cells.Item(46, 6).Value2 = 16973.72
    $sheet.Cells.Item(46, 7).Value2 = 15785.08
    $sheet.Cells.Item(46, 8).Value2 = 39836.71
    $sheet.Cells.Item(46, 9).Value2 = 14721.29
    $sheet.Cells.Item(46, 10).Value2 = 14422.03
    $sheet.Cells.Item(46, 11).Value2 = 19180.36
    $sheet.Cells.Item(46, 12).Value2 = 18850.91
    $sheet.Cells.Item(46, 13).Value2 = 18864.11
    $sheet.Cells.Item(46, 14).Value2 = 17109.52
    $sheet.Cells.Item(46, 15).Value2 = 211705.15
    
    # Row 49: Social Media
    $sheet.Cells.Item(49, 3).Value2 = 132.33
    $sheet.Cells.Item(49, 4).Value2 = 132.20
    $sheet.Cells.Item(49, 5).Value2 = 132.20
    $sheet.Cells.Item(49, 6).Value2 = 132.20
    $sheet.Cells.Item(49, 7).Value2 = 132.20
    $sheet.Cells.Item(49, 8).Value2 = 132.20
    $sheet.Cells.Item(49, 9).Value2 = 132.20
    $sheet.Cells.Item(49, 10).Value2 = 132.20
    $sheet.Cells.Item(49, 11).Value2 = 491.66
    $sheet.Cells.Item(49, 12).Value2 = 600.42
    $sheet.Cells.Item(49, 13).Value2 = 717.14
    $sheet.Cells.Item(49, 14).Value2 = 482.47
    $sheet.Cells.Item(49, 15).Value2 = 3349.42
    
    # Row 52: Investment / Consulting
    $sheet.Cells.Item(52, 3).Value2 = 0
    $sheet.Cells.Item(52, 4).Value2 = 0
    $sheet.Cells.Item(52, 5).Value2 = 0
    $sheet.Cells.Item(52, 6).Value2 = 0
    $sheet.Cells.Item(52, 7).Value2 = 0
    $sheet.Cells.Item(52, 8).Value2 = 0
    $sheet.Cells.Item(52, 9).Value2 = 0
    $sheet.Cells.Item(52, 10).Value2 = 0
    $sheet.Cells.Item(52, 11).Value2 = 490
    $sheet.Cells.Item(52, 12).Value2 = 0
    $sheet.Cells.Item(52, 13).Value2 = 0
    $sheet.Cells.Item(52, 14).Value2 = 0
    $sheet.Cells.Item(52, 15).Value2 = 490
    
    Write-Host "2023 and 2024 data written successfully"
    
    # Now add 2025 section starting at row 58
    # First add the header structure
    $sheet.Cells.Item(58, 2).Value2 = "2025"
    $sheet.Cells.Item(58, 3).Value2 = " Q1"
    $sheet.Cells.Item(58, 6).Value2 = " Q2"
    $sheet.Cells.Item(58, 9).Value2 = " Q3"
    $sheet.Cells.Item(58, 12).Value2 = " Q4"
    $sheet.Cells.Item(58, 15).Value2 = "FISCAL YEAR TOTALS"
    
    # Month headers row 59
    $sheet.Cells.Item(59, 3).Value2 = "JAN"
    $sheet.Cells.Item(59, 4).Value2 = "FEB"
    $sheet.Cells.Item(59, 5).Value2 = "MAR"
    $sheet.Cells.Item(59, 6).Value2 = "APR"
    $sheet.Cells.Item(59, 7).Value2 = "MAY"
    $sheet.Cells.Item(59, 8).Value2 = "JUN"
    $sheet.Cells.Item(59, 9).Value2 = "JUL"
    $sheet.Cells.Item(59, 10).Value2 = "AUG"
    $sheet.Cells.Item(59, 11).Value2 = "SEPT"
    $sheet.Cells.Item(59, 12).Value2 = "OCT"
    $sheet.Cells.Item(59, 13).Value2 = "NOV"
    $sheet.Cells.Item(59, 14).Value2 = "DEC"
    
    # Category labels and data for 2025
    # Row 60: Marketing Massnahmen (sum)
    $sheet.Cells.Item(60, 2).Value2 = "Marketing Massnahmen"
    
    # Row 61: SEO - Offpage
    $sheet.Cells.Item(61, 2).Value2 = "SEO - Offpage"
    $sheet.Cells.Item(61, 3).Value2 = 59.90
    $sheet.Cells.Item(61, 4).Value2 = 59.90
    $sheet.Cells.Item(61, 5).Value2 = 59.90
    $sheet.Cells.Item(61, 6).Value2 = 491.18
    $sheet.Cells.Item(61, 7).Value2 = 59.90
    $sheet.Cells.Item(61, 8).Value2 = 59.90
    $sheet.Cells.Item(61, 9).Value2 = 59.90
    $sheet.Cells.Item(61, 10).Value2 = 59.90
    $sheet.Cells.Item(61, 11).Value2 = 59.90
    $sheet.Cells.Item(61, 12).Value2 = 59.90
    $sheet.Cells.Item(61, 13).Value2 = 59.90
    $sheet.Cells.Item(61, 14).Value2 = 59.90
    $sheet.Cells.Item(61, 15).Value2 = 1150.08
    
    # Row 62: Content+SEO
    $sheet.Cells.Item(62, 2).Value2 = "Content+SEO"
    
    # Row 63: Content Marketing
    $sheet.Cells.Item(63, 2).Value2 = "Content Marketing"
    $sheet.Cells.Item(63, 3).Value2 = 323.39
    $sheet.Cells.Item(63, 4).Value2 = 219.35
    $sheet.Cells.Item(63, 5).Value2 = 219.75
    $sheet.Cells.Item(63, 6).Value2 = 994.35
    $sheet.Cells.Item(63, 7).Value2 = 219.35
    $sheet.Cells.Item(63, 8).Value2 = 219.35
    $sheet.Cells.Item(63, 9).Value2 = 219.35
    $sheet.Cells.Item(63, 10).Value2 = 219.35
    $sheet.Cells.Item(63, 11).Value2 = 219.35
    $sheet.Cells.Item(63, 12).Value2 = 219.35
    $sheet.Cells.Item(63, 13).Value2 = 219.35
    $sheet.Cells.Item(63, 14).Value2 = 219.35
    $sheet.Cells.Item(63, 15).Value2 = 3511.64
    
    # Row 64: Pay-Per-Click Marketing
    $sheet.Cells.Item(64, 2).Value2 = "Pay-Per-Click Marketing"
    $sheet.Cells.Item(64, 3).Value2 = 19218.92
    $sheet.Cells.Item(64, 4).Value2 = 19338.48
    $sheet.Cells.Item(64, 5).Value2 = 21964.69
    $sheet.Cells.Item(64, 6).Value2 = 16963.73
    $sheet.Cells.Item(64, 7).Value2 = 15715.39
    $sheet.Cells.Item(64, 8).Value2 = 17563.23
    $sheet.Cells.Item(64, 9).Value2 = 20883.85
    $sheet.Cells.Item(64, 10).Value2 = 21724.27
    $sheet.Cells.Item(64, 11).Value2 = 22409.99
    $sheet.Cells.Item(64, 12).Value2 = 35085.68
    $sheet.Cells.Item(64, 13).Value2 = 25973.92
    $sheet.Cells.Item(64, 14).Value2 = 15548.30
    $sheet.Cells.Item(64, 15).Value2 = 252390.45
    
    # Row 65: Display Advertising
    $sheet.Cells.Item(65, 2).Value2 = "Display Advertising"
    
    # Row 66: Retargeting
    $sheet.Cells.Item(66, 2).Value2 = "Retargeting"
    
    # Row 67: Social Media
    $sheet.Cells.Item(67, 2).Value2 = "Social Media"
    $sheet.Cells.Item(67, 3).Value2 = 58.78
    $sheet.Cells.Item(67, 4).Value2 = 58.76
    $sheet.Cells.Item(67, 5).Value2 = 58.76
    $sheet.Cells.Item(67, 6).Value2 = 58.76
    $sheet.Cells.Item(67, 7).Value2 = 58.76
    $sheet.Cells.Item(67, 8).Value2 = 1397.30
    $sheet.Cells.Item(67, 9).Value2 = 58.76
    $sheet.Cells.Item(67, 10).Value2 = 58.76
    $sheet.Cells.Item(67, 11).Value2 = 58.76
    $sheet.Cells.Item(67, 12).Value2 = 166.22
    $sheet.Cells.Item(67, 13).Value2 = 997.88
    $sheet.Cells.Item(67, 14).Value2 = 1032.98
    $sheet.Cells.Item(67, 15).Value2 = 4064.48
    
    # Row 68: Newsletter
    $sheet.Cells.Item(68, 2).Value2 = "Newsletter"
    
    # Row 69: TypeIn
    $sheet.Cells.Item(69, 2).Value2 = "TypeIn"
    
    # Row 70: Investment / Consulting
    $sheet.Cells.Item(70, 2).Value2 = "Investment / Consulting"
    
    # Row 71: Web Development
    $sheet.Cells.Item(71, 2).Value2 = "Web Development"
    
    # Row 72: Beratung
    $sheet.Cells.Item(72, 2).Value2 = "Beratung"
    
    # Row 73: Sonstige
    $sheet.Cells.Item(73, 2).Value2 = "Sonstige"
    $sheet.Cells.Item(73, 3).Value2 = 502.66
    $sheet.Cells.Item(73, 4).Value2 = 241.96
    $sheet.Cells.Item(73, 5).Value2 = 3083.75
    $sheet.Cells.Item(73, 6).Value2 = 223.96
    $sheet.Cells.Item(73, 7).Value2 = 31533.08
    $sheet.Cells.Item(73, 8).Value2 = 453.22
    $sheet.Cells.Item(73, 9).Value2 = 1823.84
    $sheet.Cells.Item(73, 10).Value2 = 8318.84
    $sheet.Cells.Item(73, 11).Value2 = 3731.90
    $sheet.Cells.Item(73, 12).Value2 = 19332.54
    $sheet.Cells.Item(73, 13).Value2 = 4552.92
    $sheet.Cells.Item(73, 14).Value2 = 1799.92
    $sheet.Cells.Item(73, 15).Value2 = 75598.59
    
    # Row 74: TOTALS
    $sheet.Cells.Item(74, 2).Value2 = "TOTALS"
    $sheet.Cells.Item(74, 15).Value2 = 336715.24
    
    Write-Host "2025 section added successfully"
    
    $workbook.Save()
    $workbook.Close($true)
    
    Write-Host ""
    Write-Host "====================================="
    Write-Host "Excel-Datei erfolgreich erstellt!"
    Write-Host "Datei: $outputPath"
    Write-Host "====================================="
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Line: $($_.InvocationInfo.ScriptLineNumber)"
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
