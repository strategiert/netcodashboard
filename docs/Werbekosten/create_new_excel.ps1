
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"
$outputPath = "$basePath\Marketingplan_2023-2025_NEU.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Add()
    $sheet = $workbook.Sheets.Item(1)
    $sheet.Name = "Marketing Budget"
    
    # Title
    $sheet.Cells.Item(1, 1) = "MARKETING BUDGET - NETCO & MICROVISTA (2023-2025)"
    $sheet.Range("A1:N1").Merge()
    $sheet.Cells.Item(1, 1).Font.Size = 16
    $sheet.Cells.Item(1, 1).Font.Bold = $true
    
    # === 2023 ===
    $sheet.Cells.Item(3, 1) = "2023"
    $sheet.Cells.Item(3, 1).Font.Bold = $true
    $sheet.Cells.Item(3, 1).Font.Size = 14
    
    # Headers
    $sheet.Cells.Item(4, 1) = "Kategorie"
    $sheet.Cells.Item(4, 2) = "Jan"
    $sheet.Cells.Item(4, 3) = "Feb"
    $sheet.Cells.Item(4, 4) = "Mar"
    $sheet.Cells.Item(4, 5) = "Apr"
    $sheet.Cells.Item(4, 6) = "Mai"
    $sheet.Cells.Item(4, 7) = "Jun"
    $sheet.Cells.Item(4, 8) = "Jul"
    $sheet.Cells.Item(4, 9) = "Aug"
    $sheet.Cells.Item(4, 10) = "Sep"
    $sheet.Cells.Item(4, 11) = "Okt"
    $sheet.Cells.Item(4, 12) = "Nov"
    $sheet.Cells.Item(4, 13) = "Dez"
    $sheet.Cells.Item(4, 14) = "GESAMT"
    $sheet.Range("A4:N4").Font.Bold = $true
    
    # SEO 2023
    $sheet.Cells.Item(5, 1) = "SEO"
    $sheet.Cells.Item(5, 2) = 5555
    $sheet.Cells.Item(5, 3) = 2510
    $sheet.Cells.Item(5, 4) = 2510
    $sheet.Cells.Item(5, 5) = 2510
    $sheet.Cells.Item(5, 6) = 0
    $sheet.Cells.Item(5, 7) = 449.25
    $sheet.Cells.Item(5, 8) = 149.75
    $sheet.Cells.Item(5, 9) = 149.75
    $sheet.Cells.Item(5, 10) = 149.75
    $sheet.Cells.Item(5, 11) = 149.75
    $sheet.Cells.Item(5, 12) = 149.75
    $sheet.Cells.Item(5, 13) = 149.75
    $sheet.Cells.Item(5, 14) = 14432.75
    
    # Content Marketing 2023
    $sheet.Cells.Item(6, 1) = "Content Marketing"
    $sheet.Cells.Item(6, 2) = 0
    $sheet.Cells.Item(6, 3) = 0
    $sheet.Cells.Item(6, 4) = 372.45
    $sheet.Cells.Item(6, 5) = 124.15
    $sheet.Cells.Item(6, 6) = 124.15
    $sheet.Cells.Item(6, 7) = 124.15
    $sheet.Cells.Item(6, 8) = 3228
    $sheet.Cells.Item(6, 9) = 0
    $sheet.Cells.Item(6, 10) = 568
    $sheet.Cells.Item(6, 11) = 0
    $sheet.Cells.Item(6, 12) = 0
    $sheet.Cells.Item(6, 13) = 0
    $sheet.Cells.Item(6, 14) = 4540.90
    
    # PPC 2023
    $sheet.Cells.Item(7, 1) = "Pay-Per-Click (Google/MS Ads)"
    $sheet.Cells.Item(7, 2) = 9111.70
    $sheet.Cells.Item(7, 3) = 9915.60
    $sheet.Cells.Item(7, 4) = 11271.23
    $sheet.Cells.Item(7, 5) = 11083.57
    $sheet.Cells.Item(7, 6) = 10802.15
    $sheet.Cells.Item(7, 7) = 10709.14
    $sheet.Cells.Item(7, 8) = 10611.27
    $sheet.Cells.Item(7, 9) = 10197.92
    $sheet.Cells.Item(7, 10) = 11763.51
    $sheet.Cells.Item(7, 11) = 10651.41
    $sheet.Cells.Item(7, 12) = 10771.18
    $sheet.Cells.Item(7, 13) = 15418.47
    $sheet.Cells.Item(7, 14) = 132307.15
    
    # Social Media 2023
    $sheet.Cells.Item(8, 1) = "Social Media"
    $sheet.Cells.Item(8, 2) = 0
    $sheet.Cells.Item(8, 3) = 0
    $sheet.Cells.Item(8, 4) = 409.14
    $sheet.Cells.Item(8, 5) = 136.38
    $sheet.Cells.Item(8, 6) = 136.38
    $sheet.Cells.Item(8, 7) = 136.38
    $sheet.Cells.Item(8, 8) = 136.38
    $sheet.Cells.Item(8, 9) = 136.38
    $sheet.Cells.Item(8, 10) = 136.38
    $sheet.Cells.Item(8, 11) = 929.67
    $sheet.Cells.Item(8, 12) = 136.38
    $sheet.Cells.Item(8, 13) = 2339.58
    $sheet.Cells.Item(8, 14) = 4633.05
    
    # Beratung 2023
    $sheet.Cells.Item(9, 1) = "Beratung/Consulting"
    $sheet.Cells.Item(9, 2) = 0
    $sheet.Cells.Item(9, 3) = 195
    $sheet.Cells.Item(9, 4) = 688
    $sheet.Cells.Item(9, 5) = 0
    $sheet.Cells.Item(9, 6) = 468
    $sheet.Cells.Item(9, 7) = 0
    $sheet.Cells.Item(9, 8) = 1044
    $sheet.Cells.Item(9, 9) = 0
    $sheet.Cells.Item(9, 10) = 0
    $sheet.Cells.Item(9, 11) = 0
    $sheet.Cells.Item(9, 12) = 0
    $sheet.Cells.Item(9, 13) = 0
    $sheet.Cells.Item(9, 14) = 2395
    
    # Sonstige 2023
    $sheet.Cells.Item(10, 1) = "Sonstige"
    $sheet.Cells.Item(10, 2) = 4138.22
    $sheet.Cells.Item(10, 3) = 3604.29
    $sheet.Cells.Item(10, 4) = 10057.08
    $sheet.Cells.Item(10, 5) = 11957.34
    $sheet.Cells.Item(10, 6) = 1986.33
    $sheet.Cells.Item(10, 7) = 21883.38
    $sheet.Cells.Item(10, 8) = 12940.25
    $sheet.Cells.Item(10, 9) = 1372.99
    $sheet.Cells.Item(10, 10) = 7564.36
    $sheet.Cells.Item(10, 11) = 2490.35
    $sheet.Cells.Item(10, 12) = 1362.10
    $sheet.Cells.Item(10, 13) = 229948.54
    $sheet.Cells.Item(10, 14) = 309305.23
    
    # Total 2023
    $sheet.Cells.Item(11, 1) = "GESAMT 2023"
    $sheet.Cells.Item(11, 1).Font.Bold = $true
    $sheet.Cells.Item(11, 14) = 467614.08
    $sheet.Cells.Item(11, 14).Font.Bold = $true
    
    # === 2024 ===
    $sheet.Cells.Item(13, 1) = "2024"
    $sheet.Cells.Item(13, 1).Font.Bold = $true
    $sheet.Cells.Item(13, 1).Font.Size = 14
    
    # Headers 2024
    $sheet.Cells.Item(14, 1) = "Kategorie"
    $sheet.Cells.Item(14, 2) = "Jan"
    $sheet.Cells.Item(14, 3) = "Feb"
    $sheet.Cells.Item(14, 4) = "Mar"
    $sheet.Cells.Item(14, 5) = "Apr"
    $sheet.Cells.Item(14, 6) = "Mai"
    $sheet.Cells.Item(14, 7) = "Jun"
    $sheet.Cells.Item(14, 8) = "Jul"
    $sheet.Cells.Item(14, 9) = "Aug"
    $sheet.Cells.Item(14, 10) = "Sep"
    $sheet.Cells.Item(14, 11) = "Okt"
    $sheet.Cells.Item(14, 12) = "Nov"
    $sheet.Cells.Item(14, 13) = "Dez"
    $sheet.Cells.Item(14, 14) = "GESAMT"
    $sheet.Range("A14:N14").Font.Bold = $true
    
    # PPC 2024
    $sheet.Cells.Item(15, 1) = "Pay-Per-Click (Google/MS Ads)"
    $sheet.Cells.Item(15, 2) = 11445.72
    $sheet.Cells.Item(15, 3) = 12122.23
    $sheet.Cells.Item(15, 4) = 12393.47
    $sheet.Cells.Item(15, 5) = 16973.72
    $sheet.Cells.Item(15, 6) = 15785.08
    $sheet.Cells.Item(15, 7) = 39836.71
    $sheet.Cells.Item(15, 8) = 14721.29
    $sheet.Cells.Item(15, 9) = 14422.03
    $sheet.Cells.Item(15, 10) = 19180.36
    $sheet.Cells.Item(15, 11) = 18850.91
    $sheet.Cells.Item(15, 12) = 18864.11
    $sheet.Cells.Item(15, 13) = 17109.52
    $sheet.Cells.Item(15, 14) = 211705.15
    
    # Sonstige 2024
    $sheet.Cells.Item(16, 1) = "Sonstige/Messen/SEO/Social"
    $sheet.Cells.Item(16, 14) = 53768.07
    
    # Total 2024
    $sheet.Cells.Item(17, 1) = "GESAMT 2024"
    $sheet.Cells.Item(17, 1).Font.Bold = $true
    $sheet.Cells.Item(17, 14) = 265473.22
    $sheet.Cells.Item(17, 14).Font.Bold = $true
    
    # === 2025 ===
    $sheet.Cells.Item(19, 1) = "2025"
    $sheet.Cells.Item(19, 1).Font.Bold = $true
    $sheet.Cells.Item(19, 1).Font.Size = 14
    
    # Headers 2025
    $sheet.Cells.Item(20, 1) = "Kategorie"
    $sheet.Cells.Item(20, 2) = "Jan"
    $sheet.Cells.Item(20, 3) = "Feb"
    $sheet.Cells.Item(20, 4) = "Mar"
    $sheet.Cells.Item(20, 5) = "Apr"
    $sheet.Cells.Item(20, 6) = "Mai"
    $sheet.Cells.Item(20, 7) = "Jun"
    $sheet.Cells.Item(20, 8) = "Jul"
    $sheet.Cells.Item(20, 9) = "Aug"
    $sheet.Cells.Item(20, 10) = "Sep"
    $sheet.Cells.Item(20, 11) = "Okt"
    $sheet.Cells.Item(20, 12) = "Nov"
    $sheet.Cells.Item(20, 13) = "Dez"
    $sheet.Cells.Item(20, 14) = "GESAMT"
    $sheet.Range("A20:N20").Font.Bold = $true
    
    # PPC 2025
    $sheet.Cells.Item(21, 1) = "Pay-Per-Click (Google/MS Ads)"
    $sheet.Cells.Item(21, 2) = 19218.92
    $sheet.Cells.Item(21, 3) = 19338.48
    $sheet.Cells.Item(21, 4) = 21964.69
    $sheet.Cells.Item(21, 5) = 16963.73
    $sheet.Cells.Item(21, 6) = 15715.39
    $sheet.Cells.Item(21, 7) = 17563.23
    $sheet.Cells.Item(21, 8) = 20883.85
    $sheet.Cells.Item(21, 9) = 21724.27
    $sheet.Cells.Item(21, 10) = 22409.99
    $sheet.Cells.Item(21, 11) = 35085.68
    $sheet.Cells.Item(21, 12) = 25973.92
    $sheet.Cells.Item(21, 13) = 15548.30
    $sheet.Cells.Item(21, 14) = 252390.45
    
    # Sonstige 2025
    $sheet.Cells.Item(22, 1) = "Sonstige/SEO/Content/Social"
    $sheet.Cells.Item(22, 14) = 84324.79
    
    # Total 2025
    $sheet.Cells.Item(23, 1) = "GESAMT 2025"
    $sheet.Cells.Item(23, 1).Font.Bold = $true
    $sheet.Cells.Item(23, 14) = 336715.24
    $sheet.Cells.Item(23, 14).Font.Bold = $true
    
    # === SUMMARY ===
    $sheet.Cells.Item(26, 1) = "JAHRESUEBERSICHT"
    $sheet.Cells.Item(26, 1).Font.Bold = $true
    $sheet.Cells.Item(26, 1).Font.Size = 14
    
    $sheet.Cells.Item(27, 1) = "Jahr"
    $sheet.Cells.Item(27, 2) = "Gesamt EUR"
    $sheet.Cells.Item(27, 3) = "davon PPC"
    $sheet.Cells.Item(27, 4) = "PPC Anteil"
    $sheet.Range("A27:D27").Font.Bold = $true
    
    $sheet.Cells.Item(28, 1) = "2023"
    $sheet.Cells.Item(28, 2) = 467614.08
    $sheet.Cells.Item(28, 3) = 132307.15
    $sheet.Cells.Item(28, 4) = "28%"
    
    $sheet.Cells.Item(29, 1) = "2024"
    $sheet.Cells.Item(29, 2) = 265473.22
    $sheet.Cells.Item(29, 3) = 211705.15
    $sheet.Cells.Item(29, 4) = "80%"
    
    $sheet.Cells.Item(30, 1) = "2025"
    $sheet.Cells.Item(30, 2) = 336715.24
    $sheet.Cells.Item(30, 3) = 252390.45
    $sheet.Cells.Item(30, 4) = "75%"
    
    $sheet.Cells.Item(31, 1) = "TOTAL"
    $sheet.Cells.Item(31, 2) = 1069802.54
    $sheet.Cells.Item(31, 3) = 596402.75
    $sheet.Cells.Item(31, 4) = "56%"
    $sheet.Range("A31:D31").Font.Bold = $true
    
    # Column widths
    $sheet.Columns.Item(1).ColumnWidth = 32
    for ($c = 2; $c -le 14; $c++) {
        $sheet.Columns.Item($c).ColumnWidth = 12
    }
    
    # Save
    $workbook.SaveAs($outputPath)
    $workbook.Close($true)
    
    Write-Host "====================================="
    Write-Host "Neue Excel-Tabelle erstellt!"
    Write-Host "Datei: $outputPath"
    Write-Host "====================================="
    
} catch {
    Write-Host "ERROR:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
