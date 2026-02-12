
$basePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten"
$outputPath = "$basePath\Marketingplan_2026.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Add()
    
    # ============ SHEET 1: UEBERSICHT 2026 ============
    $sheet1 = $workbook.Sheets.Item(1)
    $sheet1.Name = "Uebersicht 2026"
    
    $sheet1.Cells.Item(1, 1) = "MARKETINGPLAN 2026"
    $sheet1.Range("A1:O1").Merge()
    $sheet1.Cells.Item(1, 1).Font.Size = 20
    $sheet1.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet1.Cells.Item(2, 1) = "NetCo GmbH (Bodycam, BauTV+) & Microvista GmbH"
    $sheet1.Cells.Item(3, 1) = "Basierend auf Analyse 2023-2025 | Erstellt: Februar 2026"
    
    # Basis-Annahmen
    $sheet1.Cells.Item(5, 1) = "BASIS-ANNAHMEN FUER 2026"
    $sheet1.Cells.Item(5, 1).Font.Bold = $true
    $sheet1.Cells.Item(5, 1).Font.Size = 12
    
    $sheet1.Cells.Item(6, 1) = "Durchschnitt Werbekosten 2023-2025:"
    $sheet1.Cells.Item(6, 2) = 261010
    $sheet1.Cells.Item(6, 3) = "EUR/Jahr"
    
    $sheet1.Cells.Item(7, 1) = "Trend 2024->2025:"
    $sheet1.Cells.Item(7, 2) = "+31%"
    
    $sheet1.Cells.Item(8, 1) = "Geplantes Budget 2026 (+15% vs 2025):"
    $sheet1.Cells.Item(8, 2) = 362049
    $sheet1.Cells.Item(8, 3) = "EUR"
    $sheet1.Range("A8:C8").Font.Bold = $true
    
    # Headers fuer Jahresplan
    $sheet1.Cells.Item(10, 1) = "JAHRESBUDGET 2026 NACH KATEGORIE"
    $sheet1.Cells.Item(10, 1).Font.Bold = $true
    $sheet1.Cells.Item(10, 1).Font.Size = 14
    
    $sheet1.Cells.Item(11, 1) = "Marketing Massnahmen"
    $sheet1.Cells.Item(11, 2) = "Jan"
    $sheet1.Cells.Item(11, 3) = "Feb"
    $sheet1.Cells.Item(11, 4) = "Mar"
    $sheet1.Cells.Item(11, 5) = "Apr"
    $sheet1.Cells.Item(11, 6) = "Mai"
    $sheet1.Cells.Item(11, 7) = "Jun"
    $sheet1.Cells.Item(11, 8) = "Jul"
    $sheet1.Cells.Item(11, 9) = "Aug"
    $sheet1.Cells.Item(11, 10) = "Sep"
    $sheet1.Cells.Item(11, 11) = "Okt"
    $sheet1.Cells.Item(11, 12) = "Nov"
    $sheet1.Cells.Item(11, 13) = "Dez"
    $sheet1.Cells.Item(11, 14) = "GESAMT"
    $sheet1.Cells.Item(11, 15) = "Anteil"
    $sheet1.Range("A11:O11").Font.Bold = $true
    
    # SEO - Offpage (konstant, wichtig fuer organischen Traffic)
    $sheet1.Cells.Item(12, 1) = "SEO - Offpage"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(12, $m) = 500 }
    $sheet1.Cells.Item(12, 14) = 6000
    $sheet1.Cells.Item(12, 15) = "1.7%"
    
    # Content+SEO (Content-Erstellung mit SEO-Fokus)
    $sheet1.Cells.Item(13, 1) = "Content+SEO"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(13, $m) = 800 }
    $sheet1.Cells.Item(13, 14) = 9600
    $sheet1.Cells.Item(13, 15) = "2.7%"
    
    # Content Marketing (PR, Pressebox, etc.)
    $sheet1.Cells.Item(14, 1) = "Content Marketing"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(14, $m) = 400 }
    $sheet1.Cells.Item(14, 14) = 4800
    $sheet1.Cells.Item(14, 15) = "1.3%"
    
    # Pay-Per-Click Marketing (Hauptbudget - Google + Bing)
    $sheet1.Cells.Item(15, 1) = "Pay-Per-Click Marketing"
    $sheet1.Cells.Item(15, 2) = 22000
    $sheet1.Cells.Item(15, 3) = 22000
    $sheet1.Cells.Item(15, 4) = 24000
    $sheet1.Cells.Item(15, 5) = 23000
    $sheet1.Cells.Item(15, 6) = 23000
    $sheet1.Cells.Item(15, 7) = 25000
    $sheet1.Cells.Item(15, 8) = 24000
    $sheet1.Cells.Item(15, 9) = 24000
    $sheet1.Cells.Item(15, 10) = 26000
    $sheet1.Cells.Item(15, 11) = 28000
    $sheet1.Cells.Item(15, 12) = 26000
    $sheet1.Cells.Item(15, 13) = 23000
    $sheet1.Cells.Item(15, 14) = 290000
    $sheet1.Cells.Item(15, 15) = "80.1%"
    
    # Display Advertising (reduziert - schlechte Performance)
    $sheet1.Cells.Item(16, 1) = "Display Advertising"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(16, $m) = 200 }
    $sheet1.Cells.Item(16, 14) = 2400
    $sheet1.Cells.Item(16, 15) = "0.7%"
    
    # Retargeting (neu aufbauen)
    $sheet1.Cells.Item(17, 1) = "Retargeting"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(17, $m) = 500 }
    $sheet1.Cells.Item(17, 14) = 6000
    $sheet1.Cells.Item(17, 15) = "1.7%"
    
    # Social Media (LinkedIn fokussiert)
    $sheet1.Cells.Item(18, 1) = "Social Media"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(18, $m) = 600 }
    $sheet1.Cells.Item(18, 14) = 7200
    $sheet1.Cells.Item(18, 15) = "2.0%"
    
    # Newsletter (beste Engagement Rate - ausbauen)
    $sheet1.Cells.Item(19, 1) = "Newsletter"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(19, $m) = 300 }
    $sheet1.Cells.Item(19, 14) = 3600
    $sheet1.Cells.Item(19, 15) = "1.0%"
    
    # TypeIn (Brand Awareness)
    $sheet1.Cells.Item(20, 1) = "TypeIn"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(20, $m) = 0 }
    $sheet1.Cells.Item(20, 14) = 0
    $sheet1.Cells.Item(20, 15) = "0%"
    
    # Investment / Consulting
    $sheet1.Cells.Item(21, 1) = "Investment / Consulting"
    $sheet1.Cells.Item(21, 2) = 2000
    $sheet1.Cells.Item(21, 3) = 1000
    $sheet1.Cells.Item(21, 4) = 1000
    $sheet1.Cells.Item(21, 5) = 1000
    $sheet1.Cells.Item(21, 6) = 1000
    $sheet1.Cells.Item(21, 7) = 2000
    $sheet1.Cells.Item(21, 8) = 1000
    $sheet1.Cells.Item(21, 9) = 1000
    $sheet1.Cells.Item(21, 10) = 1000
    $sheet1.Cells.Item(21, 11) = 1000
    $sheet1.Cells.Item(21, 12) = 2000
    $sheet1.Cells.Item(21, 13) = 1000
    $sheet1.Cells.Item(21, 14) = 15000
    $sheet1.Cells.Item(21, 15) = "4.1%"
    
    # Web Development
    $sheet1.Cells.Item(22, 1) = "Web Development"
    $sheet1.Cells.Item(22, 2) = 1500
    $sheet1.Cells.Item(22, 3) = 1000
    $sheet1.Cells.Item(22, 4) = 1500
    $sheet1.Cells.Item(22, 5) = 1000
    $sheet1.Cells.Item(22, 6) = 1500
    $sheet1.Cells.Item(22, 7) = 1000
    $sheet1.Cells.Item(22, 8) = 1500
    $sheet1.Cells.Item(22, 9) = 1000
    $sheet1.Cells.Item(22, 10) = 1500
    $sheet1.Cells.Item(22, 11) = 1000
    $sheet1.Cells.Item(22, 12) = 1500
    $sheet1.Cells.Item(22, 13) = 1000
    $sheet1.Cells.Item(22, 14) = 15000
    $sheet1.Cells.Item(22, 15) = "4.1%"
    
    # Umsetzung (Agentur/Freelancer)
    $sheet1.Cells.Item(23, 1) = "Umsetzung"
    for ($m = 2; $m -le 13; $m++) { $sheet1.Cells.Item(23, $m) = 204 }
    $sheet1.Cells.Item(23, 14) = 2449
    $sheet1.Cells.Item(23, 15) = "0.7%"
    
    # TOTAL
    $sheet1.Cells.Item(24, 1) = "GESAMT 2026"
    $sheet1.Cells.Item(24, 2) = 29004
    $sheet1.Cells.Item(24, 3) = 27704
    $sheet1.Cells.Item(24, 4) = 29704
    $sheet1.Cells.Item(24, 5) = 28204
    $sheet1.Cells.Item(24, 6) = 28704
    $sheet1.Cells.Item(24, 7) = 30704
    $sheet1.Cells.Item(24, 8) = 29204
    $sheet1.Cells.Item(24, 9) = 29204
    $sheet1.Cells.Item(24, 10) = 31204
    $sheet1.Cells.Item(24, 11) = 33204
    $sheet1.Cells.Item(24, 12) = 32204
    $sheet1.Cells.Item(24, 13) = 27904
    $sheet1.Cells.Item(24, 14) = 362049
    $sheet1.Cells.Item(24, 15) = "100%"
    $sheet1.Range("A24:O24").Font.Bold = $true
    
    $sheet1.Columns.Item(1).ColumnWidth = 25
    for ($c = 2; $c -le 15; $c++) { $sheet1.Columns.Item($c).ColumnWidth = 10 }
    
    # ============ SHEET 2: PPC NACH MARKE ============
    $sheet2 = $workbook.Sheets.Add()
    $sheet2.Name = "PPC nach Marke"
    
    $sheet2.Cells.Item(1, 1) = "PAY-PER-CLICK BUDGET 2026 NACH MARKE"
    $sheet2.Range("A1:O1").Merge()
    $sheet2.Cells.Item(1, 1).Font.Size = 16
    $sheet2.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet2.Cells.Item(3, 1) = "Basierend auf 2023-2025 Verteilung und Effizienz-Optimierung"
    
    # Headers
    $sheet2.Cells.Item(5, 1) = "Marke"
    $sheet2.Cells.Item(5, 2) = "Jan"
    $sheet2.Cells.Item(5, 3) = "Feb"
    $sheet2.Cells.Item(5, 4) = "Mar"
    $sheet2.Cells.Item(5, 5) = "Apr"
    $sheet2.Cells.Item(5, 6) = "Mai"
    $sheet2.Cells.Item(5, 7) = "Jun"
    $sheet2.Cells.Item(5, 8) = "Jul"
    $sheet2.Cells.Item(5, 9) = "Aug"
    $sheet2.Cells.Item(5, 10) = "Sep"
    $sheet2.Cells.Item(5, 11) = "Okt"
    $sheet2.Cells.Item(5, 12) = "Nov"
    $sheet2.Cells.Item(5, 13) = "Dez"
    $sheet2.Cells.Item(5, 14) = "GESAMT"
    $sheet2.Cells.Item(5, 15) = "Anteil"
    $sheet2.Range("A5:O5").Font.Bold = $true
    
    # BauTV+ (65% - leicht reduziert zugunsten Bodycam)
    $sheet2.Cells.Item(6, 1) = "BauTV+ (BK)"
    $sheet2.Cells.Item(6, 2) = 14300
    $sheet2.Cells.Item(6, 3) = 14300
    $sheet2.Cells.Item(6, 4) = 15600
    $sheet2.Cells.Item(6, 5) = 14950
    $sheet2.Cells.Item(6, 6) = 14950
    $sheet2.Cells.Item(6, 7) = 16250
    $sheet2.Cells.Item(6, 8) = 15600
    $sheet2.Cells.Item(6, 9) = 15600
    $sheet2.Cells.Item(6, 10) = 16900
    $sheet2.Cells.Item(6, 11) = 18200
    $sheet2.Cells.Item(6, 12) = 16900
    $sheet2.Cells.Item(6, 13) = 14950
    $sheet2.Cells.Item(6, 14) = 188500
    $sheet2.Cells.Item(6, 15) = "65%"
    
    # Bodycam (20% - erhoeht wegen bester Effizienz)
    $sheet2.Cells.Item(7, 1) = "Bodycam (BC)"
    $sheet2.Cells.Item(7, 2) = 4400
    $sheet2.Cells.Item(7, 3) = 4400
    $sheet2.Cells.Item(7, 4) = 4800
    $sheet2.Cells.Item(7, 5) = 4600
    $sheet2.Cells.Item(7, 6) = 4600
    $sheet2.Cells.Item(7, 7) = 5000
    $sheet2.Cells.Item(7, 8) = 4800
    $sheet2.Cells.Item(7, 9) = 4800
    $sheet2.Cells.Item(7, 10) = 5200
    $sheet2.Cells.Item(7, 11) = 5600
    $sheet2.Cells.Item(7, 12) = 5200
    $sheet2.Cells.Item(7, 13) = 4600
    $sheet2.Cells.Item(7, 14) = 58000
    $sheet2.Cells.Item(7, 15) = "20%"
    
    # Microvista (15% - konstant)
    $sheet2.Cells.Item(8, 1) = "Microvista (NDT)"
    $sheet2.Cells.Item(8, 2) = 3300
    $sheet2.Cells.Item(8, 3) = 3300
    $sheet2.Cells.Item(8, 4) = 3600
    $sheet2.Cells.Item(8, 5) = 3450
    $sheet2.Cells.Item(8, 6) = 3450
    $sheet2.Cells.Item(8, 7) = 3750
    $sheet2.Cells.Item(8, 8) = 3600
    $sheet2.Cells.Item(8, 9) = 3600
    $sheet2.Cells.Item(8, 10) = 3900
    $sheet2.Cells.Item(8, 11) = 4200
    $sheet2.Cells.Item(8, 12) = 3900
    $sheet2.Cells.Item(8, 13) = 3450
    $sheet2.Cells.Item(8, 14) = 43500
    $sheet2.Cells.Item(8, 15) = "15%"
    
    # TOTAL PPC
    $sheet2.Cells.Item(9, 1) = "GESAMT PPC"
    $sheet2.Cells.Item(9, 14) = 290000
    $sheet2.Cells.Item(9, 15) = "100%"
    $sheet2.Range("A9:O9").Font.Bold = $true
    
    # Aufteilung nach Land
    $sheet2.Cells.Item(11, 1) = "PPC NACH LAND"
    $sheet2.Cells.Item(11, 1).Font.Bold = $true
    $sheet2.Cells.Item(11, 1).Font.Size = 14
    
    $sheet2.Cells.Item(12, 1) = "Land"
    $sheet2.Cells.Item(12, 2) = "Budget"
    $sheet2.Cells.Item(12, 3) = "Anteil"
    $sheet2.Cells.Item(12, 4) = "Begruendung"
    $sheet2.Range("A12:D12").Font.Bold = $true
    
    $sheet2.Cells.Item(13, 1) = "Deutschland (D)"
    $sheet2.Cells.Item(13, 2) = 174000
    $sheet2.Cells.Item(13, 3) = "60%"
    $sheet2.Cells.Item(13, 4) = "Kernmarkt, reduziert zugunsten Expansion"
    
    $sheet2.Cells.Item(14, 1) = "Niederlande (NL)"
    $sheet2.Cells.Item(14, 2) = 72500
    $sheet2.Cells.Item(14, 3) = "25%"
    $sheet2.Cells.Item(14, 4) = "Expansion ausbauen - sehr guenstiger CPC"
    
    $sheet2.Cells.Item(15, 1) = "Italien (IT)"
    $sheet2.Cells.Item(15, 2) = 29000
    $sheet2.Cells.Item(15, 3) = "10%"
    $sheet2.Cells.Item(15, 4) = "Expansion fortsetzen - guenstigster CPC"
    
    $sheet2.Cells.Item(16, 1) = "EU/AT/Sonstige"
    $sheet2.Cells.Item(16, 2) = 14500
    $sheet2.Cells.Item(16, 3) = "5%"
    $sheet2.Cells.Item(16, 4) = "Test weitere Maerkte"
    
    $sheet2.Columns.Item(1).ColumnWidth = 25
    $sheet2.Columns.Item(4).ColumnWidth = 45
    for ($c = 2; $c -le 15; $c++) { $sheet2.Columns.Item($c).ColumnWidth = 10 }
    
    # ============ SHEET 3: ZIELE 2026 ============
    $sheet3 = $workbook.Sheets.Add()
    $sheet3.Name = "Ziele 2026"
    
    $sheet3.Cells.Item(1, 1) = "MARKETING ZIELE 2026"
    $sheet3.Range("A1:E1").Merge()
    $sheet3.Cells.Item(1, 1).Font.Size = 16
    $sheet3.Cells.Item(1, 1).Font.Bold = $true
    
    # Traffic Ziele
    $sheet3.Cells.Item(3, 1) = "TRAFFIC ZIELE"
    $sheet3.Cells.Item(3, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(4, 1) = "Kennzahl"
    $sheet3.Cells.Item(4, 2) = "IST 2025"
    $sheet3.Cells.Item(4, 3) = "ZIEL 2026"
    $sheet3.Cells.Item(4, 4) = "Wachstum"
    $sheet3.Range("A4:D4").Font.Bold = $true
    
    $sheet3.Cells.Item(5, 1) = "Website Sessions (gesamt)"
    $sheet3.Cells.Item(5, 2) = 45000
    $sheet3.Cells.Item(5, 3) = 55000
    $sheet3.Cells.Item(5, 4) = "+22%"
    
    $sheet3.Cells.Item(6, 1) = "Paid Sessions"
    $sheet3.Cells.Item(6, 2) = 24000
    $sheet3.Cells.Item(6, 3) = 32000
    $sheet3.Cells.Item(6, 4) = "+33%"
    
    $sheet3.Cells.Item(7, 1) = "Organic Sessions (SEO)"
    $sheet3.Cells.Item(7, 2) = 5000
    $sheet3.Cells.Item(7, 3) = 6500
    $sheet3.Cells.Item(7, 4) = "+30%"
    
    # Conversion Ziele
    $sheet3.Cells.Item(9, 1) = "CONVERSION ZIELE"
    $sheet3.Cells.Item(9, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(10, 1) = "Kennzahl"
    $sheet3.Cells.Item(10, 2) = "IST 2025"
    $sheet3.Cells.Item(10, 3) = "ZIEL 2026"
    $sheet3.Cells.Item(10, 4) = "Verbesserung"
    $sheet3.Range("A10:D10").Font.Bold = $true
    
    $sheet3.Cells.Item(11, 1) = "Google Ads Conversions"
    $sheet3.Cells.Item(11, 2) = 700
    $sheet3.Cells.Item(11, 3) = 950
    $sheet3.Cells.Item(11, 4) = "+36%"
    
    $sheet3.Cells.Item(12, 1) = "Cost per Conversion (EUR)"
    $sheet3.Cells.Item(12, 2) = 360
    $sheet3.Cells.Item(12, 3) = 305
    $sheet3.Cells.Item(12, 4) = "-15%"
    
    $sheet3.Cells.Item(13, 1) = "CPC gesamt (EUR)"
    $sheet3.Cells.Item(13, 2) = 1.09
    $sheet3.Cells.Item(13, 3) = 0.95
    $sheet3.Cells.Item(13, 4) = "-13%"
    
    # Expansion Ziele
    $sheet3.Cells.Item(15, 1) = "EXPANSION ZIELE"
    $sheet3.Cells.Item(15, 1).Font.Bold = $true
    
    $sheet3.Cells.Item(16, 1) = "Markt"
    $sheet3.Cells.Item(16, 2) = "IST 2025"
    $sheet3.Cells.Item(16, 3) = "ZIEL 2026"
    $sheet3.Cells.Item(16, 4) = "Strategie"
    $sheet3.Range("A16:D16").Font.Bold = $true
    
    $sheet3.Cells.Item(17, 1) = "Niederlande Anteil"
    $sheet3.Cells.Item(17, 2) = "17%"
    $sheet3.Cells.Item(17, 3) = "25%"
    $sheet3.Cells.Item(17, 4) = "Aggressive Expansion"
    
    $sheet3.Cells.Item(18, 1) = "Italien Anteil"
    $sheet3.Cells.Item(18, 2) = "2%"
    $sheet3.Cells.Item(18, 3) = "10%"
    $sheet3.Cells.Item(18, 4) = "Markt aufbauen"
    
    $sheet3.Cells.Item(19, 1) = "Deutschland Anteil"
    $sheet3.Cells.Item(19, 2) = "65%"
    $sheet3.Cells.Item(19, 3) = "60%"
    $sheet3.Cells.Item(19, 4) = "Effizienz optimieren"
    
    $sheet3.Columns.Item(1).ColumnWidth = 30
    $sheet3.Columns.Item(4).ColumnWidth = 25
    for ($c = 2; $c -le 3; $c++) { $sheet3.Columns.Item($c).ColumnWidth = 15 }
    
    # ============ SHEET 4: MASSNAHMEN ============
    $sheet4 = $workbook.Sheets.Add()
    $sheet4.Name = "Massnahmen"
    
    $sheet4.Cells.Item(1, 1) = "GEPLANTE MASSNAHMEN 2026"
    $sheet4.Range("A1:E1").Merge()
    $sheet4.Cells.Item(1, 1).Font.Size = 16
    $sheet4.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet4.Cells.Item(3, 1) = "Massnahme"
    $sheet4.Cells.Item(3, 2) = "Kategorie"
    $sheet4.Cells.Item(3, 3) = "Budget"
    $sheet4.Cells.Item(3, 4) = "Timing"
    $sheet4.Cells.Item(3, 5) = "Erwarteter Impact"
    $sheet4.Range("A3:E3").Font.Bold = $true
    
    $sheet4.Cells.Item(4, 1) = "Performance Max Ausbau"
    $sheet4.Cells.Item(4, 2) = "PPC"
    $sheet4.Cells.Item(4, 3) = 130000
    $sheet4.Cells.Item(4, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(4, 5) = "Guenstigere Conversions (147 EUR)"
    
    $sheet4.Cells.Item(5, 1) = "Bodycam Budget erhoehen"
    $sheet4.Cells.Item(5, 2) = "PPC"
    $sheet4.Cells.Item(5, 3) = 58000
    $sheet4.Cells.Item(5, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(5, 5) = "Beste Effizienz (CPC 0.77)"
    
    $sheet4.Cells.Item(6, 1) = "NL Expansion"
    $sheet4.Cells.Item(6, 2) = "PPC"
    $sheet4.Cells.Item(6, 3) = 72500
    $sheet4.Cells.Item(6, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(6, 5) = "Guenstiger CPC (0.48)"
    
    $sheet4.Cells.Item(7, 1) = "IT Marktaufbau"
    $sheet4.Cells.Item(7, 2) = "PPC"
    $sheet4.Cells.Item(7, 3) = 29000
    $sheet4.Cells.Item(7, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(7, 5) = "Guenstigster CPC (0.26)"
    
    $sheet4.Cells.Item(8, 1) = "SEO Content-Strategie"
    $sheet4.Cells.Item(8, 2) = "Content+SEO"
    $sheet4.Cells.Item(8, 3) = 9600
    $sheet4.Cells.Item(8, 4) = "Q1-Q4"
    $sheet4.Cells.Item(8, 5) = "+30% Organic Traffic"
    
    $sheet4.Cells.Item(9, 1) = "LinkedIn B2B Fokus"
    $sheet4.Cells.Item(9, 2) = "Social Media"
    $sheet4.Cells.Item(9, 3) = 7200
    $sheet4.Cells.Item(9, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(9, 5) = "B2B Lead Generation"
    
    $sheet4.Cells.Item(10, 1) = "Newsletter Ausbau"
    $sheet4.Cells.Item(10, 2) = "Newsletter"
    $sheet4.Cells.Item(10, 3) = 3600
    $sheet4.Cells.Item(10, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(10, 5) = "Beste Engagement (72%)"
    
    $sheet4.Cells.Item(11, 1) = "Retargeting Setup"
    $sheet4.Cells.Item(11, 2) = "Retargeting"
    $sheet4.Cells.Item(11, 3) = 6000
    $sheet4.Cells.Item(11, 4) = "Q1 Start"
    $sheet4.Cells.Item(11, 5) = "Conversion Rate erhoehen"
    
    $sheet4.Cells.Item(12, 1) = "Display reduzieren"
    $sheet4.Cells.Item(12, 2) = "Display"
    $sheet4.Cells.Item(12, 3) = 2400
    $sheet4.Cells.Item(12, 4) = "Ganzjaehrig"
    $sheet4.Cells.Item(12, 5) = "Nur Brand Awareness"
    
    $sheet4.Cells.Item(13, 1) = "Website Optimierung"
    $sheet4.Cells.Item(13, 2) = "Web Development"
    $sheet4.Cells.Item(13, 3) = 15000
    $sheet4.Cells.Item(13, 4) = "Q1-Q2"
    $sheet4.Cells.Item(13, 5) = "Conversion Rate +10%"
    
    $sheet4.Columns.Item(1).ColumnWidth = 30
    $sheet4.Columns.Item(2).ColumnWidth = 15
    $sheet4.Columns.Item(3).ColumnWidth = 12
    $sheet4.Columns.Item(4).ColumnWidth = 15
    $sheet4.Columns.Item(5).ColumnWidth = 35
    
    # ============ SHEET 5: Q1 DETAIL ============
    $sheet5 = $workbook.Sheets.Add()
    $sheet5.Name = "Q1 Detail"
    
    $sheet5.Cells.Item(1, 1) = "Q1 2026 - DETAILPLANUNG (Januar - Maerz)"
    $sheet5.Range("A1:E1").Merge()
    $sheet5.Cells.Item(1, 1).Font.Size = 16
    $sheet5.Cells.Item(1, 1).Font.Bold = $true
    
    $sheet5.Cells.Item(3, 1) = "Massnahme"
    $sheet5.Cells.Item(3, 2) = "Jan"
    $sheet5.Cells.Item(3, 3) = "Feb"
    $sheet5.Cells.Item(3, 4) = "Mar"
    $sheet5.Cells.Item(3, 5) = "Q1 Total"
    $sheet5.Range("A3:E3").Font.Bold = $true
    
    $sheet5.Cells.Item(4, 1) = "SEO - Offpage"
    $sheet5.Cells.Item(4, 2) = 500
    $sheet5.Cells.Item(4, 3) = 500
    $sheet5.Cells.Item(4, 4) = 500
    $sheet5.Cells.Item(4, 5) = 1500
    
    $sheet5.Cells.Item(5, 1) = "Content+SEO"
    $sheet5.Cells.Item(5, 2) = 800
    $sheet5.Cells.Item(5, 3) = 800
    $sheet5.Cells.Item(5, 4) = 800
    $sheet5.Cells.Item(5, 5) = 2400
    
    $sheet5.Cells.Item(6, 1) = "Content Marketing"
    $sheet5.Cells.Item(6, 2) = 400
    $sheet5.Cells.Item(6, 3) = 400
    $sheet5.Cells.Item(6, 4) = 400
    $sheet5.Cells.Item(6, 5) = 1200
    
    $sheet5.Cells.Item(7, 1) = "Pay-Per-Click Marketing"
    $sheet5.Cells.Item(7, 2) = 22000
    $sheet5.Cells.Item(7, 3) = 22000
    $sheet5.Cells.Item(7, 4) = 24000
    $sheet5.Cells.Item(7, 5) = 68000
    
    $sheet5.Cells.Item(8, 1) = "Display Advertising"
    $sheet5.Cells.Item(8, 2) = 200
    $sheet5.Cells.Item(8, 3) = 200
    $sheet5.Cells.Item(8, 4) = 200
    $sheet5.Cells.Item(8, 5) = 600
    
    $sheet5.Cells.Item(9, 1) = "Retargeting"
    $sheet5.Cells.Item(9, 2) = 500
    $sheet5.Cells.Item(9, 3) = 500
    $sheet5.Cells.Item(9, 4) = 500
    $sheet5.Cells.Item(9, 5) = 1500
    
    $sheet5.Cells.Item(10, 1) = "Social Media"
    $sheet5.Cells.Item(10, 2) = 600
    $sheet5.Cells.Item(10, 3) = 600
    $sheet5.Cells.Item(10, 4) = 600
    $sheet5.Cells.Item(10, 5) = 1800
    
    $sheet5.Cells.Item(11, 1) = "Newsletter"
    $sheet5.Cells.Item(11, 2) = 300
    $sheet5.Cells.Item(11, 3) = 300
    $sheet5.Cells.Item(11, 4) = 300
    $sheet5.Cells.Item(11, 5) = 900
    
    $sheet5.Cells.Item(12, 1) = "Investment / Consulting"
    $sheet5.Cells.Item(12, 2) = 2000
    $sheet5.Cells.Item(12, 3) = 1000
    $sheet5.Cells.Item(12, 4) = 1000
    $sheet5.Cells.Item(12, 5) = 4000
    
    $sheet5.Cells.Item(13, 1) = "Web Development"
    $sheet5.Cells.Item(13, 2) = 1500
    $sheet5.Cells.Item(13, 3) = 1000
    $sheet5.Cells.Item(13, 4) = 1500
    $sheet5.Cells.Item(13, 5) = 4000
    
    $sheet5.Cells.Item(14, 1) = "Umsetzung"
    $sheet5.Cells.Item(14, 2) = 204
    $sheet5.Cells.Item(14, 3) = 204
    $sheet5.Cells.Item(14, 4) = 204
    $sheet5.Cells.Item(14, 5) = 612
    
    $sheet5.Cells.Item(15, 1) = "GESAMT Q1"
    $sheet5.Cells.Item(15, 2) = 29004
    $sheet5.Cells.Item(15, 3) = 27504
    $sheet5.Cells.Item(15, 4) = 30004
    $sheet5.Cells.Item(15, 5) = 86512
    $sheet5.Range("A15:E15").Font.Bold = $true
    
    $sheet5.Columns.Item(1).ColumnWidth = 25
    for ($c = 2; $c -le 5; $c++) { $sheet5.Columns.Item($c).ColumnWidth = 12 }
    
    # Save
    $workbook.SaveAs($outputPath)
    $workbook.Close($true)
    
    Write-Host "====================================="
    Write-Host "Marketingplan 2026 erstellt!"
    Write-Host "Datei: $outputPath"
    Write-Host ""
    Write-Host "5 Sheets:"
    Write-Host "  1. Uebersicht 2026 - Jahresbudget"
    Write-Host "  2. PPC nach Marke - Verteilung"
    Write-Host "  3. Ziele 2026 - KPIs"
    Write-Host "  4. Massnahmen - Aktionsplan"
    Write-Host "  5. Q1 Detail - Startplanung"
    Write-Host ""
    Write-Host "Gesamtbudget 2026: 362.049 EUR"
    Write-Host "====================================="
    
} catch {
    Write-Host "ERROR:" $_.Exception.Message
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
