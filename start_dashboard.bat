@echo off
title CivicResolve AI - Municipal Admin Dashboard
cd /d "%~dp0"
echo =======================================================
echo   CIVICRESOLVE AI - MUNICIPAL ADMIN DASHBOARD
echo =======================================================
echo Launching local dashboard server...
if exist "dashboard\run_dashboard.py" (
    py -3 dashboard\run_dashboard.py 2>nul || python dashboard\run_dashboard.py
) else (
    py -3 run_dashboard.py 2>nul || python run_dashboard.py
)
pause
