@echo off
cd /d "%~dp0"
if not exist backend\.venv\Scripts\python.exe (echo Avval setup_windows.bat & exit /b 1)
echo [1/3] Backend tests...
cd backend
call .venv\Scripts\python.exe manage.py check
if errorlevel 1 exit /b 1
call .venv\Scripts\python.exe manage.py makemigrations --check --dry-run
if errorlevel 1 exit /b 1
call .venv\Scripts\python.exe manage.py test agro --noinput
if errorlevel 1 exit /b 1
cd ..
echo [2/3] Frontend TypeScript...
cd frontend
call npm run lint
if errorlevel 1 exit /b 1
echo [3/3] Production build...
call npm run build
if errorlevel 1 exit /b 1
echo ALL TESTS OK
