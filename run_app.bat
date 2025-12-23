@echo off
setlocal

echo ==========================================
echo      Chat-I Application Launcher
echo ==========================================
echo.

rem Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on this system.
    echo.
    echo Please download and install the latest LTS version of Node.js from:
    echo https://nodejs.org/
    echo.
    echo After installing, please restart this script.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed.
echo.

rem Check if node_modules exists to skip install if possible (or just always install to be safe)
if not exist "node_modules" (
    echo [INFO] First time setup: Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed.
) else (
    echo [INFO] Dependencies found. To reinstall, delete the 'node_modules' folder.
)

echo.
echo [INFO] Starting Application...
echo.
echo The application will start shortly. Please check your browser.
echo Press 'Ctrl+C' in this window to stop the server.
echo.

call npm run dev

pause
