@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
color 0A

:: ====================================
:: Livescore Listener - Windows Installer
:: ====================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║   🏸 LIVESCORE LISTENER - WINDOWS INSTALLER 🏸           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: Check Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Running as Administrator
) else (
    echo [!] Warning: Not running as Administrator
    echo     Some features may not work properly.
    echo.
    pause
)

:: ====================================
:: CHECK NODE.JS
:: ====================================
echo.
echo ▶ Checking Node.js installation...
echo.

node --version >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo     Version: !NODE_VERSION!
) else (
    echo [✗] Node.js is NOT installed!
    echo.
    echo Please install Node.js first:
    echo 1. Download from: https://nodejs.org/
    echo 2. Install LTS version (recommended)
    echo 3. Restart this installer
    echo.
    echo Opening download page in 5 seconds...
    timeout /t 5 >nul
    start https://nodejs.org/en/download/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] npm is installed
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo     Version: !NPM_VERSION!
) else (
    echo [✗] npm is NOT installed!
    pause
    exit /b 1
)

:: ====================================
:: INSTALL DEPENDENCIES
:: ====================================
echo.
echo ▶ Installing dependencies...
echo.

if exist package.json (
    echo [✓] package.json found
    echo.
    echo Installing packages...
    call npm install
    
    if !errorLevel! == 0 (
        echo.
        echo [✓] Dependencies installed successfully!
    ) else (
        echo.
        echo [✗] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [!] package.json not found
    echo     Creating package.json...
    echo.
    
    (
        echo {
        echo   "name": "livescore-listener",
        echo   "version": "1.0.0",
        echo   "description": "Badminton livescore socket listener",
        echo   "main": "livescore-listener-wib.js",
        echo   "scripts": {
        echo     "start": "node livescore-listener-wib.js",
        echo     "dev": "node livescore-listener-wib.js"
        echo   },
        echo   "dependencies": {
        echo     "dotenv": "^16.0.3",
        echo     "sails.io.js": "^1.2.1",
        echo     "socket.io-client": "^4.5.4"
        echo   }
        echo }
    ) > package.json
    
    echo [✓] package.json created
    echo.
    echo Installing packages...
    call npm install
    
    if !errorLevel! == 0 (
        echo.
        echo [✓] Dependencies installed successfully!
    ) else (
        echo.
        echo [✗] Failed to install dependencies
        pause
        exit /b 1
    )
)

:: ====================================
:: SETUP .ENV FILE
:: ====================================
echo.
echo ▶ Setting up configuration...
echo.

if exist .env (
    echo [!] .env file already exists
    echo     Keeping existing configuration
) else (
    echo [+] Creating .env file...
    (
        echo # Livescore Listener Configuration
        echo.
        echo # Livescore host URL
        echo LIVESCORE_HOST=http://localhost:1337
        echo.
        echo # Daftar lapangan (comma separated^)
        echo DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8,9,10,11,12
        echo.
        echo # HTTP Server Port
        echo PORT=6969
    ) > .env
    
    echo [✓] .env file created
    echo.
    echo ⚠️  IMPORTANT: Edit .env file to configure:
    echo     - LIVESCORE_HOST: Your livescore server URL
    echo     - DAFTAR_LAPANGAN: Court numbers to monitor
    echo     - PORT: HTTP server port (default: 6969^)
)

:: ====================================
:: CREATE BATCH FILES
:: ====================================
echo.
echo ▶ Creating launcher scripts...
echo.

:: Start script
(
    echo @echo off
    echo chcp 65001 ^> nul
    echo title Livescore Listener - Running
    echo color 0A
    echo.
    echo Starting Livescore Listener...
    echo.
    echo Press Ctrl+C to stop
    echo.
    echo ════════════════════════════════════════════
    echo.
    echo node livescore-listener-wib.js
    echo.
    echo pause
) > start.bat

echo [✓] Created start.bat

:: Stop script
(
    echo @echo off
    echo chcp 65001 ^> nul
    echo title Livescore Listener - Stop
    echo color 0C
    echo.
    echo Stopping Livescore Listener...
    echo.
    echo taskkill /F /IM node.exe /FI "WINDOWTITLE eq Livescore Listener - Running"
    echo.
    echo [✓] Stopped!
    echo.
    echo pause
) > stop.bat

echo [✓] Created stop.bat

:: Status script
(
    echo @echo off
    echo chcp 65001 ^> nul
    echo title Livescore Listener - Status
    echo.
    echo Checking Livescore Listener status...
    echo.
    echo curl http://localhost:6969/status
    echo.
    echo pause
) > status.bat

echo [✓] Created status.bat

:: Test script
(
    echo @echo off
    echo chcp 65001 ^> nul
    echo title Livescore Listener - Test
    echo.
    echo Testing endpoint...
    echo.
    echo curl http://localhost:6969/vmix-flat?id=1
    echo.
    echo pause
) > test.bat

echo [✓] Created test.bat

:: ====================================
:: CREATE DESKTOP SHORTCUTS
:: ====================================
echo.
echo ▶ Creating desktop shortcuts...
echo.

:: Get current directory
set SCRIPT_DIR=%~dp0

:: Create VBS script for shortcuts
(
    echo Set WshShell = WScript.CreateObject^("WScript.Shell"^)
    echo DesktopPath = WshShell.SpecialFolders^("Desktop"^)
    echo.
    echo ' Start shortcut
    echo Set oLink = WshShell.CreateShortcut^(DesktopPath ^& "\Livescore Listener - Start.lnk"^)
    echo oLink.TargetPath = "%SCRIPT_DIR%start.bat"
    echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
    echo oLink.Description = "Start Livescore Listener"
    echo oLink.Save
    echo.
    echo ' Status shortcut
    echo Set oLink = WshShell.CreateShortcut^(DesktopPath ^& "\Livescore Listener - Status.lnk"^)
    echo oLink.TargetPath = "%SCRIPT_DIR%status.bat"
    echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
    echo oLink.Description = "Check Livescore Listener Status"
    echo oLink.Save
) > create_shortcuts.vbs

cscript //nologo create_shortcuts.vbs
del create_shortcuts.vbs

echo [✓] Desktop shortcuts created

:: ====================================
:: INSTALL PM2 (OPTIONAL)
:: ====================================
echo.
echo ▶ Optional: Install PM2 for process management?
echo.
echo PM2 allows:
echo   - Auto-restart on crash
echo   - Run as background service
echo   - Easy start/stop/restart
echo   - View logs
echo.
set /p INSTALL_PM2="Install PM2? (Y/N): "

if /i "!INSTALL_PM2!"=="Y" (
    echo.
    echo Installing PM2 globally...
    call npm install -g pm2
    call npm install -g pm2-windows-startup
    
    if !errorLevel! == 0 (
        echo [✓] PM2 installed successfully!
        echo.
        echo Setting up PM2 startup...
        call pm2-startup install
        
        :: Create PM2 ecosystem file
        (
            echo module.exports = {
            echo   apps: [{
            echo     name: 'livescore-listener',
            echo     script: 'livescore-listener-wib.js',
            echo     instances: 1,
            echo     autorestart: true,
            echo     watch: false,
            echo     max_memory_restart: '200M',
            echo     env: {
            echo       NODE_ENV: 'production'
            echo     }
            echo   }]
            echo };
        ) > ecosystem.config.js
        
        echo [✓] PM2 ecosystem configured
        echo.
        echo PM2 Commands:
        echo   pm2 start ecosystem.config.js    - Start service
        echo   pm2 stop livescore-listener      - Stop service
        echo   pm2 restart livescore-listener   - Restart service
        echo   pm2 logs livescore-listener      - View logs
        echo   pm2 monit                        - Monitor
    )
) else (
    echo [+] Skipping PM2 installation
)

:: ====================================
:: INSTALLATION COMPLETE
:: ====================================
echo.
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              ✓ INSTALLATION COMPLETE! ✓                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 📁 Files created:
echo    ✓ start.bat          - Start the application
echo    ✓ stop.bat           - Stop the application
echo    ✓ status.bat         - Check status
echo    ✓ test.bat           - Test endpoints
echo    ✓ .env               - Configuration file
echo.
echo 🖥️  Desktop shortcuts created:
echo    ✓ Livescore Listener - Start.lnk
echo    ✓ Livescore Listener - Status.lnk
echo.
echo 📝 Next steps:
echo    1. Edit .env file to configure your settings
echo    2. Double-click "start.bat" to run
echo    3. Open browser: http://localhost:6969
echo.
echo 🌐 Available endpoints:
echo    • http://localhost:6969/status
echo    • http://localhost:6969/vmix-flat?id=1
echo    • http://localhost:6969/vmix-xml?id=1
echo.
echo 📖 Documentation:
echo    • VMIX-SETUP.md - vMix integration guide
echo    • FORMAT-COMPARISON.md - Endpoint comparison
echo    • WIB-TIMESTAMP-UPDATE.md - Timestamp format
echo.
echo.
set /p START_NOW="Start Livescore Listener now? (Y/N): "

if /i "!START_NOW!"=="Y" (
    echo.
    echo Starting...
    start cmd /k start.bat
) else (
    echo.
    echo To start later, run: start.bat
)

echo.
echo Press any key to exit installer...
pause >nul
