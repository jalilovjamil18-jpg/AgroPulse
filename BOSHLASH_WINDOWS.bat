@echo off
cd /d "%~dp0"
if not exist backend\.venv\Scripts\python.exe (echo AVVAL setup_windows.bat ni ishga tushiring & pause & exit /b 1)
if not exist frontend\node_modules\next\package.json (echo AVVAL setup_windows.bat ni ishga tushiring & pause & exit /b 1)
echo ====================================
echo   AGROPULSE QORAKOL - FULLSTACK
echo ====================================
echo Oldingi serverlar ishlayotgan bo'lsa, Ctrl+C bilan to'xtating.
start "AgroPulse Django API" "%~dp0run_backend_windows.bat"
start "AgroPulse Next Frontend" "%~dp0run_frontend_windows.bat"
echo Frontend: http://127.0.0.1:3000
echo Real kabinet: http://127.0.0.1:3000/kabinet
echo Admin: http://127.0.0.1:8000/admin/
echo API: http://127.0.0.1:8000/api/v1/health/
