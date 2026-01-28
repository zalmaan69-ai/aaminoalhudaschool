@echo off
REM Open Al-Huda School System in Chrome
REM This script will launch the application directly in Google Chrome

echo Starting Al-Huda School System...

REM Get the current directory
set "APP_DIR=%~dp0"
set "INDEX_FILE=%APP_DIR%index.html"

REM Try common Chrome installation paths
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window --app="file:///%INDEX_FILE%"
    echo Application opened in Chrome
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --new-window --app="file:///%INDEX_FILE%"
    echo Application opened in Chrome
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --new-window --app="file:///%INDEX_FILE%"
    echo Application opened in Chrome
) else (
    echo Chrome not found in common locations.
    echo Opening in default browser instead...
    start "" "%INDEX_FILE%"
)

echo.
echo If the application doesn't open, please install Google Chrome or open index.html manually.
pause
