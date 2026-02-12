$filePath = "C:\Users\karent\Documents\Software\netcodashboard\docs\Werbekosten\Marketingplan.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    Write-Host "Opening file..."
    $workbook = $excel.Workbooks.Open($filePath)
    
    Write-Host "=== SHEETS ==="
    $sheetCount = $workbook.Sheets.Count
    Write-Host "Number of sheets: $sheetCount"
    
    for ($s = 1; $s -le $sheetCount; $s++) {
        $ws = $workbook.Sheets.Item($s)
        Write-Host "Sheet $s : $($ws.Name)"
    }
    
    Write-Host ""
    Write-Host "=== BUDGET SHEET (Sheet 1) ==="
    $budgetSheet = $workbook.Sheets.Item(1)
    
    for ($r = 1; $r -le 45; $r++) {
        $rowContent = ""
        for ($c = 1; $c -le 20; $c++) {
            $val = $budgetSheet.Cells.Item($r, $c).Text
            if ($val -ne "") {
                $rowContent += "[$c]:$val | "
            }
        }
        if ($rowContent -ne "") {
            Write-Host "R$r : $rowContent"
        }
    }
    
    $workbook.Close($false)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
