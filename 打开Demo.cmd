@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -Command "try { $r=Invoke-RestMethod -Uri 'http://127.0.0.1:3100/api/status' -TimeoutSec 2; if ($null -ne $r.enabled) { exit 0 }; exit 1 } catch { exit 1 }"
if not errorlevel 1 (
  start "" "http://127.0.0.1:3100"
  exit /b 0
)
start "" "http://127.0.0.1:3100"
call npm.cmd start
pause
