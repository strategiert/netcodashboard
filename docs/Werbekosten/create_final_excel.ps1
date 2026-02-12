
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"
$outputPath = "$basePath\Marketing_Analyse_Final_2023-2025.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Add()
    
    # ============ SHEET 1: UEBERSICHT ============
    $sheet1 = $workbook.Sheets.Item(1)
    $sheet1.Name = "Uebersicht"
    
    $sheet1.Cells.Item(1, 1) = "MARKETING ANALYSE - NETCO & MICROVISTA"
    $sheet1.Range("A1:F1").Merge()
    $sheet1.Cells.Item(1, 1).Font.Size = 18
    $sheet1.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet1.Cells.Item(2, 1) = "Zeitraum: Januar 2023 - Dezember 2025"
    
    # GOOGLE ADS NACH MARKE
    $sheet1.Cells.Item(4, 1) = "GOOGLE ADS NACH MARKE"
    $sheet1.Cells.Item(4, 1).Font.Bold = $true
    $sheet1.Cells.Item(4, 1).Font.Size = 14
    
    $sheet1.Cells.Item(5, 1) = "Marke"
    $sheet1.Cells.Item(5, 2) = "Kosten (EUR)"
    $sheet1.Cells.Item(5, 3) = "Clicks"
    $sheet1.Cells.Item(5, 4) = "Conversions"
    $sheet1.Cells.Item(5, 5) = "CPC (EUR)"
    $sheet1.Cells.Item(5, 6) = "Anteil"
    $sheet1.Range("A5:F5").Font.Bold = $true
    
    # BauTV+
    $sheet1.Cells.Item(6, 1) = "BauTV+ (BK)"
    $sheet1.Cells.Item(6, 2) = 362943
    $sheet1.Cells.Item(6, 3) = 320900
    $sheet1.Cells.Item(6, 4) = 1231
    $sheet1.Cells.Item(6, 5) = 1.13
    $sheet1.Cells.Item(6, 6) = "71.2%"
    
    # Bodycam
    $sheet1.Cells.Item(7, 1) = "Bodycam (BC)"
    $sheet1.Cells.Item(7, 2) = 73696
    $sheet1.Cells.Item(7, 3) = 95762
    $sheet1.Cells.Item(7, 4) = 445
    $sheet1.Cells.Item(7, 5) = 0.77
    $sheet1.Cells.Item(7, 6) = "14.5%"
    
    # Microvista
    $sheet1.Cells.Item(8, 1) = "Microvista (NDT/MV)"
    $sheet1.Cells.Item(8, 2) = 65087
    $sheet1.Cells.Item(8, 3) = 49167
    $sheet1.Cells.Item(8, 4) = 128
    $sheet1.Cells.Item(8, 5) = 1.32
    $sheet1.Cells.Item(8, 6) = "12.8%"
    
    # NetCo Allgemein
    $sheet1.Cells.Item(9, 1) = "NetCo Allgemein"
    $sheet1.Cells.Item(9, 2) = 7484
    $sheet1.Cells.Item(9, 3) = 3365
    $sheet1.Cells.Item(9, 4) = 29
    $sheet1.Cells.Item(9, 5) = 2.22
    $sheet1.Cells.Item(9, 6) = "1.5%"
    
    # Total
    $sheet1.Cells.Item(10, 1) = "GESAMT GOOGLE ADS"
    $sheet1.Cells.Item(10, 2) = 509800
    $sheet1.Cells.Item(10, 3) = 469242
    $sheet1.Cells.Item(10, 4) = 1833
    $sheet1.Cells.Item(10, 5) = 1.09
    $sheet1.Cells.Item(10, 6) = "100%"
    $sheet1.Range("A10:F10").Font.Bold = $true
    
    # Bing estimate
    $sheet1.Cells.Item(12, 1) = "Bing Ads (geschaetzt, gespiegelt ~12%)"
    $sheet1.Cells.Item(12, 2) = 61176
    
    $sheet1.Cells.Item(13, 1) = "GESAMT PPC (Google + Bing)"
    $sheet1.Cells.Item(13, 2) = 570976
    $sheet1.Range("A13:F13").Font.Bold = $true
    
    # NACH LAND
    $sheet1.Cells.Item(16, 1) = "GOOGLE ADS NACH LAND"
    $sheet1.Cells.Item(16, 1).Font.Bold = $true
    $sheet1.Cells.Item(16, 1).Font.Size = 14
    
    $sheet1.Cells.Item(17, 1) = "Land"
    $sheet1.Cells.Item(17, 2) = "Kosten (EUR)"
    $sheet1.Cells.Item(17, 3) = "Clicks"
    $sheet1.Cells.Item(17, 4) = "Anteil"
    $sheet1.Range("A17:D17").Font.Bold = $true
    
    $sheet1.Cells.Item(18, 1) = "Deutschland (D)"
    $sheet1.Cells.Item(18, 2) = 333047
    $sheet1.Cells.Item(18, 3) = 195012
    $sheet1.Cells.Item(18, 4) = "65.3%"
    
    $sheet1.Cells.Item(19, 1) = "Niederlande (NL)"
    $sheet1.Cells.Item(19, 2) = 88524
    $sheet1.Cells.Item(19, 3) = 183687
    $sheet1.Cells.Item(19, 4) = "17.4%"
    
    $sheet1.Cells.Item(20, 1) = "Italien (IT)"
    $sheet1.Cells.Item(20, 2) = 9867
    $sheet1.Cells.Item(20, 3) = 37539
    $sheet1.Cells.Item(20, 4) = "1.9%"
    
    $sheet1.Cells.Item(21, 1) = "EU (sonstige)"
    $sheet1.Cells.Item(21, 2) = 7133
    $sheet1.Cells.Item(21, 3) = 3752
    $sheet1.Cells.Item(21, 4) = "1.4%"
    
    $sheet1.Cells.Item(22, 1) = "Oesterreich (AT)"
    $sheet1.Cells.Item(22, 2) = 2750
    $sheet1.Cells.Item(22, 3) = 628
    $sheet1.Cells.Item(22, 4) = "0.5%"
    
    $sheet1.Cells.Item(23, 1) = "Sonstige/nicht zugeordnet"
    $sheet1.Cells.Item(23, 2) = 68479
    $sheet1.Cells.Item(23, 3) = 48624
    $sheet1.Cells.Item(23, 4) = "13.4%"
    
    # Column widths
    $sheet1.Columns.Item(1).ColumnWidth = 30
    for ($c = 2; $c -le 6; $c++) { $sheet1.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 2: MARKEN DETAIL ============
    $sheet2 = $workbook.Sheets.Add()
    $sheet2.Name = "Marken Detail"
    
    $sheet2.Cells.Item(1, 1) = "WERBEKOSTEN NACH MARKE - DETAIL"
    $sheet2.Range("A1:F1").Merge()
    $sheet2.Cells.Item(1, 1).Font.Size = 16
    $sheet2.Cells.Item(1, 1).Font.Bold = $true
    
    # NetCo section
    $sheet2.Cells.Item(3, 1) = "NETCO (Bodycam + BauTV+)"
    $sheet2.Cells.Item(3, 1).Font.Bold = $true
    $sheet2.Cells.Item(3, 1).Font.Size = 14
    
    $sheet2.Cells.Item(4, 1) = "Produkt"
    $sheet2.Cells.Item(4, 2) = "Google Ads"
    $sheet2.Cells.Item(4, 3) = "Bing (~12%)"
    $sheet2.Cells.Item(4, 4) = "PPC Gesamt"
    $sheet2.Cells.Item(4, 5) = "Sonstige Werbung"
    $sheet2.Cells.Item(4, 6) = "TOTAL"
    $sheet2.Range("A4:F4").Font.Bold = $true
    
    # BauTV+
    $sheet2.Cells.Item(5, 1) = "BauTV+ (Baustellenkameras)"
    $sheet2.Cells.Item(5, 2) = 362943
    $sheet2.Cells.Item(5, 3) = 43553  # 12%
    $sheet2.Cells.Item(5, 4) = 406496
    $sheet2.Cells.Item(5, 5) = 50000  # geschaetzt sonstige
    $sheet2.Cells.Item(5, 6) = 456496
    
    # Bodycam
    $sheet2.Cells.Item(6, 1) = "Bodycam"
    $sheet2.Cells.Item(6, 2) = 73696
    $sheet2.Cells.Item(6, 3) = 8844
    $sheet2.Cells.Item(6, 4) = 82540
    $sheet2.Cells.Item(6, 5) = 30000
    $sheet2.Cells.Item(6, 6) = 112540
    
    # NetCo Allgemein
    $sheet2.Cells.Item(7, 1) = "NetCo Allgemein/Brand"
    $sheet2.Cells.Item(7, 2) = 7484
    $sheet2.Cells.Item(7, 3) = 898
    $sheet2.Cells.Item(7, 4) = 8382
    $sheet2.Cells.Item(7, 5) = 102106  # Rest
    $sheet2.Cells.Item(7, 6) = 110488
    
    $sheet2.Cells.Item(8, 1) = "NETCO GESAMT"
    $sheet2.Cells.Item(8, 2) = 444123
    $sheet2.Cells.Item(8, 3) = 53295
    $sheet2.Cells.Item(8, 4) = 497418
    $sheet2.Cells.Item(8, 5) = 182106
    $sheet2.Cells.Item(8, 6) = 679524
    $sheet2.Range("A8:F8").Font.Bold = $true
    
    # Microvista section
    $sheet2.Cells.Item(10, 1) = "MICROVISTA (NDT)"
    $sheet2.Cells.Item(10, 1).Font.Bold = $true
    $sheet2.Cells.Item(10, 1).Font.Size = 14
    
    $sheet2.Cells.Item(11, 1) = "Produkt"
    $sheet2.Cells.Item(11, 2) = "Google Ads"
    $sheet2.Cells.Item(11, 3) = "Bing (~12%)"
    $sheet2.Cells.Item(11, 4) = "PPC Gesamt"
    $sheet2.Cells.Item(11, 5) = "Sonstige Werbung"
    $sheet2.Cells.Item(11, 6) = "TOTAL"
    $sheet2.Range("A11:F11").Font.Bold = $true
    
    $sheet2.Cells.Item(12, 1) = "Microvista (CT/NDT)"
    $sheet2.Cells.Item(12, 2) = 65087
    $sheet2.Cells.Item(12, 3) = 7810
    $sheet2.Cells.Item(12, 4) = 72897
    $sheet2.Cells.Item(12, 5) = 30608
    $sheet2.Cells.Item(12, 6) = 103505
    
    $sheet2.Columns.Item(1).ColumnWidth = 30
    for ($c = 2; $c -le 6; $c++) { $sheet2.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 3: TRAFFIC ============
    $sheet3 = $workbook.Sheets.Add()
    $sheet3.Name = "Traffic"
    
    $sheet3.Cells.Item(1, 1) = "TRAFFIC NACH MARKE (2023-2025)"
    $sheet3.Range("A1:E1").Merge()
    $sheet3.Cells.Item(1, 1).Font.Size = 16
    $sheet3.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(3, 1) = "Kanal"
    $sheet3.Cells.Item(3, 2) = "NetCo"
    $sheet3.Cells.Item(3, 3) = "Microvista"
    $sheet3.Cells.Item(3, 4) = "GESAMT"
    $sheet3.Cells.Item(3, 5) = "Anteil"
    $sheet3.Range("A3:E3").Font.Bold = $true
    
    $sheet3.Cells.Item(4, 1) = "Paid (PPC/Ads)"
    $sheet3.Cells.Item(4, 2) = 56901
    $sheet3.Cells.Item(4, 3) = 5972
    $sheet3.Cells.Item(4, 4) = 62873
    $sheet3.Cells.Item(4, 5) = "53%"
    
    $sheet3.Cells.Item(5, 1) = "Direct"
    $sheet3.Cells.Item(5, 2) = 32467
    $sheet3.Cells.Item(5, 3) = 2709
    $sheet3.Cells.Item(5, 4) = 35176
    $sheet3.Cells.Item(5, 5) = "30%"
    
    $sheet3.Cells.Item(6, 1) = "Organic (SEO)"
    $sheet3.Cells.Item(6, 2) = 12055
    $sheet3.Cells.Item(6, 3) = 1342
    $sheet3.Cells.Item(6, 4) = 13397
    $sheet3.Cells.Item(6, 5) = "11%"
    
    $sheet3.Cells.Item(7, 1) = "Referral"
    $sheet3.Cells.Item(7, 2) = 4536
    $sheet3.Cells.Item(7, 3) = 613
    $sheet3.Cells.Item(7, 4) = 5149
    $sheet3.Cells.Item(7, 5) = "4%"
    
    $sheet3.Cells.Item(8, 1) = "Social Media"
    $sheet3.Cells.Item(8, 2) = 521
    $sheet3.Cells.Item(8, 3) = 37
    $sheet3.Cells.Item(8, 4) = 558
    $sheet3.Cells.Item(8, 5) = "0.5%"
    
    $sheet3.Cells.Item(9, 1) = "Newsletter/Email"
    $sheet3.Cells.Item(9, 2) = 235
    $sheet3.Cells.Item(9, 3) = 75
    $sheet3.Cells.Item(9, 4) = 310
    $sheet3.Cells.Item(9, 5) = "0.3%"
    
    $sheet3.Cells.Item(10, 1) = "Sonstige"
    $sheet3.Cells.Item(10, 2) = 1160
    $sheet3.Cells.Item(10, 3) = 71
    $sheet3.Cells.Item(10, 4) = 1231
    $sheet3.Cells.Item(10, 5) = "1%"
    
    $sheet3.Cells.Item(11, 1) = "GESAMT"
    $sheet3.Cells.Item(11, 2) = 107875
    $sheet3.Cells.Item(11, 3) = 10819
    $sheet3.Cells.Item(11, 4) = 118694
    $sheet3.Cells.Item(11, 5) = "100%"
    $sheet3.Range("A11:E11").Font.Bold = $true
    
    $sheet3.Columns.Item(1).ColumnWidth = 20
    for ($c = 2; $c -le 5; $c++) { $sheet3.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 4: KPIs ============
    $sheet4 = $workbook.Sheets.Add()
    $sheet4.Name = "KPIs"
    
    $sheet4.Cells.Item(1, 1) = "MARKETING KPIs"
    $sheet4.Cells.Item(1, 1).Font.Size = 16
    $sheet4.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(3, 1) = "KOSTEN PRO SESSION (Website)"
    $sheet4.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(4, 1) = "Marke"
    $sheet4.Cells.Item(4, 2) = "Werbekosten"
    $sheet4.Cells.Item(4, 3) = "Sessions"
    $sheet4.Cells.Item(4, 4) = "EUR/Session"
    $sheet4.Range("A4:D4").Font.Bold = $true
    
    $sheet4.Cells.Item(5, 1) = "NetCo"
    $sheet4.Cells.Item(5, 2) = 679524
    $sheet4.Cells.Item(5, 3) = 107875
    $sheet4.Cells.Item(5, 4) = 6.30
    
    $sheet4.Cells.Item(6, 1) = "Microvista"
    $sheet4.Cells.Item(6, 2) = 103505
    $sheet4.Cells.Item(6, 3) = 10819
    $sheet4.Cells.Item(6, 4) = 9.57
    
    $sheet4.Cells.Item(8, 1) = "GOOGLE ADS PERFORMANCE"
    $sheet4.Cells.Item(8, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(9, 1) = "Marke"
    $sheet4.Cells.Item(9, 2) = "Kosten"
    $sheet4.Cells.Item(9, 3) = "Clicks"
    $sheet4.Cells.Item(9, 4) = "CPC"
    $sheet4.Cells.Item(9, 5) = "Conv."
    $sheet4.Cells.Item(9, 6) = "Cost/Conv."
    $sheet4.Range("A9:F9").Font.Bold = $true
    
    $sheet4.Cells.Item(10, 1) = "BauTV+"
    $sheet4.Cells.Item(10, 2) = 362943
    $sheet4.Cells.Item(10, 3) = 320900
    $sheet4.Cells.Item(10, 4) = 1.13
    $sheet4.Cells.Item(10, 5) = 1231
    $sheet4.Cells.Item(10, 6) = 295
    
    $sheet4.Cells.Item(11, 1) = "Bodycam"
    $sheet4.Cells.Item(11, 2) = 73696
    $sheet4.Cells.Item(11, 3) = 95762
    $sheet4.Cells.Item(11, 4) = 0.77
    $sheet4.Cells.Item(11, 5) = 445
    $sheet4.Cells.Item(11, 6) = 166
    
    $sheet4.Cells.Item(12, 1) = "Microvista"
    $sheet4.Cells.Item(12, 2) = 65087
    $sheet4.Cells.Item(12, 3) = 49167
    $sheet4.Cells.Item(12, 4) = 1.32
    $sheet4.Cells.Item(12, 5) = 128
    $sheet4.Cells.Item(12, 6) = 508
    
    $sheet4.Cells.Item(14, 1) = "EXPANSION (IT/NL) - ANTEIL"
    $sheet4.Cells.Item(14, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(15, 1) = "Niederlande"
    $sheet4.Cells.Item(15, 2) = 88524
    $sheet4.Cells.Item(15, 3) = "17.4% vom Budget"
    
    $sheet4.Cells.Item(16, 1) = "Italien"
    $sheet4.Cells.Item(16, 2) = 9867
    $sheet4.Cells.Item(16, 3) = "1.9% vom Budget"
    
    $sheet4.Cells.Item(17, 1) = "Expansion Gesamt"
    $sheet4.Cells.Item(17, 2) = 98391
    $sheet4.Cells.Item(17, 3) = "19.3% vom Budget"
    $sheet4.Range("A17:C17").Font.Bold = $true
    
    $sheet4.Columns.Item(1).ColumnWidth = 25
    for ($c = 2; $c -le 6; $c++) { $sheet4.Columns.Item($c).ColumnWidth = 15 }
    
    # Save
    $workbook.SaveAs($outputPath)
    $workbook.Close($true)
    
    Write-Host "====================================="
    Write-Host "Finale Excel-Analyse erstellt!"
    Write-Host "Datei: $outputPath"
    Write-Host ""
    Write-Host "Sheets:"
    Write-Host "  1. Uebersicht - Google Ads nach Marke und Land"
    Write-Host "  2. Marken Detail - Aufschluesselung pro Produkt"
    Write-Host "  3. Traffic - Website Sessions nach Kanal"
    Write-Host "  4. KPIs - Performance Kennzahlen"
    Write-Host "====================================="
    
} catch {
    Write-Host "ERROR:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
