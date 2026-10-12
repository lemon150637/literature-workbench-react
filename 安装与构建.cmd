@echo off
cd /d "%~dp0"
call npm.cmd ci
if errorlevel 1 goto end
call npm.cmd run build
:end
pause
