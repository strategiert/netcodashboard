
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"
$outputPath = "$basePath\Marketingplan_Komplett_2023-2025.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Add()
    
    # ============ SHEET 1: EXECUTIVE SUMMARY ============
    $sheet1 = $workbook.Sheets.Item(1)
    $sheet1.Name = "Executive Summary"
    
    $sheet1.Cells.Item(1, 1) = "MARKETINGPLAN 2023-2025"
    $sheet1.Range("A1:G1").Merge()
    $sheet1.Cells.Item(1, 1).Font.Size = 20
    $sheet1.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet1.Cells.Item(2, 1) = "NetCo GmbH - Bodycam, BauTV+ | Microvista GmbH"
    $sheet1.Cells.Item(3, 1) = "Zeitraum: Januar 2023 - Dezember 2025"
    
    # GESAMTUEBERSICHT
    $sheet1.Cells.Item(5, 1) = "GESAMTUEBERSICHT"
    $sheet1.Cells.Item(5, 1).Font.Bold = $true
    $sheet1.Cells.Item(5, 1).Font.Size = 14
    
    $sheet1.Cells.Item(6, 1) = "Kennzahl"
    $sheet1.Cells.Item(6, 2) = "2023"
    $sheet1.Cells.Item(6, 3) = "2024"
    $sheet1.Cells.Item(6, 4) = "2025"
    $sheet1.Cells.Item(6, 5) = "GESAMT"
    $sheet1.Range("A6:E6").Font.Bold = $true
    
    $sheet1.Cells.Item(7, 1) = "Werbekosten Gesamt"
    $sheet1.Cells.Item(7, 2) = 227824
    $sheet1.Cells.Item(7, 3) = 240380
    $sheet1.Cells.Item(7, 4) = 314825
    $sheet1.Cells.Item(7, 5) = 783029
    
    $sheet1.Cells.Item(8, 1) = "davon Google Ads"
    $sheet1.Cells.Item(8, 5) = 509800
    
    $sheet1.Cells.Item(9, 1) = "davon Bing Ads (gesch.)"
    $sheet1.Cells.Item(9, 5) = 61176
    
    $sheet1.Cells.Item(10, 1) = "Website Sessions"
    $sheet1.Cells.Item(10, 5) = 118694
    
    $sheet1.Cells.Item(11, 1) = "Google Ads Conversions"
    $sheet1.Cells.Item(11, 5) = 1833
    
    $sheet1.Cells.Item(12, 1) = "Kosten pro Session"
    $sheet1.Cells.Item(12, 5) = 6.59
    
    # MARKENVERTEILUNG
    $sheet1.Cells.Item(14, 1) = "WERBEKOSTEN NACH MARKE"
    $sheet1.Cells.Item(14, 1).Font.Bold = $true
    $sheet1.Cells.Item(14, 1).Font.Size = 14
    
    $sheet1.Cells.Item(15, 1) = "Marke"
    $sheet1.Cells.Item(15, 2) = "Google Ads"
    $sheet1.Cells.Item(15, 3) = "Anteil"
    $sheet1.Cells.Item(15, 4) = "Gesamt (inkl. Sonstige)"
    $sheet1.Range("A15:D15").Font.Bold = $true
    
    $sheet1.Cells.Item(16, 1) = "BauTV+ (BK)"
    $sheet1.Cells.Item(16, 2) = 362943
    $sheet1.Cells.Item(16, 3) = "71.2%"
    $sheet1.Cells.Item(16, 4) = 456496
    
    $sheet1.Cells.Item(17, 1) = "Bodycam (BC)"
    $sheet1.Cells.Item(17, 2) = 73696
    $sheet1.Cells.Item(17, 3) = "14.5%"
    $sheet1.Cells.Item(17, 4) = 112540
    
    $sheet1.Cells.Item(18, 1) = "Microvista (NDT/MV)"
    $sheet1.Cells.Item(18, 2) = 65087
    $sheet1.Cells.Item(18, 3) = "12.8%"
    $sheet1.Cells.Item(18, 4) = 103505
    
    $sheet1.Cells.Item(19, 1) = "NetCo Allgemein"
    $sheet1.Cells.Item(19, 2) = 7484
    $sheet1.Cells.Item(19, 3) = "1.5%"
    $sheet1.Cells.Item(19, 4) = 110488
    
    # LAENDERVERTEILUNG
    $sheet1.Cells.Item(21, 1) = "WERBEKOSTEN NACH LAND"
    $sheet1.Cells.Item(21, 1).Font.Bold = $true
    $sheet1.Cells.Item(21, 1).Font.Size = 14
    
    $sheet1.Cells.Item(22, 1) = "Land"
    $sheet1.Cells.Item(22, 2) = "Google Ads"
    $sheet1.Cells.Item(22, 3) = "Anteil"
    $sheet1.Range("A22:C22").Font.Bold = $true
    
    $sheet1.Cells.Item(23, 1) = "Deutschland"
    $sheet1.Cells.Item(23, 2) = 333047
    $sheet1.Cells.Item(23, 3) = "65.3%"
    
    $sheet1.Cells.Item(24, 1) = "Niederlande (Expansion)"
    $sheet1.Cells.Item(24, 2) = 88524
    $sheet1.Cells.Item(24, 3) = "17.4%"
    
    $sheet1.Cells.Item(25, 1) = "Italien (Expansion)"
    $sheet1.Cells.Item(25, 2) = 9867
    $sheet1.Cells.Item(25, 3) = "1.9%"
    
    $sheet1.Cells.Item(26, 1) = "EU/AT/Sonstige"
    $sheet1.Cells.Item(26, 2) = 78362
    $sheet1.Cells.Item(26, 3) = "15.4%"
    
    $sheet1.Columns.Item(1).ColumnWidth = 30
    for ($c = 2; $c -le 5; $c++) { $sheet1.Columns.Item($c).ColumnWidth = 18 }
    
    # ============ SHEET 2: BAUTV+ ============
    $sheet2 = $workbook.Sheets.Add()
    $sheet2.Name = "BauTV+"
    
    $sheet2.Cells.Item(1, 1) = "BAUTV+ (Baustellenkameras) - MARKETING DETAIL"
    $sheet2.Range("A1:N1").Merge()
    $sheet2.Cells.Item(1, 1).Font.Size = 16
    $sheet2.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet2.Cells.Item(3, 1) = "GOOGLE ADS KAMPAGNEN"
    $sheet2.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet2.Cells.Item(4, 1) = "Kampagne"
    $sheet2.Cells.Item(4, 2) = "Typ"
    $sheet2.Cells.Item(4, 3) = "Land"
    $sheet2.Cells.Item(4, 4) = "Kosten"
    $sheet2.Cells.Item(4, 5) = "Clicks"
    $sheet2.Cells.Item(4, 6) = "Conv."
    $sheet2.Cells.Item(4, 7) = "CPC"
    $sheet2.Range("A4:G4").Font.Bold = $true
    
    $sheet2.Cells.Item(5, 1) = "BK-SN-D-Conmax"
    $sheet2.Cells.Item(5, 2) = "Search"
    $sheet2.Cells.Item(5, 3) = "DE"
    $sheet2.Cells.Item(5, 4) = 198492
    $sheet2.Cells.Item(5, 5) = 28574
    $sheet2.Cells.Item(5, 6) = 380
    $sheet2.Cells.Item(5, 7) = 6.95
    
    $sheet2.Cells.Item(6, 1) = "BK-PerformanceMax-Leads-NL"
    $sheet2.Cells.Item(6, 2) = "PMax"
    $sheet2.Cells.Item(6, 3) = "NL"
    $sheet2.Cells.Item(6, 4) = 47937
    $sheet2.Cells.Item(6, 5) = 155798
    $sheet2.Cells.Item(6, 6) = 186
    $sheet2.Cells.Item(6, 7) = 0.31
    
    $sheet2.Cells.Item(7, 1) = "BK-PerformanceMax-Leads-D"
    $sheet2.Cells.Item(7, 2) = "PMax"
    $sheet2.Cells.Item(7, 3) = "DE"
    $sheet2.Cells.Item(7, 4) = 37501
    $sheet2.Cells.Item(7, 5) = 72605
    $sheet2.Cells.Item(7, 6) = 334
    $sheet2.Cells.Item(7, 7) = 0.52
    
    $sheet2.Cells.Item(8, 1) = "BK-SN-NL"
    $sheet2.Cells.Item(8, 2) = "Search"
    $sheet2.Cells.Item(8, 3) = "NL"
    $sheet2.Cells.Item(8, 4) = 34834
    $sheet2.Cells.Item(8, 5) = 7370
    $sheet2.Cells.Item(8, 6) = 56
    $sheet2.Cells.Item(8, 7) = 4.73
    
    $sheet2.Cells.Item(9, 1) = "BK-PerformanceMax-Leads-IT"
    $sheet2.Cells.Item(9, 2) = "PMax"
    $sheet2.Cells.Item(9, 3) = "IT"
    $sheet2.Cells.Item(9, 4) = 9867
    $sheet2.Cells.Item(9, 5) = 37539
    $sheet2.Cells.Item(9, 6) = 103
    $sheet2.Cells.Item(9, 7) = 0.26
    
    $sheet2.Cells.Item(10, 1) = "BK-DYN-D"
    $sheet2.Cells.Item(10, 2) = "Search"
    $sheet2.Cells.Item(10, 3) = "DE"
    $sheet2.Cells.Item(10, 4) = 8880
    $sheet2.Cells.Item(10, 5) = 4516
    $sheet2.Cells.Item(10, 6) = 46
    $sheet2.Cells.Item(10, 7) = 1.97
    
    $sheet2.Cells.Item(11, 1) = "Sonstige BK Kampagnen"
    $sheet2.Cells.Item(11, 4) = 25432
    
    $sheet2.Cells.Item(12, 1) = "GESAMT BAUTV+"
    $sheet2.Cells.Item(12, 4) = 362943
    $sheet2.Cells.Item(12, 5) = 320900
    $sheet2.Cells.Item(12, 6) = 1231
    $sheet2.Cells.Item(12, 7) = 1.13
    $sheet2.Range("A12:G12").Font.Bold = $true
    
    # Zusammenfassung
    $sheet2.Cells.Item(14, 1) = "ZUSAMMENFASSUNG BAUTV+"
    $sheet2.Cells.Item(14, 1).Font.Bold = $true
    
    $sheet2.Cells.Item(15, 1) = "Google Ads Kosten"
    $sheet2.Cells.Item(15, 2) = 362943
    
    $sheet2.Cells.Item(16, 1) = "Bing Ads (gesch. 12%)"
    $sheet2.Cells.Item(16, 2) = 43553
    
    $sheet2.Cells.Item(17, 1) = "Sonstige Werbung"
    $sheet2.Cells.Item(17, 2) = 50000
    
    $sheet2.Cells.Item(18, 1) = "TOTAL BAUTV+"
    $sheet2.Cells.Item(18, 2) = 456496
    $sheet2.Range("A18:B18").Font.Bold = $true
    
    $sheet2.Cells.Item(20, 1) = "Anteil am Gesamtbudget: 58.3%"
    
    $sheet2.Columns.Item(1).ColumnWidth = 35
    for ($c = 2; $c -le 7; $c++) { $sheet2.Columns.Item($c).ColumnWidth = 12 }
    
    # ============ SHEET 3: BODYCAM ============
    $sheet3 = $workbook.Sheets.Add()
    $sheet3.Name = "Bodycam"
    
    $sheet3.Cells.Item(1, 1) = "BODYCAM - MARKETING DETAIL"
    $sheet3.Range("A1:N1").Merge()
    $sheet3.Cells.Item(1, 1).Font.Size = 16
    $sheet3.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(3, 1) = "GOOGLE ADS KAMPAGNEN"
    $sheet3.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(4, 1) = "Kampagne"
    $sheet3.Cells.Item(4, 2) = "Typ"
    $sheet3.Cells.Item(4, 3) = "Land"
    $sheet3.Cells.Item(4, 4) = "Kosten"
    $sheet3.Cells.Item(4, 5) = "Clicks"
    $sheet3.Cells.Item(4, 6) = "Conv."
    $sheet3.Cells.Item(4, 7) = "CPC"
    $sheet3.Range("A4:G4").Font.Bold = $true
    
    $sheet3.Cells.Item(5, 1) = "BC-SN-D-Conmax"
    $sheet3.Cells.Item(5, 2) = "Search"
    $sheet3.Cells.Item(5, 3) = "DE"
    $sheet3.Cells.Item(5, 4) = 29524
    $sheet3.Cells.Item(5, 5) = 16716
    $sheet3.Cells.Item(5, 6) = 171
    $sheet3.Cells.Item(5, 7) = 1.77
    
    $sheet3.Cells.Item(6, 1) = "BC-Performance Max-Leads-D"
    $sheet3.Cells.Item(6, 2) = "PMax"
    $sheet3.Cells.Item(6, 3) = "DE"
    $sheet3.Cells.Item(6, 4) = 11268
    $sheet3.Cells.Item(6, 5) = 18038
    $sheet3.Cells.Item(6, 6) = 87
    $sheet3.Cells.Item(6, 7) = 0.62
    
    $sheet3.Cells.Item(7, 1) = "BC-SN-D[SI]-Conmax"
    $sheet3.Cells.Item(7, 2) = "Search"
    $sheet3.Cells.Item(7, 3) = "DE"
    $sheet3.Cells.Item(7, 4) = 7192
    $sheet3.Cells.Item(7, 5) = 2482
    $sheet3.Cells.Item(7, 6) = 35
    $sheet3.Cells.Item(7, 7) = 2.90
    
    $sheet3.Cells.Item(8, 1) = "BC-Performance Max-Leads-NL"
    $sheet3.Cells.Item(8, 2) = "PMax"
    $sheet3.Cells.Item(8, 3) = "NL"
    $sheet3.Cells.Item(8, 4) = 5754
    $sheet3.Cells.Item(8, 5) = 20519
    $sheet3.Cells.Item(8, 6) = 94
    $sheet3.Cells.Item(8, 7) = 0.28
    
    $sheet3.Cells.Item(9, 1) = "BC-Performance Max-D-Deeskalation"
    $sheet3.Cells.Item(9, 2) = "PMax"
    $sheet3.Cells.Item(9, 3) = "DE"
    $sheet3.Cells.Item(9, 4) = 5174
    $sheet3.Cells.Item(9, 5) = 32041
    $sheet3.Cells.Item(9, 6) = 37
    $sheet3.Cells.Item(9, 7) = 0.16
    
    $sheet3.Cells.Item(10, 1) = "BC-SN-NL-Conmax"
    $sheet3.Cells.Item(10, 2) = "Search"
    $sheet3.Cells.Item(10, 3) = "NL"
    $sheet3.Cells.Item(10, 4) = 4806
    $sheet3.Cells.Item(10, 5) = 1552
    $sheet3.Cells.Item(10, 6) = 11
    $sheet3.Cells.Item(10, 7) = 3.10
    
    $sheet3.Cells.Item(11, 1) = "BC-DA-D-Impressionen"
    $sheet3.Cells.Item(11, 2) = "Display"
    $sheet3.Cells.Item(11, 3) = "DE"
    $sheet3.Cells.Item(11, 4) = 4146
    $sheet3.Cells.Item(11, 5) = 2393
    $sheet3.Cells.Item(11, 6) = 0
    $sheet3.Cells.Item(11, 7) = 1.73
    
    $sheet3.Cells.Item(12, 1) = "Sonstige BC Kampagnen"
    $sheet3.Cells.Item(12, 4) = 5832
    
    $sheet3.Cells.Item(13, 1) = "GESAMT BODYCAM"
    $sheet3.Cells.Item(13, 4) = 73696
    $sheet3.Cells.Item(13, 5) = 95762
    $sheet3.Cells.Item(13, 6) = 445
    $sheet3.Cells.Item(13, 7) = 0.77
    $sheet3.Range("A13:G13").Font.Bold = $true
    
    $sheet3.Cells.Item(15, 1) = "ZUSAMMENFASSUNG BODYCAM"
    $sheet3.Cells.Item(15, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(16, 1) = "Google Ads Kosten"
    $sheet3.Cells.Item(16, 2) = 73696
    
    $sheet3.Cells.Item(17, 1) = "Bing Ads (gesch. 12%)"
    $sheet3.Cells.Item(17, 2) = 8844
    
    $sheet3.Cells.Item(18, 1) = "Sonstige Werbung"
    $sheet3.Cells.Item(18, 2) = 30000
    
    $sheet3.Cells.Item(19, 1) = "TOTAL BODYCAM"
    $sheet3.Cells.Item(19, 2) = 112540
    $sheet3.Range("A19:B19").Font.Bold = $true
    
    $sheet3.Cells.Item(21, 1) = "Anteil am Gesamtbudget: 14.4%"
    $sheet3.Cells.Item(22, 1) = "Bester CPC aller Marken: 0.77 EUR"
    
    $sheet3.Columns.Item(1).ColumnWidth = 35
    for ($c = 2; $c -le 7; $c++) { $sheet3.Columns.Item($c).ColumnWidth = 12 }
    
    # ============ SHEET 4: MICROVISTA ============
    $sheet4 = $workbook.Sheets.Add()
    $sheet4.Name = "Microvista"
    
    $sheet4.Cells.Item(1, 1) = "MICROVISTA (NDT) - MARKETING DETAIL"
    $sheet4.Range("A1:N1").Merge()
    $sheet4.Cells.Item(1, 1).Font.Size = 16
    $sheet4.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(3, 1) = "GOOGLE ADS KAMPAGNEN"
    $sheet4.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(4, 1) = "Kampagne"
    $sheet4.Cells.Item(4, 2) = "Typ"
    $sheet4.Cells.Item(4, 3) = "Land"
    $sheet4.Cells.Item(4, 4) = "Kosten"
    $sheet4.Cells.Item(4, 5) = "Clicks"
    $sheet4.Cells.Item(4, 6) = "Conv."
    $sheet4.Cells.Item(4, 7) = "CPC"
    $sheet4.Range("A4:G4").Font.Bold = $true
    
    $sheet4.Cells.Item(5, 1) = "NDT-SN-D"
    $sheet4.Cells.Item(5, 2) = "Search"
    $sheet4.Cells.Item(5, 3) = "DE"
    $sheet4.Cells.Item(5, 4) = 27713
    $sheet4.Cells.Item(5, 5) = 5504
    $sheet4.Cells.Item(5, 6) = 55
    $sheet4.Cells.Item(5, 7) = 5.04
    
    $sheet4.Cells.Item(6, 1) = "NDT-PerfomanceMax-Leads-D"
    $sheet4.Cells.Item(6, 2) = "PMax"
    $sheet4.Cells.Item(6, 3) = "DE"
    $sheet4.Cells.Item(6, 4) = 12038
    $sheet4.Cells.Item(6, 5) = 21463
    $sheet4.Cells.Item(6, 6) = 47
    $sheet4.Cells.Item(6, 7) = 0.56
    
    $sheet4.Cells.Item(7, 1) = "NDT-SN-EU-Conmax"
    $sheet4.Cells.Item(7, 2) = "Search"
    $sheet4.Cells.Item(7, 3) = "EU"
    $sheet4.Cells.Item(7, 4) = 10933
    $sheet4.Cells.Item(7, 5) = 1946
    $sheet4.Cells.Item(7, 6) = 9
    $sheet4.Cells.Item(7, 7) = 5.62
    
    $sheet4.Cells.Item(8, 1) = "NDT-SN-EU"
    $sheet4.Cells.Item(8, 2) = "Search"
    $sheet4.Cells.Item(8, 3) = "EU"
    $sheet4.Cells.Item(8, 4) = 2960
    $sheet4.Cells.Item(8, 5) = 1063
    $sheet4.Cells.Item(8, 6) = 5
    $sheet4.Cells.Item(8, 7) = 2.78
    
    $sheet4.Cells.Item(9, 1) = "NDT-SN-Ultraschall-EU"
    $sheet4.Cells.Item(9, 2) = "Search"
    $sheet4.Cells.Item(9, 3) = "EU"
    $sheet4.Cells.Item(9, 4) = 2748
    $sheet4.Cells.Item(9, 5) = 1295
    $sheet4.Cells.Item(9, 6) = 2
    $sheet4.Cells.Item(9, 7) = 2.12
    
    $sheet4.Cells.Item(10, 1) = "NDT-SW-SN-Leads-D"
    $sheet4.Cells.Item(10, 2) = "Search"
    $sheet4.Cells.Item(10, 3) = "DE"
    $sheet4.Cells.Item(10, 4) = 2475
    $sheet4.Cells.Item(10, 5) = 857
    $sheet4.Cells.Item(10, 6) = 0
    $sheet4.Cells.Item(10, 7) = 2.89
    
    $sheet4.Cells.Item(11, 1) = "Sonstige NDT/MV Kampagnen"
    $sheet4.Cells.Item(11, 4) = 6220
    
    $sheet4.Cells.Item(12, 1) = "GESAMT MICROVISTA"
    $sheet4.Cells.Item(12, 4) = 65087
    $sheet4.Cells.Item(12, 5) = 49167
    $sheet4.Cells.Item(12, 6) = 128
    $sheet4.Cells.Item(12, 7) = 1.32
    $sheet4.Range("A12:G12").Font.Bold = $true
    
    $sheet4.Cells.Item(14, 1) = "ZUSAMMENFASSUNG MICROVISTA"
    $sheet4.Cells.Item(14, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(15, 1) = "Google Ads Kosten"
    $sheet4.Cells.Item(15, 2) = 65087
    
    $sheet4.Cells.Item(16, 1) = "Bing Ads (gesch. 12%)"
    $sheet4.Cells.Item(16, 2) = 7810
    
    $sheet4.Cells.Item(17, 1) = "Sonstige Werbung"
    $sheet4.Cells.Item(17, 2) = 30608
    
    $sheet4.Cells.Item(18, 1) = "TOTAL MICROVISTA"
    $sheet4.Cells.Item(18, 2) = 103505
    $sheet4.Range("A18:B18").Font.Bold = $true
    
    $sheet4.Cells.Item(20, 1) = "Anteil am Gesamtbudget: 13.2%"
    $sheet4.Cells.Item(21, 1) = "Hoechster Cost/Conversion: 508 EUR"
    
    $sheet4.Columns.Item(1).ColumnWidth = 35
    for ($c = 2; $c -le 7; $c++) { $sheet4.Columns.Item($c).ColumnWidth = 12 }
    
    # ============ SHEET 5: TRAFFIC ============
    $sheet5 = $workbook.Sheets.Add()
    $sheet5.Name = "Traffic"
    
    $sheet5.Cells.Item(1, 1) = "WEBSITE TRAFFIC ANALYSE"
    $sheet5.Range("A1:F1").Merge()
    $sheet5.Cells.Item(1, 1).Font.Size = 16
    $sheet5.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet5.Cells.Item(3, 1) = "SESSIONS NACH KANAL (2023-2025)"
    $sheet5.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet5.Cells.Item(4, 1) = "Kanal"
    $sheet5.Cells.Item(4, 2) = "NetCo"
    $sheet5.Cells.Item(4, 3) = "Microvista"
    $sheet5.Cells.Item(4, 4) = "GESAMT"
    $sheet5.Cells.Item(4, 5) = "Anteil"
    $sheet5.Cells.Item(4, 6) = "Engagement"
    $sheet5.Range("A4:F4").Font.Bold = $true
    
    $sheet5.Cells.Item(5, 1) = "Paid (PPC/Ads)"
    $sheet5.Cells.Item(5, 2) = 56901
    $sheet5.Cells.Item(5, 3) = 5972
    $sheet5.Cells.Item(5, 4) = 62873
    $sheet5.Cells.Item(5, 5) = "52.9%"
    $sheet5.Cells.Item(5, 6) = "69.2%"
    
    $sheet5.Cells.Item(6, 1) = "Direct"
    $sheet5.Cells.Item(6, 2) = 32467
    $sheet5.Cells.Item(6, 3) = 2709
    $sheet5.Cells.Item(6, 4) = 35176
    $sheet5.Cells.Item(6, 5) = "29.6%"
    $sheet5.Cells.Item(6, 6) = "61.9%"
    
    $sheet5.Cells.Item(7, 1) = "Organic (SEO)"
    $sheet5.Cells.Item(7, 2) = 12055
    $sheet5.Cells.Item(7, 3) = 1342
    $sheet5.Cells.Item(7, 4) = 13397
    $sheet5.Cells.Item(7, 5) = "11.3%"
    $sheet5.Cells.Item(7, 6) = "66.7%"
    
    $sheet5.Cells.Item(8, 1) = "Referral"
    $sheet5.Cells.Item(8, 2) = 4536
    $sheet5.Cells.Item(8, 3) = 613
    $sheet5.Cells.Item(8, 4) = 5149
    $sheet5.Cells.Item(8, 5) = "4.3%"
    $sheet5.Cells.Item(8, 6) = "69.6%"
    
    $sheet5.Cells.Item(9, 1) = "Social Media"
    $sheet5.Cells.Item(9, 2) = 521
    $sheet5.Cells.Item(9, 3) = 37
    $sheet5.Cells.Item(9, 4) = 558
    $sheet5.Cells.Item(9, 5) = "0.5%"
    $sheet5.Cells.Item(9, 6) = "59.8%"
    
    $sheet5.Cells.Item(10, 1) = "Newsletter/Email"
    $sheet5.Cells.Item(10, 2) = 235
    $sheet5.Cells.Item(10, 3) = 75
    $sheet5.Cells.Item(10, 4) = 310
    $sheet5.Cells.Item(10, 5) = "0.3%"
    $sheet5.Cells.Item(10, 6) = "72.1%"
    
    $sheet5.Cells.Item(11, 1) = "Sonstige"
    $sheet5.Cells.Item(11, 2) = 1160
    $sheet5.Cells.Item(11, 3) = 71
    $sheet5.Cells.Item(11, 4) = 1231
    $sheet5.Cells.Item(11, 5) = "1.0%"
    $sheet5.Cells.Item(11, 6) = "42.3%"
    
    $sheet5.Cells.Item(12, 1) = "GESAMT"
    $sheet5.Cells.Item(12, 2) = 107875
    $sheet5.Cells.Item(12, 3) = 10819
    $sheet5.Cells.Item(12, 4) = 118694
    $sheet5.Cells.Item(12, 5) = "100%"
    $sheet5.Range("A12:F12").Font.Bold = $true
    
    # SEO Wert
    $sheet5.Cells.Item(14, 1) = "SEO WERTBERECHNUNG"
    $sheet5.Cells.Item(14, 1).Font.Bold = $true
    
    $sheet5.Cells.Item(15, 1) = "Organic Sessions"
    $sheet5.Cells.Item(15, 2) = 13397
    
    $sheet5.Cells.Item(16, 1) = "Durchschn. PPC CPC"
    $sheet5.Cells.Item(16, 2) = 9.49
    
    $sheet5.Cells.Item(17, 1) = "SEO Wert (gesparte PPC Kosten)"
    $sheet5.Cells.Item(17, 2) = 127138
    $sheet5.Range("A17:B17").Font.Bold = $true
    
    $sheet5.Columns.Item(1).ColumnWidth = 25
    for ($c = 2; $c -le 6; $c++) { $sheet5.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 6: KPIs ============
    $sheet6 = $workbook.Sheets.Add()
    $sheet6.Name = "KPIs"
    
    $sheet6.Cells.Item(1, 1) = "MARKETING KPIs & INSIGHTS"
    $sheet6.Range("A1:E1").Merge()
    $sheet6.Cells.Item(1, 1).Font.Size = 16
    $sheet6.Cells.Item(1, 1).Font.Bold = $true
    
    # Kosten pro Session
    $sheet6.Cells.Item(3, 1) = "KOSTEN PRO SESSION"
    $sheet6.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet6.Cells.Item(4, 1) = "Marke"
    $sheet6.Cells.Item(4, 2) = "Werbekosten"
    $sheet6.Cells.Item(4, 3) = "Sessions"
    $sheet6.Cells.Item(4, 4) = "EUR/Session"
    $sheet6.Range("A4:D4").Font.Bold = $true
    
    $sheet6.Cells.Item(5, 1) = "NetCo Gesamt"
    $sheet6.Cells.Item(5, 2) = 679524
    $sheet6.Cells.Item(5, 3) = 107875
    $sheet6.Cells.Item(5, 4) = 6.30
    
    $sheet6.Cells.Item(6, 1) = "Microvista"
    $sheet6.Cells.Item(6, 2) = 103505
    $sheet6.Cells.Item(6, 3) = 10819
    $sheet6.Cells.Item(6, 4) = 9.57
    
    # Google Ads Performance
    $sheet6.Cells.Item(8, 1) = "GOOGLE ADS PERFORMANCE NACH MARKE"
    $sheet6.Cells.Item(8, 1).Font.Bold = $true
    
    $sheet6.Cells.Item(9, 1) = "Marke"
    $sheet6.Cells.Item(9, 2) = "Kosten"
    $sheet6.Cells.Item(9, 3) = "Clicks"
    $sheet6.Cells.Item(9, 4) = "CPC"
    $sheet6.Cells.Item(9, 5) = "Conv."
    $sheet6.Cells.Item(9, 6) = "Cost/Conv."
    $sheet6.Range("A9:F9").Font.Bold = $true
    
    $sheet6.Cells.Item(10, 1) = "BauTV+"
    $sheet6.Cells.Item(10, 2) = 362943
    $sheet6.Cells.Item(10, 3) = 320900
    $sheet6.Cells.Item(10, 4) = 1.13
    $sheet6.Cells.Item(10, 5) = 1231
    $sheet6.Cells.Item(10, 6) = 295
    
    $sheet6.Cells.Item(11, 1) = "Bodycam"
    $sheet6.Cells.Item(11, 2) = 73696
    $sheet6.Cells.Item(11, 3) = 95762
    $sheet6.Cells.Item(11, 4) = 0.77
    $sheet6.Cells.Item(11, 5) = 445
    $sheet6.Cells.Item(11, 6) = 166
    
    $sheet6.Cells.Item(12, 1) = "Microvista"
    $sheet6.Cells.Item(12, 2) = 65087
    $sheet6.Cells.Item(12, 3) = 49167
    $sheet6.Cells.Item(12, 4) = 1.32
    $sheet6.Cells.Item(12, 5) = 128
    $sheet6.Cells.Item(12, 6) = 508
    
    # Kampagnentyp Performance
    $sheet6.Cells.Item(14, 1) = "KAMPAGNENTYP PERFORMANCE"
    $sheet6.Cells.Item(14, 1).Font.Bold = $true
    
    $sheet6.Cells.Item(15, 1) = "Typ"
    $sheet6.Cells.Item(15, 2) = "Kosten"
    $sheet6.Cells.Item(15, 3) = "Clicks"
    $sheet6.Cells.Item(15, 4) = "Conv."
    $sheet6.Cells.Item(15, 5) = "Cost/Conv."
    $sheet6.Range("A15:E15").Font.Bold = $true
    
    $sheet6.Cells.Item(16, 1) = "Search"
    $sheet6.Cells.Item(16, 2) = 370076
    $sheet6.Cells.Item(16, 3) = 91998
    $sheet6.Cells.Item(16, 4) = 937
    $sheet6.Cells.Item(16, 5) = 395
    
    $sheet6.Cells.Item(17, 1) = "Performance Max"
    $sheet6.Cells.Item(17, 2) = 131881
    $sheet6.Cells.Item(17, 3) = 360690
    $sheet6.Cells.Item(17, 4) = 895
    $sheet6.Cells.Item(17, 5) = 147
    
    $sheet6.Cells.Item(18, 1) = "Display"
    $sheet6.Cells.Item(18, 2) = 4507
    $sheet6.Cells.Item(18, 3) = 4482
    $sheet6.Cells.Item(18, 4) = 0
    $sheet6.Cells.Item(18, 5) = "-"
    
    $sheet6.Cells.Item(19, 1) = "Video"
    $sheet6.Cells.Item(19, 2) = 3336
    $sheet6.Cells.Item(19, 3) = 12072
    $sheet6.Cells.Item(19, 4) = 1
    $sheet6.Cells.Item(19, 5) = 3336
    
    # Key Insights
    $sheet6.Cells.Item(21, 1) = "KEY INSIGHTS"
    $sheet6.Cells.Item(21, 1).Font.Bold = $true
    $sheet6.Cells.Item(21, 1).Font.Size = 14
    
    $sheet6.Cells.Item(22, 1) = "1. BauTV+ dominiert mit 71% des Google Ads Budgets"
    $sheet6.Cells.Item(23, 1) = "2. Bodycam hat den besten CPC (0.77 EUR) und Cost/Conv (166 EUR)"
    $sheet6.Cells.Item(24, 1) = "3. Performance Max liefert guenstigste Conversions (147 EUR)"
    $sheet6.Cells.Item(25, 1) = "4. Expansion (NL+IT) bereits 19.3% des Budgets"
    $sheet6.Cells.Item(26, 1) = "5. SEO generiert 127k EUR Wert (gesparte PPC Kosten)"
    $sheet6.Cells.Item(27, 1) = "6. Newsletter hat hoechste Engagement Rate (72%)"
    
    $sheet6.Columns.Item(1).ColumnWidth = 50
    for ($c = 2; $c -le 6; $c++) { $sheet6.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 7: EXPANSION ============
    $sheet7 = $workbook.Sheets.Add()
    $sheet7.Name = "Expansion"
    
    $sheet7.Cells.Item(1, 1) = "INTERNATIONALE EXPANSION"
    $sheet7.Range("A1:E1").Merge()
    $sheet7.Cells.Item(1, 1).Font.Size = 16
    $sheet7.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet7.Cells.Item(3, 1) = "GOOGLE ADS NACH LAND"
    $sheet7.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet7.Cells.Item(4, 1) = "Land"
    $sheet7.Cells.Item(4, 2) = "Kosten"
    $sheet7.Cells.Item(4, 3) = "Clicks"
    $sheet7.Cells.Item(4, 4) = "Anteil"
    $sheet7.Cells.Item(4, 5) = "CPC"
    $sheet7.Range("A4:E4").Font.Bold = $true
    
    $sheet7.Cells.Item(5, 1) = "Deutschland (D)"
    $sheet7.Cells.Item(5, 2) = 333047
    $sheet7.Cells.Item(5, 3) = 195012
    $sheet7.Cells.Item(5, 4) = "65.3%"
    $sheet7.Cells.Item(5, 5) = 1.71
    
    $sheet7.Cells.Item(6, 1) = "Niederlande (NL)"
    $sheet7.Cells.Item(6, 2) = 88524
    $sheet7.Cells.Item(6, 3) = 183687
    $sheet7.Cells.Item(6, 4) = "17.4%"
    $sheet7.Cells.Item(6, 5) = 0.48
    
    $sheet7.Cells.Item(7, 1) = "Italien (IT)"
    $sheet7.Cells.Item(7, 2) = 9867
    $sheet7.Cells.Item(7, 3) = 37539
    $sheet7.Cells.Item(7, 4) = "1.9%"
    $sheet7.Cells.Item(7, 5) = 0.26
    
    $sheet7.Cells.Item(8, 1) = "EU (sonstige)"
    $sheet7.Cells.Item(8, 2) = 7133
    $sheet7.Cells.Item(8, 3) = 3752
    $sheet7.Cells.Item(8, 4) = "1.4%"
    $sheet7.Cells.Item(8, 5) = 1.90
    
    $sheet7.Cells.Item(9, 1) = "Oesterreich (AT)"
    $sheet7.Cells.Item(9, 2) = 2750
    $sheet7.Cells.Item(9, 3) = 628
    $sheet7.Cells.Item(9, 4) = "0.5%"
    $sheet7.Cells.Item(9, 5) = 4.38
    
    $sheet7.Cells.Item(10, 1) = "Nicht zugeordnet"
    $sheet7.Cells.Item(10, 2) = 68479
    $sheet7.Cells.Item(10, 3) = 48624
    $sheet7.Cells.Item(10, 4) = "13.4%"
    $sheet7.Cells.Item(10, 5) = 1.41
    
    $sheet7.Cells.Item(12, 1) = "EXPANSION ZUSAMMENFASSUNG"
    $sheet7.Cells.Item(12, 1).Font.Bold = $true
    
    $sheet7.Cells.Item(13, 1) = "Niederlande + Italien"
    $sheet7.Cells.Item(13, 2) = 98391
    $sheet7.Cells.Item(13, 4) = "19.3%"
    $sheet7.Range("A13:E13").Font.Bold = $true
    
    $sheet7.Cells.Item(15, 1) = "HINWEIS: NL und IT zeigen sehr guenstige CPCs (0.26-0.48 EUR)"
    $sheet7.Cells.Item(16, 1) = "Expansion scheint kosteneffizient zu sein!"
    
    $sheet7.Columns.Item(1).ColumnWidth = 25
    for ($c = 2; $c -le 5; $c++) { $sheet7.Columns.Item($c).ColumnWidth = 15 }
    
    # Save
    $workbook.SaveAs($outputPath)
    $workbook.Close($true)
    
    Write-Host "====================================="
    Write-Host "Kompletter Marketingplan erstellt!"
    Write-Host "Datei: $outputPath"
    Write-Host ""
    Write-Host "7 Sheets:"
    Write-Host "  1. Executive Summary"
    Write-Host "  2. BauTV+ Detail"
    Write-Host "  3. Bodycam Detail"
    Write-Host "  4. Microvista Detail"
    Write-Host "  5. Traffic Analyse"
    Write-Host "  6. KPIs & Insights"
    Write-Host "  7. Expansion (International)"
    Write-Host "====================================="
    
} catch {
    Write-Host "ERROR:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
