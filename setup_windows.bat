@echo off
setlocal
cd /d "%~dp0"
echo =========================================
echo   AGROPULSE QORAKOL - FULLSTACK SETUP
echo =========================================
where py >nul 2>nul
if errorlevel 1 (
 where python >nul 2>nul
 if errorlevel 1 (echo XATO: Python kerak. & exit /b 1)
 set "PY=python"
) else (set "PY=py -3")
if not exist "backend\.venv\Scripts\python.exe" (
 echo [1/5] Python virtual environment...
 %PY% -m venv backend\.venv
 if errorlevel 1 exit /b 1
)
echo [2/5] Python packages...
 if not exist "temp" mkdir "temp"
 if not exist "npm-cache" mkdir "npm-cache"
set "TEMP=%~dp0temp"
set "TMP=%~dp0temp"
set "npm_config_cache=%~dp0npm-cache"
if not exist "pip-cache" mkdir "pip-cache"
set "PIP_CACHE_DIR=%~dp0pip-cache"
call backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt --disable-pip-version-check
if errorlevel 1 exit /b 1
if not exist "backend\.env" copy /y "backend\.env.example" "backend\.env" >nul
echo [3/5] Database migration...
cd backend
call .venv\Scripts\python.exe manage.py migrate --noinput
if errorlevel 1 exit /b 1
call .venv\Scripts\python.exe manage.py init_qorakol
if errorlevel 1 exit /b 1
cd ..
echo [4/5] Frontend packages...
where npm >nul 2>nul
if errorlevel 1 (echo XATO: Node.js / npm kerak. & exit /b 1)
cd frontend
call npm install --no-audit --no-fund --no-progress
if errorlevel 1 exit /b 1
cd ..
echo [5/5] Setup complete.
echo Endi: backend ichida createsuperuser va set_role buyruqlari.
echo BOSHLASH_WINDOWS.bat bilan ishga tushiring.
endlocal
