@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (echo ERROR: Run setup_windows.bat first.& exit /b 1)
if not exist "backend\.env" (echo ERROR: backend\.env missing.& exit /b 1)
findstr /I /B /C:"DATABASE_URL=postgres" backend\.env >nul
if errorlevel 1 (echo ERROR: Set DATABASE_URL=postgresql://... in backend\.env before connecting a real PostgreSQL instance.& exit /b 1)
echo [1/4] PostgreSQL packages
call backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-postgres.txt
if errorlevel 1 exit /b 1
cd backend
echo [2/4] Database connectivity & migrations
call .venv\Scripts\python.exe manage.py check
if errorlevel 1 exit /b 1
call .venv\Scripts\python.exe manage.py showmigrations agro
if errorlevel 1 exit /b 1
echo [3/4] Non-mutating pilot preflight
call .venv\Scripts\python.exe manage.py pilot_preflight
if errorlevel 1 exit /b 1
echo [4/4] Completed. This script does NOT copy SQLite data or migrate the DB.
echo After backups and database review, run: .venv\Scripts\python.exe manage.py migrate
endlocal
