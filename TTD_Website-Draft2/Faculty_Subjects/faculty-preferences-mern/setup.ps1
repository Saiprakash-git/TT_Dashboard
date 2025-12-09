# Faculty Preferences MERN - Quick Setup Script
# Run this script in PowerShell from the faculty-preferences-mern directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Faculty Preferences MERN - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
$mongoRunning = $false
try {
    $result = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result) {
        $mongoRunning = $true
        Write-Host "✓ MongoDB is running on port 27017" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ MongoDB is not running" -ForegroundColor Red
}

if (-not $mongoRunning) {
    Write-Host ""
    Write-Host "MongoDB is not running. Please start MongoDB first:" -ForegroundColor Red
    Write-Host "  - Windows: Start MongoDB service from Services" -ForegroundColor Yellow
    Write-Host "  - Or install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""

# Setup Server
Write-Host "Setting up Backend Server..." -ForegroundColor Yellow
Set-Location server

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install server dependencies" -ForegroundColor Red
        Set-Location ..
        Read-Host "Press Enter to exit"
        exit
    }
    Write-Host "✓ Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Server dependencies already installed" -ForegroundColor Green
}

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Set-Location ..

Write-Host ""

# Setup Client
Write-Host "Setting up Frontend Client..." -ForegroundColor Yellow
Set-Location client

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install client dependencies" -ForegroundColor Red
        Set-Location ..
        Read-Host "Press Enter to exit"
        exit
    }
    Write-Host "✓ Client dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Client dependencies already installed" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start the Backend (in this terminal):" -ForegroundColor Cyan
Write-Host "   cd server" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the Frontend (in a new terminal):" -ForegroundColor Cyan
Write-Host "   cd client" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Open browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Admin Account:" -ForegroundColor Yellow
Write-Host "   Email: admin@gmail.com" -ForegroundColor White
Write-Host "   Password: (set during registration)" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
