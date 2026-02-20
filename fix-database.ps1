# Script PowerShell pour corriger les migrations de base de données
# Execute this script to add missing ecg_files and ett_files columns

Write-Host "=== CardioMetPC - Database Migration Fix ===" -ForegroundColor Cyan
Write-Host ""

# MySQL connection parameters
$mysqlUser = "root"
$mysqlPassword = "51405492fS@"
$mysqlDatabase = "cardio_ebogo"
$mysqlHost = "localhost"

# Common MySQL installation paths
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe",
    "mysql.exe"  # If in PATH
)

# Find MySQL executable
$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $mysqlExe = $path
        Write-Host "✓ Found MySQL at: $path" -ForegroundColor Green
        break
    }
    # Try as command
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $mysqlExe = $path
        Write-Host "✓ Found MySQL in PATH" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "✗ MySQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MySQL or run the SQL script manually:" -ForegroundColor Yellow
    Write-Host "  1. Open phpMyAdmin or MySQL Workbench" -ForegroundColor Yellow
    Write-Host "  2. Select database 'cardio_ebogo'" -ForegroundColor Yellow
    Write-Host "  3. Execute the content of 'fix_migration.sql'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to open the guide..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "MIGRATION_FIX_GUIDE.md"
    exit 1
}

Write-Host ""
Write-Host "Applying database fix..." -ForegroundColor Cyan

# Execute SQL script
$scriptPath = Join-Path $PSScriptRoot "fix_migration.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Host "✗ SQL script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

try {
    $env:MYSQL_PWD = $mysqlPassword
    Get-Content $scriptPath | & $mysqlExe -u $mysqlUser -h $mysqlHost $mysqlDatabase
    $env:MYSQL_PWD = $null
    
    Write-Host ""
    Write-Host "✓ Database fix applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Restart the application" -ForegroundColor White
    Write-Host "  2. Test file upload in consultation page" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "✗ Error applying fix: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL script manually using phpMyAdmin or MySQL Workbench" -ForegroundColor Yellow
    exit 1
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
