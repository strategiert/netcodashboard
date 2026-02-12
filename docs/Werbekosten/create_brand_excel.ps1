
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"
$outputPath = "$basePath\Marketingplan_NetCo_Microvista_2023-2025.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Add()
    
    # ============ SHEET 1: WERBEKOSTEN ============
    $sheet1 = $workbook.Sheets.Item(1)
    $sheet1.Name = "Werbekosten"
    
    # Title
    $sheet1.Cells.Item(1, 1) = "WERBEKOSTEN NACH MARKE (2023-2025)"
    $sheet1.Range("A1:E1").Merge()
    $sheet1.Cells.Item(1, 1).Font.Size = 16
    $sheet1.Cells.Item(1, 1).Font.Bold = $true
    
    # Headers
    $sheet1.Cells.Item(3, 1) = "Marke"
    $sheet1.Cells.Item(3, 2) = "2023"
    $sheet1.Cells.Item(3, 3) = "2024"
    $sheet1.Cells.Item(3, 4) = "2025"
    $sheet1.Cells.Item(3, 5) = "GESAMT"
    $sheet1.Range("A3:E3").Font.Bold = $true
    
    # NetCo
    $sheet1.Cells.Item(4, 1) = "NetCo (Bodycam + BauTV+)"
    $sheet1.Cells.Item(4, 2) = 194168
    $sheet1.Cells.Item(4, 3) = 216828
    $sheet1.Cells.Item(4, 4) = 268528
    $sheet1.Cells.Item(4, 5) = 679524
    
    # Microvista
    $sheet1.Cells.Item(5, 1) = "Microvista"
    $sheet1.Cells.Item(5, 2) = 33656
    $sheet1.Cells.Item(5, 3) = 23552
    $sheet1.Cells.Item(5, 4) = 46297
    $sheet1.Cells.Item(5, 5) = 103505
    
    # Expansion
    $sheet1.Cells.Item(6, 1) = "Expansion (IT/NL) - 10%"
    $sheet1.Cells.Item(6, 2) = 0
    $sheet1.Cells.Item(6, 3) = 26547
    $sheet1.Cells.Item(6, 4) = 33672
    $sheet1.Cells.Item(6, 5) = 60219
    
    # Total
    $sheet1.Cells.Item(7, 1) = "GESAMT"
    $sheet1.Cells.Item(7, 2) = 227824
    $sheet1.Cells.Item(7, 3) = 266927
    $sheet1.Cells.Item(7, 4) = 348497
    $sheet1.Cells.Item(7, 5) = 843248
    $sheet1.Range("A7:E7").Font.Bold = $true
    
    # PPC Section
    $sheet1.Cells.Item(9, 1) = "DAVON PAY-PER-CLICK (PPC)"
    $sheet1.Cells.Item(9, 1).Font.Bold = $true
    
    $sheet1.Cells.Item(10, 1) = "Marke"
    $sheet1.Cells.Item(10, 2) = "2023"
    $sheet1.Cells.Item(10, 3) = "2024"
    $sheet1.Cells.Item(10, 4) = "2025"
    $sheet1.Cells.Item(10, 5) = "GESAMT"
    $sheet1.Range("A10:E10").Font.Bold = $true
    
    $sheet1.Cells.Item(11, 1) = "NetCo PPC"
    $sheet1.Cells.Item(11, 2) = 132307
    $sheet1.Cells.Item(11, 3) = 211705
    $sheet1.Cells.Item(11, 4) = 252390
    $sheet1.Cells.Item(11, 5) = 596402
    
    $sheet1.Cells.Item(12, 1) = "Anteil PPC an Gesamt"
    $sheet1.Cells.Item(12, 2) = "58%"
    $sheet1.Cells.Item(12, 3) = "79%"
    $sheet1.Cells.Item(12, 4) = "72%"
    $sheet1.Cells.Item(12, 5) = "71%"
    
    # Column width
    $sheet1.Columns.Item(1).ColumnWidth = 30
    for ($c = 2; $c -le 5; $c++) { $sheet1.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 2: TRAFFIC ============
    $sheet2 = $workbook.Sheets.Add()
    $sheet2.Name = "Traffic"
    
    $sheet2.Cells.Item(1, 1) = "TRAFFIC NACH MARKE (2023-2025)"
    $sheet2.Range("A1:E1").Merge()
    $sheet2.Cells.Item(1, 1).Font.Size = 16
    $sheet2.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet2.Cells.Item(3, 1) = "Kanal"
    $sheet2.Cells.Item(3, 2) = "NetCo"
    $sheet2.Cells.Item(3, 3) = "Microvista"
    $sheet2.Cells.Item(3, 4) = "GESAMT"
    $sheet2.Cells.Item(3, 5) = "Anteil"
    $sheet2.Range("A3:E3").Font.Bold = $true
    
    $sheet2.Cells.Item(4, 1) = "Paid (PPC/Ads)"
    $sheet2.Cells.Item(4, 2) = 56901
    $sheet2.Cells.Item(4, 3) = 5972
    $sheet2.Cells.Item(4, 4) = 62873
    $sheet2.Cells.Item(4, 5) = "53%"
    
    $sheet2.Cells.Item(5, 1) = "Direct"
    $sheet2.Cells.Item(5, 2) = 32467
    $sheet2.Cells.Item(5, 3) = 2709
    $sheet2.Cells.Item(5, 4) = 35176
    $sheet2.Cells.Item(5, 5) = "30%"
    
    $sheet2.Cells.Item(6, 1) = "Organic (SEO)"
    $sheet2.Cells.Item(6, 2) = 12055
    $sheet2.Cells.Item(6, 3) = 1342
    $sheet2.Cells.Item(6, 4) = 13397
    $sheet2.Cells.Item(6, 5) = "11%"
    
    $sheet2.Cells.Item(7, 1) = "Referral"
    $sheet2.Cells.Item(7, 2) = 4536
    $sheet2.Cells.Item(7, 3) = 613
    $sheet2.Cells.Item(7, 4) = 5149
    $sheet2.Cells.Item(7, 5) = "4%"
    
    $sheet2.Cells.Item(8, 1) = "Social Media"
    $sheet2.Cells.Item(8, 2) = 521
    $sheet2.Cells.Item(8, 3) = 37
    $sheet2.Cells.Item(8, 4) = 558
    $sheet2.Cells.Item(8, 5) = "0,5%"
    
    $sheet2.Cells.Item(9, 1) = "Newsletter/Email"
    $sheet2.Cells.Item(9, 2) = 235
    $sheet2.Cells.Item(9, 3) = 75
    $sheet2.Cells.Item(9, 4) = 310
    $sheet2.Cells.Item(9, 5) = "0,3%"
    
    $sheet2.Cells.Item(10, 1) = "Sonstige"
    $sheet2.Cells.Item(10, 2) = 1160
    $sheet2.Cells.Item(10, 3) = 71
    $sheet2.Cells.Item(10, 4) = 1231
    $sheet2.Cells.Item(10, 5) = "1%"
    
    $sheet2.Cells.Item(11, 1) = "GESAMT"
    $sheet2.Cells.Item(11, 2) = 107875
    $sheet2.Cells.Item(11, 3) = 10819
    $sheet2.Cells.Item(11, 4) = 118694
    $sheet2.Cells.Item(11, 5) = "100%"
    $sheet2.Range("A11:E11").Font.Bold = $true
    
    $sheet2.Columns.Item(1).ColumnWidth = 20
    for ($c = 2; $c -le 5; $c++) { $sheet2.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 3: KPIs ============
    $sheet3 = $workbook.Sheets.Add()
    $sheet3.Name = "KPIs"
    
    $sheet3.Cells.Item(1, 1) = "MARKETING KPIs (2023-2025)"
    $sheet3.Range("A1:D1").Merge()
    $sheet3.Cells.Item(1, 1).Font.Size = 16
    $sheet3.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(3, 1) = "KOSTEN PRO SESSION"
    $sheet3.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(4, 1) = "Marke"
    $sheet3.Cells.Item(4, 2) = "Kosten"
    $sheet3.Cells.Item(4, 3) = "Sessions"
    $sheet3.Cells.Item(4, 4) = "EUR/Session"
    $sheet3.Range("A4:D4").Font.Bold = $true
    
    $sheet3.Cells.Item(5, 1) = "NetCo"
    $sheet3.Cells.Item(5, 2) = 679524
    $sheet3.Cells.Item(5, 3) = 107875
    $sheet3.Cells.Item(5, 4) = 6.30
    
    $sheet3.Cells.Item(6, 1) = "Microvista"
    $sheet3.Cells.Item(6, 2) = 103505
    $sheet3.Cells.Item(6, 3) = 10819
    $sheet3.Cells.Item(6, 4) = 9.57
    
    $sheet3.Cells.Item(7, 1) = "NUR PPC"
    $sheet3.Cells.Item(7, 2) = 596402
    $sheet3.Cells.Item(7, 3) = 62873
    $sheet3.Cells.Item(7, 4) = 9.49
    $sheet3.Range("A7:D7").Font.Bold = $true
    
    # SEO Value
    $sheet3.Cells.Item(9, 1) = "SEO WERT (gesparte PPC-Kosten)"
    $sheet3.Cells.Item(9, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(10, 1) = "Organic Sessions"
    $sheet3.Cells.Item(10, 2) = 13397
    
    $sheet3.Cells.Item(11, 1) = "Wert bei PPC-Preis"
    $sheet3.Cells.Item(11, 2) = 127138
    $sheet3.Cells.Item(11, 2).Font.Bold = $true
    
    # Expansion note
    $sheet3.Cells.Item(13, 1) = "EXPANSION (IT/NL)"
    $sheet3.Cells.Item(13, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(14, 1) = "Geschaetzte Kosten 2024"
    $sheet3.Cells.Item(14, 2) = 26547
    
    $sheet3.Cells.Item(15, 1) = "Geschaetzte Kosten 2025"
    $sheet3.Cells.Item(15, 2) = 33672
    
    $sheet3.Cells.Item(16, 1) = "Hinweis: 10% des Gesamtbudgets"
    
    $sheet3.Columns.Item(1).ColumnWidth = 30
    for ($c = 2; $c -le 4; $c++) { $sheet3.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 4: Monatlich NetCo ============
    $sheet4 = $workbook.Sheets.Add()
    $sheet4.Name = "NetCo Monatlich"
    
    $sheet4.Cells.Item(1, 1) = "NETCO - MONATLICHE WERBEKOSTEN"
    $sheet4.Range("A1:N1").Merge()
    $sheet4.Cells.Item(1, 1).Font.Size = 14
    $sheet4.Cells.Item(1, 1).Font.Bold = $true
    
    # 2023
    $sheet4.Cells.Item(3, 1) = "2023"
    $sheet4.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(4, 1) = "Kategorie"
    $sheet4.Cells.Item(4, 2) = "Jan"
    $sheet4.Cells.Item(4, 3) = "Feb"
    $sheet4.Cells.Item(4, 4) = "Mar"
    $sheet4.Cells.Item(4, 5) = "Apr"
    $sheet4.Cells.Item(4, 6) = "Mai"
    $sheet4.Cells.Item(4, 7) = "Jun"
    $sheet4.Cells.Item(4, 8) = "Jul"
    $sheet4.Cells.Item(4, 9) = "Aug"
    $sheet4.Cells.Item(4, 10) = "Sep"
    $sheet4.Cells.Item(4, 11) = "Okt"
    $sheet4.Cells.Item(4, 12) = "Nov"
    $sheet4.Cells.Item(4, 13) = "Dez"
    $sheet4.Cells.Item(4, 14) = "GESAMT"
    $sheet4.Range("A4:N4").Font.Bold = $true
    
    # PPC 2023
    $sheet4.Cells.Item(5, 1) = "Pay-Per-Click"
    $sheet4.Cells.Item(5, 2) = 9112
    $sheet4.Cells.Item(5, 3) = 9916
    $sheet4.Cells.Item(5, 4) = 11271
    $sheet4.Cells.Item(5, 5) = 11084
    $sheet4.Cells.Item(5, 6) = 10802
    $sheet4.Cells.Item(5, 7) = 10709
    $sheet4.Cells.Item(5, 8) = 10611
    $sheet4.Cells.Item(5, 9) = 10198
    $sheet4.Cells.Item(5, 10) = 11764
    $sheet4.Cells.Item(5, 11) = 10651
    $sheet4.Cells.Item(5, 12) = 10771
    $sheet4.Cells.Item(5, 13) = 15418
    $sheet4.Cells.Item(5, 14) = 132307
    
    # Sonstige 2023
    $sheet4.Cells.Item(6, 1) = "Sonstige"
    $sheet4.Cells.Item(6, 14) = 61861
    
    $sheet4.Cells.Item(7, 1) = "GESAMT 2023"
    $sheet4.Cells.Item(7, 14) = 194168
    $sheet4.Range("A7:N7").Font.Bold = $true
    
    # 2024
    $sheet4.Cells.Item(9, 1) = "2024"
    $sheet4.Cells.Item(9, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(10, 1) = "Kategorie"
    $sheet4.Cells.Item(10, 2) = "Jan"
    $sheet4.Cells.Item(10, 3) = "Feb"
    $sheet4.Cells.Item(10, 4) = "Mar"
    $sheet4.Cells.Item(10, 5) = "Apr"
    $sheet4.Cells.Item(10, 6) = "Mai"
    $sheet4.Cells.Item(10, 7) = "Jun"
    $sheet4.Cells.Item(10, 8) = "Jul"
    $sheet4.Cells.Item(10, 9) = "Aug"
    $sheet4.Cells.Item(10, 10) = "Sep"
    $sheet4.Cells.Item(10, 11) = "Okt"
    $sheet4.Cells.Item(10, 12) = "Nov"
    $sheet4.Cells.Item(10, 13) = "Dez"
    $sheet4.Cells.Item(10, 14) = "GESAMT"
    $sheet4.Range("A10:N10").Font.Bold = $true
    
    # PPC 2024
    $sheet4.Cells.Item(11, 1) = "Pay-Per-Click"
    $sheet4.Cells.Item(11, 2) = 11446
    $sheet4.Cells.Item(11, 3) = 12122
    $sheet4.Cells.Item(11, 4) = 12393
    $sheet4.Cells.Item(11, 5) = 16974
    $sheet4.Cells.Item(11, 6) = 15785
    $sheet4.Cells.Item(11, 7) = 39837
    $sheet4.Cells.Item(11, 8) = 14721
    $sheet4.Cells.Item(11, 9) = 14422
    $sheet4.Cells.Item(11, 10) = 19180
    $sheet4.Cells.Item(11, 11) = 18851
    $sheet4.Cells.Item(11, 12) = 18864
    $sheet4.Cells.Item(11, 13) = 17110
    $sheet4.Cells.Item(11, 14) = 211705
    
    $sheet4.Cells.Item(12, 1) = "Sonstige"
    $sheet4.Cells.Item(12, 14) = 5123
    
    $sheet4.Cells.Item(13, 1) = "GESAMT 2024"
    $sheet4.Cells.Item(13, 14) = 216828
    $sheet4.Range("A13:N13").Font.Bold = $true
    
    # 2025
    $sheet4.Cells.Item(15, 1) = "2025"
    $sheet4.Cells.Item(15, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(16, 1) = "Kategorie"
    $sheet4.Cells.Item(16, 2) = "Jan"
    $sheet4.Cells.Item(16, 3) = "Feb"
    $sheet4.Cells.Item(16, 4) = "Mar"
    $sheet4.Cells.Item(16, 5) = "Apr"
    $sheet4.Cells.Item(16, 6) = "Mai"
    $sheet4.Cells.Item(16, 7) = "Jun"
    $sheet4.Cells.Item(16, 8) = "Jul"
    $sheet4.Cells.Item(16, 9) = "Aug"
    $sheet4.Cells.Item(16, 10) = "Sep"
    $sheet4.Cells.Item(16, 11) = "Okt"
    $sheet4.Cells.Item(16, 12) = "Nov"
    $sheet4.Cells.Item(16, 13) = "Dez"
    $sheet4.Cells.Item(16, 14) = "GESAMT"
    $sheet4.Range("A16:N16").Font.Bold = $true
    
    # PPC 2025
    $sheet4.Cells.Item(17, 1) = "Pay-Per-Click"
    $sheet4.Cells.Item(17, 2) = 19219
    $sheet4.Cells.Item(17, 3) = 19338
    $sheet4.Cells.Item(17, 4) = 21965
    $sheet4.Cells.Item(17, 5) = 16964
    $sheet4.Cells.Item(17, 6) = 15715
    $sheet4.Cells.Item(17, 7) = 17563
    $sheet4.Cells.Item(17, 8) = 20884
    $sheet4.Cells.Item(17, 9) = 21724
    $sheet4.Cells.Item(17, 10) = 22410
    $sheet4.Cells.Item(17, 11) = 35086
    $sheet4.Cells.Item(17, 12) = 25974
    $sheet4.Cells.Item(17, 13) = 15548
    $sheet4.Cells.Item(17, 14) = 252390
    
    $sheet4.Cells.Item(18, 1) = "Sonstige"
    $sheet4.Cells.Item(18, 14) = 16138
    
    $sheet4.Cells.Item(19, 1) = "GESAMT 2025"
    $sheet4.Cells.Item(19, 14) = 268528
    $sheet4.Range("A19:N19").Font.Bold = $true
    
    $sheet4.Columns.Item(1).ColumnWidth = 20
    for ($c = 2; $c -le 14; $c++) { $sheet4.Columns.Item($c).ColumnWidth = 10 }
    
    # Save
    $workbook.SaveAs($outputPath)
    $workbook.Close($true)
    
    Write-Host "====================================="
    Write-Host "Excel-Tabelle erstellt!"
    Write-Host "Datei: $outputPath"
    Write-Host ""
    Write-Host "Sheets:"
    Write-Host "  1. Werbekosten - Uebersicht nach Marke"
    Write-Host "  2. Traffic - Sessions nach Kanal"
    Write-Host "  3. KPIs - Kosten pro Session"
    Write-Host "  4. NetCo Monatlich - Detailaufschluesselung"
    Write-Host "====================================="
    
} catch {
    Write-Host "ERROR:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
