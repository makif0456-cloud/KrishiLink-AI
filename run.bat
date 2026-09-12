@echo off
title KrishiLink AI Launcher
echo ========================================================
echo        🌾 Starting KrishiLink AI Platform 🌾
echo ========================================================
echo.
echo [1/2] Launching Backend Server (Port 3001)...
start "KrishiLink Backend (3001)" cmd /k "cd /d "%~dp0server" && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Client (Port 5173)...
start "KrishiLink Frontend (5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ========================================================
echo   Both services launched in separate windows!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo ========================================================
echo.
pause
